// ============================================
// DATA: Skill focus areas, command processes, relationships
// ============================================

// Items that are fully complete and ready for public use
// All others will show "Coming Soon"
export const readySkills = [
  // None ready yet - all skills are still being refined
];

export const readyCommands = [
  'normalize'  // First command to be fully completed
];

export const skillFocusAreas = {
  'typography': [
    { area: 'Scale & Rhythm', detail: 'Harmonious systems' },
    { area: 'Hierarchy', detail: 'Clear structure' },
    { area: 'Readability', detail: 'Optimal measure' },
    { area: 'Expression', detail: 'Character in type' }
  ],
  'color-and-contrast': [
    { area: 'Accessibility', detail: 'WCAG contrast' },
    { area: 'Color Systems', detail: 'Systematic palettes' },
    { area: 'Dark Mode', detail: 'Balanced themes' },
    { area: 'Accent Usage', detail: 'Strategic color' }
  ],
  'spatial-design': [
    { area: 'Layout Systems', detail: 'Grid & asymmetry' },
    { area: 'Hierarchy', detail: 'Visual weight' },
    { area: 'Spacing', detail: 'Rhythm & breath' },
    { area: 'Composition', detail: 'Balance & tension' }
  ],
  'motion-design': [
    { area: 'Micro-interactions', detail: 'Action feedback' },
    { area: 'Transitions', detail: 'Smooth changes' },
    { area: 'Performance', detail: '60fps animations' },
    { area: 'Choreography', detail: 'Orchestrated reveals' }
  ],
  'interaction-design': [
    { area: 'Affordances', detail: 'Clear cues' },
    { area: 'Feedback', detail: 'Immediate response' },
    { area: 'States', detail: 'Hover, focus, etc.' },
    { area: 'Forgiveness', detail: 'Undo & confirmation' }
  ],
  'responsive-design': [
    { area: 'Fluid Layouts', detail: 'Adapt gracefully' },
    { area: 'Touch Targets', detail: '44px minimum' },
    { area: 'Breakpoints', detail: 'Strategic shifts' },
    { area: 'Performance', detail: 'Mobile optimized' }
  ],
  'ux-writing': [
    { area: 'Clarity', detail: 'Plain language' },
    { area: 'Conciseness', detail: 'Respect time' },
    { area: 'Voice & Tone', detail: 'Human & empathetic' },
    { area: 'Error Messaging', detail: 'Actionable guidance' }
  ]
};

export const commandProcessSteps = {
  'audit': ['Scan', 'Document', 'Prioritize', 'Recommend'],
  'normalize': ['Analyze', 'Identify', 'Align', 'Verify'],
  'polish': ['Review', 'Refine', 'Verify'],
  'optimize': ['Profile', 'Identify', 'Improve', 'Measure'],
  'harden': ['Test', 'Handle', 'Wrap', 'Validate'],
  'clarify': ['Read', 'Simplify', 'Improve', 'Test'],
  'quieter': ['Analyze', 'Reduce', 'Refine'],
  'bolder': ['Analyze', 'Amplify', 'Impact'],
  'simplify': ['Audit', 'Remove', 'Clarify'],
  'animate': ['Identify', 'Design', 'Implement', 'Polish'],
  'colorize': ['Analyze', 'Strategy', 'Apply', 'Balance'],
  'delight': ['Identify', 'Design', 'Implement'],
  'extract': ['Identify', 'Abstract', 'Document'],
  'adapt': ['Analyze', 'Adjust', 'Optimize'],
  'onboard': ['Map', 'Design', 'Guide']
};

export const commandCategories = {
  'audit': 'diagnostic',
  'normalize': 'quality',
  'polish': 'quality',
  'optimize': 'quality',
  'harden': 'quality',
  'clarify': 'adaptation',
  'quieter': 'intensity',
  'bolder': 'intensity',
  'simplify': 'adaptation',
  'animate': 'enhancement',
  'colorize': 'enhancement',
  'delight': 'enhancement',
  'extract': 'system',
  'adapt': 'adaptation',
  'onboard': 'system'
};

// Skill relationships (no longer used in UI, kept for reference)
export const skillRelationships = {
  'typography': { combinesWith: ['spatial-design'] },
  'color-and-contrast': { combinesWith: ['spatial-design'] },
  'spatial-design': { combinesWith: ['typography'] },
  'motion-design': { combinesWith: ['interaction-design'] },
  'interaction-design': { combinesWith: ['motion-design', 'ux-writing'] },
  'responsive-design': { combinesWith: ['spatial-design'] },
  'ux-writing': { combinesWith: ['interaction-design'] }
};

export const commandRelationships = {
  'audit': { leadsTo: ['normalize', 'harden', 'optimize', 'adapt', 'clarify'], flow: 'Diagnostic: Start here to find issues' },
  'normalize': { combinesWith: ['clarify', 'adapt'], flow: 'Quality: Align with design system' },
  'polish': { flow: 'Quality: Final pass before shipping' },
  'optimize': { flow: 'Quality: Performance improvements' },
  'harden': { combinesWith: ['optimize'], flow: 'Quality: Error handling & edge cases' },
  'clarify': { combinesWith: ['normalize', 'adapt'], flow: 'Adaptation: Improve UX copy' },
  'quieter': { pairs: 'bolder', flow: 'Intensity: Tone down bold designs' },
  'bolder': { pairs: 'quieter', flow: 'Intensity: Amplify timid designs' },
  'simplify': { combinesWith: ['quieter', 'normalize'], flow: 'Adaptation: Strip to essence' },
  'animate': { combinesWith: ['delight'], flow: 'Enhancement: Add motion' },
  'colorize': { combinesWith: ['bolder', 'delight'], flow: 'Enhancement: Add strategic color' },
  'delight': { combinesWith: ['bolder', 'animate'], flow: 'Enhancement: Add personality' },
  'extract': { flow: 'System: Create design system elements' },
  'adapt': { combinesWith: ['normalize', 'clarify'], flow: 'Adaptation: Different devices/contexts' },
  'onboard': { flow: 'System: Onboarding & empty states' }
};

