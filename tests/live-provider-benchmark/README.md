# Live cross-provider benchmark

This benchmark compares Live variant delivery strategies without confusing model latency with browser/poller overhead. It uses the realistic `vite8-react-brand-fidelity` fixture and scores every output with deterministic gates for:

- brand fidelity;
- component fidelity;
- CSS-token fidelity;
- exact copy fidelity;
- source/schema validity;
- provider-independent Accept cleanup and production build validity.

The model matrix and the cleanup control are intentionally separate. Provider generation runs use a fixed synthetic picker event. The cleanup control runs a real Vite/React Live session in Playwright, accepts variant 1, waits for Pick mode, checks that Live markers are gone, and builds the accepted source. This prevents a provider from being blamed for local publisher/poller behavior while retaining a real pipeline safety gate.

## Commands

Validate the matrix without API or browser calls:

```sh
npm run bench:live:providers -- --dry-run
```

Run the recommended small matrix and write a report:

```sh
npm run bench:live:providers -- \
  --strategies atomic-full,progressive-compact,parallel-compact \
  --iterations 1 \
  --output artifacts/live-provider-benchmark.json
```

Run only the real Accept/build cleanup control:

```sh
npm run bench:live:providers -- --cleanup-only --output /tmp/live-cleanup.json
```

Arguments accept either `--name=value` or `--name value`. No output file is created unless `--output` is supplied. API keys load, in order, from `--env-file`, the repo `.env`, and `~/code/impeccable-evals/.env`; reports include only key availability, never key values.

## Strategies

- `atomic-full`: one call generates all variants with the full Live reference. This is the latency and cost control.
- `progressive-full`: a first-variant call followed by a remaining-directions call, both with full Live context.
- `progressive-compact`: the same split with the stable compact producer contract. Variant 1 and its CSS segment are carried forward byte-for-byte and assembled locally.
- `parallel-compact`: three compact one-variant producers run concurrently. The first valid result is reviewable immediately; centralized assembly remaps the other CSS scopes deterministically.

The earlier idea of asking the second progressive call to reproduce variant 1 is deliberately excluded. It adds tokens, permits drift, and conflicts with transactional source publication. Deterministic assembly is the production candidate.

## Interpretation

A run passes only when overall fidelity is at least `0.90`, every dimension is at least `0.75`, and the real cleanup control passes. One iteration is a smoke matrix, not a statistically stable claim; use at least five iterations before setting a release threshold.

Cost estimates use provider-reported token counts and standard per-million-token prices recorded on July 11, 2026. Update `PROVIDER_PROFILES` when model pricing changes. Price sources are embedded in every report.

Latency runs use low effort for Claude Sonnet and GPT, and Gemini 3.1 Flash-Lite's minimal-thinking default. These settings are emitted in provider metadata so a report cannot silently compare different reasoning budgets.
