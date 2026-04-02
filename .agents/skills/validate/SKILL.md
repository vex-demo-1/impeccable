---
name: validate
description: Fast visual validation after UX/UI changes. Checks anti-patterns, spacing consistency, design system adherence, and copy quality in a single pass. Use after completing any UI work, when the user wants a quick quality check, or proactively after implementing a feature.
user-invocable: true
argument-hint: "[area to validate]"
---

## MANDATORY PREPARATION

Invoke /impeccable -- it contains design principles, anti-patterns, and the **Context Gathering Protocol**. Follow the protocol before proceeding -- if no design context exists yet, you MUST run /impeccable teach first.

---

A fast, focused quality gate. Not a full audit or critique -- this is the 2-minute check you run after every UI change to catch the most common and damaging issues before they ship.

Think of this as a design linter: opinionated, fast, and actionable. Flag what's wrong, say how to fix it, move on.

## When to Run

Run /validate after:
- Implementing or modifying any UI component
- Completing a feature's visual design
- Before requesting a design review from a human
- Any time you're about to mark UI work as "done"

## Validation Pass

Read the changed files. If browser automation is available, take a screenshot for visual inspection. Then run through ALL of the following checks in a single pass. Be fast and direct.

### 1. Anti-Pattern Scan

Check against ALL **DON'T** guidelines in the impeccable skill. The most common offenders:
- AI color palette (purple gradients, cyan-on-dark, neon glows)
- Identical card grids, hero metric layouts
- Overused fonts (Inter, Roboto, system defaults)
- Glassmorphism, gradient text, dark-mode-by-default
- Cards inside cards, everything centered, modals for everything

**The test**: Would someone immediately guess an AI made this?

### 2. Spacing & Rhythm

- Are margins, paddings, and gaps consistent within the same visual context?
- Is there varied rhythm (tight groupings vs generous separations), or is everything evenly spaced?
- Do similar elements at the same hierarchy level use the same spacing?
- Are spacing values from the design system tokens, or are there magic numbers?

### 3. Design System Adherence

- Are colors from the project's palette/tokens, or are there one-off hex values?
- Are font sizes, weights, and families from the type scale?
- Do border radii, shadows, and transitions match existing patterns?
- Are interactive elements styled consistently with others of the same type?

### 4. Visual Consistency

- Do elements that should look the same actually look the same?
- Is the visual hierarchy clear? (One primary action, clear reading order)
- Are alignment and grid lines maintained across the section?
- Do hover/focus/active states exist and feel consistent?

### 5. Copy Quality

- Is any text redundant with what's already visible? (Headers restating the page title, labels repeating obvious context)
- Are labels, buttons, and messages concise? Every word should earn its place.
- Is the tone consistent with the rest of the interface?
- Are error/empty/loading states handled with helpful copy?

## Output Format

Report findings as a flat list, grouped by severity:

**Severity levels:**
- **P0 -- Broken**: Visually broken, inaccessible, or fundamentally wrong. Fix before shipping.
- **P1 -- Anti-pattern**: Clear design anti-pattern that undermines quality. Fix now.
- **P2 -- Inconsistency**: Spacing, token, or style drift from the design system. Fix soon.
- **P3 -- Polish**: Minor refinement opportunity. Fix if time allows.

For each finding:
```
[P0-P3] [Category] Short description of what's wrong
  → Fix: Concrete action to take (file:line if applicable)
```

Keep the total list short. If everything looks good, say so -- don't invent issues.

## After Validation

If P0 or P1 issues are found, fix them immediately. For P2/P3 issues, ask the user directly to clarify what you cannot infer. whether the user wants them addressed now or noted for later.

If the issues map cleanly to an existing command (e.g., spacing issues → /arrange, copy issues → /clarify), suggest that command instead of fixing manually.