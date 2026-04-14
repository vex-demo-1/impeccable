# Teach Flow

Gathers design context for a project and writes two complementary files at the project root:

- **PRODUCT.md** (strategic): target users, product purpose, brand personality, anti-references, strategic design principles. Answers "who/what/why".
- **DESIGN.md** (visual): visual theme, color palette, typography, components, layout. Follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/). Answers "how it looks".

Every other impeccable command reads these files before doing any work.

## Step 1: Load current state

Run the shared loader first so you know what already exists:

```bash
node {{scripts_path}}/load-context.mjs
```

The output tells you whether PRODUCT.md and/or DESIGN.md already exist. If `migrated: true`, legacy `.impeccable.md` was auto-renamed to `PRODUCT.md`. Mention this once to the user.

Decision tree:
- **Neither file exists (empty project or no context yet)**: do Steps 2-4 (write PRODUCT.md), then decide on DESIGN.md based on whether there's code to analyze.
- **PRODUCT.md exists, DESIGN.md missing**: skip to Step 5 — offer to run `/impeccable document` for DESIGN.md.
- **Both exist**: STOP and call the `question` tool to clarify. which to refresh. Skip the one the user doesn't want changed.
- **Just DESIGN.md exists (unusual)**: do Steps 2-4 to produce PRODUCT.md.

Never silently overwrite an existing file. Always confirm first.

## Step 2: Explore the codebase

Before asking questions, thoroughly scan the project to discover what you can:

- **README and docs**: Project purpose, target audience, any stated goals
- **Package.json / config files**: Tech stack, dependencies, existing design libraries
- **Existing components**: Current design patterns, spacing, typography in use
- **Brand assets**: Logos, favicons, color values already defined
- **Design tokens / CSS variables**: Existing color palettes, font stacks, spacing scales
- **Any style guides or brand documentation**

Note what you've learned and what remains unclear. This exploration feeds both PRODUCT.md and DESIGN.md.

## Step 3: Ask strategic questions (for PRODUCT.md)

STOP and call the `question` tool to clarify. Focus only on what you couldn't infer from the codebase:

### Users & Purpose
- Who uses this? What's their context when using it?
- What job are they trying to get done?
- What emotions should the interface evoke? (confidence, delight, calm, urgency, etc.)

### Brand & Personality
- How would you describe the brand personality in 3 words?
- Any reference sites or apps that capture the right feel? What specifically about them?
- What should this explicitly NOT look like? Any anti-references?

### Accessibility & Inclusion
- Specific accessibility requirements? (WCAG level, known user needs)
- Considerations for reduced motion, color blindness, or other accommodations?

Skip questions where the answer is already clear. **Do NOT ask about colors, fonts, radii, or visual styling here** — those belong in DESIGN.md, not PRODUCT.md.

## Step 4: Write PRODUCT.md

Synthesize into a strategic document:

```markdown
# Product

## Users
[Who they are, their context, the job to be done]

## Product Purpose
[What this product does, why it exists, what success looks like]

## Brand Personality
[Voice, tone, 3-word personality, emotional goals]

## Anti-references
[What this should NOT look like. Specific bad-example sites or patterns to avoid.]

## Design Principles
[3-5 strategic principles derived from the conversation. Principles like "practice what you preach", "editorial over marketing", "expert confidence" — NOT visual rules like "use OKLCH" or "magenta accent".]

## Accessibility & Inclusion
[WCAG level, known user needs, considerations]
```

Write to `PROJECT_ROOT/PRODUCT.md`. If `.impeccable.md` existed, the loader already renamed it — merge into that content rather than starting from scratch.

## Step 5: Decide on DESIGN.md

If the project has meaningful code to analyze (CSS tokens, components, a running site), **offer to run `/impeccable document`** next: "I can also generate a DESIGN.md that captures your visual design system (colors, typography, components) so variants stay on-brand. Want to do that now?"

If the user agrees, delegate to `/impeccable document` (load its reference and follow that flow).

If the project is empty (no code yet, pre-implementation), skip DESIGN.md — there's nothing visual to document yet. Mention: "Once you've built some of the interface, run `/impeccable document` to generate a DESIGN.md."

## Step 6: Confirm and wrap up

Summarize:
- What was written (PRODUCT.md, DESIGN.md, or both)
- The 3-5 strategic principles from PRODUCT.md that will guide future work
- If DESIGN.md is pending, remind the user how to generate it later

Optionally STOP and call the `question` tool to clarify. whether they'd like a brief summary of PRODUCT.md appended to AGENTS.md for easier agent reference. If yes, append a short **Design Context** pointer section there.
