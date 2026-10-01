import { RecipeCard } from "@/components/recipe-card";
import { recipes } from "@/lib/recipes";

export default function Home() {
  return (
    <div className="page-frame collection-page">
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
            {String(recipes.length).padStart(2, "0")}
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
          <p className="section-heading__note">Browse the collection</p>
        </div>

        <ul className="recipe-list">
          {recipes.map((recipe, index) => (
            <RecipeCard index={index} key={recipe.id} recipe={recipe} />
          ))}
        </ul>
      </section>
    </div>
  );
}
