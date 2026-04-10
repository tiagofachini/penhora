# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Generate llms.txt then Vite production build
npm run lint      # ESLint (quiet mode — only errors, no warnings)
```

There is no test runner configured in this project.

## Architecture

**Stack:** React 18 + Vite SPA. Supabase handles auth, PostgreSQL database, and Edge Functions. Tailwind CSS + Radix UI for styling. `@` alias maps to `src/`.

### Auth Flow (`src/contexts/SupabaseAuthContext.jsx`)

Central auth context wraps the entire app. Exposes: `signUp`, `signIn`, `signInWithGoogle`, `signInWithOtp`, `resetPassword`, `signOut`. The production domain is `https://go.penhora.app.br` (used as `emailRedirectTo` for all auth flows). Admin status is determined via `supabase.rpc('is_admin')`.

### Routing (`src/App.jsx`)

Three route tiers:
- **Public** (`/`, `/benefits`, `/login`, `/signup`, etc.) — `Header` shown on landing pages but not on auth pages
- **Authenticated** — wrapped in `<ProtectedRoute><DashboardLayout /></ProtectedRoute>`, covers `/dashboard`, `/processes/**`, `/calendar`, `/account`, `/team`, `/audit`, `/items/**`
- **Admin-only** — wrapped in `<AdminRoute><DashboardLayout /></AdminRoute>`, covers `/admin`

### Supabase Client (`src/lib/customSupabaseClient.js`)

Single client instance exported as both `default` and named `supabase`. The anon key and project URL are hardcoded (project: `hsvxxhvfmgzopkfyhuac`). All database operations go through this client directly from page components.

### Key Database Tables

- `processes` — main seizure records (owned by `user_id`)
- `seized_items` — items linked to a process
- `team_members` — collaboration: `owner_id`, `member_email`, `member_id`, `role`
- `activity_logs` — audit trail written via `src/lib/logger.js` (`logActivity`)
- `subscriptions` — plan limits (`seizure_limit`, `item_limit`)

### External API Integrations (`src/lib/`)

- **`cnjApi.js`** — CNJ DataJud public API (Brazilian court data) via `corsproxy.io` proxy, ElasticSearch queries for process lookup
- **`visionApi.js`** — image/barcode recognition
- **`eanApi.js`** — EAN barcode product lookup
- **`adminApi.js`** — calls the `create-admin-user` Supabase Edge Function (requires service role key)

### UI Components

All Radix UI primitives are re-exported from `src/components/ui/` with Tailwind styling. Use existing components from that directory; do not add new UI libraries.

### Dev-only Vite Plugins

`plugins/visual-editor/` contains inline editing and selection mode plugins that only load in development (`isDev`). These are part of the Horizons platform and should not be modified.
