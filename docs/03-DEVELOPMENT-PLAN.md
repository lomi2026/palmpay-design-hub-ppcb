# PalmPay体验设计Hub V1.0 — Development Plan

## 1. 重构原则

- 最终 v9-1 是唯一批准的 legacy 产品基线。
- v9-1 用于视觉、布局、信息架构和已验证交互参考。
- 不继续在静态 HTML、编译后脚本和 localStorage 上增加正式业务功能。
- 建立新的正式前后端工程。
- 先建立数据和权限底座，再迁移业务页面。
- 先跑通一条完整业务闭环，再复制到其他内容类型。
- AI 在线执行不进入阶段一。
- 不通过大量假数据掩盖后端尚未完成。

## 2. 推荐工程结构

```text
palmpay-design-hub/
├── AGENTS.md
├── CLAUDE.md
├── docs/
├── legacy/
│   └── v9-1/
├── apps/
│   ├── web/
│   └── api/
└── packages/
    ├── ui/
    ├── schemas/
    ├── types/
    └── config/
```

## 3. 推荐技术栈

### Web

- React
- TypeScript
- Next.js App Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Zustand
- Vitest
- Playwright

### API

- Node.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ or equivalent
- Object Storage
- OpenAPI
- OIDC / Enterprise SSO

## 4. 核心闭环优先级

```text
登录
→ 搜索 / 查看设计资产
→ 创建资产草稿
→ 提交审核
→ 审核退回或通过
→ 正式发布
→ 搜索到已发布内容
→ 确认用于真实项目
→ 数据洞察产生真实记录
```

在该闭环稳定前，不批量迁移全部高级模块。

## 5. Phase 0 — Scope and technical freeze

### Product

- Freeze P0 / P1 / P2
- Freeze role matrix
- Freeze state model
- Complete page-state checklist
- Complete validation checklist

### Technical

- Architecture review
- API convention
- Repository strategy
- Environment strategy
- Database review
- Authentication decision
- File storage decision
- AI security boundary decision

Deliverables:

- Frozen PRD
- ER model
- Development plan
- Design decisions
- Initial task breakdown

## 6. Phase 1 — Engineering and identity foundation

### Frontend

#### FE-001 Formal web project

- Next.js
- TypeScript strict mode
- ESLint
- Prettier
- Environment variables
- Route skeleton
- Error boundary
- Request layer

#### FE-002 Design tokens

- background
- surface
- text
- border
- status
- typography
- spacing
- radius
- shadow
- dark / light theme

#### FE-003 Base components

- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Tabs
- Badge
- Table
- Pagination
- Dialog
- Drawer
- Dropdown
- Tooltip
- Toast
- Skeleton
- Empty
- Error State
- File Upload

#### FE-004 Layout

- Public home layout
- Workspace layout
- Sidebar
- Header
- Breadcrumb
- Mobile navigation
- Theme switch

#### FE-005 Authentication and permission UI

- Login
- Callback
- Current user loading
- Protected routes
- Unauthorized page
- Session expiry
- Logout

### Backend

#### BE-001 API project

- NestJS
- Configuration
- Logging
- Error handling
- Database connection
- Health check
- OpenAPI
- Test framework

#### BE-002 Database initialization

- Prisma schema
- Initial migration
- Default organization
- System roles
- System permissions
- Default categories

#### BE-003 Authentication

- OIDC / SSO
- User creation
- Session or token
- Current user
- Logout
- Disabled user validation

Initial endpoints:

```text
GET  /auth/login
GET  /auth/callback
POST /auth/logout
GET  /me
```

#### BE-004 User and team

- User list
- Team list
- User detail
- Team update
- Enable / disable user

#### BE-005 RBAC

- Roles
- Permissions
- User roles
- Team scope
- Backend guards
- Permission tests

### Phase 1 acceptance

- Real login path exists or approved temporary auth adapter is clearly isolated.
- Frontend can load current user and roles.
- Member cannot call admin endpoints.
- Admin can query users.
- Disabled user loses access.
- Prisma migration succeeds.
- Type check passes.
- Lint passes.
- Relevant tests pass.
- Production build passes.

## 7. Phase 2 — Content center

Backend:

- unified contents
- content versions
- categories
- tags
- design asset detail
- AI Skill detail
- AI case detail
- AI project detail
- files

Frontend:

- design asset list and detail
- AI Skill list and detail
- AI case list and detail
- AI project library and detail
- shared content header, meta, owner, status, files and relations

Phase 2 acceptance:

- Four content types are persisted in database.
- Lists and details use APIs.
- Attachments are real.
- Data survives refresh and new session.
- 33 AI projects migrate into formal data.

## 8. Phase 3 — Draft, version and review

Backend:

- create draft
- autosave
- version history
- version diff data
- submit review
- assign reviewer
- approve
- request changes
- publish
- unpublish
- archive
- review notifications

Frontend:

- content type selector
- shared editor shell
- asset editor
- Skill editor
- case editor
- AI project editor
- my submissions
- review center
- review detail
- version difference

Acceptance:

- Draft resumes across devices.
- Autosave failure is visible.
- Author cannot review own content.
- Reject requires reason.
- Published content creates new version on edit.
- Review history is traceable.
- Published content is searchable.

## 9. Phase 4 — Search, favorite and usage

Backend:

- full text search
- permission filtering
- search logs
- favorites
- recent views
- usage confirmation
- content relations

Frontend:

- global search
- search result page
- my favorites
- recent views
- usage confirmation
- related content

Acceptance:

- Search only returns authorized content.
- No-result queries are logged.
- Favorites sync across devices.
- Usage confirmation links real project reference.
- Content detail shows real usage summary.

## 10. Phase 5 — Analytics and administration

Backend:

- event endpoint
- aggregation jobs
- analytics APIs
- notification center
- content admin
- taxonomy admin
- user and role admin
- audit log

Frontend:

- event SDK
- value overview
- analytics
- notifications
- content management
- user and role management
- category and tag management
- audit log

Acceptance:

- Core behavior uses unified event naming.
- Dashboards read real data.
- Search no-result analysis works.
- Admin changes are audited.
- Role and content status changes apply immediately.
- Demo mode hides sensitive personal data.

## 10.5 Phase 5.5 — Functional interface completion

This phase was added by explicit user decision on 2026-07-17. It precedes the final pixel-level v9-1 remediation and Phase 6 acceptance.

Workspace shell:

- complete permission-aware desktop navigation
- complete mobile navigation drawer
- route-aware active navigation state
- dynamic workspace breadcrumb
- working global entry points with no inert primary controls

Functional surfaces:

- real workspace metrics, recent content and personal tasks
- role-aware actionable todos for contributors, reviewers and administrators
- recoverable notification-count synchronization and notification target navigation
- fresh-on-entry recent views without disabling the global workspace route cache
- complete personal-space entry points
- complete contribution, submission and review entry points
- complete analytics entry points for authorized users
- complete administration information architecture
- loading, empty, error and unauthorized states

Acceptance:

- Every implemented formal module is reachable from an authorized navigation path.
- A member can complete discovery, favorite, usage and contribution flows.
- A reviewer can view the authorized queue and complete decision and history flows only for reviews assigned to them.
- An administrator can assign or reassign reviewers and manage content, taxonomy, users, roles and audit records.
- Desktop and mobile navigation expose the same authorized capabilities.
- The workspace dashboard does not present static demo metrics as formal data.
- Primary actions are either functional or clearly unavailable; no inert primary controls remain.

## 10.6 Functional closure remediation — active delivery order (2026-07-18)

Before resuming desktop pixel parity, execute the P0 remediation backlog in
`docs/13-FUNCTIONAL-COMPLETENESS-AUDIT.md`.

Order:

1. Complete missing P0 authoring, attachment-download, share, filtering and preview paths.
2. Add and run deployed browser evidence for contributor, reviewer and administrator workflows.
3. Resume desktop-only v9-1 visual parity after the functional acceptance gate passes.
4. Perform mobile adaptation only after desktop functional and visual acceptance.

The workspace navigation-performance defect is tracked separately and does not
block functional-gap implementation, but it cannot be marked accepted without
user-observed improvement.

## 11. Phase 6 — Migration, QA and launch

### Data migration

Migrate approved v9-1:

- design assets
- AI Skills
- AI cases
- 33 AI projects
- approved categories
- approved value-goal taxonomy

Do not migrate demo metrics or simulated user behavior as production truth.

### Testing

Unit:

- permission rules
- state transitions
- content versions
- review rules
- search filtering

Integration:

- auth
- content CRUD
- review
- publish
- favorite
- files
- admin

E2E critical path:

1. Member login
2. Search asset
3. Favorite asset
4. Confirm usage
5. Create Skill
6. Save draft
7. Submit
8. Reviewer requests changes
9. Author updates
10. Reviewer approves
11. Publish
12. Search published content
13. Admin unpublishes
14. Member no longer finds content

Security:

- XSS
- CSRF
- SQL injection
- file spoofing
- API unauthorized access
- file unauthorized access
- restricted content
- disabled users

## 12. Phase 7 — AI capability

### AI Gateway

- provider adapters
- model config
- timeout
- retry
- fallback
- token tracking
- cost tracking
- sensitive data handling
- output schema validation

### Async execution

- queue
- run
- status
- cancel
- retry
- result persistence

### Prompt versioning

- Prompt snapshot
- model parameters
- test cases
- publish
- rollback

### First content assistance

- summary
- category suggestion
- tag suggestion
- completeness check
- duplicate check

### First online Skills

1. PRD design analysis
2. UI implementation fidelity review
3. Design specification structuring

## 13. Recommended sprint order

### Sprint 0

- PRD / ER / architecture freeze
- repo
- CI base
- API contract
- design system base

### Sprint 1

- auth
- user
- roles
- workspace layout
- content list / detail skeleton

### Sprint 2

- four content types
- taxonomy
- files
- first data migration

### Sprint 3

- content editor
- drafts
- versions
- my submissions

### Sprint 4

- review center
- publish
- unpublish
- archive
- notifications

### Sprint 5

- search
- favorites
- recent views
- usage confirmation

### Sprint 6

- events
- value overview
- analytics
- admin

### Sprint 7

- regression
- security
- performance
- migration
- staged launch

### Sprint 8–9 optional

- AI content assistance
- first online Skills

## 14. Definition of Done

Every implementation task must satisfy applicable requirements:

- Function implemented
- Design acceptance complete
- API docs updated
- Permission checks complete
- Loading state complete
- Empty state complete
- Error state complete
- Unauthorized state complete
- Event tracking complete
- Tests pass
- No blocking defect
- Code review complete
- Test environment validation complete

## 15. Recommended Phase 1 Codex execution order

Codex should not execute Phase 1 as one giant task.

Recommended sequence:

### Task 1

Project takeover inspection.

No code changes.

Output:

- product understanding
- current architecture
- v9-1 structure
- migration risks
- Phase 1 execution order
- documentation conflicts

### Task 2

Create formal web and API engineering foundation.

### Task 3

Create PostgreSQL and first Prisma schema.

### Task 4

Implement Organization, Team, User, Role, Permission and UserRole.

### Task 5

Implement authentication adapter, current user and RBAC.

### Task 6

Implement frontend protected routes and user context.

### Task 7

Run build, type check, lint and permission tests.

### Task 8

Review diff and update current status.

## 16. Hard constraints for Phase 1

Do not:

- migrate all business pages
- implement online AI execution
- implement analytics
- implement full review center
- redesign approved v9-1 visual direction
- create large mock data sets
- use localStorage for formal user or role state
- modify all modules in one task
