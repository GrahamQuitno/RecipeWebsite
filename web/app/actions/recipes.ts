"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteRecipe, getRecipeById, saveRecipe } from "@/lib/recipe-data";
import { requireOwner } from "@/lib/owner-auth";
import type { Recipe, RecipeIngredient } from "@/lib/recipes";
import { deleteRecipePhoto, RecipePhotoValidationError, uploadRecipePhoto } from "@/lib/recipe-photos";

export interface RecipeActionState {
  message: string;
}

function values(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

function safeEditorReturnTo(formData: FormData, fallback: string): string {
  const value = formData.get("returnTo");
  if (typeof value !== "string") return fallback;

  return /^\/owner\/recipes\/new$/.test(value) || /^\/recipes\/[a-z0-9-]+\/edit$/.test(value)
    ? value
    : fallback;
}

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  const fractions: Record<string, number> = {
    "¼": 1 / 4,
    "½": 1 / 2,
    "¾": 3 / 4,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅛": 1 / 8,
    "⅜": 3 / 8,
    "⅝": 5 / 8,
    "⅞": 7 / 8,
    "⅙": 1 / 6,
    "⅚": 5 / 6,
  };

  const unicodeFraction = normalized.match(/^(\d+)?\s*([¼½¾⅓⅔⅛⅜⅝⅞⅙⅚])$/);
  if (unicodeFraction) {
    return Number(unicodeFraction[1] ?? 0) + fractions[unicodeFraction[2]];
  }

  const mixedFraction = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const simpleFraction = normalized.match(/^(\d+)\/(\d+)$/);
  const fraction = mixedFraction ?? simpleFraction;

  if (fraction) {
    const whole = mixedFraction ? Number(fraction[1]) : 0;
    const numerator = Number(fraction[mixedFraction ? 2 : 1]);
    const denominator = Number(fraction[mixedFraction ? 3 : 2]);
    if (denominator === 0) return null;

    const result = whole + numerator / denominator;
    return Number.isFinite(result) && result > 0 ? result : null;
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const decimal = Number(normalized);
  return Number.isFinite(decimal) && decimal > 0 ? decimal : null;
}

function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/g, "");

  return slug || `recipe-${randomUUID()}`;
}

function deduplicateTags(tags: string[]): string[] {
  const unique = new Map<string, string>();

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed) unique.set(trimmed.toLocaleLowerCase("en-US"), trimmed);
  }

  return [...unique.values()];
}

function parseRecipeForm(formData: FormData):
  | { error: string }
  | {
      id?: string;
      title: string;
      slug: string;
      tags: string[];
      ingredients: RecipeIngredient[];
      instructions: string[];
    } {
  const title = (formData.get("title") ?? "").toString().trim();
  if (!title) return { error: "Enter a recipe title." };
  if (title.length > 120) return { error: "Keep the recipe title under 120 characters." };

  const idValue = (formData.get("id") ?? "").toString().trim();
  const id = idValue || undefined;
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "This recipe could not be identified. Reload the edit page and try again." };
  }

  const rawAmounts = values(formData, "amount");
  const rawUnits = values(formData, "unit");
  const rawNames = values(formData, "ingredient");
  const ingredients: RecipeIngredient[] = [];
  const ingredientCount = Math.max(rawAmounts.length, rawUnits.length, rawNames.length);
  if (ingredientCount > 100) return { error: "A recipe can have at most 100 ingredient rows." };

  for (let index = 0; index < ingredientCount; index += 1) {
    const amountText = rawAmounts[index] ?? "";
    const unit = rawUnits[index] ?? "";
    const name = rawNames[index] ?? "";
    if (!amountText && !unit && !name) continue;
    if (!name) return { error: `Enter a name for ingredient ${index + 1}.` };
    if (name.length > 160) return { error: `Keep ingredient ${index + 1} under 160 characters.` };
    if (unit.length > 80) return { error: `Keep ingredient ${index + 1}'s unit under 80 characters.` };

    const amount = parseAmount(amountText);
    if (amount === null) {
      return { error: `Enter a positive decimal or fraction for ingredient ${index + 1}.` };
    }

    ingredients.push({ amount, unit, name });
  }

  if (!ingredients.length) return { error: "Add at least one ingredient." };

  const instructions = values(formData, "instruction").filter(Boolean);
  if (instructions.length > 100) return { error: "A recipe can have at most 100 instruction steps." };
  if (!instructions.length) return { error: "Add at least one instruction step." };
  if (instructions.some((instruction) => instruction.length > 4000)) {
    return { error: "Keep each instruction step under 4,000 characters." };
  }

  const tags = deduplicateTags([
    ...values(formData, "tag"),
    ...(formData.get("newTags") ?? "").toString().split(","),
  ]);
  if (tags.length > 30) return { error: "A recipe can have at most 30 tags." };
  if (tags.some((tag) => tag.length > 40)) return { error: "Keep each tag under 40 characters." };

  return { id, title, slug: slugify(title), tags, ingredients, instructions };
}

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "A recipe with a similar title already exists. Give this recipe a more distinct title.";
  }

  return "The recipe could not be saved. Check the database setup and try again.";
}

export async function saveRecipeAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  await requireOwner(safeEditorReturnTo(formData, "/owner/recipes/new"));

  const recipe = parseRecipeForm(formData);
  if ("error" in recipe) return { message: recipe.error };

  const photoAction = formData.get("photoAction");
  const photoValue = formData.get("photo");
  const photoFile = photoValue instanceof File && photoValue.size > 0 ? photoValue : null;
  if (photoAction !== "keep" && photoAction !== "replace" && photoAction !== "remove") {
    return { message: "Choose whether to keep, replace, or remove the recipe photo." };
  }
  if (photoAction === "replace" && !photoFile) {
    return { message: "Choose a photo to upload, or keep the existing photo." };
  }
  if (photoAction !== "replace" && photoFile) {
    return { message: "Select Replace photo before uploading a new image." };
  }

  const photoAlt = (formData.get("photoAlt") ?? "").toString().trim();
  if (photoAlt.length > 250) return { message: "Keep the photo description under 250 characters." };
  if (photoAction === "replace" && !photoAlt) {
    return { message: "Describe the photo for people using a screen reader." };
  }

  let existingRecipe: Recipe | undefined;
  if (recipe.id) {
    try {
      existingRecipe = await getRecipeById(recipe.id);
    } catch {
      return { message: "The recipe could not be loaded. Refresh the page and try again." };
    }
    if (!existingRecipe) {
      return { message: "This recipe could not be found. Reload the edit page and try again." };
    }
  }

  const previousPhotoPath = existingRecipe?.photo?.storagePath ?? null;
  let photoPath = photoAction === "keep" ? previousPhotoPath : null;
  let uploadedPhotoPath: string | null = null;
  if (photoPath && !photoAlt) {
    return { message: "Describe the photo for people using a screen reader." };
  }

  if (photoAction === "replace" && photoFile) {
    try {
      uploadedPhotoPath = await uploadRecipePhoto(photoFile);
      photoPath = uploadedPhotoPath;
    } catch (error) {
      if (error instanceof RecipePhotoValidationError) return { message: error.message };
      return { message: "The photo could not be uploaded. Check the Supabase Storage setup and try again." };
    }
  }

  let savedRecipe: { id: string; slug: string };
  try {
    savedRecipe = await saveRecipe({
      ...recipe,
      photoPath,
      photoAlt: photoPath ? photoAlt : null,
    });
  } catch (error) {
    if (uploadedPhotoPath) {
      try {
        await deleteRecipePhoto(uploadedPhotoPath);
      } catch {
        // Keep the original save error visible; an unreferenced upload can be removed later.
      }
    }
    return { message: errorMessage(error) };
  }

  if (previousPhotoPath && previousPhotoPath !== photoPath) {
    try {
      await deleteRecipePhoto(previousPhotoPath);
    } catch {
      // The recipe update has succeeded. A failed cleanup leaves only an unused storage object.
    }
  }

  revalidatePath("/", "page");
  revalidatePath("/recipes/[slug]", "page");
  redirect(`/recipes/${savedRecipe.slug}`);
}

export async function deleteRecipeAction(
  _previousState: RecipeActionState,
  formData: FormData,
): Promise<RecipeActionState> {
  const returnToValue = formData.get("returnTo");
  const returnTo =
    typeof returnToValue === "string" && /^\/recipes\/[a-z0-9-]+$/.test(returnToValue)
      ? returnToValue
      : "/";
  await requireOwner(returnTo);

  const id = (formData.get("id") ?? "").toString().trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { message: "This recipe could not be identified. Reload the page and try again." };
  }

  try {
    const deletedRecipe = await deleteRecipe(id);
    if (deletedRecipe.photoPath) {
      try {
        await deleteRecipePhoto(deletedRecipe.photoPath);
      } catch {
        // The recipe is already deleted; failed cleanup leaves an unused storage object.
      }
    }
  } catch {
    return { message: "The recipe could not be deleted. Refresh the page and try again." };
  }

  revalidatePath("/", "page");
  revalidatePath("/recipes/[slug]", "page");
  redirect("/");
}
