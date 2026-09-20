# v9-1 Visual and Interaction Parity Inventory

Last Updated: 2026-07-18

## Purpose

This inventory is the mandatory gate before Phase 4. The deployed v9-1 site is the visual, information-architecture and interaction authority. The formal V1 application must preserve that experience while moving state to the API and PostgreSQL.

Do not accept a formal page merely because its data flow works.

## Verification method

For every deployed v9-1 page:

1. Capture the deployed desktop page at the same viewport as the formal page.
2. Record its navigation, sections, wording, controls, states and interactions.
3. Restore the counterpart in the formal application.
4. Capture the formal page with realistic database-backed content.
5. Compare screenshots before marking the row complete.

## Initial counterpart map

| Deployed v9-1 source | Formal V1 counterpart | Current parity status |
| --- | --- | --- |
| `index.html` — public home | `/` | Deployed/local desktop first-viewport pair captured at `1280 x 720`; the full deployed section order and desktop composition were then restored from matching source commit `bf39748` (metrics, task paths, project portfolio, assets, case, governance and CTA). Local `390 x 844` responsive verification restored the source mobile preview, 44px hero title rule and openable navigation menu; deployed same-viewport capture and full interaction-state acceptance remain pending. |
| `workspace.html` — workspace / presentation structure | `/workspace` and workspace shell | Direct deployment check confirms this is the live workspace counterpart. Source/local desktop evidence exists; mobile and matching permission-state evidence remain pending. The historical `design-intelligence-hub-demo.html` deep link itself returns 404. |
| No current deployed Design Assets catalog counterpart | `/workspace/design-assets` | Direct deployment check on 2026-07-17 confirmed `design-assets.html` returns GitHub Pages 404. The formal catalog remains database-backed and inherits the deployed workspace system; archival page geometry is not a parity authority. |
| No current deployed Design Asset detail counterpart | `/workspace/design-assets/[slug]` | The decision-first formal detail retains persisted version, owner/team, applicability, constraints, usage guide, attachments and content relations. No matching detail artifact exists in the verified release tree; this is not a separate deployed-page parity target. |
| No current deployed v9-1 Skill catalog counterpart | `/workspace/ai-skills` | Direct deployment check on 2026-07-17 confirmed `ai-skill-toolkit.html` returns GitHub Pages 404. The formal catalog is a V1 page and must inherit the deployed workspace shell rather than treating the archival file as a visual authority. |
| No current deployed v9-1 Skill detail counterpart | `/workspace/ai-skills/[slug]` | Direct deployment check on 2026-07-17 confirmed `skill-detail-component-governance.html` returns GitHub Pages 404, matching the absence of `skill-detail-*` in the verified `bf39748` release tree. The formal detail uses Design Decision 12 and persisted `SkillDetail` fields (goal, scope, input/output, Prompt, steps, examples, human review, limits, version and owner). |
| No current deployed submit-flow counterpart | `/workspace/submit` and `/workspace/submit/[id]` | Direct deployment check on 2026-07-17 confirmed `upload-asset.html` returns GitHub Pages 404. The formal draft workflow inherits the deployed workspace system. |
| `projects/index.html` and `projects/project-detail.html` — AI project library/detail | `/workspace/ai-projects` and `/workspace/ai-projects/[slug]` | Direct deployment check confirms both routes are live. Authenticated desktop source/formal catalog captures were completed on 2026-07-18. The source’s portfolio overview and suggested-priority layer is now restored with real published project data; the detail page maps the deployed project-template hierarchy (exploration hero, outcomes, management summary, priority and traceability) to formal project/version fields while retaining lifecycle and engagement controls. Post-deployment and mobile comparison remain pending. |
| Home-page verified-practice surface (not a standalone case page) | `/workspace/ai-cases` and `/workspace/ai-cases/[slug]` | List implemented. The detail page borrows only the approved home-page visual language for the before/after, responsibility, result, validation and evidence hierarchy; it has no confirmed standalone deployed counterpart. |
| No confirmed current deployed review-center counterpart | `/workspace/reviews` | Implemented with formal queue actions and the deployed workspace system; a deployed counterpart has not been confirmed in the verified release tree. |

## Formal-only pages

The following pages have no confirmed v9-1 counterpart. They must inherit the deployed workspace shell, typography, spacing, controls and density; they must not introduce a new style direction.

- `/login`
- `/workspace/submissions`
- `/workspace/notifications`
- `/workspace/ai-skills`
- `/workspace/ai-skills/[slug]`
- `/workspace/design-assets`
- `/workspace/design-assets/[slug]`
- `/workspace/submit`
- `/workspace/submit/[id]`
- `/workspace/ai-cases`
- `/workspace/ai-cases/[slug]`
- `/workspace/reviews`

## Current evidence status

- The deployed home page was successfully reached at `https://lomi2026.github.io/palmpay-design-intelligence/` on 2026-07-16.
- Automated browser capture completed on 2026-07-18 for the deployed and authenticated formal desktop first viewports of the public home, workspace and AI project library. The home capture identified and corrected a missing constrained desktop header container; the project-library capture identified and corrected the missing portfolio overview and suggested-priority layer. Those corrections still require a post-deployment same-viewport capture before final acceptance.
- The local `legacy/v9-1/` pages are a supporting source only. Any mismatch or missing page must be resolved in favour of the deployed site.
- Local visual smoke checks completed on `/` and `/workspace/ai-cases`: the public hero, workspace shell, data-backed catalog cards and search controls render at the local desktop viewport. This is not equivalent to deployed side-by-side acceptance.
- Mobile source/formal captures, project-detail same-state captures, interaction-state captures and post-deployment captures remain open; no page is marked pixel-accepted solely on the basis of implementation or a local build.
- Direct deployment checks on 2026-07-17 confirmed that the historical deep links `design-assets.html`, `upload-asset.html`, `design-intelligence-hub-demo.html`, `ai-skill-toolkit.html` and `skill-detail-component-governance.html` return GitHub Pages 404. They are archival references only, not current deployed parity targets.
