Generate a DESIGN.md file in the project root that captures the current visual design system, so AI agents generating new screens stay on-brand.

DESIGN.md follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/): a single markdown file at the project root with five fixed sections describing colors, typography, components, layout, and overall atmosphere. Keep section headers exactly as specified so the file stays compatible with other DESIGN.md-aware tools.

## When to run

- The user just ran `/impeccable teach` and needs the visual side documented.
- The skill noticed no `DESIGN.md` exists and nudged the user to create one.
- An existing `DESIGN.md` is stale (the design has drifted).
- Before a large redesign, to capture the current state as a reference.

If a `DESIGN.md` already exists, **do not silently overwrite it**. Show the user the existing file and ask the user directly to clarify what you cannot infer. whether to refresh it, overwrite it, or merge into it.

## Process (approach C: auto-extract, then confirm descriptive language)

### Step 1: Find the design assets

Search the codebase in priority order:

1. **CSS custom properties** — grep for `--color-`, `--font-`, `--spacing-`, `--radius-`, `--shadow-`, `--ease-`, `--duration-` declarations in CSS files (usually `src/styles/`, `public/css/`, `app/globals.css`, etc.). Record name, value, and the file it's defined in.
2. **Tailwind config** — if `tailwind.config.{js,ts,mjs}` exists, read the `theme.extend` block for colors, fontFamily, spacing, borderRadius, boxShadow.
3. **CSS-in-JS theme files** — if the project uses styled-components, emotion, vanilla-extract, stitches, etc., look for `theme.ts`, `tokens.ts`, or equivalent.
4. **Design token files** — `tokens.json`, `design-tokens.json`, Style Dictionary output, W3C token community group format.
5. **Component library** — scan the main button, card, input, navigation, dialog components. Note their variant APIs and default styles.
6. **Global stylesheet** — the root CSS file usually has the base typography and color assignments.
7. **Visible rendered output** — if browser automation tools are available, load the live site and sample computed styles from key elements (body, h1, a, button, .card). This catches values that tokens miss.

### Step 2: Auto-extract what can be auto-extracted

Build a structured draft from the discovered tokens. For each token class:

- **Colors**: Group by hue family. Convert hex → OKLCH to infer lightness/chroma. Identify background vs. text vs. accent by usage patterns in CSS (`background`, `color`, `border`, `fill`). Flag any that are only used once (possibly one-off, not system tokens).
- **Typography**: Extract font families and their declared stacks. Extract the scale (all `font-size` values used in CSS custom props + component styles). Extract weights actually used. Detect the scale ratio (1.125, 1.2, 1.25, 1.333, 1.5, golden).
- **Spacing**: Extract the scale, detect the base unit (4px, 8px, other).
- **Radii & shadows**: List the values used.
- **Components**: For each common component (button, card, input, nav, dialog), extract shape (radius), color assignment, hover/focus treatment, internal padding.

### Step 3: Ask the user for qualitative language

The following sections require creative input that cannot be auto-extracted reliably. ask the user directly to clarify what you cannot infer. for each (group them into one interaction if possible):

- **Visual Theme & Atmosphere**: mood adjectives (airy/dense, minimal/maximalist, editorial/utilitarian, warm/clinical), aesthetic philosophy in 2-3 sentences, key characteristics as a bullet list.
- **Color character** (for auto-extracted colors): descriptive names ("Deep Muted Teal-Navy", not "blue-800"). Suggest 2-3 options per color based on the hue/saturation, let the user pick.
- **Typographic character**: describe the font pairing ("Modern geometric sans-serif with humanist warmth" > "Manrope 500"). Describe letter-spacing strategy.
- **Spacing philosophy**: 1-2 sentences on whitespace strategy ("generous breathing room that prioritizes photography").
- **Component philosophy**: brief description of the feel of buttons, cards, inputs ("refined and understated" vs. "tactile and confident").

If the user has a `PRODUCT.md` that covers brand personality, quote a line from it so they see their own strategic language carry over.

### Step 4: Write DESIGN.md

Use this exact structure (section headers must match the Google spec character-for-character):

```markdown
# Design System: [Project Title]
**Project ID:** [optional — only if a Stitch project ID exists]

## 1. Visual Theme & Atmosphere

[2-3 paragraph description using evocative adjectives. Start with the overall sanctuary/laboratory/workshop/stage analogy if one fits. End with a short **Key Characteristics:** bullet list.]

## 2. Color Palette & Roles

### [Semantic group name: Primary Foundation, Accent & Interactive, Typography & Text Hierarchy, Functional States, etc.]
- **[Descriptive Name]** (#HEX) – [Functional role. Where/why it's used.]

## 3. Typography Rules

**Primary Font Family:** [Name]
**Character:** [1-sentence personality description.]

### Hierarchy & Weights
- **[Role (e.g. Display Headlines H1)]:** [Weight] weight ([num]), [letter-spacing], [size]. [Purpose.]

### Spacing Principles
[Short list of rules about leading, letter-spacing, vertical rhythm.]

## 4. Component Stylings

### Buttons
- **Shape:** [radius description with px value in parens]
- **Primary CTA:** [color assignment + padding]
- **Hover State:** [transition description]
- **Focus State:** [accessibility treatment]
- **Secondary CTA (if applicable):** [description]

### Cards & Containers
- **Corner Style:** [description]
- **Background:** [colors used]
- **Shadow Strategy:** [flat / soft / heavy]
- **Border:** [if any]
- **Internal Padding:** [scale]
- **Image Treatment:** [if relevant]

### Navigation
- [Style, typography, default/hover/active states, mobile treatment]

### Inputs/Forms
- [Stroke style, background, focus treatment]

## 5. Layout Principles

[Paragraph or short list describing whitespace strategy, margin scale, grid system, responsive breakpoints. Include px/rem values in parens.]
```

### Step 5: Write & confirm

1. Write the file to `PROJECT_ROOT/DESIGN.md` (uppercase, at root).
2. Show the user the full DESIGN.md you wrote, briefly highlighting the non-obvious creative choices (descriptive color names, atmosphere language).
3. Offer to refine any section: "Want me to revise a section, add component patterns I missed, or adjust the atmosphere language?"

## Style guidelines

- **Descriptive > technical**: "Gently curved edges (8px radius)" > "rounded-lg". Include the technical value in parens, lead with the description.
- **Functional > decorative**: for each token, explain WHERE and WHY it's used, not just WHAT it is.
- **Exact values in parens**: hex codes, px/rem values, font weights — always the number in parens alongside the description.
- **Group colors semantically**: Foundation (backgrounds), Accent (interactive), Typography (text hierarchy), States (success/warning/error), not hex-sorted.
- **Reference the user's domain**: if the project is a DEX, say "trading-focused"; if it's a CMS, say "editorial". Domain-aware language helps agents pick sensible defaults.

## Pitfalls

- Don't paste raw CSS class names. Translate to descriptive language.
- Don't extract every token. Stop at what's actually reused — one-offs pollute the system.
- Don't invent components that don't exist. If the project only has buttons and cards, only document those.
- Don't overwrite an existing DESIGN.md without asking.
- Don't duplicate content from PRODUCT.md. DESIGN.md is strictly visual.
