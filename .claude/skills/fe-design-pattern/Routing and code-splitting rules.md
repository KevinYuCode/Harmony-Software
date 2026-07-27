---
name: frontend-routing-and-code-splitting
description: Routing and code-splitting rules for the OpenJustice React frontend — where navigation calls happen (containers and actions, never UI), centralized path construction so URLs aren’t magic strings, when state belongs in the URL (filters, tabs, pagination) vs. local state (drafts, ephemeral UI), the route-level `React.lazy()` pattern with paired Suspense and error boundaries, and when not to lazy-load. Use this skill whenever calling the router from a component, defining a new route, deciding whether state should live in the URL, splitting a route with `React.lazy()`, or when the user asks "where should this navigation go", "should this be a search param", "do I need to lazy-load this", or anything about routing or bundle-splitting. Trigger this skill any time routing or lazy loading is involved.
---

# Frontend Routing & Code Splitting

This skill covers two tightly-coupled concerns: **routing** (how navigation happens, where state lives in the URL, where router calls are made) and **code splitting** (using `React.lazy()` to load chunks on demand). They go together because the route boundary is the canonical place to split — splitting somewhere else is rare, and splitting at the route is the default.

For the loading and error UX that wraps lazy-loaded code, see the loading-and-errors skill. For where navigation fits into the action contract, see the actions skill. For folder-level page placement, see the folder structure skill.

## Why this matters

Three failure modes show up in nearly every codebase that doesn't have rules here:

1. **Path strings scattered everywhere.** `router.push("/cases/" + id)` in 14 components, `<Link to={`/cases/${id}/edit`}>` in 8 more. When the URL structure changes, half the call sites get missed and break navigation in production.
2. **State in the wrong place.** Filters in `useState` so the URL doesn't reflect them — refresh loses the user's view, links can't be shared. Or the inverse: form drafts shoved into the URL where every keystroke triggers a history entry.
3. **Eager bundling or wrong-tier lazy loading.** Either everything ships in one giant bundle (slow first load) or every leaf component is lazy-loaded (waterfalls of suspended chunks, layout flickers).

The rules here optimize for:
- **Refactor-safe paths** — URL changes are one-file changes.
- **State where it belongs** — bookmarkable/shareable state in the URL, ephemeral state local.
- **Bundle splits at meaningful boundaries** — route-level by default, with Suspense and error boundaries paired correctly.

---

## Routing

This skill is router-agnostic — the rules apply whether you're on React Router, TanStack Router, or any equivalent. Examples use React-Router-style syntax for concreteness.

### Pages stay thin

Pages live at `apps/frontend/src/pages/<page>.page.tsx` and do almost nothing — they import a feature's public entry and render it (with the boundaries the loading-and-errors skill mandates):

```typescript
// pages/cases.page.tsx
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PageErrorFallback } from "@/components/error-fallback/page-error-fallback.ui";
import { PageSkeleton } from "@/components/page-skeleton/page-skeleton.ui";
import { CaseDashboard } from "@/feature/cases/cases.ui";

export default function CasesPage() {
  return (
    <ErrorBoundary FallbackComponent={PageErrorFallback}>
      <Suspense fallback={<PageSkeleton />}>
        <CaseDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
```

Pages do **not**:
- Fetch data (the feature's container does that)
- Hold state (the feature's container does that)
- Wire handlers (the feature's container does that)
- Run actions or mutations (the feature's container does that)

A page that has any of these is doing the feature's job. Move that work into the feature.

### Navigation calls live in containers and actions, not UI

The router's navigation API (`router.push`, `navigate(...)`, etc.) is called from containers. UI components don't import the router for navigation. The container exposes a handler; the UI calls it.

```typescript
// In the container
export function useCaseRowContainer(caseId: string) {
  const router = useRouter();
  const deleteCase = useDeleteCase();

  return {
    state: { /* ... */ },
    handlers: {
      onOpen: () => router.push(routes.cases.detail(caseId)),
      onDelete: async () => {
        await deleteCase.execute(caseId);
        router.back();
      },
    },
  };
}

// In the UI
return <CaseRowPart state={state} handlers={handlers} />;
```

For navigation that's intrinsic to a workflow (always fires when the workflow succeeds, regardless of which container called it), the navigation lives in the action — same as the actions skill's intrinsic-vs-caller-decided rule. But this is rare; navigation is almost always caller-decided, so the container is the default home.

UI components can render `<Link to={...}>` for declarative anchor navigation. The link itself is fine in the UI. What the UI doesn't do is call `router.push` imperatively.

### Centralize paths in `routes.ts`

Path strings are not scattered through the codebase. They're built from a centralized routes object:

```typescript
// apps/frontend/src/routes.ts
export const routes = {
  home: () => "/" as const,
  cases: {
    list: () => "/cases" as const,
    detail: (id: string) => `/cases/${id}` as const,
    edit: (id: string) => `/cases/${id}/edit` as const,
  },
  conversations: {
    list: () => "/conversations" as const,
    detail: (id: string) => `/conversations/${id}` as const,
  },
  // ...
};
```

Callers use `routes.cases.detail(id)` instead of `/cases/${id}`. When a URL structure changes (e.g., adding an org segment so cases live at `/orgs/:orgId/cases/:id`), the change happens in one file. The TypeScript types catch any caller missing the new parameter.

If your router is one with built-in type-safe paths (TanStack Router's typed routes, for example), use that instead — same outcome, less bookkeeping. The principle is "no magic-string paths in containers, links, or anywhere else."

### URL state vs. component state

Some state belongs in the URL, some doesn't. The test:

> **Would the user expect a refresh, a back button, a copy-link, or a bookmark to preserve this?**

If yes, it goes in the URL. If no, it's local state.

| Belongs in URL | Belongs in component/container state |
|---|---|
| Filter selections | Form drafts (until submitted) |
| Search query | Hover state |
| Current tab | Modal open/closed (usually) |
| Pagination cursor / page number | Scroll position |
| Sort order | Tooltip visibility |
| Open detail panel ID (for master-detail views) | "Has the user dismissed the welcome banner this session" |

Filters are the canonical case for URL state — they're shareable, bookmarkable, survive refreshes, and pair naturally with the back button. Drafts are the canonical case for *not* using URL state — they change on every keystroke, would explode browser history, and are private to the user's session.

### The URL state hook wrapper

Read URL state through a typed hook, not by parsing `searchParams` inline. Keeps the contract typed and centralizes parsing logic.

```typescript
// apps/frontend/src/feature/cases/hooks/use-case-list-url-state.hook.ts
import { useSearchParams } from "react-router-dom"; // or your router
import { z } from "zod";

const caseListUrlStateSchema = z.object({
  q: z.string().default(""),
  priority: z.enum(["low", "normal", "high"]).optional(),
  sort: z.enum(["created", "updated", "priority"]).default("updated"),
  page: z.coerce.number().int().min(1).default(1),
});

export type CaseListUrlState = z.infer<typeof caseListUrlStateSchema>;

export function useCaseListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = caseListUrlStateSchema.parse(Object.fromEntries(searchParams));

  const update = (next: Partial<CaseListUrlState>) => {
    const merged = { ...state, ...next };
    setSearchParams(
      Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined && v !== "")
      )
    );
  };

  return [state, update] as const;
}
```

The hook lives in the feature's `hooks/` folder and is called by the container. The Zod schema validates and provides defaults, so the URL is forgiving (extra params ignored, missing params get defaults). The `update` function preserves other params when changing one — the user changing a filter doesn't reset their search query.

### History modes — `push` vs. `replace`

Most navigation should `push` (creates a history entry). A few cases should `replace`:

- **Filter and search updates as the user types.** Each keystroke shouldn't add a history entry — `replace` so back-button takes the user out of the page, not through 30 keystroke states.
- **Auth redirects.** When the auth check fails and the user is sent to `/login`, replace so the back button doesn't return them to the protected page (where they'd get bounced again).
- **Cleanup of one-shot URL params.** Removing a confirmation token after using it.

Default is `push`. Use `replace` deliberately for these specific cases.

### `<Link>` for anchors, programmatic navigation for results

```typescript
// ✅ Anchor — semantic link, right-click + open in new tab works
<Link to={routes.cases.detail(id)}>{caseTitle}</Link>

// ✅ Programmatic — after a workflow completes
const onSubmit = async (data) => {
  const result = await submitCase.execute(data);
  router.push(routes.cases.detail(result.id));
};
```

`<Link>` produces real `<a href>` elements that work with right-click, middle-click, accessibility tools, and the browser's link UI. Use it whenever the navigation is "click this thing to go there." Use `router.push` only when the navigation is the *result* of something else (form submission, async workflow, conditional logic).

---

## Code splitting

The default split point is the route. Other splits exist but are rare.

### Route-level lazy loading (the default pattern)

Wrap the page module in `React.lazy()`:

```typescript
// apps/frontend/src/router.tsx
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/home.page"));
const CasesPage = lazy(() => import("@/pages/cases.page"));
const CaseDetailPage = lazy(() => import("@/pages/case-detail.page"));
const SettingsPage = lazy(() => import("@/pages/settings.page"));

export function AppRouter() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path={routes.home()} element={<HomePage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
```

Each page becomes its own chunk. The user only downloads the pages they visit. The Suspense boundary at the router level catches the lazy load; the error boundary above catches load failures (network errors fetching the chunk).

### When else to lazy-load

A few cases beyond routes are worth splitting:

- **Heavy modal/dialog contents** that aren't part of the initial render. A rich text editor inside an "edit case" modal — load it when the modal opens.
- **Large tab contents** where the default tab doesn't include them. The user clicks a different tab; load that tab's component.
- **Third-party-heavy components** (charts, code editors, video players, complex date pickers). Often the heaviest chunks. Lazy-load when first rendered.

Each non-route lazy-load needs its own Suspense boundary and ideally an error boundary near it. Don't rely on the route-level boundaries — those are too far away to give a focused fallback.

```typescript
const RichTextEditor = lazy(() => import("@/components/rich-text-editor/rich-text-editor.ui"));

function EditCaseDialog() {
  return (
    <Dialog>
      <ErrorBoundary FallbackComponent={InlineErrorFallback}>
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />
        </Suspense>
      </ErrorBoundary>
    </Dialog>
  );
}
```

### When *not* to lazy-load

- **The current page's primary content.** If the user is on `/cases`, the case list is what they came for — lazy-loading it forces a flash of skeleton even though everything's ready.
- **Tiny components.** A 2KB button doesn't earn the network round-trip. Lazy loading has overhead (extra network request, Suspense fallback flicker); the saving has to exceed it.
- **Components rendered everywhere.** The app shell, the navigation header, the auth provider. These ship in the main bundle.
- **Components that always render together.** If `<DataTable>` always renders next to `<Pagination>`, splitting them creates a waterfall (load table, then load pagination). Bundle them together.

The rule of thumb: **split when a chunk is conditionally rendered AND large enough to matter.** Both conditions, not either.

### Naming chunks

Use webpack/Vite magic comments when chunk names matter for debugging:

```typescript
const CasesPage = lazy(() =>
  import(/* webpackChunkName: "cases-page" */ "@/pages/cases.page")
);
```

Without the comment, the chunk gets a hash filename. With it, you get `cases-page.[hash].js` — much easier to track in network tabs and bundle analyzers. Worth doing for every route-level split.

### Pairing with Suspense and ErrorBoundary

Every `React.lazy()` requires a Suspense boundary above it (forced by React) and *should* have an error boundary above the Suspense (a chunk download can fail — slow networks, ad blockers, deployments mid-session).

The pattern from the loading-and-errors skill applies directly here:

```
ErrorBoundary
  └─ Suspense (fallback={skeleton})
       └─ <LazyComponent />
```

For route-level splits, this lives at the router. For component-level splits, it lives at the call site.

### Pre-loading: hover-prefetch and route loaders

A lazy chunk has the cost of a network round trip on first access. For high-confidence-next-action UIs (a hover over a link, a wizard's "next" button), you can preload the chunk before the user actually navigates:

```typescript
// Hover-prefetch
const handleMouseEnter = () => {
  import("@/pages/case-detail.page");  // fire-and-forget
};

return <Link to={routes.cases.detail(id)} onMouseEnter={handleMouseEnter}>{title}</Link>;
```

By the time the user clicks, the chunk is already loaded — no Suspense fallback flicker.

For routers with built-in loader/preload concepts (TanStack Router, Remix), use those — they handle the prefetch and data fetching together. The principle is the same: anticipate likely navigation; preload speculatively.

### Route loaders (if your router supports them)

Some routers (Remix, TanStack Router, React Router 6.4+) let you define a `loader` function that fetches data before the route renders. This eliminates the "render → loading state → data arrives → re-render" sequence; the data is ready when the page mounts.

If your router supports this, prefer loaders for routes whose primary purpose is showing a specific record. The page mounts with the data already in the React Query cache; the user sees content immediately rather than a skeleton.

```typescript
// TanStack Router or React Router 6.4+ loader pattern
const route = createRoute({
  path: "/cases/:id",
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      queryKey: caseQueryKeys.detail(params.id),
      queryFn: () => fetchCaseById(params.id),
    }),
  component: CaseDetailPage,
});
```

This is router-specific; not every project will use loaders. The skill doesn't mandate them. If your router has them, lean on them for canonical use cases (a route whose URL identifies a specific record).

---

## Anti-patterns

### Magic string paths

```typescript
// ❌ Path strings scattered through the codebase
router.push(`/cases/${id}`);
router.push(`/cases/${id}/edit`);
<Link to={`/cases/${otherId}`}>...</Link>;
```

Centralize. `routes.cases.detail(id)`. When the URL structure changes, the codebase changes in one file.

### Imperative navigation in UI components

```typescript
// ❌ UI imports the router
export function CaseRow({ caseId, ... }: Props) {
  const router = useRouter();
  return <button onClick={() => router.push(`/cases/${caseId}`)}>Open</button>;
}
```

The container calls `router.push`. The UI calls a handler. UI components don't know about the router for imperative navigation.

The exception: `<Link to={...}>` is fine in the UI — that's declarative, returns an `<a>` element, and is part of the link semantics, not router orchestration.

### State that should be in the URL stuck in `useState`

```typescript
// ❌ Filters that the user can't share, bookmark, or get back to via the back button
const [filters, setFilters] = useState<CaseFilters>(defaultFilters);
```

Filters belong in the URL. Move to a URL-state hook.

### State that should be local pushed to the URL

```typescript
// ❌ Form draft in the URL — explodes history, leaks PII via referrers
const [searchParams, setSearchParams] = useSearchParams();
const draft = searchParams.get("draft") ?? "";
```

Drafts are local. Don't put per-keystroke state in the URL.

### `push` when you should `replace` (or vice versa)

```typescript
// ❌ Every keystroke creates a history entry
useEffect(() => {
  setSearchParams({ q: searchValue }); // pushes by default
}, [searchValue]);
```

For continuous updates (typing), use `replace`. The URL state hook wrapper should default to `replace` for "as-the-user-types" updates and `push` for explicit navigation.

### Lazy-loading the current page's primary content

```typescript
// ❌ The user is on /cases — lazy-loading the case list forces a flash of skeleton
const CaseList = lazy(() => import("./case-list"));
```

Lazy load *between* views, not within the view the user is currently looking at.

### Lazy-loading tiny leaves

```typescript
// ❌ A 2KB button doesn't earn the round trip
const SubmitButton = lazy(() => import("./submit-button"));
```

The fallback flicker and network overhead exceed the bundle savings. Reserve lazy loading for chunks of meaningful size.

### `React.lazy` without an error boundary

```typescript
// ❌ A failed chunk download crashes higher up
<Suspense fallback={<Skeleton />}>
  <LazyComponent />
</Suspense>
```

The Suspense catches the suspend, but a chunk fetch failure throws — and Suspense doesn't catch errors. Without an error boundary above the Suspense, the throw escapes to the next-higher boundary or crashes the app. Always pair `React.lazy` with both.

### Path constants without typing

```typescript
// ❌ Stringly-typed routes
export const PATHS = {
  CASE_DETAIL: "/cases/:id",
};

// caller has to interpolate manually, fragile
const path = PATHS.CASE_DETAIL.replace(":id", id);
```

Use functions: `routes.cases.detail(id)` — the function takes the right arguments, returns the constructed path, and TypeScript catches missing params.

---

## What this skill does NOT cover

- **Loading skeletons and error fallback UIs** (where they live, design conventions) — loading and errors skill
- **Route guards for permissions** (authorization, redirects on auth failure) — gating and permissions skill
- **The container/UI split itself** (where containers and UI components fit relative to pages) — components skill
- **Page placement in the folder structure** (where pages live, what they do) — folder structure skill
- **Server-side rendering and hydration** — outside the scope of this skill set
- **Specific router APIs** (React Router vs. TanStack Router vs. Remix specifics) — provider-specific, outside this skill

When wiring a navigation or splitting a chunk, stay in this skill. When the question shifts to "what does the loading state look like" or "should this route be permission-gated," that's a different skill.
