export const LLM_ONLY_SLOP_ITEMS = Object.freeze([
  'Monospace used merely to signal “technical” or “developer.”',
  'Light or dark mode chosen by category habit rather than the actual use scene.',
  'Everything wrapped in cards, or identical icon-heading-text cards repeated as the page structure.',
  'Hero-metric scaffolds: one oversized number, a small label, supporting stats, and an accent treatment.',
  'Decorative glassmorphism, meaningless sparklines, or generic rounded rectangles with drop shadows.',
  'A modal chosen by reflex when the task does not require interruption or protected focus.',
]);

export function renderLlmOnlySlopReview({ manualDetector = false, automaticDetector = false, scriptsPath = null } = {}) {
  const lines = [
    automaticDetector
      ? 'AI_SLOP_REVIEW_REQUIRED: The automatic detector covers mechanical rules, but this harness has no reliable late review. Before finishing changed UI, inspect the authored result for detector-blind model reflexes:'
      : 'AI_SLOP_REVIEW_REQUIRED: The automatic Impeccable design hook is not available for this session. Before finishing changed UI, inspect the authored result for detector-blind model reflexes:',
    ...LLM_ONLY_SLOP_ITEMS.map((item) => `- ${item}`),
    'Fix reflexes, not intentional choices required by the brief or established visual authority.',
  ];
  if (manualDetector && scriptsPath) {
    lines.push(`Then run the mechanical detector once over the changed web UI: \`node ${scriptsPath}/detect.mjs --json <changed targets>\`. Do not run it earlier during concept selection.`);
  }
  return lines.join('\n');
}

export function renderStopSlopReview() {
  return [
    '[impeccable@1] Detector-blind AI-slop review. The mechanical pass is complete; now inspect the rendered result for model reflexes it cannot reliably detect:',
    ...LLM_ONLY_SLOP_ITEMS.map((item) => `- ${item}`),
    'Fix reflexes, not intentional choices required by the brief or established visual authority. Do not rerun the detector; this is the authored judgment layer.',
  ].join('\n');
}
