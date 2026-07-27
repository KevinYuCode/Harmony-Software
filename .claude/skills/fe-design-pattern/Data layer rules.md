---
name: frontend-data-layer
description: Data layer rules for the OpenJustice React frontend — how API functions, query hooks, and mutation hooks are written and how they compose. Covers Zod validation with `.safeParse()`, error normalization, the hierarchical query key factory pattern, what queries and mutations may and may not do, and cache invalidation patterns after mutations. Use this skill whenever creating or modifying any file in `api/`, `queries/`, or `mutations/`, when defining or changing cache keys, when wiring a mutation to invalidate queries, when integrating a new backend endpoint, when using `useQuery`/`useInfiniteQuery`/`useMutation`, or whenever the user asks "how do I add an endpoint", "where should this fetch live", "what should this invalidate", or anything involving data fetching or server state. Trigger this skill any time data layer code is being written or reviewed — the contracts here are easy to violate accidentally and expensive to fix later.
---

# Frontend Data Layer

This skill covers the three layers that handle server state: **API functions** (raw HTTP calls), **query hooks** (read), and **mutation hooks** (write). It also covers **cache keys** (shared between queries and mutations) and **cache invalidation patterns** (how mutations notify queries).

For where these files live, see the folder structure skill. For what they're named, see the naming skill. For workflow orchestration that composes multiple mutations, see the actions skill.

## Why this matters

The data layer is where bugs become production incidents. A mis-typed response gets rendered as `undefined`. A missing cache invalidation leaves the UI showing stale data. An over-eager invalidation triggers a refetch storm. The conventions here exist because each one has, at some point, prevented or caused a real outage.

The rules in this skill enforce three properties:
- **Safety** — every value crossing the wire is validated against a Zod schema, so the runtime shape matches the type at the boundary.
- **Composability** — API functions, queries, and mutations stay thin and single-purpose, so containers and actions can compose them freely.
- **Predictable caching** — cache keys follow a hierarchical factory pattern, so invalidation is precise and behavior is consistent across features.

---

## The data layer at a glance

The three layers stack like this:

```
Container / Action
       ↓
Query hook   |   Mutation hook       (queries/, mutations/)
       ↓               ↓
       API function                  (api/)
       ↓
       Network
```

- **API functions** are pure async functions that talk to the network. No React.
- **Query hooks** wrap one API function in `useQuery` or `useInfiniteQuery` with a key from the cache key factory.
- **Mutation hooks** wrap one API function in `useMutation` with cache invalidation tied to that specific write.
- **Containers and actions** consume these hooks and compose them into UI behavior.

Each layer is thin. Most of the code in any data file is the contract (schemas, keys, types) — not orchestration.

---

## API functions

API functions live in `<level>/api/<name>.api.ts` and are pure async functions: they take inputs, hit the network, and return parsed outputs. They contain no React code, no hooks, and no global state. They are the only place in the codebase where `fetch`/`ky`/`axios` is allowed.

### File shape

One `.api.ts` file per feature or sub-feature, holding all the endpoints for that scope. Each function corresponds to one HTTP endpoint.

```typescript
// apps/frontend/src/feature/cases/api/cases.api.ts
import { z } from "zod";
import {
  caseSchema,
  caseListSchema,
  createCaseDtoSchema,
  type CreateCaseDto,
  type Case,
} from "@packages/core";
import { httpClient } from "@/lib/http-client";
import { normalizeApiError } from "@/lib/normalize-api-error";

export async function fetchCases(filters: CaseFilters): Promise<Case[]> {
  const response = await httpClient
    .get("cases", { searchParams: filters })
    .json()
    .catch(normalizeApiError);

  const parsed = caseListSchema.safeParse(response);
  if (!parsed.success) {
    throw normalizeApiError(parsed.error);
  }
  return parsed.data;
}

export async function fetchCaseById(id: string): Promise<Case> {
  const response = await httpClient.get(`cases/${id}`).json().catch(normalizeApiError);

  const parsed = caseSchema.safeParse(response);
  if (!parsed.success) {
    throw normalizeApiError(parsed.error);
  }
  return parsed.data;
}

export async function createCase(input: CreateCaseDto): Promise<Case> {
  const validatedInput = createCaseDtoSchema.safeParse(input);
  if (!validatedInput.success) {
    throw normalizeApiError(validatedInput.error);
  }

  const response = await httpClient
    .post("cases", { json: validatedInput.data })
    .json()
    .catch(normalizeApiError);

  const parsed = caseSchema.safeParse(response);
  if (!parsed.success) {
    throw normalizeApiError(parsed.error);
  }
  return parsed.data;
}
```

### Validation rules

**Always use `.safeParse()`, never `.parse()`.** `.parse()` throws an unstructured `ZodError`; `.safeParse()` returns a discriminated union you can pattern-match on, then convert to a normalized error explicitly. The point isn't error handling — it's that errors leave the API layer in a known shape, never as raw library exceptions.

**Validate the response, always.** Even for endpoints you "trust." TypeScript types are a compile-time fiction; only the runtime parse confirms what came back actually matches what you typed. The cost of a `safeParse` is microseconds; the cost of `undefined.title` rendering as "undefined" in production is a bug ticket.

**Validate the request when it has structured input.** If the function takes a DTO that your code constructs (form values, an action payload), validate it before sending. This catches contract drift between the frontend and the schema. For trivial inputs (a single ID string), validation is optional.

### Error normalization

All thrown errors flow through a single `normalizeApiError()` function. Its job: take whatever was thrown — a `Response` object, a Zod error, a network error, a timeout — and return a consistent error type. Every `catch` in the API layer routes through it.

```typescript
// Conceptual shape — actual implementation lives in @/lib/normalize-api-error
type NormalizedApiError = {
  status: number | null;          // HTTP status if applicable
  code: string;                   // app-defined code (e.g. "VALIDATION_ERROR")
  message: string;                // user-safe message
  fieldErrors?: Record<string, string[]>; // field-level errors from Zod or the server
};
```

The contract: nothing leaves the API layer except a parsed value or a `NormalizedApiError`. Queries, mutations, and containers never have to handle three different error shapes.

### Where API files live

Two valid locations, determined by who uses the endpoints:

- **Feature-level**: `feature/<feature>/api/<feature>.api.ts` — endpoints used by multiple sub-features inside the feature, or by the feature's container.
- **Sub-feature-level**: `feature/<feature>/components/<sub>/api/<sub>.api.ts` — endpoints used only by that sub-feature.

If an endpoint is used by exactly one sub-feature, it goes in that sub-feature's `api/`. If it's shared, promote it up. The same locality rules apply for `cache-keys.ts`, `queries/`, and `mutations/` — they all live next to the `api/` folder that owns the endpoints.

### What API functions never do

- Call React hooks
- Touch global state (Zustand stores, contexts)
- Call other API functions in sequence (that's a workflow → action layer)
- Transform business data beyond what's needed to match the schema (transformations → `lib/` or container)
- Suppress errors (always throw, let the caller decide)

### DTO imports

Schemas and types come from the `@packages/core` package, where DTOs are organized by domain (`conversation`, `auth`, `dialog-flow`, etc.) — each domain owns its own `dto/`, `constants`, and `enums`. The frontend never defines its own version of a server-side schema; that's how request/response shapes drift out of sync.

```typescript
// ✅ Correct — single source of truth in @packages/core
import { caseSchema, type Case } from "@packages/core";

// ❌ Wrong — local redefinition can drift from the server
const caseSchema = z.object({ /* ... */ });
```

> Whether domain-specific imports use `@packages/core` directly or a subpath like `@packages/core/conversation` depends on the package's exports configuration. Use whatever path the package actually publishes.

---

## Cache keys

Cache keys are the addresses of cached server data. Every query has a key; mutations invalidate by key. Keys are defined once per `api/` folder in `cache-keys.ts` and accessed through a factory.

### The hierarchical factory pattern

Every feature's cache keys form a tree. Higher levels invalidate everything beneath them; lower levels are precise.

```typescript
// apps/frontend/src/feature/cases/api/cache-keys.ts
export const caseQueryKeys = {
  all: ["cases"] as const,
  lists: () => [...caseQueryKeys.all, "list"] as const,
  list: (filters: CaseFilters) => [...caseQueryKeys.lists(), filters] as const,
  details: () => [...caseQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...caseQueryKeys.details(), id] as const,
};
```

The shape: `all` → `lists`/`details` → `list(filters)`/`detail(id)`. Each level is built from the level above using spread. This gives you precise invalidation:

- Invalidate `caseQueryKeys.all` → every cache entry under "cases"
- Invalidate `caseQueryKeys.lists()` → every list, regardless of filters
- Invalidate `caseQueryKeys.list(myFilters)` → only the list for these specific filters
- Invalidate `caseQueryKeys.detail(id)` → only the detail for that one case

### Why this pattern over ad-hoc strings

Without the factory, callers write `["cases", "list", filters]` directly. As the feature grows, the keys diverge — one place writes `["case", "list"]` (singular), another writes `["cases", "list", filters]`, a third writes `["cases", filters]` (skipping the level). Invalidation breaks silently because two keys that should match don't.

The factory enforces structure, gives you typed inputs, and makes invalidation patterns explicit at the call site.

### Where cache keys live

One `cache-keys.ts` per `api/` folder. Same locality rules: feature-level `api/` has its own `cache-keys.ts`; sub-feature `api/` has its own. They don't share — each scope manages its own namespace.

To prevent collisions across scopes, the top-level array begins with the feature or sub-feature name (`["cases"]`, `["cases-analytics"]`).

---

## Query hooks

Query hooks live in `<level>/queries/<name>.query.ts` and wrap a single API function in `useQuery` or `useInfiniteQuery`.

### File shape

```typescript
// apps/frontend/src/feature/cases/queries/cases.query.ts
import { useQuery } from "@tanstack/react-query";
import { caseQueryKeys } from "@/feature/cases/api/cache-keys";
import { fetchCases } from "@/feature/cases/api/cases.api";

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: caseQueryKeys.list(filters),
    queryFn: () => fetchCases(filters),
  });
}

export function useCaseDetail(id: string) {
  return useQuery({
    queryKey: caseQueryKeys.detail(id),
    queryFn: () => fetchCaseById(id),
    enabled: Boolean(id),
  });
}
```

### Hard rule: must use `useQuery` or `useInfiniteQuery`

Every `.query.ts` file must call `useQuery` or `useInfiniteQuery`. A custom hook that just calls an API function directly is not a query hook — it's an unmanaged side effect. Don't write that hook.

```typescript
// ❌ Not a query hook — bypasses caching, dedup, refetch, devtools
export function useCases(filters: CaseFilters) {
  const [data, setData] = useState();
  useEffect(() => {
    fetchCases(filters).then(setData);
  }, [filters]);
  return data;
}

// ✅ Real query hook
export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: caseQueryKeys.list(filters),
    queryFn: () => fetchCases(filters),
  });
}
```

### Pagination uses `useInfiniteQuery`

For paginated/scrolled data, use `useInfiniteQuery` and pass the page cursor through `pageParam`:

```typescript
export function useCasesInfinite(filters: CaseFilters) {
  return useInfiniteQuery({
    queryKey: caseQueryKeys.list(filters),
    queryFn: ({ pageParam }) => fetchCasesPage({ ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

Same rules: one API function, one cache key, no orchestration.

### What query hooks never do

- **Fire side effects.** No toasts, no analytics, no navigation, no Zustand updates. Queries are pure reads.
- **Call mutations.** Reads don't trigger writes. If you find yourself wanting this, the workflow belongs in an action.
- **Invalidate other queries.** Invalidation is a *write* concern — it belongs in mutations. A query that invalidates itself or a sibling is a sign of a workflow being written in the wrong layer.
- **Heavy data transformation.** Light projection via `select` is fine for derived fields the caller wouldn't realistically duplicate (`select: (data) => data.length`). Anything heavier — joining, grouping, recomputing — belongs in the container with `useMemo`, or in `lib/` if shared.
- **Compose multiple endpoints.** One query, one endpoint. If you need data from two endpoints in one component, write two queries and combine them in the container. If the combination is itself a piece of business logic (optimistic merging, dependent fetches), that's an action.

### Returning the React Query result directly

A query hook returns whatever `useQuery` returns. Don't repackage it.

```typescript
// ✅ Container gets the full RQ object: data, isPending, error, refetch, etc.
const { data, isPending, error } = useCases(filters);

// ❌ Don't unwrap — callers lose access to error/loading/refetch
export function useCases(filters: CaseFilters) {
  const { data } = useQuery({ /* ... */ });
  return data;
}
```

The container chooses which fields to surface to the UI; the query hook stays generic.

---

## Mutation hooks

Mutation hooks live in `<level>/mutations/<name>.mutation.ts` and wrap a single API function in `useMutation`. Their job is one HTTP write, plus the cache invalidation that's directly caused by that write.

### File shape

```typescript
// apps/frontend/src/feature/cases/mutations/create-case.mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { caseQueryKeys } from "@/feature/cases/api/cache-keys";
import { createCase } from "@/feature/cases/api/cases.api";

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
    },
  });
}
```

### Hard rule: must use `useMutation`, single endpoint

Every `.mutation.ts` file calls `useMutation` and wraps **exactly one** API endpoint. Mutations don't compose. They don't sequence. They don't branch.

```typescript
// ❌ Wrong — multiple endpoints, conditional logic
export function useSubmitCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CaseData) => {
      const created = await createCase(data);
      if (data.attachments?.length) {
        await uploadAttachments(created.id, data.attachments);
      }
      await markCaseReady(created.id);
      return created;
    },
  });
}
```

That hook is a workflow with three steps and a branch. It belongs in `actions/`. The mutations folder should have three single-endpoint mutations (`useCreateCaseMutation`, `useUploadAttachmentsMutation`, `useMarkCaseReadyMutation`); the action composes them.

### `onSuccess` — what belongs and what doesn't

`onSuccess` (and `onError`) inside a mutation hook is for **invalidation tied directly to this exact write**. Nothing else.

**Belongs in the mutation's `onSuccess`:**
- Invalidating queries whose data is now stale because of this write
- `setQueryData` to insert the freshly returned record into existing cache entries (when the server returns the canonical updated object)

**Does not belong in the mutation's `onSuccess`:**
- Toasts ("Case created!")
- Navigation (`router.push("/cases")`)
- Analytics events
- Zustand updates outside the React Query cache
- Conditional follow-up requests
- Closing modals

The reason: mutations are reusable building blocks. The same "create case" mutation might be called from a full-page form (which navigates after success), a side panel (which closes the panel), or a bulk import (which doesn't show a toast for each one). Baking UI behavior into the mutation makes it useless outside its first call site.

UI side effects belong in the **caller** — either a container's `onSuccess` callback when calling `mutateAsync`, or a dedicated action hook that composes the mutation with the side effects intrinsic to that workflow.

```typescript
// ✅ Mutation: just the cache work
export function useCreateCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
    },
  });
}

// ✅ Container: decides UI behavior at the call site
function useNewCasePageContainer() {
  const router = useRouter();
  const createCase = useCreateCaseMutation();

  return {
    handlers: {
      onSubmit: async (data) => {
        const result = await createCase.mutateAsync(data);
        router.push(`/cases/${result.id}`);
      },
    },
  };
}
```

---

## Cache invalidation patterns

Different writes invalidate different parts of the cache. Use the right pattern for the operation.

### Create

A new record means existing lists are stale (they don't include the new record). The detail level isn't affected (the new record's detail will fetch on demand if requested).

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
}
```

### Update

The record itself changed (detail is stale), and any list containing it is stale (filtering, sorting, summary fields).

```typescript
onSuccess: (updated, variables) => {
  queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
  queryClient.invalidateQueries({ queryKey: caseQueryKeys.detail(variables.id) });
}
```

If the server returns the canonical updated record, prime the detail cache directly to avoid a refetch:

```typescript
onSuccess: (updated, variables) => {
  queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
  queryClient.setQueryData(caseQueryKeys.detail(variables.id), updated);
}
```

### Delete

The record is gone. Lists are stale. Detail queries should not be re-run (the record no longer exists), so remove rather than invalidate.

```typescript
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
  queryClient.removeQueries({ queryKey: caseQueryKeys.detail(variables.id) });
}
```

### Cross-resource invalidation

If creating a case also affects a different resource's cache (e.g. a "recent activity" feed in another feature), do **not** put that invalidation in the mutation. Either:
- Promote the relevant query keys to a shared module, then invalidate them from the relevant action, or
- Use a domain event (see the cross-feature events skill) so subscribers in other features can invalidate their own caches without this mutation knowing about them.

The mutation only invalidates within its own feature's cache namespace.

### When to invalidate broadly vs. narrowly

Default to invalidating one level higher than you think you need. `caseQueryKeys.lists()` (all list variants) is usually right — invalidating only `list(specificFilters)` misses other active list queries the user might switch to. Going all the way up to `caseQueryKeys.all` is broader than needed and triggers unnecessary refetches of details. The middle level is the right default.

Optimistic updates (where you mutate the cache before the server confirms and roll back on error) belong in the action layer, not the mutation. They require state coordination beyond a single write.

---

## What this skill does NOT cover

These are intentionally out of scope and live in their own skills:
- **Workflow orchestration** (composing multiple mutations, optimistic updates with rollback, retries, polling) — actions skill
- **Container-level error handling and loading UI** — container/UI skill
- **Form integration** (DTO schemas as form schemas, `react-hook-form` wiring) — forms skill
- **Realtime subscriptions** (WebSocket/SSE pushing into the cache) — subscriptions skill
- **State outside server state** (UI state, optimistic flags, drafts) — Zustand skill

Stay in this skill while writing API functions, query hooks, mutation hooks, or cache keys. The moment a piece of code wants to compose multiple endpoints, fire UI side effects, or coordinate optimistic state — it belongs in a different layer.
