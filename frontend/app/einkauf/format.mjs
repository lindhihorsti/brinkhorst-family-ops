export function splitShoppingItems(items = []) {
  const manual = [];
  const recipe = [];
  for (const item of items) {
    if (item.source === "recipe") {
      recipe.push(item);
    } else {
      manual.push(item);
    }
  }
  return { manual, recipe };
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

export function shoppingTextOutput(items = []) {
  const { manual, recipe } = splitShoppingItems(items);
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
    for (const group of recipeGroups(recipe)) {
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

  return lines.join("\n");
}
