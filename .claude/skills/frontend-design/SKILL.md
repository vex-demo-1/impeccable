---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Apache 2.0. Based on Anthropic's frontend-design skill. See NOTICE.md for attribution.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Thinking

Great design requires understanding. First, scan available context—README, existing components, brand guidelines, design tokens—to infer purpose, audience, and constraints.

**BEFORE writing any code**, you MUST know:
- Who is the target audience?
- What is the brand personality or tone?
- Are there existing design tokens, colors, or fonts to use?

If ANY of these are unclear from the codebase, STOP and call the AskUserQuestionTool to clarify. Don't guess on fundamentals—wrong assumptions lead to generic output.

Then commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Typography
→ *Consult [typography reference](reference/typography.md) for scales, pairing, and loading strategies.*

Choose fonts that are beautiful, unique, and interesting. Pair a distinctive display font with a refined body font. Use a modular type scale with fluid sizing (clamp). Vary font weights and sizes to create clear visual hierarchy.

### Color & Theme
→ *Consult [color reference](reference/color-and-contrast.md) for OKLCH, palettes, and dark mode.*

Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Use modern CSS color functions (oklch, color-mix, light-dark) for perceptually uniform, maintainable palettes. Tint your neutrals toward your brand hue—even a subtle hint creates subconscious cohesion.

### Layout & Space
→ *Consult [spatial reference](reference/spatial-design.md) for grids, rhythm, and container queries.*

Create visual rhythm through varied spacing—tight groupings, generous separations. Use fluid spacing with clamp() that breathes on larger screens. Embrace asymmetry and unexpected compositions. Break the grid intentionally for emphasis.

### Motion
→ *Consult [motion reference](reference/motion-design.md) for timing, easing, and reduced motion.*

Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Use motion to convey state changes—entrances, exits, feedback. Use exponential easing (ease-out-quart/quint/expo) for natural deceleration. For height animations, use grid-template-rows transitions instead of animating height directly.

### Interaction
→ *Consult [interaction reference](reference/interaction-design.md) for forms, focus, and loading patterns.*

Make interactions feel fast. Use optimistic UI—update immediately, sync later. Use progressive disclosure—start simple, reveal sophistication through interaction. Design empty states that teach the interface, not just say "nothing here". Make every interactive surface feel intentional and responsive.

### Responsive
→ *Consult [responsive reference](reference/responsive-design.md) for mobile-first, fluid design, and container queries.*

Use container queries (@container) for component-level responsiveness. Adapt the interface for different contexts—don't just shrink it.

### UX Writing
→ *Consult [ux-writing reference](reference/ux-writing.md) for labels, errors, and empty states.*

Make every word earn its place.

---

## Anti-Patterns (CRITICAL)

**This is the most important section.** These patterns make interfaces look generic, dated, or obviously AI-generated. Avoid ALL of them:

### AI Slop Tells
These scream "AI made this" and have become fingerprints for AI-generated work from 2024-2025:

- **The AI color palette**: Cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
- **Purple-to-blue gradients on white**: The #1 "AI marketing site" tell
- **Gradient text for "impact"**: Especially on metrics or headings—decorative rather than meaningful
- **Default dark mode with glowing accents**: Looks "cool" without requiring actual design decisions
- **Glassmorphism everywhere**: Blur effects, glass cards, glow borders used decoratively rather than purposefully
- **Rounded element with thick colored border on one side**: A lazy accent that almost never looks intentional
- **Hero metric layout**: Big number, small label, supporting stats below, gradient accent—it's a template
- **Identical card grids**: Same-sized cards with icon + heading + text, repeated endlessly
- **Sparklines as decoration**: Tiny charts that look sophisticated but convey nothing meaningful
- **Large rounded icons above every heading**: Rarely adds value, makes sites look templated
- **Inter, Roboto, Arial, Open Sans, system fonts**: The path of least resistance
- **Monospace typography for "technical" vibes**: Lazy shorthand for "this is for developers"
- **Rounded rectangles with generic drop shadows**: Safe, forgettable, could be any AI output

### Design Anti-Patterns
These are just bad design, AI or not:

- **Gray text on colored backgrounds**: Looks washed out—use a shade of the background color instead
- **Pure black (#000) or pure white (#fff)**: Always tint; pure black/white never appears in nature
- **Wrap everything in cards**: Not everything needs a container
- **Nest cards inside cards**: Visual noise—flatten the hierarchy
- **Modals for everything**: Modals are lazy; find a better alternative
- **Center everything**: Left-aligned text with asymmetric layouts feels more designed
- **Same spacing everywhere**: Without rhythm, layouts feel monotonous
- **Animate layout properties**: Use transform and opacity only, never width/height/padding/margin
- **Bounce or elastic easing**: Feels dated and tacky; real objects decelerate smoothly
- **Redundant copy**: Headers restating intros, repeated explanations
- **Every button is primary**: Use ghost buttons, text links, secondary styles; hierarchy matters
- **Hide functionality on mobile**: Adapt the interface, don't amputate it
- **Repeat information**: If users can already see it, don't say it again

### The Test
If you showed this interface to someone and said "AI made this," would they believe you immediately? If yes, that's the problem. A distinctive interface should make someone ask "how was this made?" not "which AI made this?"

---

## Implementation Principles

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

Remember: Claude is capable of extraordinary creative work. Don't hold back—show what can truly be created when thinking outside the box and committing fully to a distinctive vision.