---
name: frontend-subscription-hooks
description: Subscription hook rules for the OpenJustice React frontend — how to write hooks that manage WebSocket, SSE, or other long-lived push connections; how incoming messages flow into the React Query cache vs. a Zustand store; connection lifecycle and cleanup; Zod validation of pushed payloads; and the minimal return contract. Use this skill whenever creating a file in `subscriptions/`, when adding any WebSocket/EventSource/SSE/long-poll connection, when wiring streaming AI completions, when implementing live updates or presence, when handling realtime data of any kind, or when the user asks "how do I push data in", "where does this WebSocket go", "should this go in the cache or the store", or anything about realtime/streaming data. Trigger this skill any time a long-lived push connection is involved — getting the lifecycle, cleanup, or destination wrong leaks connections, duplicates state, or makes UI go stale silently.
---

# Frontend Subscription Hooks

Subscriptions are the **third data hook layer**, alongside queries (pull-based reads) and mutations (one-shot writes). A subscription manages a long-lived push connection — a WebSocket, an `EventSource` (SSE), or any other server-driven channel — and routes incoming messages into the rest of the app's state.

For one-shot reads, see queries in the data layer skill. For one-shot writes, see mutations. For multi-step workflows that may include subscriptions as a step, see the actions skill.

## Why this matters

A leaked WebSocket keeps a backend connection open, wastes resources, and can drive a refetch storm if it's reconnecting in a tight loop. A subscription that pushes into both the cache and a store creates two sources of truth that drift. A subscription that exposes its messages directly to React state forces every consumer to re-implement validation and state management.

The rules here optimize for:
- **Lifecycle correctness** — connections open when needed and close on unmount, every time.
- **Single source of truth** — incoming data lands in exactly one place (the cache *or* a store), and the rest of the app reads from there.
- **Safety at the boundary** — every message is Zod-validated before it enters app state, just like every API response.

---

## When to use a subscription

Use a subscription when **all** of these are true:
- The data flow is **server-pushed** — the server sends without being asked
- The connection is **long-lived** — many messages over time, not one request/response
- The data corresponds to **app state**, not a one-shot event for a single component

Common cases:
- Live updates to a record (case detail changes as collaborators edit)
- Streaming AI completions (tokens arriving over SSE)
- Presence and typing indicators
- Real-time notifications that update a count or feed
- Job progress reporting (export progress, long-running mutation status)

Don't use a subscription for:
- A request you can answer with a query — even if it has `refetchInterval`
- A one-shot write — that's a mutation
- A one-shot client→server event with no streaming response — that's an API call
- Cross-feature notifications inside the app — that's the event bus, not a subscription

---

## File shape

Subscription hooks live in `<level>/subscriptions/<name>.subscription.ts`. They follow the same locality rules as queries and mutations: feature-level if used across sub-features, sub-feature-level if self-contained.

A subscription hook:
- Owns the connection lifecycle in a `useEffect`
- Validates each incoming message
- Pushes the parsed payload into the React Query cache **or** a Zustand store (never both)
- Cleans up on unmount
- Returns the minimum the caller needs (often just `{ status }`, sometimes nothing)

```typescript
// apps/frontend/src/feature/cases/subscriptions/case-live-updates.subscription.ts
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { caseUpdateSchema } from "@packages/core";
import { caseQueryKeys } from "@/feature/cases/api/cache-keys";
import { applyCaseUpdate } from "@/feature/cases/lib/apply-case-update";

type SubscriptionStatus = "idle" | "connecting" | "open" | "closed" | "error";

export function useCaseLiveUpdates(caseId: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SubscriptionStatus>("idle");

  useEffect(() => {
    if (!caseId) return;

    const ws = new WebSocket(`${WS_URL}/cases/${caseId}/updates`);
    setStatus("connecting");

    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus("closed");
    ws.onerror = () => setStatus("error");

    ws.onmessage = (event) => {
      const parsed = caseUpdateSchema.safeParse(JSON.parse(event.data));
      if (!parsed.success) return; // drop invalid messages

      queryClient.setQueryData<Case>(
        caseQueryKeys.detail(caseId),
        (old) => (old ? applyCaseUpdate(old, parsed.data) : old)
      );
    };

    return () => {
      ws.close();
      setStatus("closed");
    };
  }, [caseId, queryClient]);

  return { status };
}
```

The connection is created in `useEffect`, closed in the cleanup function. The effect dependencies are exactly the values that, if they change, mean a different connection is needed. Status is tracked with `useState` because the caller (a container) might disable a button while connecting.

---

## Where incoming data goes — cache vs. store

Every subscription pushes its incoming data into exactly one destination. The choice is determined by what kind of data it is.

### Push into the React Query cache when…

The pushed data **corresponds to a query that already exists**. Live updates to a case detail correspond to `caseQueryKeys.detail(id)`. New items in a list correspond to `caseQueryKeys.list(filters)`.

Push via `queryClient.setQueryData(...)` so consumers reading from `useCase(id)` see the updates without changing how they consume the data.

```typescript
queryClient.setQueryData<Case>(
  caseQueryKeys.detail(caseId),
  (old) => old ? applyCaseUpdate(old, parsed.data) : old
);
```

The consumer hook stays simple:

```typescript
function CaseDetail({ id }: { id: string }) {
  useCaseLiveUpdates(id);              // subscription pushes into cache
  const { data: caseRecord } = useCase(id); // consumer reads from cache
  // ...
}
```

This is the default. Reach for a store only when the cache doesn't fit.

### Push into a Zustand store when…

The data is **streaming/accumulating**, **ephemeral**, or **not query-shaped**:

- **Streaming AI completions** — tokens arrive one at a time and accumulate into the eventual full message. A query model doesn't fit; you want a store that exposes "the in-progress message" as a piece of UI state.
- **Presence indicators** — who's currently online, where the cursor is. Not query-cacheable; transient by nature.
- **Typing indicators** — same reasoning.
- **Toasts / transient notifications driven by server pushes** — the message is shown briefly and discarded, not stored.

Use a store with event-like methods (`startStreaming`, `appendToken`, `finishStreaming`) so the subscription's job is just calling them with parsed data:

```typescript
export function useChatStream(conversationId: string) {
  const startStreaming = useChatStreamStore((s) => s.startStreaming);
  const appendToken = useChatStreamStore((s) => s.appendToken);
  const finishStreaming = useChatStreamStore((s) => s.finishStreaming);

  useEffect(() => {
    const eventSource = new EventSource(`/api/conversations/${conversationId}/stream`);

    eventSource.onopen = () => startStreaming(conversationId);

    eventSource.onmessage = (event) => {
      const parsed = streamTokenSchema.safeParse(JSON.parse(event.data));
      if (!parsed.success) return;
      appendToken(conversationId, parsed.data.token);
    };

    eventSource.addEventListener("done", () => {
      finishStreaming(conversationId);
      eventSource.close();
    });

    eventSource.onerror = () => {
      finishStreaming(conversationId);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, startStreaming, appendToken, finishStreaming]);
}
```

### Never push into both

If the data is "live updates to a case," that's the cache. If the data is "tokens streaming for the active completion," that's a store. **The same payload never goes into both** — that creates two sources of truth and they will drift.

If you find yourself wanting both ("we want the cache to update *and* notify a banner that a new version exists"), the second part is a separate concern: emit a domain event from the subscription handler instead, and let the banner subscribe to that.

---

## Validation at the boundary

Every incoming message goes through `.safeParse()` before it touches app state. Same rule as the API layer; same reasoning. The wire is untrusted, types are a compile-time fiction.

```typescript
// ✅ Correct — parsed and gated
ws.onmessage = (event) => {
  const parsed = caseUpdateSchema.safeParse(JSON.parse(event.data));
  if (!parsed.success) return;
  // use parsed.data
};

// ❌ Wrong — assumes the wire matches the type
ws.onmessage = (event) => {
  const update = JSON.parse(event.data) as CaseUpdate;
  // ... use directly, will crash on schema drift
};
```

On parse failure, the right move is usually to **drop the message silently and log it** (in dev) — not throw, not crash. A single malformed message shouldn't kill the whole subscription. A flood of malformed messages is a separate concern (server bug, wrong endpoint) that backoff/retry doesn't help with anyway.

Schemas come from `@packages/core`, same as API DTOs.

---

## Connection lifecycle

### The default: open on mount, close on unmount

For most subscriptions, the lifecycle is bound to the consumer component. Open the connection in `useEffect`, return a cleanup that closes it. That's it.

```typescript
useEffect(() => {
  const ws = new WebSocket(url);
  // ... handlers
  return () => ws.close();
}, [/* deps that determine the connection identity */]);
```

The dependency array is **exactly the values that determine which connection is needed** — typically an ID and any auth headers/tokens that affect the URL. When those change, the effect tears down the old connection and opens a new one. That behavior is correct.

### Status reporting

Track connection status with `useState` and surface it in the return value if the consumer needs to drive UI from it ("Connecting…" badge, disabled controls during reconnect). If no consumer reads `status`, you can omit it entirely — the hook can return nothing and just be called for its side effect.

### Reconnection

Most production subscriptions need reconnection on unexpected close. The basic pattern: on `onclose` (when not initiated by the cleanup function), wait with exponential backoff and retry.

```typescript
useEffect(() => {
  let attempt = 0;
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const connect = () => {
    if (cancelled) return;
    setStatus("connecting");
    ws = new WebSocket(url);

    ws.onopen = () => {
      attempt = 0;
      setStatus("open");
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      if (cancelled) return;
      setStatus("closed");
      const delay = Math.min(1000 * 2 ** attempt, 30_000);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return () => {
    cancelled = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}, [url]);
```

A few rules for reconnection logic:
- Always check a `cancelled` flag inside `onclose` so the cleanup function doesn't race with the reconnect timer.
- Cap the backoff (e.g., 30s). Unbounded growth is rarely what you want.
- Reset the attempt counter on a successful open so subsequent disconnects start fresh.
- If reconnection logic balloons past ~50 lines or gains features like jitter, resume tokens, heartbeats, or auth refresh, extract it into a `lib/` helper rather than letting the subscription file grow.

### Cleanup is non-negotiable

Every subscription effect returns a cleanup function that closes the connection. Skipping the cleanup leaks a connection on every unmount and re-mount cycle. The cleanup must:
- Close the socket / `EventSource`
- Cancel any pending reconnect timers
- Set a cancelled flag so in-flight async work doesn't update state after unmount

This is the single most common bug in subscription code. Audit it on every PR.

---

## The return contract

Subscriptions don't have a fixed return shape like actions do — what to return depends on what the consumer needs.

| Field | Include when… |
|---|---|
| `status` | The consumer needs to display connection state or disable UI while connecting |
| `connect` / `disconnect` | The connection should be triggered manually rather than on mount (rare) |
| `error` | The consumer needs to surface connection errors specifically |
| `lastMessage` | The consumer needs to react to messages directly (rare — usually means data should be in the cache or a store instead) |

The default minimal return is `{ status }`. Many subscriptions return nothing — they're called for the side effect of pushing data into the cache or store, and the consumer reads from there.

```typescript
// ✅ Common case: caller doesn't need anything back
function CaseDetailPage({ id }: Props) {
  useCaseLiveUpdates(id);                    // pushes into cache
  const { data } = useCase(id);              // reads from cache
  return <CaseDetailUI case={data} />;
}

// ✅ When status is needed
function ChatPanel({ conversationId }: Props) {
  const { status } = useChatStream(conversationId);
  return (
    <>
      {status === "connecting" && <ConnectingIndicator />}
      <ChatTranscript />
    </>
  );
}
```

Avoid `lastMessage` unless you have a specific need to react to messages outside of cache/store updates. If you find yourself reaching for it, the data probably belongs in the cache or a store and the consumer should read it from there.

---

## Anti-patterns

### Forgetting cleanup

```typescript
// ❌ Connection leaks on every unmount
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  // no return — no cleanup
}, [url]);
```

Every `useEffect` that opens a connection returns a cleanup. No exceptions.

### Storing the connection in `useState`

```typescript
// ❌ Re-renders break the connection
const [ws, setWs] = useState<WebSocket | null>(null);
useEffect(() => {
  setWs(new WebSocket(url));
}, [url]);
```

The connection isn't React state — it's a side-effectful resource owned by the effect. Use a `useRef` if you need to reference it from event handlers, but the canonical place for the WebSocket variable is a local `const` inside the effect.

### Pushing the same data into both the cache and a store

If `case:updated` messages update both `caseQueryKeys.detail(id)` *and* a `useCaseStore` slice with the same field, those two will drift. Pick one home for the data and have the rest of the app read from there.

### Multiple components opening their own connections to the same channel

If three components each call `useCaseLiveUpdates(id)` for the same `id`, you get three sockets. For most cases this is fine — the data still ends up in the cache and is shared. But if it's a problem (server connection limits, expensive auth handshake), the fix is to lift the subscription to a higher component (the page or feature root) so only one instance runs.

Don't try to deduplicate at the hook level by stashing the connection in module scope — that adds cross-component coupling that's hard to reason about.

### Using a subscription for a one-shot operation

If the server sends one message and closes, that's a request/response, not a subscription. Use a query (if it's a read) or a mutation (if it's a write). Subscriptions are for long-lived, multi-message channels.

### Subscribing to messages via `useState` instead of pushing to cache/store

```typescript
// ❌ Creates a duplicate state path
const [messages, setMessages] = useState<Message[]>([]);
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (e) => setMessages((prev) => [...prev, JSON.parse(e.data)]);
  return () => ws.close();
}, [url]);
```

The data is now in component-local state, invisible to the rest of the app, lost on unmount, and not invalidatable. Push to the cache or a store instead.

### Reconnecting too aggressively

Open-immediately-on-close with no backoff turns a transient blip into a hot loop hammering the server. Always use exponential backoff with a cap.

---

## What this skill does NOT cover

- **Queries and mutations** (one-shot reads and writes) — data layer skill
- **Action hooks** (workflow orchestration that may include subscriptions as one step) — actions skill
- **Zustand store internals** (when to create a store, slice naming, selector patterns) — state management skill
- **Cross-feature event bus** (when to emit events, when to listen) — events skill
- **Container patterns** (consuming subscription return values, surfacing status to UI) — container/UI skill

When writing a subscription, stay in this skill. When the subscription is part of a larger workflow that also coordinates mutations or queries, the surrounding workflow belongs in an action.
