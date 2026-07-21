# Craft floor

Apply this only after analysis and direction are settled. Build without announcing the checklist. A pinned brief or the committed visual world beats every line below; your own reflex does not. <!-- rule:skill-craft-floor -->

## Floor

- **Contrast:** body and placeholder text ≥4.5:1; large text ≥3:1. On colored surfaces, tint secondary text from that hue or the foreground instead of using gray. <!-- rule:skill-color-verify-contrast -->
- **Depth:** shadows describe light with offset and soft blur; zero-offset colored halos are decoration. <!-- rule:skill-color-no-glow-halo -->
- **Spacing:** tight groups, generous separation, no cramped containers; space above a heading exceeds space below. Verify computed values. <!-- rule:skill-layout-spacing-rhythm -->
- **Type:** body measure 65–75ch; display max 6rem and tracking floor -0.04em; balance headings; use clear scale/weight contrast; test overflow at every breakpoint. <!-- rule:skill-typo-floor -->
- **Motion:** author one coherent moment instead of scattered effects. Use exponential ease-out and an already-visible default. Premium motion may add focus, depth, masks, light, or material change through blur/filter, backdrop-filter, clip-path/masks, or shadow when smooth; do not rely on transform/opacity alone. <!-- rule:skill-motion-floor --> <!-- rule:skill-motion-materials-palette -->
- **Shipping:** real content, working controls, responsive composition, keyboard focus, and the states users hit: hover, disabled, loading, error, and empty. <!-- rule:skill-floor-shipping -->
- **Copy:** use the product's language; controls name their action, errors name the problem and recovery. <!-- rule:skill-copy-design-material -->
- **Coverage:** every brief requirement must exist and be findable within seconds. <!-- rule:skill-floor-brief-coverage -->

## Absolute bans

Match and refuse. If you are about to write one of these, rewrite the element with different structure.

- **Side-stripe borders.** `border-left` or `border-right` above 1px as a colored accent on cards, list items, callouts, or alerts. Never intentional. Use full borders, background tints, leading numbers or icons, or nothing. <!-- rule:skill-ban-side-stripe-borders -->
- **Gradient text.** `background-clip: text` over a gradient. Decorative, never meaningful. One solid color; emphasis through weight or size. <!-- rule:skill-ban-gradient-text -->
- **Glassmorphism as default.** Blur and glass panels used as decoration. Rare and purposeful, or nothing. <!-- rule:skill-ban-glassmorphism-default -->
- **The hero-metric template.** Big number, small label, supporting stats, accent treatment. <!-- rule:skill-ban-hero-metric -->
- **Identical card grids.** Same-sized cards carrying icon plus heading plus text, repeated as the page structure. Cards are the lazy answer; nested cards are always wrong. <!-- rule:skill-ban-identical-card-grids --> <!-- rule:skill-layout-cards-lazy -->
- **A tiny tracked uppercase eyebrow above every section.** Small all-caps with wide tracking ("ABOUT", "PROCESS", "PRICING") shows up on most generations regardless of brief, which is what makes it a tell. One named kicker as a deliberate system is voice; an eyebrow on every section is AI grammar. <!-- rule:skill-ban-eyebrow-on-every-section -->
- **Numbered section markers as scaffolding (01 / 02 / 03).** The eyebrow trope one tier deeper. Numbers earn their place when the section really is a sequence and the order carries information the reader needs. <!-- rule:skill-ban-numbered-section-markers -->
- **Text that overflows its container.** Long heading words plus large clamp scales plus narrow grids overflow on tablet and mobile. Test the real copy at every breakpoint, then reduce the clamp max or rewrite the line. The viewport is part of the design. <!-- rule:skill-ban-text-overflow -->

## Detector-blind reflexes

No scanner catches these, and they are where an otherwise competent build still reads as generated. Inspect the rendered result for them.

- Monospace used to signal "technical" or "developer" rather than to show code, data, or measurement. <!-- rule:skill-reflex-mono-as-technical -->
- Light or dark chosen by category habit instead of the real use scene: who uses this, where, under what ambient light. <!-- rule:skill-reflex-theme-by-habit -->
- Decorative sparklines, meaningless progress rings, and rounded rectangles with soft shadows standing in for content. <!-- rule:skill-reflex-decorative-chrome -->
- A modal reached for when the task needs neither interruption nor protected focus. <!-- rule:skill-reflex-modal-by-reflex -->
- One uniform entrance animation applied to every section. Staggering items within a single list is legitimate; the reflex is the identical reveal, not motion itself. <!-- rule:skill-motion-no-section-fade -->

Run the mechanical detector once over the changed web UI, and only when this session has no automatic hook: `node {{scripts_path}}/detect.mjs --json <changed targets>`. Never add a second detector pass, and never run it during concept selection. <!-- rule:skill-detector-finish-mode -->

<codex>
- Display tracking stops at -0.04em; -0.02 to -0.03em is usually enough. <!-- rule:skill-typo-codex-tracking-repeat -->
- Declare elevation once: border or shadow, not both as decoration. A 1px border paired with a soft shadow past 16px blur is the ghost-card tell. Keep container radii modest, 12–16px on cards; reserve pills for small controls. <!-- rule:skill-codex-elevation-radius --> <!-- rule:skill-ban-codex-ghost-card --> <!-- rule:skill-ban-codex-over-round -->
- Use real illustration or none. Hand-drawn SVG scenes, `loose-sketch` / `doodle` class names, and `feTurbulence` paper-grain filters read as amateurish rather than whimsical. <!-- rule:skill-ban-codex-sketchy-svg -->
- Treat backgrounds as surfaces and add texture only from the subject's world. `repeating-linear-gradient` stripes and two-axis CSS grid overlays are decoration unless the surface really is a canvas, map, blueprint, or measurement tool. <!-- rule:skill-ban-codex-stripes --> <!-- rule:skill-ban-codex-grid-backgrounds -->
- Claims, evidence, and configuration come from supplied truth; label illustrative behavior and unresolved values honestly. Naming a concept and then layering an ironic modifier is not a claim. <!-- rule:skill-codex-material-honesty --> <!-- rule:skill-ban-codex-x-theater -->
</codex>

<gemini>
Never animate `<img>` elements on hover, directly or through a parent. That includes Tailwind's `.group:hover .group-hover\:scale` / `:rotate` / `:translate` reaching a child image. The image is not an action target, so the motion carries nothing. Give the card itself feedback instead. <!-- rule:skill-interaction-gemini-no-image-hover -->
</gemini>
