import Image from "next/image";
import type { Recipe } from "@/lib/recipes";
import { RecipeArtwork } from "@/components/recipe-artwork";
import { RecipeTags } from "@/components/recipe-tags";
import { CollectionRecipeLink } from "@/components/collection-recipe-link";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  searchQuery?: string;
}

export function RecipeCard({ recipe, index, searchQuery = "" }: RecipeCardProps) {
  const detailHref = `/recipes/${recipe.slug}${searchQuery ? `?${searchQuery}` : ""}`;

  return (
    <li>
      <CollectionRecipeLink className="recipe-card" href={detailHref}>
        {recipe.photo ? (
          <Image
            alt={recipe.photo.alt}
            className="recipe-card__photo"
            height={recipe.photo.height}
            sizes="(max-width: 720px) 100vw, 45vw"
            src={recipe.photo.src}
            width={recipe.photo.width}
          />
        ) : (
          <RecipeArtwork index={index} />
        )}
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
      </CollectionRecipeLink>
    </li>
  );
}
