# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Madu Plus Tualang" — an e-commerce + affiliate/reseller commission portal MVP for a Malaysian raw wild honey (Madu Tualang) and Virgin Coconut Oil brand. Originally scaffolded in Google AI Studio (see `metadata.json`, `assets/.aistudio/`).

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server on http://localhost:3000 (--host=0.0.0.0)
npm run build     # production build via vite build
npm run preview   # preview the production build
npm run lint      # type-check only (tsc --noEmit) — there is no separate lint config/ESLint
npm run clean     # rm -rf dist server.js
```

There is no test suite/framework configured in this repo. There is no ESLint/Prettier config — `npm run lint` is purely a TypeScript type-check.

## Environment

Configured via `.env` (see `.env.example`):
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — optional; enables cloud persistence via Supabase. When absent, the app runs fully offline against `localStorage`.
- `GEMINI_API_KEY`, `APP_URL` — injected by AI Studio at runtime; `@google/genai` is a listed dependency but is **not currently referenced anywhere in `src/`**.

## Architecture

**Single-page React 19 app, no router.** `src/App.tsx` renders one `MainLayout` that manages navigation via local component state (`currentTab`: home/search/cart/account, and `activeSubPanel`: affiliate/agent/admin/profile_editor/null) rather than URL routes. All views are conditionally rendered inside one component tree.

### State: one giant context, no backend server

`src/context/AppContext.tsx` (~2000 lines) is the entire application's data and mutation layer — there is no Express/API backend in active use (despite `express` being a dependency). Every entity (products, orders, affiliates, agents, user accounts/profiles, addresses, bank accounts, CMS config/pages, audit logs, inventory, stock movements, campaigns, etc.) lives as `useState` here, and every mutation is a method exposed through `AppContextType` and consumed via `useAppState()`.

**Dual persistence model — this is the key thing to understand before touching any mutator:**
1. **localStorage is the source of truth for the current session.** Every state slice has a matching `useEffect` that serializes it to a `mp_*` localStorage key on every change, and is hydrated from that key on mount (see the two long blocks of `useState(() => localStorage.getItem(...))` initializers and `useEffect(() => localStorage.setItem(...))` synchronizers near the top of the file).
2. **Supabase is optional, best-effort, write-through cloud sync**, gated by `isSupabaseConfigured` (`src/lib/supabase.ts`). If configured, on mount the app pulls all tables in parallel and overwrites local state (`loadSupabaseData`). Thereafter, every mutator that changes persisted data calls the matching `supabaseDb.upsertX(...)` (fire-and-forget, not awaited for UI purposes in most setters) in addition to updating React state + localStorage.

When adding or changing a mutation in `AppContext.tsx`, you generally need to touch **three** places together: the React state setter, the localStorage sync effect (if a new state slice), and the `supabaseDb` call — otherwise local/offline and cloud-connected sessions will silently diverge.

`src/lib/supabase.ts` also owns:
- `getSupabaseSQLSchema()` — a hand-maintained SQL string (tables + RLS "allow all" policies) shown to users to paste into the Supabase SQL editor. **When adding a new persisted entity/column, update the TypeScript interface in `types.ts`, the `mapX`/upsert row-mapping functions in `supabase.ts`, and this SQL string together** — they are not generated from one schema and will drift if only one is edited. `supabase-schema.sql` at the repo root is a duplicate/reference copy of this schema.
- snake_case (DB) ↔ camelCase (TS) mapping is manual per-entity (`mapProduct`, `mapAgent`, etc.) — there's no ORM.

### Domain model (`src/types.ts`)

Four user roles share one `UserAccount`/`UserProfile` pair (`userType`: customer/affiliate/agent/admin), each optionally augmented by a role-specific record:
- **Affiliate** — referral-code-based commission earner. Tiers (Bronze/Silver/Gold) are computed automatically from `unitsSold` (`getTierFromUnits` in AppContext), each with a fixed commission rate (`getCommissionRate`: 10/15/20%). Affiliates can recruit other affiliates (`recruitedBy`), tracked via referral codes in the URL (`?ref=CODE`), persisted to `localStorage` (`mp_referral_code` / legacy-cased `MP_referral_code` — both keys are read for backwards compatibility) and applied at registration/checkout.
- **Agent** — wholesale reseller who buys bulk stock at a discount and resells from a personal micro-store inventory (`stockBalance`). Tier is chosen at signup (not auto-promoted like affiliates) and fixes discount rate, commission rate, min purchase, and starting inventory (see the tier tables in `registerAgentEx`).
- **Admin** — HQ operations: order/user/inventory/CMS/affiliate/agent/audit management, all inside `AdminOperations.tsx`.

Note `Affiliate.tier` vs `Agent.agentTier` — deliberately different field names for the same `TierType` concept; don't conflate them.

There's a second, mostly-parallel "advanced inventory" schema (`InventoryItem`, `StockMovement`, `StockAlert`, `ProductPricingHistory`, `ProductVariant`, `ProductSupplier`, `ProductCategory`) layered on top of the simpler `Product.stock` field — driven by `InventoryManager.tsx`. Basic stock (used by checkout/cart) lives on `Product.stock` directly; the advanced warehouse-style tracking (`warehouseId` maps to `Branch.id`) is a separate, richer ledger that doesn't automatically stay in sync with `Product.stock`.

### Components (`src/components/`)

Each top-level view is one large, mostly self-contained component that pulls everything it needs from `useAppState()` — there's minimal prop-drilling and no smaller shared sub-component library beyond what's in each file. Notable sizes: `AdminOperations.tsx` (~4400 lines, tab-based: orders/users/inventory/cms/affiliates/agents/audit/db_viewer) and `InventoryManager.tsx` (~2200 lines) are the largest; expect to use `Grep` for specific `useState`/tab-name symbols rather than reading these files in full.

### i18n

Bilingual English/Malay throughout. There is no i18n library — components inline `language === 'ms' ? '...' : '...'` conditionals directly in JSX (see `src/lib/translations.ts` for the shared string table, and `App.tsx`/`Navbar.tsx` for inline examples). `language` state lives in `AppContext` and persists to `mp_language` in localStorage.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 uses CSS-based config, see `src/index.css`). Design language mimics Shopee-style e-commerce UI (orange `#EE4D2D` accents, bottom tab bar navigation, card-based layouts). Icons from `lucide-react`.

### Path alias

`@/*` resolves to the repo root (configured in both `vite.config.ts` and `tsconfig.json`) — e.g. `@/src/lib/supabase`.
