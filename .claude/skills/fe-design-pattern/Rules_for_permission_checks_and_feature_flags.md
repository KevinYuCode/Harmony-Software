---
name: frontend-gating-and-permissions
description: Rules for permission checks and feature flags in the OpenJustice React frontend — where permission data lives, the `useCan(permission)` hook pattern, hiding vs. disabling UI for unauthorized actions, where checks happen (container, action, or route level — never in UI), the `useFeatureFlag` pattern, the four flag types (kill switch, rollout, experiment, entitlement), and the rule that client-side checks are UX only. Use this skill whenever adding a permission check, hiding a button based on roles, gating a route behind a flag, naming a new flag, or when the user asks "where should this permission check go", "should I check this in the UI", "how do I add a feature flag", or anything about access control or rollout gating. Trigger this skill any time access conditions affect behavior.
---

# Frontend Gating & Permissions

Two related concerns share this skill: **permissions** (is the user allowed to do this?) and **feature flags** (is this feature available to this user/cohort right now?). They have different semantics, but the mechanical patterns — typed check functions, hooks that read them, where to apply them — are almost identical.

For where the data layer fetches the user/permissions/flags, see the data layer skill. For container/UI structure, see the components skill. For routing-level gates, see the routing skill (forthcoming).

## Why this matters

Two failure modes:

1. **Client-side gating treated as security.** A button hidden by `if (canEdit)` is just hidden; the API call still works if you call it directly. Treating client-side checks as enforcement leaks privileged operations to anyone who opens the network tab.
2. **Gating logic scattered across the UI.** Feature flags checked in 14 different components, permission strings hard-coded in `_parts/`, the same condition reimplemented inconsistently. When the rule changes, half the call sites are missed.

The rules here optimize for:
- **Security clarity** — client-side checks are UX, the server is always truth.
- **Single source of evaluation** — one hook per concern, called from one tier (container or higher), with derived booleans flowing down.
- **Predictable UX** — the same access denial looks the same everywhere.

---

## Permissions vs. feature flags — different semantics, same shape

Before the rules: these two things are not the same, even though they look similar.

| | Permission | Feature flag |
|---|---|---|
| What it answers | Is the user *allowed* to do this? | Is this feature *available* to this user/cohort? |
| Source | User's role / group / explicit grant | Flag service, environment, A/B test bucket |
| Lifecycle | Long-lived — tied to user identity | Often temporary (rollout, experiment) or permanent (kill switch) |
| Failure mode if bypassed | Security incident | UX inconsistency or experiment contamination |
| Server enforcement | **Required.** Client check is UX only. | Strongly recommended (especially for entitlements) |

Because the failure modes differ, the rigor differs. Forgetting to flag-gate a UI element shows the wrong feature to the wrong cohort — annoying, fixable. Forgetting to check a permission server-side lets unauthorized users delete records — outage-grade.

The mechanical patterns are nearly identical, though, so this skill covers both. The boundary between them is mostly about *where the answer comes from*, not how it's used.

---

## Permissions

### Where permission data lives

Permission data is part of the authenticated user's profile. It loads once at app boot (typically via a `useCurrentUser` query) and stays in the React Query cache. It is **not** in a Zustand store — it's server state, owned by React Query.

The shape varies by app:
- **Permission strings** — `["case:read", "case:write", "case:delete", "user:invite"]`
- **Roles** — `["editor", "admin"]` (with permissions derived elsewhere from the role)
- **Mixed** — explicit permissions + role-based defaults

Pick one shape and stick to it. This skill assumes string permissions (`"resource:action"`); the patterns translate to roles 1:1.

### The `useCan` hook

Every permission check goes through one hook. Single source, single shape, single place to update if the rules change.

```typescript
// apps/frontend/src/hooks/use-can.hook.ts
import { useCurrentUser } from "@/hooks/use-current-user.hook";

export function useCan(permission: Permission): boolean {
  const { data: user } = useCurrentUser();
  return user?.permissions?.includes(permission) ?? false;
}
```

```typescript
// In a container
const canEdit = useCan("case:write");
const canDelete = useCan("case:delete");
```

The hook returns `false` when the user isn't loaded yet — the safe default. Containers can branch on this without worrying about race conditions.

For multiple checks, accept either an array or a list pattern; whichever you prefer:

```typescript
// Either:
const canEditOrDelete = useCanAny(["case:write", "case:delete"]);
// Or:
const canEdit = useCan("case:write");
const canDelete = useCan("case:delete");
const canEditOrDelete = canEdit || canDelete;
```

Don't write a `useCan(["..."])` overload that does some-of vs. all-of based on context — pick clear function names (`useCanAny`, `useCanAll`) so the call site is unambiguous.

### Where the check happens

| Layer | Should it check? | Why |
|---|---|---|
| UI component | **No** | UI doesn't know about permissions; it renders what the container gives it |
| `_parts/` | **No** | Parts receive booleans as props; they don't read permissions |
| Container | **Yes** | The right home for "is this allowed in this view?" |
| Action | **Yes** (guard) | Actions can fail fast before firing the mutation |
| Route | **Yes** (entry guard) | Whole-feature gates happen at the route level |

The rule: **derive in the container, expose as a boolean, render conditionally in the UI**.

```typescript
// In the container
export function useCaseRowContainer(caseId: string) {
  const canEdit = useCan("case:write");
  const canDelete = useCan("case:delete");
  // ...

  return {
    state: {
      // ... rest
      canEdit,
      canDelete,
    },
    handlers: {
      onEdit: canEdit ? () => { /* ... */ } : undefined,
      onDelete: canDelete ? () => { /* ... */ } : undefined,
    },
  };
}

// In the UI
const { state, handlers } = useCaseRowContainer(id);

return (
  <>
    {state.canEdit && <button onClick={handlers.onEdit}>Edit</button>}
    {state.canDelete && <button onClick={handlers.onDelete}>Delete</button>}
  </>
);
```

The UI doesn't know what `canEdit` *means* — it just renders or hides based on the boolean. That separation matters: when the permission rule changes (`"case:write"` becomes `"case:write_basic"`), only the container changes.

### Hide, disable, or show — pick one per case

When a user lacks permission, the UI has three options:

- **Hide** the action entirely. The user doesn't see a button they can't use.
- **Disable** the action with a tooltip explaining why ("You need editor access to do this").
- **Show** the action; let the call fail with an error.

**Default to hiding.** Cleaner UI, doesn't tease the user with capabilities they don't have, and the user usually doesn't need to know the action exists.

**Disable with a tooltip** when the user might reasonably gain the permission ("Upgrade your plan," "Ask your admin to grant access") and seeing the disabled control teaches them what's possible. The tooltip text is part of the permission spec — write it once near the check.

**Show and let it fail** is rarely the right answer. The exception: actions that depend on resource-specific permissions you don't know in advance (e.g., "edit this case" depends on the user's relationship to the specific case). For those, optimistic show + graceful failure handling is acceptable.

### Action-level guards

Actions can guard their own `execute` to fail fast if the user can't perform the workflow:

```typescript
export function useDeleteCase() {
  const canDelete = useCan("case:delete");
  const deleteMutation = useDeleteCaseMutation();

  return {
    execute: async (id: string) => {
      if (!canDelete) {
        throw new Error("Not permitted to delete cases");
      }
      await deleteMutation.mutateAsync(id);
    },
    status: deleteMutation.status,
    error: deleteMutation.error,
  };
}
```

This catches programming errors (a UI that forgot to hide the delete button still won't run the workflow) but does not replace server-side enforcement. The server must check too. The action-level guard is a safety net, not the gate.

### Route-level guards

Whole features behind permissions belong at the route, not in every container inside the feature. Wrap the route element in a `<RequirePermission>` component:

```typescript
// pages/admin.page.tsx
import { RequirePermission } from "@/components/require-permission/require-permission.ui";
import { AdminDashboard } from "@/feature/admin/admin.ui";

export default function AdminPage() {
  return (
    <RequirePermission
      permission="admin:access"
      fallback={<NotAuthorizedFallback />}
    >
      <AdminDashboard />
    </RequirePermission>
  );
}
```

The component reads `useCan` and renders either the children or the fallback. The feature inside doesn't need to re-check — the gate already happened.

For routes that should redirect rather than render a fallback (e.g., bouncing to `/login` when unauthenticated), make `<RequirePermission>` redirect via the router instead of rendering a fallback. Same component, different mode.

### Server-side enforcement is non-negotiable

Every permission-protected operation **must** be enforced on the server. The client check is UX. Hiding a button doesn't stop someone from calling the API directly with `curl`.

The server's response to an unauthorized call is a `403`-shaped error, which flows back through `normalizeApiError` and lands in `state.error` like any other API failure. The UI renders it inline. The error UI for "you don't have permission" can be the same as the route-level fallback if that's cleaner.

Never write client-only checks for sensitive operations and trust them. The pattern is always: client-side hides for UX → server enforces → server's denial renders as an inline error if the client check was bypassed.

---

## Feature flags

Feature flags answer "is this feature on for this user/cohort right now?" The mechanical pattern is nearly identical to permissions: a hook returns a boolean (or variant), and the answer drives UI rendering or behavior.

### Four kinds of flags

Each kind has different rules about how it's used and when it gets removed.

| Kind | Purpose | Default | Lifecycle |
|---|---|---|---|
| **Kill switch** | Disable a feature in production if it breaks | On (true) | Permanent — never removed |
| **Rollout** | Gradually expose a new feature to more users | Off → On | Temporary — removed once at 100% |
| **Experiment** | A/B test variants | Variant per cohort | Temporary — removed when experiment ends |
| **Entitlement** | Plan-tier or contract-based access | Based on user | Permanent or contract-bound |

Knowing which kind a flag is determines how you write the check and when (or whether) you remove it.

### Where flag data comes from

Flags come from a flag service (LaunchDarkly, Statsig, ConfigCat, your own). The mechanism depends on the service, but the contract from the frontend's perspective is a hook that returns the current value for the current user.

```typescript
// apps/frontend/src/hooks/use-feature-flag.hook.ts
import { useFlag } from "@your-flag-service/sdk";

export function useFeatureFlag(flagKey: KnownFlag): boolean {
  return useFlag(flagKey, /* default */ false);
}
```

The wrapper exists so:
1. There's exactly one place the flag service is imported. Swapping providers later is a one-file change.
2. The flag keys are typed (`KnownFlag` is a union of known flag identifiers).
3. The default is consistent (usually `false` for new features, `true` for kill switches).

For variants (experiments), expose a separate hook:

```typescript
export function useExperimentVariant<T extends string>(experimentKey: KnownExperiment): T {
  return useExperiment<T>(experimentKey);
}
```

### Naming flags

Use `snake_case` (or `kebab-case`, whichever your flag service expects) and prefix by kind:

- Kill switches: `kill_chat`, `kill_dialog_flow_canvas`
- Rollouts: `rollout_new_dashboard`, `rollout_v2_search`
- Experiments: `experiment_homepage_layout`
- Entitlements: `entitlement_advanced_search`, `entitlement_export_pdf`

The prefix tells you the lifecycle and rules at a glance. A flag named `rollout_*` should have a deletion ticket attached when it goes to 100%; a flag named `kill_*` should never be deleted; a flag named `entitlement_*` should never be at "100% rollout" — it's permanent.

The known flag keys live in one file with the `KnownFlag` type:

```typescript
// apps/frontend/src/events/feature-flags.ts (or similar)
export type KnownFlag =
  | "kill_chat"
  | "rollout_new_dashboard"
  | "experiment_homepage_layout"
  | "entitlement_advanced_search";
```

This catches typos at compile time and gives you a complete list of flags in one place — useful for cleanup audits.

### Where flag checks happen — same as permissions

The same rule: derive in the container or higher, render conditionally in the UI. Don't sprinkle `useFeatureFlag` calls through `_parts/` or design-system components.

```typescript
// In the container
const showNewCanvas = useFeatureFlag("rollout_new_canvas");

// In the UI
return showNewCanvas ? <NewCanvas /> : <OldCanvas />;
```

For whole-feature flags (especially kill switches), gate at the route or feature root:

```typescript
const chatKilled = useFeatureFlag("kill_chat");
if (chatKilled) {
  return <FeatureUnavailableFallback />;
}
return <ChatUI />;
```

### The "no conditional hooks" rule

The most common feature-flag mistake breaks the Rules of Hooks:

```typescript
// ❌ Hooks called conditionally — runtime crash
function CaseDashboard() {
  const useNewQuery = useFeatureFlag("rollout_new_query");
  if (useNewQuery) {
    const data = useNewCasesQuery();   // illegal — conditional
    return <NewView data={data} />;
  } else {
    const data = useOldCasesQuery();   // illegal — conditional
    return <OldView data={data} />;
  }
}
```

You cannot conditionally call hooks. The fix is to split the two implementations into separate components and switch at a higher level:

```typescript
// ✅ Each component calls its own hooks unconditionally
function CaseDashboard() {
  const useNew = useFeatureFlag("rollout_new_query");
  return useNew ? <NewCaseDashboard /> : <OldCaseDashboard />;
}

function NewCaseDashboard() {
  const data = useNewCasesQuery();
  // ...
}

function OldCaseDashboard() {
  const data = useOldCasesQuery();
  // ...
}
```

Each branch is a complete component with its own hooks. The flag chooses *which component renders*, not which hooks fire inside one component.

### Removing flags

Rollout and experiment flags accumulate as zombies if nobody removes them. A 100% rolled-out flag still has the `if (showNewFeature)` branches in the code, the old code path lying dead next to it. Two months later, nobody remembers which branch is the live one.

The discipline: **when a rollout reaches 100%, delete the flag and the dead branch in the same PR.** Same for experiments at conclusion. Your `KnownFlag` union shrinks; the codebase gets simpler.

If your team can't enforce this, the second-best is automated reminders or a dashboard listing flags older than X weeks. Without one of those, the flag list grows monotonically.

---

## Cross-cutting rules

These apply to both permissions and feature flags.

### Always check on the server

Both permissions and feature flags must also be enforced server-side. The client-side check is UX (don't show buttons that won't work, don't tease users with features they don't have). The server is the source of truth.

Permission bypass = security incident. Flag bypass = usually just a confused user, but for entitlements it's revenue at stake.

### Centralize the source

There is **one** `useCan` hook and **one** `useFeatureFlag` hook in the codebase. Other code consumes them. This means:

- Swapping flag providers is a one-file change.
- Changing the permission shape is a one-file change.
- Mocking for tests is a one-file change.

Don't import the flag SDK or read user permissions from React Query directly in containers. Always go through the wrapper hook.

### Keep gating logic out of the UI

A `<button>` rendering conditionally based on `useCan(...)` called inside the UI is wrong. The UI gets `state.canEdit` (a boolean) from the container; the container did the check. This applies equally to flags: `state.showNewCanvas` is a boolean in the container's `state`, derived from `useFeatureFlag`.

The principle: the UI doesn't know what permission a button needs; the container does.

### Don't combine permission and flag checks into mega-conditions

```typescript
// ❌ Hard to read, harder to debug
{useCan("case:write") && useFeatureFlag("rollout_new_editor") && state.isDraft && (
  <NewEditor />
)}
```

Derive named booleans in the container with clear names:

```typescript
// ✅ Each condition has a name
const canUseNewEditor =
  useCan("case:write") &&
  useFeatureFlag("rollout_new_editor") &&
  state.isDraft;

return state.canUseNewEditor && <NewEditor />;
```

The named boolean is searchable, loggable, and easier to reason about.

---

## Anti-patterns

### Treating the client check as enforcement

```typescript
// ❌ The button is hidden, but the endpoint isn't protected
{canDelete && <DeleteButton />}
// ...somewhere a colleague hits the API directly with curl
```

Hide the button for UX. Have the server enforce the rule. If you skipped the server side because "the button is hidden, no one will call it" — that's a security bug filed against your codebase.

### Permission strings hard-coded in many places

```typescript
// ❌ Same string in 12 components
useCan("case:write")
useCan("case:write")
useCan("case:write")
// ...
```

If a permission affects many UIs, derive a named boolean once (in a hook or higher container) and pass it down. When the permission name changes, you don't grep-replace.

For genuinely cross-cutting permissions like "is admin," consider a domain-specific hook:

```typescript
// apps/frontend/src/hooks/use-is-admin.hook.ts
export function useIsAdmin(): boolean {
  return useCan("admin:access");
}
```

### Conditional hook calls behind a flag

Already covered above. You can't `if (flag) useHookA(); else useHookB()`. Split into two components, switch at the parent.

### Flags that never get cleaned up

```
KnownFlag union has 47 entries.
8 are 100% rollouts from 2022.
```

Treat rollouts and experiments as temporary. Remove them when their purpose is served.

### Permission check inside `_parts/`

```typescript
// ❌ Part reaches into the auth system
function DeleteButtonPart() {
  const canDelete = useCan("case:delete");
  if (!canDelete) return null;
  return <button>...</button>;
}
```

Parts receive booleans as props. The parent's container reads `useCan`. Keeping the check in the container means the part is reusable in any context (an admin view that always renders the button without checking, for example).

### Mixing permissions and entitlements without clarity

```typescript
useCan("export_pdf") // is this a permission? An entitlement? A flag?
```

If you can't tell from the name, the type system can't enforce the right thing either. Prefix or namespace consistently:

- `case:write` — permission (resource:action)
- `entitlement_export_pdf` — entitlement (different lifecycle, different source)
- `kill_chat` — flag (kill switch)

Mixing them makes audits and cleanups much harder.

### Disabling the button without a tooltip

```typescript
// ❌ User sees a disabled button and doesn't know why
{canEdit ? <EditButton /> : <button disabled>Edit</button>}
```

If you're going to disable, pair it with an explanation. Otherwise, hide.

---

## What this skill does NOT cover

- **Where the user data is fetched** (current user query, profile, organization) — data layer skill
- **Where flag data lives at runtime** (the flag SDK's caching, real-time updates) — depends on provider; outside this skill
- **Routing and route guards mechanically** — routing skill (forthcoming)
- **Loading/error UX while permissions or flags are loading** — loading and errors skill
- **Server-side enforcement** — backend concern, outside the frontend skill set
- **A/B test analytics and experiment design** — analytics skill (forthcoming)

When deciding whether to gate something, where the gate goes, and how the UI presents the denial, stay in this skill. When the question shifts to "where does this data come from" or "how do I track who got which variant," that's a different skill.
