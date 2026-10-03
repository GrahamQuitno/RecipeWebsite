"use client";

import { useState } from "react";
import { formatIngredientAmount } from "@/lib/ingredient-amount";
import type { RecipeIngredient } from "@/lib/recipes";

interface RecipeIngredientListProps {
  ingredients: RecipeIngredient[];
}

export function RecipeIngredientList({ ingredients }: RecipeIngredientListProps) {
  const [multiplier, setMultiplier] = useState("1");
  const parsedMultiplier = Number(multiplier);
  const isValidMultiplier = multiplier.trim() !== "" && Number.isFinite(parsedMultiplier) && parsedMultiplier > 0;

  return (
    <section aria-labelledby="ingredients-title" className="detail-section">
      <div className="detail-section__heading">
        <p className="eyebrow">Gather</p>
        <h2 id="ingredients-title">Ingredients</h2>
      </div>

      <div className="ingredient-scaler">
        <label htmlFor="ingredient-multiplier">Scale ingredients</label>
        <div className="ingredient-scaler__input-wrap">
          <input
            aria-describedby={
              isValidMultiplier
                ? "ingredient-multiplier-help"
                : "ingredient-multiplier-help ingredient-multiplier-error"
            }
            aria-invalid={!isValidMultiplier}
            id="ingredient-multiplier"
            min="0"
            onChange={(event) => setMultiplier(event.target.value)}
            step="any"
            type="number"
            value={multiplier}
          />
          <span aria-hidden="true">×</span>
        </div>
        <p className="ingredient-scaler__hint" id="ingredient-multiplier-help">
          Enter any positive number. Ingredient amounts update; the saved recipe does not.
        </p>
        {!isValidMultiplier ? (
          <p className="ingredient-scaler__error" id="ingredient-multiplier-error" role="alert">
            Enter a number greater than zero to show scaled amounts.
          </p>
        ) : null}
      </div>

      {isValidMultiplier ? (
        <ul className="ingredient-list">
          {ingredients.map((ingredient, index) => (
            <li className="ingredient-list__item" key={`${ingredient.name}-${index}`}>
              <span className="ingredient-list__amount">
                {formatIngredientAmount(ingredient.amount * parsedMultiplier)}
                {ingredient.unit ? ` ${ingredient.unit}` : ""}
              </span>
              <span>{ingredient.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
