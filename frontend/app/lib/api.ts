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
  servings?: number | null;
  rating?: number | null;
  cooked_count?: number;
  photo_url?: string | null;
  collection_name?: string | null;
};

export type FamilyMember = {
  id: string;
  name: string;
  color: string;
  initials: string;
  telegram_id?: string | null;
  dietary_restrictions: string[];
  is_active: boolean;
  created_at?: string;
};

export type ChoreTask = {
  id: string;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  recurrence?: string | null;
  points: number;
  is_active: boolean;
  created_at?: string;
};

export type PinboardNote = {
  id: string;
  content: string;
  author?: string | null;
  tags: string[];
  color?: string | null;
  is_pinned: boolean;
  created_at: string;
};

export type Birthday = {
  id: string;
  name: string;
  birth_date: string;
  relation?: string | null;
  gift_ideas: string[];
  notes?: string | null;
  created_at?: string;
};

export type RecipeCreate = {
  title: string;
  source_url?: string | null;
  notes?: string | null;
  tags?: string[];
  ingredients?: string[];
  time_minutes?: number | null;
  difficulty?: number | null;
  servings?: number | null;
  photo_url?: string | null;
  collection_name?: string | null;
};

export type RecipeImportDraft = RecipeCreate & {
  source_url: string;
  notes: string;
  tags: string[];
  ingredients: string[];
  time_minutes?: number | null;
  difficulty: number;
  created_by: string;
  is_active: boolean;
};

export type RecipeImportPreviewResponse = {
  ok: boolean;
  draft?: RecipeImportDraft;
  warnings?: string[];
  error?: string;
  existing_recipe_id?: string | null;
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

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  split_among: string[];
  category: string;
  date: string;
  notes?: string | null;
  created_at?: string;
};

export type ExpenseCreate = {
  title: string;
  amount: number;
  paid_by: string;
  split_among: string[];
  category: string;
  date: string;
  notes?: string | null;
};

export type BalanceResult = {
  net_balances: Record<string, number>;
  debts: { from: string; to: string; amount: number }[];
};

export type ExpenseReport = {
  by_category: { category: string; total: number }[];
  by_person_total: { person: string; total: number }[];
  monthly_totals: { month: string; total: number }[];
  by_person_monthly: { month: string; person: string; total: number }[];
  summary: {
    total_month: number;
    total_all: number;
    expense_count: number;
    open_balance: number;
  };
};

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

  archiveRecipe: (id: string) =>
    http<{ ok: boolean; id: string; is_active: boolean }>(`/api/recipes/${id}/archive`, {
      method: "POST",
    }),

  importRecipePreview: (url: string) =>
    http<RecipeImportPreviewResponse>(`/api/recipes/import/preview`, {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  rateRecipe: (id: string, rating: number) =>
    http<{ ok: boolean }>(`/api/recipes/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    }),

  listFamilyMembers: () =>
    http<{ ok: boolean; members: FamilyMember[] }>(`/api/family`).then((r) => r.members ?? []),

  createFamilyMember: (payload: Omit<FamilyMember, "id" | "created_at">) =>
    http<FamilyMember>(`/api/family`, { method: "POST", body: JSON.stringify(payload) }),

  updateFamilyMember: (id: string, payload: Partial<FamilyMember>) =>
    http<FamilyMember>(`/api/family/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteFamilyMember: (id: string) =>
    http<{ ok: boolean }>(`/api/family/${id}`, { method: "DELETE" }),

  listBirthdays: () => http<Birthday[]>(`/api/birthdays`),

  createBirthday: (payload: Omit<Birthday, "id" | "created_at">) =>
    http<Birthday>(`/api/birthdays`, { method: "POST", body: JSON.stringify(payload) }),

  updateBirthday: (id: string, payload: Partial<Birthday>) =>
    http<Birthday>(`/api/birthdays/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteBirthday: (id: string) =>
    http<{ ok: boolean }>(`/api/birthdays/${id}`, { method: "DELETE" }),

  listExpenses: () =>
    http<{ ok: boolean; expenses: Expense[] }>(`/api/expenses`).then((r) => r.expenses ?? []),

  createExpense: (payload: ExpenseCreate) =>
    http<{ ok: boolean; expense: Expense }>(`/api/expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteExpense: (id: string) =>
    http<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" }),

  getExpenseBalance: () =>
    http<{ ok: boolean } & BalanceResult>(`/api/expenses/balance`),

  getExpenseReport: () =>
    http<{ ok: boolean } & ExpenseReport>(`/api/expenses/report`),
};
