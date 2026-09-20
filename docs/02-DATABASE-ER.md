## 2026-09-17 PPCB database and attachment deployment boundary

PPCB injects separate testing/production PostgreSQL schemas. All Prisma operations and raw SQL use the injected schema with per-connection `search_path` and platform-required `ssl=false`; the existing entities, migrations, IDs, versions and audit model are unchanged. Testing seeds system configuration only. Production applies migrations and waits for a reviewed existing-data import instead of generating conflicting seed IDs.

PPCB identity binds to `User.employeeId`. The documented Owner email can be linked only for the configured, verified PPCB Owner ID; subsequent lookups use `employeeId` even if the email changes. Other users cannot claim an existing account by email. Imported employee mappings require explicit review before cutover. Existing RBAC is intersected with each request's trusted platform permission list.

PPCB private application OSS is the selected replacement target for durable attachments. The application may continue using R2 only until the PPCB file adapter, attachment import and checksum/access verification pass in the isolated environment. Production cutover must remove R2 runtime credentials after completeness is confirmed; it must not delete the source objects as part of the application release.

## 2026-09-16 归档内容可继续编辑与重新发布

按最新用户要求，已归档和已下架内容在我的贡献提供“继续编辑”。有草稿时复用，没有草稿时从当前发布版本创建；编辑与自动保存保持原生命周期状态，不重新进入公开目录。正常完整度与编辑权限校验通过后发布，状态恢复 PUBLISHED、archivedAt 清空，发布版本和目录同步。此规则替代前文归档后不提供编辑入口的约定。

## 2026-09-16 归档与未发布草稿

已发布或已下架内容可归档，即使有未发布草稿也不阻止归档。归档保留当前版本、草稿及历史记录，将内容状态置为 ARCHIVED 并退出公开目录；贡献页展示已归档且不提供不适用的编辑/发布详情入口。权限校验不变。

## 2026-09-12 设计资产封面

设计资产卡片无封面时显示统一灰色图片占位，取消旧模拟界面示意图。创建和编辑草稿均支持可选 PNG/JPG/WebP 封面，最大 5 MB。封面使用版本附件 COVER 关联，发布事务同步 Content.coverFileId；草稿替换、移除不影响当前发布图。图片展示遵循文件访问权限，不增加下载统计。

## 2026-09-12 内容删除

作者可删除自己负责的草稿、已发布内容及其他状态内容；管理员在内容管理查看组织内全部内容并删除。删除采用 Content.deletedAt，版本、附件和审计保留；目录、搜索、收藏、最近浏览和管理列表均排除已删除内容，详情不可访问。删除操作和审计在同一事务中完成，服务端校验组织及编辑归属权限。

## 2026-09-12 最新决定：提交即发布（替代下文旧审核流程）

取消内容审核及独立发布审批，移除审核中心、审核角色、审核权限、审核待办和审核统计。具备内容编辑权限的作者或管理员可以保存草稿并提交发布；服务端完整度校验通过后，在同一事务中发布版本、详情与分类标签，立即进入原有可见范围内的目录。登录、组织隔离、内容归属及其他管理权限保持有效。

已有审核中、退回或待发布版本恢复为可编辑草稿，由作者决定何时发布，不自动公开历史内容。历史审核及审计表保留用于数据追溯，不提供审核操作或提醒。旧审核人角色移除，原角色用户按原范围转换为普通成员。AI 输出的人工复核说明属于内容字段，不是平台审批流程。

# PalmPay体验设计Hub V1.0 — Database ER Model

## 1. 技术原则

- Database: PostgreSQL
- ORM: Prisma
- Cache: Redis
- Search MVP: PostgreSQL Full Text Search
- File storage: Cloudflare R2 through the S3-compatible API in production; a signed local filesystem adapter is permitted for development only
- Primary Key: UUID
- Time storage: UTC
- Formal business data uses database persistence
- Production user, role, content and review data must not use localStorage as source of truth
- Soft delete or archive is preferred for formal business content
- JSONB is used for snapshots and low-frequency extension fields, not to replace core relational models

## 2. Core relationship overview

```text
Organization
 ├─ Team
 │   └─ User
 └─ Content
      ├─ ContentVersion
      ├─ AssetDetail
      ├─ SkillDetail
      ├─ CaseDetail
      │   └─ CaseEvidence
      └─ AIProjectDetail

User
 ├─ UserRole ─ Role ─ RolePermission ─ Permission
 ├─ Favorite
 ├─ RecentView
 ├─ UsageEvent
 ├─ SearchLog
 ├─ ReviewRequest
 ├─ ReviewAction
 ├─ Notification
 ├─ AIRun
 └─ AuditLog

Content
 ├─ Category
 ├─ ContentTag ─ Tag
 ├─ AttachmentRelation ─ FileAttachment
 ├─ ReviewRequest
 ├─ Favorite
 ├─ UsageEvent
 └─ ContentRelation
```

## 3. Organization and permission models

### organizations

- id: uuid
- name: varchar(100)
- code: varchar(50), unique
- status: active | disabled
- settings: jsonb
- created_at
- updated_at

### teams

- id
- organization_id
- parent_id
- name
- code
- owner_id
- status
- created_at
- updated_at

Indexes:

- organization_id
- parent_id
- owner_id

### users

- id
- organization_id
- primary_team_id
- employee_id
- name
- email
- avatar_url
- status: invited | active | disabled
- locale
- last_login_at
- created_at
- updated_at
- deleted_at

Unique:

- organization_id + email
- employee_id when present

### roles

System role codes:

- member
- reviewer
- admin
- manager

Fields:

- id
- organization_id, nullable for system role
- code
- name
- description
- is_system
- created_at
- updated_at

### permissions

Suggested permission codes:

- content.read
- content.create
- content.edit_own
- content.edit_all
- content.submit
- content.publish
- content.unpublish
- content.archive
- review.read
- review.process
- review.assign
- analytics.read
- user.manage
- taxonomy.manage
- audit.read
- ai.execute
- ai.manage

Fields:

- id
- code
- module
- name
- description

### user_roles

- id
- user_id
- role_id
- scope_type: organization | team
- scope_id
- created_by
- created_at

Unique:

- user_id + role_id + scope_type + scope_id

## 4. Unified content model

### contents

Content types:

- DESIGN_ASSET
- AI_SKILL
- AI_CASE
- AI_PROJECT

Fields:

- id
- organization_id
- content_type
- title
- slug
- summary
- category_id
- owner_id
- team_id
- current_version_id
- draft_version_id
- status
- visibility
- verification_status
- cover_file_id
- published_at
- last_reviewed_at
- review_due_at
- created_by
- created_at
- updated_at
- archived_at
- deleted_at

Status enum:

- DRAFT
- IN_REVIEW
- CHANGES_REQUESTED
- APPROVED
- PUBLISHED
- UNPUBLISHED
- ARCHIVED

Verification enum:

- UNVERIFIED
- INTERNAL_TRIAL
- PILOT
- VERIFIED
- INVALIDATED

Visibility:

- public
- organization
- team
- restricted

Indexes:

- organization_id + content_type + status
- category_id
- owner_id
- team_id
- published_at
- updated_at
- review_due_at

Unique:

- slug

## 5. Content versions

### content_versions

- id
- content_id
- version_number
- version_label
- version_status
- base_version_id
- title
- summary
- body: jsonb
- change_summary
- created_by
- created_at
- submitted_at
- published_at

Rules:

- Review always targets a specific version.
- Published versions are immutable.
- Editing published content creates a new version.
- body stores the complete version snapshot.
- `body.taxonomy` stores the version's `{ categoryId, tagIds }`. Dedicated draft API fields are validated server-side; user-provided nested taxonomy is never trusted. Legacy versions without this key fall back to the content's existing relations when creating an edit draft; immutable historical versions are not rewritten.
- Draft-only content projects taxonomy to `contents.category_id` / `content_tags` on save. For published content, editing changes only the draft snapshot; publication projects reviewed taxonomy in the same transaction as version promotion and detail projection.
- Same content cannot reuse a version number.

Unique:

- content_id + version_number

## 6. Design asset detail

### asset_details

- content_id
- asset_type
- platforms: string[]
- scenarios: text[]
- unsuitable_scenarios: text[]
- problem_statement
- usage_guide: jsonb
- resource_links: jsonb
- maintenance_cycle_days
- extra_data: jsonb

## 7. AI Skill detail

### skill_details

- content_id
- applicable_roles: string[]
- input_requirements: jsonb
- output_schema: jsonb
- prompt_template: text
- execution_steps: jsonb
- example_input: jsonb
- example_output: jsonb
- human_review_rules: jsonb
- limitations: text
- recommended_models: string[]
- data_security_level: public | internal | confidential
- prompt_version
- online_executable: boolean
- execution_config: jsonb

Publish requirements:

- input_requirements is not empty
- output_schema is not empty
- prompt_template is not empty
- human_review_rules is not empty
- limitations is not empty
- owner exists
- version exists

## 8. AI case detail

### case_details

- content_id
- background
- original_process
- ai_responsibilities
- human_responsibilities
- result_summary
- metric_name
- before_value
- after_value
- sample_size
- validation_method
- limitations
- related_skill_content_id
- related_project_content_id

### case_evidence

- id
- case_content_id
- evidence_type: data | research | review | attachment
- metric_name
- metric_value
- data_source
- period_start
- period_end
- sample_size
- verification_status: pending | verified | rejected
- verified_by
- verified_at
- attachment_id

Rule:

A VERIFIED AI case must have at least one verified evidence record.

## 9. AI project detail

### ai_project_details

- content_id
- project_code
- domain
- target_value
- project_stage
- priority
- suggested_owner_team_id
- problem_statement
- solution_hypothesis
- expected_outcome
- risk_level
- evaluation_result: jsonb
- converted_project_ref

Project stage:

- EXPLORING
- PENDING_EVALUATION
- READY
- PILOTING
- VERIFIED
- PAUSED
- TERMINATED

Priority:

- high
- medium
- low

## 10. Categories and tags

### categories

- id
- organization_id
- parent_id
- name
- code
- content_types: string[]
- sort_order
- status: active | disabled
- created_at
- updated_at

### tags

- id
- organization_id
- name
- normalized_name
- usage_count
- The administration API computes `usageCount` from real, non-deleted, same-organization content relations instead of trusting the legacy stored counter. Published revisions do not change the count until publication; historical versions are excluded.
- status: active | merged | disabled; default disabled until explicitly enabled by an administrator
- merged_to_id
- created_at

### content_tags

- content_id
- tag_id
- created_by
- created_at

Primary key:

- content_id + tag_id

## 11. Files

### file_attachments

- id
- organization_id
- original_name
- storage_key
- mime_type
- extension
- size_bytes
- checksum
- access_level
- upload_status
- uploaded_by
- created_at
- deleted_at

access_level:

- public
- internal
- restricted

upload_status:

- uploading
- ready
- failed
- deleted

### attachment_relations

- id
- file_id
- entity_type
- entity_id
- usage_type
- sort_order
- created_at

entity_type:

- content
- version
- review
- ai_run

usage_type:

- cover
- attachment
- input
- output
- evidence

## 12. Review workflow

### review_requests

- id
- content_id
- version_id
- submitted_by
- assigned_reviewer_id
- status
- submit_message
- due_at
- submitted_at
- completed_at
- created_at

Status:

- pending
- approved
- changes_requested
- cancelled

Rules:

- One active review per content version.
- submitted_by cannot equal assigned_reviewer_id.
- `review.assign` is granted only to the platform administrator role.
- Only `review.assign` users can assign or reassign `assigned_reviewer_id`.
- `review.process` users can decide only review requests assigned to themselves.

### review_actions

- id
- review_request_id
- actor_id
- action
- comment
- metadata
- created_at

Action:

- assign
- comment
- approve
- request_changes
- cancel

Review actions are append-only.

## 13. User behavior

### favorites

- user_id
- content_id
- created_at

Primary key:

- user_id + content_id

### recent_views

- user_id
- content_id
- view_count
- first_viewed_at
- last_viewed_at

Primary key:

- user_id + content_id

### usage_events

- id
- organization_id
- user_id
- session_id
- content_id
- event_type
- project_reference
- source_page
- metadata
- occurred_at

Core event types:

- content_view
- favorite_add
- favorite_remove
- prompt_copy
- file_download
- content_share
- usage_confirmed
- project_referenced
- feedback_submitted

Indexes:

- organization_id + occurred_at
- content_id + event_type + occurred_at
- user_id + occurred_at

### search_logs

- id
- organization_id
- user_id
- keyword
- normalized_keyword
- filters
- result_count
- clicked_content_id
- session_id
- searched_at

### content_feedback

- id
- content_id
- user_id
- feedback_type
- rating
- comment
- status
- resolved_by
- resolved_at
- created_at

feedback_type:

- helpful
- outdated
- incorrect
- suggestion

status:

- open
- resolved
- ignored

## 14. Notifications

### notifications

- id
- receiver_id
- type
- title
- message
- related_entity_type
- related_entity_id
- channel
- status
- read_at
- created_at
- sent_at

channel:

- in_app
- email

status:

- pending
- sent
- failed

## 15. AI execution

### ai_runs

- id
- organization_id
- skill_content_id
- skill_version_id
- user_id
- status
- provider
- model
- input_data
- output_data
- output_text
- prompt_snapshot
- input_tokens
- output_tokens
- estimated_cost
- error_code
- error_message
- human_review_status
- started_at
- completed_at
- created_at

Status:

- queued
- running
- succeeded
- failed
- cancelled

Human review status:

- pending
- confirmed
- rejected

Rules:

- Save exact skill version used.
- Save prompt snapshot.
- History must not depend on current Skill content.
- Sensitive input persistence depends on data security level.

### ai_run_files

- id
- ai_run_id
- file_id
- direction: input | output
- created_at

### ai_feedback

- id
- ai_run_id
- user_id
- rating
- result_status
- used_in_project
- project_reference
- comment
- created_at

result_status:

- useful
- partially_useful
- unusable

## 16. Audit

### audit_logs

- id
- organization_id
- actor_id
- action
- entity_type
- entity_id
- before_data
- after_data
- ip_address
- user_agent
- created_at

Must audit:

- role change
- permission change
- user disable
- content publish
- content unpublish
- content archive
- reviewer decision
- owner change
- taxonomy change
- AI configuration change
- sensitive file access

## 17. Content relations

### content_relations

- id
- source_content_id
- target_content_id
- relation_type
- created_by
- created_at

relation_type:

- related
- uses
- evidence_for
- derived_from

Unique:

- source_content_id + target_content_id + relation_type

## 18. Search

MVP search source:

- contents.title
- contents.summary
- content_versions.body
- tags.name
- users.name
- ai_project_details.project_code

Suggested ranking:

1. Title
2. Project code
3. Tags
4. Summary
5. Body

Permission filtering must happen before results are returned.

## 19. Data integrity rules

1. Every content item has owner and team.
2. Published content has current published version.
3. Published AI Skill has human review rules.
4. VERIFIED AI case has verified evidence.
5. Reviewer cannot equal submitter.
6. Published version is immutable.
7. Category cannot be deleted while unresolved content dependencies remain.
8. User owner content must be reassigned before user disable.
9. Unpublished content is excluded from normal search.
10. Restricted content access is enforced by backend.
11. Formal user, role, content, review and usage data must not depend on localStorage.

## 20. v9-1 migration

Migrate:

- approved design asset examples
- approved AI Skill examples
- approved AI case examples
- 33 AI project directions
- approved taxonomy and value-goal categories

Do not migrate as production truth:

- demo metrics
- simulated favorites
- simulated audit records
- simulated review records
- temporary fake users

Migration flow:

```text
Extract legacy data
→ Normalize title, category and tags
→ Assign real owners
→ Create contents
→ Create type detail records
→ Create published 1.0 versions
→ Import files
→ Sample verification
```

## AI 工具扩展（2026-09-12）

`ContentType` 新增 `AI_TOOL`，`Content` 一对一关联 `AIToolDetail`（`ai_tool_details`）。详情以 `content_id` 为主键及外键，包含 `website_url`、`vendor`、`platforms`、`scenarios`、`usage_guide`、`limitations`、`pricing_model`。编辑内容先写入 `ContentVersion.body`，仅发布事务将审核后的快照投影至正式详情表。迁移为增量新增枚举值和表，不替换已有内容表。

## 分类与标签删除（2026-09-12）

Category 和 Tag 新增可空 deleted_at。删除为软删除，同时停用并写入审计；管理列表及新的可选项排除已删除记录，旧内容及版本中的关联仍保留。已删除记录不可通过普通状态更新重新启用。有未删除子分类的分类需先处理子分类。新增标签保持 DISABLED 默认值。

## 2026-09-16 标签适用页面

按用户最新要求，Tag 增加 content_types（TEXT[]，默认空数组表示通用）。支持 DESIGN_ASSET、AI_TOOL、AI_SKILL、AI_CASE、AI_PROJECT 多选；沿用既有组织范围、停用默认状态、审计及权限。发布/草稿保存时校验新增关联的适用范围，已有不再适用关联允许保留或移除。迁移 20260916093000_tag_content_types 为增量加列，旧标签默认为通用。
