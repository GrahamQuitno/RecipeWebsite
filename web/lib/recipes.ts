export interface RecipeIngredient {
  amount: number;
  unit: string;
  name: string;
}

export interface RecipePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  storagePath?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  photo?: RecipePhoto;
}

export const recipes: Recipe[] = [
  {
    id: "lemon-ricotta-pancakes",
    slug: "lemon-ricotta-pancakes",
    title: "Lemon Ricotta Pancakes",
    tags: ["Breakfast", "Brunch", "Citrus"],
    ingredients: [
      { amount: 1, unit: "cup", name: "all-purpose flour" },
      { amount: 2, unit: "tsp", name: "baking powder" },
      { amount: 0.25, unit: "tsp", name: "fine salt" },
      { amount: 1, unit: "tbsp", name: "sugar" },
      { amount: 0.75, unit: "cup", name: "whole-milk ricotta" },
      { amount: 0.75, unit: "cup", name: "milk" },
      { amount: 1, unit: "large", name: "egg" },
      { amount: 1, unit: "tbsp", name: "melted butter" },
      { amount: 1, unit: "whole", name: "lemon, zested" },
    ],
    instructions: [
      "Whisk the flour, baking powder, salt, and sugar together in a large bowl.",
      "In another bowl, whisk the ricotta, milk, egg, melted butter, and lemon zest until smooth.",
      "Fold the wet ingredients into the dry ingredients just until no dry streaks remain. A few small lumps are fine.",
      "Warm a lightly buttered skillet over medium heat. Add a small ladle of batter for each pancake and cook until bubbles form at the edges.",
      "Flip and cook until golden on the second side. Serve warm with butter and maple syrup.",
    ],
  },
  {
    id: "sunday-tomato-pasta",
    slug: "sunday-tomato-pasta",
    title: "Sunday Tomato Pasta",
    tags: ["Dinner", "Vegetarian", "Comfort food"],
    ingredients: [
      { amount: 12, unit: "oz", name: "rigatoni or other short pasta" },
      { amount: 2, unit: "tbsp", name: "olive oil" },
      { amount: 1, unit: "small", name: "yellow onion, finely chopped" },
      { amount: 3, unit: "cloves", name: "garlic, thinly sliced" },
      { amount: 1, unit: "14-oz can", name: "crushed tomatoes" },
      { amount: 1, unit: "tsp", name: "kosher salt" },
      { amount: 0.5, unit: "tsp", name: "chili flakes" },
      { amount: 0.5, unit: "cup", name: "finely grated parmesan" },
    ],
    instructions: [
      "Bring a large pot of salted water to a boil. Cook the pasta until just shy of al dente, then reserve a mug of pasta water before draining.",
      "While the pasta cooks, warm the olive oil in a wide pan over medium-low heat. Add the onion and cook until soft, about 6 minutes.",
      "Stir in the garlic and chili flakes. Cook for 30 seconds, then add the tomatoes and salt. Simmer gently for 15 minutes.",
      "Add the drained pasta to the sauce with a splash of pasta water. Toss until glossy and cooked through, adding more water as needed.",
      "Take the pan off the heat and stir in the parmesan. Serve with a little more cheese on top.",
    ],
  },
  {
    id: "ginger-sesame-noodles",
    slug: "ginger-sesame-noodles",
    title: "Ginger Sesame Noodles",
    tags: ["Lunch", "Quick meals", "Vegetarian"],
    ingredients: [
      { amount: 8, unit: "oz", name: "wheat noodles" },
      { amount: 2, unit: "tbsp", name: "soy sauce" },
      { amount: 1, unit: "tbsp", name: "toasted sesame oil" },
      { amount: 1, unit: "tbsp", name: "honey" },
      { amount: 1, unit: "tbsp", name: "rice vinegar" },
      { amount: 1, unit: "tbsp", name: "finely grated fresh ginger" },
      { amount: 2, unit: "whole", name: "scallions, thinly sliced" },
      { amount: 1, unit: "tbsp", name: "toasted sesame seeds" },
    ],
    instructions: [
      "Cook the noodles according to the package directions. Drain and rinse briefly under cool water.",
      "Whisk the soy sauce, sesame oil, honey, rice vinegar, and ginger in a large bowl.",
      "Add the noodles and toss until evenly coated. Loosen the sauce with a spoonful of warm water if needed.",
      "Scatter the scallions and sesame seeds over the top and serve warm or at room temperature.",
    ],
  },
  {
    id: "crisp-chickpea-bowls",
    slug: "crisp-chickpea-bowls",
    title: "Crisp Chickpea Bowls",
    tags: ["Lunch", "Vegetarian", "Weeknight"],
    ingredients: [
      { amount: 2, unit: "15-oz cans", name: "chickpeas, drained and rinsed" },
      { amount: 1, unit: "tbsp", name: "olive oil" },
      { amount: 1, unit: "tsp", name: "smoked paprika" },
      { amount: 0.5, unit: "tsp", name: "ground cumin" },
      { amount: 1, unit: "whole", name: "cucumber, chopped" },
      { amount: 1, unit: "cup", name: "cherry tomatoes, halved" },
      { amount: 0.5, unit: "cup", name: "plain Greek yogurt" },
      { amount: 1, unit: "whole", name: "lemon" },
    ],
    instructions: [
      "Heat the oven to 425°F. Pat the chickpeas dry, then toss them with olive oil, smoked paprika, and cumin.",
      "Spread the chickpeas on a baking sheet and roast for 25 to 30 minutes, shaking the pan once, until crisp at the edges.",
      "Stir a squeeze of lemon juice into the yogurt and season with a pinch of salt.",
      "Divide the cucumber and tomatoes between bowls. Add the warm chickpeas and finish with lemon yogurt.",
    ],
  },
  {
    id: "orange-olive-oil-cake",
    slug: "orange-olive-oil-cake",
    title: "Orange Olive Oil Cake",
    tags: ["Dessert", "Baking", "Citrus"],
    ingredients: [
      { amount: 1.5, unit: "cups", name: "all-purpose flour" },
      { amount: 1, unit: "cup", name: "sugar" },
      { amount: 2, unit: "tsp", name: "baking powder" },
      { amount: 0.5, unit: "tsp", name: "fine salt" },
      { amount: 3, unit: "large", name: "eggs" },
      { amount: 0.75, unit: "cup", name: "extra-virgin olive oil" },
      { amount: 0.5, unit: "cup", name: "plain yogurt" },
      { amount: 2, unit: "whole", name: "oranges, zested and juiced" },
    ],
    instructions: [
      "Heat the oven to 350°F. Oil a 9-inch round cake pan and line the bottom with parchment.",
      "Whisk the flour, sugar, baking powder, and salt in a medium bowl.",
      "In a second bowl, whisk the eggs, olive oil, yogurt, orange zest, and ⅓ cup of orange juice.",
      "Fold the dry ingredients into the wet ingredients until just combined. Pour the batter into the prepared pan.",
      "Bake for 35 to 40 minutes, until the top is golden and a tester comes out clean. Cool before slicing.",
    ],
  },
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.slug === slug);
}
