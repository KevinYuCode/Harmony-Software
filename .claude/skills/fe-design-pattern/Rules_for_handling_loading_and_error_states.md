---
name: frontend-loading-and-errors
description: Rules for handling loading and error states in the OpenJustice React frontend — where error boundaries live (app, page, feature levels), what they catch (render errors only) vs. what they don’t (async errors, event handlers), the default loading strategy (`isPending` checks over Suspense in most cases) and when Suspense is correct, where skeleton/spinner UIs live, and the distinction between render errors (bugs caught by boundaries) and API errors (rendered inline). Use this skill whenever wiring loading UI for a query, mutation, or action; placing an error boundary; choosing between `isPending` and Suspense; or when the user asks "where should the loading state go", "do I need an error boundary here", or anything about non-success UI states. Trigger this skill any time the question involves loading or error UI.
---

# Frontend Loading & Errors

This skill covers how the UI behaves when things are loading or have gone wrong. It defines the **error boundary hierarchy** (app, page, feature levels), the **default loading strategy** (`isPending` checks for most cases, Suspense for specific ones), and the distinction between **render errors** and **API errors** — which determines whether a failure flows to a boundary or renders inline.

For where the data hooks themselves live, see the data layer skill. For action `status`/`error` contracts, see the actions skill. For component architecture, see the components skill.

## Why this matters

Two things go wrong in nearly every codebase that doesn't have rules here:

1. **Error boundaries are placed wrong** — either too high (a single render bug crashes the whole app) or too low (every component has its own boundary, so failures get masked into "Loading..." forever). Understanding *what they catch* is the prerequisite to placing them correctly.
2. **Loading UX is inconsistent** — one feature uses skeletons, another shows "Loading...", a third shows nothing and then pops the content in. Each was a reasonable choice in isolation; together they make the app feel unfinished.

The rules here optimize for:
- **Predictable failure paths** — every error has a known home (boundary or inline), and the home is determined by the kind of error.
- **Smallest blast radius** — a single feature's bug doesn't take out the page; a single page's bug doesn't take out the app.
- **Coherent loading visuals** — the same kind of state looks the same everywhere.

---

## Two kinds of failure, two homes

Before the rules: there are **two different kinds of failure** in a React app, and each goes to a different place. Most error-handling confusion traces back to mixing them up.

| Kind | Examples | Where it goes |
|---|---|---|
| **Render error** (a bug) | A component throws during render, `Cannot read properties of undefined`, `useMemo` reducer throws, broken type assumption | **Error boundary** |
| **API/expected error** | Query returned 500, mutation rejected, validation failed, network timeout | **Inline UI**, rendered from `error` state |

Render errors are bugs — code that should not have thrown. They're caught by error boundaries because they're catastrophic and unexpected. The user shouldn't see a stack trace; they should see a fallback UI while the team gets paged.

API errors are expected — every backend call can fail. They flow through the normalized error type from the data layer and render as part of the component's normal output (an inline error message, a retry button, a banner).

Mixing them up — wrapping a component in an error boundary to catch its API errors — masks bugs and makes the UI silently broken.

---

## Error boundaries

Error boundaries catch errors **thrown during render** (and during component lifecycle, `useMemo` reducers, etc.). They do **not** catch:

- Errors in event handlers
- Errors in async code (promises, `setTimeout`, etc.)
- Errors during server-side rendering
- Errors in the boundary itself

For everything they don't catch, the answer is "use the data layer's error handling and render inline." For everything they do catch, the answer is to place the boundary at the right tier.

### The three-tier hierarchy

```
App-level boundary
  └─ Catches anything the lower tiers didn't handle.
     Catastrophic fallback: "Something went wrong. Reload the app."

  ┌─ Page-level boundary (per route)
  │  └─ Keeps other pages working when one page errors.
  │     Pages can still navigate; the broken page shows its own fallback.
  │
  │  ┌─ Feature-level boundary (per feature inside a page)
  │  │  └─ Smallest blast radius. A bug in one feature doesn't break siblings.
  │  │     Most of the time, this is the boundary that catches.
```

Each tier wraps the tier below it. A render error bubbles up until a boundary catches it. The lowest boundary is the smallest blast radius; higher tiers exist as a safety net for cases the lower tiers didn't anticipate.

### App-level boundary

One per app, mounted at the root above the router. The fallback is intentionally minimal — it only renders for catastrophic failures that escaped every other boundary, so it can't depend on anything that might also be broken.

```typescript
// apps/frontend/src/app.tsx (or wherever your root mounts)
import { ErrorBoundary } from "react-error-boundary";
import { AppErrorFallback } from "@/components/error-fallback/app-error-fallback.ui";

export function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <Router>{/* ... */}</Router>
    </ErrorBoundary>
  );
}
```

The `AppErrorFallback` is plain HTML/CSS — no design system imports, no router calls, no analytics dependencies. The simpler the fallback, the more reliable it is when half the app is broken.

### Page-level boundary

One per route. Wraps the page's feature(s) so a render error in one route doesn't take down navigation.

```typescript
// pages/cases.page.tsx
import { ErrorBoundary } from "react-error-boundary";
import { PageErrorFallback } from "@/components/error-fallback/page-error-fallback.ui";
import { CaseDashboard } from "@/feature/cases/cases.ui";

export default function CasesPage() {
  return (
    <ErrorBoundary FallbackComponent={PageErrorFallback}>
      <CaseDashboard />
    </ErrorBoundary>
  );
}
```

The page-level fallback can use design system components (the design system shouldn't be the thing that broke). It typically offers "Go back," "Reload page," and possibly a contact-support link.

### Feature-level boundary

The most granular tier. Wraps a feature's `<feature>.ui.tsx` so one broken feature doesn't take out the whole page. Use this when the page renders multiple features side-by-side and isolation matters (a sidebar's bug shouldn't blank the main content).

```typescript
// pages/dashboard.page.tsx
export default function DashboardPage() {
  return (
    <PageLayout>
      <ErrorBoundary FallbackComponent={FeatureErrorFallback}>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={FeatureErrorFallback}>
        <CaseDashboard />
      </ErrorBoundary>
    </PageLayout>
  );
}
```

Feature-level fallbacks usually live in the feature itself, in `_parts/` — they can be feature-specific ("This panel can't load right now"). Generic fallbacks live in `src/components/error-fallback/`.

### Where fallback UIs live

| Fallback | Location |
|---|---|
| `AppErrorFallback` | `src/components/error-fallback/app-error-fallback.ui.tsx` |
| `PageErrorFallback` | `src/components/error-fallback/page-error-fallback.ui.tsx` |
| `FeatureErrorFallback` (generic) | `src/components/error-fallback/feature-error-fallback.ui.tsx` |
| Feature-specific fallback | `feature/<feature>/_parts/<feature>-error-fallback.part.tsx` |

### Reset and recovery

`react-error-boundary` exposes a `resetErrorBoundary` function in the fallback component. Useful for "Try again" buttons that re-render the wrapped tree. Most fallbacks should offer this for transient cases.

```typescript
export function FeatureErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <p>This panel couldn't load.</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

For boundaries that wrap data, also reset the React Query cache for the affected keys when the user clicks retry — otherwise a cached error stays cached and the same render error happens again. The `react-error-boundary` `onReset` callback is the place for that.

### Logging and reporting

The boundary's `onError` callback is where errors should be reported (Sentry, your logging service, whatever you use). The boundaries are the centralized choke point for "something went wrong in render"; logging there means every render error is captured automatically.

Don't try to log inside individual components. Centralize at the boundary.

---

## Loading: `isPending` is the default; Suspense is for specific cases

The codebase has two ways to handle "data is loading":

1. **`isPending` checks**: read `isPending` (and `isFetching` for refetch indicators) from the query/mutation/action, conditionally render a skeleton or spinner.
2. **Suspense**: wrap the component in `<Suspense fallback={...}>`; the data hooks "suspend" until resolved.

**The default is `isPending` checks.** Reach for Suspense in specific cases listed below.

### Why `isPending` is the default

- **Explicit.** The component reads `isPending` and renders a skeleton — it's obvious from the code what's happening.
- **Granular.** Each query has its own loading state; the component decides what shows skeletons and what doesn't.
- **No surprises.** No render is triggered by a thrown promise. Easier to reason about, easier to debug.
- **Works everywhere.** Every query, mutation, and action exposes `isPending` (or equivalent) without configuration.

```typescript
// ✅ The default pattern
export function CaseDashboard() {
  const { state } = useCaseDashboardContainer();

  if (state.isPending) {
    return <CaseListSkeleton />;
  }

  if (state.error) {
    return <InlineError error={state.error} />;
  }

  return <CaseList cases={state.cases} />;
}
```

### When to use Suspense

Reach for Suspense when:

1. **`React.lazy()` is involved.** Code-split components require a Suspense boundary; that's not optional.
2. **The whole route should "wait" before showing.** A data-driven page where partial loading would be visually wrong (e.g., a printable report).
3. **You're using a Suspense-enabled query option** (`useSuspenseQuery`) deliberately for a specific component.

For ordinary feature components reading server data, `isPending` is simpler and equally good.

### Where Suspense boundaries go

When you do use Suspense, mirror the error boundary tiers:

```typescript
<ErrorBoundary FallbackComponent={PageErrorFallback}>
  <Suspense fallback={<PageSkeleton />}>
    <FeatureUI />
  </Suspense>
</ErrorBoundary>
```

The error boundary catches the throw; Suspense catches the suspend. Both wrap the same tree.

### Mixing the two — fine, with rules

A page can use Suspense for `React.lazy()` while individual features still use `isPending` internally. That's normal. The Suspense boundary catches the lazy-load suspend; the features manage their own data loading.

What you don't want is the same component using both — a feature that reads server data via `useSuspenseQuery` *and* checks `isPending` is doing two things at once. Pick one strategy per component.

---

## Skeletons, spinners, and inline messages

Loading UI varies by what's being shown:

### Skeletons (preferred for layout)

A skeleton renders the *shape* of the eventual content with placeholder blocks. Best for first loads of structured content (lists, cards, forms). Prevents layout shift, communicates "this is where the content will be," and feels faster than spinners.

```typescript
export function CaseListSkeleton() {
  return (
    <ul>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="case-row-skeleton">
          <div className="title-skeleton" />
          <div className="meta-skeleton" />
        </li>
      ))}
    </ul>
  );
}
```

Skeletons live in `_parts/` of the feature they belong to. Generic ones (a generic table skeleton, a card skeleton) live in `src/components/`.

### Spinners

Acceptable for short waits where layout shape doesn't apply: button loading state, inline action confirmation, modal opening. Use a spinner from the design system; don't make new ones per feature.

```typescript
<button disabled={state.isSubmitting}>
  {state.isSubmitting ? <Spinner /> : "Submit"}
</button>
```

### "Loading..." text

Almost never the right answer. Use a skeleton or a spinner.

### Refetching indicator

For background refetches (where stale data is shown while fresh data loads), use `isFetching` rather than `isPending`. The pattern: show the data with a subtle "updating" indicator, not a full skeleton. The user shouldn't see content disappear when their action triggers a refetch.

```typescript
return (
  <div>
    {state.isFetching && <RefreshingIndicator />}
    <CaseList cases={state.cases} />
  </div>
);
```

---

## Inline error UI for API failures

When a query, mutation, or action errors, the error is part of the component's `state` — render it like any other piece of state. Don't throw; don't push it up to the error boundary.

### Query errors

```typescript
if (state.error) {
  return (
    <InlineError
      error={state.error}
      onRetry={() => state.refetch()}
    />
  );
}
```

The `InlineError` component (in `src/components/`) takes a `NormalizedApiError` and renders it. The shape is consistent because all API errors flow through the same normalization in the data layer.

### Mutation/action errors

For mutations and actions, the error is associated with a specific submission, so the error UI lives near the trigger:

```typescript
return (
  <form onSubmit={handlers.onSubmit}>
    {/* fields */}
    {state.submitError && <ErrorBanner error={state.submitError} />}
    <button type="submit" disabled={state.isSubmitting}>
      Submit
    </button>
  </form>
);
```

A mutation error shouldn't take down the entire form — the user should see the error, fix the input, and retry.

### When inline isn't enough

If the failure is bad enough that the feature can't render anything useful, render a feature-level error UI in `_parts/` (the same `<feature>-error-fallback.part.tsx` you'd use as a boundary fallback). It's not the same instance as the boundary fallback — it's the inline render path for "I got a known error and have nothing to show" — but they often look identical, so reusing the part is fine.

---

## Loading and error decision flowcharts

### "I have a query/mutation/action — how do I handle its loading state?"

1. **Is it the data fetch for an entire route, and partial loading would be wrong?** → Suspense
2. **Is `React.lazy` involved in this tree?** → Suspense (forced)
3. **Anything else?** → `isPending` check, render a skeleton or spinner

### "I have a query/mutation/action — how do I handle errors?"

1. **Did the API call fail?** → render the error inline from `state.error`. Use the `NormalizedApiError` shape.
2. **Did a render-time bug throw?** → caught by the error boundary; you don't write code for this beyond placing the boundary.
3. **Did an event handler throw?** → catch it locally with `try/catch` (or rely on `mutateAsync`'s rejection); error boundaries don't catch event handler errors.

### "Where do I put an error boundary?"

1. **At the app root, above the router.** Always.
2. **Around each page in the router.** Always.
3. **Around individual features when sibling isolation matters.** Most pages with multiple features.
4. **Inside a feature** — almost never. If a feature's internals are throwing render errors, fix the feature, don't paper over it with smaller boundaries.

---

## Anti-patterns

### Wrapping every component in an error boundary

```typescript
// ❌ Boundary around a leaf component
<ErrorBoundary FallbackComponent={Fallback}>
  <CaseRow case={c} />
</ErrorBoundary>
```

Boundaries at this granularity hide bugs. A `CaseRow` that throws should crash its containing list (the feature boundary catches it), not silently swap to a fallback for one row. The user sees the rest of the list and might never realize a row is missing.

### Catching API errors with an error boundary

```typescript
// ❌ Forcing async errors into the boundary path
function useCases() {
  const { data, error } = useQuery(...);
  if (error) throw error;  // forwarding to boundary
  return data;
}
```

API errors are expected, not exceptional. They go through `state.error` and inline UI. The boundary is for unexpected render-time bugs.

### Throwing inside event handlers expecting a boundary to catch

```typescript
// ❌ The boundary won't catch this — handlers throw outside the render
const onClick = () => {
  if (somethingBad) throw new Error("oops");
};
```

Boundaries don't catch event handler throws. Either handle the error inline (`try/catch`) or restructure so the failure flows through state rather than throwing.

### Spinners as the default loading UI

```typescript
// ❌ Spinner where a skeleton would be clearly better
{isPending ? <Spinner /> : <CaseList cases={cases} />}
```

A spinner with no surrounding context tells the user "we're working on it" but not "what is going to appear." For structured content (lists, forms, dashboards), skeletons are almost always better. Spinners are for short, contained operations: button submits, opening modals, item-level updates.

### Showing nothing while loading

```typescript
// ❌ Empty render until data arrives
return cases.length > 0 ? <CaseList cases={cases} /> : null;
```

The user sees a blank for half a second. Render a skeleton instead — the perceived performance difference is significant.

### Boundary fallbacks that depend on broken systems

```typescript
// ❌ Fallback uses the design system that might be broken
export function AppErrorFallback() {
  return <DesignSystemDialog>{/* ... */}</DesignSystemDialog>;
}
```

The app-level boundary is the last resort. If the design system is the thing that broke, the dialog won't render and you're stuck. Plain HTML for the app-level fallback. Page and feature fallbacks can use the design system safely.

### `Suspense` without an `ErrorBoundary` above it

```typescript
// ❌ Suspended tree throws unhandled
<Suspense fallback={<Skeleton />}>
  <FeatureUI />
</Suspense>
```

If a `useSuspenseQuery` errors, the throw goes up the tree. With no boundary above the Suspense, the error escapes to the next-higher boundary (or worse, crashes the app). Always pair Suspense with a boundary one level up.

### Logging from random components instead of the boundary

```typescript
// ❌ Logging duplicated in every component
function CaseList() {
  // ...
  if (error) {
    Sentry.captureException(error);  // not the right place
    return <ErrorMessage />;
  }
}
```

Centralize logging at the error boundary's `onError`. For API errors that flow through `state.error`, log them in the action or mutation's error path (when there is one) — not in every UI that consumes the error.

---

## What this skill does NOT cover

- **Data layer error normalization** (the `NormalizedApiError` shape, `safeParse`, `normalizeApiError`) — data layer skill
- **Action `status`/`error` contract** — actions skill
- **Container/UI architecture** (where `state.error` and `state.isPending` come from in `{ state, handlers }`) — components skill
- **Code splitting and `React.lazy`** (mentioned here, fully covered in routing/code-splitting skill)
- **Toast and notification UX** (when failures fire toasts vs. inline UI) — toasts skill
- **Skeleton component design** (visual conventions, animation, accessibility) — design system topic, outside the scope of these skills

When wiring loading or error UI, stay in this skill. When the question shifts to "what does this error look like as a value" or "how is this normalized," that's the data layer.
