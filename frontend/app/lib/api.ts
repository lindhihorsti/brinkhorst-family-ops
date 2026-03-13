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
  paid_by_member_id?: string | null;
  split_among: string[];
  split_among_member_ids?: string[];
  category: string;
  date: string;
  notes?: string | null;
  created_at?: string;
};

export type ExpenseCreate = {
  title: string;
  amount: number;
  paid_by: string;
  paid_by_member_id?: string | null;
  split_among: string[];
  split_among_member_ids?: string[];
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

export type ShoppingListItem = {
  id: string;
  content: string;
  source: "manual" | "recipe" | "pantry";
  recipe_title?: string | null;
  pantry_name?: string | null;
  pantry_uncertain: boolean;
  category?: string | null;
  checked: boolean;
  item_order: number;
};

export type ShoppingList = {
  id: string;
  title: string;
  notes?: string | null;
  view_mode: "checklist" | "text";
  import_mode: "ai_consolidated" | "per_recipe";
  estimate_currency: "chf" | "eur";
  includes_weekly_items: boolean;
  estimated_total_text?: string | null;
  estimated_total_amount?: number | null;
  estimated_total_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  manual_count: number;
  recipe_count: number;
  pantry_count: number;
  total_count: number;
  checked_count: number;
  items?: ShoppingListItem[];
};

export type PantrySuggestion = {
  pantry_name: string;
  uncertain: boolean;
  aliases: { alias: string; count: number; source: "heuristic" | "ai" }[];
};

export type ShoppingListCreate = {
  title: string;
  notes?: string | null;
  view_mode: "checklist" | "text";
  manual_items?: string[];
  include_weekly_items: boolean;
  import_mode: "ai_consolidated" | "per_recipe";
  estimate_currency?: "chf" | "eur";
};

export type FixedExpenseCategory =
  | "wohnen"
  | "versicherungen"
  | "mobilitaet"
  | "kommunikation_medien"
  | "familie_kind"
  | "finanzen"
  | "sonstiges";

export type FixedExpenseInterval = "monthly" | "quarterly" | "semiannual" | "annual" | "one_time";
export type FinanceResponsibleParty = "dennis" | "julia" | "gemeinsam";

export type FixedExpense = {
  id: string;
  name: string;
  provider?: string | null;
  category: FixedExpenseCategory;
  category_label: string;
  amount: number;
  amount_text: string;
  currency: string;
  interval: FixedExpenseInterval;
  interval_label: string;
  monthly_amount: number;
  monthly_amount_text: string;
  next_due_date: string;
  month_due_date?: string | null;
  is_active_in_month?: boolean;
  responsible_party: FinanceResponsibleParty;
  responsible_label: string;
  payment_method?: string | null;
  account_label?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  cancellation_notice_days?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FixedExpenseCreate = {
  name: string;
  provider?: string | null;
  category: FixedExpenseCategory;
  amount: number;
  interval: FixedExpenseInterval;
  next_due_date: string;
  payment_method?: string | null;
  responsible_party: FinanceResponsibleParty;
  account_label?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  cancellation_notice_days?: number | null;
  notes?: string | null;
};

export type FinanceIncome = {
  id: string;
  month: string;
  person: "dennis" | "julia";
  label: string;
  net_income_amount: number;
  net_income_amount_text: string;
  notes?: string | null;
};

export type FinanceIncomeMonth = {
  month: string;
  month_label: string;
  dennis: number;
  dennis_text: string;
  julia: number;
  julia_text: string;
  gesamt: number;
  gesamt_text: string;
  has_values: boolean;
};

export type FixedExpenseMonth = {
  month: string;
  month_label: string;
  monthly_total: number;
  monthly_total_text: string;
  due_total: number;
  due_total_text: string;
  count: number;
};

export type FixedExpenseMonthDetail = {
  month: string;
  month_label: string;
  summary: {
    monthly_total: number;
    monthly_total_text: string;
    due_total: number;
    due_total_text: string;
    count: number;
  };
  items: FixedExpense[];
};

export type FinanceYearlyOverview = {
  year: number;
  year_label: string;
  summary: {
    annual_fixed_total: number;
    annual_fixed_total_text: string;
    actual_due_total: number;
    actual_due_total_text: string;
    monthly_average: number;
    monthly_average_text: string;
    household_income_total: number;
    household_income_total_text: string;
    available_after_fixed_total: number;
    available_after_fixed_total_text: string;
  };
  monthly_breakdown: { month: string; label: string; monthly_total: number; monthly_total_text: string }[];
  by_category: { category: string; label: string; annual_total: number; annual_total_text: string; percentage: number }[];
  by_responsible_party: { responsible_party: string; label: string; color?: string; annual_total: number; annual_total_text: string; percentage: number }[];
  annual_cost_drivers: (FixedExpense & { annual_total: number; annual_total_text: string })[];
  yearly_due_items: { id: string; name: string; month_due_date: string; amount_text: string; interval_label: string; responsible_label: string; category_label: string }[];
  one_time_costs: (FixedExpense & { month_label: string })[];
  people: Record<string, {
    label: string;
    color?: string;
    income_total: number;
    income_total_text: string;
    direct_costs: number;
    direct_costs_text: string;
    shared_cost_share: number;
    shared_cost_share_text: string;
    allocated_costs: number;
    allocated_costs_text: string;
    available_after_allocation: number;
    available_after_allocation_text: string;
  }>;
};

export type FinanceDashboard = {
  month: string;
  month_label: string;
  summary: {
    monthly_fixed_total: number;
    monthly_fixed_total_text: string;
    annual_fixed_total: number;
    annual_fixed_total_text: string;
    next_30_days_total: number;
    next_30_days_total_text: string;
    due_in_month_total: number;
    due_in_month_total_text: string;
    household_income_total: number;
    household_income_total_text: string;
    available_after_fixed_total: number;
    available_after_fixed_total_text: string;
  };
  incomes: {
    dennis: number;
    dennis_text: string;
    julia: number;
    julia_text: string;
    gesamt: number;
    gesamt_text: string;
  };
  by_category: {
    category: string;
    label: string;
    monthly_total: number;
    monthly_total_text: string;
    percentage: number;
    carried_by: {
      responsible_party: string;
      label: string;
      color?: string;
      monthly_total: number;
      monthly_total_text: string;
      percentage_of_category: number;
    }[];
  }[];
  top_cost_drivers: FixedExpense[];
  upcoming_due_items: FixedExpense[];
  periodic_costs: FixedExpense[];
  by_responsible_party: { responsible_party: string; label: string; color?: string; monthly_total: number; monthly_total_text: string; percentage: number }[];
  people: Record<string, {
    person: string;
    label: string;
    color?: string;
    income: number;
    income_text: string;
    direct_costs: number;
    direct_costs_text: string;
    shared_costs: number;
    shared_costs_text: string;
    shared_cost_share: number;
    shared_cost_share_text: string;
    allocated_costs: number;
    allocated_costs_text: string;
    available_after_allocation: number;
    available_after_allocation_text: string;
    available_after_direct: number;
    available_after_direct_text: string;
  }>;
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
    http<{ ok: boolean; rating: number; cooked_count: number }>(`/api/recipes/${id}/rate`, {
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

  listShoppingLists: () =>
    http<{ ok: boolean; items: ShoppingList[] }>(`/api/shopping-lists`).then((r) => r.items ?? []),

  createShoppingList: (payload: ShoppingListCreate) =>
    http<{ ok: boolean; item: ShoppingList; warning?: string | null }>(`/api/shopping-lists`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getShoppingList: (id: string) =>
    http<{ ok: boolean; item: ShoppingList }>(`/api/shopping-lists/${id}`).then((r) => r.item),

  updateShoppingList: (id: string, payload: Partial<ShoppingListCreate>) =>
    http<{ ok: boolean; item: ShoppingList }>(`/api/shopping-lists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteShoppingList: (id: string) =>
    http<{ ok: boolean }>(`/api/shopping-lists/${id}`, { method: "DELETE" }),

  addShoppingListItem: (id: string, content: string) =>
    http<{ ok: boolean; item: ShoppingList }>(`/api/shopping-lists/${id}/items`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  updateShoppingListItem: (id: string, itemId: string, payload: { checked?: boolean; source?: "manual" | "recipe" | "pantry"; content?: string }) =>
    http<{ ok: boolean; item: ShoppingList }>(`/api/shopping-lists/${id}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteShoppingListItem: (id: string, itemId: string) =>
    http<{ ok: boolean; item: ShoppingList }>(`/api/shopping-lists/${id}/items/${itemId}`, {
      method: "DELETE",
    }),

  snapshotShoppingListWeekly: (id: string, importMode: "ai_consolidated" | "per_recipe") =>
    http<{ ok: boolean; item: ShoppingList; warning?: string | null }>(`/api/shopping-lists/${id}/snapshot-weekly`, {
      method: "POST",
      body: JSON.stringify({ import_mode: importMode }),
    }),

  estimateShoppingList: (id: string) =>
    http<{
      ok: boolean;
      estimate: {
        estimated_total_text?: string | null;
        estimated_total_amount?: number | null;
        estimated_total_note?: string | null;
        model?: string;
      };
      item: ShoppingList;
    }>(`/api/shopping-lists/${id}/estimate`, {
      method: "POST",
    }),

  categorizeShoppingList: (id: string) =>
    http<{
      ok: boolean;
      item?: ShoppingList;
      categories?: string[];
      model?: string;
      error?: string;
    }>(`/api/shopping-lists/${id}/categorize`, {
      method: "POST",
    }),

  getPantrySuggestions: () =>
    http<{ ok: boolean; suggestions: PantrySuggestion[]; unmatched_common: { name: string; count: number }[] }>(
      `/api/settings/pantry/suggestions`
    ),

  getFinanceDashboard: (month?: string) =>
    http<{ ok: boolean; dashboard: FinanceDashboard }>(`/api/finance/dashboard${month ? `?month=${encodeURIComponent(month)}` : ""}`).then((r) => r.dashboard),

  getFinanceYearlyOverview: (year?: number) =>
    http<{ ok: boolean; overview: FinanceYearlyOverview }>(`/api/finance/yearly${year ? `?year=${encodeURIComponent(String(year))}` : ""}`).then((r) => r.overview),

  listFixedExpenses: (params?: { category?: string; interval?: string; responsible_party?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.interval) q.set("interval", params.interval);
    if (params?.responsible_party) q.set("responsible_party", params.responsible_party);
    if (params?.status) q.set("status", params.status);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return http<{ ok: boolean; items: FixedExpense[] }>(`/api/finance/fixed-expenses${suffix}`).then((r) => r.items ?? []);
  },

  listFixedExpenseMonths: (limit?: number) =>
    http<{ ok: boolean; items: FixedExpenseMonth[] }>(
      `/api/finance/fixed-expense-months${limit ? `?limit=${encodeURIComponent(String(limit))}` : ""}`
    ).then((r) => r.items ?? []),

  getFixedExpenseMonthDetail: (month: string) =>
    http<{ ok: boolean } & FixedExpenseMonthDetail>(`/api/finance/fixed-expenses/month-detail?month=${encodeURIComponent(month)}`),

  getFixedExpense: (id: string) =>
    http<{ ok: boolean; item: FixedExpense }>(`/api/finance/fixed-expenses/${id}`).then((r) => r.item),

  createFixedExpense: (payload: FixedExpenseCreate) =>
    http<{ ok: boolean; item: FixedExpense }>(`/api/finance/fixed-expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateFixedExpense: (id: string, payload: Partial<FixedExpenseCreate> & { is_active?: boolean }) =>
    http<{ ok: boolean; item: FixedExpense }>(`/api/finance/fixed-expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  archiveFixedExpense: (id: string) =>
    http<{ ok: boolean; item: FixedExpense }>(`/api/finance/fixed-expenses/${id}`, {
      method: "DELETE",
    }),

  listFinanceIncomes: (month?: string) =>
    http<{ ok: boolean; month: string; month_label: string; items: FinanceIncome[]; summary: { dennis: number; julia: number; gesamt: number; gesamt_text: string } }>(
      `/api/finance/incomes${month ? `?month=${encodeURIComponent(month)}` : ""}`
    ),

  listFinanceIncomeMonths: (limit?: number) =>
    http<{ ok: boolean; items: FinanceIncomeMonth[] }>(
      `/api/finance/income-months${limit ? `?limit=${encodeURIComponent(String(limit))}` : ""}`
    ).then((r) => r.items ?? []),

  upsertFinanceIncome: (payload: { month: string; person: "dennis" | "julia"; net_income_amount: number; notes?: string | null }) =>
    http<{ ok: boolean; item: FinanceIncome }>(`/api/finance/incomes`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  copyPreviousFinanceIncome: (month: string) =>
    http<{ ok: boolean; items?: FinanceIncome[]; error?: string; month?: string }>(`/api/finance/incomes/copy-previous`, {
      method: "POST",
      body: JSON.stringify({ month }),
    }),
};
