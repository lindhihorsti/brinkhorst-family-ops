export function getWeeklyPlanHref(day) {
  if (day.kind !== "recipe" || !day.recipe_id) {
    return null;
  }
  if (typeof day.source_url === "string" && day.source_url.trim()) {
    return day.source_url.trim();
  }
  return `/recipes/${day.recipe_id}`;
}
