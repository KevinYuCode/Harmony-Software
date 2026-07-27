---
name: backend-middleware
description: The five kinds of backend HTTP middleware — infrastructure, throttling, context provider, gatekeeper, validator — and the rules that keep them from getting tangled. Covers the critical split between context providers (`withAuth`, never rejects) and gatekeepers (`requireAuth`, rejects on failure); naming conventions (`with-X`, `require-X`, plain verbs); why business logic and entity-level authorization belong in use cases, not middleware; the middleware factory pattern for injecting services; throwing domain errors instead of framework exceptions and mapping them centrally; registration order (outside-in, cheapest first); and where middleware files live. Use this skill whenever writing or modifying middleware, deciding whether something should be middleware or a use case, splitting an existing "auth middleware" that does two jobs at once, naming a new middleware function, debating registration order, deciding whether a per-route check is really middleware or hidden business logic, or when the user asks "should this be middleware", "why is auth not working on public routes", "where do I put role checks", "should this throw a 401 or a domain error". Trigger this skill any time middleware is being written or reviewed — conflating the five kinds is the source of most middleware confusion, and entity-level authorization disguised as middleware is one of the most common backend mistakes.
---

# Backend Middleware

"Middleware" is a broad term. There are five distinct kinds, each with different concerns and rules. Conflating them is the source of most middleware confusion.

## The five kinds

| Kind | What it does | Examples | Where it runs |
|---|---|---|---|
| Infrastructure | Cross-cutting plumbing for every request | Request ID, logger, error handler, CORS | App-wide, outermost |
| Throttling | Protects from overload or abuse | Rate limit, request timeout | App-wide or per group |
| Context provider | Reads the request, attaches data to context. Never rejects. | Decode auth token, parse tenant, resolve locale | App-wide or per group |
| Gatekeeper | Decides whether the request may proceed | `requireAuth`, `requireRole` | Per group or per route |
| Validator | Parses and validates the request payload | Body, query, and param schema validation | Per route |

The split that matters most: **context providers vs. gatekeepers.**

## Context providers vs. gatekeepers

Most "auth middleware" implementations do two unrelated things — decode the token and reject if invalid. These are different responsibilities. Split them:

```ts
// context provider — never rejects
export const withAuth = middleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  c.set('auth', token ? await verifyToken(token) : null)
  await next()
})

// gatekeeper — rejects on failure
export const requireAuth = middleware(async (c, next) => {
  if (!c.get('auth')) throw new UnauthenticatedError()
  await next()
})

// gatekeeper with parameter
export const requireRole = (role: Role) => middleware(async (c, next) => {
  const auth = c.get('auth')
  if (!auth) throw new UnauthenticatedError()
  if (!auth.roles.includes(role)) throw new ForbiddenError()
  await next()
})
```

Three benefits:

1. **Public routes can still read auth context.** A homepage can show personalized content if the user happens to be logged in, without auth being required for the route to succeed.
2. **Gate logic is reusable.** Role checks, ownership checks, and feature-flag gates all read from the same context.
3. **Testing is cleaner.** Token decoding and rejection logic test independently.

## Naming

- `with-X` (or `attach-X`) for context providers.
- `require-X` for gatekeepers.
- Plain verbs (`logger`, `cors`) for infrastructure.

A route group reads as plain English:

```ts
app.use('/api/*', withAuth)
app.use('/api/admin/*', requireAuth, requireRole('admin'))
```

## No business logic in middleware

Middleware does coarse checks. Business rules belong in the application layer.

- Authentication and coarse role checks → middleware (`requireAuth`, `requireRole('admin')`).
- Authorization on entities → use case (`if (order.ownerId !== userId) throw new NotOrderOwnerError()`).

The line: **does the check depend on a specific entity?** If yes, it belongs with the entity, not in middleware. Use cases can throw domain errors with meaningful messages and are testable as pure logic.

## Middleware factories

Middleware that needs services should follow the same factory pattern as modules:

```ts
export function createWithAuth(deps: { sessions: SessionService }) {
  return middleware(async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    c.set('auth', token ? await deps.sessions.verify(token) : null)
    await next()
  })
}
```

Wired at the composition root (see the `backend-composition-root` skill):

```ts
const withAuth = createWithAuth({ sessions: sessionService })
app.use('/api/*', withAuth)
```

Same dependency-inversion principle as modules. Makes middleware testable without globals.

## Error handling

Middleware throws domain errors. The central error handler maps them to HTTP responses.

```ts
export class UnauthenticatedError extends Error {}
export class ForbiddenError extends Error {}
```

```ts
app.onError((err, c) => {
  if (err instanceof UnauthenticatedError) return c.json({ error: 'unauthenticated' }, 401)
  if (err instanceof ForbiddenError)       return c.json({ error: 'forbidden' }, 403)
  // ...
})
```

Don't throw HTTP-framework exceptions from middleware — that ties the middleware to the framework and makes it brittle.

## Registration order

Outside-in, cheapest first:

1. Error handler.
2. Request ID, logger, CORS.
3. Body size limits, timeouts.
4. Rate limit.
5. Context providers (`withAuth`, `withTenant`).
6. Routes (per-route gatekeepers and validators apply here).

Two rules of thumb:

- Outermost middleware should be cheapest and most foundational. Catch problems before doing more work.
- Context providers run before gatekeepers. Gates read what providers attach.

## Where middleware lives

Default: `src/http/middleware/`. Cross-cutting code, not feature code. See the `backend-project-structure` skill for the top-level folder layout.

Exception: middleware that's only used by one module's routes (e.g., `requireOrderOwnership`) can live inside that module. But this is rare — most apparent module-specific gates are entity-level authorization in disguise and belong inside the use case instead.
