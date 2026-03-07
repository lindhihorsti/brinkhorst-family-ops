export function estimateCurrencyLabel(currency) {
  return currency === "eur" ? "EUR" : "CHF";
}

export function formatEstimateTotal(item) {
  if (!item) return null;
  if (item.estimated_total_amount !== null && item.estimated_total_amount !== undefined) {
    return `${estimateCurrencyLabel(item.estimate_currency)} ${Number(item.estimated_total_amount).toFixed(2)}`;
  }
  return item.estimated_total_text ?? null;
}
