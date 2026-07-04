# Graph Report - .  (2026-07-04)

## Corpus Check
- Large corpus: 168 files · ~628,014 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1069 nodes · 3070 edges · 67 communities (53 shown, 14 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 814 edges (avg confidence: 0.59)
- Token cost: 855,003 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Shopping-KI & Pantry-Matching|Shopping-KI & Pantry-Matching]]
- [[_COMMUNITY_Core API Routes (CRUD)|Core API Routes (CRUD)]]
- [[_COMMUNITY_API Payload-Modelle|API Payload-Modelle]]
- [[_COMMUNITY_Backend Main & Settings-APIs|Backend Main & Settings-APIs]]
- [[_COMMUNITY_Finanz-Berechnungen|Finanz-Berechnungen]]
- [[_COMMUNITY_CICD & Deployment Ops|CI/CD & Deployment Ops]]
- [[_COMMUNITY_Wochenplan-API|Wochenplan-API]]
- [[_COMMUNITY_Dashboards & Statistik-APIs|Dashboards & Statistik-APIs]]
- [[_COMMUNITY_Finanz-Frontend-Seiten|Finanz-Frontend-Seiten]]
- [[_COMMUNITY_App-Layout & Fonts|App-Layout & Fonts]]
- [[_COMMUNITY_Rezept-URL-KI-Import|Rezept-URL-KI-Import]]
- [[_COMMUNITY_Settings- & Einkaufs-Seiten|Settings- & Einkaufs-Seiten]]
- [[_COMMUNITY_Ausgaben- & Aktivitäten-Aggregation|Ausgaben- & Aktivitäten-Aggregation]]
- [[_COMMUNITY_Frontend API-Client & Typen|Frontend API-Client & Typen]]
- [[_COMMUNITY_Aktivitäten-Ideen-UI|Aktivitäten-Ideen-UI]]
- [[_COMMUNITY_AufgabenChores-UI|Aufgaben/Chores-UI]]
- [[_COMMUNITY_Domain-Utils (GeburtstageAusgaben)|Domain-Utils (Geburtstage/Ausgaben)]]
- [[_COMMUNITY_Geburtstage-UI|Geburtstage-UI]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `Recipe` - 54 edges
2. `_tg_handle_callback()` - 53 edges
3. `ShoppingList` - 53 edges
4. `ShoppingListItem` - 51 edges
5. `FixedExpense` - 48 edges
6. `FinanceMonthlyIncome` - 48 edges
7. `ChoreTask` - 47 edges
8. `Birthday` - 47 edges
9. `FamilyMember` - 46 edges
10. `FinanceDashboardInput` - 45 edges

## Surprising Connections (you probably didn't know these)
- `CLAUDE.md Project Guide` --semantically_similar_to--> `AGENTS.md Repo Rules for AI Agents`  [INFERRED] [semantically similar]
  CLAUDE.md → AGENTS.md
- `DB Changes Quick Guide (Supabase)` --semantically_similar_to--> `Supabase SQL Migration Policy`  [INFERRED] [semantically similar]
  docs/DB_CHANGES.md → db/migrations/README.md
- `Feature Brief: Build Date on Homepage (BUILD_DATE build-arg)` --references--> `Build Images (GHCR) Workflow`  [INFERRED]
  docs/agent-tasks/feature-build-date-homepage.md → .github/workflows/build.yml
- `SSH Test (EC2) Workflow` --conceptually_related_to--> `Deployment & DB Changes Guide (local -> prod)`  [INFERRED]
  .github/workflows/ssh-test.yml → docs/DEPLOYMENT.md
- `CLAUDE.md Project Guide` --references--> `Build Images (GHCR) Workflow`  [INFERRED]
  CLAUDE.md → .github/workflows/build.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **GHCR :stable Build/Deploy/Rollback Flow** — _github_workflows_build_build_images_ghcr, _github_workflows_rollback_rollback_prod, _github_workflows_build_ghcr_stable_tag, docs_deployment_ec2_auto_deploy, docs_deployment_deployment_pipeline [EXTRACTED 1.00]
- **Agent Orchestration Role Set** — agents_orchestrator, agents_research_agent, agents_backend_agent, agents_frontend_agent, agents_telegram_agent, agents_validation_agent, agents_agent_orchestration [EXTRACTED 1.00]
- **EC2-to-Mac-Mini Migration Flow** — docs_macmini_macmini_production_server, docs_macmini_supabase_data_migration, docs_macmini_duckdns_dynamic_dns, docs_macmini_cutover_checklist, docs_macmini_daily_backup_launchd [EXTRACTED 1.00]
- **Shopping List Ecosystem (Lists, AI Categories, Output Modes, Pantry)** — docs_agent_tasks_feature_shopping_lists_use_case_einkaufsliste_use_case, docs_agent_tasks_feature_shopping_list_ai_categories_ai_categorization, docs_agent_tasks_feature_shop_output_toggle_shop_output_mode, docs_agent_tasks_fix_shopping_ai_categorize_large_lists_chunked_categorization, docs_agent_tasks_feature_settings_pantry_preferences_telegram_pantry_basisvorrat [INFERRED 0.85]
- **Weekly Plan Workflow (Plan, Swap, Preferences, Snapshot, Links)** — docs_agent_tasks_feature_weekly_plan_gui_weekly_plan_gui, docs_agent_tasks_feature_swap_wizard_fix_swap_wizard, docs_agent_tasks_feature_settings_pantry_preferences_telegram_plan_preferences_bias, docs_agent_tasks_feature_shopping_lists_use_case_weekly_plan_snapshot_import, docs_agent_tasks_feature_settings_health_weekly_links_weekly_plan_recipe_links [INFERRED 0.85]
- **Deployment Environments (Dev, EC2, Mac Mini, Prod Override, GHCR Build)** — infra_docker_compose_local_dev_stack, infra_docker_compose_ec2_ec2_stack, infra_docker_compose_macmini_macmini_stack, infra_docker_compose_prod_prod_override, infra__github_workflows_build_build_images_ghcr [INFERRED 0.85]
- **Unified Design System** — frontend_public_logo_premium_dark_house_symbol, frontend_public_logo_premium_dark_orbital_network, frontend_public_logo_premium_dark_color_palette, frontend_public_logo_premium_dark_neon_style [INFERRED 0.90]
- **Logo Design System** — frontend_public_logo_v2_light_monogram, frontend_public_logo_v2_light_color, frontend_public_logo_v2_light_typography [EXTRACTED 1.00]
- **Premium Hero Visual Design System** — frontend_public_premium_hero_dark_wave_pattern, frontend_public_premium_hero_dark_starfield_background, frontend_public_premium_hero_dark_teal_amber_palette, frontend_public_premium_hero_dark_dark_theme [INFERRED 0.90]

## Communities (67 total, 14 thin omitted)

### Community 0 - "Shopping-KI & Pantry-Matching"
Cohesion: 0.06
Nodes (46): api_get_settings_pantry_suggestions(), _category_rank(), _clean_name_for_merge(), _expand_compound_lines(), _extract_output_data(), _extract_output_text(), _format_amount(), _looks_like_calculation() (+38 more)

### Community 1 - "Core API Routes (CRUD)"
Cohesion: 0.07
Nodes (61): api_add_shopping_list_item(), api_archive_recipe(), api_categorize_shopping_list(), api_create_birthday(), api_create_chore(), api_create_expense(), api_create_family_member(), api_create_pinboard_note() (+53 more)

### Community 2 - "API Payload-Modelle"
Cohesion: 0.36
Nodes (59): FinanceDashboardInput, FinanceYearlyInput, ActivitiesGeneratePayload, ActivitiesMoodPayload, ActivitiesSettingsPayload, api_complete_chore(), api_create_meal_history(), api_list_chores() (+51 more)

### Community 3 - "Backend Main & Settings-APIs"
Cohesion: 0.06
Nodes (54): ai_status(), api_generate_gift_ideas(), api_get_birthdays_settings(), api_meal_history_stats(), api_put_birthdays_settings(), api_put_chore_settings(), api_put_pinboard_categories(), api_put_settings_pantry() (+46 more)

### Community 4 - "Finanz-Berechnungen"
Cohesion: 0.13
Nodes (37): add_months(), annualize_amount(), build_finance_dashboard(), build_finance_yearly_overview(), days_until_due(), decimal_money(), _effective_start(), expense_applies_to_month() (+29 more)

### Community 5 - "CI/CD & Deployment Ops"
Cohesion: 0.07
Nodes (43): Build Images (GHCR) Workflow, GHCR :stable Pointer Tag, DB Change Guard Workflow, Rollback Prod (retag stable) Workflow, SSH Test (EC2) Workflow, Mandatory Agent Orchestration Pattern, BACKEND_AGENT Role, FRONTEND_AGENT Role (+35 more)

### Community 6 - "Wochenplan-API"
Cohesion: 0.10
Nodes (42): api_assign_cooks(), api_weekly_cancel(), api_weekly_confirm(), api_weekly_current(), api_weekly_history(), api_weekly_history_detail(), api_weekly_plan(), api_weekly_swap() (+34 more)

### Community 7 - "Dashboards & Statistik-APIs"
Cohesion: 0.09
Nodes (41): api_chore_stats(), api_finance_dashboard(), api_list_birthdays(), api_list_family(), api_list_fixed_expenses(), api_list_pinboard(), Points scoreboard for current month., _tg_answer_callback() (+33 more)

### Community 8 - "Finanz-Frontend-Seiten"
Cohesion: 0.11
Nodes (18): FinanzEinkommenMonthDetailPage(), FinanzEinkommenPage(), FixedCostsPage(), currentMonthValue(), FINANCE_CATEGORY_OPTIONS, FINANCE_INTERVAL_OPTIONS, FINANCE_PERSON_COLORS, FINANCE_RESPONSIBLE_OPTIONS (+10 more)

### Community 9 - "App-Layout & Fonts"
Cohesion: 0.06
Nodes (28): geistMono, geistSans, jakarta, metadata, syne, viewport, nextConfig, dependencies (+20 more)

### Community 10 - "Rezept-URL-KI-Import"
Cohesion: 0.08
Nodes (32): Duplicate Prevention by Canonical URL, POST /api/recipes/import/preview, Import Preview Cache (app_state), Prompt Injection Defense, Recipe URL AI Import, SSRF Protection for URL Fetch, OpenAI Structured Outputs (JSON Schema), SystemStatus Component (Health Block) (+24 more)

### Community 11 - "Settings- & Einkaufs-Seiten"
Cohesion: 0.10
Nodes (9): ShopSettings, SECTIONS, SettingsData, Category, DEFAULT_CATEGORIES, FinanceYearlyOverview, BtnLink(), Page() (+1 more)

### Community 12 - "Ausgaben- & Aktivitäten-Aggregation"
Cohesion: 0.11
Nodes (29): _aggregate_expense_person_monthly(), _aggregate_expense_person_totals(), api_expenses_balance(), api_expenses_report(), api_generate_activities(), api_list_expenses(), _extract_output_json(), _extract_output_text() (+21 more)

### Community 13 - "Frontend API-Client & Typen"
Cohesion: 0.09
Nodes (19): Birthday, ChoreTask, ExpenseCreate, FinanceIncome, FinanceResponsibleParty, FixedExpenseCategory, FixedExpenseCreate, FixedExpenseInterval (+11 more)

### Community 14 - "Aktivitäten-Ideen-UI"
Cohesion: 0.09
Nodes (13): ActivitiesSettings, DEFAULT, HOME_DURATION_OPTIONS, HOME_MATERIAL_OPTIONS, HOME_THEME_OPTIONS, TRAVEL_OPTIONS, TYPE_OPTIONS, TelegramSettings (+5 more)

### Community 15 - "Aufgaben/Chores-UI"
Cohesion: 0.10
Nodes (16): AufgabenInner(), Chore, Member, RECURRENCE_LABELS, ScoreEntry, EinkaufContent(), BalanceResult, Expense (+8 more)

### Community 16 - "Domain-Utils (Geburtstage/Ausgaben)"
Cohesion: 0.15
Nodes (16): age_on_next_birthday(), birthday_for_year(), build_expense_participants(), collapse_labeled_amounts(), compute_expense_balances(), days_until_birthday(), expense_party_key(), expense_party_label() (+8 more)

### Community 17 - "Geburtstage-UI"
Cohesion: 0.13
Nodes (19): Birthday, BirthdayCard(), BirthdayFormModal(), BirthdayListContent(), BirthdayListInner(), BirthdaySettings, birthMonthIndex(), cardBg() (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (17): StarRating(), getWeeklyPlanHref(), DayEntry, formatDate(), WeeklyHistoryItem, WeeklyPlanHistoryDetailPage(), addDays(), cardStyles (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (16): MEMBER_COLORS, DEFAULT_PANTRY, PantryItem, PantrySuggestion, SettingsData, FamilyMember, Avatar(), DRAWER_ITEMS (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (14): estimateCurrencyLabel(), formatEstimateTotal(), categoryGroups(), pantryGroups(), recipeGroups(), shoppingTextOutput(), splitShoppingItems(), EinkaufDetailContent() (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): options, PREMIUM_TILES, options, PREMIUM_TILES, metadata, TILES, PremiumHubLayout(), PremiumHubTile (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (13): ActivitiesSettings, DEFAULT_SETTINGS, DURATION_OPTIONS, ENERGY_OPTIONS, GOAL_OPTIONS, HomeAlternative, MATERIAL_OPTIONS, MESS_OPTIONS (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (11): ActivitiesSettings, ActivitiesSettingsResponse, ActivityAlternative, DEFAULT_SETTINGS, ENERGY_OPTIONS, GenerateResponse, IO_OPTIONS, styles (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (14): api_get_chore_settings(), api_get_pinboard_categories(), api_get_settings(), api_weekly_shop(), _build_new_week_plan(), _current_week_shop_payload(), _db_get_app_state_json(), _db_get_app_state_value() (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.24
Nodes (11): DisplayMode, HomeLayout, OPTIONS, Theme, UxVersion, applyDisplayMode(), applyHomeLayout(), applyLightBgColor() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (8): metadata, SECTIONS, SETTINGS_GROUPS, buildDateLabel(), HealthAll, Metrics, shortSha(), SystemStatus()

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (10): Birthday, BirthdaySettings, BUDGETS, CONSTRAINTS, DEFAULT_SETTINGS, GIFT_TYPES, GiftIdea, INTERESTS (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (13): _tg_cancel_rows(), _tg_chores_rows(), _tg_clear_state(), _tg_find_family_members(), _tg_find_member_by_name(), _tg_get_state(), _tg_handle_flow_message(), _tg_parse_member_names() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (12): api_generate_home_activities(), api_get_activities_settings(), api_put_activities_settings(), _get_settings_activities(), _normalize_activities_budget(), _normalize_activities_settings(), _normalize_activities_transport(), _normalize_ascii_key() (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (8): ExpenseReport, AuswertungPage(), CATEGORY_COLORS, DonutChart(), fmt(), MONTH_COLORS, MonthlyBarChart(), PERSON_COLORS

### Community 32 - "Community 32"
Cohesion: 0.26
Nodes (10): catBg(), catColor(), Category, catLabel(), DEFAULT_CATEGORIES, Note, NoteCard(), relativeTime() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (10): background_color, categories, description, display, icons, name, orientation, short_name (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (4): BENTO, BentoTile, USE_CASES, UseCase

### Community 35 - "Community 35"
Cohesion: 0.36
Nodes (6): createExpensePayload(), defaultExpenseSelection(), CATEGORIES, NeuePage(), todayIso(), members

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (6): Birthday Feb-29 Leap Year Fix, Expense Stable Member IDs, Next.js Standalone Config Consolidation, Open Balance KPI Correction, Code Review Fixes 2026-03-06, Next.js Frontend (create-next-app)

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (6): Logo Premium Dark, Dual-Color Gradient System, Dark Theme Optimization, House Icon Symbol, Neon Glow Aesthetic, Orbital Network Pattern

### Community 38 - "Community 38"
Cohesion: 0.47
Nodes (6): Premium Hero Dark Banner Image, Dark Theme Design Choice, Premium Tier UI Asset, Cosmic Starfield Background, Teal-Amber Color Palette, Flowing Wave Visual Pattern

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (6): Build Images (GHCR) Workflow, SSH Test (EC2) Workflow, EC2 Compose Stack, Local Dev Compose Stack, Mac Mini Compose Stack, Prod Compose Override

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (5): Logo Premium Light, House Icon Design Element, Orbital Rings Design Element, Warm Orange Color Palette, Light Theme Branding Variant

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (5): Peachy-Coral to Golden-Yellow Palette, Light Theme Variant, Organic Wave and Blur Pattern, Premium Hero Light Image, Warm Gradient Background

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (4): Orange-Gold Glow with Dark Background and Teal Accents, Dark Mode App Icon Design Pattern, Glass Morphism with Glow Effect, Premium Dark Mode App Icon (F0)

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): Family Ops Logo v2 Light, Burnt Orange Color Scheme, FO Monogram Design, Sans-Serif Typography

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): Gradient Background Pattern, Light Theme Color Palette, Home Page Light Theme Background

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): Dark Theme Design System, Gradient Background Design Pattern, Home Page Dark Theme Background Gradient Asset

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): Family Ops Brand Identity, Family Ops Dark Logo (PNG), Neon Dark Visual Aesthetic

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (3): Family Ops Brand Identity, Family Unit Visual Representation, Family Ops Logo (Light Transparent)

## Knowledge Gaps
- **233 isolated node(s):** `Chore`, `Member`, `ScoreEntry`, `RECURRENCE_LABELS`, `RecipeGroup` (+228 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ShoppingListUtilsTest` connect `Shopping-KI & Pantry-Matching` to `API Payload-Modelle`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `apply_ai_categories_to_recipe_items()` connect `Shopping-KI & Pantry-Matching` to `Core API Routes (CRUD)`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `styles` connect `Settings- & Einkaufs-Seiten` to `Community 32`, `Community 35`, `Finanz-Frontend-Seiten`, `Frontend API-Client & Typen`, `Aktivitäten-Ideen-UI`, `Aufgaben/Chores-UI`, `Geburtstage-UI`, `Community 18`, `Community 19`, `Community 21`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Session` (e.g. with `build_per_recipe_output()` and `_collect_recipe_ingredients()`) actually correct?**
  _`Session` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 52 inferred relationships involving `Recipe` (e.g. with `ActivitiesGeneratePayload` and `ActivitiesMoodPayload`) actually correct?**
  _`Recipe` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 51 inferred relationships involving `ShoppingList` (e.g. with `ActivitiesGeneratePayload` and `ActivitiesMoodPayload`) actually correct?**
  _`ShoppingList` has 51 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Lightweight bot check: verifies the Telegram webhook route exists in this app.`, `Only checks whether an AI key env var is present.     No external call unless pr`, `Scheduler health: checks if we have a recent heartbeat stored in DB.     We keep` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._