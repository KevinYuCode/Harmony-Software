---
name: backend-project-structure
description: Top-level layout for a backend service — the `src/` folder split into `modules/`, `infrastructure/`, `http/`, `lib/`, plus `main.ts`, `server.ts`, `env.ts`. Covers what each folder is for, the three constraints `lib/` must satisfy (pure, framework-agnostic, domain-agnostic), and a decision tree for placing any new file. Use this skill whenever creating a new file at the top level of `src/`, scaffolding a new backend service, deciding whether something belongs in `modules/`, `infrastructure/`, `http/`, or `lib/`, debating whether a utility is "pure enough" for `lib/`, splitting a file that does two things, designing a new external-system wrapper, or when the user asks "where does this go", "is this infrastructure or lib", "should this be its own module", "can I import this from anywhere". Trigger this skill any time backend file placement is being decided — wrong placement causes circular dependencies, junk-drawer `lib/` folders, and modules that secretly own infrastructure concerns.
---

# Backend Project Structure

Top-level layout for a backend service.

```
src/
  main.ts                  composition root
  server.ts                runtime entry — starts the server
  env.ts                   env variable schema and validated config

  modules/                 feature modules
    orders/
    users/

  infrastructure/          thin wiring around external systems
    db.ts                  creates the database pool
    storage.ts             builds the storage provider
    email.ts               builds the email provider

  http/                    HTTP-layer cross-cutting concerns
    auth.ts                auth middleware
    errors.ts              error mapper
    logger.ts              request logger

  lib/                     pure, framework-agnostic utilities
    result.ts
    retry.ts
    date.ts
```

Each top-level folder answers a different question.

## modules/

Feature code. Has business logic, owns its domain, exposes HTTP routes. The bulk of the codebase lives here.

See the `backend-module-structure` skill for what's inside a module.

## infrastructure/

Thin wiring around external systems and SDKs. Each file exports a builder that the composition root calls.

```ts
// infrastructure/storage.ts
export function buildStorage(env: Env): StorageProvider {
  return env.STORAGE_DRIVER === 's3'
    ? createS3StorageProvider({ bucket: env.S3_BUCKET })
    : createFilesystemStorageProvider({ root: env.STORAGE_PATH })
}
```

The composition root calls `buildStorage(env)` and passes the result into modules. Env-to-adapter mapping lives here, not in `main.ts`, which keeps `main.ts` readable. See the `backend-composition-root` skill for how the wiring file uses these builders.

## http/

Cross-cutting HTTP concerns: middleware, error handlers, request loggers. Anything tied to the HTTP framework but not specific to one feature.

See the `backend-middleware` skill for the middleware taxonomy.

## lib/

Pure, framework-agnostic, domain-agnostic utilities. The bottom of the dependency graph — anything in `lib/` can be imported by anything else.

Three constraints, all required:

1. **Pure** — no IO, no global state, no side effects.
2. **Framework-agnostic** — doesn't import the HTTP framework, the ORM, or any SDK.
3. **Domain-agnostic** — doesn't reference business concepts. A `lib/` function should be portable to a different project.

Examples that fit: a `Result<T, E>` type, a retry helper, date arithmetic, exhaustiveness assertions.

Examples that don't: a database wrapper (that's `infrastructure/`), an auth middleware (that's `http/`), a pricing function (that's a module's domain).

`lib/` is append-only by reflex, deletable by review. Junk drawers happen when this isn't enforced.

## Decision tree

When a new file appears, ask in order:

1. Does it have HTTP routes or business rules? → `modules/<feature>/`
2. Does it talk to an external system or wrap an SDK? → `infrastructure/`
3. Is it HTTP middleware or HTTP-layer plumbing? → `http/`
4. Is it pure, framework-agnostic, and domain-agnostic? → `lib/`
5. Does it define configuration? → `env.ts`

If a file feels like it could go in two folders, it's probably doing two things and should be split.
