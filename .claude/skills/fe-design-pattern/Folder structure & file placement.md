---
name: frontend-folder-structure
description: Folder structure and file placement rules for the OpenJustice React frontend (apps/frontend/src/). Use this skill whenever creating new files in the frontend, scaffolding a new feature, adding a component or hook, deciding where a piece of code should live, promoting code from a feature to shared, refactoring folder layout, or whenever the user asks questions like "where should X go?", "should this be a _part or a component?", "should this live in the feature or at root?". Trigger this skill any time frontend file placement is involved, even when the user doesn't explicitly mention folders — placing files correctly is foundational and must be considered before writing them.
---

# Frontend Folder Structure & File Placement

This skill defines **where files live** in `apps/frontend/src/`. It does not cover what the files contain, what they're named, or how they're written internally — those are covered by separate skills (naming conventions, API/query/mutation patterns, container/UI patterns, etc.). When in doubt about file *location*, follow this skill. When in doubt about file *contents*, defer to the relevant sibling skill.

## Why this exists

The frontend follows **feature locality over abstract layers**. Most large React codebases fail by organizing top-down (`services/`, `hooks/`, `utils/`, `components/`) so a single feature ends up scattered across the tree. This codebase organizes bottom-up: every feature is a self-contained unit, and code is only promoted to a shared location when it's genuinely used by multiple features.

The benefits this gives us:
- **Predictable file discovery** — you know where to look for any feature's code without searching
- **Strong encapsulation** — a feature can be deleted, moved, or refactored in isolation
- **Low cognitive load** — you never need to traverse the entire tree to understand one feature
- **Easy promotion path** — code starts local and earns its way up to shared

The cost is some up-front discipline about *where* to place things. This skill is that discipline.

---

## Top-level structure

```
apps/frontend/src/
├── components/              # Cross-feature shared UI components
├── hooks/                   # Cross-feature shared hooks
├── events/                  # Cross-feature event bus
├── lib/                     # Cross-feature pure utilities
├── feature/                 # All features live here
│   └── <feature-name>/
└── pages/                   # Route entry points (thin)
    └── <page>.page.tsx
```

**Rule of thumb:** anything inside `feature/<x>/` is private to that feature. Anything at root (`components/`, `hooks/`, `events/`, `lib/`) is shared and importable by any feature. There is no other category — code is either feature-local or root-shared.

`pages/` is intentionally thin: a page file imports a feature's public entry point and renders it. Pages do not contain business logic.

---

## Feature structure

Every feature lives at `feature/<feature-name>/` and follows this canonical layout:

```
feature/<feature-name>/
├── <feature-name>.ui.tsx          # Public entry point — the ONLY file external code may import
├── <feature-name>.container.tsx   # Container hook (private)
├── api/
│   ├── <feature-name>.api.ts      # Pure async API functions
│   └── cache-keys.ts              # Query/mutation cache keys
├── queries/                       # React Query read hooks
├── mutations/                     # React Query write hooks
├── actions/                       # Workflow orchestration hooks
├── subscriptions/                 # Realtime/WebSocket hooks (only if needed)
├── stores/                        # Zustand stores (only if needed)
├── components/                    # Sub-features owned by this feature
├── _parts/                        # Presentational sub-components
├── hooks/                         # Feature-local utility hooks
└── lib/                           # Pure utility functions for this feature
```

### The Public Entry Rule (most important rule in this skill)

Every feature exposes **exactly one public entry point**: `<feature-name>.ui.tsx`. This is the only file that external code (pages, other features) may import from the feature. Everything else — container, queries, mutations, actions, stores, sub-components — is private.

```typescript
// ✅ Correct: page imports the feature's public entry
import { CaseDashboard } from "@/feature/case-dashboard/case-dashboard.ui";

// ❌ Wrong: importing private internals from another feature
import { useCasesQuery } from "@/feature/case-dashboard/queries/cases.query";
import { useCaseStore } from "@/feature/case-dashboard/stores/case.store";
```

If another feature needs a query, mutation, hook, or component from this feature, that's the signal to **promote** the shared piece to root (see Promotion Rules below). Cross-feature imports of private internals are never allowed.

### Optional folders

Not every feature needs every folder. Create folders only when you have content for them:
- No realtime data? Skip `subscriptions/`.
- No client-side workflow state? Skip `stores/`.
- No reusable utility hooks within the feature? Skip `hooks/`.
- No pure helpers? Skip `lib/`.

Empty folders are noise. Add them when the first file lands.

---

## Sub-feature structure (`components/<sub-feature>/`)

A sub-feature is a chunk of UI inside a feature that is **self-contained enough to own its own data**. Sub-features go in `feature/<feature>/components/<sub-feature>/` and mirror the feature structure at a smaller scale:

```
feature/<feature>/components/<sub-feature>/
├── <sub-feature>.ui.tsx           # Public entry for this sub-feature
├── <sub-feature>.container.tsx    # Container hook
├── api/                           # Sub-feature owns its own API calls
│   ├── <sub-feature>.api.ts
│   └── cache-keys.ts
├── queries/                       # Sub-feature's own queries
├── mutations/                     # Sub-feature's own mutations
├── _parts/                        # Sub-feature's presentational pieces
└── hooks/                         # Sub-feature-local utility hooks
```

### Sub-feature locality rule

A sub-feature owns **its own** API, queries, and mutations when those endpoints are only used inside that sub-feature. This is what makes sub-features self-contained — they can be moved, refactored, or extracted without untangling shared dependencies.

If an API endpoint or query is used by **multiple** sub-features within the same feature, promote it up one level to the feature's `api/`, `queries/`, or `mutations/` folder. If it's used across multiple **features**, the sub-feature has outgrown the feature it lives in — see the 3-level cap below.

```
# ✅ Correct: sub-feature owns its data
feature/dashboard/
├── api/dashboard.api.ts                  # Used by multiple sub-features
└── components/
    └── analytics-panel/
        └── api/
            └── analytics-panel.api.ts    # Used only by analytics-panel
```

---

## `_parts/` vs `components/` — placement decision

Both folders hold sub-components. The distinction is about **data ownership**, and it determines where the file goes:

| If the component... | It goes in... |
|---|---|
| Receives all data via props from its parent | `_parts/` |
| Has its own data fetching, mutations, or store access | `components/<name>/` |

### `_parts/` — flat, presentational

```
feature/<feature>/_parts/
├── header.part.tsx
├── empty-state.part.tsx
└── item-row.part.tsx
```

`_parts/` is a flat folder of presentational pieces. No sub-folders. No `api/`, `queries/`, or `mutations/` inside. A part receives everything it needs through props from the feature's container.

### `components/` — nested, self-contained

```
feature/<feature>/components/
├── analytics-panel/
│   ├── analytics-panel.ui.tsx
│   ├── analytics-panel.container.tsx
│   ├── api/
│   ├── queries/
│   └── _parts/
└── filter-bar/
    ├── filter-bar.ui.tsx
    └── filter-bar.container.tsx
```

`components/` is a folder of sub-features, each in its own subfolder. They have containers, may have their own data layer, and are imported by the parent like any other component.

### Promotion: `_parts/` → `components/`

When a `_parts/` component grows and starts wanting its own data (a query, a store, complex internal state), that's the signal to promote it. Move it from `_parts/<name>.part.tsx` to `components/<name>/<name>.ui.tsx`, give it a container, and pull the data fetching down into it. The parent stops passing data through props and just renders the sub-feature instead.

This promotion is a normal, expected part of how features grow. Don't pre-emptively put things in `components/` — start in `_parts/` and promote when there's a real reason.

---

## `lib/` — pure functions and business logic

`lib/` folders hold **pure functions**: code with no React, no side effects, no I/O, and no state. They take inputs and return outputs. This includes both generic utilities (date formatting, string helpers) and domain-specific business logic (case score calculations, citation parsers, timeline event transformers). Both belong in `lib/` — there is no separate folder for "business logic" as opposed to "utilities."

### What goes in `lib/`

Examples of files that belong here:
- A function that transforms a form's values into an API DTO shape (`transform-form-to-dto.ts`)
- A function that computes a derived value from one or more inputs — totals, scores, status flags (`calculate-case-score.ts`)
- A function that parses or formats a domain-specific string (`parse-citation.ts`, `format-case-number.ts`)
- A function that filters, sorts, or groups a collection in a domain-specific way (`group-events-by-day.ts`)
- Generic helpers like `cn()` (className merger), date formatters, currency formatters

The common thread: given the same inputs, they always return the same outputs. They can be tested in isolation with no setup.

### What does NOT go in `lib/`

- Anything that calls a React hook → goes in `hooks/`
- Anything that fetches data → goes in `api/`
- Anything that reads or writes a Zustand store → that logic belongs in the store itself
- Anything React-specific (uses `useState`, returns JSX, depends on `useEffect`) → goes in a component, hook, or container

If a file in `lib/` would need to import from `react`, it's in the wrong folder.

### Where `lib/` folders exist

`lib/` may exist at any level — feature, sub-feature, or root — and follows the same promotion rules as everything else:

- `feature/<feature>/lib/` — pure functions used only by this feature
- `feature/<feature>/components/<sub>/lib/` — pure functions used only by this sub-feature
- `src/lib/` — pure functions used by 2+ features (generic utilities or shared domain logic)

Start local. Promote only when something is genuinely shared.

### Naming `lib/` files (brief — full conventions live in the naming skill)

- One file per major function or per cohesive group of related helpers
- Kebab-case file names that describe the function or domain
- Verb-noun for transformations and calculations: `transform-form-to-dto.ts`, `calculate-case-score.ts`, `parse-citation.ts`
- Noun for collections of related helpers: `date.ts`, `currency.ts`, `string.ts`
- Prefer many small focused files over a single large `utils.ts`. `utils.ts` becomes a junk drawer; named files stay greppable and tell the next reader what's inside before they open it.

---

## The 3-level nesting cap

A sub-feature inside `components/` may have its own `_parts/` and its own `components/`. But it may **not** have a sub-sub-feature with another `components/` folder. That's three levels of feature nesting and the codebase becomes hard to navigate.

```
# ❌ Wrong: too deeply nested
feature/dashboard/
└── components/
    └── analytics/
        └── components/
            └── chart-builder/
                └── components/
                    └── axis-config/         # This is too deep

# ✅ Correct: extract to a sibling top-level feature
feature/dashboard/
feature/analytics/                            # Promoted out
feature/chart-builder/                        # Promoted out
```

When you hit the cap, the inner sub-feature has earned the right to be a top-level feature on its own. Move it to `feature/<name>/`, and the parent feature imports it through its public entry like any other feature.

---

## Cross-feature shared code (root-level)

Code is promoted to a root-level shared folder when **two or more features need it**. Until then, keep it local to the feature.

| Root folder | What lives there | Example |
|---|---|---|
| `src/components/` | UI components used by 2+ features | Data table, rich text editor, file uploader |
| `src/hooks/` | Hooks used by 2+ features | `use-current-user.hook.ts`, `use-current-organization.hook.ts` |
| `src/events/` | Cross-feature event bus | `event-bus.ts` |
| `src/lib/` | Pure utility functions used by 2+ features | `format-date.ts`, `cn.ts` |

### Promotion rules

1. **Build it inside the feature first.** New components and hooks always start as feature-local. Resist the urge to put things in root "just in case."
2. **When a second feature needs it, promote it.** Move the file from `feature/<a>/components/<x>/` to `src/components/<x>/`. Update both call sites.
3. **The promoted code follows the same internal structure** as a sub-feature: it has its own `<x>.ui.tsx`, container, and may have its own `api/`, `queries/`, etc. The only difference is that it lives at root and is importable from anywhere.
4. **Don't promote based on speculation.** "We *might* need this elsewhere" is not a reason. One real second use case is.

### Demotion is fine too

If a piece of shared code ends up only being used by one feature (after deletes or refactors), move it back into that feature. Shared code carries a coordination cost; only pay it when there's actual sharing.

---

## Where pages fit in

Pages are thin route entry points. A page file imports one or more feature public entries and renders them.

```typescript
// pages/case-dashboard.page.tsx
import { CaseDashboard } from "@/feature/case-dashboard/case-dashboard.ui";

export default function CaseDashboardPage() {
  return <CaseDashboard />;
}
```

Pages do not contain feature logic, do not call queries/mutations, and do not hold state. If a page is doing more than rendering a feature, the logic belongs inside the feature.

---

## Decision flowchart

When placing a new file, walk this in order:

1. **Is it a route entry?** → `pages/<name>.page.tsx`
2. **Is it a pure function with no React, no I/O, no state?** → a `lib/` folder (feature-local if used by one feature, `src/lib/` if shared)
3. **Will it be used by 2+ features?** → root-level (`src/components/`, `src/hooks/`, `src/lib/`)
4. **Is it specific to one feature?** → inside that feature's folder
5. **Inside the feature, does it have its own data/state?**
   - Yes → `components/<name>/`
   - No (props-only) → `_parts/<name>.part.tsx`
6. **Is it a hook used across multiple files inside the feature, but not outside?** → `feature/<feature>/hooks/`
7. **Are you about to create a third level of nested `components/`?** → stop, extract the inner sub-feature to a sibling top-level feature instead

---

## Quick reference: what goes where

| File or concept | Location |
|---|---|
| Feature public entry | `feature/<feature>/<feature>.ui.tsx` |
| Feature container hook | `feature/<feature>/<feature>.container.tsx` |
| Feature's API functions | `feature/<feature>/api/<feature>.api.ts` |
| Feature's queries | `feature/<feature>/queries/` |
| Feature's mutations | `feature/<feature>/mutations/` |
| Feature's actions | `feature/<feature>/actions/` |
| Feature's stores | `feature/<feature>/stores/` |
| Feature's realtime subscriptions | `feature/<feature>/subscriptions/` |
| Feature-local utility hooks | `feature/<feature>/hooks/` |
| Feature-local pure utilities / business logic | `feature/<feature>/lib/` |
| Sub-feature with own data | `feature/<feature>/components/<sub>/` (with its own `<sub>.ui.tsx`) |
| Presentational sub-component | `feature/<feature>/_parts/<name>.part.tsx` |
| Cross-feature shared component | `src/components/<name>/<name>.ui.tsx` |
| Cross-feature shared hook | `src/hooks/<name>.hook.ts` |
| Cross-feature event bus | `src/events/event-bus.ts` |
| Cross-feature pure utility / shared business logic | `src/lib/<name>.ts` |
| Page entry point | `pages/<page>.page.tsx` |

---

## What this skill does NOT cover

These are intentionally out of scope and live in their own skills:
- **Full file naming conventions** (suffixes, kebab-case, `.ts` vs `.tsx`) — separate skill. This skill includes brief naming hints for `lib/` files since they're directly tied to placement, but defer to the naming skill for the complete rules.
- **What goes inside each file** (API shape, query patterns, container shape) — separate skill per layer
- **Container vs UI split rules** (when to extract `.container` from `.ui`) — separate skill
- **Barrel exports / import path rules** — separate skill
- **State management rules (Zustand patterns, React Query usage)** — separate skill

When working on file placement, stay in this skill. When working on what a file *contains* or what it's *named*, defer to the relevant sibling skill.
