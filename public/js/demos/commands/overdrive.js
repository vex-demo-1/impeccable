// Overdrive command demo - shows standard rectangular layout vs organic, non-standard composition
export default {
  id: 'overdrive',
  caption: 'Standard rectangular layout → Organic, technically ambitious composition',

  before: `
    <div style="width: 100%; max-width: 240px; padding: 20px 16px; text-align: center; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="width: 48px; height: 48px; background: #ddd; border-radius: 50%; margin: 0 auto 12px;"></div>
      <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">Sarah Chen</div>
      <div style="font-size: 12px; color: #888; margin-bottom: 16px;">Design Lead</div>
      <div style="display: flex; justify-content: center; gap: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
        <div style="text-align: center;"><div style="font-size: 14px; font-weight: 600; color: #333;">142</div><div style="font-size: 10px; color: #999;">Projects</div></div>
        <div style="text-align: center;"><div style="font-size: 14px; font-weight: 600; color: #333;">38</div><div style="font-size: 10px; color: #999;">Reviews</div></div>
      </div>
    </div>
  `,

  after: `
    <div style="width: 100%; max-width: 240px; padding: 20px 16px; position: relative; overflow: hidden; background: var(--color-paper); border-radius: 24px 24px 8px 8px;">
      <div style="position: absolute; top: -30px; right: -20px; width: 100px; height: 100px; background: color-mix(in oklch, var(--color-accent) 10%, transparent); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; filter: blur(1px);"></div>
      <div style="position: absolute; bottom: -15px; left: -10px; width: 70px; height: 70px; background: color-mix(in oklch, var(--color-accent) 6%, transparent); border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%;"></div>
      <div style="position: relative; z-index: 1;">
        <div style="width: 48px; height: 48px; background: var(--color-accent); border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; font-weight: 600; font-family: 'Cormorant Garamond', serif;">SC</div>
        <div style="font-size: 0.9375rem; font-weight: 600; color: var(--color-ink); margin-bottom: 2px; font-family: 'Cormorant Garamond', serif;">Sarah Chen</div>
        <div style="font-size: 0.6875rem; color: var(--color-ash); margin-bottom: 16px; letter-spacing: 0.04em; font-family: 'Instrument Sans', sans-serif;">Design Lead</div>
        <div style="display: flex; justify-content: center; gap: 20px; padding-top: 12px; border-top: 1px solid var(--color-mist);">
          <div style="text-align: center;"><div style="font-size: 0.875rem; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums;">142</div><div style="font-size: 0.5625rem; color: var(--color-ash); letter-spacing: 0.06em;">Projects</div></div>
          <div style="text-align: center;"><div style="font-size: 0.875rem; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums;">38</div><div style="font-size: 0.5625rem; color: var(--color-ash); letter-spacing: 0.06em;">Reviews</div></div>
        </div>
      </div>
    </div>
  `
};
