# PalmPay Design Hub — Functional Completeness Audit

Last updated: 2026-07-31

## 2026-07-31 stage-one correction pass

A new local prelaunch audit found that earlier completeness checks protected the version snapshot but did not project newly published snapshots into the four relational detail tables. It also found organization-wide leakage from TEAM-scoped review permissions, owner-only editing without `content.edit_own`, user disable without required content-owner transfer, missing restricted-download events/audit and cold-start authentication failures being misclassified as logout.

The correction pass now covers those paths with service and PostgreSQL integration tests. On 2026-08-01 the restored local database reported all six migrations current and the complete API suite passed 46/46, including all 14 database E2E checks (0 failed, 0 skipped). Web tests pass 20/20; typecheck, lint and production build pass. Commit `46b988d` is deployed to the Vercel/Render external-test environment with the migration-gated API healthy; three-role browser workflow acceptance remains open.

## Purpose and delivery order

This document is the execution baseline for the user's latest delivery decision:

> Complete and externally verify the desktop functional workflow first. Restore desktop Web visual parity second. Perform mobile adaptation last.

Pixel-level visual remediation, mobile-specific layouts and the unresolved workspace navigation-performance issue are explicitly outside this functional remediation pass. They must not prevent a missing P0 workflow from being identified or completed.

## Evidence rules

Status labels:

- **Implemented** — the formal UI and protected API path exist, and the repository has code-level or integration-test evidence.
- **Partial** — a route or API exists, but a required P0 field, action, validation rule or user-facing path is absent.
- **External verification required** — implementation exists but has not been demonstrated in the deployed test environment through the appropriate user role.
- **Deferred** — intentionally outside the current functional pass.

The audit reviewed the formal web routes, server actions, NestJS controllers/services and the PostgreSQL integration tests. Local integration evidence does not substitute for an external browser workflow.

## Functional matrix

| P0 area | Current status | Evidence / functional gap |
| --- | --- | --- |
| Test login, users, teams and RBAC | Implemented; external verification required | Test-mode signed session, disabled-user checks and three bootstrap identities exist. Enterprise SSO/OIDC is a production prerequisite, not a test-environment blocker. |
| Permission-aware navigation and protected routes | Implemented; external verification required | Workspace navigation filters modules by permission; API guards remain authoritative. |
| Four content catalogs and detail pages | Implemented; external verification required | Design assets, Skills, cases and projects read persisted PostgreSQL content through permission-filtered APIs. |
| Search, favorites, recent views, Prompt copy, usage confirmation and relations | Implemented; external verification required | Formal APIs and routes exist. Search/favorite/usage persistence has integration evidence. |
| Catalog filtering | Implemented; external verification required | Design assets, AI Skills, AI cases and AI projects use one URL-backed server filter contract: `search`, `categoryId`, `tag` and `verificationStatus`. Filter options derive from permission-filtered catalog data, all controls preserve the other URL state, and the API applies content visibility before returning results. Project-domain/value/stage and asset-platform view preferences remain supplementary local controls. |
| Share link | Implemented; external verification required | Every formal content detail page has a canonical copy-link action. It copies the origin plus pathname (never query-state), then records the existing `content_share` event through the authorized API. The copied internal route preserves all existing content visibility and RBAC checks. |
| Draft creation, autosave, versioning and published-content edit draft | Implemented; external verification required | Four content types use the draft API and server actions; published edits create a separate draft version. |
| Four content-type creation forms and completeness gate | Implemented; external verification required | All four editors collect their P0 structured contracts. A shared server-side validator blocks both review submission and publication with field-specific missing-item feedback; incomplete drafts remain saveable. Automated fixtures cover complete and missing-field snapshots for every content type. |
| Author-facing content preview | Implemented; external verification required | The editor saves the current draft before routing to a protected rendered preview with the same formal detail hierarchy and a prominent draft-only banner. It uses the existing owner/content-editor draft permission boundary and is absent from public routes, catalogs and search. |
| R2 attachment upload, checksum and draft binding | Implemented; external verification required | Signed upload, completion verification and draft attachment binding exist. |
| Published attachment download | Implemented; external verification required | All four formal detail pages render ready attachments from the current published version and request a short-lived signed URL only after an authorized user clicks download. The server checks organization, published-current-version binding and content visibility before issuing a URL; local integration tests cover permitted and rejected access. |
| Submit, assign reviewer, compare versions, approve, request changes, comment, publish, unpublish and archive | Implemented; external verification required | Formal server actions and protected API transitions exist; local PostgreSQL integration covers independent contributor/reviewer/admin lifecycle behaviour. |
| Notifications and My Submissions | Implemented; external verification required | Persistent notification APIs, read actions and personal submission views exist. |
| Management centre: content, taxonomy, teams, users, roles, audit and platform settings | Implemented; external verification required | Protected administration APIs and UI actions exist. Tab responsiveness is a separate deferred performance defect. |
| Value overview and data insights | Implemented; external verification required | Pages read formal analytics APIs; their meaning and rendered data need test-environment acceptance. |
| Browser-side E2E evidence for all three roles | Missing | No completed deployed-browser record yet proves upload → review → publication across the three fixed acceptance identities. |
| Workspace menu/tab performance | Deferred | User paused this after the current implementation did not meet perceived responsiveness. It remains open and is not counted as fixed. |

## Functional remediation backlog

The following items are the next implementation work. They are ordered by the core governance loop, not by visual polish.

1. **F-01 — Complete structured four-type editor contracts and server-side completeness rules. — Implemented locally; external verification required.** The editors persist the missing P0 fields, incomplete drafts remain saveable, and review submission plus publication use one server-side contract that returns specific missing-field labels. A Skill cannot pass either gate without its required input/output, human review, test example, scope, limitations, security level, model and Prompt version.
2. **F-02 — Render protected attachment download controls on published detail pages. — Implemented locally; external verification required.** Ready attachments on every published detail page use the existing signed-download endpoint. The UI never renders bucket objects or credentials, and the server denies files not bound to a content version visible to the requester.
3. **F-03 — Add a canonical share-link action. — Implemented locally; external verification required.** All formal detail pages copy the canonical detail pathname and record `content_share`; the copied internal URL has no public-token bypass and therefore remains subject to normal content visibility and RBAC checks.
4. **F-04 — Normalize catalog filters. — Implemented locally; external verification required.** All four catalogs expose category, tag and applicable/verification-status controls backed by the same API query. Search and filter values survive refresh, direct links and subsequent control submissions; integration coverage verifies their combined result remains permission-filtered.
5. **F-05 — Add contributor preview before review submission. — Implemented locally; external verification required.** The preview action saves the form's current fields, then routes only the draft author or authorized content editor to a formal rendered preview with an explicit unpublished-draft banner. The existing draft API remains the permission boundary; no public URL, catalog or search index is introduced. Integration coverage confirms author/editor access and reviewer denial.
6. **F-06 — Add a deployed test-environment browser acceptance script and execute it. — Browser-control blocker.** The public Vercel test home and login route were reached on 2026-07-18. Although three role tabs can be logged in, they share one browser-cookie scope: a server-rendered navigation resolves to the most recently authenticated identity rather than the role originally shown in that tab. In addition, browser-control attempts to take over or fill the login form time out. No acceptance content or files were written. Resume with isolated browser profiles/contexts or a responsive browser-control channel, then validate contributor, reviewer and administrator flows including file upload/download and lifecycle cleanup.

## Functional acceptance gate

The functional pass is complete only when the following deployed path has evidence:

1. `lomi2025@126.com` logs in, finds content, favorites it, confirms usage, creates each required content type, uploads an attachment, previews it and submits it.
2. `lomi2024@126.com` receives/opens the review, assigns or accepts it as allowed, reviews the diff, requests changes, then approves the resubmission.
3. `lomi2026@126.com` publishes the approved version, confirms it is discoverable, verifies attachment download, then performs authorized lifecycle and administration actions.
4. Unauthorized and disabled-user access remains rejected, and audit/notification records are present.

Only after this gate is complete should the project resume desktop v9-1 screenshot parity. Mobile adaptation remains the final UI phase.
