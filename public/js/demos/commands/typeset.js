// Typeset command demo - shows generic typography becoming intentional and hierarchical
export default {
  id: 'typeset',
  caption: 'Generic system fonts → Intentional type hierarchy',

  before: `
    <div style="width: 100%; max-width: 240px; padding: 16px; font-family: Arial, sans-serif;">
      <div style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 6px;">Project Update</div>
      <div style="font-size: 14px; font-weight: bold; color: #555; margin-bottom: 8px;">Q1 Design Sprint</div>
      <p style="font-size: 14px; color: #666; line-height: 1.4; margin: 0 0 8px;">The team completed the redesign of the dashboard. All components have been reviewed and approved by stakeholders.</p>
      <div style="font-size: 13px; color: #888;">Updated 2 hours ago</div>
    </div>
  `,

  after: `
    <div style="width: 100%; max-width: 240px; padding: 16px; font-family: 'Instrument Sans', sans-serif;">
      <div style="font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-ash); margin-bottom: 8px;">Project Update</div>
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 1.375rem; font-weight: 600; color: var(--color-ink); line-height: 1.15; margin-bottom: 10px;">Q1 Design Sprint</div>
      <p style="font-size: 0.875rem; color: color-mix(in oklch, var(--color-ink) 70%, transparent); line-height: 1.6; margin: 0 0 12px; max-width: 32ch;">The team completed the redesign of the dashboard. All components reviewed and approved.</p>
      <div style="font-size: 0.75rem; color: var(--color-ash); font-variant-numeric: tabular-nums;">Updated 2 hours ago</div>
    </div>
  `
};
