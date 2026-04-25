---
description: OpenJustice Frontend architecture rules
globs:
  - packages/frontend/src/**
alwaysApply: true
---

# Frontend Architecture System Instructions

## Core Philosophy
- Feature locality over abstract layers
- Low cognitive load, strong encapsulation
- Predictable file discovery
- Minimal boilerplate
- No backend-style layering (no services/, repositories/, usecases/, controllers/, adapters/)

---

## 1. Feature Structure

### Public Entry Point (Golden Rule)
Every feature exposes exactly ONE public entry point:
- `<feature>.ui.tsx` - The UI component imported by `.page.tsx` files

The `.ui.tsx` file is the only file external code should import from a feature. Everything else — container hooks, queries, mutations, actions, stores, components — is private to the feature.

If a component is needed across multiple features, it does NOT live inside any feature. Instead, it is promoted to the root-level `components/` directory, which any feature can import from.

```
src/
├── components/             # Cross-feature shared components
│   └── <shared-component>/
│       ├── <shared-component>.component.tsx
│       ├── <shared-component>.container.tsx
│       └── ...
├── hooks/                  # Cross-feature shared hooks
│   └── <name>.hook.tsx     # e.g., useCurrentUser.hook.tsx, useCurrentOrganization.hook.tsx
├── events/                 # Cross-feature event bus (see Section 15)
│   └── event-bus.store.ts
├── feature/
│   └── <feature>/
│       └── ...             # Feature internals (see Canonical Folder Structure)
└── pages/
    └── <page>.page.tsx     # Imports <feature>.ui.tsx
```

### Canonical Folder Structure
```
features/<feature>/
├── <feature>.ui.tsx           # Public UI entry (the ONLY public entry point)
├── <feature>.container.tsx    # Feature container hook (private to feature)
├── api/
│   ├── <feature>.api.ts       # Pure async API functions
│   └── cache-keys.ts          # Query/mutation cache keys
├── queries/                   # React Query read hooks
│   └── <name>.query.ts
├── mutations/                 # React Query write hooks
│   └── <name>.mutation.ts
├── actions/                   # Orchestration hooks
│   └── <name>.action.tsx
├── stores/                    # Zustand stores
│   └── <feature>.store.ts
├── components/                # Feature-owned sub-features
│   └── <component-name>/
│       ├── <component-name>.component.tsx  # Public entry (uses container internally)
│       ├── <component-name>.container.tsx  # Container hook
│       ├── api/
│       │   ├── <component-name>.api.ts     # Sub-feature API functions
│       │   └── cache-keys.ts
│       ├── queries/
│       │   └── <name>.query.ts
│       ├── mutations/
│       │   └── <name>.mutation.ts
│       ├── _parts/
│       │   └── <sub-component>.part.tsx
│       └── hooks/
│           └── <name>.hook.tsx
├── _parts/                    # Feature-level presentational sub-components
│   └── <name>.part.tsx
├── hooks/                     # Feature-level utility hooks (ONLY .hook.tsx files)
│   └── <name>.hook.tsx
└── lib/                       # Pure utility functions
    └── <name>.ts
```

---

## 2. File Naming Conventions

| Pattern | Location | Purpose |
|---------|----------|---------|
| `<feature>.ui.tsx` | Feature root | Public UI entry (feature-level ONLY) |
| `<feature>.container.tsx` | Feature root | Private container hook (ViewModel hook for UI component) |
| `<name>.component.tsx` | components/ | Sub-feature public entry (uses container internally) |
| `<name>.container.tsx` | components/ | Sub-feature container hook (ViewModel hook for component) |
| `<name>.part.tsx` | _parts/ | Private presentational sub-component |
| `<name>.hook.tsx` | hooks/ | Custom hook (ONLY in hooks/ folders) |
| `<name>.query.ts` | queries/ | React Query read hook |
| `<name>.mutation.ts` | mutations/ | React Query mutation hook |
| `<name>.action.tsx` | actions/ | Orchestration hook (always .tsx) |
| `<feature>.store.ts` | stores/ | Zustand store |
| `<feature>.api.ts` | api/ | Pure async API functions |

### .container.tsx vs .hook.tsx Naming Rule (Critical)

- **`.container.tsx`** - ALWAYS used for the ViewModel hook associated with a UI component
  - Feature-level: `<feature>.ui.tsx` pairs with `<feature>.container.tsx`
  - Component-level: `<name>.component.tsx` pairs with `<name>.container.tsx`
  - The container hook composes queries, mutations, actions, and manages UI state
  - Returns `{ state, handlers }` shape for the UI component to consume

- **`.hook.tsx`** - ONLY used for custom hooks in `hooks/` folders
  - Feature-level: `hooks/<name>.hook.ts` or `hooks/<name>.hook.tsx`
  - Component-level: `components/<name>/hooks/<name>.hook.tsx`
  - Root-level: `src/hooks/<name>.hook.tsx` for cross-feature shared hooks
  - These are reusable utility hooks, NOT ViewModel hooks
  - Examples: `useKeyboardShortcuts`, `useWindowResize`, `useLocalStorage`

**NEVER use `.hook.tsx` for container/ViewModel hooks. Always use `.container.tsx` for hooks that are paired with UI components.**

### .ui.tsx vs .component.tsx Naming Rule (Critical)

- **`.ui.tsx`** - ONLY used at the feature level (folders directly under `feature/`)
- **`.component.tsx`** - Used for sub-features inside `components/` folders AND for shared components in the root `components/` directory

This distinction makes it clear which level of the hierarchy you're looking at:
- `feature/docs/docs.ui.tsx` ← Feature-level UI
- `feature/docs/components/docs-header/docs-header.component.tsx` ← Sub-feature UI
- `src/components/rich-text-editor/rich-text-editor.component.tsx` ← Shared component

**NEVER have both `.ui.tsx` and `.component.tsx` in the same directory.**

---

## 3. Layer Responsibilities

### UI Layer (`<feature>.ui.tsx`)
- Render JSX only
- Consume the feature hook
- NEVER call queries, mutations, or actions directly

### Feature Container (`<feature>.container.tsx`)
- Compose query hooks, mutation hooks, action hooks
- Manage feature UI state
- Map raw data → UI props
- Return `{ state, handlers }` shape
- NEVER trigger global side effects (toasts, analytics)
- Navigation and modals are delegated to narrowly scoped actions (see Action Layer)

### Query Layer (`queries/*.query.ts`)
- **MUST use `useQuery` or `useInfiniteQuery`** — every `.query.ts` file must call one of these hooks. Do not export a hook that only wraps an API call without React Query.
- Read-only server state via `useQuery` / `useInfiniteQuery`
- Define `queryKey` + `queryFn` (typically via options from `api/queries.ts` or inline)
- Call API functions (never inline fetch)
- NEVER orchestrate flows or fire side effects

### Mutation Layer (`mutations/*.mutation.ts`)
- **MUST use `useMutation`** — every `.mutation.ts` file must call `useMutation` with mutation options (e.g. from `api/mutations.ts`). Do not export a hook that only wraps an API function without React Query.
- Single mutation hooks wrapping one API endpoint
- Keep thin (single endpoint, minimal logic)
- NEVER coordinate multiple mutations or implement workflows

### .query.ts and .mutation.ts Hook Requirement (Critical)
- **`*.query.ts`** — MUST use `useQuery` or `useInfiniteQuery`. The exported hook must invoke React Query; do not wrap a raw API call in a custom hook without using these hooks.
- **`*.mutation.ts`** — MUST use `useMutation`. The exported hook must invoke `useMutation(options)`; do not wrap a raw API call in a custom hook without `useMutation`.

### Action Layer (`actions/*.action.tsx`)
- Multi-step workflow orchestration
- Coordinate multiple mutations/queries
- Optimistic updates, rollback, retries, polling, streaming
- Internal action state (status/progress/error/result)
- Return contract: `{ execute, status, error, reset?, cancel? }`
- **Narrowly scoped side effects ARE allowed** (see Section 3.1)

### Section 3.1: Action Side Effects Rule

Actions MAY trigger side effects (navigation, toasts, modals) under these strict conditions:

1. **The side effect is intrinsic to the action's purpose.** If an action is named `useSubmitAndNavigateToDashboard`, it always navigates to the dashboard on success. The name makes the side effect explicit and predictable.

2. **The side effect is always the same.** The action does not conditionally navigate to different routes or show different toasts based on context. If context-dependent behavior is needed, the side effect belongs in the container via `onSuccess` callbacks instead.

3. **The action is narrowly used.** Because the side effect is baked in, the action is appropriate only in features where that exact side effect is desired. Do not create a generic `useSubmitForm` action that also navigates — create `useSubmitForm` (no side effects) and `useSubmitFormAndRedirect` (with navigation) as separate actions if both patterns are needed.

```typescript
// ✅ Correct: Side effect is in the name, always fires, narrowly used
export function useSubmitCaseAndNavigateToTimeline() {
  const submitMutation = useSubmitCase();
  const router = useRouter();

  return {
    execute: async (data: CaseData) => {
      await submitMutation.mutateAsync(data);
      router.push("/timeline");
    },
    status: submitMutation.status,
    error: submitMutation.error,
  };
}

// ✅ Also correct: Pure action with no side effects, container handles the rest
export function useSubmitCase() {
  return {
    execute: async (data: CaseData) => {
      await submitMutation.mutateAsync(data);
    },
    status: submitMutation.status,
    error: submitMutation.error,
  };
}

// ❌ Wrong: Hidden conditional side effect
export function useSubmitCase() {
  return {
    execute: async (data: CaseData, shouldNavigate?: boolean) => {
      await submitMutation.mutateAsync(data);
      if (shouldNavigate) router.push("/timeline"); // Unpredictable
    },
  };
}
```

### API Layer (`api/<feature>.api.ts` or `api/<component-name>.api.ts`)
- Pure async HTTP functions (framework-agnostic)
- Zod validation for request AND response
- Use `.safeParse()` (never `.parse()`)
- Import schemas from `@packages/shared-types`
- Normalize errors via `normalizeApiError()`

### API Locality Rule
- API files live at the level that owns them:
  - **Feature-level** (`feature/<name>/api/`): For API functions used across multiple sub-features or by the feature container
  - **Sub-feature-level** (`components/<component-name>/api/`): For API functions specific to a self-contained sub-feature
- Each `api/` folder has its own `cache-keys.ts`
- This ensures sub-features are truly self-contained and can be moved or refactored independently

```
# ✅ Correct: Sub-feature owns its own API
feature/dashboard/
├── api/
│   ├── dashboard.api.ts       # Shared across dashboard sub-features
│   └── cache-keys.ts
├── components/
│   └── analytics-panel/
│       ├── api/
│       │   ├── analytics-panel.api.ts  # Only used by analytics-panel
│       │   └── cache-keys.ts
│       ├── analytics-panel.component.tsx
│       └── analytics-panel.container.tsx
```

### Queries/Mutations Locality Rule
- Query and mutation hooks live in `queries/` and `mutations/` folders at the appropriate level:
  - **Feature-level** (`feature/<name>/queries/`, `feature/<name>/mutations/`): For shared queries/mutations used across multiple sub-features
  - **Sub-feature-level** (`components/<sub-feature>/queries/`, `components/<sub-feature>/mutations/`): For queries/mutations specific to a self-contained sub-feature
- Sub-features (components with their own `.container.tsx`) should have their own `queries/` and `mutations/` folders
- `_parts/` components NEVER have `queries/`, `mutations/`, or `api/` folders (they receive data via props)
- Example: `components/prompt-management/prompt-management.container.tsx` imports from `./queries/` and `./mutations/`
- This ensures locality and encapsulation for self-contained sub-features

---

## 4. Component Hierarchy

### Two-Layer Pattern for Sub-features
1. **Component** (`.component.tsx`) - Public entry that uses container internally
2. **Container** (`.container.tsx`) - ViewModel hook that composes queries/mutations/actions, returns `{ state, handlers }`
3. **Sub-hooks** (`hooks/*.hook.tsx`) - Reusable utility hooks for single-responsibility logic (optional)

### _parts/ vs components/ (Critical Distinction)

**`_parts/` - Presentational sub-components:**
- Receive ALL data via props from parent
- NO direct access to stores, queries, mutations, or actions
- Handler logic lives in parent `.container.tsx`
- Flat file structure: `_parts/<name>.part.tsx`
- Promote to `components/` if it gains its own data fetching or complex state
- **Props shape**: When a `_parts/` component has 5+ props, organize them into `{ state, handlers }`:

```typescript
// ✅ Correct: _parts/ component with state/handlers props
interface MyCardPartProps {
  state: {
    item: ItemType;
    isActive: boolean;
    isEditing: boolean;
  };
  handlers: {
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
  };
}

export function MyCardPart({ state, handlers }: MyCardPartProps) {
  const { item, isActive, isEditing } = state;
  const { onClick, onEdit, onDelete } = handlers;
  // ...
}

// ❌ Wrong: Flat props list
<MyCardPart
  item={item}
  isActive={isActive}
  isEditing={isEditing}
  onClick={onClick}
  onEdit={onEdit}
  onDelete={onDelete}
/>
```

**`components/` - Sub-features/modules:**
- Have their own `.container.tsx` that imports hooks directly
- Container imports queries, mutations, stores as needed
- Do NOT receive data via props from parent (self-contained)
- The `.component.tsx` is the public entry point and uses the container internally
- May have their own `api/`, `queries/`, `mutations/` folders
- Structure: `components/<name>/<name>.component.tsx` + `<name>.container.tsx`

```
# ✅ Correct: Sub-feature structure
components/prompt-management/
├── prompt-management.component.tsx # Public entry - uses container internally
├── prompt-management.container.tsx # Imports mutations/queries directly
├── api/
│   ├── prompt-management.api.ts
│   └── cache-keys.ts
├── queries/
│   └── prompts.query.ts
├── mutations/
│   └── delete-prompt.mutation.ts
└── _parts/
    └── header.part.tsx            # Receives props only

# Inside prompt-management.component.tsx:
export function PromptManagement() {
  const { state, handlers } = usePromptManagementContainer();
  // ... render UI using state and handlers
}

# ❌ Wrong: Sub-feature receiving data via props like a _part
<PromptManagement prompts={prompts} onDelete={handleDelete} />
```

### Sub-Feature Nesting Limit (3-Level Rule)
If a sub-feature inside `components/` becomes complex enough to need its own `components/` folder (3 levels deep), it MUST be extracted as a sibling top-level feature instead.

```
# ❌ Wrong: Too deeply nested
feature/dashboard/components/analytics/components/chart-builder/components/axis-config/

# ✅ Correct: Extract as sibling feature
feature/dashboard/
feature/analytics/
feature/chart-builder/
```

### Container Hook Return Shape
```typescript
return {
  state: { /* all state values */ },
  handlers: { /* all handler functions */ }
}
```

---

## 5. Cross-Feature Shared Code

When code is needed by multiple features, it lives at the root `src/` level — never inside any feature.

### Root-Level Shared Directories

| Directory | Purpose | Example |
|-----------|---------|---------|
| `src/components/` | Shared UI components used by multiple features | Rich text editor, data table, file uploader |
| `src/hooks/` | Shared hooks for cross-cutting data/behavior | `useCurrentUser.hook.tsx`, `useCurrentOrganization.hook.tsx`, `usePermissions.hook.tsx` |
| `src/events/` | Cross-feature event bus (see Section 15) | `event-bus.store.ts` |
| `src/lib/` | Shared pure utility functions | `formatDate.ts`, `cn.ts` |

### Promotion Rules
- If a hook is used by 2+ features → move to `src/hooks/`
- If a component is used by 2+ features → move to `src/components/`
- Root-level `src/hooks/` and `src/components/` follow the same naming conventions as feature-level code
- Root-level shared components use `.component.tsx` / `.container.tsx` pattern (not `.ui.tsx`)

```typescript
// ✅ Correct: Cross-feature hook at root level
import { useCurrentOrganization } from "@/hooks/use-current-organization.hook";

// ✅ Correct: Cross-feature component at root level
import { DataTable } from "@/components/data-table/data-table.component";

// ❌ Wrong: Importing internals from another feature
import { useOrgQuery } from "@/feature/organizations/queries/org.query";
```

---

## 6. Form Handling

### DTO-First Form Schemas
Form schemas are derived from the monorepo's shared DTO (Data Transfer Object) schemas in `@packages/shared-types`. The DTO typically reflects a 1:1 mapping with what the form collects, so there is no need for a separate form schema layer.

### Convention
- Import DTO schemas and types directly from `@packages/shared-types`
- Use the DTO's Zod schema for form validation (via React Hook Form's Zod resolver or equivalent)
- The container hook creates the form instance and wires `onSubmit` to a mutation or action
- The UI component receives the form object and renders fields

```typescript
// In the container hook
import { CreateCaseDto, createCaseDtoSchema } from "@packages/shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function useCreateCaseContainer() {
  const form = useForm<CreateCaseDto>({
    resolver: zodResolver(createCaseDtoSchema),
    defaultValues: { title: "", description: "" },
  });

  const submitAction = useSubmitCaseAndNavigateToTimeline();

  return {
    state: { form, isSubmitting: submitAction.status === "pending" },
    handlers: {
      onSubmit: form.handleSubmit((data) => submitAction.execute(data)),
    },
  };
}
```

### Where Form-Related Code Lives
- **DTO schemas/types**: `@packages/shared-types` (monorepo package)
- **Form instance creation**: Container hook (`.container.tsx`)
- **Form rendering**: UI component (`.ui.tsx` or `.component.tsx`)
- **Submission logic**: Mutation or action hook
- **Form-specific helpers** (e.g., field transformations, conditional validation extensions): `lib/` folder within the feature

### When DTOs Don't Match 1:1
In rare cases where the form collects data differently from the API payload (e.g., multi-step wizards, file uploads with metadata), create a transform function in the feature's `lib/` folder:

```
feature/<feature>/
└── lib/
    └── transform-form-to-dto.ts  # Maps form values → API payload
```

---

## 7. Realtime Subscriptions

For features with live data via WebSocket, SSE, or similar push-based connections, use a `subscriptions/` convention alongside `queries/` and `mutations/`.

### Convention
```
feature/<feature>/
├── subscriptions/
│   └── <name>.subscription.ts
```

### Subscription Hook Rules
- Manage connection lifecycle (connect, disconnect, reconnect)
- Push incoming data into either:
  - React Query cache via `queryClient.setQueryData()` (if the data corresponds to an existing query)
  - A Zustand store (if the data is streaming/accumulating state)
- Return contract: `{ status, lastMessage?, connect?, disconnect? }`
- Clean up connections on unmount

```typescript
// subscriptions/live-updates.subscription.ts
export function useLiveUpdates(caseId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`/ws/cases/${caseId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(
        caseQueryKeys.detail(caseId),
        (old: CaseDetail) => applyUpdate(old, update)
      );
    };

    return () => ws.close();
  }, [caseId, queryClient]);
}
```

---

## 8. State Management

### Ownership Model
| State Type | Owner |
|------------|-------|
| Server state | React Query |
| Mutation state | React Query mutations |
| Action state | Action hooks |
| Feature UI state | Feature hook |
| Component UI state | Component hook |
| Workflow/optimistic state | Zustand stores |
| Realtime/streaming state | Subscriptions → React Query cache or Zustand |
| Cross-feature events | Event bus store (see Section 15) |

### Zustand Store Rules
- Store UI/workflow state (optimistic UI, streaming, flags, drafts)
- NEVER duplicate server state (that belongs in React Query)
- Use event-like methods: `startRequest`, `addOptimisticMessage`, `appendStream`, `finishRequest`
- Actions may mutate feature-owned stores only

---

## 9. Hooks Rules

### Container Hook Rules
Container hooks (`.container.tsx` files):
- ViewModel hooks that are paired with UI components
- Compose queries, mutations, actions, and stores
- Manage UI state and map data to UI props
- Return `{ state, handlers }` shape
- NEVER use `.hook.tsx` naming - always use `.container.tsx`

### Utility Hook Rules (hooks/ folders only)
Utility hooks (`.hook.tsx` files in `hooks/` folders):
- Reusable custom hooks for single-responsibility logic
- Manage local UI state only (DOM refs, open/close, keyboard)
- Call `props.onX()` callbacks
- NEVER mutate Zustand or call actions/mutations directly
- If needs workflow logic → lift to container hook or upgrade to component
- Examples: `useKeyboardShortcuts.hook.tsx`, `useWindowResize.hook.tsx`, `useLocalStorage.hook.tsx`

### Pure Functions Outside Components
Move pure functions outside component body:
```typescript
// ✅ Outside - created once
function getFileId(file: File): string {
  return `${file.name}-${file.size}`;
}

export function Component() {
  // Use the function
}
```

---

## 10. Props Organization

For components with 5+ props, group into state and handlers:
```typescript
interface Props {
  state: {
    title: string;
    items: Item[];
    isDisabled?: boolean;
  };
  handlers: {
    onCreate: () => void;
    onEdit: (id: string) => void;
  };
}
```

---

## 11. Naming Rules

### Feature-Specific State Variables
Include feature name when state is feature-specific:
```typescript
// ✅ Feature-specific
const isRenamingConversationTitle = ...;
const isStreamingConversation = ...;

// ✅ Generic (applies to any feature)
const isLoading = ...;
const error = ...;
```

---

## 12. useEffect Guidelines

| Effect Type | Location |
|-------------|----------|
| Data fetching | React Query (never useEffect) |
| Submit/update/delete | useMutation |
| Focus/scroll/measure | Presentation component |
| Subscriptions | Subscription hooks or dedicated hook |
| WebSocket/SSE lifecycle | `subscriptions/` hooks |

Anti-pattern to avoid:
```typescript
// ❌ Syncing state from props
useEffect(() => setLocalState(props.value), [props.value])
```

---

## 13. Generation Order

When creating a feature, generate in this order:
1. API functions
2. Query hooks
3. Mutation hooks
4. Subscription hooks (if needed)
5. Action hooks
6. Store (if needed)
7. Feature container hook (`.container.tsx`)
8. UI component (`.ui.tsx`)
9. Sub-components (`.component.tsx` + `.container.tsx`)
10. Utility hooks in `hooks/` folder (`.hook.tsx`) if needed

---

## 14. HARD PROHIBITIONS

NEVER generate:
- `services/`, `repositories/`, `usecases/`, `controllers/`, `adapters/`
- `shared/query/`, `shared/mutations/`
- Axios/fetch calls inside queries, mutations, actions, UI, or components
- Deep nesting beyond 3 levels in `components/` — extract to a sibling feature
- Barrel `index.ts`/`index.tsx` files for re-exports (frontend can't tree-shake)
- `.ui.tsx` files outside of feature root directories
- `.hook.tsx` files used as ViewModel/container hooks
- Cross-feature imports of private internals (queries, mutations, actions, stores)

---

## 15. Cross-Feature Event System

For cases where Feature A completes an action and Feature B must react (e.g., deleting a conversation should update the sidebar count), use the Zustand-based event bus.

### Event Bus Store

```typescript
// src/events/event-bus.store.ts
import { create } from "zustand";

type AppEvent =
  | { type: "conversation:deleted"; payload: { id: string } }
  | { type: "conversation:created"; payload: { id: string; title: string } }
  | { type: "organization:switched"; payload: { orgId: string } }
  | { type: "document:uploaded"; payload: { docId: string; caseId: string } };

interface EventBusState {
  lastEvent: AppEvent | null;
  dispatch: (event: AppEvent) => void;
}

export const useEventBusStore = create<EventBusState>((set) => ({
  lastEvent: null,
  dispatch: (event) => set({ lastEvent: event }),
}));
```

### Dispatching Events (from actions)
```typescript
// Inside an action hook
import { useEventBusStore } from "@/events/event-bus.store";

export function useDeleteConversationAction() {
  const deleteMutation = useDeleteConversation();

  return {
    execute: async (id: string) => {
      await deleteMutation.mutateAsync(id);
      useEventBusStore.getState().dispatch({
        type: "conversation:deleted",
        payload: { id },
      });
    },
    status: deleteMutation.status,
    error: deleteMutation.error,
  };
}
```

### Subscribing to Events (in containers or hooks)
```typescript
// Inside a container hook that needs to react
import { useEventBusStore } from "@/events/event-bus.store";

export function useSidebarContainer() {
  const lastEvent = useEventBusStore((s) => s.lastEvent);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lastEvent?.type === "conversation:deleted") {
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.list() });
    }
  }, [lastEvent, queryClient]);

  // ... rest of container
}
```

### Event Bus Rules
- **Event types are defined in a single union type** in `event-bus.store.ts` for compile-time safety
- **Only actions dispatch events** — never containers, UI, or mutations directly
- **Subscribers react via `useEffect`** watching `lastEvent` with narrow type checks
- **Common reactions**: Query invalidation, store updates, UI state changes
- **Keep the event type list curated** — only add events that genuinely need cross-feature coordination
- **Events are fire-and-forget** — no acknowledgement or response mechanism

---

## 16. No Barrel Exports Rule

The frontend bundler cannot tree-shake barrel exports, so NEVER use `index.ts`/`index.tsx` files that re-export from other files.

### What NOT to do
```typescript
// ❌ api/index.ts
export { fetchUsers, createUser } from "./dashboard.api";
export { queryKeys } from "./cache-keys";

// ❌ components/prompt-management/index.tsx
export { PromptManagement } from "./prompt-management.component";
```

### What to do instead
- Import directly from the actual file
- For sub-features, the `.component.tsx` is the public entry point

### Import Pattern
```typescript
// ✅ Correct: Import directly from the file
import { adminQueryKeys } from "@/feature/dashboard/api/cache-keys";
import { fetchAllUsers } from "@/feature/dashboard/api/dashboard.api";
import { AdminDashboard } from "@/feature/dashboard/components/admin-dashboard/admin-dashboard.component";

// ❌ Wrong: Import from barrel index
import { adminQueryKeys, fetchAllUsers } from "@/feature/dashboard/api";
import AdminDashboard from "./components/admin-dashboard";
```

---

## 17. Mandatory @ Alias Import Rule

**ALL imports MUST use the `@` alias instead of relative paths.**

This ensures consistency, maintainability, and makes refactoring easier. The `@` alias points to `packages/frontend/src/`.

### Required Pattern

```typescript
// ✅ Correct: Use @ alias
import { Button } from "@/components/ui/button";
import { useConversationDashboard } from "@/feature/dashboard/components/conversation-dashboard/conversation-dashboard.container";
import { adminQueryKeys } from "@/feature/dashboard/api/cache-keys";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user.hook";
import { useEventBusStore } from "@/events/event-bus.store";

// ❌ Wrong: Relative paths
import { Button } from "../../../components/ui/button";
import { useConversationDashboard } from "../conversation-dashboard/conversation-dashboard.container";
import { adminQueryKeys } from "../../api/cache-keys";
import { cn } from "../../../lib/utils";
```

### Benefits
- **Consistency**: All imports follow the same pattern
- **Maintainability**: Easier to refactor files without breaking imports
- **Clarity**: Clear indication of where code comes from
- **No path confusion**: Avoids `../../../` relative path hell

### Enforcement
- ALL imports must start with `@/`
- NO relative imports (`./`, `../`, `../../`, etc.) are allowed
- Exception: Only when importing from the same directory (e.g., `./_parts/component.part`) is acceptable, but `@/` is still preferred for consistency

---

## 18. Zustand Subscription Performance Rules

High-frequency state updates (e.g., drag, resize, scroll) can cause severe lag if unrelated components re-render on every frame. Follow these rules to keep the UI responsive:

### Never subscribe to arrays you only need at call time
If a callback only reads `nodes`/`edges` when invoked (click handler, save, etc.), use `useDialogFlowStore.getState()` inside the callback instead of subscribing:

```typescript
// ✅ Correct: Read at call time — no subscription, no re-render
const onClick = useCallback(() => {
  const { nodes, edges } = useDialogFlowStore.getState();
  doSomething(nodes, edges);
}, []);

// ❌ Wrong: Subscribing just to use in a callback — re-renders on every position change
const nodes = useDialogFlowStore((s) => s.nodes);
const onClick = useCallback(() => {
  doSomething(nodes);
}, [nodes]);
```

### Use narrow selectors
Subscribe to the smallest slice of state you actually need for rendering:

```typescript
// ✅ Only re-renders when count changes
const nodeCount = useDialogFlowStore((s) => s.nodes.length);

// ❌ Re-renders on every position change
const nodes = useDialogFlowStore((s) => s.nodes);
const disabled = nodes.length === 0;
```

### Use equality functions for data-only subscriptions
When you need the full array for rendering but don't care about position changes, use `useStoreWithEqualityFn` from `zustand/traditional` (Zustand v5's `persist` middleware strips the equality overload from the bound hook):

```typescript
// ✅ Skips re-render when only positions changed (data refs are stable)
import { useStoreWithEqualityFn } from "zustand/traditional";
import { nodesDataEqual } from "@/feature/dialog-flow-canvas/lib/utils";
const nodes = useStoreWithEqualityFn(useDialogFlowStore, (s) => s.nodes, nodesDataEqual);
```

### Isolate high-frequency subscriptions
Wrap high-frequency consumers (e.g., `<ReactFlow nodes={nodes}>`) in their own `memo()` component so siblings don't re-render.

---

## 19. Testing Conventions

### Testing Strategy by Layer

| Layer | Test Type | Tool | What to Test |
|-------|-----------|------|-------------|
| API functions (`api/`) | Unit | Vitest + MSW | Request/response shape, Zod validation, error normalization |
| Query hooks (`queries/`) | Integration | Vitest + MSW + `renderHook` | Correct `queryKey`, loading/error/success states, data transformation |
| Mutation hooks (`mutations/`) | Integration | Vitest + MSW + `renderHook` | Correct endpoint called, optimistic update if any, cache invalidation |
| Action hooks (`actions/`) | Integration | Vitest + MSW + `renderHook` | Multi-step workflow correctness, rollback on failure, status transitions, event dispatch |
| Zustand stores (`stores/`) | Unit | Vitest | State transitions, action methods produce correct state |
| Container hooks (`.container.tsx`) | Integration | React Testing Library `renderHook` | Composed state shape is correct, handlers trigger expected mutations/actions |
| UI components (`.ui.tsx`) | Component | React Testing Library | Renders correct markup given state, calls correct handlers on interaction |
| `_parts/` components | Unit | React Testing Library | Renders correctly for given props, no data fetching |
| Subscription hooks | Integration | Vitest + mock WebSocket | Connection lifecycle, data pushed to query cache or store |
| Pure utilities (`lib/`) | Unit | Vitest | Input → output correctness |

### Testing Rules
- **API layer**: Test with MSW (Mock Service Worker) to intercept HTTP. Assert request payloads and response parsing. Test `.safeParse()` failure paths.
- **Queries/Mutations**: Use `renderHook` wrapped in a `QueryClientProvider`. Assert `queryKey` structure. Verify cache invalidation after mutations.
- **Actions**: Test the full workflow including side effects (navigation, event dispatch). Mock mutations and assert they're called in order.
- **Containers**: Test that the returned `{ state, handlers }` shape is correct given various query/mutation states. Mock child hooks.
- **UI components**: Do NOT test business logic. Test that given a mocked container return value, the correct elements render and interactions call the correct handlers.
- **`_parts/`**: Pure prop-driven tests. Pass props, assert rendered output. These should be the simplest tests in the codebase.

### Test File Location
Test files live alongside the code they test with a `.test.ts` or `.test.tsx` suffix:
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

### What NOT to Test
- Implementation details (internal state variable names, number of re-renders)
- React Query internals (caching behavior, refetch intervals — trust the library)
- Third-party library behavior
- Barrel export wiring (we don't have barrels)
