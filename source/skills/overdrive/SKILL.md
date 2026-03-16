---
name: overdrive
description: Add technically extraordinary effects that push the boundaries of what's possible in the browser. WebGPU shaders, scroll-driven animations, generative art, and bleeding-edge APIs — ambitious without gimmicky.
args:
  - name: target
    description: The feature or area to push into overdrive (optional)
    required: false
user-invokable: true
---

Push an interface past conventional limits with technically ambitious, visually extraordinary effects that make people stop and ask "how did they do that?"

## MANDATORY PREPARATION

Use the frontend-design skill — it contains design principles, anti-patterns, and the **Context Gathering Protocol**. Follow the protocol before proceeding — if no design context exists yet, you MUST run teach-impeccable first.

**EXTRA IMPORTANT FOR THIS SKILL**: Context is everything. A particle system on a creative portfolio is extraordinary. The same particle system on a SaaS settings page is embarrassing. You MUST understand the project's personality, audience, and goals before deciding what's appropriate.

---

## When to Use This (and When Not To)

This skill is not for every project. Use it when:
- The project's brand rewards boldness and spectacle (creative agencies, games, music, art, portfolios)
- There's a specific moment that should feel extraordinary (launch page, hero section, key transition)
- The audience expects to be impressed (developers, designers, creative professionals)
- The client or team has explicitly asked for something that stands out

Do NOT use this when:
- The product needs to feel reliable and predictable (banking, healthcare, enterprise tools)
- Performance budgets are tight and every KB counts
- The audience values speed and efficiency over experience (dashboards, admin panels)
- You're adding complexity to compensate for weak fundamentals — fix those with other skills first

**The test**: Would a senior creative director at a top agency look at this and nod approvingly, or roll their eyes? If the latter, dial it back.

## Assess the Opportunity

Before adding anything, understand what moment deserves the investment:

1. **Find the hero moment**: Not everything can be extraordinary — pick ONE moment that gets the full treatment. A page load. A state transition. A scroll reveal. A hover interaction. Restraint in choosing where to go big is what separates impressive from gimmicky.

2. **Match the ambition to the brand**: A glitch shader fits a music visualizer. A fluid simulation fits an environmental nonprofit. A generative mesh fits a creative tool. The effect should feel like it *belongs* to this product, not like it was bolted on.

3. **Check the technical floor**: What browsers does this need to support? What devices? Progressive enhancement is non-negotiable — the experience must work without the effect, and the effect must enhance rather than replace.

## The Toolkit

These are the technologies that enable extraordinary interfaces. Choose based on what the moment needs, not what's newest.

### CSS Bleeding Edge
- **Scroll-driven animations** (`animation-timeline: scroll()`) — tie any animation to scroll position without JavaScript
- **View Transitions API** — cinematic page transitions with shared element morphing
- **`@property`** — register custom properties for animatable gradients, colors, and complex values
- **Anchor positioning** — CSS-native popovers and tooltips that follow elements
- **CSS Houdini** (`paint()` worklets) — custom rendering directly in CSS
- **Container style queries** — style children based on parent's custom property values

### WebGL / WebGPU
- **Shader effects** — noise distortion, chromatic aberration, liquid effects, ray marching
- **Post-processing** — bloom, depth of field, film grain on 3D or 2D content
- **Particle systems** — reactive particles, cursor trails, ambient atmosphere
- **Libraries**: Three.js, OGL (lightweight), regl, gpu-curtains (DOM + WebGL blend)

### SVG & Canvas
- **Generative art** — algorithmic patterns, organic shapes, procedural textures
- **SVG filter chains** — displacement maps, turbulence, morphology for organic effects
- **Canvas 2D** — pixel manipulation, custom rendering, performance-critical 2D
- **Lottie / Rive** — vector animations with interactive state machines

### Advanced Motion
- **FLIP animations** — layout animations at 60fps (First, Last, Invert, Play)
- **Spring physics** — natural motion with mass, tension, damping instead of cubic-bezier
- **Orchestrated sequences** — coordinated multi-element choreography with precise timing
- **Scroll snapping + scroll-driven** — hybrid scroll experiences with momentum

### Audio & Haptics
- **Web Audio API** — reactive visualizations, spatial audio, sonic feedback
- **Haptic feedback** — `navigator.vibrate()` for tactile responses on mobile
- **Audio-reactive visuals** — effects that respond to music or ambient sound

## Implement with Discipline

### Progressive Enhancement is Non-Negotiable

Every effect MUST degrade gracefully:

```css
/* Feature detection first */
@supports (animation-timeline: scroll()) {
  .hero { animation-timeline: scroll(); }
}

/* GPU capability check */
@media (prefers-reduced-motion: no-preference) {
  .shader-bg { /* only show if motion is OK */ }
}
```

```javascript
// Always check before using bleeding-edge APIs
if ('gpu' in navigator) {
  // WebGPU path
} else if (canvas.getContext('webgl2')) {
  // WebGL fallback
} else {
  // CSS-only fallback — still must look good
}
```

### Performance is the Constraint

Extraordinary effects that cause jank are worse than no effects at all.

- **GPU-only**: Effects should run on the GPU. If it touches the main thread per frame, rethink.
- **Budget your frames**: Target 60fps. If you're dropping below 50, simplify.
- **Respect `prefers-reduced-motion`**: Always. No exceptions. Provide a beautiful static alternative.
- **Lazy initialization**: Don't load WebGL/WebGPU until the element is near viewport.
- **Kill off-screen**: Pause rendering when elements scroll out of view.

### Quality Over Quantity

- **One extraordinary moment** beats five mediocre effects
- **Polish relentlessly** — the difference between "cool" and "extraordinary" is in the final 20% of refinement: easing curves, timing, color grading, subtle secondary motion
- **Test on real devices** — effects that look amazing on a MacBook Pro might crawl on a mid-range Android

## The Line Between Extraordinary and Gimmicky

**Extraordinary:**
- Serves the narrative or emotional arc of the experience
- Feels integrated, like the interface couldn't exist without it
- Makes the user feel something (awe, delight, curiosity)
- Works WITH the content, not on top of it

**Gimmicky:**
- Exists to demonstrate a technology, not to serve the user
- Feels bolted on — could be removed and nothing would change
- Distracts from the content it's supposed to enhance
- Prioritizes initial "wow" over sustained experience

When in doubt, ask: **"If I removed this effect, would the experience feel incomplete, or would nobody notice?"** If nobody would notice, it's decoration. If it would feel incomplete, it's design.

**NEVER**:
- Add effects that can't be turned off or reduced
- Ignore `prefers-reduced-motion` — this is an accessibility requirement, not a suggestion
- Ship effects that drop below 50fps on mid-range devices
- Use WebGPU/WebGL without a meaningful CSS fallback
- Add multiple competing effects — choose ONE hero moment
- Use effects to mask weak design fundamentals — fix those first with other skills
- Add sound without explicit user opt-in

## Verify the Result

- **The jaw-drop test**: Show it to someone who hasn't seen it. Do they react?
- **The removal test**: Remove the effect. Does the experience feel diminished?
- **The device test**: Run it on a phone, a tablet, a slow laptop. Still smooth?
- **The accessibility test**: Enable reduced motion. Is the fallback still beautiful?
- **The context test**: Does this effect make sense for THIS brand and audience?
- **The longevity test**: Will this still feel fresh in 6 months, or is it a trend?

Remember: The goal isn't to use every API in the browser. It's to find the ONE technically ambitious idea that makes this specific interface unforgettable, then execute it with absolute precision.
