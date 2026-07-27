---
name: frontend-hooks-and-effects
description: Rules for code that lives in or around components in the OpenJustice React frontend — custom utility hooks (what belongs in `hooks/` folders, single-responsibility, no store mutations or action calls), `useEffect` guidelines (what effects are for, common misuses), and when to hoist pure functions out of a component body or into `lib/`. Use this skill whenever creating a custom hook, writing a `useEffect`, declaring a helper function inside a component, deciding whether something belongs as a utility hook vs. a container vs. a `lib/` function, or when the user asks "should this be a useEffect", "why does my effect run twice", "where should this helper go", or anything about code-near-components organization. Trigger this skill any time hooks or effects are being written — `useEffect` misuse is the most common cause of subtle React bugs.
---

# Frontend Hooks & Effects

There are three categories of code that live in or near components: **custom utility hooks** (in `hooks/` folders), **effects** (`useEffect` inside components and containers), and **pure helper functions** (hoisted out of components or extracted to `lib/`). Each has its own rules, but they're related — getting one wrong tends to push the others out of place too.

For container hooks (which are different from utility hooks), see the components skill. For data-layer hooks (queries, mutations, actions, subscriptions), see those skills. This skill is specifically about the supporting code around components.

## Why this matters

Three failure modes show up in nearly every React codebase that doesn't have rules here:

1. **`useEffect` becomes the do-everything hook.** Data fetching, prop syncing, derived state — all wrapped in effects. Each one is a future bug: stale closures, re-render loops, state mismatches, "why did this fire twice in dev mode."
2. **The `hooks/` folder turns into a junk drawer.** A folder with 30 hooks, half of them duplicating things React already provides, the other half doing things that should've been a container.
3. **Helper functions live inside the component body** even when they don't need to. They get recreated on every render, can't be tested without rendering the component, and bloat the component file.

The rules here optimize for:
- **Effects only when truly needed** — most "I need an effect" instincts have a better answer.
- **Single-responsibility utility hooks** — each one does one thing, has a clear contract, and stays easy to reason about.
- **Pure logic where it can be tested** — outside the component body when nothing in the body depends on it, in `lib/` when reusable.

---

## Custom utility hooks

A utility hook is a reusable piece of React behavior that doesn't tie to a specific component or feature. It manages local state, DOM subscriptions, lifecycle, or browser APIs — and exposes a small interface for any component to use.

Utility hooks live in `hooks/` folders at three possible scopes (feature, sub-feature, root) following the same locality rules as everything else:

```
feature/<feature>/hooks/<name>.hook.ts            # used across the feature
feature/<feature>/components/<sub>/hooks/<name>.hook.ts  # used inside the sub-feature
src/hooks/<name>.hook.ts                          # used by 2+ features
```

### What utility hooks are good for

```typescript
// apps/frontend/src/hooks/use-debounced-value.hook.ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
```

Other classic examples:
- `useKeyboardShortcuts(map)` — register key bindings, clean up on unmount
- `useMediaQuery(query)` — track a CSS media query
- `useClickOutside(ref, callback)` — fire when a click happens outside an element
- `useIntersectionObserver(ref)` — observe when an element enters the viewport
- `useFocusTrap(ref)` — trap focus inside a modal
- `useDocumentTitle(title)` — set `document.title` while mounted
- `useLocalStorage(key, defaultValue)` — sync a value to `localStorage`

The pattern: a small primitive that wraps a single React or browser concern, returns or accepts what's needed, and cleans up after itself.

### Hard rules for utility hooks

A utility hook **must not**:

1. **Call actions, mutations, or queries.** Those compose business logic; utility hooks should be reusable across any business context. A hook that calls `useSubmitCase` is a container, not a utility hook.
2. **Read from or mutate Zustand stores.** If a hook needs feature state, it's not a utility hook — it's a feature-specific hook that should live in a container or be lifted to a custom hook inside the feature.
3. **Make network requests.** Data fetching goes through queries.
4. **Fire toasts, navigate, dispatch events, or trigger workflows.** Side effects belong in callers, not in primitives.
5. **Have business knowledge.** No hook called `useCaseShortcuts` that knows specific case-related key bindings — pass the bindings in.

If your hook needs any of the above, what you actually want is a feature-specific hook (which still goes in `hooks/`, but at the feature level) or a container hook. Utility hooks are *generic*.

### Single responsibility

A utility hook does **one** thing. If you find yourself writing a hook that does two things, split it.

```typescript
// ❌ Two responsibilities — debouncing AND tracking online status
export function useDebouncedOnlineStatus(delay: number) {
  const [online, setOnline] = useState(navigator.onLine);
  const debounced = useDebouncedValue(online, delay);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return debounced;
}

// ✅ Two single-responsibility hooks, composed at the call site
export function useOnlineStatus() { /* ... */ }
export function useDebouncedValue<T>(value: T, delay: number) { /* ... */ }

// In a container
const online = useOnlineStatus();
const debouncedOnline = useDebouncedValue(online, 1000);
```

Composition at the call site keeps each hook reusable. Combined hooks are reusable only for the specific combination they happened to bake in.

### Naming and file shape

Naming conventions are covered in detail in the naming skill. Briefly:
- File: `<name>.hook.ts` (kebab-case, no `use-` prefix in the file name)
- Export: a single function `useX` (camelCase, `use` prefix)
- File location follows locality (feature, sub-feature, or root)
- Almost always `.ts` — utility hooks rarely contain JSX

### When *not* to make a utility hook

A piece of logic is not a utility hook just because you wrote it as a hook. Don't extract:

- **One-component logic** — if only one component will ever use it, just write it inline in the container.
- **Logic that needs business knowledge** — that's a container or an action.
- **Wrappers around already-good primitives** — `useState` doesn't need a `useStateWithDefault` wrapper.

Most code does *not* belong in `hooks/`. The folder should stay small.

---

## `useEffect` — what it's for and what it isn't

`useEffect` is the most-misused hook in React. The mental model that prevents misuse:

> **`useEffect` synchronizes a component with an external system.** Anything that isn't synchronization with something *outside* React doesn't belong in `useEffect`.

External systems include the DOM (focus, scroll), the network (subscriptions), browser APIs (timers, observers, storage events), and any non-React state your app coexists with. They do *not* include props, state, or anything React already manages — those don't need synchronization, they're already in sync.

### What `useEffect` is for

Effects are correct when:

1. **Subscribing to and unsubscribing from external systems** — WebSockets, `EventSource`, custom emitters, browser events, timers, observers. Open in the effect body, close in the cleanup.

   ```typescript
   useEffect(() => {
     const handle = setInterval(tick, 1000);
     return () => clearInterval(handle);
   }, []);
   ```

2. **Imperative DOM operations that can't happen during render** — focusing an element when a modal opens, scrolling to an item, measuring layout.

   ```typescript
   useEffect(() => {
     if (isOpen) inputRef.current?.focus();
   }, [isOpen]);
   ```

3. **Logging or analytics tied to lifecycle moments** — firing once when a screen mounts, recording when a modal closes (these often belong in actions instead — see the analytics skill — but lifecycle-bound logging is the rare valid case).

4. **Synchronizing component state to a non-React source of truth** — keeping `localStorage` in sync, updating `document.title`, posting messages to a parent window.

That's nearly the entire valid surface area for effects. If your effect doesn't fit one of these, look harder.

### What `useEffect` is *not* for

This is where most bugs live. Each of the patterns below is wrong, and there's a better answer in every case.

#### Don't fetch data with `useEffect`

```typescript
// ❌ Manual fetching with effect
const [data, setData] = useState();
useEffect(() => {
  fetchCases().then(setData);
}, []);
```

Use a React Query hook. Effects don't dedup, don't cache, don't refetch on focus, don't handle race conditions. A query hook does all of that for free. See the data layer skill.

#### Don't sync props to state

```typescript
// ❌ Mirroring a prop into state via effect
const [localValue, setLocalValue] = useState(value);
useEffect(() => {
  setLocalValue(value);
}, [value]);
```

This creates two sources of truth that drift on the render in between. The fix is one of:

- **Use the prop directly.** If you don't need to modify it, just read it.
- **Derive in render.** If you need a computed value, compute it during render with `useMemo` or just inline.
- **Reset with `key`.** If you need fresh state when the prop changes, pass `key={value}` to the parent, which remounts the child with a fresh `useState` initializer.

#### Don't sync derived state with `useEffect`

```typescript
// ❌ Computing derived values in an effect
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter((i) => i.active));
}, [items]);
```

Compute in render:

```typescript
// ✅ Just compute it
const filteredItems = items.filter((i) => i.active);

// ✅ Or memoize if the computation is expensive
const filteredItems = useMemo(() => items.filter((i) => i.active), [items]);
```

The effect version causes an extra render: first render with stale `filteredItems`, then the effect runs, then re-render with the new value. Computing in render skips the round-trip.

#### Don't run "on prop change" logic in effects

```typescript
// ❌ Effect just to call a function when something changes
useEffect(() => {
  if (selected) onSelect(selected);
}, [selected]);
```

If "selected changed" is the trigger, fire `onSelect` from the *event handler* that changed selection, not from an effect that watches state. The effect form runs on every render where the dep changes — including ones from unrelated parents — and is harder to reason about.

#### Don't initialize state from props with `useEffect`

```typescript
// ❌ Stale state when initial value changes
const [value, setValue] = useState(initialValue);
useEffect(() => {
  setValue(initialValue);
}, [initialValue]);
```

Same problem as syncing props to state. Use the `key` pattern, or pass the initializer as a function and reset it deliberately when the user does something.

#### Don't chain effects

```typescript
// ❌ Effect that runs because another effect set state
useEffect(() => {
  setStep1Result(computeStep1(input));
}, [input]);

useEffect(() => {
  setStep2Result(computeStep2(step1Result));
}, [step1Result]);
```

Multi-render chains. Each effect causes a re-render that triggers the next. This is what happens when a synchronous computation got distributed across effects. Compute the chain in one place during render or with one `useMemo`.

#### Don't reach for `useEffect` to "make things work"

If you've added several effects to fix bugs and the bugs keep coming back, the issue is usually that state isn't placed correctly. Re-read the state management skill before adding more effects.

### The dep array

The dependency array is not a "when should this run" list — it's a list of values the effect depends on. React re-runs the effect when those values change, *and* runs the cleanup before each re-run.

A few rules:

- **Always include every value from outside the effect that's used inside it.** ESLint's `react-hooks/exhaustive-deps` rule should be on; trust it.
- **An empty dep array means "run on mount, clean up on unmount."** This is correct for one-shot setups (event listeners, intervals) where the cleanup needs to happen once.
- **A missing dep array (no array at all) means "run after every render."** This is almost always wrong; if you mean "on every render," there's a better way.
- **Don't lie to the dep array** to silence the linter. If you're tempted to omit a dep, that dep is probably the issue — either you don't actually need the effect, or you should restructure so the dep doesn't change as often.

### Stale closures

An effect captures the values of its dependencies at the time it was set up. If something inside changes faster than the effect re-runs, you read stale values. This is the source of "why is my interval logging the wrong number?"

```typescript
// ❌ Logs `count` from when the effect was set up — always 0
const [count, setCount] = useState(0);
useEffect(() => {
  setInterval(() => console.log(count), 1000);
}, []); // missing dep
```

Two fixes:

```typescript
// ✅ Re-set up the effect when count changes
useEffect(() => {
  const handle = setInterval(() => console.log(count), 1000);
  return () => clearInterval(handle);
}, [count]);

// ✅ Or read fresh state via a ref
const countRef = useRef(0);
useEffect(() => { countRef.current = count; });
useEffect(() => {
  const handle = setInterval(() => console.log(countRef.current), 1000);
  return () => clearInterval(handle);
}, []);
```

The first is the default. The second is for cases where re-creating the interval would cause its own problems.

---

## Pure functions outside components

A function that doesn't read from React (no hooks called inside, no closure over component state) and doesn't depend on the component's render is a **pure function**. Where it lives matters: inside the component body, every render recreates it; outside, it's created once.

### When to hoist a function out of the component body

Hoist when the function:
- **Doesn't read props or state** (or any value created by a hook)
- **Could be called from elsewhere** (even if it currently isn't)
- **Is more than a trivial one-liner** that's clearly bound to one render

```typescript
// ❌ Recreated every render. No reason for it to be inside.
export function CaseList({ cases }: Props) {
  function isUrgent(c: Case): boolean {
    return c.priority === "high" && !c.resolved;
  }
  return <>{cases.filter(isUrgent).map(...)}</>;
}

// ✅ Created once at module load, testable in isolation
function isUrgent(c: Case): boolean {
  return c.priority === "high" && !c.resolved;
}

export function CaseList({ cases }: Props) {
  return <>{cases.filter(isUrgent).map(...)}</>;
}
```

The recreation cost on every render is small in any single case but compounds across a feature. The bigger benefit is testability: `isUrgent` can be unit-tested without rendering anything.

### When to keep a function inside the component

Keep inline when:
- **It closes over props or state.** A handler that calls `setX(value)` has to be inside; it can't see `setX` otherwise.
- **It's a hook itself or calls hooks.** Custom hooks must be called at the top level of a function component.
- **It's a one-liner directly tied to one render.** Sometimes a tiny inline function reads better than the indirection of an imported one.

The line: ask whether the function would survive being moved to module scope. If it doesn't reference anything React-specific, it can move. If it does, it can't.

### When to extract to `lib/`

Once you've decided to hoist, the next question is *where to hoist it*. There are two options:

1. **Top of the same file (above the component).** Use this for tiny helpers used only by this one file.
2. **A `lib/` file.** Use this when the function is more than ~5 lines, when it's used by multiple components, or when it's worth testing in isolation.

The `lib/` placement is the same threshold as the components skill's "extract handler logic to `lib/`" guidance. The promotion path is also the same: feature-local first, root-level when shared by multiple features.

```typescript
// apps/frontend/src/feature/cases/lib/is-urgent.ts
export function isUrgent(c: Case): boolean {
  return c.priority === "high" && !c.resolved;
}

// In the component
import { isUrgent } from "@/feature/cases/lib/is-urgent";
```

The full `lib/` rules (no React, no I/O, no state, naming conventions, promotion) live in the folder structure skill.

---

## Decision flowcharts

### "I want to write a custom hook"

1. **Does it need business knowledge (specific feature data, actions, mutations)?** → it's a container hook (or a feature-specific hook in `feature/<x>/hooks/`), not a utility hook
2. **Does it touch a Zustand store, fetch data, or fire side effects?** → not a utility hook; restructure to use the right layer
3. **Is it specific to one component?** → don't extract; write it inline in the container
4. **Is it generic, reusable, single-responsibility?** → utility hook in `hooks/` (feature-local or root, depending on use)

### "I want to write a `useEffect`"

1. **Am I fetching data?** → use a query hook, not an effect
2. **Am I syncing one piece of state to another?** → don't; use derived values, lift state, or `key` to reset
3. **Am I computing a derived value?** → compute in render, optionally with `useMemo`
4. **Am I calling a function in response to a state change?** → call it from the event handler that changes the state, not from an effect
5. **Am I initializing state from a prop?** → use `key` or pass an initializer; don't `useEffect` to sync
6. **Am I subscribing to or interacting with an external system?** → `useEffect` is correct
7. **Am I doing imperative DOM work (focus, scroll, measure)?** → `useEffect` is correct
8. **None of the above?** → look harder; the answer is rarely an effect

### "I want to write a helper function inside this component"

1. **Does it close over props, state, or hook results?** → inline is correct
2. **Is it a one-line trivial helper?** → inline is fine
3. **Is it more than a few lines and doesn't depend on the component's render?** → hoist to top of file
4. **Is it 5+ lines, used elsewhere, or worth testing?** → extract to `lib/`

---

## Anti-patterns

### `useEffect` for data fetching

Already covered above. A `useEffect` + `useState` pair to fetch data is always wrong in this codebase. Use a query hook.

### `useEffect` to sync props to state

```typescript
// ❌
useEffect(() => setValue(propValue), [propValue]);
```

Read the prop directly. If you need to reset when a prop changes, use `key`.

### "Container-shaped" utility hook

```typescript
// ❌ Knows about features, calls actions — not a utility hook
export function useCaseManagement(caseId: string) {
  const { data: caseDetail } = useCaseDetail(caseId);
  const deleteCase = useDeleteCase();
  return { caseDetail, deleteCase };
}
```

This is a container, not a utility hook. Move it to `feature/cases/cases.container.ts` or to a `feature/cases/hooks/` if it's genuinely reused across multiple containers within the feature.

### Combining unrelated concerns into one hook

```typescript
// ❌ Two unrelated jobs
export function useScrollAndKeyboard() { /* ... */ }
```

Two hooks. Compose at the call site.

### Pure helper inside the component body

```typescript
// ❌ Recreated every render, untestable in isolation
export function CaseList({ cases }: Props) {
  const formatDate = (d: Date) => d.toLocaleDateString();
  return <>{cases.map((c) => <li>{formatDate(c.createdAt)}</li>)}</>;
}
```

Hoist out, or move to `lib/`.

### `useMemo` over things that don't need memoizing

```typescript
// ❌ useMemo for a primitive operation
const isOpen = useMemo(() => count > 0, [count]);
```

`useMemo` is for *expensive* computations or reference-stable returns that downstream memoization depends on. Wrapping a comparison or a simple expression with `useMemo` is overhead, not optimization.

### Effects that update state every render

```typescript
// ❌ Infinite render loop
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
}); // no dep array → runs every render
```

If you've created a render loop, the immediate fix is the dep array, but the deeper question is why the effect exists at all. Most cases here don't actually need an effect.

### Putting feature logic in a `src/hooks/` hook

```typescript
// ❌ src/hooks/use-current-case.hook.ts — hard-coded to the cases feature
export function useCurrentCase() {
  return useCaseDetail(useParams().caseId);
}
```

Cross-feature hooks at root must be feature-agnostic. A hook called `useCurrent<X>` where `<X>` is a domain belongs in that feature, not at root.

---

## Container hook readability: section headers

When a container hook grows large but can't (or shouldn't) be decomposed further, use `// ===` comment dividers to visually group related logic into named sections. This is the last resort before extraction — not a substitute for it.

### When to apply

Use section headers when:
- The container has more than ~100 lines
- It pulls from multiple sources (store state, queries, external data, feature hooks, effects)
- A reader needs to understand *what kind of thing* a declaration is, not just what it does

If decomposing into sub-hooks is feasible (each section is self-contained), do that first. Section headers are for containers that must stay as one unit.

### The pattern

```typescript
export function useMyContainer() {
  // ============================================================================
  // Refs
  // ============================================================================
  const listRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Store State
  // ============================================================================
  const activeId = useConversationStore((s) => s.activeId);
  const isStreaming = useConversationStore((s) => s.isStreaming);

  // ============================================================================
  // Queries
  // ============================================================================
  const messagesQuery = useQuery(getMessagesByIdOptions(activeId ?? ""));

  // ============================================================================
  // External Data
  // ============================================================================
  const { data: user } = useGetUser();

  // ============================================================================
  // Feature Hooks
  // ============================================================================
  const { scrollToBottom } = useScrollDown();
  const { queryLLM } = useQueryLLM();

  // ============================================================================
  // Effects
  // ============================================================================
  useEffect(() => { /* ... */ }, [activeId]);

  // ============================================================================
  // Derived State
  // ============================================================================
  const isEmpty = conversationMessages.length === 0;

  // ============================================================================
  // Return
  // ============================================================================
  return { state: { ... }, handlers: { ... } };
}
```

### Standard section order

When all sections are present, keep this order:

1. **Refs** — `useRef` declarations
2. **Store State** — Zustand selectors
3. **Queries** — React Query (`useQuery`, `useMutation`)
4. **External Data** — queries from other features
5. **Feature Hooks** — composed action/utility hooks specific to this feature
6. **Effects** — `useEffect` calls
7. **Derived State** — values computed from the above
8. **Return** — the `{ state, handlers }` object

Not every container needs all sections — only include headers that add clarity. A small container with 3 Zustand reads and 2 handlers doesn't need dividers at all.

---

## What this skill does NOT cover

- **Container hooks** (the `{ state, handlers }` ViewModel pattern) — components skill
- **Action hooks** (workflow orchestration with `{ execute, status, error }`) — actions skill
- **Query, mutation, and subscription hooks** — data layer and subscriptions skills
- **Where the `hooks/` folders live and what gets promoted to root `src/hooks/`** — folder structure skill
- **Hook and file naming** (`use*` exports, `.hook.ts` suffix, kebab-case files) — naming skill
- **Zustand selector mechanics and re-render performance** — Zustand performance skill
- **`lib/` rules in detail** (no React, no I/O, naming, file structure) — folder structure skill

When writing a custom hook, an effect, or a helper function, stay in this skill. When the question shifts to "what business logic does this contain" or "what data does this need," that's a different layer's skill.
