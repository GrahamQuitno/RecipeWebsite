import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RecipeTags } from "@/components/recipe-tags";
import { getRecipeBySlug, recipes } from "@/lib/recipes";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return recipes.map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  return {
    title: recipe?.title ?? "Recipe not found",
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);

  if (!recipe) {
    notFound();
  }

  return (
    <article className="page-frame recipe-detail">
      <Link className="back-link" href="/">
        <span aria-hidden="true">←</span> All recipes
      </Link>

      <header className="recipe-detail__header">
        <p className="eyebrow">From the recipe collection</p>
        <h1>{recipe.title}</h1>
        <RecipeTags tags={recipe.tags} />
      </header>

      <div className="recipe-detail__body">
        <section aria-labelledby="ingredients-title" className="detail-section">
          <div className="detail-section__heading">
            <p className="eyebrow">Gather</p>
            <h2 id="ingredients-title">Ingredients</h2>
          </div>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li className="ingredient-list__item" key={`${ingredient.name}-${index}`}>
                <span className="ingredient-list__amount">
                  {ingredient.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  {ingredient.unit ? ` ${ingredient.unit}` : ""}
                </span>
                <span>{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="instructions-title" className="detail-section">
          <div className="detail-section__heading">
            <p className="eyebrow">Take your time</p>
            <h2 id="instructions-title">Instructions</h2>
          </div>
          <ol className="instruction-list">
            {recipe.instructions.map((instruction, index) => (
              <li className="instruction-list__item" key={instruction}>
                <span aria-hidden="true" className="instruction-list__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.photo ? (
        <figure className="recipe-detail__photo">
          <Image
            alt={recipe.photo.alt}
            height={recipe.photo.height}
            sizes="(max-width: 760px) 100vw, 960px"
            src={recipe.photo.src}
            width={recipe.photo.width}
          />
        </figure>
      ) : null}
    </article>
  );
}
