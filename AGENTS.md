# PalmPay Design Hub — Codex Instructions

## Project identity

This repository contains **PalmPay体验设计Hub / PalmPay Design Intelligence Hub V1.0**.

The approved legacy baseline is the deployed final v9-1 website: `https://lomi2026.github.io/palmpay-design-intelligence/`.

The deployed v9-1 code is the only approved visual, information-architecture and interaction reference. `legacy/v9-1/` is a local archival snapshot; if it differs from or omits a deployed v9-1 page, the deployed website and its matching historical source take precedence.
The v9-1 code is **not** the target production architecture.

The V1.0 application must be implemented in the formal frontend and backend projects.

## Required reading

Before starting any task, read:

1. `docs/00-PROJECT-CONTEXT.md`
2. `docs/05-CURRENT-STATUS.md`
3. `docs/06-AI-COLLABORATION-RULES.md`

For PPCB development, release, migration, authentication or managed-file work, also read:

- `docs/15-PPCB-PROJECT-CONTEXT.md`

For product or workflow changes, also read:

- `docs/01-V1.0-PRD.md`

For database, backend model, state model or API changes, also read:

- `docs/02-DATABASE-ER.md`

For implementation planning and task order, also read:

- `docs/03-DEVELOPMENT-PLAN.md`

For UI, wording, density, branding or visual changes, also read:

- `docs/04-DESIGN-DECISIONS.md`

## Core rules

- In the PPCB project workspace, `/Users/a1/Documents/PalmPay-Design-Hub-PPCB` is the authoritative local code directory and `codex/ppcb-deployment` is the working branch.
- Treat `/Users/a1/Documents/plampay-design-intelligence` and the GitHub Pages v9-1 site as historical/original-hosting references. Do not publish from them to PPCB or copy changes from them without an explicit reconciliation step.
- Keep database backups, exported attachments, runtime secrets and signed URLs outside Git. Record only their local protected paths and verification metadata.

- Treat the deployed final v9-1 website code as the only approved legacy product baseline.
- Do not mix older v5, v6, v8, v9 or temporary variants into implementation decisions.
- Do not continue adding production features to the legacy static HTML, compiled scripts or localStorage architecture.
- Do not change product scope, information architecture, database entities, core status models, role definitions or approved design decisions without explicitly reporting the conflict first.
- Do not rewrite working modules solely because another coding style is preferred.
- Do not silently simplify authentication, RBAC, versioning, review or audit requirements.
- Do not use localStorage as the source of truth for formal user, role, content, review or usage data.
- Do not generate fake product completion by adding large volumes of temporary mock data.

## Before modifying code

1. Inspect the current implementation.
2. Read `docs/05-CURRENT-STATUS.md`.
3. Confirm the requested work belongs to the current phase.
4. Identify affected modules, data entities and permissions.
5. Check whether the requested change conflicts with PRD, ER model or design decisions.
6. Prefer the smallest architecture-consistent implementation.

## Verification after changes

Run the applicable checks:

- Type checking
- Lint
- Relevant unit tests
- Relevant integration tests
- Relevant E2E tests
- Production build
- Database migration validation
- Permission / unauthorized-access checks
- Diff review

Do not mark a task complete only because code was generated.

A task is complete only when relevant verification succeeds.

## Project status

When a milestone, phase, major blocker or next step changes, update:

`docs/05-CURRENT-STATUS.md`

Keep the status factual and concise.

## Conflict precedence

When sources conflict, use this precedence:

1. Explicit latest user decision
2. `docs/04-DESIGN-DECISIONS.md` for approved visual and wording decisions
3. `docs/01-V1.0-PRD.md` for product scope and workflows
4. `docs/02-DATABASE-ER.md` for data entities and state model
5. `docs/03-DEVELOPMENT-PLAN.md` for implementation order
6. Existing approved architecture
7. Implementation preference

If documentation conflicts internally, report the conflict before architecture-wide changes.
