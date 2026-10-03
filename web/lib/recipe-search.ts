import type { Recipe } from "@/lib/recipes";

export interface RecipeSearchFilters {
  title: string;
  tags: string[];
  includeIngredients: string[];
  excludeIngredients: string[];
}

export type RecipeSearchParams = Record<string, string | string[] | undefined>;

export const emptyRecipeSearch: RecipeSearchFilters = {
  title: "",
  tags: [],
  includeIngredients: [],
  excludeIngredients: [],
};

function values(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];

  return (Array.isArray(value) ? value : [value])
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readRecipeSearch(params: RecipeSearchParams): RecipeSearchFilters {
  return {
    title: values(params.title)[0] ?? "",
    tags: values(params.tag),
    includeIngredients: values(params.include),
    excludeIngredients: values(params.exclude),
  };
}

export function serializeRecipeSearch(filters: RecipeSearchFilters): string {
  const params = new URLSearchParams();
  const title = filters.title.trim();

  if (title) params.set("title", title);
  filters.tags.map((tag) => tag.trim()).filter(Boolean).forEach((tag) => params.append("tag", tag));
  filters.includeIngredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .forEach((ingredient) => params.append("include", ingredient));
  filters.excludeIngredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .forEach((ingredient) => params.append("exclude", ingredient));

  return params.toString();
}

export function hasRecipeSearch(filters: RecipeSearchFilters): boolean {
  return Boolean(
    filters.title.trim() ||
      filters.tags.length ||
      filters.includeIngredients.some((ingredient) => ingredient.trim()) ||
      filters.excludeIngredients.some((ingredient) => ingredient.trim()),
  );
}

export function normalizeIngredientName(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[\s-]/g, "");
}

export function filterRecipes(recipes: Recipe[], filters: RecipeSearchFilters): Recipe[] {
  const titleWords = filters.title.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  const includedIngredients = filters.includeIngredients
    .map(normalizeIngredientName)
    .filter(Boolean);
  const excludedIngredients = filters.excludeIngredients
    .map(normalizeIngredientName)
    .filter(Boolean);

  return recipes.filter((recipe) => {
    const normalizedTitle = recipe.title.toLocaleLowerCase("en-US");
    const recipeIngredients = recipe.ingredients.map((ingredient) =>
      normalizeIngredientName(ingredient.name),
    );

    const titleMatches = titleWords.every((word) => normalizedTitle.includes(word));
    const tagsMatch = filters.tags.every((tag) => recipe.tags.includes(tag));
    const includedIngredientsMatch = includedIngredients.every((searchTerm) =>
      recipeIngredients.some((name) => name.includes(searchTerm)),
    );
    const excludedIngredientsMatch = excludedIngredients.every(
      (searchTerm) => !recipeIngredients.some((name) => name.includes(searchTerm)),
    );

    return titleMatches && tagsMatch && includedIngredientsMatch && excludedIngredientsMatch;
  });
}

export function getRecipeTags(recipes: Recipe[]): string[] {
  return [...new Set(recipes.flatMap((recipe) => recipe.tags))].sort((left, right) =>
    left.localeCompare(right),
  );
}
