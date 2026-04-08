---
tagline: "Push an interface past conventional limits. Shaders, physics, 60fps, cinematic transitions."
---

## When to use it

`/overdrive` is for the moments where you want to impress. A hero that uses WebGL. A table that handles a million rows. A dialog that morphs out of its trigger element. A form that validates in real-time with streaming feedback. A page transition that feels cinematic. Use it when the project budget allows for technical ambition and the outcome needs to feel extraordinary.

Do not use it on operator tools, dashboards, or anything where reliability beats spectacle. Overdrive burns complexity for effect, and that trade-off is only worth it on moments that matter.

## How it works

The skill starts by picking the one moment to make extraordinary, not spreading effort across the whole interface. Then it reaches for technically ambitious implementations that most AI-generated UIs never touch:

- **Shaders and WebGL** for hero visuals and background effects
- **Spring physics** (react-spring, framer-motion springs) instead of CSS transitions for elements the user drags, flicks, or directly manipulates
- **Scroll-driven animations** using Scroll Timeline API, not scroll listeners
- **View transitions** for cinematic page changes
- **Canvas and SVG animation** for custom visualizations that actually interact
- **GPU-accelerated filters** (backdrop-filter, SVG filters) used with purpose
- **60fps everywhere**: every animation budgeted, profiled, and tested

The skill output is announced with `──── ⚡ OVERDRIVE ────` so you know you are entering a more ambitious mode. Expect larger diffs, new dependencies, and implementation depth beyond what other skills produce.

## Try it

```
/overdrive the landing hero
```

Expected additions might include:

- A WebGL shader background driven by mouse position and scroll
- Display headline with a mask reveal on scroll using Scroll Timeline
- Featured product image with a 3D tilt effect on pointer move
- A View Transition on the CTA that morphs into the next page
- Full reduced-motion fallback that swaps all of it for a static composition

## Pitfalls

- **Using it everywhere.** Overdrive works because it is rare. If every page has cinematic moments, none of them are cinematic.
- **Shipping without reduced-motion fallbacks.** Non-negotiable. Overdrive adds them automatically; do not remove them.
- **Ignoring performance.** Extraordinary moments still need to hit 60fps. If the effect drops frames, cut it or optimize. Slow spectacle is worse than simple done well.
- **Running overdrive before the base interface is solid.** Spectacle on a broken foundation reads as distraction, not delight.
