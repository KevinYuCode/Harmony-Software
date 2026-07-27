---
name: frontend-naming-conventions
description: Naming conventions for the OpenJustice React frontend — file suffixes (.ui.tsx, .container, .part, .hook, .query, .mutation, .action, .store, .api), the .ts vs .tsx decision rule, kebab-case file names matching their exports, hook/component/store/utility export naming, and variable naming including when to prefix with a feature name. Use this skill whenever creating, renaming, or reviewing any file in apps/frontend/src/, when deciding between .ts and .tsx, when picking a name for a new hook/component/function, when choosing variable names inside a feature, or whenever the user asks "what should I call this", "what suffix does X use", or "should this be .ts or .tsx". Trigger this skill any time a name is being chosen, even if the user doesn't explicitly mention naming — wrong names are subtle bugs that compound over time.
---

# Frontend Naming Conventions

This skill defines **what to name files and identifiers** in `apps/frontend/src/`. Where files go is covered by the folder structure skill. What goes inside the files is covered by the per-layer skills (API, queries, container, etc.). When naming something, follow the rules here.

## Why this matters

Names are the most-read part of a codebase. They show up in imports, in grep results, in stack traces, in autocomplete, and in code review. A consistent naming scheme makes the codebase self-documenting: you can tell what a file is and what a value is for without opening anything. An inconsistent scheme forces every reader to do extra work on every line.

The conventions here optimize for two things:
- **Searchability** — given a thing, you can find its file. Given a file, you can guess its exports.
- **Disambiguation** — at a call site, you can tell what kind of thing you're using (a hook? a pure function? a component?) from the name alone.

---

## File suffix taxonomy

Every file with a special role uses a suffix that names that role. The suffix is part of the filename, not the extension — `cases.query.ts` is a query hook file, not a query file with a `.ts` extension.

| Suffix | What it is | Folder it lives in | Example |
|---|---|---|---|
| `.ui.tsx` | UI component (feature root, sub-feature, or shared) | feature root, `components/<sub>/`, `src/components/<x>/` | `case-dashboard.ui.tsx` |
| `.container.ts` / `.container.tsx` | ViewModel hook paired with a UI component | next to the matching `.ui.tsx` | `case-dashboard.container.ts` |
| `.part.tsx` | Presentational sub-component (props-only) | `_parts/` | `header.part.tsx` |
| `.hook.ts` / `.hook.tsx` | Reusable utility hook | `hooks/` | `keyboard-shortcuts.hook.ts` |
| `.query.ts` | React Query read hook | `queries/` | `cases.query.ts` |
| `.mutation.ts` | React Query mutation hook | `mutations/` | `delete-case.mutation.ts` |
| `.action.ts` / `.action.tsx` | Workflow orchestration hook | `actions/` | `submit-case.action.ts` |
| `.subscription.ts` | Realtime/WebSocket lifecycle hook | `subscriptions/` | `live-updates.subscription.ts` |
| `.store.ts` | Zustand store | `stores/` | `case.store.ts` |
| `.api.ts` | Pure async API functions | `api/` | `case-dashboard.api.ts` |
| `.test.ts` / `.test.tsx` | Test file | next to the file under test | `submit-case.action.test.ts` |
| (no suffix) | Pure utility / business logic | `lib/` | `transform-form-to-dto.ts` |
| (no suffix) | Cache key constants | `api/` | `cache-keys.ts` |

The two no-suffix cases are intentional: `lib/` files describe themselves with their *name* (`calculate-case-score.ts` is obviously what it is), and `cache-keys.ts` is a single well-known file in every `api/` folder.

### Why so many suffixes?

The suffix tells you what role the file plays *without opening it*. When you see `submit-case.action.ts` in an import, you know it's a workflow orchestration hook before you read a single character of code. When you see a stack trace pointing at `case.store.ts`, you know it's Zustand. This makes grep, code review, and onboarding noticeably faster.

The cost is longer filenames. The trade is worth it at scale; a folder of `index.ts`, `helpers.ts`, `utils.ts` is much harder to navigate than one with descriptive suffixes.

---

## `.ts` vs `.tsx` — the mechanical rule

**The only thing that determines the extension is whether the file contains JSX syntax.**

- File contains `<Something />` syntax anywhere → `.tsx`
- File does not → `.ts`

That's it. There is no other rule. The extension does not depend on:
- Whether the file is "React-related"
- Whether the file calls hooks
- Whether the file is in a React project
- Whether it imports from React
- Which folder it lives in

### Why this matters in practice

If a file does not contain JSX, using `.tsx` actively hurts you because TypeScript's parser has to disambiguate `<T>` between a generic and a JSX element. You end up needing the awkward `<T,>` workaround:

```typescript
// In a .ts file — clean
const identity = <T>(x: T): T => x;

// In a .tsx file — needs the trailing comma to disambiguate from JSX
const identity = <T,>(x: T): T => x;
```

Hook files, action files, store files, query files — almost none of them contain JSX, so they are `.ts`.

### Common cases

```typescript
// queries/cases.query.ts — no JSX, .ts
export function useCases() {
  return useQuery({ queryKey: caseQueryKeys.list(), queryFn: fetchCases });
}

// actions/submit-case.action.ts — no JSX, .ts (calling hooks does not require .tsx)
export function useSubmitCase() {
  const mutation = useSubmitCaseMutation();
  return { execute: mutation.mutateAsync, status: mutation.status };
}

// hooks/keyboard-shortcuts.hook.ts — no JSX, .ts
export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => { /* ... */ }, [map]);
}

// case-dashboard.ui.tsx — contains JSX, .tsx
export function CaseDashboard() {
  return <div>...</div>;
}

// case-dashboard.container.ts — usually no JSX, .ts
// case-dashboard.container.tsx — only if it constructs JSX values
//   (e.g. `state.toolbar = <Toolbar />`)
```

A container file is `.tsx` only when it actually contains JSX expressions in its body. If it only returns `{ state, handlers }` with no JSX, it's `.ts`.

---

## File names match exports

### File names: kebab-case

All file names are **kebab-case** (lowercase words separated by hyphens). No PascalCase files, no camelCase files, no underscores.

```
✅ case-dashboard.ui.tsx
✅ submit-case.action.ts
✅ transform-form-to-dto.ts
✅ keyboard-shortcuts.hook.ts

❌ CaseDashboard.ui.tsx
❌ submitCase.action.ts
❌ transform_form_to_dto.ts
```

Kebab-case is the most portable and unambiguous casing. It works on case-insensitive filesystems (macOS default), it doesn't collide with anything, and it scans cleanly.

### Exports: matching case for the export type

The file name in kebab-case maps to an export name in the appropriate case for what's being exported. The mapping is:

| File pattern | Export naming | Example |
|---|---|---|
| `<name>.ui.tsx` | PascalCase component, no suffix | `case-dashboard.ui.tsx` → `export function CaseDashboard()` |
| `<name>.part.tsx` | PascalCase with `Part` suffix | `header.part.tsx` → `export function HeaderPart()` |
| `<name>.container.ts(x)` | camelCase hook with `use` prefix and `Container` suffix | `case-dashboard.container.ts` → `export function useCaseDashboardContainer()` |
| `<name>.hook.ts(x)` | camelCase hook with `use` prefix | `keyboard-shortcuts.hook.ts` → `export function useKeyboardShortcuts()` |
| `<name>.query.ts` | camelCase hook with `use` prefix, no `Query` suffix | `cases.query.ts` → `export function useCases()` |
| `<name>.mutation.ts` | camelCase hook with `use` prefix and `Mutation` suffix | `delete-case.mutation.ts` → `export function useDeleteCaseMutation()` |
| `<name>.action.ts(x)` | camelCase hook with `use` prefix, no `Action` suffix | `submit-case.action.ts` → `export function useSubmitCase()` |
| `<name>.subscription.ts` | camelCase hook with `use` prefix | `live-updates.subscription.ts` → `export function useLiveUpdates()` |
| `<name>.store.ts` | camelCase hook with `use` prefix and `Store` suffix | `case.store.ts` → `export const useCaseStore` |
| `<name>.api.ts` | camelCase named functions, no `use` prefix | `case-dashboard.api.ts` → `export function fetchCases()`, `export function createCase()` |
| `<name>.ts` (lib) | camelCase named functions | `transform-form-to-dto.ts` → `export function transformFormToDto()` |

### The action-vs-mutation export naming rule

This is the one place where the conventions disambiguate carefully. Actions wrap mutations, so without a rule you'd get two hooks both called `useSubmitCase` and have to alias on import.

The rule: **mutations carry a `Mutation` suffix; actions don't.** The action is the public API; the mutation is implementation detail.

```typescript
// mutations/submit-case.mutation.ts
export function useSubmitCaseMutation() { /* ... */ }

// actions/submit-case.action.ts
import { useSubmitCaseMutation } from "@/feature/cases/mutations/submit-case.mutation";

export function useSubmitCase() {
  const mutation = useSubmitCaseMutation();
  // ... compose into a workflow
  return { execute, status, error };
}

// In any container
import { useSubmitCase } from "@/feature/cases/actions/submit-case.action";
//                  ^^^^^^^^^^^^^ clean name, this is what callers see
```

Queries don't have this collision (there's no "query action" wrapping them), so they get the clean name without a suffix: `useCases`, `useCaseDetail`, etc.

### One file, one primary export

A file with a special suffix exports exactly one thing as its primary export. `submit-case.action.ts` exports `useSubmitCase`. `case.store.ts` exports `useCaseStore`. Don't pile multiple unrelated hooks into one file just because they're related.

The exception is `lib/` files and `api/` files, which can group related helpers:
- `date.ts` may export `formatDate`, `parseDate`, `addDays`, etc.
- `case-dashboard.api.ts` exports all the API functions for that feature

For these, one file holds a cohesive group; for everything else, one file holds one thing.

---

## Variable naming

### Booleans: prefix-based

Use prefixes that describe what kind of boolean this is:

- `is*` for current state: `isLoading`, `isOpen`, `isSelected`, `isDirty`
- `has*` for possession or completion: `hasError`, `hasPermission`, `hasUnsavedChanges`
- `can*` for permission or ability: `canEdit`, `canDelete`, `canSubmit`
- `should*` for derived decisions: `shouldRefetch`, `shouldShowBanner`

Pick one prefix per concept and stick to it. Don't mix `isLoaded` and `hasLoaded` for the same idea.

### Handlers: `on*` at the boundary, `handle*` internally

When a value is exposed to a UI component as a callback, name it `onX`. When it's the internal implementation in a container, name it `handleX`. The `{ state, handlers }` shape uses `on*` keys because that's what the UI consumes:

```typescript
// In the container
function useCaseDashboardContainer() {
  const handleEdit = (id: string) => { /* ... */ };
  const handleDelete = (id: string) => { /* ... */ };

  return {
    state: { /* ... */ },
    handlers: {
      onEdit: handleEdit,    // exposed name uses on*
      onDelete: handleDelete,
    },
  };
}

// In the UI
const { handlers } = useCaseDashboardContainer();
return <button onClick={() => handlers.onEdit(id)}>Edit</button>;
```

If the handler is trivial, you can skip the intermediate name and define it inline:

```typescript
return {
  handlers: {
    onEdit: (id: string) => { /* ... */ },
  },
};
```

The `handle*` form is for when you need to reference the function elsewhere in the container body (e.g. passing it to multiple keys, wrapping it with a memoizer).

### When to prefix with the feature name

Default: don't prefix. Inside `feature/conversation/`, the variable `isRenamingTitle` is unambiguous — the folder already says it's about conversations.

Add the feature name when the variable's identity would be ambiguous outside its origin. The clearest cases:

1. **Stored in a Zustand store that other features can read.** The store is a public-ish surface, so its keys should be self-describing.
2. **Exposed on a returned `state` object from a hook used outside the feature.**
3. **Passed across a component boundary where the receiving side can't see the feature folder.**

```typescript
// ✅ Inside feature/conversation/, this is fine
const [isRenamingTitle, setIsRenamingTitle] = useState(false);

// ✅ But the store key is exposed elsewhere — prefix it
export const useConversationStore = create<ConversationState>((set) => ({
  isRenamingConversationTitle: false,    // clear in any caller
  isStreamingConversation: false,
  // ...
}));

// ✅ Generic state — never needs a prefix
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

`isLoading`, `error`, `data`, `isOpen` — these are domain-agnostic and are clear anywhere. Don't prefix them.

### Cache key factories

Cache key factories live in `api/cache-keys.ts` and are named `<feature>QueryKeys`:

```typescript
// api/cache-keys.ts
export const caseQueryKeys = {
  all: ["cases"] as const,
  lists: () => [...caseQueryKeys.all, "list"] as const,
  list: (filters: CaseFilters) => [...caseQueryKeys.lists(), filters] as const,
  details: () => [...caseQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...caseQueryKeys.details(), id] as const,
};
```

The `QueryKeys` suffix is intentional — it disambiguates from other things named `case*` in the same import scope.

### Component prop interfaces

A component's props interface is named `<ComponentName>Props`:

```typescript
interface CaseDashboardProps { /* ... */ }
export function CaseDashboard(props: CaseDashboardProps) { /* ... */ }

interface HeaderPartProps { /* ... */ }
export function HeaderPart(props: HeaderPartProps) { /* ... */ }
```

For containers that take arguments, the input type is `<HookName>Args` or `<HookName>Options`:

```typescript
interface UseSubmitCaseArgs { /* ... */ }
export function useSubmitCase(args: UseSubmitCaseArgs) { /* ... */ }
```

---

## Quick reference

| Thing being named | File name | Export name |
|---|---|---|
| Feature UI | `case-dashboard.ui.tsx` | `CaseDashboard` |
| Feature container | `case-dashboard.container.ts` | `useCaseDashboardContainer` |
| Sub-feature UI | `analytics-panel.ui.tsx` | `AnalyticsPanel` |
| Presentational part | `header.part.tsx` | `HeaderPart` |
| Reusable hook | `keyboard-shortcuts.hook.ts` | `useKeyboardShortcuts` |
| Query hook | `cases.query.ts` | `useCases` |
| Mutation hook | `delete-case.mutation.ts` | `useDeleteCaseMutation` |
| Action hook | `submit-case.action.ts` | `useSubmitCase` |
| Subscription | `live-updates.subscription.ts` | `useLiveUpdates` |
| Zustand store | `case.store.ts` | `useCaseStore` |
| API functions | `case-dashboard.api.ts` | `fetchCases`, `createCase`, `deleteCase` (multiple) |
| Cache keys | `cache-keys.ts` | `caseQueryKeys` |
| Pure transformation | `transform-form-to-dto.ts` | `transformFormToDto` |
| Pure calculation | `calculate-case-score.ts` | `calculateCaseScore` |
| Helper module | `date.ts` | `formatDate`, `parseDate`, ... (multiple) |
| Test for any of the above | `<original-name>.test.ts(x)` | (no exports — describe blocks) |

---

## What this skill does NOT cover

These are intentionally out of scope and live in their own skills:
- **Where files go** (folder layout, sub-features, promotion to root) — folder structure skill
- **What goes inside each file** (API shape, query patterns, container shape) — per-layer skills
- **Container vs UI split rules** (when to extract a container in the first place) — separate skill
- **Import patterns** (`@/` alias, barrel exports) — separate skill
- **State management semantics** (which store does what, when to use Zustand vs React Query) — separate skill

When picking a name, stay in this skill. When deciding whether a piece of code should exist as a separate file at all, consult the relevant sibling skill first.
