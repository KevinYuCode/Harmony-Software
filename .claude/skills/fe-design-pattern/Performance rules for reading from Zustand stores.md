---
name: frontend-zustand-performance
description: Performance rules for reading from Zustand stores in the OpenJustice React frontend — narrow selectors, `getState()` for callback-time reads, the "selector must not return a new reference" rule, equality functions (`useShallow`, `useStoreWithEqualityFn`), and isolating high-frequency consumers with `memo()`. Use this skill whenever subscribing to a Zustand store, when a component re-renders too often, when adding a piece of store state to a component, when implementing drag/resize/scroll/animation that touches a store, when reviewing PRs that read from a store, or when the user asks "why is this re-rendering", "is this selector right", "should I use `useShallow`", "is this slow", or anything about React performance involving Zustand. Trigger this skill any time store reads are being written or reviewed — most "the UI is laggy" reports trace back to a wrong subscription pattern in Zustand, and the patterns are easy to teach but easy to miss in review.
---

# Zustand Performance Rules

This skill is about **how to read from a Zustand store without causing unnecessary re-renders**. It assumes the state is correctly placed in Zustand to begin with — for that decision, see the state management skill.

The rules here aren't style preferences. The default subscription pattern looks innocent and silently re-renders the entire component on every store update. In a feature with drag-and-drop, real-time updates, scrolling, or any high-frequency state, that turns into observable lag within minutes of use.

## The mental model — what causes a re-render

Zustand subscriptions work like this:

1. When you call `useStore((s) => s.something)`, the component subscribes to the store.
2. On every `set()` call (every state update, anywhere in the store), Zustand runs your selector function with the new state.
3. It compares the selector's return value to the previous return value using `Object.is` by default (or a custom equality function if you provide one).
4. If they differ, it schedules a re-render of your component.

That's the whole model. Every performance rule in this skill follows from it.

The two failure modes:

- **Subscribing to too much.** A selector returning the entire store, or a large slice, re-renders on every change to that slice — even if you only care about one field.
- **Selector returns a new reference every call.** A selector that builds an object or computes an array (`s.items.filter(...)`) returns a new object on every run. `Object.is` says "different," and you re-render every single `set()`, no matter what changed.

Both are silent. The code looks fine; the profiler tells the truth.

---

## Rule 1: Use narrow selectors

A selector should return the **smallest piece of state** the component actually uses for rendering. Subscribing to more than you need re-renders the component on changes to fields it doesn't care about.

```typescript
// ✅ Component re-renders only when the count changes
const nodeCount = useDialogFlowStore((s) => s.nodes.length);
const isEmpty = nodeCount === 0;

// ❌ Re-renders on every node position update, even though the component only cares about emptiness
const nodes = useDialogFlowStore((s) => s.nodes);
const isEmpty = nodes.length === 0;
```

The rule of thumb: **derive in the selector when you can.** Pull the smallest scalar (a number, a boolean, a string, an ID) the component actually displays or branches on. Pull arrays and objects only when the component genuinely renders them.

If a component needs three independent pieces, write three selectors. Don't try to grab them in one shot — that runs into Rule 3.

---

## Rule 2: `getState()` for callback-time reads

If you only need a piece of state **inside a callback** (a click handler, a save handler, an effect) and not for rendering, **don't subscribe to it**. Read it at call time with `useStore.getState()`.

```typescript
// ✅ No subscription, no re-renders. Reads the current value when the click happens.
const onSave = useCallback(() => {
  const { nodes, edges } = useDialogFlowStore.getState();
  saveCanvas(nodes, edges);
}, []);

// ❌ Subscribes to nodes and edges. Re-renders the entire component on every position change,
//    just so the click handler has up-to-date data — which it would have gotten anyway via getState().
const nodes = useDialogFlowStore((s) => s.nodes);
const edges = useDialogFlowStore((s) => s.edges);
const onSave = useCallback(() => {
  saveCanvas(nodes, edges);
}, [nodes, edges]);
```

This is the single biggest perf win in Zustand-heavy code. A canvas with 200 nodes whose handler subscribes to `nodes` re-renders 200+ times during a drag. Switching to `getState()` reads the same data at the right time and re-renders zero times.

The test: **do you need this value for rendering, or only when an event fires?** If only when an event fires, `getState()`.

---

## Rule 3: A selector must not return a new reference on every call

This is the subtle one. A selector that builds an object, filters an array, maps a list, or otherwise creates a new value every time it runs will re-render on **every** `set()`, no matter what changed.

### The object-form pitfall

```typescript
// ❌ Returns a new object every call. Re-renders on every store update.
const { nodes, edges } = useDialogFlowStore((s) => ({
  nodes: s.nodes,
  edges: s.edges,
}));
```

Even if `s.nodes` and `s.edges` haven't changed, the selector returns a fresh `{}` wrapper. `Object.is(prev, next)` is always false. Re-render every time.

Two correct ways to fix it:

```typescript
// ✅ Two separate subscriptions, each returns a stable reference
const nodes = useDialogFlowStore((s) => s.nodes);
const edges = useDialogFlowStore((s) => s.edges);

// ✅ Single subscription with shallow equality
import { useShallow } from "zustand/react/shallow";

const { nodes, edges } = useDialogFlowStore(
  useShallow((s) => ({ nodes: s.nodes, edges: s.edges }))
);
```

The two-selector form is simpler. Use the `useShallow` form when you genuinely need both fields together as one return value (e.g., destructuring at the call site is awkward otherwise, or you're passing them as a single prop).

### The derived-array pitfall

```typescript
// ❌ filter() returns a new array every call. Re-renders on every store update.
const activeItems = useStore((s) => s.items.filter((i) => i.active));
```

Same problem: `filter` creates a new array. Even if `items` didn't change at all, the selector return is a new reference.

The fix:

```typescript
// ✅ Subscribe to the raw data, derive in the component (or with useMemo if expensive)
const items = useStore((s) => s.items);
const activeItems = useMemo(() => items.filter((i) => i.active), [items]);
```

Now the selector returns `s.items` (a stable reference unless `items` actually changed), and the derivation happens once per actual change.

### The general principle

A selector must return a value that's **referentially stable when the underlying data hasn't changed**. Primitives (numbers, strings, booleans) are always stable. Direct field reads (`s.nodes`) are stable as long as the field reference itself is stable — which it is unless the store specifically replaces the array/object.

If your selector calls `.filter`, `.map`, `.slice`, `.concat`, or constructs `{ ... }` / `[ ... ]`, you're producing a new reference. That's the smell.

---

## Rule 4: Equality functions for data-only subscriptions

Sometimes you genuinely need the full array or object for rendering, but the array updates frequently in ways the component doesn't care about. The classic case: a canvas of nodes where positions update on every drag frame, but the component only re-renders when nodes are added, removed, or have their non-position data changed.

The fix is a custom equality function passed via `useStoreWithEqualityFn`:

```typescript
import { useStoreWithEqualityFn } from "zustand/traditional";
import { nodesDataEqual } from "@/feature/dialog-flow-canvas/lib/nodes-data-equal";

const nodes = useStoreWithEqualityFn(
  useDialogFlowStore,
  (s) => s.nodes,
  nodesDataEqual
);
```

The equality function is your custom "did anything I care about actually change?" check. It compares the previous and next selector return values and returns `true` if they're equal-enough-to-skip-rerender.

```typescript
// apps/frontend/src/feature/dialog-flow-canvas/lib/nodes-data-equal.ts
export function nodesDataEqual(prev: Node[], next: Node[]): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return false;
    if (prev[i].data !== next[i].data) return false; // ignore position
    if (prev[i].type !== next[i].type) return false;
  }
  return true;
}
```

Three things to know:

- **`useShallow` is for the common case** — "compare top-level fields of the returned object/array shallowly." Reach for `useStoreWithEqualityFn` only when you need a custom comparison (like ignoring position).
- **Zustand v5's `persist` middleware strips the equality overload from the bound hook** in some configurations. If your store uses `persist`, you'll need `useStoreWithEqualityFn` from `zustand/traditional` instead of relying on the bound hook to accept an equality function directly.
- **Equality functions run on every `set()`.** They should be cheap. Don't deep-clone, don't recurse arbitrarily — write them tight, with early exits.

---

## Rule 5: Action methods are free — subscribe to them freely

Methods defined on the store (action-like methods like `startStreaming`, `appendToken`, `setDraft`) are stable references. They're created once when the store initializes and don't change. Subscribing to them is effectively free — it never causes a re-render.

```typescript
// ✅ Always fine, regardless of how often state changes
const startStreaming = useConversationStore((s) => s.startStreaming);
const appendToken = useConversationStore((s) => s.appendToken);
const finishStreaming = useConversationStore((s) => s.finishStreaming);
```

This means: don't combine actions and state in one selector to "save subscriptions" — actions are free, and combining them with state runs into Rule 3.

```typescript
// ❌ Constructs a new object → re-render on every store update
const { isStreaming, startStreaming } = useStore((s) => ({
  isStreaming: s.isStreaming,
  startStreaming: s.startStreaming,
}));

// ✅ Two separate subscriptions; the action selector never re-renders
const isStreaming = useStore((s) => s.isStreaming);
const startStreaming = useStore((s) => s.startStreaming);
```

---

## Rule 6: Isolate high-frequency consumers with `memo()`

When a component renders something that updates frequently (a canvas with `<ReactFlow nodes={nodes} />`, a virtualized list, an animated element), wrap it in `React.memo` so its parent's unrelated re-renders don't propagate down.

```typescript
// ✅ Canvas re-renders only when its props actually change
const CanvasView = memo(function CanvasView({ nodes, edges }: Props) {
  return <ReactFlow nodes={nodes} edges={edges} />;
});
```

The pattern: any component reading high-frequency store state and rendering something expensive (a complex SVG, a list of >50 items, anything with internal layout work) lives in its own `memo()`-wrapped component. Its siblings — toolbars, headers, status bars — re-render independently and don't pull the expensive subtree along with them.

This composes with the selector rules: the memoized component subscribes to the store with narrow selectors and equality functions. Its parent doesn't subscribe to the volatile state at all, so the parent never re-renders on drag.

---

## Diagnosing perf issues

When something is slow, walk this in order:

1. **Open React DevTools Profiler.** Record an interaction (drag, scroll, type). Look at which components re-rendered and how long each took. Re-renders that shouldn't have happened jump out immediately.
2. **For each unexpected re-render, check the store reads in that component.** Apply Rules 1–4: narrow the selector, switch to `getState()` for callback-only reads, fix selectors that return new references, add equality functions for data-only subscriptions.
3. **If a component re-renders correctly but its render is just expensive,** apply Rule 6: wrap it in `memo()` and isolate it from siblings whose updates shouldn't trigger its work.
4. **If multiple components in a feature all re-render together on every keystroke,** they're probably subscribed to a draft/text field via a wide selector, or sharing a parent that re-renders. Narrow the parent's subscriptions and let leaves subscribe directly.

Don't optimize blindly. Profile first, fix one thing, profile again. Most lag traces back to one or two violations of the rules above; fixing them eliminates the issue completely without needing to touch anything else.

---

## Decision flowchart

When reading a piece of store state into a component:

1. **Do you need the value for rendering, or only inside a callback?**
   - Callback only → `useStore.getState()` inside the callback. **Done.**
   - Rendering → continue.
2. **Is what you need a primitive or a small derivation (length, boolean flag, ID)?**
   - Yes → narrow selector that returns the primitive directly. **Done.**
   - No (need an array or object) → continue.
3. **Does the selector return a stable reference (`s.field`), or is it constructing something (`{...}`, `.filter`, `.map`)?**
   - Stable reference → bare selector. **Done.**
   - Constructing → continue.
4. **Are you grouping multiple stable fields for convenience?**
   - Yes → use `useShallow`, or split into multiple selectors. **Done.**
5. **Are you returning a derived/filtered/computed value?**
   - The data is small and changes rarely → it's fine; accept the re-renders.
   - The data is large or changes frequently → subscribe to the raw data, derive with `useMemo` in the component.
6. **Are you returning the full data but only care about a subset of changes?**
   - Use `useStoreWithEqualityFn` with a custom equality function.
7. **Is the subscribed component expensive to render and updates often?**
   - Wrap it in `memo()` so siblings don't re-render with it.

---

## Anti-patterns

### "Just give me the whole store"

```typescript
// ❌ Re-renders on every state change
const store = useDialogFlowStore();
const { nodes } = store;
```

Defeats the entire selector mechanism. Every `set()` re-renders the component. Always use a selector.

### Subscribing to actions and state in one object

```typescript
// ❌ New object every call → re-render on every state update
const { nodes, addNode } = useStore((s) => ({ nodes: s.nodes, addNode: s.addNode }));
```

See Rule 5. Two subscriptions, free.

### Computing in the selector when it's not stable

```typescript
// ❌ New array every call
const visibleNodes = useStore((s) => s.nodes.filter((n) => !n.hidden));
```

See Rule 3. Subscribe to the raw data, compute outside.

### Adding `memo()` instead of fixing selectors

`memo()` only helps if the component's *props* are stable. If you're passing `nodes={useStore((s) => s.nodes.filter(...))}` to a memoized component, `nodes` is a new array every time and `memo` doesn't help. Fix the selector first; reach for `memo` for genuinely expensive renders that have stable props.

### Using `useEffect` to mirror store data into local state

```typescript
// ❌ Two sources of truth; re-render storm; defeats every optimization
const nodes = useStore((s) => s.nodes);
const [localNodes, setLocalNodes] = useState(nodes);
useEffect(() => setLocalNodes(nodes), [nodes]);
```

The store is already the source of truth. Reading from it directly is what selectors are for. Mirroring into `useState` adds a render plus a state update for every change.

### Forgetting that equality functions run on every `set()`

```typescript
// ❌ Equality function deeply traverses on every store update
const nodes = useStoreWithEqualityFn(
  useStore,
  (s) => s.nodes,
  (a, b) => JSON.stringify(a) === JSON.stringify(b)
);
```

Every `set()` runs this comparison. `JSON.stringify` over a large array on every store update produces its own perf problem. Equality functions need to be cheap and exit early.

---

## What this skill does NOT cover

- **Where state should live** (the ownership model, when to use Zustand at all) — state management skill
- **Store file shape, event-like methods, never duplicating server state** — state management skill
- **React Query subscription performance** (`select`, `notifyOnChangeProps`, query invalidation cost) — data layer skill
- **General React performance** outside of Zustand (`useMemo` strategy, `useCallback` discipline, Suspense boundaries) — outside this skill
- **Rendering performance** (virtualization, deferred values, transitions) — outside this skill

When the question is "why is this re-rendering" and the answer involves a Zustand store, this is the skill. When the question is "should this state be in Zustand at all," that's the state management skill — answer that one first.
