---
name: backend-module-structure
description: Internal structure of a backend feature module — how to write the factory function, lay out the files inside (entity, service, repository, routes, schemas, module, index), decide what `index.ts` exposes vs hides, handle the repository interface/implementation split (`import type` vs file split), and recognize when the service has outgrown a single class and should be broken into use-case files. Use this skill whenever creating a new backend feature module, adding files inside an existing module, deciding what other modules can import from this one, designing a repository interface, choosing between `import type` and splitting the repository file, splitting a god-class service into use cases, or when the user asks "where does this go inside the module", "should I split this service", "what should index.ts export", "can I import the repo from another module". Trigger this skill any time backend module internals are being designed or reviewed — the choices here determine whether dependencies point inward, whether tests are trivial, and whether modules can be swapped without their consumers noticing.
---

# Backend Module Structure

A feature module is a self-contained unit that owns one piece of the domain. It exposes a small public API; everything else is internal.

## A module is a factory function

```ts
type Deps = {
  orderRepo: OrderRepository
  userService: UserService
}

export function createOrdersModule(deps: Deps) {
  const service = new OrderService(deps.orderRepo, deps.userService)
  const router = createOrderRoutes(service)
  return { service, router }
}

export type OrdersModule = ReturnType<typeof createOrdersModule>
```

The factory takes its dependencies as **interfaces**, never concrete classes. It returns a router (HTTP surface) and any service other modules legitimately need.

This pattern gives you dependency injection without a container. The module declares what it needs; the composition root provides it. See the `backend-composition-root` skill for the wiring side of this.

## Internal layout

```
modules/orders/
	entity.ts                  domain types and entity logic
	service.ts                 use cases and orchestration
	repository.ts              repository interface / implementation
	routes.ts                  HTTP route definitions
	schemas.ts                 validation schemas for I/O
	module.ts                  factory wiring it all
	index.ts                   public API barrel
```

Three properties to preserve:

1. **The repository interface lives near the domain, not the implementation.** The domain declares what it needs from persistence; infrastructure implements it. Dependencies point inward.
2. **The service is HTTP-agnostic.** It takes primitives or DTOs in and returns primitives or DTOs out. It never sees the request context. This is what lets the same service be called from a worker, a CLI, or a test.
3. **The HTTP layer is thin.** Route handlers validate input, call the service, map the result to a response. Nothing more. If a handler is more than a handful of lines, business logic has leaked into it.

## A note on the repository interface

When the interface and a concrete implementation share a file:

```ts
// repository.ts
import { Pool } from 'pg'

export interface OrderRepository { ... }
export class PostgresOrderRepository implements OrderRepository { ... }
```

A consumer that does `import { OrderRepository } from './repository'` pulls the entire database driver into the runtime, even though it only uses the interface. Two fixes:

- **`import type`** — `import type { OrderRepository } from './repository'`. TypeScript erases the import; zero runtime cost. Easy to enforce with a `consistent-type-imports` lint rule.
- **Split the file** — `repository.ts` for the interface, `repository.<adapter>.ts` for each implementation. Slightly more files; the boundary is physically enforced.

Either works. The split is cleaner for shared/library code; `import type` is fine for app code.

## Service as the public API, until it isn't

The default pattern: the service is what other modules consume, exposed through `index.ts`.

The failure mode: the service grows to a god class with too many methods and too many dependencies. Two signals:

- More than ~7 public methods on the service.
- More than ~5 constructor dependencies.

When that happens, split into use-case files:

```
modules/orders/
  use-cases/
    create-order.ts
    cancel-order.ts
    ship-order.ts
```

Each use-case file exports a function or small class with only the dependencies it actually needs. The module's `index.ts` re-exports the use cases other modules need.

## What index.ts should expose

- The factory function (`createOrdersModule`).
- The module type (so other modules can type their dependency on it).
- Domain types that legitimately cross module boundaries.
- Domain errors that other modules need to catch.

What it should not expose:

- Repository interfaces (internal port).
- Repository implementations.
- Internal helpers and types.

If another module needs data from this one, it goes through the service. It does not reach into the repository.

See the `backend-composition-root` skill for how the wiring file gets at concrete adapters despite this rule.
