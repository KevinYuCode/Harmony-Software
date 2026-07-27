---
name: frontend-toasts-and-analytics
description: Rules for global side effects in the OpenJustice React frontend — toasts (user-visible notifications) and analytics (silent event tracking). Covers where toast/analytics services live, the centralized wrapper pattern, who calls them (containers and actions, not UI), toast vs. inline error decisions, message and event-name conventions, payload rules (no PII, no full records), and anti-patterns that create noise or leak data. Use this skill whenever firing a toast on an action result, adding an analytics event, naming an event, deciding what payload to include, or when the user asks "should I toast this", "where does this tracking call go", "what should the event be called", or anything about notifications or behavior tracking. Trigger this skill any time a fire-and-forget global side effect is being added.
---

# Frontend Toasts & Analytics

This skill covers two **global side effects** that aren't part of the user's primary UI flow but happen on top of it: **toasts** (the user sees them) and **analytics** (the user doesn't, but the team needs them to be reliable). Both have the same architectural shape — a centralized service wrapper, called from a specific layer of the app — but different rules about *which* layer and what the payload looks like.

For action contracts and the intrinsic-vs-caller-decided rule, see the actions skill. For where event-bus events differ from analytics events, see the event bus skill.

## Why this matters

Toasts and analytics fail in opposite directions when their rules slip:

- **Toasts become noise.** Every API success gets a toast, every form error fires both a toast *and* an inline message, batch operations drop fifty toasts in a second. Users learn to ignore them, which is worse than not having them.
- **Analytics become unreliable.** Events fire from the UI layer where the same action might dispatch from three different surfaces. Different surfaces send different payloads. Tracking is supposed to inform decisions but the data contradicts itself, so nobody trusts it.

The rules here optimize for:
- **Single source for each service** — one wrapper around the toast library, one wrapper around the analytics SDK. Swapping providers is a one-file change.
- **Calls from the right layer** — fire-and-forget effects belong where the *fact* lives (workflow → action) or where the *decision* lives (caller-decided → container). Never in the UI.
- **Coherent shape** — toasts read consistently; analytics events follow one naming and payload convention.

---

## Two effects, similar patterns

| | Toast | Analytics event |
|---|---|---|
| Visible to user | Yes | No |
| Failure if missed | Annoying | Bad data, bad decisions |
| Default home | Container (caller-decided) | Action (intrinsic) |
| Service wrapper | `@/lib/toast` | `@/lib/analytics` |
| Naming convention | Plain user-facing copy | `domain_action_past_tense` |
| Payload concern | Length and clarity | PII and size |

The mechanical pattern is the same — wrap the SDK, call from the right place — but the *layer* differs because toasts are usually surface-specific (the same action could toast or not depending on the UI) while many analytics events are workflow-level facts (the same submission is the same submission regardless of which button fired it).

---

## Toasts

Toasts are short, transient notifications the user sees. They're not part of the UI flow — the underlying UI usually still works without them — they're acknowledgements, alerts, or status updates.

### One service wrapper

Whatever toast library the app uses (Sonner, `react-hot-toast`, an in-house Zustand store, etc.) is wrapped in `@/lib/toast`. Other code never imports the SDK directly.

```typescript
// apps/frontend/src/lib/toast.ts
import { toast as sdkToast } from "sonner";

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sdkToast.success(message, options),
  error: (message: string, options?: ToastOptions) =>
    sdkToast.error(message, options),
  info: (message: string, options?: ToastOptions) =>
    sdkToast.info(message, options),
  warning: (message: string, options?: ToastOptions) =>
    sdkToast.warning(message, options),
};

type ToastOptions = {
  duration?: number;
  action?: { label: string; onClick: () => void };
};
```

The wrapper exists so:
- Swapping libraries later is one file
- The four toast types are typed and uniform
- Test mocking is one file

### Four toast types, used consistently

| Type | Use for | Example |
|---|---|---|
| `success` | A user-initiated action completed | "Case submitted" |
| `error` | An action failed and there's no inline place to show it | "Failed to save settings" |
| `info` | Background event the user should know about | "New version available — refresh to update" |
| `warning` | Something the user should be aware of soon | "Session expires in 5 minutes" |

Don't invent more types. If the message doesn't fit one of the four, it probably shouldn't be a toast.

### Who calls toasts — containers, sometimes actions

Toasts are usually **caller-decided**. The same `useSubmitCase` action might be called from:
- A new-case form — toasts "Case submitted" and navigates to the timeline
- A bulk import — fires no per-item toasts (one summary toast at the end)
- A side-panel quick form — toasts and closes the panel

The action is the same; the UI behavior differs. So the toast lives in the **container**, not the action:

```typescript
// In the container
const handlers = {
  onSubmit: async (data) => {
    try {
      await submitCase.execute(data);
      toast.success("Case submitted");
      router.push("/cases");
    } catch (err) {
      // submitCase already exposed err via state.error for inline rendering
      // No toast needed — error is shown in the form
    }
  },
};
```

The exception: **intrinsic toasts** that fire as facts of the workflow regardless of caller. The classic case is a subscription's reconnect logic — when the WebSocket reconnects after a disconnect, the toast fires from the subscription itself ("Connection restored"). No caller decided to do that; it's a system-level fact. Same as the actions skill's "intrinsic vs. caller-decided" rule.

If you're not sure, default to caller-decided. The amount of toasts that are genuinely intrinsic is small.

### When to toast

Reach for a toast when:
- A user-initiated async action completed and the result isn't visible in the current UI ("Settings saved" — the save button doesn't change the page, so the user needs an acknowledgement)
- A background event happened that the user should know about ("Connection restored," "New comment received")
- An error happened that has nowhere else to go (the action failed but the UI doesn't have a place for an inline error)

Don't toast when:
- The result is already visible in the UI ("Created!" toast for a creation that adds the new item to a visible list — the user can see it)
- The error has an inline render path (form validation errors, query errors that render in `state.error`)
- The toast would fire repeatedly from a batch operation (one summary toast, not one per item)
- The information isn't actionable or important (page loaded successfully, fetch succeeded, list reloaded)

The test: would the user notice if this toast didn't fire? If no, don't toast.

### Toast message conventions

- **Short.** One line. Aim for under 60 characters.
- **Past tense for completions.** "Case submitted," not "Submitting case…" or "Submit case." (For in-progress feedback, use a button spinner, not a toast.)
- **Specific.** "Case 'Smith v. Jones' submitted" beats "Done" if the specific name fits.
- **Actionable when relevant.** "Settings saved — refresh to apply" with an action button to refresh.
- **No exclamation marks by default.** "Case submitted" reads better than "Case submitted!" especially when many of them stack.

For errors:
- Say what failed, not "Error" or "Something went wrong"
- "Failed to delete case — try again" beats "Error deleting case"
- Include an action button when retry makes sense

### Batch operations — one toast, not many

```typescript
// ❌ One toast per item — fifty toasts in a second
for (const id of selectedIds) {
  await deleteCase(id);
  toast.success("Case deleted");
}

// ✅ One summary toast
const result = await deleteCasesAction.execute(selectedIds);
toast.success(`${result.deletedCount} cases deleted`);
```

If a partial failure is possible:

```typescript
toast.success(`${result.successful.length} of ${selectedIds.length} cases deleted`, {
  action: result.failed.length
    ? { label: "View failures", onClick: () => openFailureDialog(result.failed) }
    : undefined,
});
```

### Toasts must fail silently

If the toast service is broken, the underlying app must keep working. The wrapper should never throw to its caller — wrap the SDK call in `try/catch` if necessary, log the failure, and return. The user's submit shouldn't fail because the toast couldn't render.

---

## Analytics

Analytics are silent. The user never sees them. The team uses them to understand behavior, measure experiments, and detect regressions. Reliability matters because analytics inform decisions, and noisy or incorrect data is worse than no data — it leads to wrong conclusions.

### One service wrapper

Same pattern as toasts: the SDK (Segment, PostHog, Amplitude, Mixpanel, your own collector) is wrapped in `@/lib/analytics`. Other code never imports the SDK.

```typescript
// apps/frontend/src/lib/analytics.ts
import { analytics as sdk } from "@your-analytics-sdk";

type KnownEvent =
  | "case_submitted"
  | "case_deleted"
  | "user_logged_in"
  | "filter_applied"
  // ...
  ;

export const analytics = {
  track: (event: KnownEvent, properties?: Record<string, unknown>) => {
    try {
      sdk.track(event, properties);
    } catch (err) {
      // log but don't throw — analytics must fail silently
      console.error("analytics.track failed", err);
    }
  },
  identify: (userId: string, traits?: Record<string, unknown>) => {
    try {
      sdk.identify(userId, traits);
    } catch (err) {
      console.error("analytics.identify failed", err);
    }
  },
};
```

The known events are typed as a union. New events get added to the union with a deliberate change — no stringly-typed event names that drift across the codebase.

### Event naming

Use **`<domain>_<action>_<past-tense>`**:

- `case_submitted`, `case_deleted`, `case_archived`
- `user_logged_in`, `user_logged_out`, `user_invited`
- `filter_applied`, `search_performed`, `tab_changed`
- `experiment_homepage_layout_assigned`

Conventions:
- **Past tense** — events represent things that *happened*. `case_submit` is a command; `case_submitted` is a fact.
- **Domain prefix** — `case_*`, `user_*`, `org_*`. Without it, events sort alphabetically by action verb, which makes the dashboard unreadable.
- **`snake_case`** — most analytics tools handle it cleanly. If your tool prefers `PascalCase` (`CaseSubmitted`), follow that — but pick one and stick to it.
- **No `event_` or `track_` prefix** — that's the function, not the event.

### Payload rules — minimal, structured, no PII

The `properties` object on every track call follows three rules:

1. **No PII.** No email, no name, no IP address, no postal address. Use IDs (`{ userId: "abc123" }`), categories (`{ plan: "pro" }`), counts (`{ attachmentCount: 3 }`). PII in analytics payloads is a compliance problem (GDPR, CCPA) and an audit risk.
2. **No full records.** A `case_submitted` event with `{ case: fullCaseRecord }` is bloated and unstable — every shape change to the case schema becomes an analytics schema change. Send IDs and categorical fields, not records.
3. **Structured and consistent.** Same property name across events for the same concept. `{ caseId }` everywhere, not `{ case_id }` in some events and `{ id }` in others.

```typescript
// ✅ Minimal, structured, no PII
analytics.track("case_submitted", {
  caseId: result.id,
  priority: input.priority,
  attachmentCount: input.attachments.length,
  fromSurface: "new_case_form",
});

// ❌ PII + full records + inconsistent shape
analytics.track("case_submitted", {
  case: fullCaseRecord,        // bloat
  user_email: user.email,       // PII
  user: user,                   // more PII
  details: input.description,   // free-text, possibly PII
});
```

### Where analytics calls live — workflow facts in actions, surface-specific in containers

The split:

| Kind of event | Where to fire it |
|---|---|
| **Workflow facts** (`case_submitted`, `case_deleted`, `user_logged_in`) | Action |
| **UI interactions** (`filter_applied`, `tab_clicked`, `quick_menu_opened`) | Container or click handler |
| **Page views** | Routing layer (or page component, once on mount) |
| **Performance metrics** | Instrumentation hooks (rare) |

#### Workflow facts go in actions

If the event is "the workflow happened," it fires from the action because the action *is* the workflow. The same workflow from any container fires the same event.

```typescript
// In the action
export function useSubmitCase() {
  const submitMutation = useSubmitCaseMutation();

  return {
    execute: async (input: CreateCaseDto) => {
      const result = await submitMutation.mutateAsync(input);
      analytics.track("case_submitted", {
        caseId: result.id,
        priority: input.priority,
        attachmentCount: input.attachments?.length ?? 0,
      });
      return result;
    },
    // ...
  };
}
```

This is intrinsic — every submission fires the event, no caller has to remember. Same as the actions skill's intrinsic-side-effects rule.

#### Surface-specific events go in containers or handlers

If the event is "the user clicked *this surface*" — where the surface matters — fire it where the surface lives. Different surfaces give different `fromSurface` values, so the call site matters.

```typescript
// In a container, where the surface is known
const handlers = {
  onQuickAction: () => {
    analytics.track("quick_menu_used", { fromSurface: "case_row" });
    // ...
  },
};
```

If you want to know *both* "the action happened" and "from which surface" — fire both. The action fires `case_submitted` with `caseId, priority, ...`; the container also fires `case_submit_initiated` with `fromSurface` if that's worth tracking. Or include `fromSurface` in the workflow event by passing it through the action's input.

#### Page views go at the routing layer

Page-view events fire when a page mounts (or when the route changes). Don't sprinkle `analytics.track("page_viewed")` through every page; centralize at the router/route component. See the routing skill.

### Identify on auth events

When the user logs in, call `analytics.identify(userId, traits)` once. The traits should be the user's stable attributes (plan tier, role, organization ID), not their current session state. Subsequent events automatically associate with the identified user — no need to pass `userId` in every event payload.

On logout, call the SDK's reset function (`analytics.reset()` if your SDK has one) to detach the analytics client from the previous user. Otherwise the next user's events get attributed to the previous user until the page reloads.

### Server-side analytics for critical events

If an event is critical for billing, contracts, or compliance — like "user upgraded plan" — track it **server-side**, not (only) from the client. Client-side analytics fail silently for users on slow networks, with ad blockers, or when the SDK is broken. Critical events should fire from the server, where reliability is much higher.

The frontend skill doesn't dictate which events go server-side; that's a product/data-team decision. But the skill does say: **don't rely on the frontend for events you can't afford to lose.**

---

## Cross-cutting rules

These apply to both toasts and analytics.

### Centralize the service

`@/lib/toast` and `@/lib/analytics` are the only places that import the underlying SDK. Everywhere else uses the wrapper. This makes:
- Provider swap a one-file change
- Mocking trivial in tests
- Patching SDK quirks (a bug, a deprecation) one-file
- Auditing everything that fires possible

### Don't call from the UI directly

```typescript
// ❌ UI knows about toasts
export function CaseForm() {
  const { state, handlers } = useCaseFormContainer();
  const { register, handleSubmit } = state.form;

  const onSubmit = handleSubmit(async (data) => {
    await handlers.onSubmit(data);
    toast.success("Case created");  // wrong layer
  });
  // ...
}
```

The container called `handlers.onSubmit`. The toast belongs *next to that call*, not pulled apart from it across two layers. The same applies to analytics — UI components shouldn't be importing `analytics` to fire events.

The only valid exception is page-view tracking that legitimately lives at the page level (because the page-level component *is* the surface).

### Both must fail silently

Neither toasts nor analytics may break the underlying app. If the toast service is down, the user's submit still succeeds. If the analytics SDK throws, the next event still tries. Wrap each underlying call in `try/catch` inside the service wrapper; never bubble these failures to callers.

### Consistent before clever

A boring system that always works the same way beats a clever one with edge cases. Toasts that always fire from the container, analytics events that always follow the naming convention, payloads that always have the same property shapes. Resist patterns that "just for this case" deviate from the convention — those become the patterns nobody understands six months later.

---

## Anti-patterns

### Toasting from inside actions for caller-decided cases

```typescript
// ❌ Action fires its own toast
export function useSubmitCase() {
  return {
    execute: async (input) => {
      const result = await submitMutation.mutateAsync(input);
      toast.success("Case submitted");  // not the action's call
      return result;
    },
  };
}
```

Every container that calls this action gets the same toast, even ones that shouldn't (a bulk import shouldn't fire 50 toasts). Move it to the container.

### Toasting errors that already render inline

```typescript
// ❌ User sees the error twice
try {
  await action.execute(data);
} catch (err) {
  toast.error("Failed to submit");
}
// ...meanwhile state.submitError is rendered as an inline banner above the form
```

If the error has an inline home, that's where it goes. Toasting the same error doubles the noise. The toast is for errors that have *nowhere else* to go.

### Per-item toasts in batch operations

```typescript
// ❌
for (const id of selectedIds) {
  await deleteCase(id);
  toast.success("Case deleted");
}
```

One summary toast at the end.

### Stringly-typed event names

```typescript
// ❌
analytics.track("case_submited", { caseId });  // typo never caught
analytics.track("case-submitted", { caseId }); // different separator, separate event
analytics.track("CaseSubmitted", { caseId });  // different case
```

Type the events as a union. Misspellings fail at compile time. Inconsistencies become impossible.

### PII in payloads

```typescript
// ❌ Compliance and security risk
analytics.track("user_signed_up", {
  email: user.email,
  full_name: user.fullName,
  ip: request.ip,
});
```

User IDs only. Use the analytics tool's identify feature for stable identity; don't shove PII through every event.

### Full record payloads

```typescript
// ❌ Bloat plus brittle to schema changes
analytics.track("case_submitted", { case: fullCaseRecord });
```

Send IDs and the specific categorical fields you want to analyze.

### Tracking everything

```typescript
analytics.track("button_clicked", { button: "Submit" });
analytics.track("input_focused", { field: "title" });
analytics.track("scroll_position_changed", { y: 200 });
// ... 50 more events per session per user
```

Tracking everything is a denial-of-service against your own analytics dashboard. Track decisions and outcomes, not micro-interactions. If you find yourself wanting fine-grained interaction data for one feature, scope it to that feature with a feature flag, not the whole app.

### Tracking nothing

The opposite anti-pattern. A team with no events to query is debugging blind. The minimum viable event set is roughly: signups, logins, the core domain workflows (case_submitted, message_sent, etc.), and major errors. Get those right; add more incrementally.

### Toast messages that read like paragraphs

```typescript
// ❌
toast.success(
  "Your case has been successfully submitted to the system. The case will now be processed and reviewed by our team. You will receive an email when the review is complete."
);
```

That's a banner, an email, or an in-app modal — not a toast. Toasts are short.

### Auto-dismissing critical errors

```typescript
// ❌ Critical message disappears in 4 seconds
toast.error("Your changes were not saved due to a network error", { duration: 4000 });
```

Critical errors should stay until dismissed, or at least include an action button. If the user blinks, they miss it.

---

## What this skill does NOT cover

- **Action contract and the intrinsic vs. caller-decided rule** (full breakdown) — actions skill
- **Cross-feature event bus** (different from analytics — events represent system facts other features react to; analytics events go off-platform) — event bus skill
- **Server-side analytics architecture** — backend concern
- **Inline error rendering** (where API errors live in `state.error`, how the UI shows them) — loading and errors skill
- **The exact tooling** (which toast library, which analytics SDK, configuration) — provider-specific, outside this skill

When firing a toast or an analytics event, stay in this skill. When the question shifts to "should this be an event-bus event other features react to" or "how does the action expose this status," that's the other skill.
