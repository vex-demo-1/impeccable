Generate a `DESIGN.md` file at the project root that captures the current visual design system, so AI agents generating new screens stay on-brand.

DESIGN.md follows the [official Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/): exactly six sections in a fixed order. Sections may be omitted when not relevant, but **do not reorder them and do not rename them**. Section headers must match the spec character-for-character so the file stays parseable by other DESIGN.md-aware tools (Stitch itself, awesome-design-md, skill-rest, etc.).

## The six sections (exact order)

1. `## Overview`
2. `## Colors`
3. `## Typography`
4. `## Elevation`
5. `## Components`
6. `## Do's and Don'ts`

Optional evocative subtitles are allowed in the form `## 2. Colors: The [Name] Palette` — Stitch's own outputs do this — but the literal word in each header (Overview, Colors, Typography, Elevation, Components, Do's and Don'ts) must be present. Do NOT add extra top-level sections (Layout Principles, Responsive Behavior, Motion, Agent Prompt Guide). Fold that content into the six spec sections where it naturally belongs.

## When to run

- The user just ran `/impeccable teach` and needs the visual side documented.
- The skill noticed no `DESIGN.md` exists and nudged the user to create one.
- An existing `DESIGN.md` is stale (the design has drifted).
- Before a large redesign, to capture the current state as a reference.

If a `DESIGN.md` already exists, **do not silently overwrite it**. Show the user the existing file and STOP and call the AskUserQuestion tool to clarify. whether to refresh, overwrite, or merge.

## Two paths

- **Scan mode** (default): the project has design tokens, components, or rendered output. Extract, then confirm descriptive language. Use when there's code to analyze.
- **Seed mode**: the project is pre-implementation (fresh teach, nothing built yet). Interview for five high-level answers, write a minimal DESIGN.md marked `<!-- SEED -->`. Re-run in scan mode once there's code.

Decide by scanning first (Scan mode Step 1). If the scan finds no tokens, no component files, and no rendered site, offer seed mode — don't silently switch. `/impeccable document --seed` forces seed mode regardless of code presence.

## Scan mode (approach C: auto-extract, then confirm descriptive language)

### Step 1: Find the design assets

Search the codebase in priority order:

1. **CSS custom properties** — grep for `--color-`, `--font-`, `--spacing-`, `--radius-`, `--shadow-`, `--ease-`, `--duration-` declarations in CSS files (usually `src/styles/`, `public/css/`, `app/globals.css`, etc.). Record name, value, and the file it's defined in.
2. **Tailwind config** — if `tailwind.config.{js,ts,mjs}` exists, read the `theme.extend` block for colors, fontFamily, spacing, borderRadius, boxShadow.
3. **CSS-in-JS theme files** — styled-components, emotion, vanilla-extract, stitches: look for `theme.ts`, `tokens.ts`, or equivalent.
4. **Design token files** — `tokens.json`, `design-tokens.json`, Style Dictionary output, W3C token community group format.
5. **Component library** — scan the main button, card, input, navigation, dialog components. Note their variant APIs and default styles.
6. **Global stylesheet** — the root CSS file usually has the base typography and color assignments.
7. **Visible rendered output** — if browser automation tools are available, load the live site and sample computed styles from key elements (body, h1, a, button, .card). This catches values that tokens miss.

### Step 2: Auto-extract what can be auto-extracted

Build a structured draft from the discovered tokens. For each token class:

- **Colors**: Group into Primary / Secondary / Tertiary / Neutral (the Material-derived roles Stitch uses). If the project only has one accent, express it as Primary + Neutral — omit Secondary and Tertiary rather than inventing them.
- **Typography**: Map observed sizes and weights to the Material hierarchy (display / headline / title / body / label). Note font-family stacks and the scale ratio.
- **Elevation**: Catalogue the shadow vocabulary. If the project is flat and uses tonal layering instead, that's a valid answer — state it explicitly.
- **Components**: For each common component (button, card, input, chip, list item, tooltip, nav), extract shape (radius), color assignment, hover/focus treatment, internal padding.
- **Spacing + layout**: Fold into Overview or relevant Components. The spec does NOT have a Layout section.

### Step 3: Ask the user for qualitative language

The following require creative input that cannot be auto-extracted. Group them into one `AskUserQuestion` interaction:

- **Creative North Star**: a single named metaphor for the whole system ("The Editorial Sanctuary", "The Golden State Curator", "The Lab Notebook"). Offer 2-3 options that honor PRODUCT.md's brand personality.
- **Overview voice**: mood adjectives, aesthetic philosophy in 2-3 sentences, anti-references (what the system should not feel like).
- **Color character** (for auto-extracted colors): descriptive names ("Deep Muted Teal-Navy", not "blue-800"). Suggest 2-3 options per key color based on hue/saturation.
- **Elevation philosophy**: flat/layered/lifted. If shadows exist, is their role ambient or structural?
- **Component philosophy**: the feel of buttons, cards, inputs in one phrase ("tactile and confident" vs. "refined and restrained").

Quote a line from PRODUCT.md when possible so the user sees their own strategic language carry forward.

### Step 4: Write DESIGN.md

Use this exact structure. Headers must match character-for-character. Optional evocative subtitles (e.g. `## 2. Colors: The Coastal Palette`) are allowed.

```markdown
# Design System: [Project Title]

## 1. Overview

**Creative North Star: "[Named metaphor in quotes]"**

[2-3 paragraph holistic description: personality, density, aesthetic philosophy. Start from the North Star and work outward. State what this system explicitly rejects (pulled from PRODUCT.md's anti-references). End with a short **Key Characteristics:** bullet list.]

## 2. Colors

[Describe the palette character in one sentence.]

### Primary
- **[Descriptive Name]** (#HEX / oklch(...)): [Where and why this color is used. Be specific about context, not just role.]

### Secondary (optional — omit if the project has only one accent)
- **[Descriptive Name]** (#HEX): [Role.]

### Tertiary (optional)
- **[Descriptive Name]** (#HEX): [Role.]

### Neutral
- **[Descriptive Name]** (#HEX): [Text / background / border / divider role.]
- [...]

### Named Rules (optional, powerful)
**The [Rule Name] Rule.** [Short, forceful prohibition or doctrine — e.g. "The One Voice Rule. The primary accent is used on ≤10% of any given screen. Its rarity is the point."]

## 3. Typography

**Display Font:** [Family] (with [fallback])
**Body Font:** [Family] (with [fallback])
**Label/Mono Font:** [Family, if distinct]

**Character:** [1-2 sentence personality description of the pairing.]

### Hierarchy
- **Display** ([weight], [size/clamp], [line-height]): [Purpose — where it appears.]
- **Headline** ([weight], [size], [line-height]): [Purpose.]
- **Title** ([weight], [size], [line-height]): [Purpose.]
- **Body** ([weight], [size], [line-height]): [Purpose. Include max line length like 65–75ch if relevant.]
- **Label** ([weight], [size], [letter-spacing], [case if uppercase]): [Purpose.]

### Named Rules (optional)
**The [Rule Name] Rule.** [Short doctrine about type use.]

## 4. Elevation

[One paragraph: does this system use shadows, tonal layering, or a hybrid? If "no shadows", say so explicitly and describe how depth is conveyed instead.]

### Shadow Vocabulary (if applicable)
- **[Role name]** (`box-shadow: [exact value]`): [When to use it.]
- [...]

### Named Rules (optional)
**The [Rule Name] Rule.** [e.g. "The Flat-By-Default Rule. Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus)."]

## 5. Components

For each component, lead with a short character line, then specify shape, color assignment, states, and any distinctive behavior.

### Buttons
- **Shape:** [radius described, exact value in parens]
- **Primary:** [color assignment + padding, in semantic + exact terms]
- **Hover / Focus:** [transitions, treatments]
- **Secondary / Ghost / Tertiary (if applicable):** [brief description]

### Chips (if used)
- **Style:** [background, text color, border treatment]
- **State:** [selected / unselected, filter / action variants]

### Cards / Containers
- **Corner Style:** [radius]
- **Background:** [colors used]
- **Shadow Strategy:** [reference Elevation section]
- **Border:** [if any]
- **Internal Padding:** [scale]

### Inputs / Fields
- **Style:** [stroke, background, radius]
- **Focus:** [treatment — glow, border shift, etc.]
- **Error / Disabled:** [if applicable]

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.**

### [Signature Component] (optional — if the project has a distinctive custom component worth documenting)
[Description.]

## 6. Do's and Don'ts

Concrete, forceful guardrails. Lead each with "Do" or "Don't". Be specific — include exact colors, pixel values, and named anti-patterns the user mentioned in PRODUCT.md.

### Do:
- **Do** [specific prescription with exact values / named rule].
- **Do** [...]

### Don't:
- **Don't** [specific prohibition — e.g. "use border-left greater than 1px as a colored stripe"].
- **Don't** [...]
- **Don't** [...]
```

### Step 4b: Write DESIGN.json sidecar

After the Markdown is written, produce a machine-readable sidecar at `DESIGN.json` next to `DESIGN.md`. This powers the `/impeccable live` design-system panel, which renders a tile-based visualization of the system — color swatches with tonal ramps, Aa type specimens, live component previews. **The sidecar is how the panel shows *this project's* actual button/input/nav/card, not a generic approximation.**

Regenerate the sidecar whenever you regenerate DESIGN.md. If the user only asks to refresh the sidecar (e.g., from the live panel's stale-hint), preserve DESIGN.md and write only DESIGN.json.

#### Schema

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601 string",
  "title": "Design System: [Project Title]",
  "tokens": {
    "colors": [
      {
        "role": "primary | secondary | tertiary | neutral | accent",
        "name": "Descriptive Name",
        "value": "#HEX or oklch(...) or rgba(...)",
        "description": "Short role explanation (one sentence).",
        "tonalRamp": ["...", "...", "..."]
      }
    ],
    "typography": [
      {
        "role": "display | headline | title | body | label | mono",
        "name": "Display",
        "family": "Cormorant Garamond",
        "fallback": "Georgia, serif",
        "weight": 300,
        "style": "normal | italic",
        "sampleSize": "clamp(2.5rem, 7vw, 4.5rem) or 1rem",
        "lineHeight": "1 | 1.2 | 1.6",
        "letterSpacing": "normal | 0.05em",
        "textTransform": "none | uppercase",
        "purpose": "Short description of where this role is used."
      }
    ],
    "radii":   [{ "name": "sm|md|lg|xl|full", "value": "4px" }],
    "shadows": [{ "name": "Descriptive Name", "value": "0 4px 24px rgba(0,0,0,0.12)", "purpose": "..." }],
    "spacing": [{ "name": "xs|sm|md|lg|xl|2xl|3xl", "value": "8px" }]
  },
  "components": [
    {
      "name": "Primary Button",
      "kind": "button | input | nav | chip | card | custom",
      "description": "One-line what and when.",
      "html": "<button class=\"ds-btn-primary\">GET STARTED</button>",
      "css": ".ds-btn-primary { background: #191c1d; color: #fff; padding: 16px 48px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 500; border: none; border-radius: 0; transition: background 0.2s, transform 0.2s; } .ds-btn-primary:hover { background: oklch(60% 0.25 350); transform: translateY(-2px); }"
    }
  ],
  "narrative": {
    "northStar": "The Editorial Sanctuary",
    "overview": "2-3 paragraphs of the philosophy — pulled from DESIGN.md Overview section.",
    "keyCharacteristics": ["...", "..."],
    "rules": [{ "name": "The One Voice Rule", "body": "...", "section": "colors|typography|elevation" }],
    "dos":   ["Do use ..."],
    "donts": ["Don't use ..."]
  }
}
```

#### Component translation rules

The `html` and `css` fields must be **self-contained, drop-in snippets** that render correctly when injected into a shadow DOM. The panel applies them directly — no post-processing, no framework runtime.

1. **Tailwind expansion.** If the source uses Tailwind (className="bg-primary text-white rounded-lg px-6 py-3"), expand every utility to literal CSS properties in the `css` string. Do **not** reference Tailwind classes; do **not** assume a Tailwind CSS bundle is loaded. Each component is self-contained.
2. **Token resolution.** If the project exposes tokens as CSS custom properties on `:root` (e.g. `--color-primary`, `--radius-md`), reference them via `var(--color-primary)` — they inherit through the shadow DOM and stay live-bound. If tokens live only in JS theme objects (styled-components, CSS-in-JS), resolve to literal values at generation time.
3. **Icons.** Inline as SVG. Do not reference Lucide/Heroicons packages, icon fonts, or `<img src="...">`. A typical icon is 16-24px; copy the SVG path data directly.
4. **States.** Include `:hover`, `:focus-visible`, and (if meaningful) `:active` rules inline. A static default-only snapshot makes the panel feel dead. Hover + focus rules in the CSS make it feel alive.
5. **Reset bloat.** Extract only the component's *distinctive* CSS (background, color, padding, border-radius, typography, transition). Skip universal resets (`box-sizing: border-box`, `line-height: inherit`, `-webkit-font-smoothing`). The panel already has a neutral canvas; don't re-ship resets.
6. **Scoped class names.** Prefix every class with `ds-` (e.g. `ds-btn-primary`, `ds-input-search`) so component CSS doesn't collide with other components' CSS in the same shadow DOM.

#### What to include

Aim for a tight set of **5-10 components** that best represent the visual system:

- **Canonical primitives (always include if the project has them):** button (each variant as a separate component entry), input/text field, navigation, chip/tag, card.
- **Signature components (include if distinctive):** hero CTA, featured card, filter pill, any custom pattern the user mentioned as important in PRODUCT.md.
- **Skip the rest.** Utility components, form building blocks, wrapper layouts — not worth documenting unless visually distinctive.

If the project has **no component library yet** (bare landing page, new project), synthesize canonical primitives from the tokens using best-practice defaults consistent with the DESIGN.md's rules. Every DESIGN.json has *something* to render, even on day zero.

#### Tonal ramps

For each color token, generate an 8-step `tonalRamp` array — dark to light, same hue and chroma, stepped lightness from ~15% to ~95%. The panel renders this as a strip under the swatch. If the project already defines a tonal scale (Material `surface-container-low` family, Tailwind-style `blue-50..blue-900`), use those values. Otherwise synthesize in OKLCH.

#### Narrative mapping

Pull directly from the DESIGN.md you just wrote:

- `narrative.northStar` → the `**Creative North Star: "..."**` line from Overview
- `narrative.overview` → the philosophy paragraphs from Overview
- `narrative.keyCharacteristics` → the bulleted `**Key Characteristics:**` list
- `narrative.rules` → every `**The [Name] Rule.** [body]` across all sections, tagged with `section`
- `narrative.dos` / `narrative.donts` → the bullet lists from Do's and Don'ts verbatim

Do not reword. The panel shows these as secondary collapsible context; the same voice that's in the Markdown carries through.

### Step 5: Confirm, refine, and refresh session cache

1. Show the user the full DESIGN.md you wrote. Briefly highlight the non-obvious creative choices (descriptive color names, atmosphere language, named rules).
2. Mention that `DESIGN.json` was also written alongside — the live panel will now render this project's actual button/input/nav primitives instead of generic approximations.
3. Offer to refine any section: "Want me to revise a section, add component patterns I missed, or adjust the atmosphere language?"
4. **Refresh the session cache.** Run `node {{scripts_path}}/load-context.mjs` one final time so the newly-written DESIGN.md lands in conversation. Subsequent commands in this session will use the fresh version automatically without re-reading.

## Seed mode

For projects with no visual system to extract yet. Produces a minimal scaffold, not a full spec.

### Step 1: Confirm seed mode

Before interviewing: "There's no existing visual system to scan. I'll ask five quick questions to seed a starter DESIGN.md. You can re-run `/impeccable document` once there's code, to capture the real tokens and components. OK?"

If the user prefers to skip, stop. No file.

### Step 2: Five questions

Group into one `AskUserQuestion` interaction. Options must be concrete.

1. **Color strategy.** Pick one:
   - Restrained — tinted neutrals + one accent ≤10%
   - Committed — one saturated color carries 30–60% of the surface
   - Full palette — 3–4 named color roles, each deliberate
   - Drenched — the surface IS the color
   
   Then: one hue family or anchor reference ("deep teal", "mustard", "Klim #ff4500 orange").

2. **Typography direction.** Pick one (specific fonts come later):
   - Serif display + sans body
   - Single sans (warm / technical / geometric / humanist — pick a feel)
   - Display + mono
   - Mono-forward
   - Editorial script + sans

3. **Motion energy.** Pick one:
   - Restrained — state changes only
   - Responsive — feedback + transitions, no choreography
   - Choreographed — orchestrated entrances, scroll-driven sequences

4. **Three named references.** Brands, products, printed objects. Not adjectives.

5. **One anti-reference.** What it should NOT feel like. Also named.

### Step 3: Write seed DESIGN.md

Use the six-section spec from Scan mode. Populate what the interview answers; leave the rest as honest placeholders. The seed is a scaffold, not a fabricated spec.

Lead the file with:

```markdown
<!-- SEED — re-run /impeccable document once there's code to capture the actual tokens and components. -->
```

Per-section guidance in seed mode:

- **Overview**: Creative North Star and philosophy phrased from the answers (color strategy + motion energy + references). Reference the user's anti-reference directly.
- **Colors**: Color strategy as a Named Rule (e.g. *"The Drenched Rule. The surface IS the color."*). Hue family or anchor reference. No hex values — mark as `[to be resolved during implementation]`.
- **Typography**: the direction the user picked (e.g. "Serif display + sans body"). No font names yet — `[font pairing to be chosen at implementation]`.
- **Elevation**: inferred from motion energy. Restrained/Responsive → flat by default; Choreographed → layered. One sentence.
- **Components**: omit entirely — no components exist yet.
- **Do's and Don'ts**: carry PRODUCT.md's anti-references directly plus the anti-reference named in Q5.

Skip the `DESIGN.json` sidecar in seed mode. The live panel needs real tokens and components to render; there is nothing to show yet. The sidecar gets generated on the next Scan-mode run.

### Step 4: Confirm and refresh session cache

1. Show the seed DESIGN.md. Call out that it is a seed (the marker is the literal commitment).
2. Tell the user: "Re-run `/impeccable document` once you have some code. That pass will extract real tokens and generate the sidecar."
3. Run `node {{scripts_path}}/load-context.mjs` once so the seed lands in conversation for the rest of the session.

## Style guidelines

- **Match the spec, don't invent new sections.** The six section names are fixed. If you have Layout/Motion/Responsive content to document, fold it into Overview (philosophy-level rules) or Components (per-component behavior).
- **Descriptive > technical**: "Gently curved edges (8px radius)" > "rounded-lg". Include the technical value in parens, lead with the description.
- **Functional > decorative**: for each token, explain WHERE and WHY it's used, not just WHAT it is.
- **Exact values in parens**: hex codes, px/rem values, font weights — always the number in parens alongside the description.
- **Use Named Rules**: `**The [Name] Rule.** [short doctrine]`. These are memorable, citable, and much stickier for AI consumers than bullet lists. Stitch's own outputs use them heavily ("The No-Line Rule", "The Ghost Border Fallback"). Aim for 1-3 per section.
- **Be forceful**. The voice of a design director. "Prohibited", "forbidden", "never", "always" — not "consider", "might", "prefer". Match PRODUCT.md's tone.
- **Concrete anti-pattern tests**. Stitch writes things like *"If it looks like a 2014 app, the shadow is too dark and the blur is too small."* A one-sentence audit test beats a paragraph of principle.
- **Reference PRODUCT.md**. The anti-references section of PRODUCT.md should directly inform the Do's and Don'ts section here. Quote or paraphrase.
- **Group colors by role**, not by hex-order or hue-order. Primary / Secondary / Tertiary / Neutral is the spec ordering.

## Pitfalls

- Don't paste raw CSS class names. Translate to descriptive language.
- Don't extract every token. Stop at what's actually reused — one-offs pollute the system.
- Don't invent components that don't exist. If the project only has buttons and cards, only document those.
- Don't overwrite an existing DESIGN.md without asking.
- Don't duplicate content from PRODUCT.md. DESIGN.md is strictly visual.
- Don't add a "Layout Principles" or "Motion" or "Responsive Behavior" top-level section. The spec has six, not nine. Fold that content where it belongs.
- Don't rename sections even slightly. "Colors" not "Color Palette & Roles". "Typography" not "Typography Rules". Tooling parsing depends on exact headers.
