// ============================================
// COMMAND DEMOS - Before/after demonstrations for commands
// ============================================

export function renderCommandDemo(commandId) {
  const demos = {
    'bolder': renderBolderDemo,
    'animate': renderAnimateDemo,
    'normalize': renderNormalizeDemo
  };
  
  const renderFn = demos[commandId];
  if (renderFn) return renderFn();
  
  return `
    <div class="demo-container">
      <div class="demo-header">
        <span class="demo-title">Command Preview</span>
      </div>
      <div class="demo-viewport">
        <div style="text-align: center; color: var(--c-ash); font-style: italic;">
          Visual demo for /${commandId} coming soon
        </div>
      </div>
    </div>
  `;
}

function renderBolderDemo() {
  return `
    <div class="demo-container">
      <div class="demo-header">
        <span class="demo-title">Before / After</span>
        <div class="demo-toggle">
          <span class="demo-toggle-label active">Before</span>
          <div class="demo-toggle-switch" data-demo="command-bolder"></div>
          <span class="demo-toggle-label">After</span>
        </div>
      </div>
      <div class="demo-viewport" data-state="before" id="command-bolder-viewport">
        <div style="text-align: center; padding: var(--s-md); max-width: 280px;">
          <div style="font-size: 1.125rem; font-weight: 500; margin-bottom: 8px; color: var(--c-charcoal);">Introducing Our Product</div>
          <div style="font-size: 0.875rem; color: var(--c-ash); margin-bottom: 16px;">A solution for modern teams</div>
          <button style="padding: 8px 16px; background: var(--c-mist); color: var(--c-charcoal); border: none; border-radius: 4px; font-size: 0.875rem;">Learn More</button>
        </div>
      </div>
      <div class="demo-caption">Timid design → Bold, confident design</div>
    </div>
  `;
}

function renderAnimateDemo() {
  return `
    <div class="demo-container">
      <div class="demo-header">
        <span class="demo-title">Before / After</span>
        <div class="demo-toggle">
          <span class="demo-toggle-label active">Before</span>
          <div class="demo-toggle-switch" data-demo="command-animate"></div>
          <span class="demo-toggle-label">After</span>
        </div>
      </div>
      <div class="demo-viewport demo-viewport-dark" data-state="before" id="command-animate-viewport">
        <div class="motion-demo-page" style="opacity: 1;">
          <div class="motion-demo-page-hero" style="opacity: 1; transform: none;">Hero</div>
          <div class="motion-demo-page-content">
            <div class="motion-demo-page-heading" style="opacity: 1; transform: none;"></div>
            <div class="motion-demo-page-text" style="opacity: 1; transform: none;"></div>
            <div class="motion-demo-page-text" style="opacity: 1; transform: none;"></div>
            <div class="motion-demo-page-text" style="opacity: 1; transform: none;"></div>
          </div>
        </div>
      </div>
      <div class="demo-caption">Static page → Choreographed page load</div>
    </div>
  `;
}

function renderNormalizeDemo() {
  return `
    <div class="demo-container">
      <div class="demo-header">
        <span class="demo-title">Before / After</span>
        <div class="demo-toggle">
          <span class="demo-toggle-label active">Before</span>
          <div class="demo-toggle-switch" data-demo="command-normalize"></div>
          <span class="demo-toggle-label">After</span>
        </div>
      </div>
      <div class="demo-viewport" data-state="before" id="command-normalize-viewport">
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 260px;">
          <div style="padding: 12px 16px; background: #f0f0f0; border-radius: 6px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Card One</div>
            <div style="font-size: 13px; color: #888;">Some description text here</div>
          </div>
          <div style="padding: 18px 12px; background: #e8e8e8; border-radius: 12px;">
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Card Two</div>
            <div style="font-size: 14px; color: #666;">Different spacing and styles</div>
          </div>
          <div style="padding: 10px 20px; background: #f5f5f5; border-radius: 4px;">
            <div style="font-size: 15px; font-weight: 700; margin-bottom: 2px;">Card Three</div>
            <div style="font-size: 12px; color: #999;">Yet another variation</div>
          </div>
        </div>
      </div>
      <div class="demo-caption">Inconsistent styles → Systematic design tokens</div>
    </div>
  `;
}

