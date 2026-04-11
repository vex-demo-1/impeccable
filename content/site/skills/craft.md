---
tagline: "Shape the design, then build it, all in one flow."
---

## When to use it

`/impeccable craft` is the end-to-end build command. Give it a feature description and it runs the whole pipeline: structured discovery, reference loading, implementation, visual iteration. Use it when you are starting a new feature from zero and want the whole workflow in one invocation.

Reach for it when:

- **You are building a new feature and want the full flow.** You do not want to manage the steps yourself.
- **You know what you are building but not how it should look.** The discovery phase forces the design thinking before implementation locks it in.
- **You want visual iteration by default.** `craft` checks the result in a browser and refines until the polish is high, instead of shipping the first working version.

If you only want the thinking without the code, use `/impeccable shape` standalone. If you already have a clear vision and just want to build, call `/impeccable` directly with your feature description. `craft` sits in between: structured, complete, opinionated.

## How it works

`craft` runs four phases in order:

1. **Shape the design.** Runs `/impeccable shape` internally: a short discovery conversation about purpose, users, content, constraints, and goals. The output is a design brief you can read and push back on.
2. **Load references.** Based on the brief, pulls in the right reference files (spatial, typography, motion, color, interaction, responsive, UX writing) so the model has the relevant principles loaded before it starts coding.
3. **Build.** Implements the feature in a deliberate order: structure first, then spacing and hierarchy, then type and color, then states, then motion, then responsive. Every decision traces back to the brief.
4. **Visual iteration.** Opens the result in a browser, checks it against the brief and the anti-pattern catalog, and refines until it matches the intent. This step is critical. The first working version is never the shipped version.

The discovery phase is non-skippable and that is the point. Most AI-generated UIs fail because nobody asked what the user was trying to accomplish before the model started writing JSX. `craft` inverts that.

## Try it

```
/impeccable craft a pricing page for a developer tool
```

Expect a 5 to 10 question discovery interview first. Questions about your audience, the product's personality, the emotional tone you want, anti-references, and constraints. Then a design brief. Then implementation, with the browser checked at each stage. Expect multiple iteration rounds in the visual polish phase.

The whole run is longer than a typical command because it includes the thinking, the building, and the refining. That is the trade: more upfront structure, less cleanup afterwards.

## Pitfalls

- **Using it for small changes.** `craft` is for new features, not touch-ups. For existing code, reach for `/impeccable polish`, `/impeccable critique`, or a specific refinement command instead.
- **Rushing the discovery phase.** The interview feels slow compared to "just start coding". It is not. Answering the questions carefully produces a sharper brief, which produces a sharper build, which produces fewer rewrites.
- **Skipping the visual iteration.** The phase exists for a reason. The gap between "technically works" and "feels right" is closed with visual polish, not code review. Let it run.
