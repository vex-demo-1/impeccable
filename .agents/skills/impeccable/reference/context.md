# Context Gathering Protocol

The full protocol that backs the brief rule in SKILL.md. Load this when you need the complete dispatch logic, exceptions, or cache semantics.

## The two context files

- **PRODUCT.md** (strategic, **required**): target users, product purpose, brand personality, anti-references, strategic design principles. Answers *who/what/why*.
- **DESIGN.md** (visual, **optional but strongly recommended**): follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/). Colors, typography, elevation, components, do's-and-don'ts. Answers *how it looks*.

Filename matching is case-insensitive. Legacy `.impeccable.md` auto-migrates to `PRODUCT.md` on first load. **DESIGN.md wins on visual decisions; PRODUCT.md wins on strategic/voice decisions.**

## The load command

```bash
node {{scripts_path}}/load-context.mjs
```

Returns JSON with `hasProduct`, `product` (full contents), `hasDesign`, `design` (full contents), `migrated`. **Consume the full output. Never pipe through `head`, `tail`, `grep`, or `jq` with field filters** — you need the complete file contents to do your job. Token cost of the full load is ~2-20KB, far less than redoing work with missing context.

## Session cache (critical for token economy)

If PRODUCT.md content is already in your conversation history from an earlier tool call in this session, you already have it loaded. **Do NOT re-run `load-context.mjs`.** Same for DESIGN.md. Re-fetching wastes thousands of tokens across a multi-command session.

Exceptions where you MUST re-load:
- You just ran `$impeccable teach` — PRODUCT.md was written or updated.
- You just ran `$impeccable document` — DESIGN.md was written or updated.
- The user says they've manually edited PRODUCT.md or DESIGN.md.

## Dispatch on result

**`hasProduct: true` AND content is substantive** (>200 chars, no `[TODO]` placeholders):
- If `hasDesign: true`: proceed. You have full context.
- If `hasDesign: false`: do a one-line nudge (say it once per session):
  > *"Note: no DESIGN.md found. I'll use impeccable's built-in design principles. For more on-brand output, run `$impeccable document` to generate a DESIGN.md from your existing code."*
  Then proceed.

**`hasProduct: false`** OR file exists but is empty / full of `[TODO]` placeholders:
1. Tell the user: *"I need PRODUCT.md before I can do this well. Running `$impeccable teach` now — I'll resume `[original task]` after."*
2. Run `$impeccable teach`.
3. When teach completes, re-run `load-context.mjs` and resume the **original** task the user asked for. Do not silently abandon intent.

## Exceptions (commands that skip or reshape the protocol)

- **`$impeccable teach`**: skips this protocol entirely — teach is how PRODUCT.md (and optionally DESIGN.md) get CREATED. Don't try to load before you create.
- **`$impeccable document`**: load PRODUCT.md (voice input) but do NOT block on missing DESIGN.md — document is how DESIGN.md gets created.
- **`$impeccable live`**: `live.mjs` already invokes the loader internally and returns both files in its startup JSON. When you've run `live.mjs`, the context is warmed. Do NOT additionally run `load-context.mjs` in the same session.

## Why this matters

- **Generic output is the #1 failure mode** of impeccable without PRODUCT.md. The user asks for polish and gets a stock-looking polish because the agent has no tone to polish toward.
- **Warmed live sessions feel instant** because when the user finally clicks Generate in the browser, the agent already has PRODUCT + DESIGN in context and proceeds straight to variant generation.
- **Token-efficient sessions** let the user run `$impeccable polish`, then `$impeccable audit`, then `$impeccable layout` without re-reading context files three times.
