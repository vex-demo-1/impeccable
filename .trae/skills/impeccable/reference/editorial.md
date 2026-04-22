# Editorial register

When design IS the product: marketing pages, landing pages, brand sites, editorial content, campaign pages, portfolios.

## The editorial slop test

If someone could look at this and say "AI made that" without hesitation, it's failed. The bar is distinctiveness — a reader should ask "how was this made?", not "which AI made this?"

Editorial isn't a neutral register. AI-generated landing pages have flooded the internet, and average is no longer findable. Restraint without intent now reads as mediocre, not refined. Editorial has to take a POV, commit to a specific audience, risk strangeness. Go big or go home.

## Typography

### Font selection procedure

Every project. Never skip.

1. Read the brief. Write three concrete brand-voice words — not "modern" or "elegant," but "warm and mechanical and opinionated" or "calm and clinical and careful." Physical-object words.
2. List the three fonts you'd reach for by reflex. If any appear in the reflex-reject list below, reject them — they are training-data defaults and they create monoculture.
3. Browse a real catalog (Google Fonts, Pangram Pangram, Future Fonts, Adobe Fonts, ABC Dinamo, Klim, Velvetyne) with the three words in mind. Find the font for the brand as a *physical object* — a museum caption, a 1970s terminal manual, a fabric label, a cheap-newsprint children's book. Reject the first thing that "looks designy."
4. Cross-check. "Elegant" is not necessarily serif. "Technical" is not necessarily sans. "Warm" is not Fraunces. If the final pick lines up with the original reflex, start over.

### Reflex-reject list

Training-data defaults. Ban list — look further:

Fraunces · Newsreader · Lora · Crimson · Crimson Pro · Crimson Text · Playfair Display · Cormorant · Cormorant Garamond · Syne · IBM Plex Mono · IBM Plex Sans · IBM Plex Serif · Space Mono · Space Grotesk · Inter · DM Sans · DM Serif Display · DM Serif Text · Outfit · Plus Jakarta Sans · Instrument Sans · Instrument Serif

### Pairing

Distinctive display font + refined body font. Two families minimum. Vary across projects — if the last one was a serif display, this one isn't.

### Scale

Modular scale, fluid `clamp()` for headings, ≥1.25 ratio between steps. Flat scales (1.1× apart) read as uncommitted.

Light text on dark backgrounds: add 0.05–0.1 to line-height. Light type reads as lighter weight and needs more breathing room.

## Color

Editorial has permission for Committed, Full palette, and Drenched strategies. Use them. A single saturated color spread across a hero is not excess — it's voice. A beige-and-muted-slate landing page ignores the register.

- Name a real reference before picking a strategy. "Klim Type Foundry #ff4500 orange drench", "Mailchimp yellow full palette", "Condé Nast Traveler muted navy restraint". Unnamed ambition becomes beige.
- Palette IS voice. A calm site and a restless site should not share palette mechanics.
- When the strategy is Committed or Drenched, the color is load-bearing. Don't hedge with neutrals around the edges — commit.
- Don't converge across projects. If the last editorial was restrained-on-cream, this one is not.

## Layout

- Asymmetric compositions. Break the grid intentionally for emphasis.
- Fluid spacing with `clamp()` that breathes on larger viewports. Vary for rhythm — generous separations, tight groupings.
- Don't center everything. Left-aligned in asymmetric compositions feels more designed.
- When cards ARE the right affordance, use `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` — breakpoint-free responsiveness.

## Imagery

Editorial register leans on imagery. A restaurant, hotel, magazine, or product landing page without any imagery reads as incomplete, not as restrained. A solid-color rectangle where a hero image should go is worse than a representative stock photo.

- **For greenfield work without local assets, reach for stock imagery** from Unsplash (`https://images.unsplash.com/photo-{id}?w=…&q=80`), Pexels, or similar. A well-chosen Unsplash photo is a valid deliverable — colored placeholder blocks are not.
- **Search for the brand's physical object**, not the generic category: "handmade pasta on a scratched wooden table" beats "Italian food"; "cypress trees above a limestone hotel facade at dusk" beats "luxury hotel".
- **One decisive photo beats five mediocre ones.** Hero imagery should commit to a mood; padding with more stock doesn't rescue an indecisive one.
- **Don't stop at zero** when the brief implies imagery. A moto forum without motorcycle photos, a restaurant without food, a hotel without a view — these read as stubs, not as editorial restraint.
- **Alt text is part of the voice.** "Coastal fettuccine, hand-cut, served on the terrace" beats "pasta dish".

## Motion

- One well-orchestrated page-load with staggered reveals beats scattered micro-interactions.
- For collapsing/expanding sections, transition `grid-template-rows` rather than `height`.

## Editorial bans (on top of the shared absolute bans)

- Monospace as lazy shorthand for "technical / developer."
- Large rounded-corner icons above every heading. Screams template.
- Single-font-family pages.
- All-caps body copy. Reserve caps for short labels and headings.
- Timid palettes and average layouts. Safe = invisible.

## Editorial permissions

Editorial can afford things product can't. Take them.

- Ambitious first-load motion. Reveals, scroll-triggered transitions, typographic choreography.
- Single-purpose viewports. One dominant idea per fold, long scroll, deliberate pacing.
- Typographic risk. Enormous display type, unexpected italic cuts, mixed cases, expressive pairings.
- Unexpected color strategies. Palette IS voice — a calm site and a restless site should not share palette mechanics.
- Art direction per section. Different sections can have different visual worlds if the narrative demands it. Consistency of voice beats consistency of treatment.
