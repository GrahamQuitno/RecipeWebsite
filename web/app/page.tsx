import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeSearchForm } from "@/components/recipe-search-form";
import { RestoreCollectionScroll } from "@/components/restore-collection-scroll";
import { getRecipeCollection } from "@/lib/recipe-data";
import { getCurrentOwnerSession } from "@/lib/owner-auth";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import {
  filterRecipes,
  getRecipeTags,
  hasRecipeSearch,
  readRecipeSearch,
  serializeRecipeSearch,
  type RecipeSearchParams,
} from "@/lib/recipe-search";

interface HomeProps {
  searchParams: Promise<RecipeSearchParams>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filters = readRecipeSearch(params);
  const [collection, ownerSession] = await Promise.all([
    getRecipeCollection(),
    getCurrentOwnerSession(),
  ]);
  const matchingRecipes = filterRecipes(collection, filters);
  const searchQuery = serializeRecipeSearch(filters);
  const hasSearch = hasRecipeSearch(filters);
  const ownerCanEdit = Boolean(ownerSession && isSupabaseConfigured());

  return (
    <div className="page-frame collection-page">
      <RestoreCollectionScroll shouldRestore={params.restoreScroll === "1"} />
      <section aria-labelledby="collection-title" className="collection-intro">
        <div className="collection-intro__copy">
          <p className="eyebrow">The recipe collection</p>
          <h1 id="collection-title">
            Good things
            <br />
            <span>from the kitchen.</span>
          </h1>
          <p className="collection-intro__description">
            Everyday favorites and the recipes worth making again.
          </p>
        </div>
        <div className="collection-count">
          <span className="collection-count__number">
            {String(collection.length).padStart(2, "0")}
          </span>
          <span className="collection-count__label">recipes<br />to return to</span>
        </div>
      </section>

      <section aria-labelledby="recipe-list-title" className="collection-list-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A little inspiration</p>
            <h2 id="recipe-list-title">From the notebook</h2>
          </div>
          <div className="section-heading__actions">
            <p className="section-heading__note">Browse the collection</p>
            {ownerCanEdit ? (
              <Link className="owner-create-link" href="/owner/recipes/new">
                Create a recipe <span aria-hidden="true">+</span>
              </Link>
            ) : null}
          </div>
        </div>

        <RecipeSearchForm
          filters={filters}
          hasSearch={hasSearch}
          key={JSON.stringify(filters)}
          tags={getRecipeTags(collection)}
        />

        <div className="search-results-heading" id="search-results">
          <p aria-live="polite" className="search-results-count">
            {matchingRecipes.length} {matchingRecipes.length === 1 ? "recipe" : "recipes"}
            {hasSearch ? " found" : " in the collection"}
          </p>
        </div>

        {matchingRecipes.length ? (
          <ul className="recipe-list">
            {matchingRecipes.map((recipe, index) => (
              <RecipeCard
                index={index}
                key={recipe.id}
                recipe={recipe}
                searchQuery={searchQuery}
              />
            ))}
          </ul>
        ) : (
          <p className="search-empty-state" role="status">
            {hasSearch
              ? "No recipes match those filters. Try removing a tag or ingredient and search again."
              : ownerCanEdit
                ? "Your recipe collection is empty. Add a recipe to get started."
                : "No recipes are available yet."}
          </p>
        )}
      </section>
    </div>
  );
}
