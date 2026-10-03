const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

export function formatIngredientAmount(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 1000) / 1000;

  if (amount > 0 && rounded === 0) {
    return "<0.001";
  }

  return amountFormatter.format(rounded);
}
