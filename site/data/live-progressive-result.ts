export const progressiveDeliveryResult = {
  generatedAt: '2026-07-11T18:41:20-07:00',
  runs: 5,
  benchmark: {
    agent: 'llm',
    provider: 'Anthropic',
    model: 'Claude Haiku 4.5',
    fixture: 'vite8-react-plain',
    promptMode: 'synthetic-element-contract',
  },
  atomic: {
    medianFirstMs: 3674.74,
    p95FirstMs: 7262.77,
    medianAllMs: 3677.16,
    firstMs: [3674.74, 3324.98, 3431.78, 4041.59, 8068.07],
    allMs: [3677.16, 3327.62, 3433.45, 4045.33, 8070.09],
  },
  progressive: {
    medianFirstMs: 1306.33,
    p95FirstMs: 1594.93,
    medianAllMs: 4445.29,
    firstMs: [1642, 1205.54, 1406.66, 1306.33, 1112.19],
    allMs: [4770.53, 3127.94, 5037.59, 4031.08, 4445.29],
  },
};
