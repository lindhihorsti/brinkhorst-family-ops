export type Recipe = {
  id: string;
  title: string;
  source_url?: string | null;
  notes?: string | null;
  tags: string[];
  ingredients: string[];
  time_minutes?: number | null;
  difficulty?: number | null;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
};

export type RecipeCreate = {
  title: string;
  source_url?: string | null;
  notes?: string | null;
  tags?: string[];
  ingredients?: string[];
  time_minutes?: number | null;
  difficulty?: number | null;
};

export type RecipeUpdate = Partial<RecipeCreate> & {
  is_active?: boolean;
};

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listRecipes: (q?: string) =>
    http<Recipe[]>(`/api/recipes${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  getRecipe: (id: string) => http<Recipe>(`/api/recipes/${id}`),

  createRecipe: (payload: RecipeCreate) =>
    http<Recipe>(`/api/recipes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateRecipe: (id: string, payload: RecipeUpdate) =>
    http<Recipe>(`/api/recipes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteRecipe: (id: string) =>
    http<{ ok: boolean }>(`/api/recipes/${id}`, { method: "DELETE" }),
};
