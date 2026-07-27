---
name: frontend-testing-conventions
description: Testing rules for the OpenJustice React frontend — what to test at each layer (API functions, query/mutation/action/subscription hooks, Zustand stores, container hooks, UI components, parts, lib utilities), the test type per layer (unit, integration, component), where test files live (colocated `.test.ts(x)`), patterns for MSW and `renderHook`, what not to test (implementation details, library internals, render counts), and anti-patterns that produce brittle or over-mocked suites. Use this skill whenever writing a test, deciding what to test, picking between unit and integration tests, mocking dependencies, or when the user asks "how should I test this", "what’s the right level of test", "do I need to mock this", or anything about test strategy. Trigger this skill any time tests are being added or reviewed.
---

# Frontend Testing Conventions

This skill defines what to test, at what layer, and how. It assumes Vitest as the test runner, React Testing Library for components, and MSW (Mock Service Worker) for HTTP mocking — but the architectural rules apply to any equivalent stack.

For where each kind of code lives in the codebase, see the folder structure and naming skills. For the layer-specific rules each test must respect (e.g., what a query hook does and doesn't do), see the relevant layer skill.

## Why this matters

Test suites fail in two opposite directions and both produce the same outcome — engineers stop trusting them.

- **Over-testing**: every implementation detail has a test. Re-renders are counted. Internal state variable names are asserted. Refactoring requires rewriting a hundred tests that broke despite the behavior being unchanged.
- **Under-testing or wrong-layer testing**: the test suite passes but the app is broken. Tests mock the layer they're meant to verify; a query hook test doesn't actually exercise the query.

The rules here optimize for:
- **Confidence in refactoring** — tests verify *behavior*, not implementation. Refactors that preserve behavior don't break tests.
- **Catching real bugs** — each layer has a clear contract; tests at that layer verify the contract end-to-end where reasonable.
- **Maintainable suites** — tests are simple, fast, and obvious about what they're testing. A failing test points at the bug, not at the test.

---

## What tests are for

Tests in this codebase exist to:
1. **Catch regressions** — a behavior worked yesterday; the test ensures it still works tomorrow.
2. **Document behavior** — reading the test tells you what the code is supposed to do.
3. **Enable refactoring** — once behavior is captured in tests, the implementation can change freely.

Tests are *not* for:
- Proving correctness (impossible; tests check the cases you remembered to write)
- Hitting a coverage number for its own sake
- Catching every possible bug (some bugs need integration or production monitoring)
- Documenting the test framework's own behavior

Coverage is a *signal*, not a goal. 100% coverage with shallow tests is worse than 60% coverage with thorough behavior tests.

---

## Testing strategy by layer

Each layer has a specific contract and a specific testing approach.

| Layer | Test type | What to test |
|---|---|---|
| API functions (`api/`) | Unit + MSW | Request payload, response parsing, Zod validation failure paths, error normalization |
| Query hooks (`queries/`) | Integration | Correct `queryKey` shape, loading/success/error states, response data flows through |
| Mutation hooks (`mutations/`) | Integration | Correct endpoint called, mutation succeeds, cache invalidation in `onSuccess` |
| Action hooks (`actions/`) | Integration | Full workflow correctness, status transitions, event dispatch, optimistic rollback |
| Subscription hooks (`subscriptions/`) | Integration | Connection lifecycle, message validation, data flows to cache/store, cleanup on unmount |
| Zustand stores (`stores/`) | Unit | State transitions, action methods produce expected state, invariants hold |
| Container hooks (`.container.tsx`) | Integration | `{ state, handlers }` shape correct under various query/mutation states |
| UI components (`.ui.tsx`) | Component | Renders correct markup given mocked container output, interactions call correct handlers |
| `_parts/` components | Unit | Renders correctly for given props, no data fetching |
| Pure utilities (`lib/`) | Unit | Input → output correctness, edge cases |

### API functions

```typescript
// apps/frontend/src/feature/cases/api/cases.api.test.ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { fetchCases, createCase } from "./cases.api";

describe("fetchCases", () => {
  it("sends filters as query parameters", async () => {
    let capturedRequest: Request | null = null;

    server.use(
      http.get("/api/cases", ({ request }) => {
        capturedRequest = request;
        return HttpResponse.json([]);
      })
    );

    await fetchCases({ priority: "high", status: "open" });

    const url = new URL(capturedRequest!.url);
    expect(url.searchParams.get("priority")).toBe("high");
    expect(url.searchParams.get("status")).toBe("open");
  });

  it("parses the response into the expected shape", async () => {
    server.use(
      http.get("/api/cases", () =>
        HttpResponse.json([
          { id: "c1", title: "Case 1", priority: "high" },
          { id: "c2", title: "Case 2", priority: "normal" },
        ])
      )
    );

    const cases = await fetchCases({});
    expect(cases).toHaveLength(2);
    expect(cases[0].id).toBe("c1");
  });

  it("throws a NormalizedApiError when the response shape is wrong", async () => {
    server.use(
      http.get("/api/cases", () => HttpResponse.json([{ wrong: "shape" }]))
    );

    await expect(fetchCases({})).rejects.toMatchObject({
      code: expect.any(String),
    });
  });
});
```

API tests must cover:
- Request construction (correct URL, method, body, headers when relevant)
- Response parsing (data shape matches the schema)
- Validation failure path (server returns wrong shape → throws normalized error)
- HTTP error handling (4xx/5xx → throws normalized error)

### Query and mutation hooks

Use `renderHook` wrapped in a `QueryClientProvider`. Mock the network with MSW.

```typescript
// apps/frontend/src/feature/cases/queries/cases.query.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { createQueryClientWrapper } from "@/test/query-client-wrapper";
import { useCases } from "./cases.query";
import { caseQueryKeys } from "@/feature/cases/api/cache-keys";

describe("useCases", () => {
  it("uses the correct queryKey shape", () => {
    const filters = { priority: "high" as const };
    const { result } = renderHook(() => useCases(filters), {
      wrapper: createQueryClientWrapper(),
    });
    // Inspect via the QueryClient — or assert structurally elsewhere
    expect(caseQueryKeys.list(filters)).toEqual([
      "cases",
      "list",
      { priority: "high" },
    ]);
  });

  it("returns data after a successful fetch", async () => {
    server.use(
      http.get("/api/cases", () =>
        HttpResponse.json([{ id: "c1", title: "Case 1" }])
      )
    );

    const { result } = renderHook(() => useCases({}), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it("surfaces error state when the fetch fails", async () => {
    server.use(
      http.get("/api/cases", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 })
      )
    );

    const { result } = renderHook(() => useCases({}), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

Mutation tests follow the same pattern — assert the request fires, the response is handled, and the cache invalidations happen via `queryClient.invalidateQueries` (you can spy on the QueryClient's invalidate method, or check that a previously-cached query is now stale).

### Action hooks

Action tests verify the multi-step workflow — sequence of calls, status transitions, event dispatches, rollback on failure. Mock the underlying mutations and queries; the action's own logic is what's under test.

```typescript
// apps/frontend/src/feature/cases/actions/submit-case.action.test.tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitCase } from "./submit-case.action";

vi.mock("@/feature/cases/mutations/create-case.mutation");
vi.mock("@/feature/cases/mutations/upload-documents.mutation");
vi.mock("@/events/event-bus");

describe("useSubmitCase", () => {
  it("creates the case, then uploads documents, then dispatches the event", async () => {
    /* arrange — set up mocks to resolve in order, capture calls */

    const { result } = renderHook(() => useSubmitCase());

    await act(() => result.current.execute({ /* ... */ }));

    /* assert call order, the dispatched event, the final status */
  });

  it("transitions to error and re-throws when create fails", async () => {
    /* arrange — first mutation rejects */

    const { result } = renderHook(() => useSubmitCase());

    await expect(
      act(() => result.current.execute({ /* ... */ }))
    ).rejects.toThrow();

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeTruthy();
  });

  it("rolls back optimistic state on failure", async () => {
    /* arrange — optimistic state starts, mutation rejects, expect rollback */
  });
});
```

Action tests are the most valuable in this codebase — they exercise the workflow logic that's most likely to have bugs. Spend time on them.

### Subscription hooks

Mock the WebSocket / `EventSource` / push connection. Verify lifecycle (connect on mount, cleanup on unmount), validation (invalid messages dropped silently), and destination (data lands in the cache or store).

```typescript
// apps/frontend/src/feature/cases/subscriptions/case-live-updates.subscription.test.tsx
import { renderHook, act } from "@testing-library/react";
import { MockWebSocket, installMockWebSocket } from "@/test/mock-websocket";

beforeEach(() => installMockWebSocket());

describe("useCaseLiveUpdates", () => {
  it("opens a connection on mount and closes it on unmount", () => {
    const { unmount } = renderHook(() => useCaseLiveUpdates("c1"), {
      wrapper: createQueryClientWrapper(),
    });
    expect(MockWebSocket.lastInstance.readyState).toBe(WebSocket.OPEN);

    unmount();

    expect(MockWebSocket.lastInstance.readyState).toBe(WebSocket.CLOSED);
  });

  it("pushes valid messages into the React Query cache", async () => {
    /* arrange — render hook with QueryClient, send a message via the mock */
    /* assert — the cache for caseQueryKeys.detail('c1') reflects the update */
  });

  it("drops invalid messages silently", () => {
    /* arrange — send a message with a wrong shape */
    /* assert — the cache is unchanged, no throw */
  });
});
```

### Zustand stores

Pure unit tests. Call methods on the store, assert the state.

```typescript
import { useConversationStore } from "./conversation.store";

beforeEach(() => {
  useConversationStore.setState({
    streamingMessageId: null,
    streamingContent: "",
    /* ... reset to initial */
  });
});

describe("useConversationStore", () => {
  it("startStreaming sets the message id and clears content", () => {
    useConversationStore.getState().startStreaming("m1");
    const state = useConversationStore.getState();
    expect(state.streamingMessageId).toBe("m1");
    expect(state.streamingContent).toBe("");
  });

  it("appendToken accumulates content for the active message", () => {
    useConversationStore.getState().startStreaming("m1");
    useConversationStore.getState().appendToken("Hello ");
    useConversationStore.getState().appendToken("world");
    expect(useConversationStore.getState().streamingContent).toBe("Hello world");
  });
});
```

These should be the simplest tests in the codebase. If a store test is hard to write, the store is too complex.

### Container hooks

Test that the returned `{ state, handlers }` shape is correct given various query/mutation states. Mock the child hooks (queries, mutations, actions, stores) so the container is tested in isolation.

```typescript
import { vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCaseDashboardContainer } from "./cases.container";

vi.mock("@/feature/cases/queries/cases.query", () => ({
  useCases: vi.fn(),
}));

import { useCases } from "@/feature/cases/queries/cases.query";

describe("useCaseDashboardContainer", () => {
  it("exposes empty cases array while loading", () => {
    (useCases as Mock).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useCaseDashboardContainer());

    expect(result.current.state.cases).toEqual([]);
    expect(result.current.state.isPending).toBe(true);
  });

  it("invokes the delete action when onDelete handler is called", async () => {
    /* mock useDeleteCase, assert .execute called with the right id */
  });
});
```

Don't render UI in container tests. The container is a hook; `renderHook` is enough.

### UI components

Use React Testing Library. Mock the container's return value; assert the rendered output and that interactions call the correct handlers. The UI does not have business logic, so the test surface is small.

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseDashboard } from "./cases.ui";

vi.mock("./cases.container", () => ({
  useCaseDashboardContainer: vi.fn(),
}));

import { useCaseDashboardContainer } from "./cases.container";

describe("CaseDashboard", () => {
  it("renders cases when loaded", () => {
    (useCaseDashboardContainer as Mock).mockReturnValue({
      state: {
        cases: [{ id: "c1", title: "Case 1" }],
        isPending: false,
        error: null,
      },
      handlers: { onSelectCase: vi.fn(), onDelete: vi.fn() },
    });

    render(<CaseDashboard />);

    expect(screen.getByText("Case 1")).toBeInTheDocument();
  });

  it("calls onDelete when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    (useCaseDashboardContainer as Mock).mockReturnValue({
      state: { cases: [{ id: "c1", title: "Case 1" }], isPending: false, error: null },
      handlers: { onSelectCase: vi.fn(), onDelete },
    });

    render(<CaseDashboard />);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});
```

Use `getByRole` over `getByText` over `getByTestId`. Test ids are an escape hatch, not a default — the order matters because it parallels how a screen-reader user perceives the page.

### `_parts/` components

The simplest tests in the codebase. Pass props, assert the rendered output and handler calls. No mocking needed (parts have no dependencies beyond their props).

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseRowPart } from "./case-row.part";

describe("CaseRowPart", () => {
  it("renders the case title", () => {
    render(
      <CaseRowPart
        state={{ case: { id: "c1", title: "My Case" }, isSelected: false, isEditing: false }}
        handlers={{ onSelect: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }}
      />
    );
    expect(screen.getByText("My Case")).toBeInTheDocument();
  });

  it("calls onEdit when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(
      <CaseRowPart
        state={{ case: { id: "c1", title: "My Case" }, isSelected: false, isEditing: false }}
        handlers={{ onSelect: vi.fn(), onEdit, onDelete: vi.fn() }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();
  });
});
```

If a `_parts/` test starts requiring data layer mocks, the part has outgrown the tier — see the component placement skill.

### Pure utilities (`lib/`)

Direct input/output tests. No mocking, no React, no async.

```typescript
import { describe, it, expect } from "vitest";
import { transformCaseFormToDto } from "./transform-case-form-to-dto";

describe("transformCaseFormToDto", () => {
  it("trims the title", () => {
    const dto = transformCaseFormToDto({ title: "  hello  ", /* ... */ });
    expect(dto.title).toBe("hello");
  });

  it("parses the comma-separated tags", () => {
    const dto = transformCaseFormToDto({ tagsRaw: "a, b ,c", /* ... */ });
    expect(dto.tags).toEqual(["a", "b", "c"]);
  });

  it("filters empty tags", () => {
    const dto = transformCaseFormToDto({ tagsRaw: "a, ,b,", /* ... */ });
    expect(dto.tags).toEqual(["a", "b"]);
  });
});
```

These should run in milliseconds and require no setup. If extending a `lib/` test requires elaborate fixtures, the function probably has too many responsibilities.

---

## Test file location

Test files live **alongside the code they test** with `.test.ts` or `.test.tsx` suffix:

```
feature/<feature>/
├── api/
│   ├── <feature>.api.ts
│   └── <feature>.api.test.ts
├── queries/
│   ├── <name>.query.ts
│   └── <name>.query.test.ts
├── <feature>.container.tsx
├── <feature>.container.test.tsx
├── <feature>.ui.tsx
└── <feature>.ui.test.tsx
```

No separate `__tests__/` folder, no `tests/` directory at the root, no parallel directory tree. Tests next to code keeps them visible — when you delete or move code, the tests come with it; when you read the code, the tests are right there.

The naming and `.ts`/`.tsx` rules from the naming skill apply: `<original-name>.test.<ext>`. The `.tsx` suffix is used when the test renders JSX; otherwise `.ts`.

---

## Test structure

Each test follows **Arrange–Act–Assert** with clear separation:

```typescript
it("sends the correct headers when the user is authenticated", async () => {
  // Arrange
  let capturedRequest: Request | null = null;
  server.use(
    http.get("/api/cases", ({ request }) => {
      capturedRequest = request;
      return HttpResponse.json([]);
    })
  );

  // Act
  await fetchCases({});

  // Assert
  expect(capturedRequest!.headers.get("authorization")).toMatch(/^Bearer /);
});
```

For trivial tests, the structure can collapse to a single line, but the conceptual separation always exists.

### Naming

- `describe` blocks name the unit under test: `describe("fetchCases", ...)`, `describe("useCaseDashboardContainer", ...)`.
- `it` blocks describe the behavior in plain English starting with a verb: `it("sends filters as query parameters", ...)`. Don't write `it("should send filters")` — every test "should" do something; the word adds noise.
- Group related tests in nested `describe` blocks when it improves readability: `describe("when the user is anonymous", () => { it(...) })`.

### One concept per test

A test asserting five different things at once isn't testing — it's running code and checking everything. Split into focused tests, each named for what it verifies.

```typescript
// ❌ One test, many concerns
it("works correctly", async () => {
  // creates the case
  // uploads documents
  // dispatches the event
  // returns the case
  // status is success
});

// ✅ One concept per test
it("creates the case before uploading documents", async () => { /* ... */ });
it("dispatches case:submitted after success", async () => { /* ... */ });
it("transitions status to success", async () => { /* ... */ });
```

Multiple `expect` calls in one test are fine when they assert one *concept* (e.g., a returned object's shape).

---

## What NOT to test

These are not worth testing — at best they add noise, at worst they actively obstruct refactoring.

### Implementation details

- Internal state variable names
- The number of re-renders
- Whether a specific `useState` was called
- Whether a `useMemo` cached a particular result
- How many times a function was called *internally*

If the test breaks when the implementation changes but the behavior doesn't, it's testing implementation. Rewrite to test behavior.

### Library internals

- React Query's caching, dedup, refetch-on-focus behavior — trust the library
- Zustand's selector mechanism
- React's render scheduling
- Browser APIs

The test framework is for *your* code. Library teams have their own tests for their code.

### Third-party UI components

A `<Button />` from a design system has its own tests. Don't re-test it in your features.

### Barrel export wiring

We don't have barrels (see the imports skill). If you do somewhere, the test would just verify `import { x } from "./" === import { x } from "./x"` — vacuous.

### Render counts and performance

Performance is verified in the profiler, not the test suite. A test that asserts "renders 3 times" breaks the moment React's scheduling changes.

---

## MSW patterns

MSW is the canonical HTTP mock for this codebase. Set it up once globally in test setup; override per-test as needed.

### Global setup

```typescript
// apps/frontend/src/test/msw-server.ts
import { setupServer } from "msw/node";
import { defaultHandlers } from "./default-handlers";

export const server = setupServer(...defaultHandlers);
```

```typescript
// apps/frontend/src/test/setup.ts
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: "error"` is non-negotiable — without it, tests can pass while making unmocked network calls in the background, leaking real requests. The setting forces every test to declare what it expects.

### Per-test overrides

Use `server.use(...)` inside individual tests to override the default handlers:

```typescript
it("handles a 500 error", async () => {
  server.use(
    http.get("/api/cases", () => HttpResponse.json({ error: "boom" }, { status: 500 }))
  );
  // ...
});
```

The `afterEach(server.resetHandlers)` ensures one test's overrides don't leak to the next.

### Default handlers

Default handlers (in `defaultHandlers`) return reasonable success responses for every endpoint the app uses. This means tests don't have to set up handlers for *every* request — just the ones whose specific behavior matters.

---

## `renderHook` patterns

For hooks that need providers (a `QueryClientProvider` for queries/mutations, a `Router` for nav, etc.), provide a `wrapper`:

```typescript
// apps/frontend/src/test/query-client-wrapper.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

`retry: false` is critical — default retry behavior turns a 500 in test into a 30-second test timeout. Disable retry in test setups so failures fail fast.

For hooks that need both QueryClient and a router and i18n, compose the wrappers:

```typescript
const wrapper = compose(
  createQueryClientWrapper(),
  createRouterWrapper(),
  createI18nWrapper()
);

renderHook(() => useMyHook(), { wrapper });
```

Or define a single `createTestProviders` that wraps everything the test suite needs, used by default unless a test wants something specific.

---

## Test data and factories

Avoid duplicating test data across hundreds of tests. Use factories:

```typescript
// apps/frontend/src/test/factories/case.factory.ts
import { faker } from "@faker-js/faker";
import type { Case } from "@packages/core";

export function makeCase(overrides: Partial<Case> = {}): Case {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    priority: "normal",
    status: "open",
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}
```

In tests:

```typescript
const c = makeCase({ priority: "high" });
```

The factory provides defaults for everything; the test specifies only what it cares about. When the `Case` shape changes, the factory updates in one place.

---

## Anti-patterns

### Mocking the layer under test

```typescript
// ❌ Mocking useQuery while testing a query hook
vi.mock("@tanstack/react-query");
```

If you mock the layer you're testing, you're not testing it. Use real React Query with MSW for the network. Mock only what's external to the unit under test.

### Tests that pass without exercising the code

```typescript
// ❌ The "test" never runs the function
it("works", () => {
  expect(true).toBe(true);
});
```

If a test would pass after deleting the implementation, it's not a test.

### Asserting on internal state names

```typescript
// ❌ Implementation detail
it("uses local state for the filter", () => {
  const { result } = renderHook(() => useCaseDashboardContainer());
  expect(result.current.__internalFilter).toBeDefined();
});
```

The container's filter state is private; the *behavior* is "filtering changes the cases list." Test the behavior.

### Tests that depend on each other

```typescript
// ❌ Order-dependent tests
let createdCaseId: string;

it("creates a case", async () => {
  createdCaseId = await createCase(/* ... */);
});

it("deletes the case", async () => {
  await deleteCase(createdCaseId); // depends on the previous test running first
});
```

Each test must be independent. Use `beforeEach` to set up shared state, or accept that each test does its own setup.

### Snapshot tests for component output

```typescript
// ❌ Brittle, doesn't actually verify behavior
it("matches snapshot", () => {
  const { container } = render(<CaseDashboard />);
  expect(container).toMatchSnapshot();
});
```

Snapshots fail on any HTML change — including ones that don't affect behavior — and devs blanket-update them without reading. Use specific assertions about what the component should show.

### Over-mocking

```typescript
// ❌ Mocking everything until nothing real is exercised
vi.mock("@/feature/cases/api/cases.api");
vi.mock("@/feature/cases/queries/cases.query");
vi.mock("@/feature/cases/mutations/delete-case.mutation");
vi.mock("@/feature/cases/actions/delete-case.action");
vi.mock("@/feature/cases/cases.container");
// Now the test verifies nothing
```

Mock at the *boundary* of the unit under test, not every dependency. For a container test, mock the queries and mutations it composes — but use real React Query plumbing.

### Testing implementation by counting calls

```typescript
// ❌ Implementation detail
expect(mockFn).toHaveBeenCalledTimes(3);
```

The number of calls is implementation. Test what the *result* is.

The exception: when "called once vs. multiple" is part of the contract — for example, an idempotency guarantee. Then assert it. Default is to assert the outcome.

### `data-testid` everywhere

```typescript
// ❌
<button data-testid="submit-button">Submit</button>;
expect(screen.getByTestId("submit-button")).toBeInTheDocument();
```

Test ids are an escape hatch for cases where role/label/text isn't accessible. Default to `getByRole`, `getByLabelText`, `getByText`. Test ids should be rare; their presence usually means the markup has accessibility issues that should be fixed at the component level.

### No `onUnhandledRequest: "error"` in MSW setup

Tests pass while making real network calls in the background. Always set this to `"error"` so any unmocked request fails the test loudly.

### Slow tests blocking the dev loop

Unit and component tests should run in milliseconds. If a test takes seconds, it's doing too much — usually rendering full feature trees instead of testing in isolation. Move slow tests to E2E (which expects them to be slow); keep the unit/component suite fast.

---

## What this skill does NOT cover

- **Storybook** (component documentation, visual testing) — separate skill
- **End-to-end testing** (Playwright, Cypress, full user flows) — separate skill
- **CI configuration** (when tests run, in what stages, parallelization) — outside this skill set
- **Coverage tooling configuration** — Vitest-specific, outside this skill
- **Specific framework APIs** (Vitest, MSW, RTL details beyond what's used here) — library docs
- **Performance testing** (rendering perf, bundle size, load testing) — separate concerns

When writing or reviewing a test, stay in this skill. When the question shifts to "how do I document this component visually" or "how do I verify the full user flow," that's Storybook or E2E.
