"use client";

import { useActionState } from "react";
import { deleteRecipeAction } from "@/app/actions/recipes";

interface DeleteRecipeFormProps {
  recipeId: string;
  recipeSlug: string;
  title: string;
}

const initialActionState = { message: "" };

export function DeleteRecipeForm({ recipeId, recipeSlug, title }: DeleteRecipeFormProps) {
  const [state, formAction, pending] = useActionState(deleteRecipeAction, initialActionState);

  return (
    <form
      action={formAction}
      className="delete-recipe-form"
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={recipeId} />
      <input name="returnTo" type="hidden" value={`/recipes/${recipeSlug}`} />
      <button className="recipe-danger-button" disabled={pending} type="submit">
        {pending ? "Deleting…" : "Delete recipe"}
      </button>
      {state.message ? (
        <p aria-live="polite" className="form-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
