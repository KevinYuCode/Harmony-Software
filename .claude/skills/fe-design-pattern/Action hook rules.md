---
name: frontend-action-hooks
description: Action hook rules for the OpenJustice React frontend — how to write workflow orchestration hooks that compose multiple mutations or queries, the `{ execute, status, error, reset?, cancel? }` return contract, when to write an action vs. just calling a mutation directly, the rule for which side effects belong inside an action vs. in the calling container, optimistic updates with rollback, and cancellation. Use this skill whenever creating a file in `actions/`, when sequencing multiple mutations, when implementing optimistic UI with rollback, when adding retries or cancellation to a workflow, when wondering whether something should be an action or just a mutation call from a container, or when the user asks "how do I chain these", "where should this side effect go", "how do I make this optimistic", or anything about workflow composition. Trigger this skill any time work involves more than one server interaction in sequence or any logic richer than "call one endpoint" — getting the action/container/mutation boundaries wrong leaks workflow logic into UI code where it's hard to reuse and harder to test.
---

# Frontend Action Hooks

Actions are the **workflow layer** between mutations and the container. A mutation wraps one HTTP write. A container manages UI state. An action fills the gap: it composes multiple mutations or queries into a single workflow that can be triggered as one operation.

For the underlying mutations and queries, see the data layer skill. For container patterns, see the container/UI skill. For cross-feature event coordination, see the events skill.

## Why this matters

Without an actions layer, workflow logic ends up in containers. A container that creates a case, uploads attachments, marks the case ready, and navigates becomes 80 lines of orchestration mixed with UI state. That logic can't be reused by a different container that needs the same workflow with different navigation. It can't be tested without rendering a component. And if any step changes (an extra retry, a polling check), every caller has to be updated.

Actions extract the workflow into a reusable, testable unit with a small, predictable contract. The container shrinks back to its real job — wiring the workflow to UI events and reacting to its status.

The rules here optimize for:
- **Reusability** — the same workflow is callable from any container without copy-paste.
- **Composability** — actions can be chained with their callers' own logic without leaking abstractions.
- **Predictability** — every action exposes the same shape, so callers don't need to learn a new API per workflow.

---

## What an action is, and isn't

An action is a hook that:
- Composes one or more mutations, queries, or other side effects into a workflow
- Owns its own status and error state for the workflow as a whole
- Returns a uniform contract callers can rely on
- Stays UI-agnostic (no navigation, no toasts, no modals)

An action is **not**:
- A wrapper around a single mutation that adds nothing — that's just the mutation
- A UI orchestrator that decides what to render — that's the container
- A side-effect machine that bakes navigation or toasts into its name — that's a misuse pattern (see anti-patterns)

If a workflow is "call one mutation," skip the action. The container can call the mutation directly. Actions earn their place when there's genuine multi-step composition OR a reusable side effect (like domain event dispatch) that always fires.

---

## When to write an action

Write an action when **any** of these is true:

1. **The workflow has more than one step.** Multiple mutations, or a mutation followed by a refetch, or any sequence that needs to complete as a unit.
2. **The workflow has its own internal state** beyond what one mutation provides — combined status across multiple mutations, retry attempts, polling progress, optimistic state to roll back.
3. **The workflow has an intrinsic side effect** that must fire whenever the workflow runs — a domain event dispatch, a cache mutation across keys, an optimistic snapshot. These are facts about the workflow, not decisions of the caller.
4. **The same workflow is called from two or more containers.** Even a one-step workflow earns an action when it's reused, because centralizing it makes future changes safe.

If none of these apply — a single mutation called from a single container with no extra state — the container calls the mutation directly. Don't wrap mutations in actions out of habit.

---

## The return contract

Every action returns the same shape:

```typescript
type ActionResult<TArgs, TResult> = {
  execute: (args: TArgs) => Promise<TResult>;
  status: "idle" | "pending" | "success" | "error";
  error: NormalizedApiError | null;
  reset?: () => void;
  cancel?: () => void;
};
```

### `execute`

The workflow entry point. Always async. Takes whatever input the workflow needs, returns whatever the workflow produces. The caller is expected to `await` it.

```typescript
const submitCase = useSubmitCase();
const result = await submitCase.execute({ title, description });
```

`execute` should also re-throw on failure so the caller can `try/catch` or attach `.catch()` if it cares. Don't swallow errors silently — set `status` and `error` *and* throw.

### `status`

Mirrors React Query's status values: `"idle" | "pending" | "success" | "error"`. The container reads this to drive loading UI, disabled states, and post-success rendering.

For single-mutation actions, you can pass through the underlying mutation's status. For multi-step workflows, the action owns its own status state because no single mutation's status reflects the workflow as a whole.

### `error`

A `NormalizedApiError` (from the API layer's normalization) or `null`. Same reasoning as `status` — for multi-step workflows the action owns this so it reflects whatever step failed.

### `reset?` (optional)

Returns the action to `idle` and clears `error`. Include this when the workflow can be retried from a clean state — most commonly, when the UI shows an error message that should disappear when the user closes a modal or starts over.

### `cancel?` (optional)

Aborts an in-flight workflow. Include this for long-running operations: file uploads, exports, multi-step submissions where the user might back out partway. If you can't actually abort the underlying request (no `AbortSignal` plumbed through), don't include `cancel` — a fake cancel that just hides the spinner while the request keeps running is worse than no cancel.

---

## Side effects: intrinsic vs. caller-decided

This is the most important rule in the skill, and the one most likely to be violated.

A side effect is **intrinsic** if it always fires regardless of the calling context. It's **caller-decided** if different callers want different behavior.

| Side effect | Type | Belongs in |
|---|---|---|
| Cache invalidation tied to the workflow | Intrinsic | Action (or the underlying mutation) |
| Domain event dispatch ("case:submitted") | Intrinsic | Action |
| Optimistic cache update + rollback | Intrinsic | Action |
| Navigation (`router.push`) | Caller-decided | Container, after `await execute()` |
| Toasts ("Case created!") | Caller-decided | Container |
| Closing a modal | Caller-decided | Container |
| Analytics that always fires | Intrinsic | Action |
| Analytics that varies by surface | Caller-decided | Container |

The test: would this side effect fire the same way no matter where the action is called from? If yes, it's intrinsic and lives in the action. If a different caller might want different behavior — different route, different toast, no toast at all — it's caller-decided and the action does not touch it.

```typescript
// ✅ Intrinsic side effect — always fires
export function useDeleteCase() {
  const deleteCaseMutation = useDeleteCaseMutation();

  return {
    execute: async (id: string) => {
      await deleteCaseMutation.mutateAsync(id);
      eventBus.emit("case:deleted", { id });   // intrinsic — a fact about the system
    },
    status: deleteCaseMutation.status,
    error: deleteCaseMutation.error,
    reset: deleteCaseMutation.reset,
  };
}

// ✅ Caller-decided — container handles UI behavior at the call site
function useCaseListContainer() {
  const router = useRouter();
  const deleteCase = useDeleteCase();

  return {
    handlers: {
      onDelete: async (id: string) => {
        await deleteCase.execute(id);
        toast.success("Case deleted");
        router.push("/cases");
      },
    },
  };
}
```

The same `useDeleteCase` is callable from a list view (which navigates back), from a detail view (which navigates to the parent), and from a bulk-delete UI (which shows one summary toast at the end). The action is reusable in all three because it doesn't presume the UI behavior.

---

## Composition patterns

### Sequential mutations

When the workflow is "do A, then do B with the result of A":

```typescript
export function useSubmitCaseWithDocuments() {
  const createCaseMutation = useCreateCaseMutation();
  const uploadDocsMutation = useUploadDocumentsMutation();
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const execute = async (input: CaseSubmissionInput) => {
    setStatus("pending");
    setError(null);
    try {
      const created = await createCaseMutation.mutateAsync(input.case);
      if (input.documents.length > 0) {
        await uploadDocsMutation.mutateAsync({
          caseId: created.id,
          documents: input.documents,
        });
      }
      setStatus("success");
      return created;
    } catch (e) {
      const normalized = normalizeApiError(e);
      setError(normalized);
      setStatus("error");
      throw normalized;
    }
  };

  return {
    execute,
    status,
    error,
    reset: () => {
      setStatus("idle");
      setError(null);
      createCaseMutation.reset();
      uploadDocsMutation.reset();
    },
  };
}
```

The action owns `status` and `error` because no single underlying mutation's status reflects the multi-step workflow. The `reset` clears both the action's state and the underlying mutations' state.

### Optimistic update with rollback

The pattern: snapshot the current cache, apply the optimistic update, fire the mutation, roll back on error.

```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const toggleMutation = useToggleFavoriteMutation();

  const execute = async (caseId: string) => {
    const queryKey = caseQueryKeys.detail(caseId);
    const previous = queryClient.getQueryData<Case>(queryKey);

    queryClient.setQueryData<Case>(queryKey, (old) =>
      old ? { ...old, isFavorite: !old.isFavorite } : old
    );

    try {
      return await toggleMutation.mutateAsync(caseId);
    } catch (e) {
      queryClient.setQueryData(queryKey, previous);
      throw e;
    }
  };

  return {
    execute,
    status: toggleMutation.status,
    error: toggleMutation.error,
    reset: toggleMutation.reset,
  };
}
```

Optimistic updates **always** belong in actions, never in mutations. The mutation layer's job is one HTTP write plus invalidation; coordinating snapshot + apply + rollback is workflow logic.

### Cancellation

When the workflow needs to be abortable, plumb an `AbortSignal` through to the API layer and expose `cancel`:

```typescript
export function useExportCases() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const execute = async (filters: CaseFilters) => {
    abortControllerRef.current = new AbortController();
    setStatus("pending");
    setError(null);
    try {
      const result = await exportCasesApi({
        filters,
        signal: abortControllerRef.current.signal,
      });
      setStatus("success");
      return result;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("idle");
        return;
      }
      const normalized = normalizeApiError(e);
      setError(normalized);
      setStatus("error");
      throw normalized;
    }
  };

  const cancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  return {
    execute,
    status,
    error,
    cancel,
    reset: () => {
      setStatus("idle");
      setError(null);
    },
  };
}
```

Note: this requires the underlying API function to accept an `AbortSignal`. If it doesn't, fix the API function first; don't fake cancellation by hiding the in-flight request.

### Polling (use sparingly)

If the workflow involves polling (kick off a job, poll status until done), it's still an action. The shape is similar to cancellation — internal state, own status, own error. But before writing one, check whether `useQuery` with `refetchInterval` solves the problem more simply. Polling-as-action is right when there's a clear start trigger and a clear stop condition that isn't naturally a query.

---

## Anti-patterns

### Side effects baked into the hook name

```typescript
// ❌ Wrong
export function useSubmitCaseAndNavigateToTimeline() {
  // ...
}
```

This pattern looks tidy at first but doesn't scale. Naming compounds — `useSubmitCaseAndNavigateAndShowToastAndDispatchEvent` is unworkable. And the moment a second caller wants the same workflow with different post-success behavior, the action is useless and you write a near-duplicate.

The fix: action exposes the workflow only; caller decides the side effects via `await execute()`.

### Hidden conditional side effects

```typescript
// ❌ Wrong
export function useSubmitCase() {
  return {
    execute: async (data: CaseData, shouldNavigate?: boolean) => {
      await mutation.mutateAsync(data);
      if (shouldNavigate) router.push("/cases");
    },
  };
}
```

The presence or absence of navigation depends on a flag the caller passes. From outside, you can't tell whether `execute(data)` will navigate without reading the action. Make the action behavior unconditional and put the conditional logic in the caller.

### Returning the raw mutation

```typescript
// ❌ Wrong
export function useSubmitCase() {
  return useCreateCaseMutation();
}
```

If the action is just returning the mutation, delete the action and have the container call the mutation directly. The wrapping adds an indirection layer with no value.

### Actions calling other actions

```typescript
// ❌ Usually wrong
export function useFullCaseSubmissionWorkflow() {
  const submitCase = useSubmitCase();
  const sendNotification = useSendNotification();
  // chain them
}
```

This usually means the workflows weren't decomposed correctly. Either:
- The two actions are really one workflow, in which case merge them and have the action compose the underlying mutations directly.
- They're genuinely separate workflows the caller chooses to chain, in which case the chaining belongs in the container.

A real exception is when an action wraps a long-lived workflow (like a streaming chat completion) and a small inner action is reusable on its own. Those cases exist but are rare; default to calling mutations from actions, and actions from containers.

### Mutation hooks doing workflow

```typescript
// ❌ Wrong — workflow logic leaked into the mutation
export function useSubmitCaseMutation() {
  return useMutation({
    mutationFn: async (data: CaseData) => {
      const created = await createCase(data);
      await uploadDocuments(created.id, data.documents);
      await markCaseReady(created.id);
      return created;
    },
  });
}
```

Three endpoints, sequenced. That's an action, not a mutation. Each individual endpoint should be its own one-mutation hook, and an action composes them.

---

## What this skill does NOT cover

- **Mutation hooks themselves** (single-endpoint writes, `onSuccess` rules, cache invalidation patterns) — data layer skill
- **Query hooks** — data layer skill
- **Container patterns** (the `{ state, handlers }` shape, when to extract a container, how to consume actions) — container/UI skill
- **Realtime subscriptions** (WebSocket/SSE lifecycle pushing into the cache) — subscriptions skill
- **Cross-feature event bus** (when to emit events, when to listen) — events skill
- **Form integration** (wiring `react-hook-form` submit to an action) — forms skill

When writing an action, stay in this skill. The moment the work involves a single endpoint with no composition or reusable workflow logic, it belongs back in the data layer or the container.
