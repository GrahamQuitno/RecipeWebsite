import { notFound } from "next/navigation";
import { RecipeEditorForm } from "@/components/recipe-editor-form";
import { getExistingRecipeTags, getRecipeBySlug } from "@/lib/recipe-data";
import { requireOwner } from "@/lib/owner-auth";

interface EditRecipePageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { slug } = await params;
  await requireOwner(`/recipes/${slug}/edit`);

  const [recipe, tags] = await Promise.all([getRecipeBySlug(slug), getExistingRecipeTags()]);
  if (!recipe) notFound();

  return (
    <main className="page-frame owner-page">
      <p className="eyebrow">Owner editing</p>
      <h1>Edit {recipe.title}</h1>
      <p className="owner-page__intro">Update this recipe and save your changes.</p>
      <RecipeEditorForm existingTags={tags} recipe={recipe} />
    </main>
  );
}
