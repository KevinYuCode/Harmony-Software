---
name: frontend-forms
description: Form rules for the OpenJustice React frontend — the DTO-first approach where Zod schemas come from `@packages/core`, the form-extends-DTO pattern for the common case where a form collects more or different fields than the API takes, where the form instance is created (container) and rendered (UI), how submission connects to mutations or actions, and where transform functions live when form values don't match the DTO 1:1. Use this skill whenever creating a new form, wiring `react-hook-form` (or any form library), validating with Zod, deciding where the form schema lives, transforming form values into a DTO before submission, handling multi-step wizards, file uploads, or conditional fields, or whenever the user asks "where does the form schema go", "how do I validate this", "the form fields don't match the API", "how should I submit this", or anything about form architecture. Trigger this skill any time form code is being written or reviewed — forms are where DTO/UI mismatches accumulate quietly, and getting the schema source wrong is the most common cause of frontend/backend type drift.
---

# Frontend Forms

This skill defines how forms are structured: where the schema comes from, where the form instance is created, where it's rendered, and how submission flows back through the data layer. It assumes a Zod-based form library (`react-hook-form` with `@hookform/resolvers/zod` is the canonical setup); the architectural rules apply to any equivalent stack.

For DTO schemas themselves, see the data layer skill. For the container/UI split, see the components skill. For mutations and actions that submission ultimately calls, see the data layer and actions skills.

## Why this matters

Forms are where the frontend and backend type contracts meet. Get the schema source wrong and they drift: the backend expects `tags: string[]`, the form sends `tags: string`, validation passes locally and the request fails on the server. Mix form state with UI rendering and you can't test either in isolation. Bake submission logic into the UI and the form becomes uncomposable — a wizard that wants to save partial state at each step has to fight the rendering layer.

The rules here optimize for:
- **One source of truth for the schema** — the DTO from `@packages/core` is the contract; the form derives from it.
- **Container/UI separation** — the form instance is a piece of state the container owns; the UI renders fields against it.
- **Predictable submission** — `form values → (transform if needed) → action or mutation → post-success behavior` is the same shape for every form.

---

## The form pipeline at a glance

```
DTO schema (@packages/core)
       ↓
Form schema (= DTO, or DTO.extend(...))
       ↓
Form instance (useForm) ← created in the container
       ↓
UI renders fields against form
       ↓
form.handleSubmit(submit)
       ↓
[transform form values → DTO]   ← only if they differ
       ↓
action.execute(dto) or mutation.mutate(dto)
       ↓
[caller decides post-success behavior in container — navigate, toast, reset]
```

Every form follows this shape. Some pieces collapse for trivial cases (no transform when form === DTO), but the pipeline is the same.

---

## Form schemas — DTO-first

The Zod schema that validates form values comes from `@packages/core`, never from a frontend-defined copy.

### The simple case: form schema = DTO schema

For a form whose fields are 1:1 with the API payload, **use the DTO schema directly**. No second schema, no copy.

```typescript
// In the container
import { createCaseDtoSchema, type CreateCaseDto } from "@packages/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function useNewCaseFormContainer() {
  const form = useForm<CreateCaseDto>({
    resolver: zodResolver(createCaseDtoSchema),
    defaultValues: { title: "", description: "", priority: "normal" },
  });

  const submitCase = useSubmitCase();

  return {
    state: { form, isSubmitting: submitCase.status === "pending" },
    handlers: {
      onSubmit: form.handleSubmit(async (dto) => {
        await submitCase.execute(dto);
      }),
    },
  };
}
```

This is the cleanest case. The form's TypeScript type, runtime validation, and submission payload are all the same DTO. Zero risk of drift; the schema only changes when the backend changes it, in one place.

### The common case: form-extends-DTO

Most non-trivial forms collect *more* than the DTO, *fewer* than the DTO, or *differently shaped* values. Don't treat this as exceptional — it's the majority of real-world forms. Common reasons a form diverges from its DTO:

- **UI-only fields** — "I agree to terms," "save as draft," autosave toggle
- **Different shape for the same data** — DTO has `tags: string[]`, the form has `tagsRaw: string` (comma-separated input)
- **File uploads** — form has `File` objects, DTO has uploaded-file IDs
- **Conditional fields** — fields that exist in the form depending on user choices, but the DTO uses a discriminated union
- **Wizard fields** — fields collected progressively across steps, finalized at submission

The pattern: extend or modify the DTO schema with `.extend({ ... })`, `.omit({ ... })`, or `.transform({ ... })`, and treat the result as the form schema.

```typescript
// apps/frontend/src/feature/cases/lib/case-form-schema.ts
import { z } from "zod";
import { createCaseDtoSchema } from "@packages/core";

export const caseFormSchema = createCaseDtoSchema
  .omit({ tags: true })          // DTO has tags: string[]
  .extend({
    tagsRaw: z.string(),         // form takes a comma-separated string
    agreeToTerms: z.literal(true), // UI-only field
    attachments: z.array(z.instanceof(File)).optional(),
  });

export type CaseFormValues = z.infer<typeof caseFormSchema>;
```

The form schema is built *from* the DTO schema, so they can't drift — the DTO's existing fields and constraints stay enforced. The form adds, removes, or reshapes only what it needs to.

### Where each piece lives

| Piece | Location |
|---|---|
| DTO Zod schema and type | `@packages/core` (single source of truth) |
| Form Zod schema (when it diverges from DTO) | `feature/<feature>/lib/<feature>-form-schema.ts` |
| Form values type | inferred from the form schema (`z.infer<typeof formSchema>`) |
| Form instance creation | container hook |
| Form rendering | UI component |
| `form values → DTO` transform | `feature/<feature>/lib/transform-<x>-form-to-dto.ts` |
| Submission logic | mutation or action hook |

The principle: schemas next to where they're built (DTO is shared, form schema is feature-local in `lib/`); the form *instance* is in the container; rendering is in the UI; transformation is in `lib/`; submission is in the data layer.

---

## The form instance lives in the container

The container creates the form via `useForm`, exposes the `form` object in `state`, and exposes the submit handler in `handlers`. The UI never calls `useForm` directly.

```typescript
export function useNewCaseFormContainer() {
  const submitCase = useSubmitCase();
  const router = useRouter();

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: { title: "", description: "", tagsRaw: "", priority: "normal", agreeToTerms: false },
  });

  return {
    state: {
      form,
      isSubmitting: submitCase.status === "pending",
      submitError: submitCase.error,
    },
    handlers: {
      onSubmit: form.handleSubmit(async (values) => {
        const dto = transformCaseFormToDto(values);
        const result = await submitCase.execute(dto);
        router.push(`/cases/${result.id}`);
      }),
      onCancel: () => router.back(),
    },
  };
}
```

A few patterns to notice:

- **`form` is part of `state`.** The UI reads it (for `register`, `formState`, etc.) just like any other piece of state.
- **`onSubmit` is wrapped in `form.handleSubmit`.** The wrapper handles validation; your async function only runs if validation passes.
- **The transform happens in the handler**, not inside `submitCase`. The action takes a clean DTO; the conversion from form to DTO is a container-level (or `lib/`-level) concern.
- **Caller-decided side effects** (navigate, toast, reset) happen in the handler, after `await execute()`. Same rule as the actions skill.

### Default values

`defaultValues` is the form's initial state. Three rules:

1. **Always provide them explicitly.** Letting `react-hook-form` infer from the schema works for simple cases but fails silently for nested objects and array fields. Be explicit.
2. **Compute from props, params, or queries inside the container.** If the default values come from somewhere else (URL, an existing record being edited, user preferences), assemble them in the container before calling `useForm`.
3. **Don't sync defaults via `useEffect`.** If the source of defaults changes, use `form.reset(newDefaults)` from a deliberate handler — not an effect that watches a prop.

```typescript
// ✅ Edit form: defaults from a query
const { data: existingCase } = useCase(caseId);

const form = useForm<CaseFormValues>({
  resolver: zodResolver(caseFormSchema),
  defaultValues: existingCase
    ? caseToFormValues(existingCase)  // pure function in lib/
    : { title: "", description: "", /* ... */ },
});

// When existingCase loads later:
useEffect(() => {
  if (existingCase) form.reset(caseToFormValues(existingCase));
}, [existingCase, form]);
```

This `useEffect` is one of the legitimate effect uses (synchronizing with an external system — in this case, the asynchronously-loaded server record). It's the rare valid sync effect. See the hooks-and-effects skill for the broader rules.

---

## The UI renders against the form

The UI consumes the container, reads `state.form`, and uses it to register fields and surface validation. It never creates the form, never knows about the schema, and never calls submission directly — it calls `handlers.onSubmit`.

```typescript
export function NewCaseForm() {
  const { state, handlers } = useNewCaseFormContainer();
  const { form, isSubmitting, submitError } = state;
  const { register, formState } = form;

  return (
    <form onSubmit={handlers.onSubmit} noValidate>
      <label>
        Title
        <input {...register("title")} />
        {formState.errors.title && <span>{formState.errors.title.message}</span>}
      </label>

      <label>
        Description
        <textarea {...register("description")} />
        {formState.errors.description && <span>{formState.errors.description.message}</span>}
      </label>

      <label>
        Tags (comma-separated)
        <input {...register("tagsRaw")} />
      </label>

      <label>
        <input type="checkbox" {...register("agreeToTerms")} />
        I agree to the terms
      </label>

      {submitError && <ErrorBanner error={submitError} />}

      <button type="submit" disabled={isSubmitting || !formState.isValid}>
        Submit
      </button>
      <button type="button" onClick={handlers.onCancel}>
        Cancel
      </button>
    </form>
  );
}
```

For complex field UIs (custom components like rich text editors, date pickers, multi-selects), use `Controller` from `react-hook-form` to wire the field to the form. The `Controller` calls and field components stay in the UI; the form instance behind them lives in the container.

### Field-level pieces in `_parts/`

For forms big enough to break into pieces, individual field clusters go in `_parts/` as presentational components. They receive `register`, `control`, or specific values from the parent UI as props — same rules as any other part (no data fetching, no direct form access via `useFormContext` if you can avoid it).

`useFormContext` is occasionally useful for deep field hierarchies, but prefer prop-passing when reasonable: it keeps each part's contract explicit.

---

## Submission flows

Every form submits the same way:

1. UI calls `handlers.onSubmit` from a `<form onSubmit={...}>` or a button handler
2. `form.handleSubmit(submit)` runs validation; if it fails, errors land in `formState` and the submit function doesn't run
3. The submit function transforms form values to DTO if needed
4. The submit function calls the action (or mutation) with the DTO
5. After `await`, the container handles caller-decided side effects (navigation, toast, modal close, form reset)

```typescript
onSubmit: form.handleSubmit(async (values) => {
  const dto = transformCaseFormToDto(values);
  const result = await submitCase.execute(dto);
  router.push(`/cases/${result.id}`);
}),
```

### When the form schema *is* the DTO

If form values are already shaped exactly like the DTO, skip the transform:

```typescript
onSubmit: form.handleSubmit(async (dto) => {
  await submitCase.execute(dto);
  router.push("/cases");
}),
```

`react-hook-form`'s typed handler gives you the validated values typed as `CreateCaseDto` automatically (because that's what you passed to `useForm<CreateCaseDto>`).

### Transforms live in `lib/`

When a transform is needed, write it in `feature/<feature>/lib/transform-<x>-form-to-dto.ts` as a pure function. The container calls it; the function has no React, no I/O, no state.

```typescript
// apps/frontend/src/feature/cases/lib/transform-case-form-to-dto.ts
import type { CaseFormValues } from "@/feature/cases/lib/case-form-schema";
import type { CreateCaseDto } from "@packages/core";
import { parseTagList } from "@/feature/cases/lib/parse-tag-list";

export function transformCaseFormToDto(values: CaseFormValues): CreateCaseDto {
  return {
    title: values.title.trim(),
    description: values.description,
    tags: parseTagList(values.tagsRaw),
    priority: values.priority,
    // agreeToTerms is UI-only — not in the DTO
    // attachments handled separately by the action's upload step
  };
}
```

Same rules as any other `lib/` function (folder structure skill, components skill's handler-extraction guidance): pure, testable, named for what it does, kebab-case file.

### Reverse transform for edit forms

When opening a form to edit an existing record, you need the reverse: DTO/server-shape → form values. Same pattern, opposite direction:

```typescript
// apps/frontend/src/feature/cases/lib/case-to-form-values.ts
export function caseToFormValues(c: Case): CaseFormValues {
  return {
    title: c.title,
    description: c.description,
    tagsRaw: c.tags.join(", "),
    priority: c.priority,
    agreeToTerms: true, // already agreed previously
  };
}
```

These two functions (`form → dto`, `record → form`) often live in one file — they're the same translation, both directions. A file named `case-form-mappers.ts` with both exports is fine.

---

## Common patterns

### Multi-step wizards

For a wizard, the form instance is created once and persists across steps. Each step renders a subset of the fields. The container tracks `currentStep` as local state; the form preserves its values.

```typescript
export function useCaseWizardContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: { /* ... all fields, all steps ... */ },
    mode: "onBlur", // or "onChange" if you want live validation
  });

  const submitCase = useSubmitCase();

  const goNext = async () => {
    const fieldsForStep = STEP_FIELDS[currentStep];
    const valid = await form.trigger(fieldsForStep);
    if (valid) setCurrentStep((s) => s + 1);
  };

  return {
    state: { form, currentStep, totalSteps: STEP_FIELDS.length },
    handlers: {
      onNext: goNext,
      onBack: () => setCurrentStep((s) => Math.max(0, s - 1)),
      onSubmit: form.handleSubmit(async (values) => {
        const dto = transformCaseFormToDto(values);
        await submitCase.execute(dto);
      }),
    },
  };
}
```

`form.trigger(fields)` validates only the fields for the current step before letting the user advance. The full validation runs at final submit.

### Field arrays

For dynamic lists of fields (multiple attachments, multiple assignees), use `useFieldArray`. Like `useForm`, it lives in the container — the UI consumes the array via the container's state.

The exception: if a single field array is rendered as a self-contained sub-feature (its own complex UI with its own concerns), the field array hook can move into the sub-feature's container. The parent's container exposes `control` to the sub-feature, which calls `useFieldArray({ control })` itself.

### File uploads

The form holds `File` objects; the DTO holds uploaded-file IDs (the server has assigned an ID after the file was uploaded). Two-stage flow:

1. The form schema validates the `File` object presence/size/type
2. On submit, an action uploads the files first (getting back IDs), then submits the rest of the form with those IDs

The action wraps both steps:

```typescript
// In the action
execute: async (values: CaseFormValues) => {
  const fileIds = await Promise.all(
    values.attachments?.map(uploadFile) ?? []
  );
  const dto = transformCaseFormToDto({ ...values, fileIds });
  return await submitMutation.mutateAsync(dto);
}
```

The action is the right home because uploads + submit is a multi-step workflow. See the actions skill for the broader pattern.

### Conditional validation

When some fields are only required given other field values, use `.refine()` or `.superRefine()` on the form schema:

```typescript
export const caseFormSchema = createCaseDtoSchema.extend({
  /* ... */
}).superRefine((values, ctx) => {
  if (values.priority === "high" && !values.escalationContact) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["escalationContact"],
      message: "Required for high-priority cases",
    });
  }
});
```

Conditional logic lives in the schema, not in the UI. The UI only renders errors that the schema produces.

---

## Anti-patterns

### Defining the form schema from scratch

```typescript
// ❌ Local schema — drifts from the DTO silently
const caseFormSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  priority: z.enum(["low", "normal", "high"]),
});
```

The DTO is the source of truth. Either use the DTO schema directly or extend it. Defining a parallel schema means every backend change needs a corresponding frontend change *and someone has to remember*. They won't.

### `useForm` in the UI component

```typescript
// ❌ Form state in the UI
export function NewCaseForm() {
  const form = useForm<CaseFormValues>({ /* ... */ });
  // ...
  return <form>{/* ... */}</form>;
}
```

The form is state. State lives in the container. Move `useForm` to the container; the UI consumes it via props.

### Transforming form → DTO inline in the submit handler

```typescript
// ❌ Inline transform
onSubmit: form.handleSubmit(async (values) => {
  const dto = {
    title: values.title.trim(),
    description: values.description,
    tags: values.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
    priority: values.priority,
  };
  await submitCase.execute(dto);
}),
```

Same rule as the components skill's handler-extraction guidance: pure transformation logic goes to `lib/`. The handler reads `transformCaseFormToDto(values) → execute → navigate`.

### Submitting via `useEffect`

```typescript
// ❌
useEffect(() => {
  if (formState.isSubmitSuccessful) {
    router.push("/cases");
  }
}, [formState.isSubmitSuccessful]);
```

The post-submit navigation belongs *in the submit handler*, after `await execute()`. The effect-on-success pattern is harder to read, runs on every state change matching the dep, and racing with the form's reset can cause double navigation.

### Manually managing field state

```typescript
// ❌ Reinventing the form library
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [errors, setErrors] = useState<Record<string, string>>({});
```

For anything beyond a single text input, use a form library. Manual state plus manual validation plus manual error tracking is exactly what `useForm` solves.

### Fetching submission data inside the form

```typescript
// ❌ The form doesn't know how to submit itself
onSubmit: async (values) => {
  await fetch("/api/cases", { method: "POST", body: JSON.stringify(values) });
}
```

Submission goes through an action or mutation, which goes through the API layer. See the data-layer skill for why direct `fetch` calls are banned in this codebase.

### `useFormContext` everywhere

```typescript
// ❌ Every part reaches into the form context invisibly
function TitleField() {
  const { register } = useFormContext();
  return <input {...register("title")} />;
}
```

`useFormContext` works but obscures each part's contract — you can't tell what a field needs without reading its body. Prefer prop-passing (`<TitleField register={register} />`) for shallow hierarchies; reach for `useFormContext` only when prop-passing becomes genuinely unwieldy.

---

## What this skill does NOT cover

- **DTO schemas themselves** (where they live in `@packages/core`, validation rules, error normalization) — data layer skill
- **The container/UI split mechanics** (when to extract a container, props organization) — components skill
- **Mutation and action contracts** (`useMutation` rules, action's `execute`/`status`/`error`, optimistic updates) — data layer and actions skills
- **`lib/` rules in detail** (no React, naming, promotion) — folder structure skill
- **`useEffect` rules** (the broader "what effects are for") — hooks-and-effects skill
- **Component architecture** (`_parts/` vs sub-features for field clusters) — components skill and component placement skill

When writing or reviewing form code, stay in this skill. When the question shifts to "what does this DTO look like" or "how does the action wrap the submission," that's a different layer's skill.
