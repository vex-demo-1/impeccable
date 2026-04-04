---
name: craft
description: Design and build ideal UX+UI for a feature through guided discovery. Interviews the user about purpose, audience, and design goals before implementing. Use when building a new feature, redesigning an existing one, or when the user wants a thoughtful, user-centered design process rather than jumping straight to code.
user-invocable: true
argument-hint: "[feature to design]"
---

## MANDATORY PREPARATION

Invoke /impeccable -- it contains design principles, anti-patterns, and the **Context Gathering Protocol**. Follow the protocol before proceeding -- if no design context exists yet, you MUST run /impeccable teach first.

---

Build the ideal UX and UI for a feature. This skill is about getting the design RIGHT before writing code -- through structured discovery, not guesswork.

**Scope**: UX + UI design and implementation. Out of scope: building the underlying business logic, backend, or data layer. If the feature needs backend work, note what's needed but focus on the interface.

## Philosophy

Most AI-generated UIs fail not because of bad code, but because of skipped thinking. They jump to "here's a card grid" without asking "what is the user trying to accomplish?" This skill inverts that: understand deeply, then build precisely.

## Phase 1: Discovery Interview

**Do NOT write any code during this phase.** Your only job is to understand the feature deeply enough to make excellent design decisions.

Ask these questions in conversation, adapting based on answers. Don't dump them all at once -- have a natural dialogue. ask the user directly to clarify what you cannot infer.

### Purpose & Context
- What is this feature for? What problem does it solve?
- Who specifically will use it? (Not "users" -- be specific: role, context, frequency)
- What does success look like? How will you know this feature is working?
- What's the user's state of mind when they reach this feature? (Rushed? Exploring? Anxious? Focused?)

### Content & Data
- What content or data does this feature display or collect?
- What are the realistic ranges? (Minimum, typical, maximum -- e.g., 0 items, 5 items, 500 items)
- What are the edge cases? (Empty state, error state, first-time use, power user)
- Is any content dynamic? What changes and how often?

### Design Goals
- What's the single most important thing a user should do or understand here?
- What should this feel like? (Fast/efficient? Calm/trustworthy? Fun/playful? Premium/refined?)
- Are there existing patterns in the product this should be consistent with?
- Are there specific examples (inside or outside the product) that capture what you're going for?

### Constraints
- Are there technical constraints? (Framework, performance budget, browser support)
- Are there content constraints? (Localization, dynamic text length, user-generated content)
- Mobile/responsive requirements?
- Accessibility requirements beyond WCAG AA?

### Anti-Goals
- What should this NOT be? What would be a wrong direction?
- What's the biggest risk of getting this wrong?

## Phase 2: Design Synthesis

After the interview, synthesize your understanding before touching code. Present this back to the user for confirmation:

1. **Feature brief** (2-3 sentences): What this is, who it's for, what it needs to accomplish
2. **Primary user action**: The one thing that matters most
3. **Design direction**: How this should feel, what aesthetic approach fits
4. **Key states**: List every state the feature needs (default, empty, loading, error, success, edge cases)
5. **Open questions**: Anything unresolved that might change the approach

ask the user directly to clarify what you cannot infer. -- get explicit confirmation before proceeding. If the user disagrees with your synthesis, revisit the relevant discovery questions.

## Phase 3: Implementation

Now build it. Use /impeccable as your design engine -- follow its principles, consult its references, avoid its anti-patterns.

### Implementation Order
1. **Structure first**: HTML/semantic structure for the primary state. No styling yet.
2. **Layout and spacing**: Establish the spatial rhythm and visual hierarchy.
3. **Typography and color**: Apply the type scale and color system.
4. **Interactive states**: Hover, focus, active, disabled.
5. **Edge case states**: Empty, loading, error, overflow, first-run.
6. **Motion**: Purposeful transitions and animations (if appropriate).
7. **Responsive**: Adapt for different viewports -- don't just shrink, redesign for the context.

### During Implementation
- Test with real (or realistic) data at every step, not placeholder text
- Check each state as you build it, not all at the end
- If you discover a design question during implementation, stop and ask rather than guessing
- Every visual choice should trace back to something learned in discovery

## Phase 4: Validation

After implementation, run /validate on your work. Fix any P0 or P1 issues before presenting to the user.

Then present the result:
- Show the feature in its primary state
- Walk through the key states (empty, error, responsive)
- Explain design decisions that connect back to what you learned in discovery
- Ask for feedback: "What's working? What isn't?"

Iterate based on feedback. Good design is rarely right on the first pass.