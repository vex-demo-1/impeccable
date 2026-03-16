// Overdrive command demo - shows conventional UI becoming technically extraordinary
export default {
  id: 'overdrive',
  caption: 'Conventional static hero → Technically extraordinary experience',

  before: `
    <div style="width: 100%; max-width: 240px; padding: 24px 16px; text-align: center; background: #1a1a1a; border-radius: 8px;">
      <div style="font-size: 11px; letter-spacing: 0.1em; color: #888; margin-bottom: 8px;">INTRODUCING</div>
      <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px;">Nova Engine</div>
      <p style="font-size: 12px; color: #999; line-height: 1.5; margin: 0 0 16px;">The next generation of creative tools.</p>
      <button style="padding: 8px 20px; background: #6366f1; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Get Started</button>
    </div>
  `,

  after: `
    <div style="width: 100%; max-width: 240px; padding: 24px 16px; text-align: center; background: #0a0a0f; border-radius: 8px; position: relative; overflow: hidden;">
      <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, oklch(0.35 0.15 280 / 0.4), transparent 60%), radial-gradient(ellipse at 70% 50%, oklch(0.3 0.12 330 / 0.3), transparent 60%); animation: od-shift 4s ease-in-out infinite alternate;"></div>
      <div style="position: absolute; top: 50%; left: 50%; width: 120px; height: 120px; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle, oklch(0.5 0.2 280 / 0.15), transparent 70%); filter: blur(20px); animation: od-pulse 3s ease-in-out infinite;"></div>
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.625rem; letter-spacing: 0.15em; color: oklch(0.7 0.1 280); margin-bottom: 8px; font-family: 'Instrument Sans', sans-serif;">INTRODUCING</div>
        <div style="font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 8px; font-family: 'Cormorant Garamond', serif; letter-spacing: -0.01em;">Nova Engine</div>
        <p style="font-size: 0.75rem; color: oklch(0.65 0.02 280); line-height: 1.5; margin: 0 0 16px; font-family: 'Instrument Sans', sans-serif;">The next generation of creative tools.</p>
        <button style="padding: 8px 20px; background: oklch(0.5 0.15 280 / 0.3); color: oklch(0.85 0.08 280); border: 1px solid oklch(0.5 0.15 280 / 0.4); border-radius: 4px; font-size: 0.75rem; cursor: pointer; backdrop-filter: blur(8px); font-family: 'Instrument Sans', sans-serif;">Get Started</button>
      </div>
      <style>
        @keyframes od-shift { to { transform: rotate(30deg) scale(1.1); } }
        @keyframes od-pulse { 0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); } }
      </style>
    </div>
  `
};
