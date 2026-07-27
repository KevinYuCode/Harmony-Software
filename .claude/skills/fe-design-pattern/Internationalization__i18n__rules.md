---
name: frontend-internationalization
description: Internationalization (i18n) rules for the OpenJustice React frontend — how translation files are organized (per-feature, mirroring folder structure), translation key naming conventions, the centralized i18n service wrapper (`@/lib/i18n`), where `t()` is called (UI primarily, sometimes container), interpolation and pluralization patterns, locale-aware number and date formatting via `Intl`, RTL considerations, and rules that prevent common i18n bugs (string concatenation, full-sentence keys, hard-coded English fallbacks). Use this skill whenever adding a translatable string, naming a translation key, formatting a number or date, or when the user asks "how should this be translated", "where do translation files go", "how do I handle the plural", or anything about i18n. Trigger this skill any time user-facing text or locale-aware formatting is added — i18n bugs are invisible in your development locale.
---

# Frontend Internationalization (i18n)

This skill covers how user-facing text and locale-aware formatting are handled. It's library-agnostic in principle — the rules apply whether the codebase uses `react-i18next`, `lingui`, `react-intl`, or another tool. Examples use `react-i18next`-style syntax for concreteness.

For the centralized service wrapper pattern, see the toasts and analytics skill (same shape applies). For where formatting helpers live in `lib/`, see the folder structure skill.

## Why this matters

i18n bugs have a unique property: they're almost invisible in the locale you develop in. A hard-coded "Welcome" only fails for non-English users. A concatenated `"Hello " + name + "!"` only breaks when translated to Japanese or Arabic, where word order is different. A pluralization that handles `0` and `1+` only fails in Russian, where there are three forms. By the time these bugs are reported, they're scattered across hundreds of strings.

The rules here optimize for:
- **Translation isn't optional or aspirational** — every user-facing string goes through the same path, from day one.
- **Translators can do their job** — keys are well-named, strings have enough context to translate, and the workflow doesn't require translators to read code.
- **Locale-aware formatting is consistent** — dates, numbers, plurals follow the same patterns everywhere.

---

## The library wrapper

Whatever i18n library the app uses, wrap it in `@/lib/i18n`. Same pattern as `@/lib/toast` and `@/lib/analytics`: one file imports the library, everything else uses the wrapper.

```typescript
// apps/frontend/src/lib/i18n.ts
import { useTranslation as useTranslationSdk, Trans as TransSdk } from "react-i18next";

export function useTranslation(namespace?: string) {
  return useTranslationSdk(namespace);
}

export const Trans = TransSdk;

// For places outside React (rare — utilities formatting raw values)
import i18n from "@/i18n.config"; // initialized once at app boot
export const t = i18n.t.bind(i18n);
```

The wrapper exists so:
- Swapping i18n libraries later is a one-file change
- Test mocking is one file
- Library-specific quirks (config differences, version migrations) are absorbed in one place

Most code uses `useTranslation()` inside React components. The non-React `t` is for `lib/` formatting helpers that need to translate without React context.

---

## Where translation files live

Translation files live **per feature**, mirroring the folder structure. Each feature owns its own translations, and the build assembles them into per-locale resource files at compile time.

```
apps/frontend/src/feature/cases/
├── i18n/
│   ├── en.json
│   ├── es.json
│   └── ja.json
├── cases.ui.tsx
└── ...
```

Or, equivalently, with the locales as a top-level dimension and feature folders inside:

```
apps/frontend/src/feature/cases/
├── i18n/
│   ├── cases.en.json
│   ├── cases.es.json
│   └── cases.ja.json
```

Either layout is fine. Pick one and stick to it. The build step (or i18n library's namespacing feature) assembles these into per-locale bundles.

### Why per-feature, not centralized

A centralized `src/i18n/en.json` containing every string in the app gets unwieldy fast (thousands of keys), conflicts often, and orphans strings when features are deleted. Per-feature mirrors how the rest of the codebase organizes — feature locality.

The trade-off is that translators receive multiple files instead of one. This is fine in practice: most translation tools (Crowdin, Lokalise, etc.) handle multiple namespaces natively, and the per-feature layout makes "what file does this string live in" trivial to answer.

### Cross-feature shared translations

Strings used across multiple features go in a root-level `src/i18n/<locale>.json` namespace (often called `common` in i18n libraries):

- "Save," "Cancel," "Delete," "Edit" — generic UI verbs
- Error message templates that aren't feature-specific
- Date/time labels ("today," "yesterday")

Don't put feature-specific strings in `common`. The same promotion rules as everywhere else: start in the feature, promote to `common` when 2+ features need it.

---

## Key naming conventions

Keys are **hierarchical, dot-separated, lowercase, snake_case for multi-word segments**. The hierarchy mirrors the feature/component structure:

```json
{
  "list": {
    "empty_state": {
      "title": "No cases yet",
      "description": "Create your first case to get started",
      "action": "Create case"
    },
    "filters": {
      "search_placeholder": "Search cases…"
    }
  },
  "detail": {
    "delete_confirm": {
      "title": "Delete this case?",
      "description": "This can't be undone.",
      "confirm": "Delete",
      "cancel": "Keep case"
    }
  },
  "errors": {
    "load_failed": "Failed to load cases"
  }
}
```

```typescript
// Usage
const { t } = useTranslation("cases");
return <h1>{t("list.empty_state.title")}</h1>;
```

### Rules

- **Semantic keys, not English content as the key.** `t("list.empty_state.title")`, not `t("No cases yet")`. The English content goes in the English translation file. Using English text as the key makes it impossible to update the English copy without changing every call site.
- **Mirror the feature structure where it makes sense.** `cases.list.*` for the case list, `cases.detail.*` for the detail view. Keys aren't required to mirror folders perfectly, but related strings cluster.
- **Action-naming for buttons follows verbs.** `cases.actions.delete`, not `cases.buttons.delete_button` — the action verb is what the translator sees and translates.
- **Group by where the string appears, not by the kind of string.** A "title" inside an empty state is `list.empty_state.title`, not `titles.cases.list_empty`. Group by location for context.

### Typed keys (recommended)

Modern i18n libraries can generate TypeScript types from the JSON files (`i18next-resources-for-ts`, Lingui's compile step, etc.). Set this up. Once typed, `t("list.empty_state.titel")` (typo) is a compile error rather than a runtime fallback to the key string.

Without typing, every typo silently displays the raw key (`list.empty_state.titel`) in production, and you find out when a user reports it.

---

## Where translation calls happen

**The UI is where `t()` is primarily called.** Translation lives at the rendering boundary because that's where strings become user-visible.

```typescript
// In the UI
export function CaseListEmptyState({ handlers }: Props) {
  const { t } = useTranslation("cases");
  return (
    <div>
      <h2>{t("list.empty_state.title")}</h2>
      <p>{t("list.empty_state.description")}</p>
      <button onClick={handlers.onCreate}>
        {t("list.empty_state.action")}
      </button>
    </div>
  );
}
```

The container can also call `t()` when it produces a derived string the UI just renders:

```typescript
// In the container — derived display string
export function useCaseRowContainer(c: Case) {
  const { t } = useTranslation("cases");
  const statusLabel = t(`status.${c.status}`);
  return {
    state: { case: c, statusLabel },
    // ...
  };
}
```

This is fine when:
- The display string is computed from data (statuses, types, categories)
- The UI just renders the resulting string

If the container is calling `t()` extensively, that's a smell — translation usually belongs in the UI. The container exception is for *derived* strings, not for the bulk of the rendered text.

### Translation calls don't belong in:

- **Actions, mutations, queries** — these don't render. They produce data and errors.
- **API functions** — these return data. Translating server errors is a UI concern.
- **`lib/` files that don't have access to the locale** — pure helpers stay locale-agnostic; the caller translates the result.

---

## Interpolation — never concatenate

The single biggest i18n mistake is concatenation:

```typescript
// ❌ Breaks in any language with different word order
return <p>{"Welcome, " + t("user.greeting") + "! You have " + count + " new cases."}</p>;
```

Use the library's interpolation:

```typescript
// ✅ The translator owns word order
return <p>{t("welcome.greeting", { count })}</p>;
```

```json
{
  "welcome": {
    "greeting_one": "Welcome! You have one new case.",
    "greeting_other": "Welcome! You have {{count}} new cases.",
    "greeting": "Welcome! You have {{count}} new cases."
  }
}
```

The translator can reorder, modify, or restructure the entire sentence. Concatenated English fragments give them no way to do that.

### Embedded React components — `<Trans>`

When a translation needs to wrap part of itself in JSX (a `<Link>`, a `<strong>`), use the library's `<Trans>` component:

```typescript
<Trans
  i18nKey="onboarding.welcome_with_link"
  components={{ helpLink: <Link to={routes.help()} /> }}
/>
```

```json
{
  "onboarding": {
    "welcome_with_link": "Welcome! See the <helpLink>help docs</helpLink> to learn more."
  }
}
```

The translator can move the `<helpLink>` block within the sentence to whatever position works grammatically. Don't try to do this with concatenation or string splitting.

---

## Pluralization

Plural rules vary wildly by language. English has 2 forms (one, other). Russian has 4 (one, few, many, other). Arabic has 6. Use the library's pluralization, not manual `if (count === 1)` branches.

```typescript
// ✅ Library handles pluralization rules per locale
return <p>{t("cases.count", { count: cases.length })}</p>;
```

```json
{
  "cases": {
    "count_zero": "No cases",
    "count_one": "{{count}} case",
    "count_other": "{{count}} cases"
  }
}
```

The library picks the right variant based on the active locale's CLDR rules. Russian translation provides `count_one`, `count_few`, `count_many`, `count_other`; the library does the right thing automatically.

The same principle applies for ordinals (`1st`, `2nd`, `3rd`) and other plural-like rules — use the library's helpers, not English-specific logic.

---

## Number, date, and currency formatting

Use the browser's `Intl` API (or the i18n library's wrappers around it) for number, date, and currency formatting. Hard-coded formats break for users in other locales.

### Numbers

```typescript
// ✅ Locale-aware
const formatted = new Intl.NumberFormat(locale).format(value);

// In a lib helper
// apps/frontend/src/lib/format-number.ts
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
```

A US user sees `1,234.56`; a German user sees `1.234,56`; a French user sees `1 234,56`. Hard-coded `value.toFixed(2)` only works for one of them.

### Dates

```typescript
const formatted = new Intl.DateTimeFormat(locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(date);
```

For relative dates ("3 hours ago," "yesterday"), use `Intl.RelativeTimeFormat` or the library's wrappers. Don't hand-roll relative time strings — they're full of pluralization edge cases.

### Currencies

```typescript
const formatted = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD", // or whatever the user's currency is
}).format(amount);
```

The currency code is data, the locale controls formatting. A USD amount displays as `$1,234.56` for US users and `1.234,56 $` for German users. This separation matters: the *currency* is what the price is denominated in (a business fact); the *formatting* is how it's displayed (a locale concern).

### Where formatters live

Generic formatters (`formatNumber`, `formatDate`, `formatCurrency`) live in `src/lib/`:

```
src/lib/
├── format-number.ts
├── format-date.ts
└── format-currency.ts
```

Feature-specific formatters that combine generic formatting with domain logic (`formatCaseAge` → "Created 3 days ago") live in the feature's `lib/`.

The locale comes from the i18n library's current locale. Most apps expose this as a hook:

```typescript
const { i18n } = useTranslation();
const formatted = formatDate(date, i18n.language);
```

Or, cleaner, wrap the locale-aware formatters as hooks themselves:

```typescript
// src/lib/format-date.ts
export function useFormatDate() {
  const { i18n } = useTranslation();
  return (date: Date) => formatDate(date, i18n.language);
}
```

---

## RTL — right-to-left layouts

For locales that read right-to-left (Arabic, Hebrew, Persian), the entire UI direction flips. The mechanics:

- The HTML `dir` attribute switches: `<html dir="rtl">` for RTL locales, `dir="ltr"` otherwise. The i18n library typically manages this on locale change.
- CSS uses **logical properties** (`margin-inline-start`, `padding-inline-end`) instead of physical ones (`margin-left`, `padding-right`). Logical properties flip automatically with the document direction.
- Icons that imply direction (back arrows, "next" indicators) need separate logic — the icon itself flips, but the meaning doesn't.

This isn't an architectural concern so much as a CSS hygiene one. The frontend skill doesn't dictate every CSS rule, but two principles apply:
- **Use logical properties for spacing and alignment.** It's a free RTL win and costs nothing for LTR.
- **Don't hard-code text alignment to `left` or `right`.** Use `start`/`end` instead.

The actual RTL switch — when it happens, how the user changes locale — is a routing/settings concern, not a per-component concern.

---

## Translator workflow

The setup needs to support translators (who are usually not engineers):

1. **Translation files are JSON.** Engineers can read them; translators using TMS tools (Lokalise, Crowdin, Phrase) can import/export them directly.
2. **Each key has enough context.** A translator looking at `list.empty_state.title` should be able to tell *what* it is from the key path alone. If the key is ambiguous, add a context comment to the i18n tooling.
3. **No translator ever needs to read TypeScript.** All translatable strings live in JSON; nothing translatable is in code.
4. **The English (or default) file is the source.** New strings start in English; translators fill in other locales. Missing translations fall back to English at runtime.
5. **Pseudo-localization in development.** Many libraries support a "pseudo" locale that wraps every English string in special characters (`[--Welcome to the app--!]`). Running in this locale during dev catches hard-coded strings — anything that *isn't* wrapped is hard-coded.

### Adding a new string

1. Add the key to the relevant feature's `i18n/en.json` (and other locales if you can; otherwise leave them missing — they fall back to English)
2. Use the key in the UI via `t("path.to.key")`
3. Run the build to regenerate types
4. Submit translations to the TMS for non-English locales as part of the normal release process

Don't ship a feature with hard-coded strings "to be translated later." Hard-coded strings rarely get translated; they get found in production by international users. Every string goes through the i18n path from day one.

---

## Anti-patterns

### Hard-coded user-facing strings

```typescript
// ❌
return <h1>Cases</h1>;
```

Every user-facing string is translatable. Even if your app is English-only today, hard-coded strings are technical debt the moment a second locale is needed.

For development-only or developer-only strings (debug tooling, internal admin pages with no plans to localize), the rule is softer — but that exemption shouldn't leak into user-facing features.

### Full-sentence keys

```typescript
// ❌ The English text IS the key
return <p>{t("Welcome to the app! You have {{count}} new cases.")}</p>;
```

Updating English copy now requires changing every call site. The whole point of keys is decoupling the structure from the content. Use semantic keys (`welcome.greeting`).

### Concatenating translated strings

```typescript
// ❌
return <p>{t("welcome")} {userName}, {t("you_have")} {count} {t("cases")}</p>;
```

The translator owns the *whole sentence*. They might rearrange the user name, the count, the words around them. Concatenation prevents that. Use one key with interpolation.

### Manual pluralization

```typescript
// ❌ English-only logic — breaks in Russian
const label = count === 1 ? t("case_singular") : t("cases_plural");
```

Use the library's pluralization. Different languages have different plural rule counts.

### `t()` outside React without setup

```typescript
// ❌ Tries to translate but the i18n library isn't initialized in this scope
const message = t("errors.something");
throw new Error(message);
```

Translating in `lib/` or at module load before i18n initializes returns the raw key. Either translate at the call site (in the UI) or use the bound `t` from `@/lib/i18n` that's wired to the initialized instance.

### Putting business logic in translation files

```json
{
  "case": {
    "priority_threshold_high": "5"
  }
}
```

Translation files are for translatable strings. Numbers, configuration values, business rules don't go in there.

### Translation calls inside actions or queries

```typescript
// ❌ Action knows about UI strings
const submitCase = async (data) => {
  toast.success(t("cases.submitted_success")); // wrong layer
};
```

Actions don't translate. They produce results; the container (or whoever else consumes the result) translates. Pass an error code or status; let the UI render the string.

### Mixing locale-aware and locale-naive formatting

```typescript
// ❌ Locale-aware date, locale-naive number
return <span>{intlDate.format(d)} — ${total.toFixed(2)}</span>;
```

If you're being locale-aware in one place, be locale-aware everywhere. Mixed formatting is jarring (a German date next to a US-formatted number).

### Hard-coded `dir="ltr"` or physical CSS properties

```css
/* ❌ Doesn't flip in RTL */
.card {
  margin-left: 8px;
  padding-right: 16px;
  text-align: left;
}

/* ✅ Logical properties */
.card {
  margin-inline-start: 8px;
  padding-inline-end: 16px;
  text-align: start;
}
```

Logical properties cost nothing in LTR and give RTL support automatically.

---

## What this skill does NOT cover

- **Specific i18n library configuration** (which library, namespace setup, lazy-loading translation files) — provider-specific
- **The translator/TMS workflow** beyond the high-level guidance — TMS-specific
- **Where the user's locale comes from** (URL, user preferences, browser default) — routing/settings concern
- **Server-side localization** — backend concern
- **Pseudo-localization tooling** specifics — library-specific

When adding a translatable string or formatting a value, stay in this skill. When the question shifts to "how is the locale chosen" or "how does the build assemble translation files," that's project setup, outside this skill set.
