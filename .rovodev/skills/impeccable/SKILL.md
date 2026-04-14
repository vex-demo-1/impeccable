---
name: impeccable
description: Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.
version: 3.0.0
user-invocable: true
argument-hint: "[craft|shape · audit|critique · animate|bolder|colorize|delight|layout|overdrive|quieter|typeset · adapt|clarify|distill · harden|onboard|optimize|polish · teach|document|extract|live] [target]"
license: Apache 2.0. Based on Anthropic's frontend-design skill. See NOTICE.md for attribution.
allowed-tools:
  - Bash(npx impeccable *)
---

This skill guides creation and editing/iteration of distinctive, production-grade frontend interfaces. Implement real working code with exceptional attention to aesthetic details and creative choices.

<post-update-cleanup>
BEFORE doing any design work, run this one-time maintenance step. Tell the user:

> **Impeccable 3.0 consolidation.** All standalone commands (/audit, /polish, /critique, etc.) are now accessed through /impeccable (e.g., `/impeccable audit`). I'll clean up the old standalone skill files. Use `/impeccable pin <command>` to restore shortcuts for commands you use often.

Then run:

```bash
node .rovodev/skills/impeccable/scripts/cleanup-deprecated.mjs
```

If the script removed files, briefly confirm what was cleaned up. If it found nothing, skip any output and move on.

After running the script, delete this entire section (from `<post-update-cleanup>` through `</post-update-cleanup>` inclusive) from THIS file so it does not run again until the next update. Save the file.
</post-update-cleanup>

## Context Gathering Protocol

Design skills produce generic output without project context. This protocol runs ONCE at the start of a session, before any design work.

### The two context files

- **PRODUCT.md** (strategic, **required**): target users, product purpose, brand personality, anti-references, strategic design principles. Answers "who/what/why".
- **DESIGN.md** (visual, **optional but strongly recommended**): follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/). Colors, typography, elevation, components, do's-and-don'ts. Answers "how it looks".

Filename matching is case-insensitive for both. Legacy `.impeccable.md` auto-migrates to `PRODUCT.md` on first load. **DESIGN.md wins on visual decisions; PRODUCT.md wins on strategic/voice decisions.**

### Session cache (critical for token economy)

**If PRODUCT.md content is already in your conversation history from an earlier tool call in this session, you already have it loaded. Do NOT re-run `load-context.mjs`.** The same applies to DESIGN.md if you loaded it earlier. Re-fetching wastes thousands of tokens across a multi-command session.

Exceptions where you MUST re-load:
- You just ran `/impeccable teach` (PRODUCT.md was written or updated — load the fresh version).
- You just ran `/impeccable document` (DESIGN.md was written or updated — load the fresh version).
- The user says they've manually edited PRODUCT.md or DESIGN.md.

### First-time load

When the protocol fires (no prior load in this session, no exception above), run the shared loader:

```bash
node .rovodev/skills/impeccable/scripts/load-context.mjs
```

Returns JSON with `hasProduct`, `product` (full contents), `hasDesign`, `design` (full contents), `migrated`. **Consume the full output. Never pipe through `head`, `tail`, `grep`, or `jq` with field filters — you need the complete file contents to do your job.** Token cost of the full load is ~2-20KB, far less than redoing work with missing context.

### Dispatch on result

- **`hasProduct: true` AND the content is substantive** (>200 chars, no `[TODO]` placeholders):
  - If `hasDesign: true`: proceed. You have full context.
  - If `hasDesign: false`: do a one-line nudge to the user (say it once per session): *"Note: no DESIGN.md found. I'll use impeccable's built-in design principles. For more on-brand output, run `/impeccable document` to generate a DESIGN.md from your existing code."* Then proceed.
- **`hasProduct: false`** OR the file exists but is empty / full of `[TODO]` placeholders:
  1. Tell the user: *"I need PRODUCT.md before I can do this well. Running `/impeccable teach` now — I'll resume `[original task]` after."*
  2. Run `/impeccable teach`.
  3. When teach completes, re-run `load-context.mjs` and resume the **original** task the user asked for. Do not silently abandon intent.

### Exceptions (commands that skip or reshape the protocol)

- **`/impeccable teach`**: skips this protocol entirely — teach is how PRODUCT.md (and optionally DESIGN.md) get CREATED. Don't try to load before you create.
- **`/impeccable document`**: load PRODUCT.md (voice input) but do NOT block on missing DESIGN.md — document is how DESIGN.md gets created.
- **`/impeccable live`**: `live.mjs` already invokes the loader internally and returns both files in its startup JSON. When you've run `live.mjs`, the context is warmed. Do NOT additionally run `load-context.mjs` in the same session.

### Why this matters

- **Generic output is the #1 failure mode** of impeccable without PRODUCT.md. The user asked for polish and got a stock-looking polish because Claude had no tone to polish toward.
- **Warmed live sessions feel instant** because when the user finally clicks Generate in the browser, Claude already has PRODUCT + DESIGN in context and proceeds straight to variant generation.
- **Token-efficient sessions** let the user run `/impeccable polish`, then `/impeccable audit`, then `/impeccable layout` without re-reading context files three times.

---

## Design Direction

Commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work. The key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Typography
→ *Consult [typography reference](reference/typography.md) for OpenType features, web font loading, and the deeper material on scales.*

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font.

<typography_principles>
Always apply these — do not consult a reference, just do them:

- Use a modular type scale with fluid sizing (clamp) for headings on marketing/content pages. Use fixed `rem` scales for app UIs and dashboards (no major design system uses fluid type in product UI).
- Use fewer sizes with more contrast. A 5-step scale with at least a 1.25 ratio between steps creates clearer hierarchy than 8 sizes that are 1.1× apart.
- Line-height scales inversely with line length. Narrow columns want tighter leading, wide columns want more. For light text on dark backgrounds, ADD 0.05-0.1 to your normal line-height — light type reads as lighter weight and needs more breathing room.
- Cap line length at ~65-75ch. Body text wider than that is fatiguing.
</typography_principles>

<font_selection_procedure>
DO THIS BEFORE TYPING ANY FONT NAME.

The model's natural failure mode is "I was told not to use Inter, so I will pick my next favorite font, which becomes the new monoculture." Avoid this by performing the following procedure on every project, in order:

Step 1. Read the brief once. Write down 3 concrete words for the brand voice (e.g., "warm and mechanical and opinionated", "calm and clinical and careful", "fast and dense and unimpressed", "handmade and a little weird"). NOT "modern" or "elegant" — those are dead categories.

Step 2. List the 3 fonts you would normally reach for given those words. Write them down. They are most likely from this list:

<reflex_fonts_to_reject>
Fraunces
Newsreader
Lora
Crimson
Crimson Pro
Crimson Text
Playfair Display
Cormorant
Cormorant Garamond
Syne
IBM Plex Mono
IBM Plex Sans
IBM Plex Serif
Space Mono
Space Grotesk
Inter
DM Sans
DM Serif Display
DM Serif Text
Outfit
Plus Jakarta Sans
Instrument Sans
Instrument Serif
</reflex_fonts_to_reject>

Reject every font that appears in the reflex_fonts_to_reject list. They are your training-data defaults and they create monoculture across projects.

Step 3. Browse a font catalog with the 3 brand words in mind. Sources: Google Fonts, Pangram Pangram, Future Fonts, Adobe Fonts, ABC Dinamo, Klim Type Foundry, Velvetyne. Look for something that fits the brand as a *physical object* — a museum exhibit caption, a hand-painted shop sign, a 1970s mainframe terminal manual, a fabric label on the inside of a coat, a children's book printed on cheap newsprint. Reject the first thing that "looks designy" — that's the trained reflex too. Keep looking.

Step 4. Cross-check the result. The right font for an "elegant" brief is NOT necessarily a serif. The right font for a "technical" brief is NOT necessarily a sans-serif. The right font for a "warm" brief is NOT Fraunces. If your final pick lines up with your reflex pattern, go back to Step 3.
</font_selection_procedure>

<typography_rules>
DO use a modular type scale with fluid sizing (clamp) on headings.
DO vary font weights and sizes to create clear visual hierarchy.
DO vary your font choices across projects. If you used a serif display font on the last project, look for a sans, monospace, or display face on this one.

DO NOT use overused fonts like Inter, Roboto, Arial, Open Sans, or system defaults — but also do not simply switch to your second-favorite. Every font in the reflex_fonts_to_reject list above is banned. Look further.
DO NOT use monospace typography as lazy shorthand for "technical/developer" vibes.
DO NOT put large icons with rounded corners above every heading. They rarely add value and make sites look templated.
DO NOT use only one font family for the entire page. Pair a distinctive display font with a refined body font.
DO NOT use a flat type hierarchy where sizes are too close together. Aim for at least a 1.25 ratio between steps.
DO NOT set long body passages in uppercase. Reserve all-caps for short labels and headings.
</typography_rules>

### Color & Theme
→ *Consult [color reference](reference/color-and-contrast.md) for the deeper material on contrast, accessibility, and palette construction.*

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

<color_principles>
Always apply these — do not consult a reference, just do them:

- Use OKLCH, not HSL. OKLCH is perceptually uniform: equal steps in lightness *look* equal, which HSL does not deliver. As you move toward white or black, REDUCE chroma — high chroma at extreme lightness looks garish. A light blue at 85% lightness wants ~0.08 chroma, not the 0.15 of your base color.
- Tint your neutrals toward your brand hue. Even a chroma of 0.005-0.01 is perceptible and creates subconscious cohesion between brand color and UI surfaces. The hue you tint toward should come from THIS brand, not from a "warm = friendly" or "cool = tech" formula. Pick the brand's actual hue first, then tint everything toward it.
- The 60-30-10 rule is about visual *weight*, not pixel count. 60% neutral / surface, 30% secondary text and borders, 10% accent. Accents work BECAUSE they're rare. Overuse kills their power.
</color_principles>

<theme_selection>
Theme (light vs dark) should be DERIVED from audience and viewing context, not picked from a default. Read the brief and ask: when is this product used, by whom, in what physical setting?

- A perp DEX consumed during fast trading sessions → dark
- A hospital portal consumed by anxious patients on phones late at night → light
- A children's reading app → light
- A vintage motorcycle forum where users sit in their garage at 9pm → dark
- An observability dashboard for SREs in a dark office → dark
- A wedding planning checklist for couples on a Sunday morning → light
- A music player app for headphone listening at night → dark
- A food magazine homepage browsed during a coffee break → light

Do not default everything to light "to play it safe." Do not default everything to dark "to look cool." Both defaults are the lazy reflex. The correct theme is the one the actual user wants in their actual context.
</theme_selection>

<color_rules>
DO use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes.
DO tint your neutrals toward your brand hue. Even a subtle hint creates subconscious cohesion.

DO NOT use gray text on colored backgrounds; it looks washed out. Use a shade of the background color instead.
DO NOT use pure black (#000) or pure white (#fff). Always tint; pure black/white never appears in nature.
DO NOT use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds.
DO NOT use gradient text for impact — see <absolute_bans> below for the strict definition. Solid colors only for text.
DO NOT default to dark mode with glowing accents. It looks "cool" without requiring actual design decisions.
DO NOT default to light mode "to be safe" either. The point is to choose, not to retreat to a safe option.
</color_rules>

### Layout & Space
→ *Consult [spatial reference](reference/spatial-design.md) for the deeper material on grids, container queries, and optical adjustments.*

Create visual rhythm through varied spacing, not the same padding everywhere. Embrace asymmetry and unexpected compositions. Break the grid intentionally for emphasis.

<spatial_principles>
Always apply these — do not consult a reference, just do them:

- Use a 4pt spacing scale with semantic token names (`--space-sm`, `--space-md`), not pixel-named (`--spacing-8`). Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. 8pt is too coarse — you'll often want 12px between two values.
- Use `gap` instead of margins for sibling spacing. It eliminates margin collapse and the cleanup hacks that come with it.
- Vary spacing for hierarchy. A heading with extra space above it reads as more important — make use of that. Don't apply the same padding everywhere.
- Self-adjusting grid pattern: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` is the breakpoint-free responsive grid for card-style content.
- Container queries are for components, viewport queries are for page layout. A card in a sidebar should adapt to the sidebar's width, not the viewport's.
</spatial_principles>

<spatial_rules>
DO create visual rhythm through varied spacing: tight groupings, generous separations.
DO use fluid spacing with clamp() that breathes on larger screens.
DO use asymmetry and unexpected compositions; break the grid intentionally for emphasis.

DO NOT wrap everything in cards. Not everything needs a container.
DO NOT nest cards inside cards. Visual noise; flatten the hierarchy.
DO NOT use identical card grids (same-sized cards with icon + heading + text, repeated endlessly).
DO NOT use the hero metric layout template (big number, small label, supporting stats, gradient accent).
DO NOT center everything. Left-aligned text with asymmetric layouts feels more designed.
DO NOT use the same spacing everywhere. Without rhythm, layouts feel monotonous.
DO NOT let body text wrap beyond ~80 characters per line. Add a max-width like 65–75ch so the eye can track easily.
</spatial_rules>

### Visual Details

<absolute_bans>
These CSS patterns are NEVER acceptable. They are the most recognizable AI design tells. Match-and-refuse: if you find yourself about to write any of these, stop and rewrite the element with a different structure entirely.

BAN 1: Side-stripe borders on cards/list items/callouts/alerts
  - PATTERN: `border-left:` or `border-right:` with width greater than 1px
  - INCLUDES: hard-coded colors AND CSS variables
  - FORBIDDEN: `border-left: 3px solid red`, `border-left: 4px solid #ff0000`, `border-left: 4px solid var(--color-warning)`, `border-left: 5px solid oklch(...)`, etc.
  - WHY: this is the single most overused "design touch" in admin, dashboard, and medical UIs. It never looks intentional regardless of color, radius, opacity, or whether the variable name is "primary" or "warning" or "accent."
  - REWRITE: use a different element structure entirely. Do not just swap to box-shadow inset. Reach for full borders, background tints, leading numbers/icons, or no visual indicator at all.

BAN 2: Gradient text
  - PATTERN: `background-clip: text` (or `-webkit-background-clip: text`) combined with a gradient background
  - FORBIDDEN: any combination that makes text fill come from a `linear-gradient`, `radial-gradient`, or `conic-gradient`
  - WHY: gradient text is decorative rather than meaningful and is one of the top three AI design tells
  - REWRITE: use a single solid color for text. If you want emphasis, use weight or size, not gradient fill.
</absolute_bans>

DO: Use intentional, purposeful decorative elements that reinforce brand.
DO NOT: Use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, callouts, or alerts. See <absolute_bans> above for the strict CSS pattern.
DO NOT: Use glassmorphism everywhere (blur effects, glass cards, glow borders used decoratively rather than purposefully).
DO NOT: Use sparklines as decoration. Tiny charts that look sophisticated but convey nothing meaningful.
DO NOT: Use rounded rectangles with generic drop shadows. Safe, forgettable, could be any AI output.
DO NOT: Use modals unless there's truly no better alternative. Modals are lazy.

### Motion
→ *Consult [motion reference](reference/motion-design.md) for timing, easing, and reduced motion.*

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

**DO**: Use motion to convey state changes: entrances, exits, feedback
**DO**: Use exponential easing (ease-out-quart/quint/expo) for natural deceleration
**DO**: For height animations, use grid-template-rows transitions instead of animating height directly
**DON'T**: Animate layout properties (width, height, padding, margin). Use transform and opacity only
**DON'T**: Use bounce or elastic easing. They feel dated and tacky; real objects decelerate smoothly

### Interaction
→ *Consult [interaction reference](reference/interaction-design.md) for forms, focus, and loading patterns.*

Make interactions feel fast. Use optimistic UI: update immediately, sync later.

**DO**: Use progressive disclosure. Start simple, reveal sophistication through interaction (basic options first, advanced behind expandable sections; hover states that reveal secondary actions)
**DO**: Design empty states that teach the interface, not just say "nothing here"
**DO**: Make every interactive surface feel intentional and responsive
**DON'T**: Repeat the same information (redundant headers, intros that restate the heading)
**DON'T**: Make every button primary. Use ghost buttons, text links, secondary styles; hierarchy matters

### Responsive
→ *Consult [responsive reference](reference/responsive-design.md) for mobile-first, fluid design, and container queries.*

**DO**: Use container queries (@container) for component-level responsiveness
**DO**: Adapt the interface for different contexts, not just shrink it
**DON'T**: Hide critical functionality on mobile. Adapt the interface, don't amputate it

### UX Writing
→ *Consult [ux-writing reference](reference/ux-writing.md) for labels, errors, and empty states.*

**DO**: Make every word earn its place
**DON'T**: Repeat information users can already see

---

## The AI Slop Test

**Critical quality check**: If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem.

A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

Review the DON'T guidelines above. They are the fingerprints of AI-generated work.

---

## Implementation Principles

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

Remember: Rovo Dev is capable of extraordinary creative work. Don't hold back. Show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## Command Router

This skill supports sub-commands. Parse the first word of the argument string to determine routing.

### Routing rules

1. **No argument at all** (user typed just `/impeccable`): Display the command menu below, then ask the user what they'd like to do.
2. **First word matches a sub-command**: Route to that command's reference file. Everything after the sub-command name is the target.
3. **First word does NOT match any sub-command**: This is a general design invocation. Follow the Design Direction and Implementation Principles above, using the full argument string as context.

### Command menu (display when invoked with no argument)

> **Available commands:**
>
> **Build & Plan**
> `/impeccable craft [feature]` - Shape, then build a feature end-to-end
> `/impeccable shape [feature]` - Plan UX/UI before writing code
> `/impeccable teach` - Set up PRODUCT.md and DESIGN.md context for this project
> `/impeccable document` - Generate DESIGN.md from existing project code
> `/impeccable extract [target]` - Pull reusable tokens and components into design system
>
> **Evaluate**
> `/impeccable critique [target]` - UX design review with heuristic scoring
> `/impeccable audit [target]` - Technical quality checks (a11y, perf, responsive)
>
> **Refine**
> `/impeccable polish [target]` - Final quality pass before shipping
> `/impeccable bolder [target]` - Amplify safe/bland designs
> `/impeccable quieter [target]` - Tone down aggressive/overstimulating designs
> `/impeccable distill [target]` - Strip to essence, remove complexity
> `/impeccable harden [target]` - Production-ready: errors, i18n, edge cases
> `/impeccable onboard [target]` - Design first-run flows, empty states, activation
>
> **Enhance**
> `/impeccable animate [target]` - Add purposeful animations and motion
> `/impeccable colorize [target]` - Add strategic color to monochromatic UIs
> `/impeccable typeset [target]` - Improve typography hierarchy and fonts
> `/impeccable layout [target]` - Fix spacing, rhythm, and visual hierarchy
> `/impeccable delight [target]` - Add personality and memorable touches
> `/impeccable overdrive [target]` - Push past conventional limits
>
> **Fix**
> `/impeccable clarify [target]` - Improve UX copy, labels, and error messages
> `/impeccable adapt [target]` - Adapt for different devices and screen sizes
> `/impeccable optimize [target]` - Diagnose and fix UI performance
>
> **Iterate**
> `/impeccable live` - Visual variant mode: pick elements in the browser, generate alternatives
>
> **Manage**
> `/impeccable pin <command>` - Create a standalone shortcut (e.g., pin audit creates /audit)
> `/impeccable unpin <command>` - Remove a pinned shortcut
>
> Or use `/impeccable [description]` directly to apply design principles to any task.

### Sub-command reference table

When a sub-command is matched, load the linked reference and follow its instructions. The design principles, guidelines, and Context Gathering Protocol from this skill are already loaded. Do NOT re-invoke /impeccable.

| Command | Reference | Summary |
|---------|-----------|---------|
| `craft` | [craft](reference/craft.md) | Full shape-then-build flow with visual iteration |
| `teach` | [teach](reference/teach.md) | One-time setup: gather design context for the project |
| `extract` | [extract](reference/extract.md) | Pull reusable tokens and components into design system |
| `document` | [document](reference/document.md) | Generate DESIGN.md from existing project code (visual design system doc) |
| `shape` | [shape](reference/shape.md) | Plan UX and UI before writing code (produces a design brief) |
| `critique` | [critique](reference/critique.md) | UX design review with heuristic scoring and persona testing |
| `audit` | [audit](reference/audit.md) | Technical quality checks across a11y, perf, theming, responsive, anti-patterns |
| `polish` | [polish](reference/polish.md) | Final quality pass: alignment, spacing, consistency, micro-details |
| `bolder` | [bolder](reference/bolder.md) | Amplify safe or boring designs for more visual impact |
| `quieter` | [quieter](reference/quieter.md) | Tone down visually aggressive or overstimulating designs |
| `distill` | [distill](reference/distill.md) | Strip designs to their essence, remove unnecessary complexity |
| `harden` | [harden](reference/harden.md) | Production-ready: error handling, i18n, text overflow, edge cases |
| `onboard` | [onboard](reference/onboard.md) | Design onboarding flows, first-run experiences, and empty states that guide users to value |
| `animate` | [animate](reference/animate.md) | Add purposeful animations and micro-interactions |
| `colorize` | [colorize](reference/colorize.md) | Add strategic color to monochromatic interfaces |
| `typeset` | [typeset](reference/typeset.md) | Improve typography: fonts, hierarchy, sizing, readability |
| `layout` | [layout](reference/layout.md) | Improve layout, spacing, and visual rhythm |
| `delight` | [delight](reference/delight.md) | Add personality, joy, and memorable touches |
| `overdrive` | [overdrive](reference/overdrive.md) | Push interfaces past conventional limits |
| `clarify` | [clarify](reference/clarify.md) | Improve UX copy, labels, error messages, and microcopy |
| `adapt` | [adapt](reference/adapt.md) | Adapt designs across screen sizes, devices, and platforms |
| `optimize` | [optimize](reference/optimize.md) | Diagnose and fix UI performance issues |
| `live` | [live](reference/live.md) | Interactive visual variant mode: pick elements, generate alternatives in the browser |

---

## Pin / Unpin

If this skill is invoked with `pin <command>` or `unpin <command>`:

**pin** creates a lightweight standalone skill so you can invoke the command directly (e.g., `/audit` instead of `/impeccable audit`).

**unpin** removes a previously pinned shortcut.

Run:
```bash
node .rovodev/skills/impeccable/scripts/pin.mjs <pin|unpin> <command>
```

Report what the script did. If it succeeded, confirm the new shortcut is available (for pin) or removed (for unpin).