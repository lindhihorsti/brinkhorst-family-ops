export function splitShoppingItems(items = []) {
  const manual = [];
  const recipe = [];
  const pantry = [];
  for (const item of items) {
    if (item.source === "recipe") {
      recipe.push(item);
    } else if (item.source === "pantry") {
      pantry.push(item);
    } else {
      manual.push(item);
    }
  }
  return { manual, recipe, pantry };
}

export function recipeGroups(items = []) {
  const groups = [];
  const map = new Map();
  for (const item of items) {
    const key = item.recipe_title || "";
    if (!map.has(key)) {
      const group = { title: key || null, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  }
  return groups;
}

export function categoryGroups(items = []) {
  const groups = [];
  const map = new Map();
  for (const item of items) {
    const key = item.category || "";
    if (!map.has(key)) {
      const group = { title: key || null, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(item);
  }
  return groups;
}

export function pantryGroups(items = [], consolidated = false) {
  if (!consolidated) {
    return recipeGroups(items);
  }

  const groups = [];
  const map = new Map();
  for (const item of items) {
    const key = `${item.pantry_name || item.content}__${item.pantry_uncertain ? "1" : "0"}`;
    if (!map.has(key)) {
      const group = {
        title: item.pantry_name || item.content || null,
        items: [],
        pantry_name: item.pantry_name || null,
        pantry_uncertain: Boolean(item.pantry_uncertain),
        count: 0,
      };
      map.set(key, group);
      groups.push(group);
    }
    const group = map.get(key);
    group.items.push(item);
    group.count += 1;
  }
  return groups;
}

export function shoppingTextOutput(items = [], importMode = "ai_consolidated") {
  const { manual, recipe, pantry } = splitShoppingItems(items);
  const lines = [];

  if (manual.length > 0) {
    lines.push("Manuell");
    for (const item of manual) {
      lines.push(`- ${item.content}`);
    }
  }

  if (recipe.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Aus Rezepten");
    const hasCategories = recipe.some((item) => item.category);
    const groups = hasCategories ? categoryGroups(recipe) : recipeGroups(recipe);
    for (const group of groups) {
      if (group.title) {
        lines.push(`${group.title}`);
      }
      for (const item of group.items) {
        lines.push(`- ${item.content}`);
      }
      lines.push("");
    }
    while (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.pop();
    }
  }

  if (pantry.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Im Basisvorrat erkannt");
    const groups = pantryGroups(pantry, importMode === "ai_consolidated");
    for (const group of groups) {
      if (group.title) {
        lines.push(`${group.title}`);
      }
      if (importMode === "ai_consolidated") {
        const label = group.count > 1 ? `${group.count} ${group.title}` : `${group.title}`;
        lines.push(`- ${label}${group.pantry_uncertain ? " (bitte prüfen)" : ""}`);
      } else {
        for (const item of group.items) {
          const suffix = item.pantry_name ? ` (als ${item.pantry_name}${item.pantry_uncertain ? ", bitte prüfen" : ""})` : "";
          lines.push(`- ${item.content}${suffix}`);
        }
      }
      lines.push("");
    }
    while (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.pop();
    }
  }

  return lines.join("\n");
}
