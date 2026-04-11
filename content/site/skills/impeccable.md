---
tagline: "The design intelligence behind every command."
---

## When to use it

`/impeccable` is the home command. Call it directly when you want freeform design work with the full guidebook loaded, without having to pick a specialized command. It is the fallback you reach for when none of the 20 specialists (`audit`, `polish`, `critique`, and the rest) map cleanly onto what you're trying to do.

Reach for `/impeccable` directly when:

- **You're not sure which command fits.** Describe what you want in plain English and let the skill pick the right approach.
- **The work spans multiple disciplines.** "Redo this hero section" touches layout, type, color, and motion. One command can't own that.
- **You want the full design intelligence without constraints.** Every reference file loaded, every anti-pattern checked, no pre-set workflow.

For more structured flows, reach for the specialized commands in the sidebar. `/impeccable craft` runs the full shape-then-build pipeline, `/impeccable shape` produces a design brief before any code is written, and the evaluation and refinement commands (`audit`, `critique`, `polish`, `typeset`, etc.) each own a specific slice of the work.

## How it works

Most AI-generated UIs fail the same way: generic fonts, purple gradients, card grids on card grids, glassmorphism everywhere. `/impeccable` gives your AI a strong point of view. It loads an opinionated design handbook plus a long list of anti-patterns, then pushes the model to commit to a specific aesthetic direction before writing a single line of code.

The skill has a **Context Gathering Protocol** built in. It will not design anything until it knows who uses the product, what they're trying to do, and how the interface should feel. On first use in a project, it runs the `teach` flow automatically: a short interview about your brand, audience, and aesthetic direction, saved to `.impeccable.md` so every future command reads it without asking again.

## Try it

```
/impeccable redo this hero section
```

```
/impeccable build me a pricing page for a developer tool
```

Both prompts are vague on purpose. `/impeccable` will pick a strong aesthetic direction, commit to non-default fonts, avoid the AI color palette, and make the kind of specific choices that a designer would make. No command name to pick first, no step-by-step workflow to follow.

## Pitfalls

- **Treating it like a style guide.** It is an opinionated design partner, not a linter. The defaults exist to raise the floor, not to overrule your judgment. If you have a real reason to push back (brand guideline, accessibility constraint, user research that says otherwise), push back and explain why. The skill will work with you. What produces worse output is ignoring the opinion without a reason.
- **Expecting it to fix existing code.** `/impeccable` is for creation. For refinement, reach for `/impeccable polish`, `/impeccable distill`, or `/impeccable critique` instead.
- **Running it before `teach` has had a chance to save context.** On a fresh project it will interview you mid-flight, which is fine but slower. Running `/impeccable teach` explicitly as your very first command is a tiny bit smoother.
