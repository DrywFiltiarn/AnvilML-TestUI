# Plan Report: P3-B1

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Task ID     | P3-B1                                             |
| Phase       | 003 — Workers & Jobs Panels                       |
| Description | TEMPLATE_ZIT, TEMPLATE_SDXL, getTemplate in app.js |
| Depends on  | P3-A1 (Workers panel stubs in index.html), P3-C1 (Jobs panel HTML) — actually none; P3-B1 is independent, can run in parallel with any Group task |
| Project     | anvilml-testui                                    |
| Planned at  | 2026-06-09T20:15:00Z                              |
| Attempt     | 1                                                 |

## Objective

Implement the TEMPLATES section of `app.js` with two constant JSON template strings (`TEMPLATE_ZIT` and `TEMPLATE_SDXL`) representing canonical AnvilML `SubmitJobRequest` payloads, and a `getTemplate(pipeline)` selector function that returns the appropriate template string based on the pipeline name.

## Scope

### In Scope
- Replace the stub comment in `// ── TEMPLATES ──` section of `app.js` (line 22) with:
  - `const TEMPLATE_ZIT = JSON.stringify(<ZiT SubmitJobRequest object>, null, 2)` — exact JSON structure per `ANVILML_TESTUI_DESIGN.md §6.1`
  - `const TEMPLATE_SDXL = JSON.stringify(<SDXL SubmitJobRequest object>, null, 2)` — exact JSON structure per `ANVILML_TESTUI_DESIGN.md §6.2`
  - `function getTemplate(pipeline)` — returns `TEMPLATE_ZIT` for `'zit'`, `TEMPLATE_SDXL` for `'sdxl'`, `TEMPLATE_ZIT` as fallback for any other value
- ZiT graph: 5 nodes (ZitLoadPipeline → ZitTextEncode → ZitSampler → ZitDecode → SaveImage), settings {seed:-1, steps:8, guidance_scale:0.0, width:1024, height:1024}
- SDXL graph: 5 nodes (SdxlLoadPipeline → SdxlTextEncode with negative_prompt → SdxlSampler with guidance_scale:7.5 → SdxlDecode → SaveImage), settings {seed:-1, steps:20, guidance_scale:7.5, width:1024, height:1024}
- Slot connections between nodes match `ANVILML_DESIGN.md §14.6` output slot names

### Out of Scope
- Jobs panel handlers (P3-D1) — these will consume templates but are not part of this task
- Jobs panel HTML elements (P3-C1) — separate task
- Workers panel implementation (P3-A1) — separate task
- Any changes to `index.html` or `styles.css`
- Any dependency additions or version changes
- Logging instrumentation (no runtime behavior to log; constants are static data)

## Approach

1. Open `app.js` and locate the `// ── TEMPLATES ──` section (lines 19–22), which currently contains only a stub comment: `// Template constants (ZiT, SDXL) will be added in Phase 003.`
2. Replace the stub comment with the `TEMPLATE_ZIT` constant: construct a plain JavaScript object matching the exact ZiT `SubmitJobRequest` structure from `ANVILML_TESTUI_DESIGN.md §6.1`, then wrap it with `JSON.stringify(..., null, 2)` and assign to a `const TEMPLATE_ZIT`.
3. Replace/add the `TEMPLATE_SDXL` constant: construct the SDXL `SubmitJobRequest` object per `ANVILML_TESTUI_DESIGN.md §6.2` (noting the `negative_prompt: ""` input on `SdxlTextEncode` and `guidance_scale: 7.5` on `SdxlSampler`), wrap with `JSON.stringify(..., null, 2)`, assign to `const TEMPLATE_SDXL`.
4. Add the `getTemplate(pipeline)` function below the constants, using a simple if/else or switch to route `'zit'` → `TEMPLATE_ZIT`, `'sdxl'` → `TEMPLATE_SDXL`, default → `TEMPLATE_ZIT`.
5. Verify with `node --check app.js` (syntax check) — must exit 0.
6. Verify template contents by evaluating `app.js` in Node and running the acceptance assertions from `TASKS_PHASE003.md`.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Modify | app.js | Replace TEMPLATES section stub with TEMPLATE_ZIT, TEMPLATE_SDXL constants and getTemplate function |

## Tests

| Test File | Test Name | What It Verifies |
|-----------|-----------|------------------|
| (inline via node -e) | Template JSON validity | `JSON.parse(TEMPLATE_ZIT)` and `JSON.parse(TEMPLATE_SDXL)` both parse without error |
| (inline via node -e) | ZiT node count | `zit.graph.nodes.length === 5` |
| (inline via node -e) | ZiT node types | First node is `ZitLoadPipeline`, last is `SaveImage` |
| (inline via node -e) | ZiT settings | `steps === 8`, `guidance_scale === 0.0` |
| (inline via node -e) | SDXL node count | `sdxl.graph.nodes.length === 5` |
| (inline via node -e) | SDXL node types | First node is `SdxlLoadPipeline`, last is `SaveImage` |
| (inline via node -e) | SDXL settings | `steps === 20`, `guidance_scale === 7.5` |
| (inline via node -e) | getTemplate routing | `getTemplate('zit') === TEMPLATE_ZIT`, `getTemplate('sdxl') === TEMPLATE_SDXL` |
| (inline) | Syntax check | `node --check app.js` exits 0 |

No test files are created. Verification is done via inline `node -e` commands per the acceptance criteria in `TASKS_PHASE003.md`.

## CI Impact

No CI changes required. This project has no CI pipeline (per `ENVIRONMENT.md §9`). The only verification gate is `node --check app.js` exiting 0, which is a local syntax check.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| JSON structure mismatch between plan and `ANVILML_TESTUI_DESIGN.md` | Low | Acceptance tests fail | Copy JSON structure verbatim from the design document (§6.1 and §6.2) — no manual transcription |
| `node --check` fails due to syntax error in template string | Low | Task blocked | Build incrementally: write one constant, check syntax, then write the next |
| Accidentally modifying the wrong section of `app.js` | Low | Scope creep | Target only the TEMPLATES section (lines 19–22); confirm surrounding banners are unchanged |
| Slot connection objects (`{ "node_id": "n0", "output_slot": "pipeline" }`) malformed | Low | Runtime 422 from AnvilML | Copy slot connection shapes verbatim from design document |

## Acceptance Criteria

- [ ] `node --check app.js` exits 0
- [ ] `JSON.parse(TEMPLATE_ZIT).graph.nodes.length === 5`
- [ ] `JSON.parse(TEMPLATE_ZIT).settings.steps === 8`
- [ ] `JSON.parse(TEMPLATE_ZIT).settings.guidance_scale === 0.0`
- [ ] `JSON.parse(TEMPLATE_SDXL).graph.nodes.length === 5`
- [ ] `JSON.parse(TEMPLATE_SDXL).settings.steps === 20`
- [ ] `JSON.parse(TEMPLATE_SDXL).settings.guidance_scale === 7.5`
- [ ] `getTemplate('zit') === TEMPLATE_ZIT`
- [ ] `getTemplate('sdxl') === TEMPLATE_SDXL`
- [ ] No other files modified (only `app.js`)
