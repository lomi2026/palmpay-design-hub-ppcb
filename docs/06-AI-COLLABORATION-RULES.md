# PalmPay体验设计Hub — AI Collaboration Rules

## 1. Purpose

This project uses GPT, Codex and Claude together.

The goal is not to let three models independently design and rewrite the same system.

The goal is:

> One product baseline, one repository, one documentation set, clear responsibilities and verifiable handoff.

## 2. Source of truth

The code repository and approved project docs are the working source of truth.

Chat history is not the implementation specification.

Historical conversations may contain:

- obsolete ideas
- temporary decisions
- old wording
- abandoned visual directions
- older versions
- incomplete technical assumptions

Final decisions must be written into project docs.

## 3. Responsibility split

### GPT

Primary responsibility:

- Product definition
- Experience strategy
- Information architecture
- PRD
- Workflow design
- Design decisions
- Milestone planning
- Product and UX review

GPT may:

- Update product requirements
- Update design decisions
- Identify experience risks
- Review screenshots
- Review flows
- Review implementation results
- Define acceptance criteria

GPT should not be treated as the production code repository.

### Claude

Primary responsibility:

- Implementation

Claude may:

- Implement approved tasks
- Create files
- Modify code
- Add tests
- Fix implementation bugs
- Build standard frontend and backend features

Claude may not independently:

- Change product scope
- Replace information architecture
- Change database entities
- Change core status model
- Change role model
- Rename core modules
- Change approved visual direction
- Rewrite stable architecture because of personal preference

### Codex

Primary responsibility:

- Architecture and code review
- Complex implementation
- Verification
- Defect diagnosis

Codex may:

- Inspect the whole repository
- Review implementation
- Run tests
- Review architecture
- Review security
- Review database migration
- Identify bugs
- Fix confirmed defects
- Implement complex engineering work

Codex may not:

- Rewrite working modules only because another approach is preferred
- Replace approved architecture without documenting the reason
- Reimplement Claude code only to align with Codex style
- Ignore current project phase
- Silently change product requirements

## 4. Conflict rules

When implementation conflicts with approved documentation:

> Fix implementation.

When code style differs but functionality and architecture are correct:

> Do not rewrite solely for preference.

When PRD conflicts with ER model:

> Stop architecture-wide changes and report the conflict.

When Design Decisions conflict with a historical screenshot or chat:

> Design Decisions wins unless the user explicitly changes the decision.

When the latest explicit user instruction conflicts with docs:

> Follow the latest instruction and update the relevant docs.

## 5. Work phase rules

Before every task:

1. Read `docs/05-CURRENT-STATUS.md`.
2. Confirm current phase.
3. Confirm the task belongs to the phase.
4. Read task-relevant product, ER and design docs.
5. Inspect existing implementation.

Do not implement Phase 5 features during Phase 1 unless explicitly requested.

Do not use future scope to justify premature architecture complexity.

## 6. Handoff rules

### Claude to Codex

Claude should leave:

- committed or clearly isolated changes
- tests
- changed-file list
- verification results
- known risks
- updated current status when milestone changed

Codex reviews the actual repository and diff.

Do not paste a long narrative as a substitute for readable code and tests.

### Codex to Claude

Codex should provide:

- confirmed defect
- affected file or module
- why it is a defect
- expected behavior
- relevant test or acceptance condition

Codex should not ask Claude to rewrite an entire module when a scoped defect can be fixed.

### GPT to coding agents

GPT decisions should be written into docs.

Examples:

- product scope → PRD
- database change → ER doc
- visual decision → Design Decisions
- phase change → Current Status
- collaboration rule → AI Collaboration Rules

## 7. Git rules

Recommended:

- One repository
- One stable main branch
- Feature branches or isolated work branches
- Small intentional commits
- Commit at stable checkpoints
- Do not mix unrelated modules in one commit
- Do not commit secrets
- Do not commit generated build output unless the repository explicitly requires it

Suggested commit examples:

```text
chore: initialize V1 engineering workspace
feat(auth): add current user and RBAC guard
feat(content): add unified content model
feat(review): add review request workflow
fix(skill): enforce human review rules before publish
test(auth): add admin endpoint permission coverage
docs: update current phase status
```

## 8. Review rules

A code review should focus on:

- requirement match
- state consistency
- permission correctness
- data integrity
- error handling
- test coverage
- migration safety
- maintainability
- visual baseline compliance when applicable

Do not make broad style comments the main review outcome.

Classify findings:

### Blocker

- cannot build
- cannot run
- data loss
- permission bypass
- severe security risk

### High

- core workflow broken
- review state inconsistent
- published data overwritten
- unauthorized user can access restricted content

### Medium

- incomplete error state
- invalid edge case
- incorrect event
- significant UI inconsistency

### Low

- minor naming
- local cleanup
- small non-blocking visual issue

Fix Blocker and High first.

## 9. Verification rules

After relevant changes:

- type check
- lint
- unit tests
- integration tests
- E2E tests
- production build
- permission checks
- database migration checks
- diff review

Do not report “done” with failing relevant checks unless the failure is explicitly documented as an external blocker.

## 10. Documentation rules

Do not create new competing architecture documents without need.

Update the existing file that owns the decision.

Document ownership:

- Product → `01-V1.0-PRD.md`
- Database → `02-DATABASE-ER.md`
- Development sequence → `03-DEVELOPMENT-PLAN.md`
- Visual / wording → `04-DESIGN-DECISIONS.md`
- Current phase → `05-CURRENT-STATUS.md`
- AI collaboration → `06-AI-COLLABORATION-RULES.md`

## 11. User workflow preference

For PalmPay code collaboration:

- Do not embed large code previews in chat.
- Do not auto-load large HTML previews in chat.
- Prefer plain-text completion reports.
- Only create deployment packages when explicitly requested.
- Use the latest clean code baseline as the only baseline.
- Do not mix old versions into new modifications.

## 12. Final principle

The project should not depend on one model remembering a long conversation.

The repository must contain enough context that:

- Codex can open the project and understand the current phase.
- Claude can continue implementation after Codex.
- GPT can update final product decisions through docs.
- A future engineer can understand why the system is structured this way.

The goal is shared engineering context, not shared chat memory.
