"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RecipeSearchFilters } from "@/lib/recipe-search";

type StringListSetter = Dispatch<SetStateAction<string[]>>;

interface RecipeSearchFormProps {
  filters: RecipeSearchFilters;
  tags: string[];
  hasSearch: boolean;
}

interface IngredientFilterGroupProps {
  name: "include" | "exclude";
  title: string;
  help: string;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function IngredientFilterGroup({
  name,
  title,
  help,
  values,
  onChange,
  onAdd,
  onRemove,
}: IngredientFilterGroupProps) {
  return (
    <fieldset className="search-group">
      <legend>{title}</legend>
      <p className="search-group__help" id={`${name}-help`}>
        {help}
      </p>
      <div className="search-ingredient-rows">
        {values.map((value, index) => {
          const inputId = `${name}-ingredient-${index}`;

          return (
            <div className="search-ingredient-row" key={inputId}>
              <label className="visually-hidden" htmlFor={inputId}>
                {name === "include" ? "Included" : "Excluded"} ingredient {index + 1}
              </label>
              <input
                aria-describedby={`${name}-help`}
                autoComplete="off"
                id={inputId}
                name={name}
                onChange={(event) => onChange(index, event.target.value)}
                placeholder="e.g. olive oil"
                type="search"
                value={value}
              />
              {values.length > 1 ? (
                <button
                  aria-label={`Remove ${name === "include" ? "included" : "excluded"} ingredient ${index + 1}`}
                  className="search-remove-button"
                  onClick={() => onRemove(index)}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button className="search-add-button" onClick={onAdd} type="button">
        <span aria-hidden="true">+</span> Add another ingredient
      </button>
    </fieldset>
  );
}

export function RecipeSearchForm({ filters, tags, hasSearch }: RecipeSearchFormProps) {
  const [title, setTitle] = useState(filters.title);
  const [selectedTags, setSelectedTags] = useState(filters.tags);
  const [includeIngredients, setIncludeIngredients] = useState(
    filters.includeIngredients.length ? filters.includeIngredients : [""],
  );
  const [excludeIngredients, setExcludeIngredients] = useState(
    filters.excludeIngredients.length ? filters.excludeIngredients : [""],
  );

  function updateIngredient(
    setValues: StringListSetter,
    index: number,
    value: string,
  ) {
    setValues((current) => current.map((ingredient, itemIndex) =>
      itemIndex === index ? value : ingredient,
    ));
  }

  function addIngredient(setValues: StringListSetter) {
    setValues((current) => [...current, ""]);
  }

  function removeIngredient(
    setValues: StringListSetter,
    index: number,
  ) {
    setValues((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
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
    <div className="search-panel">
      <form action="/" className="recipe-search-form" method="get">
        <div className="search-top-row">
          <div className="search-control">
            <label htmlFor="recipe-title-query">Recipe title</label>
            <input
              aria-describedby="title-search-hint"
              autoComplete="off"
              id="recipe-title-query"
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. lemon pancakes"
              type="search"
              value={title}
            />
            <p className="search-control__hint" id="title-search-hint">
              Every word must appear in the recipe title.
            </p>
          </div>

          <fieldset className="search-control search-tags-control">
            <legend>Tags</legend>
            <details className="tag-picker">
              <summary aria-describedby="tag-search-hint">{tagSummary}</summary>
              <div className="tag-picker__options">
                {tags.map((tag, index) => {
                  const id = `recipe-tag-${index}`;

                  return (
                    <label className="tag-picker__option" htmlFor={id} key={tag}>
                      <input
                        checked={selectedTags.includes(tag)}
                        id={id}
                        name="tag"
                        onChange={(event) => updateTag(tag, event.target.checked)}
                        type="checkbox"
                        value={tag}
                      />
                      <span>{tag}</span>
                    </label>
                  );
                })}
              </div>
            </details>
            <p className="search-control__hint" id="tag-search-hint">
              Recipes must have every selected tag.
            </p>
          </fieldset>
        </div>

        <div className="search-ingredient-groups">
          <IngredientFilterGroup
            help="Every ingredient entered here must be listed on the recipe."
            name="include"
            onAdd={() => addIngredient(setIncludeIngredients)}
            onChange={(index, value) => updateIngredient(setIncludeIngredients, index, value)}
            onRemove={(index) => removeIngredient(setIncludeIngredients, index)}
            title="Include all"
            values={includeIngredients}
          />
          <IngredientFilterGroup
            help="A recipe is removed if it lists any ingredient entered here."
            name="exclude"
            onAdd={() => addIngredient(setExcludeIngredients)}
            onChange={(index, value) => updateIngredient(setExcludeIngredients, index, value)}
            onRemove={(index) => removeIngredient(setExcludeIngredients, index)}
            title="Exclude any"
            values={excludeIngredients}
          />
        </div>

        <p className="search-safety-note">
          Ingredient matching checks names saved on each recipe. It does not check synonyms,
          sub-ingredients, or cross-contact, so it is not an allergy-safety guarantee.
        </p>

        <div className="search-actions">
          <button className="search-submit" type="submit">
            Search recipes
          </button>
          {hasSearch ? (
            <Link className="search-clear" href="/">
              Clear filters
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}
