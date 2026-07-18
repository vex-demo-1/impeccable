# New visual work

This flow owns the durable visual world when authority is absent, expanding, or explicitly replaced, plus only as much task-level shaping as the requested scope needs. PRODUCT.md owns product truth, DESIGN.md confirmed visual truth, and `.impeccable/surfaces/` durable task strategy. Complete [init.md](init.md) first when PRODUCT.md is missing. Missing DESIGN.md does not route back to init.

## 1. Name the intent

- **Greenfield:** no coherent visual implementation.
- **Local extension:** a section, feature, component, or state inside an established surface and world.
- **New surface:** a whole page, route, screen, flow, or standalone experience inside an established world.
- **Expression expansion:** an established brand entering an unresolved whole-surface family or app boundary.
- **Redesign/rebrand:** replace the world while preserving unchanged product truth, content, function, native affordances, constraints, and brand commitments.
- **Refinement:** leave this flow for the scoped command; preserve the world and scope.

A plain “redesign this page/site” authorizes replacement. “Redesign this within the current brand/system” means extension or refinement. Ask once only when the wording is genuinely ambiguous.

## 2. Resolve visual authority

Read DESIGN.md and representative code, tokens, components, and assets. Choose one path:

### A. Explicit redesign

The old DESIGN.md and implementation are not authority. Keep only unrevoked product facts, content, function, native expectations, constraints, and brand commitments. Establish a replacement world.

### B. DESIGN.md covers this kind of surface

Use its invariants and normative tokens. Skip world-building and discover the surface.

### C. A coherent implementation exists but DESIGN.md does not

Code, assets, tokens, type, and component behavior are incumbent authority. Run [document.md](document.md) in scan mode and confirm extracted invariants before writing DESIGN.md. Do not offer replacement worlds unless the user asked for a redesign.

### D. The brand exists, but a whole-surface family is unresolved

Preserve logo, color/type assets, voice, recognizable component/motion traits, and constraints. Ask what must carry and where expression may expand. Offer two or three compatible ranges, not replacement identities, and merge the choice into DESIGN.md. Use a child-app DESIGN.md when the range is local.

A section, feature, component, or state inside a coherent existing surface stays on B or C. Its surrounding surface is authority even when DESIGN.md is incomplete.

### E. No confirmed visual authority exists

Establish a world. Scaffolds, framework defaults, and stray utilities are not identity.

## 3. Discover the requested surface

Name this surface's audience, job, visitor mode, real content, primary action/task, evidence, constraints, and memorable moment. PRODUCT.md supplies truth and DESIGN.md the world; neither decides narrative or composition.

Ask one attended round of at most three material questions without repeating durable facts. CTA hierarchy, proof sequence, content gaps, and interaction outcomes belong here, not PRODUCT.md. For a fully specified narrow request, state the interpretation and invite correction.

When `shape` has already completed its discovery interview, reuse those confirmed answers and do not ask this round again.

Classify the scope before ideation. A section, feature, component, or state that must join an existing page is a local extension. A page, route, screen, flow, or standalone experience may be a new surface. Do not inflate local work into a surface concept merely because it benefits from a novel layout.

## 4. Shape or select the direction

Do not select a new world and its first surface concept in separate tournaments. That creates a safe global choice followed by a more interesting local choice whose “lineage” exists only in prose.

### Local extension inside stable authority: shape, do not seed

For a local extension on path B or C, inherit both the visual world and the surrounding surface's direction. Resolve only the decisions the addition actually introduces: purpose, content, hierarchy, state or interaction, and how it joins the existing sequence. Use short, related question rounds when those decisions are still open. Do not run `concept-seed.mjs`, generate competing surface metaphors, or offer alternate visual worlds. The result may still have an authored, surprising layout; its novelty must come from the material and the established grammar, not a new identity thesis.

If a local request reveals a genuine gap in the brand system, name that gap and ask before treating it as path D. Do not silently turn a case-study section or feature into an expression-expansion exercise.

### A, D, or E: choose a coupled world and first expression

For a replacement world, unresolved brand expansion, or no authority, make one coupled decision:

1. **Ground.** Use PRODUCT.md, incumbent commitments that still bind, and the surface discovery above. Name what this surface uniquely does, proves, or enables.
2. **Derive pairs.** Generate five to seven grounded directions. Each candidate joins a durable visual system (identity thesis, information/layout grammar, material and type behavior, color strategy, imagery, motion, reusable signature) to a concrete expression for this surface (topology, sequence, focal moment, and implementation consequence). Do not rank yet.
3. **Break the ranking rut once.** Run `node .rovodev/skills/impeccable/scripts/concept-seed.mjs --scope direction`. Promote the assigned grounded pair and weigh its challengers only when they can become both a coherent system and a strong solution to this task.
4. **Test coupling and breadth.** Reject a pair if its surface could swap into another candidate unchanged, or if its world is merely the surface motif repeated. Test each survivor on the requested surface plus navigation, quiet and dense content, interaction/state, and one unlike future surface. Compare it with both the category habit and predictable contrarian response.
5. **Offer coupled choices.** Present two or three materially different pairs without recommendation cues. For each, show the world rules, this surface's expression, cross-surface consequence, and risk. Ask what is closest, should combine, or feels wrong; rejection is allowed.
6. **Resolve once.** The user selects or revises the pair. Extract the durable rules into DESIGN.md and the task-specific strategy into the surface brief; do not reopen either half independently.

Without an answer mechanism, use the assigned grounded pair only if it survives product fit, coupling, and breadth; mark assumptions. This is fallback, not user choice.

### B or C, whole surface only: choose a direction inside stable authority

The visual world supplies the vocabulary; the task concept supplies the sentence.

1. Derive five to seven structural candidates from the content, mechanism, audience, and confirmed authority. Translate its relationships and behavior, not just its styling.
2. Run `node .rovodev/skills/impeccable/scripts/concept-seed.mjs --scope surface` only when a whole page, route, screen, flow, or standalone experience calls for high-concept exploration. Otherwise shape the strongest grounded structure directly. Never run it for a local extension.
3. Name the habitual arrangement and predictable contrarian response. Judge candidates skin-blind: topology, sequence, or interaction must remain different after names and styling disappear.
4. When materially different whole-surface choices would help, present two or three neutral options with thesis, sequence, focal moment, signature, implementation consequence, and concrete inherited world rules. Let the user select or revise before code.

Without an answer mechanism, use the promoted candidate when a roll ran; otherwise use the strongest grounded structure. It must survive both tests.

For a substantial high-fidelity surface with native image generation, load [codex.md](codex.md) after selection. Probes stay inside the selected direction. For `shape`, stop after selection and continue in [shape.md](shape.md).

### Write or update DESIGN.md

For A or E, write or replace DESIGN.md at the resolved project/app boundary using the [format spec](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md). For D, merge only the approved expansion range. Record the chosen durable rules and add:

`<!-- STATUS: DIRECTIONAL SEED; exact tokens remain provisional until the first implementation pass. -->`

Do not fabricate YAML tokens; add exact values only after the user, assets, or implementation establishes them. The selected pair authorizes its world and first expression together without another confirmation. A local extension does not change DESIGN.md unless the user approves a durable system addition.

## 5. Persist the surface brief

Once the primary target or route is known, persist durable surface-level product/UX strategy separately from PRODUCT.md and DESIGN.md. Prefer a clone-stable source file; map routes and alternate entries as related targets. For a local extension, update the parent surface's record only when the work establishes durable product strategy; do not create a component-level brief by reflex. Read any record first:

`node .rovodev/skills/impeccable/scripts/surface-brief.mjs read <primary-target>`

Exit 0: preserve still-valid decisions and change only what the user changed. For redesign, retain valid product strategy, content, function, and open decisions; replace visual direction and contract. Exit 2: no brief. After the contract, write with `node .rovodev/skills/impeccable/scripts/surface-brief.mjs write <primary-target> <body-file> [related-target ...]`.

The body is concise and contains:

```markdown
# Surface brief: [name]

## Scope
[Primary/related route or artifact, visitor mode, and what this surface owns.]

## Product strategy
[Surface-specific audience and job, desired outcome, primary/secondary action or task, content and proof sequence, factual constraints, and explicitly open decisions.]

## Selected direction
[Reference to the applicable DESIGN.md world or expression range, selected surface concept, focal moment, narrative/interaction sequence, and implementation consequence.]

## Direction contract
[The six contract blocks below.]

## Open decisions
[Only unresolved items that later work must not silently invent. Omit when empty.]
```

Commit `.impeccable/surfaces/<target-slug>.md` as stable later-work context. Exclude global truth, exact tokens, transient notes, and work logs.

## 6. Write the direction contract for a whole surface

If a competent default could satisfy the concept, sharpen its focal moment until one product-specific move changes implementation. Difficulty must clarify the product, not add spectacle.

Before code, write a direction contract of at most 150 words in an opening HTML or framework comment. The first 200 characters must name `DIRECTION CONTRACT`.

- `UNIQUE`: the task thesis tied to the product mechanism;
- `NOT-TEMPLATE`: the category-default arrangement this structure refuses;
- `OWN-WORLD`: the confirmed DESIGN.md invariants, tokens, and materials it uses;
- `STORY`: what the visitor understands, believes, and does;
- `FIRST VIEWPORT`: exact composition, hierarchy, action, and where the concept exceeds competent convention;
- `FORM`: chosen structure or behavior, signature, implementation consequence, and seed key.

The contract is task-scoped, inspectable, and subordinate to the user's choice. Put the same six blocks in the surface brief and artifact comment.

A local extension skips this contract unless the user explicitly wants it to become a distinct authored moment. Use the shaped decisions as the implementation plan instead.

## 7. Plan, build, and commit

Plan from the selected direction or local shape and real content, never a category skeleton. In redesign, remove inherited visual tokens.

Load only needed specialist references. Focal interaction or authored animation reads [animate.md](animate.md), even without the `animate` command.

Build the strongest coherent direction once. Its grammar governs navigation, actions, controls, content, and transitions without disguising affordances. Give the focal form the scale that gives it force; do not trap it inside a standard hero panel.

**Make the opening a thesis.** Demonstrate the mechanism immediately; leave an idea, interaction, or evidence, not merely mood.

**Commit before correcting.** Land the hard move at full strength before refining it. In unattended work, safety is the known risk.

**Commit at page scale.** Let color, material, image, or type own a region when the world calls for it. Scattered signature decoration is not commitment.

**Pace the whole surface.** Vary density, scale, image, motion, and quiet inside one grammar. Cut repeated claims; prove the mechanism with real artifact, interaction, data, transformation, or content.

**Author motion as material.** Motion expresses the world and task. Premium moments go beyond repeated transform/opacity through earned focus, depth, masks, continuity, light, or material change. Bound expensive effects, test in-browser, keep content visible by default, and design reduced motion.

Preserve semantics, affordances, accessibility, performance, responsiveness, and project conventions. Operate/Read express through topology, hierarchy, density, rhythm, and state; Persuade/Experience may earn drama.

## 8. Solidify the visual record

After first implementation of a new/replacement world or approved expansion, refresh DESIGN.md from the build:

- replace provisional direction with the exact type, color roles, tokens, spacing/radii, components, states, and motion that survived;
- add normative YAML tokens only for values the implementation actually uses;
- remove the directional-seed status once the record and implementation agree;
- preserve broader world invariants and expression ranges;
- do not promote the task's story, hero composition, or one-off motif into a global rule unless it is intentionally reusable.

Ordinary extension does not rewrite DESIGN.md; only approved durable changes do.

## 9. Finish like a studio

Inspect desktop and mobile; critique against the brief, DESIGN.md, and the applicable shape, concept, or contract; patch material defects; recheck skin-blind. Follow the quality guidance supplied by `context.mjs` and hooks. Context requests a manual scan only when no automatic detector is active; never add another detector pass. Fix real gaps and classify false positives until none remain. Add a reviewer only when risk earns it.
