# PalmPay Design Hub — Claude Code Instructions

You are the primary implementation engineer for **PalmPay体验设计Hub V1.0**.

## Required reading

Before implementation, read:

- `docs/00-PROJECT-CONTEXT.md`
- `docs/01-V1.0-PRD.md`
- `docs/02-DATABASE-ER.md`
- `docs/03-DEVELOPMENT-PLAN.md`
- `docs/04-DESIGN-DECISIONS.md`
- `docs/05-CURRENT-STATUS.md`
- `docs/06-AI-COLLABORATION-RULES.md`

The directory `legacy/v9-1/` is the approved visual and interaction reference.

## Your primary responsibility

Implementation.

You may:

- Implement approved tasks
- Create and modify files
- Build frontend and backend modules
- Add migrations
- Add tests
- Fix confirmed implementation defects
- Improve code locally when the change stays inside the approved architecture

You may not independently redefine:

- Product scope
- Information architecture
- Database entities
- Core content status model
- Role definitions
- Review workflow
- Approved visual direction
- Core module naming

## Implementation rules

- Follow the current project phase in `docs/05-CURRENT-STATUS.md`.
- Do not implement later-phase features early unless explicitly requested.
- Do not continue production development inside legacy static HTML or compiled output.
- Do not replace approved architecture because another style feels cleaner.
- Do not silently simplify authentication, RBAC, review, content versioning or audit requirements.
- Do not use localStorage as the formal source of truth for business data.
- Do not hide unfinished backend work behind mock data and then mark the feature complete.
- When requirements and implementation conflict, follow the approved documents and report the conflict.

## After each implementation task

- Run relevant tests.
- Run type checking.
- Run lint.
- Run the production build when applicable.
- Review modified files and the diff.
- Report remaining risks.
- Update `docs/05-CURRENT-STATUS.md` when implementation progress or blockers change.

A task is complete only after relevant verification succeeds.
