const artworkVariants = ["citrus", "tomato", "herb", "golden", "berry"] as const;

interface RecipeArtworkProps {
  index: number;
}

export function RecipeArtwork({ index }: RecipeArtworkProps) {
  const variant = artworkVariants[index % artworkVariants.length];

  return (
    <div aria-hidden="true" className="recipe-art" data-artwork={variant}>
      <span className="recipe-art__plate">
        <span className="recipe-art__dish">
          <span className="recipe-art__food recipe-art__food--one" />
          <span className="recipe-art__food recipe-art__food--two" />
          <span className="recipe-art__food recipe-art__food--three" />
          <span className="recipe-art__leaf recipe-art__leaf--one" />
          <span className="recipe-art__leaf recipe-art__leaf--two" />
        </span>
      </span>
      <span className="recipe-art__sun" />
      <span className="recipe-art__grain recipe-art__grain--one" />
      <span className="recipe-art__grain recipe-art__grain--two" />
    </div>
  );
}
