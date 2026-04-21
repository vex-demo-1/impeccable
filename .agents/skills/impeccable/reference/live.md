Interactive live variant mode: select elements in the browser, pick a design action, and get AI-generated HTML+CSS variants hot-swapped via the dev server's HMR.

## Prerequisites

A running dev server with hot module replacement (Vite, Next.js, Bun, etc.), OR a static HTML file open in the browser.

## The contract (read once)

Execute in order. No step skipped, no step reordered.

1. `live.mjs` — boot.
2. Navigate the browser to the URL that serves `pageFile`.
3. Poll loop with the default long timeout (600000 ms). After every event or `--reply`, run `live-poll.mjs` again immediately. Never pass a short `--timeout=`.
4. On `generate` — read screenshot if present; load the action's reference; plan three distinct directions; write all variants in one edit; `--reply done`; poll again.
5. On `accept` / `discard` — the poll script already cleaned up; just poll again.
6. On `exit` — run the cleanup at the bottom.

Harness: Cursor runs the poll in the foreground (blocking shell — not a background terminal, not a subagent). Claude Code can background the poll with no short timeout. Other harnesses: foreground unless the poll's stdout reliably returns to this session.

Chat is overhead. No recap, no tutorial output, no pasting PRODUCT / DESIGN bodies. Spend tokens on tools and edits; on failure, one or two short sentences.

## Start

```bash
node {{scripts_path}}/live.mjs
```

Output JSON: `{ ok, serverPort, serverToken, pageFile, hasProduct, product, productPath, hasDesign, design, designPath, migrated }`. Keep PRODUCT.md and DESIGN.md in mind for variant generation — **DESIGN.md wins on visual decisions; PRODUCT.md wins on strategic/voice decisions.** If `migrated: true`, the loader auto-renamed legacy `.impeccable.md` to `PRODUCT.md`; mention this once and suggest `$impeccable document` for the matching DESIGN.md.

`serverPort` and `serverToken` belong to the small **Impeccable live helper** HTTP server (serves `/live.js`, SSE, and `/poll`). That port is **not** your dev server and is usually not the URL you open to view the app. The browser page is whatever origin serves the HTML entry (`pageFile` / Vite / Next / Bun / tunnel / LAN hostname).

If output is `{ ok: false, error: "config_missing", configPath }`, this project hasn't used live mode. See **First-time setup** at the bottom.

## Poll loop

```
LOOP:
  node {{scripts_path}}/live-poll.mjs   # default long timeout; no --timeout=
  Read JSON; dispatch on "type"

  "generate"  → Handle Generate; reply done; LOOP
  "accept"    → Handle Accept; LOOP
  "discard"   → Handle Discard; LOOP
  "timeout"   → LOOP
  "exit"      → break → Cleanup
```

## Handle `generate`

Event: `{id, action, freeformPrompt?, count, pageUrl, element, screenshotPath?, comments?, strokes?}`.

Speed matters — the user is watching a spinner. Minimize tool calls by using the `wrap` helper and writing all variants in a single edit.

### 1. Read the screenshot (if present)

When the browser captured the element successfully, `event.screenshotPath` is an absolute path to a PNG showing the element as rendered, including any comment pins and drawn strokes the user placed before Go. **Read it before planning.** Annotations encode user intent not recoverable from `element.outerHTML` alone.

`event.comments` and `event.strokes` carry structured metadata alongside the visual. Treat the screenshot as primary; use the structured data for specifics worth quoting (e.g. the exact text of a comment).

Reading annotations precisely:

- **Comment position is load-bearing.** Its `{x, y}` is element-local CSS px (same coord space as `element.boundingRect`). Find the child under that point and apply the comment text LOCALLY to that sub-element. A comment near the title is about the title, not a global description.
- **Comments and strokes are independent annotations** unless clearly paired by overlap or tight proximity. Don't let the visual weight of a prominent stroke override the precise location of a textually-specific comment elsewhere.
- **Strokes are gestures — read them by shape.** Closed loop = "this thing" (emphasis / focus); arrow = direction (move / point to); cross or slash = delete; free scribble = emphasis or delete depending on context. A loop around region X means "pay attention to X," not "only change pixels inside X."
- **When a stroke's intent is ambiguous** (circle or arrow? emphasis or move?), state your reading in one sentence of rationale rather than silently guessing. If the uncertainty materially changes the brief, ask one short clarifying question before generating.

### 2. Wrap the element

```bash
node {{scripts_path}}/live-wrap.mjs --id EVENT_ID --count EVENT_COUNT --element-id "ELEMENT_ID" --classes "class1,class2" --tag "div"
```

Pass `event.element.id`, `event.element.classes` joined with commas, and `event.element.tagName`. The helper searches ID first, then classes, then tag + class combo. If `event.pageUrl` implies the file (e.g. `/` is usually `index.html`), pass `--file PATH` to skip the search.

Output: `{ file, insertLine, commentSyntax }`. If `wrap` fails, fall back to manual grep + edit.

### 3. Load the action's reference

If `event.action` is `impeccable` (the default freeform action), use SKILL.md's shared laws plus the loaded register reference (`editorial.md` or `product.md`). Do not load a sub-command reference.

Any other `event.action` (`bolder`, `quieter`, `distill`, `polish`, `typeset`, `colorize`, `layout`, `adapt`, `animate`, `delight`, `overdrive`): Read `reference/<action>.md` before planning. Each sub-command encodes a specific discipline; skipping its reference produces generic output.

### 4. Plan three genuinely distinct directions

Before writing a single line of code, name each variant.

**For freeform (`action` is `impeccable`, or the user supplied a free prompt):** each variant must anchor to a different **archetype** — a real-world design analogue specific enough to be recognizable at a glance. Not "modern landing page." Not "minimal product hero." Examples:

- *Broadsheet masthead with rule-divided columns* (think NYT print edition)
- *Klim Type Foundry specimen page* (dense, technical, catalog-driven)
- *Japanese print-poster minimalism with a single oversize glyph*
- *Bloomberg Terminal status bar*
- *Condé Nast Traveler feature layout*

Then commit each variant to a different **primary axis** of difference:

1. **Hierarchy** — which element commands the eye?
2. **Layout topology** — stacked / side-by-side / grid / asymmetric / overlay
3. **Typographic system** — pairing, scale ratio, case/weight strategy
4. **Color strategy** — Restrained / Committed / Full palette / Drenched
5. **Density** — minimal / dense / editorial
6. **Structural decomposition** — merge, split, progressive disclosure

Three variants → three DIFFERENT primary axes, not three riffs on color.

**When the primary axis is color or theme, forbid the trio from sharing theme + dominant hue.** Two dark-plus-one-dark is not distinct. Aim for one dark-neutral-accent, one light-drenched, one full-palette-saturated — three color worlds, not three shades of the same.

**The squint test (before writing code).** Write the three one-sentence descriptions side by side:

> V1: Broadsheet masthead, ruled columns, 24px ink on cream.
> V2: Enormous italic title, catalog spec rows, heavy monospace data.
> V3: Card-framed poster with one oversize glyph, magenta veil.

If two of them rhyme ("both use big type" / "both are stacks of sections" / "both feature the CTA prominently"), rework the offender. Freeform variants failing the squint test is the primary failure mode of this flow — three-of-the-same with minor styling tweaks.

**For action-specific invocations**, each variant must vary along the dimension the action names:

- `bolder` — amplify a different dimension per variant (scale / saturation / structural change). Not three "slightly bigger" variants.
- `quieter` — pull back a different dimension (color / ornament / spacing).
- `distill` — remove a different class of excess (visual noise / redundant content / nested structure).
- `polish` — target a different refinement axis (rhythm / hierarchy / micro-details like corner radii, focus states, optical kerning).
- `typeset` — different type pairing AND different scale ratio each. Not three riffs on one pairing.
- `colorize` — different hue family each (not shades of one hue). Vary chroma and contrast strategy.
- `layout` — different structural arrangement (stacked / side-by-side / grid / asymmetric). Not spacing tweaks.
- `adapt` — different target context per variant (mobile-first / tablet / desktop / print or low-data). Don't make three mobile layouts.
- `animate` — different motion vocabulary (cascade stagger / clip wipe / scale-and-focus / morph / parallax). Not three staggered fades.
- `delight` — different flavor of personality (unexpected micro-interaction / typographic surprise / illustrated accent / sonic-or-haptic moment / easter-egg interaction).
- `overdrive` — different convention broken (scale / structure / motion / input model / state transitions). Skip `overdrive.md`'s "propose and ask" step — live mode is non-interactive.

### 5. Apply the freeform prompt (if present)

`event.freeformPrompt` is the user's ceiling on direction — all variants must honor it — but still explore meaningfully different *interpretations*. "Make it feel like a newspaper front page" → variant 1 = broadsheet masthead + rule-divided columns, variant 2 = tabloid headline + single dominant image, variant 3 = minimalist editorial with oversized drop cap. Not three newspapers in the same voice.

### 6. Write all variants in a single edit

Complete HTML replacement of the original element for each variant, not a CSS-only patch. Consider the element's context (computed styles, parent structure, CSS variables from `event.element`).

Write CSS + all variants in ONE edit at the `insertLine` reported by `wrap`. Colocate scoped CSS as a `<style>` tag inside the variant wrapper — `<style>` works anywhere in modern browsers and this ensures CSS and HTML arrive atomically (no FOUC).

```html
<!-- Variants: insert below this line -->
<style data-impeccable-css="SESSION_ID">
  @scope ([data-impeccable-variant="1"]) { ... }
  @scope ([data-impeccable-variant="2"]) { ... }
</style>
<div data-impeccable-variant="1">
  <!-- variant 1: full element replacement -->
</div>
<div data-impeccable-variant="2" style="display: none">
  <!-- variant 2 -->
</div>
<div data-impeccable-variant="3" style="display: none">
  <!-- variant 3 -->
</div>
```

The first variant has no `display: none` (visible by default). All others do. If variants use only inline styles and no scoped CSS, omit the `<style>` tag entirely. Use `@scope` for CSS isolation (Chrome 118+ / Firefox 128+ / Safari 17.4+).

One edit, all variants — the browser's MutationObserver picks everything up in one pass.

### 7. Signal done

```bash
node {{scripts_path}}/live-poll.mjs --reply EVENT_ID done --file RELATIVE_PATH
```

`RELATIVE_PATH` is relative to project root (`public/index.html`, `src/App.tsx`, etc.) — the browser fetches source directly if the dev server lacks HMR.

Then run `live-poll.mjs` again immediately.

## Handle `accept`

Event: `{id, variantId, _acceptResult}`. The poll script already ran `live-accept.mjs` to handle the file operation deterministically; the browser DOM is already updated.

- `_acceptResult.handled: true` and `carbonize: false` — nothing to do. Poll again.
- `_acceptResult.handled: true` and `carbonize: true` — the accepted variant has an inline `<style>` block marked with `impeccable-carbonize-start` / `impeccable-carbonize-end` comments. Spawn a **background agent** to:
  1. Find the carbonize markers in the file.
  2. Move the CSS rules into the project's proper stylesheet(s).
  3. Rewrite `@scope` selectors to use the element's real classes instead of `[data-impeccable-variant]`.
  4. Remove any helper classes/attributes (e.g. `data-impeccable-variant`) from the accepted HTML.
  5. Delete the carbonize markers and inline `<style>` block.
  Poll again immediately; don't wait for the background agent.
- `_acceptResult.handled: false` — manual cleanup: read file, find markers, edit.

## Handle `discard`

Event: `{id, _acceptResult}`. The poll script already restored the original and removed all variant markers. Nothing to do. Poll again.

## Exit

The user can stop live mode by:
- Saying "stop live mode" / "exit live" in chat
- Closing the browser tab (SSE drops, poll returns `exit` after 8s)
- The browser's exit button

When the poll returns `exit`, proceed to cleanup. If the poll is still running as a background task, kill it first.

## Cleanup

```bash
node {{scripts_path}}/live-server.mjs stop
```

Stops the HTTP server and runs `live-inject.mjs --remove` to strip `localhost:…/live.js` from the HTML entry. To stop the server but keep the inject tag (for a quick restart), use `stop --keep-inject`. `config.json` persists for future sessions.

Then:
- Remove any leftover variant wrappers (search for `impeccable-variants-start` markers).
- Remove any leftover carbonize blocks (search for `impeccable-carbonize-start` markers).

## First-time setup (config missing)

If `live.mjs` outputs `{ ok: false, error: "config_missing", configPath }`, create the config at the reported path based on the project's framework:

| Framework | `file` | `insertBefore` | `commentSyntax` |
|-----------|--------|----------------|-----------------|
| Plain HTML | `index.html` | `</body>` | `html` |
| Vite / React | `index.html` | `</body>` | `html` |
| Next.js (App Router) | `app/layout.tsx` | `</body>` | `jsx` |
| Next.js (Pages) | `pages/_document.tsx` | `</body>` | `jsx` |
| Nuxt | `app.vue` | `</body>` | `html` |
| Svelte / SvelteKit | `src/app.html` | `</body>` | `html` |
| Astro | the root layout `.astro` file | `</body>` | `html` |
| Static site with a non-root HTML file | e.g. `public/index.html` | `</body>` | `html` |

Use `insertAfter` instead of `insertBefore` if the anchor should match **after** a specific line. Then re-run `live.mjs`.
