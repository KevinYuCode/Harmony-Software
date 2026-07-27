---
name: frontend-event-bus
description: Rules for the cross-feature event bus in the OpenJustice React frontend — when an event bus is genuinely needed vs. when React Query invalidation, router state, a store, or a service call already solves the problem; the typed emitter pattern using `mitt`; the curated event list as a single source of truth; who may emit (actions only) and who subscribes; cleanup rules; and anti-patterns that create untraceable side effects. Use this skill whenever creating a new event type, deciding whether to use an event bus, dispatching from a feature, or when the user asks "how do I tell feature X that Y happened", "should I emit an event for this", or anything about cross-feature coordination. Trigger this skill any time cross-feature fan-out is being designed.
---

# Frontend Cross-Feature Event Bus

The event bus is the **last-resort coordination mechanism** for cases where one feature does something and one or more other features must react, *and no other tool fits*. This skill exists primarily to keep the event bus small. Most cross-feature coordination needs are better served by tools that already exist; reaching for the bus when one of those would have worked creates untraceable side-effect chains that haunt the codebase forever.

For the bus's mechanical implementation, the typed emitter pattern from `mitt` (or equivalent) is what we use. For state placement and Zustand store patterns, see the state management skill.

## Why this matters

An event bus has a real cost: when feature A emits `case:deleted`, every subscriber for that event runs, in some order you don't control, doing things you can't easily inspect from feature A's code. A delete in one feature can cause a sidebar count to update, a draft to be cleared, an analytics event to fire, a toast to appear, and a modal to close — none of which are visible from the call site.

That cost is acceptable when the alternative is worse (genuinely cross-cutting events). It's not acceptable when a more direct tool would have done the job. The rules here exist to push back on every "I'll just emit an event" instinct until you can justify it.

The rules optimize for:
- **Tool fit** — every cross-feature coordination need is matched to its best-fitting tool, with the event bus being the last option.
- **Traceability** — when the bus is used, the events are typed, listed in one place, and emitted only from one layer (actions).
- **Predictable runtime** — subscribers fire only for the events they listen to, with no race conditions or shared-state slots.

---

## When you don't need the event bus (almost always)

Before adding an event, walk through these questions. Most of the time the answer makes the bus unnecessary.

### 1. Is the receiving feature reading server data that just changed?

Use **React Query invalidation**, not an event. If feature A deletes a case and feature B's sidebar shows a case count, the mutation's `onSuccess` invalidates `caseQueryKeys.lists()` and the sidebar's `useCases()` automatically refetches. No event needed. React Query is your event bus for server state — it has dedup, GC, and devtools that no homegrown bus will.

```typescript
// ✅ The mutation handles it. No event bus involvement needed.
return useMutation({
  mutationFn: deleteCase,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
  },
});
```

### 2. Is the receiving feature reacting to a route change?

Use the **router**, not an event. If switching organizations should reset everything, put `orgId` in the URL (`/orgs/:orgId/...`), have every feature key its queries by `orgId`, and let route changes trigger the natural refetch cascade. The router is already an event bus for navigation.

### 3. Is the receiver showing a toast or notification?

Use the **toast store** directly (Sonner, your own Zustand toast store, etc.), not an event. Calling `toast.success("Case created")` from the action's caller is shorter, typed, and the side effect is visible at the call site.

### 4. Is the receiver doing analytics?

Call the **analytics service** directly. `analytics.track("case_submitted", { id })` from the action is more traceable than emitting an event some analytics listener might consume.

### 5. Is the receiver a single feature that owns the relationship?

Use **direct composition**. If only the sidebar reacts to deletes, just have the sidebar's container call the same action and react inline. Don't introduce a global publish/subscribe pattern for a 1-to-1 relationship.

If you can answer "yes" to any of the above, **stop**. Don't add an event. Use the right tool.

---

## When you do need the event bus

The bus is the right tool when **all** of the following are true:

1. **The event is genuinely cross-cutting** — multiple unrelated subsystems must react, none of them owns the others.
2. **The reactions don't fit into one already-existing tool** — they aren't all "invalidate this query," they aren't all "show a toast."
3. **The emitting feature has no business knowing about the receivers** — coupling the emitter to specific listeners would violate feature encapsulation.

The canonical cases:

- **`user:logged-out`** triggers (a) clear all React Query caches, (b) reset all Zustand stores, (c) close any open modals, (d) disconnect WebSockets. Four unrelated subsystems, none owning the others, no single tool covers all of them.
- **`organization:switched`** when the org is *not* in the URL (if it is, the router handles it) — every feature must reset feature-local state and refetch.
- **Plugin-style integrations** — a feature that other features can opt into reacting to without modifying central code.
- **Bridges to non-React subsystems** — a canvas engine, audio engine, or game loop publishing events that React features subscribe to.

If you can't list 2–3 concrete subscribers from different subsystems, the event probably isn't bus-worthy. One subscriber means "use direct composition." Two subscribers in the same feature means "lift to a common parent." Cross-cutting means at least two different layers or features that shouldn't know about each other.

---

## The typed emitter pattern

When you do use the bus, use a real emitter (`mitt` is 200 bytes; `nanoevents` is similar) — not a `lastEvent` slot in a Zustand store. The slot pattern has race conditions (one event overwrites another before subscribers run) and over-rendering (every subscriber re-renders on every event, even ones it doesn't care about).

A real emitter routes only to listeners for the specific event, and there's no shared state to race over.

### File location and shape

```typescript
// apps/frontend/src/events/event-bus.ts
import mitt from "mitt";

// ── The curated event list ──
// Every cross-feature event in the entire app goes here. One place.
export type AppEvents = {
  "user:logged-out": void;
  "organization:switched": { orgId: string };
  // Add events sparingly and intentionally.
};

export const eventBus = mitt<AppEvents>();
```

Two things to notice:

- **The events are listed as a single typed union** so adding a misspelled event name fails at compile time. No stringly-typed events.
- **The file is small.** It's the contract for the whole app, but the contract should fit on one screen. If it's growing past 10 events, that's a smell — see "Curating the event list" below.

### Emitting

Only **action hooks** are allowed to emit. Not mutations, not containers, not UI, not queries. The reason: actions are the workflow layer where things genuinely "happen as a fact about the system." A mutation is one step; the event represents the workflow's completion. Emitting from anywhere else scatters events across the codebase and makes them impossible to audit.

```typescript
// apps/frontend/src/feature/auth/actions/logout.action.ts
import { eventBus } from "@/events/event-bus";
import { useLogoutMutation } from "@/feature/auth/mutations/logout.mutation";

export function useLogout() {
  const logoutMutation = useLogoutMutation();

  return {
    execute: async () => {
      await logoutMutation.mutateAsync();
      eventBus.emit("user:logged-out");
    },
    status: logoutMutation.status,
    error: logoutMutation.error,
  };
}
```

The emit happens after the mutation succeeds, as part of the action's intrinsic side effects (the action is the workflow; the event is a fact of that workflow's completion — see the action skill's "intrinsic vs. caller-decided" rule).

### Subscribing

Subscribers live in containers or root-level hooks. They register listeners in `useEffect` and clean up on unmount.

```typescript
// apps/frontend/src/hooks/use-global-reset-listeners.hook.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { eventBus } from "@/events/event-bus";

export function useGlobalResetListeners() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLogout = () => {
      queryClient.clear();
      // reset other stores via their reset() methods
    };

    eventBus.on("user:logged-out", handleLogout);
    return () => {
      eventBus.off("user:logged-out", handleLogout);
    };
  }, [queryClient]);
}
```

Three rules:

- **Always clean up.** `eventBus.on(...)` returns nothing useful; you have to call `.off(...)` in the effect's cleanup. Forgetting it leaks listeners on every re-mount.
- **Listeners are typed.** The mitt typings will give you the right payload type for each event name.
- **Subscribers don't emit other events in response.** That creates emit→handle→emit chains that are impossible to reason about. If event A's handler needs to do work that another part of the app might also want to react to, that "work" is its own concern, not a fan-out chain.

### Concentrating subscribers

For app-wide reactions like `user:logged-out`, prefer a single hook (`useGlobalResetListeners`) mounted near the app root that owns every subscriber for global events. This puts all the cross-cutting reactions in one file, where they can be audited together.

Spreading global event subscriptions across many files makes "what happens when the user logs out" answerable only by grepping for the event name. Concentrating them keeps the answer in one place.

---

## Curating the event list

The event list grows; the codebase doesn't shrink. Treat additions to `AppEvents` like additions to a public API.

- **Default answer is no.** When you want to add an event, walk back through "When you don't need the event bus" first.
- **Naming uses `<domain>:<past-tense-verb>` form.** `case:deleted`, `user:logged-out`, `organization:switched`. Past tense because events represent things that *happened*, not things that should happen. `case:delete-requested` is a smell — that's a command, not an event.
- **Payloads contain only what subscribers genuinely need.** A `case:deleted` payload is `{ id: string }`, not the whole `Case` (the case is gone, that's the point). Big payloads invite subscribers to use the bus as data transport, which it isn't.
- **Remove events that lose their last subscriber.** Once nobody listens, the event has no effect; leaving it in the list creates the impression of coordination that doesn't actually happen.

If the list keeps growing, ask whether something has migrated into the bus that shouldn't have. Common drift: something that started as "a few features need to react to login" turns into a generic notification system. The fix isn't to keep the list — it's to migrate items back to their right tool (toasts to the toast store, query invalidations to mutations, etc.).

---

## Anti-patterns

### Using a `lastEvent` slot in a Zustand store

```typescript
// ❌ Original architecture doc pattern — race conditions and over-rendering
type EventBusState = {
  lastEvent: AppEvent | null;
  dispatch: (event: AppEvent) => void;
};
```

Two events firing close together race on the slot — the first one's subscribers may not have run before the second overwrites it. And every subscriber re-renders on every event because `lastEvent` is one shared piece of state. Use a real emitter.

### Mutations or queries emitting events

```typescript
// ❌ Mutation reaches into the bus
return useMutation({
  mutationFn: deleteCase,
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: caseQueryKeys.lists() });
    eventBus.emit("case:deleted", { id });
  },
});
```

Mutations are the data layer; the event represents a workflow fact, which lives at the action layer. Move the emit into the action that wraps this mutation. Otherwise events scatter across mutations and become impossible to audit.

### UI components or `_parts/` emitting events

UI never emits. UI calls handlers from the container; the container or its action emits if needed. UI emitting events couples presentation to global side effects.

### Stringly-typed events

```typescript
// ❌ No types, no autocomplete, fails at runtime
eventBus.emit("case:deelted", { id });  // typo never caught
```

Always type the event map. Misspelled event names should be compile errors.

### Subscriber emits another event

```typescript
// ❌ Emit→handle→emit chain
eventBus.on("case:deleted", () => {
  // do work
  eventBus.emit("dashboard:should-refresh");
});
```

This is how "where did this side effect come from" stops being answerable. If two things must happen, either put both in the action that originated the work, or have the dashboard listen to `case:deleted` directly.

### Treating the bus as data transport

```typescript
// ❌ Heavy payload — bus is being used to ship state
eventBus.emit("case:updated", { case: fullCaseRecord });
```

If subscribers need the full record, they should fetch it from React Query keyed by ID. The event payload is `{ id }`. This keeps the bus about *facts*, not *state*.

### Adding an event "in case we need it later"

Don't. Add an event when you have a concrete subscriber that needs it. Speculative events cost nothing at runtime but invite future use that may not be appropriate.

---

## Quick reference

| Situation | Tool |
|---|---|
| Receiver re-reads server data after a write | React Query invalidation |
| Receiver reacts to navigation | Router / URL state |
| Receiver shows a toast | Toast store directly |
| Receiver records analytics | Analytics service directly |
| One specific feature needs to react | Direct composition / lift to common parent |
| Many unrelated subsystems must react | Event bus (last resort) |
| Bridge to a non-React subsystem | Event bus |

| Question | Answer |
|---|---|
| Where is the event list? | `apps/frontend/src/events/event-bus.ts` |
| Who can emit? | Action hooks only |
| Who subscribes? | Containers, root-level hooks |
| What do payloads look like? | Minimal — IDs, not records |
| Who must clean up listeners? | Every subscriber, in `useEffect` cleanup |

---

## What this skill does NOT cover

- **Mutation cache invalidation** (use `onSuccess` in the mutation, not the bus) — data layer skill
- **Toast and notification mechanics** (which library, how to call it) — toasts skill
- **Analytics tracking** (where calls live, payload conventions) — analytics skill
- **Action hook contract and side effect rules** (intrinsic vs. caller-decided) — action skill
- **Zustand store patterns and the state ownership model** — state management skill
- **Routing and URL state** — routing skill

When you're about to emit an event, stay in this skill. When you decide an event isn't needed and the right tool is one of the others, jump to that skill instead.
