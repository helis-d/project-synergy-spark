# North production rollout

## Direction

North will remain on the supported **TanStack Start + React 19** foundation rather than being rewritten to Next.js. The requested product structure will be implemented with equivalent TanStack routes, server functions, and modules. This avoids a risky framework rewrite while preserving SSR, code splitting, metadata, and server-only boundaries.

The rollout will keep the app working at every milestone. The first approved milestone is the English interface and four-theme system; later milestones add cloud data, AI, collaboration, subscriptions, and release infrastructure.

## Phase 1 — English interface and four themes

- Replace every Turkish user-facing string, metadata string, locale, error, notification, tooltip, onboarding message, and code comment with English.
- Add a small translation layer with English as the source and fallback, plus prepared catalogs for Turkish, German, and Spanish and RTL-ready document direction.
- Replace the time-of-day theme model with `Auto`, `Sky`, `Dawn`, `Ember`, and `Midnight` preferences stored independently from documents.
- In Auto mode, map the operating-system preference to Sky or Midnight; explicit theme choices remain persistent in local storage.
- Rebuild semantic CSS tokens for the supplied palettes, with 300 ms transitions and accessible contrast for text and controls.
- Import the four supplied logo images through the app asset flow and map them by their visual identity:
  - Sky: blue logo on the light background
  - Dawn: white logo on the pastel background
  - Ember: cream logo on the purple-red-orange background
  - Midnight: gold logo on the dark purple background
- Add a reusable theme-aware logo at the top-left and a centered loading treatment. Add an Appearance panel under Settings.
- Generate lightweight per-theme favicon files from the supplied artwork and switch the favicon instantly with the theme. Update the manifest icon and English metadata.
- Preserve the current editor layout and interaction model; this phase changes language, theme behavior, and brand presentation only.
- Verify desktop and mobile layouts, keyboard operation, contrast, theme persistence, Auto mode, favicon changes, and a clean build.

## Phase 2 — Local-first editor foundation

- Introduce a typed app store for editor/UI state and migrate durable documents, branches, versions, comments, preferences, and pending sync operations from localStorage to IndexedDB.
- Keep a safe one-time migration from existing North documents.
- Change autosave to a three-second debounce with explicit saving, saved, offline, sync-pending, conflict, and error states.
- Keep TanStack Query responsible for remote state and cache invalidation; keep transient editor state outside the server cache.
- Lazy-load heavy dialogs and comparison tools, audit output chunks, and add performance budgets.

## Phase 3 — Branching as the core workflow

- Extend branch records with stable IDs, author, timestamps, parent/base version, and change summaries.
- Add branch creation, rename, archive/delete safeguards, history, and recovery.
- Add word-level diff with semantic addition/deletion tokens and accessible non-color indicators.
- Add side-by-side and overlaid comparison modes with keyboard navigation.
- Add deterministic merge and explicit conflict resolution; add AI-assisted merge only after the AI server path is ready.
- Persist every AI insertion and merge as a version-history event.

## Phase 4 — Managed accounts and cloud sync

- Enable Lovable Cloud and use managed email/password plus Google sign-in. GitHub sign-in is intentionally excluded per your choice.
- Add profiles containing display name, avatar, preferred theme, and language.
- Add documents, branches, versions, AI conversations, templates, collaborators, comments, notifications, usage, and subscription records.
- Store roles in a separate roles table. Add grants and Row Level Security so users can access only owned or explicitly shared content.
- Add protected app areas for documents, branches, templates, settings, account export, and account deletion.
- Implement IndexedDB-backed sync queues and explicit conflict review; never silently resolve concurrent edits with last-write-wins.

## Phase 5 — Secure AI writing

- Consolidate AI calls behind server-only functions/routes with streaming output, validation, bounded retry behavior, token accounting, and rate limits.
- Use Lovable AI as the safe managed default. Add optional BYOK provider adapters only where keys can be encrypted server-side; keep the Electron secure store for desktop-local keys.
- Support Continue, Rewrite, Summarize, Translate, Change tone, Suggest branch, and Merge branches.
- Save prompts, outputs, model metadata, usage, and resulting versions without exposing secrets to the browser.
- Keep Ollama desktop/local-only and label its availability clearly.

## Phase 6 — Collaboration and offline publishing

- Add real-time collaborators, colored presence/cursors, anchored comments, mentions, and branch/comment notifications.
- Use a conflict-aware collaboration model rather than last-write-wins.
- Add guarded offline support using the existing manifest plus generated Workbox service worker, disabled in development and Lovable previews.
- Queue edits offline and show a review screen when reconnecting changes conflict.

## Phase 7 — Plans, security, analytics, and compliance

- Add built-in payments with Free, Pro, and Team entitlements; enforce document and AI limits server-side and show usage warnings.
- Add Content Security Policy and security headers, server validation, XSS/SSRF regression coverage, CSRF controls, abuse limits, and audit events.
- Add data export and deletion workflows; document retention and privacy behavior. Treat end-to-end encryption as a separate Pro capability with clearly documented sharing limitations.
- Add privacy-aware product analytics, error monitoring, and web performance measurement for the requested engagement and retention metrics.

## Phase 8 — Quality, documentation, and release

- Expand Vitest and React Testing Library coverage toward 80% on core modules and critical components.
- Add Playwright coverage for authentication, theme switching, editing/autosave, branch compare/merge, offline conflict review, AI streaming, and subscription limits.
- Add lint, formatting, tests, build, migration checks, and bundle budgets to CI. Add pre-commit checks without rewriting Git history.
- Add English README, CONTRIBUTING, CHANGELOG, environment template, user guide, architecture/security notes, OpenAPI documentation, deployment and rollback runbooks.
- Add route-specific metadata, sitemap, robots rules, and JSON-LD where applicable.
- Run responsive, accessibility, security, bundle, and Lighthouse audits. Record measured results rather than promising scores before measurement.
- Produce the requested two-minute demo after the tested product flows are complete. Repository sync/push remains a user-authorized Git workspace action.

## Technical notes

- TanStack route groups will provide the requested auth, documents, branches, templates, settings, docs, and API surfaces.
- No API key, privileged credential, prompt policy, or admin operation will enter the browser bundle.
- All new TypeScript remains strict with no `any` and no non-null assertions.
- All visual colors remain semantic CSS custom properties; component code will not contain raw color values.
- Uploaded logo images are app assets; small favicon derivatives remain real files in `public/`.
- Each phase ends with focused tests, browser verification at desktop/mobile sizes, and a clean preview build before the next phase begins.
