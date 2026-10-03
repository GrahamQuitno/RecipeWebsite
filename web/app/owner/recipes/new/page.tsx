import { RecipeEditorForm } from "@/components/recipe-editor-form";
import { getExistingRecipeTags } from "@/lib/recipe-data";
import { requireOwner } from "@/lib/owner-auth";

export default async function NewRecipePage() {
  await requireOwner("/owner/recipes/new");
  const tags = await getExistingRecipeTags();

  return (
    <main className="page-frame owner-page">
      <p className="eyebrow">Owner editing</p>
      <h1>Create a recipe</h1>
      <p className="owner-page__intro">Add the recipe title, ingredients, tags, and steps.</p>
      <RecipeEditorForm existingTags={tags} />
    </main>
  );
}
