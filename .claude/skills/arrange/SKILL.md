---
name: arrange
description: Improve layout, spacing, and visual rhythm. Fixes monotonous grids, inconsistent spacing, and weak visual hierarchy to create intentional compositions.
user-invokable: true
args:
  - name: target
    description: The feature or component to improve layout for (optional)
    required: false
---

Assess and improve layout and spacing that feels monotonous, crowded, or structurally weak — turning generic arrangements into intentional, rhythmic compositions.

## MANDATORY PREPARATION

Use the frontend-design skill — it contains design principles, anti-patterns, and the **Context Gathering Protocol**. Follow the protocol before proceeding — if no design context exists yet, you MUST run teach-impeccable first.

---

## Assess Current Layout

Analyze what's weak about the current spatial design:

1. **Spacing**:
   - Is spacing consistent or arbitrary? (Random padding/margin values)
   - Is all spacing the same? (Equal padding everywhere = no rhythm)
   - Are related elements grouped tightly, with generous space between groups?

2. **Visual hierarchy**:
   - Apply the squint test: blur your eyes — can you still identify the most important element, second most important, and clear groupings?
   - Is hierarchy achieved through size alone, or through multiple dimensions? (Size + weight + color + space)
   - Does whitespace guide the eye to what matters?

3. **Grid & structure**:
   - Is there a clear underlying structure, or does the layout feel random?
   - Are identical card grids used everywhere? (Icon + heading + text, repeated endlessly)
   - Is everything centered? (Left-aligned with asymmetric layouts feels more designed)

4. **Rhythm & variety**:
   - Does the layout have visual rhythm? (Alternating tight/generous spacing)
   - Is every section structured the same way? (Monotonous repetition)
   - Are there intentional moments of surprise or emphasis?

5. **Density**:
   - Is the layout too cramped? (Not enough breathing room)
   - Is the layout too sparse? (Excessive whitespace without purpose)
   - Does density match the content type? (Data-dense UIs need tighter spacing; marketing pages need more air)

**CRITICAL**: Layout problems are often the root cause of interfaces feeling "off" even when colors and fonts are fine. Space is a design material — use it with intention.

## Plan Layout Improvements

Consult the [spatial design reference](reference/spatial-design.md) from the frontend-design skill for detailed guidance on grids, rhythm, and container queries.

Create a systematic plan:

- **Spacing system**: Establish a scale (4pt base: 4, 8, 12, 16, 24, 32, 48, 64, 96px)
- **Hierarchy strategy**: How will space, size, and position communicate importance?
- **Grid approach**: What structure fits the content? (Fixed grid, auto-fit, named areas)
- **Rhythm**: Where should spacing be tight vs generous?

## Improve Layout Systematically

### Establish a Spacing System

- Adopt a 4pt base grid for all spacing values
- Name tokens semantically: `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`
- Use `gap` for sibling spacing instead of margins — eliminates margin collapse hacks
- Apply `clamp()` for fluid spacing that breathes on larger screens

### Create Visual Rhythm

- **Tight grouping** for related elements (8-12px between siblings)
- **Generous separation** between distinct sections (48-96px)
- **Varied spacing** within sections — not every row needs the same gap
- **Asymmetric compositions** — break the predictable centered-content pattern when it makes sense

### Fix Grid & Structure

- Use `repeat(auto-fit, minmax(280px, 1fr))` for responsive grids without breakpoints
- Use named grid areas (`grid-template-areas`) for complex layouts — redefine at breakpoints
- Don't default to card grids for everything — spacing and alignment create visual grouping naturally
- Use cards only when content is truly distinct and actionable — never nest cards inside cards

### Strengthen Visual Hierarchy

- Combine dimensions: size + weight + color + space for strong hierarchy
- Surround important elements with generous whitespace — space draws attention
- Use position strategically: top-left reads as primary, bottom-right as secondary
- Create clear content groupings through proximity and separation

### Manage Depth & Elevation

- Create a semantic z-index scale (dropdown → sticky → modal-backdrop → modal → toast → tooltip)
- Build a consistent shadow scale (sm → md → lg → xl) — shadows should be subtle
- Use elevation to reinforce hierarchy, not as decoration

### Optical Adjustments

- Text at `margin-left: 0` looks indented — use small negative margin to optically align
- Geometrically centered icons often look off-center — adjust visually
- Touch targets need 44px minimum regardless of visual size — use padding or pseudo-elements

**NEVER**:
- Use arbitrary spacing values outside your scale
- Make all spacing equal — variety creates hierarchy
- Wrap everything in cards — not everything needs a container
- Nest cards inside cards — use spacing and dividers for hierarchy within
- Use identical card grids everywhere (icon + heading + text, repeated)
- Center everything — left-aligned with asymmetry feels more designed
- Use the hero metric layout template (big number, small label, stats, gradient)
- Rely on size alone for hierarchy — combine size, weight, color, and space
- Use arbitrary z-index values (999, 9999) — build a semantic scale

## Verify Layout Improvements

- **Squint test**: Can you identify primary, secondary, and groupings with blurred vision?
- **Rhythm**: Does the page have a satisfying beat of tight and generous spacing?
- **Hierarchy**: Is the most important content obvious within 2 seconds?
- **Breathing room**: Does the layout feel comfortable, not cramped or wasteful?
- **Consistency**: Is the spacing system applied uniformly?
- **Responsiveness**: Does the layout adapt gracefully across screen sizes?

Remember: Space is the most underused design tool. A layout with the right rhythm and hierarchy can make even simple content feel polished and intentional.