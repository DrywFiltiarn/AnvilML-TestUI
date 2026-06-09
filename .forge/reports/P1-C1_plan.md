# Plan Report: P1-C1

| Field       | Value                                       |
|-------------|---------------------------------------------|
| Task ID     | P1-C1                                       |
| Phase       | 001 — Static Shell & Connection             |
| Description | styles.css: dark theme, layout, component classes |
| Depends on  | none                                        |
| Project     | anvilml-testui                              |
| Planned at  | 2026-06-09T19:10:00Z                        |
| Attempt     | 1                                           |

## Objective

Create `styles.css` — the complete stylesheet for AnvilML-TestUI implementing a dark terminal-inspired theme with CSS custom properties, panel layout, response area scrolling, status indicator classes, form element styling, and component classes for all seven panels defined in Phase 001.

## Scope

### In Scope
- `:root` CSS custom properties: `--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--green`, `--red`, `--amber`, `--accent`
- Global reset (`box-sizing: border-box`) and body styles (dark background, system-ui font)
- Panel sections: full-width vertical layout, margin/padding, surface background, border
- `<details> > summary` styling: pointer cursor, 600 weight, `▶`/`▼` pseudo-element toggle, list-style none
- `pre.response` and `div.ws-log`: `max-height: 400px`, `overflow-y: auto`, `background: var(--bg)`, `border: 1px solid var(--border)`, `padding: 8px`, `font-size: 12px`, `white-space: pre-wrap`, `word-break: break-all`
- Status indicator classes: `.status-ok` (green), `.status-error` (red), `.status-connecting` (amber)
- Button base + hover: surface background, text color, border, accent border on hover, 4px radius, 4px 12px padding
- `input`, `select`, `textarea`: matching border and background
- `textarea#jobs-body`: monospace font, 12px size, 320px min-height, 100% width, vertical resize
- Navbar styling (fixed top bar, project name, status pill)
- Monospace font stack for `pre`, `code`, `.response`, `.ws-log` elements
- No `@import` of external fonts or CSS

### Out of Scope
- JavaScript interactivity (handled by `app.js`)
- Responsive/mobile layout adjustments
- Animations beyond subtle blink on WebSocket indicator (documented as future phase)
- Dark/light theme toggle
- Any other CSS file — single file only

## Approach

1. **Define `:root` custom properties** — Declare all nine color variables (`--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--green`, `--red`, `--amber`, `--accent`) at the top of the file. No hardcoded hex values outside `:root`.

2. **Global reset and body** — Set `*, *::before, *::after { box-sizing: border-box; }`. Body: `background: var(--bg)`, `color: var(--text)`, `font-family: system-ui, -apple-system, sans-serif`, `margin: 0`, `padding: 0`, `line-height: 1.5`.

3. **Navbar** — Fixed top bar (`position: fixed`, `top: 0`, `left: 0`, `right: 0`) with surface background, border-bottom, padding, flex layout for project name and status pill.

4. **Main content area** — Offset from navbar (`padding-top` matching navbar height), full-width vertical sections for each panel.

5. **Panel sections (`details`/`summary`)** — Style `<details>` with margin-bottom, `<summary>` with `cursor: pointer`, `font-weight: 600`, padding, `list-style: none`, and `::marker` / pseudo-element for `▶` / `▼` toggle indicator.

6. **Response areas** — `pre.response` and `div.ws-log` with `max-height: 400px`, `overflow-y: auto`, `background: var(--bg)`, `border: 1px solid var(--border)`, `padding: 8px`, `font-size: 12px`, `white-space: pre-wrap`, `word-break: break-all`. Apply monospace font stack (`'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace`).

7. **Status classes** — `.status-ok { color: var(--green); }`, `.status-error { color: var(--red); }`, `.status-connecting { color: var(--amber); }`.

8. **Buttons** — Base style with `background: var(--surface)`, `color: var(--text)`, `border: 1px solid var(--border)`, `padding: 4px 12px`, `cursor: pointer`, `border-radius: 4px`. Hover state: `border-color: var(--accent)`.

9. **Form elements** — `input, select, textarea` styled with `background: var(--surface)`, `color: var(--text)`, `border: 1px solid var(--border)`, `padding: 4px 8px`, `border-radius: 4px`.

10. **Textarea #jobs-body** — Additional rules on `textarea#jobs-body`: `font-family: monospace`, `font-size: 12px`, `white-space: pre`, `min-height: 320px`, `width: 100%`, `resize: vertical`.

11. **Verification** — Confirm `grep -c 'var(--' styles.css` returns ≥ 12 and `wc -l styles.css` returns ≥ 60.

## Files Affected

| Action | Path | Description |
|--------|------|-------------|
| Create | `styles.css` | Complete stylesheet: dark theme, CSS variables, panel layout, response areas, status classes, form/button styling |

## Tests

None. This project has no automated tests (per ENVIRONMENT.md §8). Acceptance is verified by:
- `grep -c 'var(--' styles.css` returning ≥ 12
- `wc -l styles.css` returning ≥ 60

## CI Impact

No CI for this project (ENVIRONMENT.md §9). No CI workflow files to create or modify.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hardcoded hex values accidentally used outside `:root` | Low | Medium | Use only `var(--*)` references in all rules except the `:root` declarations |
| Missing `@import` accidentally added for external fonts | Low | Low | Task explicitly forbids `@import`; review during verification |
| `textarea#jobs-body` selector conflicts with future `.jobs-body` class | Low | Low | Task specifies `textarea#jobs-body` (id selector, high specificity); no class collision expected |
| `max-height: 400px` on response areas too restrictive for large outputs | Medium | Low | Acceptable for Phase 001; scrollable overflow is the intended behavior |

## Acceptance Criteria

- [ ] `grep -c 'var(--' styles.css` returns ≥ 12
- [ ] `wc -l styles.css` returns ≥ 60
- [ ] No `@import` rule present in the file
- [ ] All nine `:root` custom properties defined (`--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--green`, `--red`, `--amber`, `--accent`)
- [ ] `pre.response` and `div.ws-log` include `max-height: 400px`, `overflow-y: auto`, `white-space: pre-wrap`
- [ ] `textarea#jobs-body` includes `min-height: 320px`, `font-size: 12px`, `resize: vertical`
- [ ] `.status-ok`, `.status-error`, `.status-connecting` classes present with correct color assignments
- [ ] `<details> > summary` styled with `cursor: pointer` and `font-weight: 600`
- [ ] Button base and hover styles present with `var(--accent)` border on hover
- [ ] Input/select/textarea styled with `var(--border)` and `var(--surface)`
