# Graph Report - .  (2026-08-05)

## Corpus Check
- 26 files · ~633,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1141 nodes · 3036 edges · 84 communities (58 shown, 26 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 738 edges (avg confidence: 0.57)
- Token cost: 87,865 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_Recipe|Recipe]]
- [[_COMMUNITY_Session|Session]]
- [[_COMMUNITY_telegram_events.py|telegram_events.py]]
- [[_COMMUNITY_telegram_webhook()|telegram_webhook()]]
- [[_COMMUNITY__tg_handle_callback()|_tg_handle_callback()]]
- [[_COMMUNITY_styles|styles]]
- [[_COMMUNITY_Any|Any]]
- [[_COMMUNITY_shop_output.py|shop_output.py]]
- [[_COMMUNITY_PROD Environment (Mac Mini, infra)|PROD Environment (Mac Mini, infra)]]
- [[_COMMUNITY_ShoppingListUtilsTest|ShoppingListUtilsTest]]
- [[_COMMUNITY_format.mjs|format.mjs]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_app_state JSON Settings Storage|app_state JSON Settings Storage]]
- [[_COMMUNITY_finance_utils.py|finance_utils.py]]
- [[_COMMUNITY_ui.tsx|ui.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Feature Brief Was unternehmen wir heute|Feature Brief: Was unternehmen wir heute]]
- [[_COMMUNITY_api.ts|api.ts]]
- [[_COMMUNITY_list-content.tsx|list-content.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_BottomNav()|BottomNav()]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Agent Orchestration Model|Agent Orchestration Model]]
- [[_COMMUNITY__normalize_activities_settings()|_normalize_activities_settings()]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_manifest.json|manifest.json]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Premium Button Contrast Fix|Premium Button Contrast Fix]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Code Review Fixes 2026-03-06|Code Review Fixes 2026-03-06]]
- [[_COMMUNITY_Logo Premium Dark|Logo Premium Dark]]
- [[_COMMUNITY_Premium Hero Dark Banner Image|Premium Hero Dark Banner Image]]
- [[_COMMUNITY_EC2 Compose Stack|EC2 Compose Stack]]
- [[_COMMUNITY_Build Images (GHCR) Workflow|Build Images (GHCR) Workflow]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_Logo Premium Light|Logo Premium Light]]
- [[_COMMUNITY_Premium Hero Light Image|Premium Hero Light Image]]
- [[_COMMUNITY_Premium Dark Mode App Icon (F0)|Premium Dark Mode App Icon (F0)]]
- [[_COMMUNITY_Family Ops Logo v2 Light|Family Ops Logo v2 Light]]
- [[_COMMUNITY_Home Page Light Theme Background|Home Page Light Theme Background]]
- [[_COMMUNITY_Home Page Dark Theme Background Gradient|Home Page Dark Theme Background Gradient]]
- [[_COMMUNITY_Family Ops Dark Logo (PNG)|Family Ops Dark Logo (PNG)]]
- [[_COMMUNITY_Family Ops Logo (Light Transparent)|Family Ops Logo (Light Transparent)]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_POST apirecipes{id}archive|POST /api/recipes/{id}/archive]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_Premium Badge Icon|Premium Badge Icon]]
- [[_COMMUNITY_backup-db.sh|backup-db.sh]]
- [[_COMMUNITY_duckdns-update.sh|duckdns-update.sh]]
- [[_COMMUNITY_migrate-from-supabase.sh|migrate-from-supabase.sh]]
- [[_COMMUNITY_seed-dev-from-backup.sh|seed-dev-from-backup.sh]]
- [[_COMMUNITY_SSH Test (EC2) Workflow|SSH Test (EC2) Workflow]]
- [[_COMMUNITY_Branch Workflow (featfix, no direct mai|Branch Workflow (feat/fix, no direct mai]]
- [[_COMMUNITY_Any|Any]]
- [[_COMMUNITY_date|date]]
- [[_COMMUNITY_sqlmodel dependency|sqlmodel dependency]]
- [[_COMMUNITY_FamilyMember|FamilyMember]]
- [[_COMMUNITY_FixedExpense|FixedExpense]]
- [[_COMMUNITY_Family Ops Logo|Family Ops Logo]]
- [[_COMMUNITY_File Document Icon|File Document Icon]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_Family Ops Logo|Family Ops Logo]]
- [[_COMMUNITY_Vercel Logo SVG Asset|Vercel Logo SVG Asset]]
- [[_COMMUNITY_WindowBrowser Icon|Window/Browser Icon]]
- [[_COMMUNITY_Family Ops Wordmark Logo (Light Theme)|Family Ops Wordmark Logo (Light Theme)]]
- [[_COMMUNITY_Recipe|Recipe]]
- [[_COMMUNITY_ShoppingList|ShoppingList]]
- [[_COMMUNITY_ShoppingListItem|ShoppingListItem]]

## God Nodes (most connected - your core abstractions)
1. `Recipe` - 60 edges
2. `ShoppingList` - 57 edges
3. `ShoppingListItem` - 55 edges
4. `_tg_handle_callback()` - 53 edges
5. `FixedExpense` - 52 edges
6. `FamilyMember` - 49 edges
7. `FinanceMonthlyIncome` - 49 edges
8. `ChoreTask` - 48 edges
9. `Birthday` - 48 edges
10. `RecipePhoto` - 46 edges

## Surprising Connections (you probably didn't know these)
- `DB Changes Quick Guide (Supabase)` --semantically_similar_to--> `Supabase SQL Migration Policy`  [INFERRED] [semantically similar]
  docs/DB_CHANGES.md → db/migrations/README.md
- `Caddy Reverse Proxy (/ frontend, /api backend)` --references--> `DEV/TEST Environment (familyops-dev)`  [INFERRED]
  AGENTS.md → docs/DEV_PROD.md
- `Feature Brief: Build Date on Homepage (BUILD_DATE build-arg)` --references--> `Build Images (GHCR) Workflow`  [INFERRED]
  docs/agent-tasks/feature-build-date-homepage.md → .github/workflows/build.yml
- `Supabase SQL Migration Policy` --references--> `DB Change Guard Workflow`  [INFERRED]
  db/migrations/README.md → .github/workflows/db-guard.yml
- `DB Changes Quick Guide (Supabase)` --references--> `DB Change Guard Workflow`  [INFERRED]
  docs/DB_CHANGES.md → .github/workflows/db-guard.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Family Ops sub-agent orchestration roles** — agents_orchestrator_role, agents_research_agent_role, agents_backend_agent_role, agents_frontend_agent_role, agents_telegram_agent_role, agents_validation_agent_role [EXTRACTED 0.90]
- **Mac Mini local prod deploy flow** — docs_dev_prod_prod_worktree, docs_dev_prod_compose_macmini_yml, docs_deployment_make_deploy, docs_deployment_git_sha_healthcheck [EXTRACTED 0.85]
- **Three switchable UX skins (classic/premium/recipely)** — docs_agent_tasks_feature_recipely_full_skin_recipely_css, docs_agent_tasks_fix_premium_button_contrast_premium_css, docs_agent_tasks_fix_premium_button_contrast_nav_height [INFERRED 0.75]
- **EC2-to-Mac-Mini Migration Flow** — docs_macmini_macmini_production_server, docs_macmini_supabase_data_migration, docs_macmini_duckdns_dynamic_dns, docs_macmini_cutover_checklist, docs_macmini_daily_backup_launchd [EXTRACTED 1.00]
- **Shopping List Ecosystem (Lists, AI Categories, Output Modes, Pantry)** — docs_agent_tasks_feature_shopping_lists_use_case_einkaufsliste_use_case, docs_agent_tasks_feature_shopping_list_ai_categories_ai_categorization, docs_agent_tasks_feature_shop_output_toggle_shop_output_mode, docs_agent_tasks_fix_shopping_ai_categorize_large_lists_chunked_categorization, docs_agent_tasks_feature_settings_pantry_preferences_telegram_pantry_basisvorrat [INFERRED 0.85]
- **Weekly Plan Workflow (Plan, Swap, Preferences, Snapshot, Links)** — docs_agent_tasks_feature_weekly_plan_gui_weekly_plan_gui, docs_agent_tasks_feature_swap_wizard_fix_swap_wizard, docs_agent_tasks_feature_settings_pantry_preferences_telegram_plan_preferences_bias, docs_agent_tasks_feature_shopping_lists_use_case_weekly_plan_snapshot_import, docs_agent_tasks_feature_settings_health_weekly_links_weekly_plan_recipe_links [INFERRED 0.85]
- **Deployment Environments (Dev, EC2, Mac Mini, Prod Override, GHCR Build)** — infra_docker_compose_local_dev_stack, infra_docker_compose_ec2_ec2_stack, infra_docker_compose_macmini_macmini_stack, infra_docker_compose_prod_prod_override, infra__github_workflows_build_build_images_ghcr [INFERRED 0.85]
- **Unified Design System** — frontend_public_logo_premium_dark_house_symbol, frontend_public_logo_premium_dark_orbital_network, frontend_public_logo_premium_dark_color_palette, frontend_public_logo_premium_dark_neon_style [INFERRED 0.90]
- **Logo Design System** — frontend_public_logo_v2_light_monogram, frontend_public_logo_v2_light_color, frontend_public_logo_v2_light_typography [EXTRACTED 1.00]
- **Premium Hero Visual Design System** — frontend_public_premium_hero_dark_wave_pattern, frontend_public_premium_hero_dark_starfield_background, frontend_public_premium_hero_dark_teal_amber_palette, frontend_public_premium_hero_dark_dark_theme [INFERRED 0.90]

## Communities (84 total, 26 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.05
Nodes (64): ai_status(), api_assign_cooks(), api_chore_stats(), api_generate_gift_ideas(), api_get_birthdays_settings(), api_get_chore_settings(), api_get_pinboard_categories(), api_get_preference_options() (+56 more)

### Community 1 - "Recipe"
Cohesion: 0.32
Nodes (62): ActivitiesGeneratePayload, ActivitiesMoodPayload, ActivitiesSettingsPayload, api_complete_chore(), api_copy_previous_finance_income(), api_create_meal_history(), api_list_finance_incomes(), api_upsert_finance_income() (+54 more)

### Community 2 - "Session"
Cohesion: 0.08
Nodes (55): api_add_shopping_list_item(), api_archive_recipe(), api_categorize_shopping_list(), api_create_birthday(), api_create_chore(), api_create_family_member(), api_create_fixed_expense(), api_create_pinboard_note() (+47 more)

### Community 3 - "telegram_events.py"
Cohesion: 0.07
Nodes (33): age_on_next_birthday(), birthday_for_year(), build_expense_participants(), collapse_labeled_amounts(), compute_expense_balances(), days_until_birthday(), expense_party_key(), expense_party_label() (+25 more)

### Community 4 - "telegram_webhook()"
Cohesion: 0.10
Nodes (50): api_get_settings(), api_weekly_cancel(), api_weekly_confirm(), api_weekly_current(), api_weekly_history(), api_weekly_history_detail(), api_weekly_plan(), api_weekly_shop() (+42 more)

### Community 5 - "_tg_handle_callback()"
Cohesion: 0.08
Nodes (48): api_finance_dashboard(), api_list_birthdays(), _finance_income_map(), _tg_answer_callback(), _tg_api(), _tg_birthday_picker_rows(), _tg_birthdays_rows(), _tg_cancel_rows() (+40 more)

### Community 6 - "styles"
Cohesion: 0.09
Nodes (12): TelegramSettings, ShopSettings, BirthdaySettings, DEFAULT, SECTIONS, SettingsData, Category, DEFAULT_CATEGORIES (+4 more)

### Community 7 - "Any"
Cohesion: 0.08
Nodes (40): Any, _aggregate_expense_person_monthly(), _aggregate_expense_person_totals(), api_create_expense(), api_expenses_balance(), api_expenses_report(), api_generate_activities(), api_get_settings_pantry_suggestions() (+32 more)

### Community 8 - "shop_output.py"
Cohesion: 0.13
Nodes (33): _category_rank(), _clean_name_for_merge(), _expand_compound_lines(), _extract_output_data(), _extract_output_text(), _format_amount(), _looks_like_calculation(), _normalize_key() (+25 more)

### Community 9 - "PROD Environment (Mac Mini, infra)"
Cohesion: 0.06
Nodes (35): Caddy Reverse Proxy (/ frontend, /api backend), pillow (image scaling) dependency, POST /api/recipes/photos/backfill, Deterministic image extraction (JSON-LD/og:image, no AI), Recipe Thumbnails Feature, GET /api/recipes/{id}/photo endpoint, recipe_photos table (bytea blob store), SSRF import protection reuse (_validate_import_url) (+27 more)

### Community 10 - "ShoppingListUtilsTest"
Cohesion: 0.10
Nodes (12): apply_ai_categories_to_recipe_items(), chunk_shopping_category_items(), infer_single_item_category(), _normalize_item_text(), Any, reorder_recipe_items_by_category(), shopping_estimate_context(), shopping_estimate_lines() (+4 more)

### Community 11 - "format.mjs"
Cohesion: 0.11
Nodes (16): FinanzEinkommenMonthDetailPage(), FinanzEinkommenPage(), currentMonthValue(), FINANCE_CATEGORY_OPTIONS, FINANCE_INTERVAL_OPTIONS, FINANCE_PERSON_COLORS, FINANCE_RESPONSIBLE_OPTIONS, formatMonthLabel() (+8 more)

### Community 12 - "layout.tsx"
Cohesion: 0.06
Nodes (28): geistMono, geistSans, jakarta, metadata, syne, viewport, nextConfig, dependencies (+20 more)

### Community 13 - "app_state JSON Settings Storage"
Cohesion: 0.08
Nodes (32): Duplicate Prevention by Canonical URL, POST /api/recipes/import/preview, Import Preview Cache (app_state), Prompt Injection Defense, Recipe URL AI Import, SSRF Protection for URL Fetch, OpenAI Structured Outputs (JSON Schema), SystemStatus Component (Health Block) (+24 more)

### Community 14 - "finance_utils.py"
Cohesion: 0.22
Nodes (23): add_months(), annualize_amount(), build_finance_dashboard(), build_finance_yearly_overview(), days_until_due(), decimal_money(), _effective_start(), expense_applies_to_month() (+15 more)

### Community 15 - "ui.tsx"
Cohesion: 0.10
Nodes (19): MEMBER_COLORS, DEFAULT_PANTRY, PantryItem, PantrySuggestion, SettingsData, FamilyMember, Avatar(), Chip() (+11 more)

### Community 16 - "page.tsx"
Cohesion: 0.10
Nodes (16): AufgabenInner(), Chore, Member, RECURRENCE_LABELS, ScoreEntry, EinkaufContent(), BalanceResult, Expense (+8 more)

### Community 17 - "Feature Brief: Was unternehmen wir heute"
Cohesion: 0.11
Nodes (24): DB Change Guard Workflow, Supabase SQL Migration Policy, Feature Brief: UI Tidy (Home + Recipes), Endpoint /api/activities/home/generate, Feature: Indoor Ideas Generator (/ideen/zuhause), Activities Settings in app_state JSON, Feature Brief: Was unternehmen wir heute? (Activities Ideas Generator), Shared Shop AI Transformation Service (shop_ai) (+16 more)

### Community 18 - "api.ts"
Cohesion: 0.09
Nodes (19): Birthday, ChoreTask, ExpenseCreate, FinanceIncome, FinanceResponsibleParty, FixedExpense, FixedExpenseCategory, FixedExpenseCreate (+11 more)

### Community 19 - "list-content.tsx"
Cohesion: 0.13
Nodes (19): Birthday, BirthdayCard(), BirthdayFormModal(), BirthdayListContent(), BirthdayListInner(), BirthdaySettings, birthMonthIndex(), cardBg() (+11 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 21 - "page.tsx"
Cohesion: 0.25
Nodes (14): estimateCurrencyLabel(), formatEstimateTotal(), categoryGroups(), pantryGroups(), recipeGroups(), shoppingTextOutput(), splitShoppingItems(), EinkaufDetailContent() (+6 more)

### Community 22 - "page.tsx"
Cohesion: 0.21
Nodes (14): DisplayMode, HomeLayout, OPTIONS, Skin, Theme, UxVersion, applyDisplayMode(), applyHomeLayout() (+6 more)

### Community 23 - "BottomNav()"
Cohesion: 0.18
Nodes (10): options, PREMIUM_TILES, options, PREMIUM_TILES, metadata, TILES, PremiumHubLayout(), PremiumHubTile (+2 more)

### Community 24 - "page.tsx"
Cohesion: 0.12
Nodes (13): ActivitiesSettings, DEFAULT_SETTINGS, DURATION_OPTIONS, ENERGY_OPTIONS, GOAL_OPTIONS, HomeAlternative, MATERIAL_OPTIONS, MESS_OPTIONS (+5 more)

### Community 25 - "page.tsx"
Cohesion: 0.13
Nodes (11): ActivitiesSettings, ActivitiesSettingsResponse, ActivityAlternative, DEFAULT_SETTINGS, ENERGY_OPTIONS, GenerateResponse, IO_OPTIONS, styles (+3 more)

### Community 26 - "page.tsx"
Cohesion: 0.16
Nodes (12): addDays(), cardStyles, DayEntry, daysList, DraftPayload, formatDateRangeLabel(), isoWeekNumber(), PlanPayload (+4 more)

### Community 27 - "page.tsx"
Cohesion: 0.18
Nodes (8): metadata, SECTIONS, SETTINGS_GROUPS, buildDateLabel(), HealthAll, Metrics, shortSha(), SystemStatus()

### Community 28 - "page.tsx"
Cohesion: 0.14
Nodes (10): Birthday, BirthdaySettings, BUDGETS, CONSTRAINTS, DEFAULT_SETTINGS, GIFT_TYPES, GiftIdea, INTERESTS (+2 more)

### Community 29 - "Agent Orchestration Model"
Cohesion: 0.15
Nodes (13): BACKEND_AGENT role, Mandatory feature docs (docs/agent-tasks/), FRONTEND_AGENT role, Agent Orchestration Model, ORCHESTRATOR role, RESEARCH_AGENT role, TELEGRAM_AGENT role, VALIDATION_AGENT role (+5 more)

### Community 30 - "_normalize_activities_settings()"
Cohesion: 0.33
Nodes (12): api_generate_home_activities(), api_get_activities_settings(), api_put_activities_settings(), _get_settings_activities(), _normalize_activities_budget(), _normalize_activities_settings(), _normalize_activities_transport(), _normalize_ascii_key() (+4 more)

### Community 31 - "page.tsx"
Cohesion: 0.21
Nodes (8): ExpenseReport, AuswertungPage(), CATEGORY_COLORS, DonutChart(), fmt(), MONTH_COLORS, MonthlyBarChart(), PERSON_COLORS

### Community 32 - "page.tsx"
Cohesion: 0.26
Nodes (10): catBg(), catColor(), Category, catLabel(), DEFAULT_CATEGORIES, Note, NoteCard(), relativeTime() (+2 more)

### Community 33 - "page.tsx"
Cohesion: 0.18
Nodes (7): ActivitiesSettings, DEFAULT, HOME_DURATION_OPTIONS, HOME_MATERIAL_OPTIONS, HOME_THEME_OPTIONS, TRAVEL_OPTIONS, TYPE_OPTIONS

### Community 34 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, categories, description, display, icons, name, orientation, short_name (+2 more)

### Community 35 - "page.tsx"
Cohesion: 0.20
Nodes (4): BENTO, BentoTile, USE_CASES, UseCase

### Community 36 - "Premium Button Contrast Fix"
Cohesion: 0.25
Nodes (9): Recipely Figma UI Kit (aPoUc8hO80quXvylgEPgF7), Figma MCP quota exhaustion (6 calls/month), frontend/app/recipely.css skin stylesheet, Recipely Full Skin (data-skin=recipely theme), Premium Button Contrast Fix, --nav-height override (FAB above pill nav), --page-accent per-area button coloring, frontend/app/premium.css (data-ux=premium skin) (+1 more)

### Community 37 - "page.tsx"
Cohesion: 0.31
Nodes (5): getWeeklyPlanHref(), DayEntry, formatDate(), WeeklyHistoryItem, WeeklyPlanHistoryDetailPage()

### Community 38 - "page.tsx"
Cohesion: 0.36
Nodes (6): createExpensePayload(), defaultExpenseSelection(), CATEGORIES, NeuePage(), todayIso(), members

### Community 39 - "Code Review Fixes 2026-03-06"
Cohesion: 0.40
Nodes (6): Birthday Feb-29 Leap Year Fix, Expense Stable Member IDs, Next.js Standalone Config Consolidation, Open Balance KPI Correction, Code Review Fixes 2026-03-06, Next.js Frontend (create-next-app)

### Community 40 - "Logo Premium Dark"
Cohesion: 0.40
Nodes (6): Logo Premium Dark, Dual-Color Gradient System, Dark Theme Optimization, House Icon Symbol, Neon Glow Aesthetic, Orbital Network Pattern

### Community 41 - "Premium Hero Dark Banner Image"
Cohesion: 0.47
Nodes (6): Premium Hero Dark Banner Image, Dark Theme Design Choice, Premium Tier UI Asset, Cosmic Starfield Background, Teal-Amber Color Palette, Flowing Wave Visual Pattern

### Community 42 - "EC2 Compose Stack"
Cohesion: 0.33
Nodes (6): Build Images (GHCR) Workflow, SSH Test (EC2) Workflow, EC2 Compose Stack, Local Dev Compose Stack, Mac Mini Compose Stack, Prod Compose Override

### Community 43 - "Build Images (GHCR) Workflow"
Cohesion: 0.60
Nodes (5): Build Images (GHCR) Workflow, GHCR :stable Pointer Tag, Rollback Prod (retag stable) Workflow, Feature Brief: Build Date on Homepage (BUILD_DATE build-arg), Feature Brief: Git SHA in Backend + Frontend (Homepage)

### Community 45 - "Logo Premium Light"
Cohesion: 0.50
Nodes (5): Logo Premium Light, House Icon Design Element, Orbital Rings Design Element, Warm Orange Color Palette, Light Theme Branding Variant

### Community 46 - "Premium Hero Light Image"
Cohesion: 0.40
Nodes (5): Peachy-Coral to Golden-Yellow Palette, Light Theme Variant, Organic Wave and Blur Pattern, Premium Hero Light Image, Warm Gradient Background

### Community 47 - "Premium Dark Mode App Icon (F0)"
Cohesion: 0.67
Nodes (4): Orange-Gold Glow with Dark Background and Teal Accents, Dark Mode App Icon Design Pattern, Glass Morphism with Glow Effect, Premium Dark Mode App Icon (F0)

### Community 48 - "Family Ops Logo v2 Light"
Cohesion: 0.50
Nodes (4): Family Ops Logo v2 Light, Burnt Orange Color Scheme, FO Monogram Design, Sans-Serif Typography

### Community 49 - "Home Page Light Theme Background"
Cohesion: 0.67
Nodes (3): Gradient Background Pattern, Light Theme Color Palette, Home Page Light Theme Background

### Community 50 - "Home Page Dark Theme Background Gradient"
Cohesion: 0.67
Nodes (3): Dark Theme Design System, Gradient Background Design Pattern, Home Page Dark Theme Background Gradient Asset

### Community 51 - "Family Ops Dark Logo (PNG)"
Cohesion: 0.67
Nodes (3): Family Ops Brand Identity, Family Ops Dark Logo (PNG), Neon Dark Visual Aesthetic

### Community 52 - "Family Ops Logo (Light Transparent)"
Cohesion: 0.67
Nodes (3): Family Ops Brand Identity, Family Unit Visual Representation, Family Ops Logo (Light Transparent)

## Knowledge Gaps
- **262 isolated node(s):** `Chore`, `Member`, `ScoreEntry`, `RECURRENCE_LABELS`, `RecipeGroup` (+257 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ShoppingListUtilsTest` connect `ShoppingListUtilsTest` to `shop_output.py`, `Recipe`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Session` (e.g. with `build_per_recipe_output()` and `_collect_recipe_ingredients()`) actually correct?**
  _`Session` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 55 inferred relationships involving `Recipe` (e.g. with `ActivitiesGeneratePayload` and `ActivitiesMoodPayload`) actually correct?**
  _`Recipe` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 52 inferred relationships involving `ShoppingList` (e.g. with `ActivitiesGeneratePayload` and `ActivitiesMoodPayload`) actually correct?**
  _`ShoppingList` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 48 inferred relationships involving `ShoppingListItem` (e.g. with `ActivitiesGeneratePayload` and `ActivitiesMoodPayload`) actually correct?**
  _`ShoppingListItem` has 48 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Service layer modules.`, `Chore`, `Member` to the rest of the system?**
  _293 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05004389815627744 - nodes in this community are weakly interconnected._