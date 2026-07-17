# New visual work

This flow owns two decisions: the durable visual world when authority is absent, expanding, or explicitly replaced; and the task-scoped concept for the surface being made. PRODUCT.md owns product truth, DESIGN.md confirmed visual truth, and `.impeccable/surfaces/` the task strategy. Complete [init.md](init.md) first when PRODUCT.md is missing. Missing DESIGN.md does not route back to init.

## 1. Name the intent

- **Greenfield:** no coherent visual implementation.
- **Extension:** a new surface inside an established world.
- **Expression expansion:** an established brand entering an unresolved surface family.
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

### D. The brand exists, but this surface family is unresolved

Preserve logo, color/type assets, voice, recognizable component/motion traits, and constraints. Ask what must carry and where expression may expand. Offer two or three compatible ranges, not replacement identities, and merge the choice into DESIGN.md. Use a child-app DESIGN.md when the range is local.

### E. No confirmed visual authority exists

Establish a world. Scaffolds, framework defaults, and stray utilities are not identity.

## 3. Establish or replace the visual world

Run this only for A or E. The world must govern more than one artifact and still constrain the build.

1. **Ground.** Use PRODUCT.md's mechanism, users, context, evidence, commitments, and the brief. Ask at most three questions about unknown visual premises, never CSS values.
2. **Derive.** Generate five to seven grounded candidates. State each identity thesis, information/layout grammar, material and type behavior, color strategy, imagery, motion, and reusable signature. Do not rank yet.
3. **Add external selection pressure.** Run `node {{scripts_path}}/concept-seed.mjs --scope world`. Promote the assigned grounded candidate into the serious shortlist and weigh the printed challengers only when they can become a coherent system rather than a one-page costume.
4. **Test breadth and defaults.** Reject one-hero costumes. Test navigation, quiet/dense content, interaction/state, and an unlike surface. Compare survivors with the category's habitual and predictable contrarian looks; revise defaults without turning anti-reference into recipe.
5. **Offer neutral choices.** Present two or three materially different worlds without recommendation cues. Explain consequences; ask what is closest, should combine, or feels wrong. Rejection is allowed.
6. **Resolve.** Set durable type, color roles, materials, layout, imagery, motion, and signature. Defer exact files and tokens when implementation is the honest decision point.

Without an answer mechanism, use the assigned grounded candidate only if it survives product fit and breadth; mark assumptions. This is fallback, not user choice.

### Write the directional DESIGN.md seed

Before code, write or replace DESIGN.md at the resolved project/app boundary using the [format spec](https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md). Record the chosen overview and relevant visual sections. Add:

`<!-- STATUS: DIRECTIONAL SEED; exact tokens remain provisional until the first implementation pass. -->`

Do not fabricate YAML tokens; add exact values only after the user, assets, or implementation establishes them. A redesign plus the user's world choice authorizes replacement without another confirmation.

## 4. Discover the requested surface

Name this surface's audience, job, visitor mode, real content, primary action/task, evidence, constraints, and memorable moment. PRODUCT.md supplies truth and DESIGN.md the world; neither decides narrative or composition.

Ask one attended round of at most three material questions without repeating durable facts. CTA hierarchy, proof sequence, content gaps, and interaction outcomes belong here, not PRODUCT.md. For a fully specified narrow request, state the interpretation and invite correction.

When `shape` has already completed its discovery interview, reuse those confirmed answers and do not ask this round again.

## 5. Develop the surface concept

The visual world supplies the vocabulary; the task concept supplies the sentence.

1. **State the mechanism.** Name what this surface does, proves, or enables that a neighbor could not truthfully claim.
2. **Derive structural material.** From content, mechanism, audience, and DESIGN.md, list five to seven forms, behaviors, spatial arrangements, or narratives. Translate relationships and reading order, not costume. Do not rank yet.
3. **Break the ranking rut.** For substantial greenfield, redesign, expression expansion, or extension work, run `node {{scripts_path}}/concept-seed.mjs --scope surface`. Promote its assigned grounded candidate and weigh challengers on audience identification and product clarity. Skip the roll for a small extension or a user-pinned concept.
4. **Audit defaults.** Name the habitual arrangement and predictable contrarian response. Judge the shortlist skin-blind: without color, type, texture, or concept nouns, distinct candidates still differ in topology, sequence, or interaction.
5. **Offer neutral choices.** Present two or three concepts without recommendation cues. Give each thesis, sequence, focal moment, signature, implementation consequence, and world lineage.
6. **Let the user direct.** Ask what is closest, should combine, or feels wrong. Resolve before code; rejection is allowed.
7. **Probe when useful.** For a substantial high-fidelity surface with native image generation, load [codex.md](codex.md). Probes stay inside the world.

Without an answer mechanism, use the assigned grounded concept only if it survives both tests.

For `shape`, stop after the user selects the concept and continue in [shape.md](shape.md). Keep a newly written DESIGN.md seed directional; exact tokens wait for implementation.

## 6. Persist the surface brief

Once the primary target or route is known, persist task-local product/UX strategy separately from PRODUCT.md and DESIGN.md. Prefer a clone-stable source file; map routes and alternate entries as related targets. Read any record first:

`node {{scripts_path}}/surface-brief.mjs read <primary-target>`

Exit 0: preserve still-valid decisions and change only what the user changed. For redesign, retain valid product strategy, content, function, and open decisions; replace visual direction and contract. Exit 2: no brief. After the contract, write with `node {{scripts_path}}/surface-brief.mjs write <primary-target> <body-file> [related-target ...]`.

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

## 7. Write the direction contract

If a competent default could satisfy the concept, sharpen its focal moment until one product-specific move changes implementation. Difficulty must clarify the product, not add spectacle.

Before code, write a direction contract of at most 150 words in an opening HTML or framework comment. The first 200 characters must name `DIRECTION CONTRACT`.

- `UNIQUE`: the task thesis tied to the product mechanism;
- `NOT-TEMPLATE`: the category-default arrangement this structure refuses;
- `OWN-WORLD`: the confirmed DESIGN.md invariants, tokens, and materials it uses;
- `STORY`: what the visitor understands, believes, and does;
- `FIRST VIEWPORT`: exact composition, hierarchy, action, and where the concept exceeds competent convention;
- `FORM`: chosen structure or behavior, signature, implementation consequence, and seed key.

The contract is task-scoped, inspectable, and subordinate to the user's choice. Put the same six blocks in the surface brief and artifact comment. <!-- rule:skill-decide-then-build -->

## 8. Plan, build, and commit

Plan from the concept and real content, never a category skeleton. In redesign, remove inherited visual tokens.

Load only needed specialist references. Focal interaction or authored animation reads [animate.md](animate.md), even without the `animate` command.

Build the strongest coherent direction once. Its grammar governs navigation, actions, controls, content, and transitions without disguising affordances. Give the focal form the scale that gives it force; do not trap it inside a standard hero panel.

**Make the opening a thesis.** Demonstrate the mechanism immediately; leave an idea, interaction, or evidence, not merely mood.

**Commit before correcting.** Land the hard move at full strength before refining it. In unattended work, safety is the known risk.

**Commit at page scale.** Let color, material, image, or type own a region when the world calls for it. Scattered signature decoration is not commitment.

**Pace the whole surface.** Vary density, scale, image, motion, and quiet inside one grammar. Cut repeated claims; prove the mechanism with real artifact, interaction, data, transformation, or content.

**Author motion as material.** Motion expresses the world and task. Premium moments go beyond repeated transform/opacity through earned focus, depth, masks, continuity, light, or material change. Bound expensive effects, test in-browser, keep content visible by default, and design reduced motion.

Preserve semantics, affordances, accessibility, performance, responsiveness, and project conventions. Operate/Read express through topology, hierarchy, density, rhythm, and state; Persuade/Experience may earn drama.

## 9. Solidify the visual record

After first implementation of a new/replacement world or approved expansion, refresh DESIGN.md from the build:

- replace provisional direction with the exact type, color roles, tokens, spacing/radii, components, states, and motion that survived;
- add normative YAML tokens only for values the implementation actually uses;
- remove the directional-seed status once the record and implementation agree;
- preserve broader world invariants and expression ranges;
- do not promote the task's story, hero composition, or one-off motif into a global rule unless it is intentionally reusable.

Ordinary extension does not rewrite DESIGN.md; only approved durable changes do.

## 10. Finish like a studio

Inspect desktop and mobile; critique against the brief, DESIGN.md, concept, and contract; patch material defects; recheck skin-blind; run the detector once. With a Stop hook, fix real gaps and classify false positives until none remain. Add a reviewer only when risk earns it. <!-- rule:skill-finish-like-studio -->
