---
name: frontend-imports-and-encapsulation
description: Import rules and encapsulation boundaries for the OpenJustice React frontend — the one-public-entry-per-feature rule, what code may cross feature boundaries, the `@/` alias requirement, when relative paths (`./`) are acceptable, and the barrel exports (`index.ts`) policy including where they're banned and where they're encouraged. Use this skill whenever writing or reviewing an import statement, deciding whether to expose something across feature boundaries, considering creating an `index.ts`, deciding between `@/` and `../`, or whenever the user asks "can I import this from here", "should I make a barrel", "why can't I import that hook directly", or anything about feature public surfaces. Trigger this skill any time imports or feature boundaries are involved — getting these wrong silently erodes encapsulation over time.
---

# Frontend Imports & Encapsulation

This skill defines **what may be imported from where, and how the import is written**. It enforces feature encapsulation through import-time rules, controls the use of barrel files (`index.ts`), and standardizes import path style.

For where files physically live, see the folder structure skill. For what the files are named, see the naming skill. This skill picks up at the line `import ... from ...`.

## Why this matters

Imports are the contract between parts of the codebase. Every line of `import` is one module saying "I depend on this." A loose import policy means features become tangled — Feature A reaches into Feature B's internals, and now B can't be refactored without breaking A. A strict import policy keeps features independently evolvable.

The rules here optimize for three things:
- **Encapsulation** — features can be refactored, moved, or rewritten in isolation because external code only depends on their public surface.
- **Refactor-resilience** — moving a file rarely breaks unrelated imports because paths are absolute and barrels don't proliferate.
- **Bundle quality** — barrel files are constrained so tree-shaking continues to work and dev builds stay fast.

---

## The Public Entry Rule

Every feature exposes **exactly one public entry point**: its `<feature>.ui.tsx` file. This is the only file from inside `feature/<x>/` that any external code may import.

Everything else in a feature is **private**:
- The container (`<feature>.container.ts(x)`)
- Queries, mutations, actions, subscriptions
- Stores
- Sub-features inside `components/`
- `_parts/`
- Feature-local hooks and lib functions

```typescript
// ✅ Correct: import the feature's public entry
import { CaseDashboard } from "@/feature/cases/cases.ui";

// ❌ Wrong: importing private internals from another feature
import { useCasesQuery } from "@/feature/cases/queries/cases.query";
import { useCaseStore } from "@/feature/cases/stores/case.store";
import { HeaderPart } from "@/feature/cases/_parts/header.part";
import { useCaseDashboardContainer } from "@/feature/cases/cases.container";
```

### Why exactly one entry

The public entry is the encapsulation seam. With one file as the contract, the entire rest of the feature can change without breaking external callers. The moment you have two or more public entry points, you've created multiple coupling surfaces, and refactoring requires checking every call site of every entry. One entry, one boundary.

### What if I genuinely need to share something?

If another feature needs a query, mutation, hook, or component from this feature, that's a signal — not an excuse to break the rule. Two options:

1. **Promote it to root.** If the piece is reusable, it doesn't belong to one feature. Move it to `src/components/`, `src/hooks/`, or `src/lib/`. Now both features (and any future ones) import it from root.
2. **The piece is actually two pieces.** Sometimes "I need this query in another feature" really means "this query is doing a lot, and one piece of what it does is generic." Extract the generic piece, promote that, and leave the feature-specific orchestration in place.

If neither feels right and you're tempted to reach into another feature's internals, the boundaries are wrong. Fix the structure rather than punching through it.

### What's allowed within a feature

Inside a feature, files import each other freely. The container imports from queries, mutations, actions, and stores. The UI imports from the container. Sub-features import from their own internals. The boundary is at the **feature** level, not within it.

```typescript
// Inside feature/cases/cases.container.ts — all of these are fine
import { useCases } from "@/feature/cases/queries/cases.query";
import { useDeleteCaseMutation } from "@/feature/cases/mutations/delete-case.mutation";
import { useSubmitCase } from "@/feature/cases/actions/submit-case.action";
import { useCaseStore } from "@/feature/cases/stores/case.store";
```

A feature has no internal encapsulation between its own folders. Treat the whole feature as a single unit; treat its public entry as the only thing the outside world sees.

### What's importable across boundaries

Crossing a feature boundary is allowed for:

- **A feature's `<feature>.ui.tsx`** (the one public entry)
- **Any root-level shared code**: `src/components/<x>/`, `src/hooks/`, `src/lib/`, `src/events/`
- **Monorepo packages**: `@packages/core`, etc.

Crossing a feature boundary is **never** allowed for:

- Queries, mutations, actions, subscriptions of another feature
- Stores of another feature
- Container hooks of another feature
- `_parts/` of another feature
- Sub-features inside another feature's `components/` folder
- Feature-local hooks and lib functions of another feature

If you find yourself wanting to do any of these, see "What if I genuinely need to share something?" above.

---

## The `@/` alias rule

All imports that cross folder boundaries use the **`@/` alias** (which resolves to `apps/frontend/src/`). Relative paths with `../` are not used.

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button/button.ui";
import { useCurrentUser } from "@/hooks/use-current-user.hook";
import { CaseDashboard } from "@/feature/cases/cases.ui";
import { formatDate } from "@/lib/date";

// ❌ Wrong: relative paths going up the tree
import { Button } from "../../../components/ui/button/button.ui";
import { CaseDashboard } from "../cases/cases.ui";
import { formatDate } from "../../../lib/date";
```

### Why `@/` and not `../`

- **Refactor-resilience.** When you move a file, the `@/` imports inside it still work. Relative paths break and need to be rewritten.
- **Readability.** `@/feature/cases/cases.ui` tells you exactly where the code lives. `../../../cases/cases.ui` doesn't — you have to count `..`s and trace mentally.
- **Consistency.** Every cross-folder import looks the same regardless of how far apart the source and destination are.

### When `./` is acceptable

Relative paths with `./` (no `../`) are allowed for imports that stay at the current level or go down into a direct subfolder. Anything that requires `../` uses `@/`.

```typescript
// Inside feature/cases/cases.container.ts:
import { useCases } from "./queries/cases.query";              // ✅ down into subfolder, OK
import { HeaderPart } from "./_parts/header.part";             // ✅ down into subfolder, OK

// Inside feature/cases/queries/cases.query.ts:
import { fetchCases } from "../api/cases.api";                 // ❌ goes up — use @/
import { fetchCases } from "@/feature/cases/api/cases.api";    // ✅
```

The reason `./` works when going down: the relationship is local to the file's own folder, and you can read the path without counting hops. The reason `../` doesn't: as soon as you're going up, you're effectively addressing the absolute tree from a relative anchor, which is exactly the readability problem `@/` exists to solve.

### Same-folder imports

Same-folder imports always use `./`:

```typescript
// Inside feature/cases/queries/cases.query.ts
import { caseQueryKeys } from "./cache-keys";   // ✅ same folder
```

These are local enough that `@/` would be noise.

---

## Barrel exports policy

A **barrel** is an `index.ts` (or `index.tsx`) file that re-exports from sibling files. They're used to consolidate a folder's public surface into one import path:

```typescript
// src/components/ui/index.ts (a barrel)
export { Button } from "./button/button.ui";
export { Input } from "./input/input.ui";
export { Dialog } from "./dialog/dialog.ui";
```

```typescript
// Consumer
import { Button, Input, Dialog } from "@/components/ui";
```

Barrels are useful in some places and harmful in others. The rules below are not stylistic — they reflect real costs (build performance, tree-shaking, encapsulation).

### Where barrels are banned

**Feature internals.** Never create an `index.ts` inside `feature/<x>/` that re-exports queries, mutations, hooks, stores, or components.

```typescript
// ❌ Banned: feature/cases/index.ts
export { CaseDashboard } from "./cases.ui";
export { useCases } from "./queries/cases.query";
export { useCaseStore } from "./stores/case.store";
```

This violates the public entry rule by creating multiple coupling surfaces. Anything in the barrel becomes part of the feature's effective public API, which is supposed to be exactly one file.

**Sub-feature internals.** Same reason — sub-features have their own `<sub>.ui.tsx` as the public entry. No barrels inside `feature/<x>/components/<sub>/`.

**`api/`, `queries/`, `mutations/`, `actions/`, `stores/`, `subscriptions/`.** These folders are organized by file. There's no aggregate "the queries module" — each query is a separate hook with its own import path. Adding a barrel here invites callers to grab the whole bundle when they only need one hook.

**Mixed-bag root indexes.** A `src/utils/index.ts` that re-exports from many unrelated submodules is a junk drawer. Don't create one.

### Where barrels are appropriate

**Design system primitives** at `src/components/ui/`. The design system has a stable, cohesive surface and many of its components are imported together. A single barrel is genuinely better than a dozen separate imports per file.

```typescript
// ✅ Good barrel
import { Button, Input, Dialog, Card } from "@/components/ui";
```

**Cohesive utility modules** at `src/lib/<module>/`. When a `lib/` folder represents one conceptual module with several related functions, a barrel exposing them is fine:

```typescript
// src/lib/date/index.ts
export { formatDate } from "./format-date";
export { parseDate } from "./parse-date";
export { addDays } from "./add-days";

// Consumer
import { formatDate, addDays } from "@/lib/date";
```

The test: would a reader expect these functions to be one module? If yes, a barrel is appropriate.

**Monorepo package public APIs.** A package like `@packages/core` exposes its surface through a single entry point. This is the canonical case for a barrel.

### What makes a barrel "good"

When you do create a barrel, follow these rules:

1. **Named re-exports only.** Use `export { X } from './x'`, never `export * from './x'`. Named re-exports are easier for bundlers to analyze and for humans to grep.
2. **No side effects.** A barrel file should contain only re-exports — no top-level code, no module-level initialization, no calls. Side effects defeat tree-shaking.
3. **Cohesive surface.** Every re-export should belong to the same conceptual module. If you can't describe the barrel in one short phrase ("design system primitives," "date utilities"), it's probably a junk drawer.
4. **Stable API.** The barrel's contents change rarely and intentionally. If you find yourself adding and removing exports often, the surface isn't actually cohesive.

```typescript
// ✅ Good barrel
// src/components/ui/index.ts
export { Button } from "./button/button.ui";
export { Input } from "./input/input.ui";
export { Dialog } from "./dialog/dialog.ui";

// ❌ Bad barrel: export * (harder to analyze, harder to grep)
export * from "./button/button.ui";

// ❌ Bad barrel: side effects
import { initToastSystem } from "./toast/init";
initToastSystem(); // module-level side effect
export { Toast } from "./toast/toast.ui";

// ❌ Bad barrel: mixed bag
export { Button } from "./button/button.ui";
export { useCurrentUser } from "../../hooks/use-current-user.hook";
export { formatDate } from "../../lib/date";
```

### What about modern bundlers handling barrels?

Vite and modern Webpack do tree-shake well-behaved barrels, but the cost isn't only bundle size:

- **Dev mode performance**: even with tree-shaking, the bundler often needs to evaluate every file referenced by the barrel during development. A 30-file barrel makes initial load slower.
- **IDE responsiveness**: large barrels slow down go-to-definition and autocomplete.
- **Encapsulation drift**: barrels make it easy to dump unrelated things into one import path, which compounds over time.

The rules above are not "barrels are slow, avoid them." They're "barrels have specific tradeoffs, use them where the tradeoffs are positive."

---

## Decision flowchart

When writing an import:

1. **Is the destination in the same folder?** → use `./` (e.g., `./cache-keys`)
2. **Is the destination in a direct subfolder of the current folder?** → `./` is acceptable (e.g., `./queries/cases.query`)
3. **Does the path need `../`?** → use `@/` instead
4. **Is the destination inside another feature?** → it must be that feature's `<feature>.ui.tsx`. If you want to import anything else, stop and rethink.
5. **Is the destination a root-level shared module?** → use `@/components/...`, `@/hooks/...`, `@/lib/...`, `@/events/...`

When deciding whether to create an `index.ts`:

1. **Is the folder a feature, sub-feature, or part of a feature?** → no barrel
2. **Is the folder a layer-bucket (`api/`, `queries/`, etc.)?** → no barrel
3. **Is the folder a design system, a cohesive utility module, or a monorepo package's public API?** → barrel is appropriate, follow the "good barrel" rules
4. **Anywhere else?** → default to no barrel; let consumers import directly

---

## Quick reference

| Situation | Rule |
|---|---|
| Importing from another feature | Only `<feature>.ui.tsx`, never internals |
| Importing across folders inside a feature | Use `@/` |
| Importing from a sibling file | Use `./` |
| Importing from a direct subfolder | `./<subfolder>/...` is acceptable |
| Path requires `../` | Use `@/` instead |
| `index.ts` inside a feature | Banned |
| `index.ts` inside `api/`, `queries/`, etc. | Banned |
| `index.ts` for design system (`src/components/ui/`) | Allowed |
| `index.ts` for cohesive utility module (`src/lib/<module>/`) | Allowed |
| `export *` in any barrel | Banned (use named re-exports) |
| Side effects in any barrel | Banned |

---

## What this skill does NOT cover

- **Folder layout** (where files physically live) — folder structure skill
- **File names and export names** — naming conventions skill
- **What goes inside a public entry file** — UI/container skill
- **State management semantics** — separate skill

When writing an import, stay in this skill. When deciding whether the imported thing should exist as its own file at all, consult the relevant sibling skill.
