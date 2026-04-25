# ADR 0001: Start with a modular monolith

## Status

Accepted

## Decision

We will start with a modular monolith backend using Fastify and TypeScript.

## Why

- The team needs to move from a design prototype to an operable product quickly.
- Domain boundaries are already clear enough to model as modules.
- We want one deployment unit while data, policies, and workflows are still changing rapidly.
- Tenant isolation and audit controls matter more right now than independent deployability.

## Consequences

- Module contracts must remain explicit so they can be split later if needed.
- Async events and projection jobs are still modeled now, even if they run in-process at first.
- Strong database boundaries and row-level security remain mandatory.
