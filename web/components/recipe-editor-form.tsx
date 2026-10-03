"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveRecipeAction } from "@/app/actions/recipes";
import type { Recipe } from "@/lib/recipes";

interface RecipeEditorFormProps {
  recipe?: Recipe;
  existingTags: string[];
}

interface IngredientDraft {
  amount: string;
  unit: string;
  name: string;
}

const initialActionState = { message: "" };

export function RecipeEditorForm({ recipe, existingTags }: RecipeEditorFormProps) {
  const [state, formAction, pending] = useActionState(saveRecipeAction, initialActionState);
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [selectedTags, setSelectedTags] = useState(recipe?.tags ?? []);
  const [newTags, setNewTags] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    recipe?.ingredients.map((ingredient) => ({
      amount: String(ingredient.amount),
      unit: ingredient.unit,
      name: ingredient.name,
    })) ?? [{ amount: "", unit: "", name: "" }],
  );
  const [instructions, setInstructions] = useState(recipe?.instructions ?? [""]);
  const [photoAlt, setPhotoAlt] = useState(recipe?.photo?.alt ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!photoFile || !photoInputRef.current || photoInputRef.current.files?.length) return;
    const restoredFiles = new DataTransfer();
    restoredFiles.items.add(photoFile);
    photoInputRef.current.files = restoredFiles.files;
  }, [photoFile, pending, state.message]);

  function updateIngredient(index: number, field: keyof IngredientDraft, value: string) {
    setIngredients((current) =>
      current.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, [field]: value } : ingredient,
      ),
    );
  }

  function removeIngredient(index: number) {
    setIngredients((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [{ amount: "", unit: "", name: "" }];
    });
  }

  function removeInstruction(index: number) {
    setInstructions((current) => {
      const next = current.filter((_, stepIndex) => stepIndex !== index);
      return next.length ? next : [""];
    });
  }

  function updateTag(tag: string, checked: boolean) {
    setSelectedTags((current) =>
      checked ? [...current, tag] : current.filter((selectedTag) => selectedTag !== tag),
    );
  }

  const tagSummary = selectedTags.length
    ? `${selectedTags.length} ${selectedTags.length === 1 ? "tag" : "tags"} selected`
    : "Choose recipe tags";

  return (
    <form action={formAction} className="recipe-editor-form" encType="multipart/form-data">
      {recipe ? <input name="id" type="hidden" value={recipe.id} /> : null}
      <input
        name="returnTo"
        type="hidden"
        value={recipe ? `/recipes/${recipe.slug}/edit` : "/owner/recipes/new"}
      />
      <input
        name="photoAction"
        type="hidden"
        value={photoFile ? "replace" : photoRemoved ? "remove" : "keep"}
      />

      {state.message ? (
        <p aria-live="polite" className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="editor-field">
        <label htmlFor="recipe-title">Title</label>
        <input
          autoComplete="off"
          id="recipe-title"
          maxLength={120}
          name="title"
          onChange={(event) => {
            setIsDirty(true);
            setTitle(event.target.value);
          }}
          required
          value={title}
        />
      </div>

      <fieldset className="editor-field editor-tags">
        <legend>Tags</legend>
        <details className="tag-picker">
          <summary>{tagSummary}</summary>
          <div className="tag-picker__options">
            {existingTags.map((tag, index) => {
              const id = `editor-tag-${index}`;

              return (
                <label className="tag-picker__option" htmlFor={id} key={tag}>
                  <input
                    checked={selectedTags.includes(tag)}
                    id={id}
                    name="tag"
                    onChange={(event) => {
                      setIsDirty(true);
                      updateTag(tag, event.target.checked);
                    }}
                    type="checkbox"
                    value={tag}
                  />
                  <span>{tag}</span>
                </label>
              );
            })}
            {!existingTags.length ? <p className="editor-tags__empty">No tags yet. Add one below.</p> : null}
          </div>
        </details>
        <label className="editor-field__sub-label" htmlFor="new-recipe-tags">
          Add new tags, separated by commas
        </label>
        <input
          autoComplete="off"
          id="new-recipe-tags"
          maxLength={300}
          name="newTags"
          onChange={(event) => {
            setIsDirty(true);
            setNewTags(event.target.value);
          }}
          placeholder="e.g. Weeknight, Vegetarian"
          value={newTags}
        />
      </fieldset>

      <fieldset className="editor-field editor-photo">
        <legend>Recipe photo</legend>
        <p className="editor-field__hint" id="recipe-photo-help">
          JPEG, PNG, or WebP. Maximum file size: 3 MiB. A photo is optional.
        </p>
        {photoPreviewUrl || (recipe?.photo && !photoRemoved) ? (
          <div className="editor-photo__preview">
            <Image
              alt={photoAlt || "Recipe photo preview"}
              height={900}
              src={photoPreviewUrl ?? recipe!.photo!.src}
              unoptimized={Boolean(photoPreviewUrl)}
              width={1200}
            />
            <button
              className="editor-remove-button"
              onClick={() => {
                setIsDirty(true);
                setPhotoFile(null);
                setPhotoPreviewUrl(null);
                setPhotoRemoved(true);
                if (photoInputRef.current) photoInputRef.current.value = "";
              }}
              type="button"
            >
              Remove photo
            </button>
          </div>
        ) : null}
        <label htmlFor="recipe-photo">{recipe?.photo && !photoRemoved ? "Replace photo" : "Upload a photo"}</label>
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="recipe-photo-help"
          id="recipe-photo"
          name="photo"
          onChange={(event) => {
            const nextPhoto = event.target.files?.[0];
            if (!nextPhoto) return;
            setPhotoFile(nextPhoto);
            setPhotoPreviewUrl(URL.createObjectURL(nextPhoto));
            setPhotoRemoved(false);
            setIsDirty(true);
          }}
          ref={photoInputRef}
          type="file"
        />
        <label htmlFor="recipe-photo-alt">Photo description for screen readers</label>
        <textarea
          id="recipe-photo-alt"
          maxLength={250}
          name="photoAlt"
          onChange={(event) => {
            setPhotoAlt(event.target.value);
            setIsDirty(true);
          }}
          required={Boolean(photoFile || (recipe?.photo && !photoRemoved))}
          rows={2}
          value={photoAlt}
        />
      </fieldset>

      <fieldset className="editor-field editor-repeat-group">
        <legend>Ingredients</legend>
        <p className="editor-field__hint">
          Enter decimals or fractions such as 0.5, 1/2, 1 1/2, or ½. Units are optional.
        </p>
        <div className="editor-ingredient-rows">
          {ingredients.map((ingredient, index) => (
            <div className="editor-ingredient-row" key={`ingredient-${index}`}>
              <div className="editor-ingredient-row__amount">
                <label htmlFor={`ingredient-amount-${index}`}>Amount</label>
                <input
                  id={`ingredient-amount-${index}`}
                  inputMode="decimal"
                  name="amount"
                  onChange={(event) => {
                    setIsDirty(true);
                    updateIngredient(index, "amount", event.target.value);
                  }}
                  placeholder="1/2"
                  required={index === 0}
                  value={ingredient.amount}
                />
              </div>
              <div className="editor-ingredient-row__unit">
                <label htmlFor={`ingredient-unit-${index}`}>Unit</label>
                <input
                  id={`ingredient-unit-${index}`}
                  name="unit"
                  onChange={(event) => {
                    setIsDirty(true);
                    updateIngredient(index, "unit", event.target.value);
                  }}
                  placeholder="cup"
                  value={ingredient.unit}
                />
              </div>
              <div className="editor-ingredient-row__name">
                <label htmlFor={`ingredient-name-${index}`}>Ingredient</label>
                <input
                  id={`ingredient-name-${index}`}
                  maxLength={160}
                  name="ingredient"
                  onChange={(event) => {
                    setIsDirty(true);
                    updateIngredient(index, "name", event.target.value);
                  }}
                  placeholder="all-purpose flour"
                  required={index === 0}
                  value={ingredient.name}
                />
              </div>
              {ingredients.length > 1 ? (
                <button
                  aria-label={`Remove ingredient ${index + 1}`}
                  className="editor-remove-button"
                  onClick={() => {
                    setIsDirty(true);
                    removeIngredient(index);
                  }}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button
          className="editor-add-button"
          onClick={() => {
            setIsDirty(true);
            setIngredients((current) => [...current, { amount: "", unit: "", name: "" }]);
          }}
          type="button"
        >
          <span aria-hidden="true">+</span> Add ingredient
        </button>
      </fieldset>

      <fieldset className="editor-field editor-repeat-group">
        <legend>Instructions</legend>
        <p className="editor-field__hint">Each field becomes one numbered step.</p>
        <div className="editor-instruction-rows">
          {instructions.map((instruction, index) => (
            <div className="editor-instruction-row" key={`instruction-${index}`}>
              <label htmlFor={`instruction-${index}`}>Step {index + 1}</label>
              <textarea
                id={`instruction-${index}`}
                maxLength={4000}
                name="instruction"
                onChange={(event) => {
                  setIsDirty(true);
                  setInstructions((current) =>
                    current.map((step, stepIndex) => (stepIndex === index ? event.target.value : step)),
                  );
                }}
                required={index === 0}
                rows={3}
                value={instruction}
              />
              {instructions.length > 1 ? (
                <button
                  aria-label={`Remove step ${index + 1}`}
                  className="editor-remove-button"
                  onClick={() => {
                    setIsDirty(true);
                    removeInstruction(index);
                  }}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button
          className="editor-add-button"
          onClick={() => {
            setIsDirty(true);
            setInstructions((current) => [...current, ""]);
          }}
          type="button"
        >
          <span aria-hidden="true">+</span> Add instruction step
        </button>
      </fieldset>

      <div className="editor-actions">
        <button className="search-submit" disabled={pending} type="submit">
          {pending ? "Saving…" : recipe ? "Save changes" : "Save recipe"}
        </button>
        <Link
          className="search-clear"
          href={recipe ? `/recipes/${recipe.slug}` : "/"}
          onClick={(event) => {
            if (isDirty && !window.confirm("Discard your unsaved recipe changes?")) {
              event.preventDefault();
            }
          }}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
