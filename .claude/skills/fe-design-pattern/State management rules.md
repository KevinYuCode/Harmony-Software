---
name: frontend-state-management
description: State management rules for the OpenJustice React frontend — the ownership model that determines where each piece of state lives (React Query, container hook, action hook, Zustand store, or event bus), when to create a Zustand store and when not to, store file shape and naming, event-like method naming patterns, and the absolute rule against duplicating server state in client stores. Use this skill whenever creating a Zustand store, deciding where a piece of state should live, debating between `useState` and a store, debating between a store and React Query, when state seems to be in the wrong place, when reviewing PRs that introduce new stores, or when the user asks "where should this state go", "should I use Zustand for this", "do I need a store", or anything about client state architecture. Trigger this skill any time state placement is being decided — putting state in the wrong layer is the most common cause of sync bugs, race conditions, and unexplainable UI behavior.
---

# Frontend State Management

This skill defines **where each piece of state lives** and how Zustand stores are written when state genuinely belongs in one. It does not cover Zustand performance and selector mechanics (separate skill), React Query internals (data layer skill), or the event bus (events skill).

## Why this matters

State that lives in the wrong layer creates problems that are hard to trace later:

- Server state put in Zustand becomes a second cache that drifts from React Query's cache. Two sources of truth produce two versions of the UI.
- Local UI state put in Zustand becomes globally visible, leaks across features, and survives navigation when it shouldn't.
- Workflow state put in `useState` inside a UI component disappears on unmount mid-workflow, leaving the user staring at a half-completed action.
- A store created out of habit ("I'll just throw it in Zustand") becomes hard to remove later because consumers spread out and dependencies tangle.

The rules here are about putting state *exactly once, in the place that matches its scope and lifecycle*.

---

## The ownership model

Every piece of state has an owner. The owner is determined by two questions:

1. **Where does the state come from?** — server, server-pushed, action workflow, user input, or pure UI.
2. **What's its scope and lifecycle?** — one component, multiple components in a feature, multiple features, or app-wide.

Use this table to find the owner:

| Where the state comes from | Scope / Lifecycle | Owner |
|---|---|---|
| Server (queryable) | App-wide cache | **React Query** (via a query hook) |
| Server (write op) | One mutation call | **React Query** (via a mutation hook) |
| Server (pushed via WebSocket/SSE, query-shaped) | App-wide cache | **React Query cache** (subscription writes via `setQueryData`) |
| Server (pushed, streaming/ephemeral) | Feature, accumulating | **Zustand store** (subscription writes via store methods) |
| Multi-step workflow status | One workflow execution | **Action hook** (internal state) |
| User input, one component | One component | `useState` in the UI or its container |
| User input or UI state, one feature | The feature | **Container hook** (`{ state, handlers }`) |
| User input or UI state surviving unmounts | The feature | **Zustand store** |
| User input or UI state shared across features | App-wide | **Zustand store at root** (rare) |
| Domain event for cross-feature reaction | App-wide | **Event bus** (separate skill) |

### A decision flowchart

When placing a new piece of state, walk this in order:

1. **Did this come from the server?**
   - Yes, queryable → React Query (query hook)
   - Yes, written by the client → React Query mutation
   - Yes, server-pushed and corresponds to a query → React Query cache via subscription
   - Yes, server-pushed and streaming/accumulating → Zustand store via subscription
2. **Is this the status of a multi-step workflow?** → action hook's internal state
3. **Is this UI state that one component owns?** → `useState` in the component or its container
4. **Is this UI state shared by multiple components within one feature?** → container hook (lift the state to a common parent's container)
5. **Does this UI state need to survive a component unmount?** (drafts, modal open state during navigation, accumulated stream) → Zustand store
6. **Does this state genuinely cross feature boundaries?** → Zustand store at root **or** an event for cross-feature reactions
7. **Anywhere else?** → you probably haven't asked the question correctly; revisit step 1

The critical step is step 1. Most "where should this go" debates are really "I'm not sure if this is server state." If the data exists on the server, it's React Query. Always.

### Layered owners are normal

A single feature usually has multiple owners working together:

- React Query holds the list of cases (server state).
- The container holds `selectedCaseId` and `isFiltersPanelOpen` (transient UI).
- A Zustand store holds the in-progress streaming response (accumulating, survives unmount).
- An action hook holds the multi-step submission status (workflow lifecycle).

This is correct. Each owner handles one concern. The mistake is putting all of these in one place because "it's easier."

---

## When to create a Zustand store

The bar is high. The default answer to "should I create a Zustand store?" is **no** — try a container hook first. A store is justified when the state has at least one of these properties:

1. **It survives component unmounts.** A user opens a chat panel, navigates away, comes back — the streaming message in progress should still be there. Container state is gone the moment the panel unmounts.

2. **It accumulates over time from a non-React source.** Tokens streaming in over SSE, real-time presence updates. The data isn't owned by any particular component's render cycle.

3. **It's needed by components that don't share a common parent in the tree.** Two sidebars, a header badge, and a modal all need to know the current draft state. Lifting to a common ancestor would lift to the feature root, which is fine — but if the feature root doesn't already have a container, a store is cleaner than synthesizing one.

4. **It's optimistic state for a workflow** that the cache can't hold cleanly (multi-step pending state, in-progress drag-and-drop reorderings before commit).

If none of those apply, use a container hook. Lifting state to a container is almost always the right first move; reach for Zustand only when lifting doesn't fit.

### Reasons that are *not* good enough on their own

- "It would avoid prop drilling." Lift to a container first. Three levels of prop drilling is fine.
- "Other features use Zustand." Each piece of state earns its placement on its own merits.
- "I want global state." Global is almost never what you actually want. Feature-scoped is the default.
- "It's easier to import than to pass props." Easier-to-import is exactly what creates spaghetti dependencies later.

---

## Store file shape

Stores live at `<level>/stores/<name>.store.ts` and follow the same locality rules as everything else: feature-level if used across the feature, sub-feature-level if self-contained, root-level only when genuinely cross-feature.

```typescript
// apps/frontend/src/feature/conversation/stores/conversation.store.ts
import { create } from "zustand";

type ConversationState = {
  // ── State ──
  streamingMessageId: string | null;
  streamingContent: string;
  draftMessage: string;
  isComposerExpanded: boolean;

  // ── Methods (event-like names) ──
  startStreaming: (messageId: string) => void;
  appendToken: (token: string) => void;
  finishStreaming: () => void;
  cancelStreaming: () => void;

  setDraft: (draft: string) => void;
  clearDraft: () => void;

  toggleComposerExpanded: () => void;
};

export const useConversationStore = create<ConversationState>((set) => ({
  streamingMessageId: null,
  streamingContent: "",
  draftMessage: "",
  isComposerExpanded: false,

  startStreaming: (messageId) =>
    set({ streamingMessageId: messageId, streamingContent: "" }),

  appendToken: (token) =>
    set((state) => ({ streamingContent: state.streamingContent + token })),

  finishStreaming: () =>
    set({ streamingMessageId: null, streamingContent: "" }),

  cancelStreaming: () =>
    set({ streamingMessageId: null, streamingContent: "" }),

  setDraft: (draft) => set({ draftMessage: draft }),
  clearDraft: () => set({ draftMessage: "" }),

  toggleComposerExpanded: () =>
    set((state) => ({ isComposerExpanded: !state.isComposerExpanded })),
}));
```

Naming conventions for the file and export are covered by the naming skill in detail. The summary: file is `<feature>.store.ts`, export is `use<Feature>Store`.

### One feature, one store (default)

A feature gets one store unless there's a reason to split. Putting all of a feature's client state in one store keeps related concerns together and makes invariants easier to enforce (`startStreaming` resets `streamingContent` because they live in the same place).

Split into multiple stores within a feature only when:
- The slices are genuinely independent (e.g., a feature has a chat surface and a filter panel, neither needs the other's state)
- One slice has very different update frequency and the split prevents unnecessary re-renders (this is a performance concern — see the performance skill)

Don't split prematurely. Most features need one store.

---

## Event-like method naming

This is the most important pattern in store design and the one most likely to be done wrong.

**Methods describe what happened, not how the state was set.** Avoid generic `setX` / `setY` setters. Prefer methods named after the event or domain action they represent.

```typescript
// ❌ Wrong: generic setters expose internals
type ConversationState = {
  isStreaming: boolean;
  streamingMessageId: string | null;
  setIsStreaming: (value: boolean) => void;
  setStreamingMessageId: (id: string | null) => void;
};

// ✅ Right: event-like methods enforce invariants
type ConversationState = {
  isStreaming: boolean;
  streamingMessageId: string | null;
  startStreaming: (messageId: string) => void;
  finishStreaming: () => void;
};
```

### Why this matters

Generic setters look harmless but they're a bug factory. With `setIsStreaming` and `setStreamingMessageId` as separate methods, callers can produce impossible states:

```typescript
// One caller does this
useStore.getState().setIsStreaming(true);
// Then forgets the second call. Now isStreaming=true but messageId=null.
```

With `startStreaming(messageId)`, that combination is unreachable. The method enforces the invariant that streaming state and the message ID are always consistent. The store's interface becomes a series of valid transitions, not a grab-bag of setters.

### Naming patterns

- **Verbs that describe events.** `startStreaming`, `finishStreaming`, `cancelStreaming`, `appendToken`, `addMessage`, `removeMessage`, `selectCase`, `clearSelection`, `openModal`, `dismissBanner`.
- **Pairs that bookend a lifecycle.** `start*` / `finish*`, `open*` / `close*`, `begin*` / `end*`. These read clearly at the call site.
- **Avoid `set*` unless the field truly is a single user-controlled value.** `setDraft` is fine because the draft message is one piece of free-form text. `setIsStreaming` is not fine — `isStreaming` is part of a multi-field invariant.

If you find yourself writing two setters that callers need to remember to call together, that's the signal: replace them with one event-like method.

---

## Never duplicate server state

If the data exists on the server and can be fetched, **it goes in React Query**, not in a Zustand store. Not as a copy. Not as a "convenient cache for offline use." Not "just for now." Never.

### Why

React Query already implements deduplication, caching with stale times, background refetching, query invalidation, optimistic updates, request retries, and devtools introspection. Mirroring server data into Zustand throws all of that away — you reimplement a worse version of each, badly, by hand.

The bug pattern: a query fetches `cases`, you copy them into a Zustand store, and now updates from another tab/user/mutation invalidate the React Query cache but the store still shows stale data. The component reads from the store and renders the wrong thing. You debug for an hour and find the duplicate.

```typescript
// ❌ Catastrophic — server state mirrored in a store
type CaseStoreState = {
  cases: Case[];                    // already in React Query
  setCases: (cases: Case[]) => void;
};

// ❌ Same problem, just less obvious
type CaseStoreState = {
  selectedCase: Case | null;        // the full Case is on the server
  setSelectedCase: (c: Case) => void;
};

// ✅ Correct — store the ID, look up the full record from React Query
type CaseStoreState = {
  selectedCaseId: string | null;
  selectCase: (id: string) => void;
  clearSelection: () => void;
};

// In a container
const selectedId = useCaseStore((s) => s.selectedCaseId);
const { data: selectedCase } = useCase(selectedId ?? "");
```

The pattern: **store IDs (or other tiny references), not full server records.** The store carries enough information to look up the server data; React Query holds the actual data.

### What "looks like server state" but isn't

These are client-only and belong in Zustand (or a container hook), not React Query:

- **Optimistic in-flight state.** "The user clicked send; the message exists on the client but the server hasn't confirmed yet." This is client state until the server's version arrives via the cache.
- **Streaming-in-progress content.** Tokens accumulating before the full message exists as a server-side record.
- **Drafts.** Not yet sent. Not on the server.
- **Local-only UI flags.** "User has dismissed this banner this session" — not persisted to the server, not server-derived.
- **Selection, focus, expansion state.** What's currently selected, what panel is open. The references might be IDs of server records, but the selection itself is client UI.

If you're unsure whether something is server state, ask: "If I refresh the page, do I expect this value to come back from the server?" Yes → React Query. No → Zustand or a container hook.

---

## Anti-patterns

### Generic `setX` for every field

```typescript
// ❌ Anti-pattern
type State = {
  step: number;
  formData: FormData;
  isSubmitting: boolean;
  error: string | null;
  setStep: (n: number) => void;
  setFormData: (d: FormData) => void;
  setIsSubmitting: (b: boolean) => void;
  setError: (e: string | null) => void;
};
```

Every field has a setter, none of which encode invariants. Callers can advance `step` without updating `formData`, set `isSubmitting: true` without clearing `error`. Replace with event-like methods (`advanceToNextStep`, `submitFailed(error)`, etc.).

### Storing full server records

```typescript
// ❌ Anti-pattern
const useCaseStore = create<{ cases: Case[]; ... }>(...);
```

Even if you populate it from a query result, this duplicates server state. Store an ID or filter criteria; let React Query own the records.

### Reaching for Zustand for one-component state

```typescript
// ❌ Anti-pattern: a store for a single modal's open/closed state
const useEditModalStore = create<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>(...);
```

If the modal lives inside one component (or one container), it's `useState`. A store globalizes the state, making it visible to anything that imports the hook — exactly the opposite of what you want for a piece of one-component UI.

### Stores that do orchestration

```typescript
// ❌ Anti-pattern: store performing async workflow
const useSubmitStore = create((set) => ({
  submitForm: async (data) => {
    set({ status: "pending" });
    const result = await fetch(...).then(r => r.json());  // fetch in store
    set({ status: "success", result });
  },
}));
```

Stores hold state and expose synchronous transitions. Async workflows belong in actions, network calls belong in the API layer, and React Query owns the result. A store with `await fetch` inside is doing three other layers' jobs.

### Duplicating state into Zustand "to make it easier"

```typescript
// ❌ Anti-pattern: shadow copy of action state
const submitAction = useSubmitCase();
useEffect(() => {
  useFormStore.getState().setStatus(submitAction.status);
}, [submitAction.status]);
```

The action already exposes `status`; consumers should read it from there. Copying it into a store creates a sync layer that can drift if the `useEffect` doesn't fire (it always will, but you're now relying on a re-render to sync state that was already correctly available). Read state where it lives, don't mirror it.

### Spreading a feature's state across many tiny stores

```typescript
// ❌ Anti-pattern
useStreamingStore;
useDraftStore;
useComposerStore;
useFiltersStore;
// ...all in one feature
```

If they're all owned by one feature and used together, they're one store with multiple slices. Splitting forces callers to import and subscribe to four hooks where one would do, and makes it easy for cross-cutting invariants to drift across stores.

---

## What this skill does NOT cover

- **Zustand performance and selector mechanics** (`useStore.getState()` for callback reads, narrow selectors, `useStoreWithEqualityFn`, isolating high-frequency consumers) — performance skill, written next
- **Cross-feature event bus** (when to emit, when to listen, the typed emitter pattern) — events skill
- **React Query internals** (query keys, invalidation, mutation patterns) — data layer skill
- **Container hook patterns** (`{ state, handlers }` shape, when to extract, composition) — container/UI skill
- **Action hook contract** (workflow orchestration, intrinsic vs. caller-decided side effects) — actions skill

When deciding *where* state goes, stay in this skill. When the state's home is determined and the question is *how to write or use it*, defer to the skill that owns that layer.
