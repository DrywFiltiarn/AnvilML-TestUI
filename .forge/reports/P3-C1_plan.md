# Plan Report: P3-C1

| Field       | Value                                       |
|-------------|---------------------------------------------|
| Task ID     | P3-C1                                       |
| Phase       | 003 — Workers & Jobs Panels                 |
| Description | Jobs panel HTML — textarea-based form elements |
| Depends on  | P1-D1 (apiFetch 204 guard), P2-B1 (empty-body 2xx guard), showResponse utility, Workers+Jobs panel stub IDs from Phase 001 |
| Project     | anvilml-testui                              |
| Planned at  | 2026-06-09T20:30:00Z                        |
| Attempt     | 1                                           |

## Objective

Replace the Jobs panel stub in `index.html` with the complete set of form elements for all six job operations: submit, list, get single, cancel, delete, and bulk clear. The panel uses a textarea (`#jobs-body`) pre-filled with a JSON template, a pipeline selector, and four visually separated sub-sections.

## Scope

### In Scope
- Replace the Jobs panel stub (`<h3>Coming in Phase 003</h3>` plus minimal placeholder elements) in `index.html` with the full set of 13 form elements:
  - **Submission sub-section:** `#jobs-pipeline` (select: zit/sdxl, default zit), `#jobs-reset-btn` (button "Reset Template"), `#jobs-body` (textarea rows=20, monospace, label "Request body (JSON)"), `#jobs-submit-btn` (button "Submit Job")
  - **List sub-section:** `#jobs-status-filter` (select: ""=all/queued/running/completed/failed/cancelled), `#jobs-list-btn` (button "List Jobs")
  - **Single job sub-section:** `#jobs-job-id` (text input, placeholder "job UUID"), `#jobs-get-btn` (button "Get Job"), `#jobs-cancel-btn` (button "Cancel Job"), `#jobs-delete-btn` (button "Delete Job")
  - **Bulk clear sub-section:** `#jobs-bulk-status` (select: completed/failed/cancelled/all), `#jobs-bulk-clear-btn` (button "Bulk Clear")
  - **Response area:** `#jobs-response` (pre, shared by all operations)
- Four sub-sections separated by `<hr>` elements
- Labels above form controls matching existing panel conventions (label elements with `for` attribute, or inline labels)
- Select options use the exact option values and display text specified in `TASKS_PHASE003.md §Group C`

### Out of Scope
- JavaScript handler functions (`handleJobSubmit`, `handleJobReset`, etc.) — handled by P3-D1
- Template constants (`TEMPLATE_ZIT`, `TEMPLATE_SDXL`, `getTemplate`) — handled by P3-B1
- CSS styling changes — `textarea#jobs-body` monospace rule already exists in `styles.css`; no new CSS needed
- Connection panel, System panel, Models panel, Workers panel, Artifacts panel, Events panel — unchanged
- `package.json` version bump — no source file modification (HTML only); version bump is not required per `ENVIRONMENT.md §10` which specifies patch increment only for modifications to `index.html`, `app.js`, or `styles.css` — actually this IS an `index.html` modification, so the ACT agent will bump the version. The plan notes this for awareness.

## Approach

1. **Read the existing Jobs panel stub** in `index.html` (lines 62–85). The stub currently has a `<h3>Coming in Phase 003</h3>` header and a minimal set of elements with placeholder select options.

2. **Remove the existing stub content** between `<details id="jobs-panel">` and `</details>`, replacing it with the full panel structure.

3. **Write the four sub-sections** in order:
   - **Submission section:** label "Pipeline", select `#jobs-pipeline` with options `zit` ("ZiT (distilled)") and `sdxl` ("SDXL") defaulting to `zit`; button `#jobs-reset-btn` ("Reset Template"); label "Request body (JSON)" above textarea `#jobs-body` (rows=20); button `#jobs-submit-btn` ("Submit Job").
   - **List section:** `<hr>` separator; label "Status filter", select `#jobs-status-filter` with options `""` ("all statuses"), `queued`, `running`, `completed`, `failed`, `cancelled`; button `#jobs-list-btn` ("List Jobs").
   - **Single job section:** `<hr>` separator; label "Job ID", text input `#jobs-job-id` (placeholder "job UUID"); three buttons `#jobs-get-btn` ("Get Job"), `#jobs-cancel-btn` ("Cancel Job"), `#jobs-delete-btn` ("Delete Job") on one row.
   - **Bulk clear section:** `<hr>` separator; label "Bulk clear status", select `#jobs-bulk-status` with options `completed`, `failed`, `cancelled`, `all`; button `#jobs-bulk-clear-btn` ("Bulk Clear").
   - **Response area:** `<pre id="jobs-response"></pre>` at the bottom.

4. **Preserve the outer `<details id="jobs-panel">` wrapper** and the `<summary>Jobs</summary>` header.

5. **Verify all 13 IDs** are present and unique (no duplicate IDs with other panels).

6. **Write the plan report** (this file), then update `CURRENT_TASK.md`.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | `index.html` | Replace Jobs panel stub (lines 62–85) with complete form elements for all six job operations |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|-----------------|
| N/A (manual) | Python ID check | All 13 required IDs present in `index.html` |
| N/A (manual) | Textarea check | `#jobs-body` is a `<textarea>` element |
| N/A (manual) | HTML well-formedness | No unclosed tags, no duplicate IDs |

The acceptance criterion from `TASKS_PHASE003.md` specifies a Python one-liner that checks all 13 IDs and verifies `jobs-body` is a textarea. This is a manual verification gate, not an automated test suite.

## CI Impact

No CI changes required. This project has no CI pipeline (per `ENVIRONMENT.md §9`). No workflow files are created or modified.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Duplicate IDs if the stub already contains some of the target IDs | Low | Medium | Read existing stub carefully; remove ALL stub content before writing new elements |
| HTML indentation mismatch with existing panels | Low | Low | Follow the same 2-space indentation pattern used by all other panels in `index.html` |
| Missing `<hr>` separators causing poor visual grouping | Low | Low | Include `<hr>` between the four sub-sections as specified in the task description |
| Select option text mismatch with what P3-D1 expects | Low | Medium | Use exact option text from `TASKS_PHASE003.md §Group C`: "ZiT (distilled)", "SDXL", "all statuses", etc. |
| `#jobs-body` rows=20 may not match the existing CSS `min-height: 320px` | Low | Low | CSS rule already targets `textarea#jobs-body` with `min-height: 320px`; the `rows=20` attribute is the HTML default, CSS overrides the visual height |

## Acceptance Criteria

- [ ] All 13 required IDs present in `index.html`: jobs-pipeline, jobs-reset-btn, jobs-body, jobs-submit-btn, jobs-status-filter, jobs-list-btn, jobs-job-id, jobs-get-btn, jobs-cancel-btn, jobs-delete-btn, jobs-bulk-status, jobs-bulk-clear-btn, jobs-response
- [ ] `#jobs-body` is a `<textarea>` element with `rows="20"`
- [ ] `#jobs-pipeline` is a `<select>` with options `zit` ("ZiT (distilled)") and `sdxl` ("SDXL"), default `zit`
- [ ] `#jobs-status-filter` is a `<select>` with options `""` ("all statuses"), `queued`, `running`, `completed`, `failed`, `cancelled`
- [ ] `#jobs-bulk-status` is a `<select>` with options `completed`, `failed`, `cancelled`, `all`
- [ ] Four sub-sections visually separated by `<hr>` elements
- [ ] `#jobs-response` is a `<pre>` element at the bottom of the panel
- [ ] Python acceptance check passes: `python3 -c "import re; html = open('index.html').read(); ids = re.findall(r'id=\"([^\"]+)\"', html); required = ['jobs-pipeline','jobs-reset-btn','jobs-body','jobs-submit-btn','jobs-status-filter','jobs-list-btn','jobs-job-id','jobs-get-btn','jobs-cancel-btn','jobs-delete-btn','jobs-bulk-status','jobs-bulk-clear-btn','jobs-response']; missing = [r for r in required if r not in ids]; assert not missing, f'Missing: {missing}'; assert re.search(r'<textarea[^>]+id=\"jobs-body\"', html), 'jobs-body must be a textarea'; print('PASS')"`
- [ ] HTML is well-formed (no unclosed tags, no duplicate IDs)
