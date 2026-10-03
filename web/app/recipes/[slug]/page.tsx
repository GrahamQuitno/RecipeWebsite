import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RecipeIngredientList } from "@/components/recipe-ingredient-list";
import { DeleteRecipeForm } from "@/components/delete-recipe-form";
import { RecipeTags } from "@/components/recipe-tags";
import { getRecipeBySlug } from "@/lib/recipe-data";
import { getCurrentOwnerSession } from "@/lib/owner-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { readRecipeSearch, serializeRecipeSearch, type RecipeSearchParams } from "@/lib/recipe-search";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RecipeSearchParams>;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  return {
    title: recipe?.title ?? "Recipe not found",
  };
}

export default async function RecipePage({ params, searchParams }: RecipePageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const [recipe, ownerSession] = await Promise.all([
    getRecipeBySlug(slug),
    getCurrentOwnerSession(),
  ]);

  if (!recipe) {
    notFound();
  }

  const ownerCanEdit = Boolean(ownerSession && isSupabaseConfigured());

  const searchQuery = serializeRecipeSearch(readRecipeSearch(rawSearchParams));
  const returnQuery = [searchQuery, "restoreScroll=1"].filter(Boolean).join("&");
  const returnHref = `/?${returnQuery}`;

  return (
    <article className="page-frame recipe-detail">
      <Link className="back-link" href={returnHref}>
        <span aria-hidden="true">←</span> All recipes
      </Link>

      <header className="recipe-detail__header">
        <p className="eyebrow">From the recipe collection</p>
        <h1>{recipe.title}</h1>
        <RecipeTags tags={recipe.tags} />
        {ownerCanEdit ? (
          <div className="recipe-owner-controls">
            <Link className="owner-edit-link" href={`/recipes/${recipe.slug}/edit`}>
              Edit recipe
            </Link>
            <DeleteRecipeForm recipeId={recipe.id} recipeSlug={recipe.slug} title={recipe.title} />
          </div>
        ) : null}
      </header>

      <div className="recipe-detail__body">
        <RecipeIngredientList ingredients={recipe.ingredients} />

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
