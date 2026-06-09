# EMPIRICAL_VALIDATION.md

The rules in `skill/SKILL.src.md` and `skill/reference/` are hypotheses. This doc names the ones with empirical evidence.

Source: a private eval harness at `~/code/impeccable-evals/` ablates each rule across three providers (Claude Haiku 4.5, Gemini 3.5 Flash, GPT-5.4 mini) on four brand niches (luxury hotel, italian restaurant, observability dashboard, vintage moto forum) at n=10 samples each. A rule "validates" when removing it shifts a deterministic detector ≥ 20pp in the predicted direction. v2.1 sweep completed 2026-06-09 anchored to commit `54c3a502` (skill-v3.5.0 + the five prose fixes that landed alongside this doc). 544 cells total.

Treat any rule **not** named here as "intended but not yet measured" — many are correctly doing their job in territory the current detectors don't cover (DOM-render-dependent signals, niches we don't test, model-resistant patterns). The audit overlay in the eval dashboard categorizes every miss so a "failed-validation" verdict isn't read as "this rule is dead."

## Cross-provider winners (validated on ≥ 2 providers)

These are the trustworthy core. The ablation moved the signal in the predicted direction by a wide margin on at least two providers.

| rule | providers | strongest delta |
|---|---|---|
| `skill-typo-text-wrap-balance` | anthropic, google, openai | Gemini +100pp, OpenAI +92pp on `text_wrap_balance` |
| `brand-typo-reflex-reject-fonts` | google, openai | OpenAI +60pp; Gemini ablate samples switched fully to Inter |
| `brand-imagery-required` | anthropic, google | Anthropic +70pp, Gemini +60pp on `image_present` |
| `brand-imagery-one-decisive-photo` | anthropic, google | Removing the rule drops `single_hero_image` substantially on both |
| `brand-permission-first-load-motion` | anthropic, google | `first_load_motion_present` moves on both |
| `skill-color-strategy-commitment` | anthropic, google | Removing the rule drops `mentions_color_strategy` on both |
| `skill-color-anti-cream` | anthropic, google | Removing it raises `cream_sand_palette` on both |

Single-provider validations exist for ~20 more rules; see the eval dashboard at `localhost:8723/dashboard/biases/rules/` (filter "v2 any").

## What we learned about the rules themselves

- **Literal bad examples in rule prose primed the model to reproduce them.** Confirmed against OpenAI samples that emitted "fake theater", "vendor theater", and "heatmap theater" as verbatim copies of an example phrase in the skill. The five prose fixes landed alongside this doc remove that pattern from `skill-ban-codex-x-theater`, `brand-imagery-required`, `skill-typo-no-all-caps-body`, `brand-color-no-converge`, and `skill-copy-no-aphoristic-cadence`. **Going forward: describe the failure shape, never enumerate examples of it.**
- **Many "failed-validation" rules are doing their job; the detector just can't see the effect.** `det_low_contrast` saturates at 80% baseline; render-dependent detectors under-fire on one-shot output. A failed verdict on a render-dependent rule is not evidence the rule is dead.
- **Detector vocabulary anchoring is a real bias.** Detectors that grep for the rule's own example words measure echo, not effect. The current `mentions_color_strategy` / `mentions_register` detectors should be treated with caution.

## What got deleted in this pass

- `skill-typo-no-all-caps-body` — duplicate of `brand-ban-all-caps-body` (same signal, brand version is more specific).
- `skill-typo-codex-hero-ceiling-repeat` — duplicate of `skill-typo-hero-ceiling` (the codex-block restatement didn't reinforce; the universal rule covers it).
- `skill-typo-scale-ratio` — duplicate of `brand-typo-modular-scale` (same signal, brand version carries the implementation detail).
- `skill-typo-font-count` — no measurable signal; models don't reach for ≥4 families in any niche we test. The rule remains a defensible safety rail but isn't earning its place in skill prose.

## Cost discipline note

The v2.0 → v2.1 cycle cost ~$1,800 across two providers' worth of API plus operational waste. Ablation is expensive; new measurement should be triggered by a specific decision the existing matrix can't yet inform — not by a desire for more data.

## Methodology

For the harness setup, the rule-by-rule audit reports, and the cost trail: `~/code/impeccable-evals/notes/ablation-v2-plan.md` and `~/code/impeccable-evals/output/ablations/_audit_consolidated.json`.
