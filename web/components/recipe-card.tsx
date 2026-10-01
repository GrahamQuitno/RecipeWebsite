import Link from "next/link";
import type { Recipe } from "@/lib/recipes";
import { RecipeArtwork } from "@/components/recipe-artwork";
import { RecipeTags } from "@/components/recipe-tags";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  return (
    <li>
      <Link className="recipe-card" href={`/recipes/${recipe.slug}`}>
        <RecipeArtwork index={index} />
        <div className="recipe-card__content">
          <p className="recipe-card__eyebrow">
            Recipe <span>{String(index + 1).padStart(2, "0")}</span>
          </p>
          <h2 className="recipe-card__title">{recipe.title}</h2>
          <RecipeTags tags={recipe.tags} />
          <span className="recipe-card__action">
            Read the recipe <span aria-hidden="true">↗</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
