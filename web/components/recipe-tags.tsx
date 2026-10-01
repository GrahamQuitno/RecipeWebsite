interface RecipeTagsProps {
  tags: string[];
}

export function RecipeTags({ tags }: RecipeTagsProps) {
  return (
    <ul aria-label="Recipe tags" className="tag-list">
      {tags.map((tag) => (
        <li className="tag" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
