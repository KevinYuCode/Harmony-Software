---
name: backend-composition-root
description: The composition root pattern for backend services — the single file where concrete adapters are instantiated and wired into modules through their factories. Covers why scattered wiring breaks dependency direction, what the composition root looks like, the rules it follows (only file that imports concrete adapters; order is infrastructure → adapters → modules → HTTP; returns the app, doesn't start the server), how the composition root reaches into a module to grab its concrete adapter (deep import vs dedicated wiring file with a lint rule), and why the factory's `Deps` must take interfaces, not concrete classes. Use this skill whenever writing or modifying the `main.ts` / composition root, wiring a new module into the app, deciding how to expose a module's concrete adapter, setting up a test composition root with fakes, debating whether to instantiate a service inside its module's `index.ts`, or when the user asks "where do I wire this", "how do I inject a fake repo for testing", "should this be a singleton", "why is my module importing pg", or anything about backend dependency injection / wiring. Trigger this skill any time composition or wiring code is being written or reviewed — getting this wrong leaks adapters into modules, makes tests fight the structure, makes serverless cold starts unpredictable, and breaks running multiple app instances in one process.
---

# Backend Composition Root

The composition root is the single place where concrete implementations are instantiated and wired into modules. Everywhere else programs to interfaces.

## Why a single wiring point matters

A common alternative is to instantiate dependencies inside each module's `index.ts` and export a fully-built service. It looks simpler but costs:

1. **The module imports its own concrete adapter.** The module says "I am a Postgres-backed module" rather than "I need a repository." Dependency direction is broken.
2. **Configuration scatters.** Each module reaches for env vars; there's no single answer to "what does this app need to run?"
3. **Imports have side effects.** Importing a module triggers DB connections at import time, before anything decides whether the connection should exist. This breaks tests, multi-environment runs, and serverless cold starts.
4. **Tests have to fight the structure.** Substituting a fake repo requires module-level mocking instead of just passing a different argument.
5. **Singletons leak across instances.** Running two app instances in one process (multi-tenant, integration tests) becomes impossible.

A composition root removes all of these.

## What it looks like

```ts
export function buildApp(env: Env) {
  // 1. Infrastructure
  const db = createDbPool(env.DATABASE_URL)
  const storage = buildStorage(env)
  const email = buildEmail(env)

  // 2. Concrete adapters (the only place these are instantiated)
  const userRepo = new PostgresUserRepository(db)
  const orderRepo = new PostgresOrderRepository(db)

  // 3. Modules — each takes interfaces, not concretions
  const users = createUsersModule({ userRepo, email })
  const orders = createOrdersModule({ orderRepo, userService: users.service })

  // 4. HTTP composition
  const app = new App()
  app.onError(errorHandler)
  app.use('/api/*', authMiddleware)
  app.route('/api/users', users.router)
  app.route('/api/orders', orders.router)

  return app
}
```

Three rules for this file:

1. It is the only file that imports concrete adapters.
2. The order is: infrastructure → adapters → modules → HTTP. If you find a circular need, fix the design — don't paper over it with events.
3. It returns the app; it does not start the server. Starting the server, picking the runtime, reading env — those happen in a separate `server.ts`.

## How the composition root reaches concrete adapters

Modules don't export their adapters as part of the public API — that's not for other modules. (See the `backend-module-structure` skill for what `index.ts` should and shouldn't expose.) The composition root is privileged. Two ways to express that:

**Deep import (simplest).** The module's `index.ts` exports only the public API. The composition root reaches deeper.

```ts
import { createOrdersModule } from './modules/orders'
import { PostgresOrderRepository } from './modules/orders/repository.postgres'
```

The deep import stands out visually — it's the wiring story. Convention is enforced by code review.

**Dedicated wiring entry.** A second public path used only by the composition root.

```
modules/orders/
  index.ts       for other modules
  wiring.ts      for the composition root
```

```ts
// modules/orders/wiring.ts
export { PostgresOrderRepository } from './repository.postgres'
export type { OrderRepository } from './repository'
```

Then a lint rule bans `*/modules/*/wiring` from anywhere except the composition root file. Mechanical, not convention-based.

Use the deep-import form by default. Reach for the wiring file when the codebase is big enough that the discipline needs help.

## The factory always takes the interface

The module factory's `Deps` type uses interfaces, not concrete classes:

```ts
type Deps = {
  orderRepo: OrderRepository      // interface
  userService: UserService        // interface (or type)
}
```

This is what makes tests trivial:

```ts
const orders = createOrdersModule({
  orderRepo: new InMemoryOrderRepository(),
  userService: fakeUserService,
})
```

The test composition root is just a different composition root. Same factory, different concrete adapters.
