import "server-only";

import { getRecipeBySlug as getFixtureBySlug, recipes as fixtureRecipes } from "@/lib/recipes";
import type { Recipe, RecipeIngredient } from "@/lib/recipes";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  photo_path: string | null;
  photo_alt: string | null;
  recipe_ingredients: Array<RecipeIngredient & { position: number }> | null;
  recipe_instructions: Array<{ content: string; position: number }> | null;
  recipe_tags: Array<{ tags: { name: string } | null }> | null;
}

const recipeSelection = `
  id,
  slug,
  title,
  photo_path,
  photo_alt,
  recipe_ingredients(amount, unit, name, position),
  recipe_instructions(content, position),
  recipe_tags(tags(name))
`;

function toRecipe(row: RecipeRow): Recipe {
  const photo = row.photo_path && row.photo_alt
    ? getSupabaseAdmin().storage.from("recipe-photos").getPublicUrl(row.photo_path).data.publicUrl
    : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    ingredients: [...(row.recipe_ingredients ?? [])]
      .sort((left, right) => left.position - right.position)
      .map(({ amount, unit, name }) => ({ amount, unit, name })),
    instructions: [...(row.recipe_instructions ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((instruction) => instruction.content),
    tags: (row.recipe_tags ?? []).flatMap((recipeTag) =>
      recipeTag.tags ? [recipeTag.tags.name] : [],
    ),
    ...(photo && row.photo_path && row.photo_alt
      ? {
          photo: {
            src: photo,
            alt: row.photo_alt,
            width: 1200,
            height: 900,
            storagePath: row.photo_path,
          },
        }
      : {}),
  };
}

function asRecipeRow(data: unknown): RecipeRow {
  return data as RecipeRow;
}

export async function getRecipeCollection(): Promise<Recipe[]> {
  if (!isSupabaseConfigured()) return fixtureRecipes;

  const { data, error } = await getSupabaseAdmin()
    .from("recipes")
    .select(recipeSelection)
    .order("title", { ascending: true });

  if (error) {
    throw new Error("Recipes could not be loaded from Supabase.", { cause: error });
  }

  return ((data ?? []) as unknown as RecipeRow[]).map(toRecipe);
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  if (!isSupabaseConfigured()) return getFixtureBySlug(slug);

  const { data, error } = await getSupabaseAdmin()
    .from("recipes")
    .select(recipeSelection)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("The recipe could not be loaded from Supabase.", { cause: error });
  }

  return data ? toRecipe(asRecipeRow(data)) : undefined;
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  if (!isSupabaseConfigured()) {
    return fixtureRecipes.find((recipe) => recipe.id === id);
  }

  const { data, error } = await getSupabaseAdmin()
    .from("recipes")
    .select(recipeSelection)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("The recipe could not be loaded from Supabase.", { cause: error });
  }

  return data ? toRecipe(asRecipeRow(data)) : undefined;
}

export async function getExistingRecipeTags(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [...new Set(fixtureRecipes.flatMap((recipe) => recipe.tags))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  const { data, error } = await getSupabaseAdmin().from("tags").select("name").order("name");

  if (error) {
    throw new Error("Recipe tags could not be loaded from Supabase.", { cause: error });
  }

  return (data ?? []).map((tag) => tag.name);
}

export interface SaveRecipeInput {
  id?: string;
  title: string;
  slug: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  photoPath: string | null;
  photoAlt: string | null;
}

export async function saveRecipe(input: SaveRecipeInput): Promise<{ id: string; slug: string }> {
  const { data, error } = await getSupabaseAdmin().rpc("save_recipe", {
    p_recipe_id: input.id ?? null,
    p_title: input.title,
    p_slug: input.slug,
    p_tags: input.tags,
    p_ingredients: input.ingredients,
    p_instructions: input.instructions.map((content, position) => ({ content, position })),
    p_photo_path: input.photoPath,
    p_photo_alt: input.photoAlt,
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object" || !("id" in data) || !("slug" in data)) {
    throw new Error("Supabase returned an invalid save result.");
  }

  return data as { id: string; slug: string };
}

export async function deleteRecipe(id: string): Promise<{ slug: string; photoPath: string | null }> {
  const { data, error } = await getSupabaseAdmin()
    .from("recipes")
    .delete()
    .eq("id", id)
    .select("slug, photo_path")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Recipe not found.");

  return { slug: data.slug, photoPath: data.photo_path };
}
