---
description: Backend conventions and design rules
globs:
  - packages/backend/src/**
alwaysApply: true
---

# Backend Rules

## Architecture & Philosophy Docs

Detailed design guidance lives in `packages/backend/docs/`. Read these before making architectural decisions:

- **`-architecture.md`** — Entity design, module structure, DI, error handling, naming conventions, repository/strategy/registry patterns, prompt system, cross-module dependencies.
- **`-philosophy.md`** — Boundaries, complexity, change, comprehension trade-offs.

## Feature Design Docs

Feature-specific design decisions live in `packages/backend/docs/-features/`. Consult before modifying these areas:

- **Data handling** (`data handling/`) — File enrichment pipeline, vectorization strategy, dispute/rules extraction, document architecture.
- **Dialog flow** (`dialog-flow/`) — Dialog flow execution, node types (fact, reasoning, switch), reasoning node philosophy.
- **Agentic features** (`agentic-features/`) — File processing pipeline, reranker, web search.

## Critical Rules (Quick Reference)

### Module placement

Modules go directly in `src/`, never in `src/modules/`. Use dash-prefix for new/refactored modules (`src/-module-name/`).

### Flat structure

Don't create folders for single files. Use `controller/`, `service/`, etc. folders only when there are multiple files of that type.

### One service, one module

Each module exposes one service as its public API. Repositories, internal providers, and utils are never exported.

### REST routes

Use resource nouns + HTTP verbs. No action verbs in paths (`POST /conversations`, not `POST /conversations/create`). Prefer `PATCH` over `PUT`.

### Error handling

- **Tier 1** (NestJS exceptions): At service boundary for HTTP-facing errors.
- **Tier 2** (plain `Error`): Internal domain logic, precondition violations.
- **Tier 3** (error-as-return-value): Expected failure paths (e.g. node execution).

### Repository pattern

Repositories return `null` for "not found" cases — never throw. Services handle null checks and throw appropriate NestJS exceptions.

### Zod validation

Always use `.safeParse()`, never `.parse()`. Check `parseRes.success` before accessing `.data`.

### DI conventions

- Inject concrete class as token, type as interface: `@Inject(Service) private readonly service: IService`.
- Symbol tokens only for external package clients (`@Inject(AI_CLIENT)`).

### Naming

| Concept | Convention | Example |
| --- | --- | --- |
| Module folder | `-kebab-case/` | `-file-enrichment/` |
| Service | `PascalCase + Service` | `FileEnrichmentService` |
| Interface | `I + PascalCase` | `IFileEnrichmentService` |
| Repository | `PascalCase + Repository` | `DialogFlowRepository` |
| Files | `lowercase-hyphenated` | `file-enrichment.service.ts` |
| Prompt templates | `UPPER_SNAKE_CASE` | `DISPUTE_EXTRACTION_SYSTEM` |
| Injection symbols | `UPPER_SNAKE_CASE` | `AI_CLIENT` |

### Cross-module dependencies

- Unidirectional only — no circular imports.
- Import services, never repositories from other modules.
- Utils are pure, stateless, no external dependencies, never exported.
