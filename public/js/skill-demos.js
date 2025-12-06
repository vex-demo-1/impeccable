// ============================================
// SKILL DEMOS - Interactive before/after demonstrations
// Each skill has multiple demos selectable via tabs
// ============================================

// Demo definitions for each skill
const skillDemoDefinitions = {
  'ux-writing': [
    { id: 'errors', label: 'Error Messages', demo: 'uxwriting-error' },
    { id: 'buttons', label: 'Button Labels', demo: 'uxwriting-buttons' },
    { id: 'empty', label: 'Empty States', demo: 'uxwriting-empty' }
  ],
  'spatial-design': [
    { id: 'grid', label: 'Grid Systems', demo: 'spatial-grid' },
    { id: 'hierarchy', label: 'Visual Weight', demo: 'spatial-hierarchy' },
    { id: 'whitespace', label: 'Breathing Room', demo: 'spatial-whitespace' }
  ],
  'motion-design': [
    { id: 'stagger', label: 'Staggered Reveal', demo: 'motion-stagger' },
    { id: 'micro', label: 'Micro-interactions', demo: 'motion-micro' },
    { id: 'transition', label: 'State Changes', demo: 'motion-transition' }
  ],
  'typography': [
    { id: 'pairing', label: 'Font Pairing', demo: 'typography-pairing' },
    { id: 'hierarchy', label: 'Scale & Hierarchy', demo: 'typography-hierarchy' }
  ],
  'interaction-design': [
    { id: 'states', label: 'Button States', demo: 'interaction-states' },
    { id: 'affordance', label: 'Affordances', demo: 'interaction-affordance' },
    { id: 'feedback', label: 'Feedback', demo: 'interaction-feedback' }
  ],
  'color-and-contrast': [
    { id: 'palette', label: 'Color Harmony', demo: 'color-palette' },
    { id: 'accent', label: 'Strategic Accent', demo: 'color-accent' },
    { id: 'contrast', label: 'Contrast Ratios', demo: 'color-contrast' }
  ],
  'responsive-design': [
    { id: 'touch', label: 'Touch Targets', demo: 'responsive-touch' },
    { id: 'fluid', label: 'Fluid Layout', demo: 'responsive-fluid' },
    { id: 'adapt', label: 'Adaptive Content', demo: 'responsive-adapt' }
  ]
};

export function renderSkillDemo(skillId) {
  const demos = skillDemoDefinitions[skillId];
  if (!demos || demos.length === 0) {
    return renderGenericDemo(skillId);
  }
  
  const showTabs = demos.length > 1;
  
  const tabs = showTabs ? demos.map((d, i) => `
    <button class="demo-tab ${i === 0 ? 'active' : ''}" data-demo-tab="${d.id}" data-skill="${skillId}">
      ${d.label}
    </button>
  `).join('') : '';
  
  const demoContents = demos.map((d, i) => `
    <div class="demo-panel ${i === 0 ? 'active' : ''}" data-demo-panel="${d.id}">
      ${renderDemoContent(skillId, d)}
    </div>
  `).join('');
  
  return `
    <div class="demo-tabbed-container">
      ${showTabs ? `<div class="demo-tabs">${tabs}</div>` : ''}
      <div class="demo-panels">
        ${demoContents}
      </div>
    </div>
  `;
}

function renderDemoContent(_skillId, demoConfig) {
  const demoId = demoConfig.demo;
  const noToggle = ['color-contrast', 'responsive-touch', 'responsive-fluid', 'responsive-adapt'];
  const hasToggle = !noToggle.includes(demoId);
  
  return `
    <div class="demo-container">
      <div class="demo-header">
        ${hasToggle ? `
          <div class="demo-toggle">
            <span class="demo-toggle-label active">Before</span>
            <div class="demo-toggle-switch" data-demo="${demoId}"></div>
            <span class="demo-toggle-label">After</span>
          </div>
        ` : ''}
      </div>
      <div class="demo-viewport" data-state="before" id="${demoId}-viewport">
        ${getDemoInitialContent(demoId)}
      </div>
      <div class="demo-caption">${getDemoCaption(demoId)}</div>
    </div>
  `;
}

function getDemoCaption(demoId) {
  const captions = {
    // UX Writing
    'uxwriting-error': 'Technical jargon vs human, actionable guidance',
    'uxwriting-buttons': 'Vague labels vs clear, specific actions',
    'uxwriting-empty': 'Blank nothing vs helpful, encouraging guidance',
    // Spatial Design
    'spatial-grid': 'Chaotic placement vs intentional grid alignment',
    'spatial-hierarchy': 'Equal weight vs clear visual priority',
    'spatial-whitespace': 'Cramped elements vs comfortable spacing',
    // Motion Design
    'motion-stagger': 'Instant appearance vs orchestrated reveal',
    'motion-micro': 'Static button vs responsive feedback',
    'motion-transition': 'Jarring change vs smooth transition',
    // Typography
    'typography-pairing': 'Generic system fonts vs distinctive pairing',
    'typography-hierarchy': 'Flat sizing vs dramatic scale contrast',
    // Interaction Design
    'interaction-states': 'Missing states vs complete interaction feedback',
    'interaction-affordance': 'Unclear actions vs obvious clickability',
    'interaction-feedback': 'Silent actions vs immediate confirmation',
    // Color & Contrast
    'color-palette': 'Clashing colors vs harmonious palette',
    'color-accent': 'Monochrome monotony vs strategic accent',
    'color-contrast': 'Accessibility failures vs WCAG compliance',
    // Responsive Design
    'responsive-touch': 'Tiny targets vs accessible touch areas',
    'responsive-fluid': 'Fixed breakage vs fluid adaptation',
    'responsive-adapt': 'Same layout vs optimized for context'
  };
  return captions[demoId] || '';
}

function getDemoInitialContent(demoId) {
  const contents = {
    // ========== UX WRITING ==========
    'uxwriting-error': `
      <div class="uxw-demo uxw-error-before">
        <div class="uxw-error-icon">⚠</div>
        <div class="uxw-error-title">Error 403</div>
        <div class="uxw-error-text">Access denied. Authentication failure occurred.</div>
      </div>
    `,
    'uxwriting-buttons': `
      <div class="uxw-demo uxw-buttons-before">
        <div class="uxw-button-row">
          <button class="uxw-btn uxw-btn-primary">Submit</button>
          <button class="uxw-btn uxw-btn-secondary">Cancel</button>
        </div>
        <div class="uxw-button-context">Delete account permanently?</div>
      </div>
    `,
    'uxwriting-empty': `
      <div class="uxw-demo uxw-empty-before">
        <div class="uxw-empty-icon">📁</div>
        <div class="uxw-empty-title">No items</div>
      </div>
    `,
    
    // ========== SPATIAL DESIGN ==========
    'spatial-grid': `
      <div class="spatial-demo spatial-grid-before">
        <div class="spatial-card-item" style="width: 45%;">Card One</div>
        <div class="spatial-card-item" style="width: 30%;">Card Two</div>
        <div class="spatial-card-item" style="width: 55%;">Card Three</div>
        <div class="spatial-card-item" style="width: 25%;">Card Four</div>
      </div>
    `,
    'spatial-hierarchy': `
      <div class="spatial-demo spatial-hierarchy-before">
        <div class="spatial-h-title">Welcome Back</div>
        <div class="spatial-h-subtitle">Dashboard</div>
        <div class="spatial-h-cta">View Reports</div>
        <div class="spatial-h-link">Settings</div>
      </div>
    `,
    'spatial-whitespace': `
      <div class="spatial-demo spatial-whitespace-before">
        <div class="spatial-ws-title">Premium Plan</div>
        <div class="spatial-ws-price">$29/mo</div>
        <div class="spatial-ws-features">Unlimited projects • Priority support • Advanced analytics</div>
        <button class="spatial-ws-btn">Upgrade Now</button>
      </div>
    `,
    
    // ========== MOTION DESIGN ==========
    'motion-stagger': `
      <div class="motion-demo motion-stagger-demo">
        <div class="motion-list-item"><span class="motion-dot"></span>Dashboard</div>
        <div class="motion-list-item"><span class="motion-dot"></span>Analytics</div>
        <div class="motion-list-item"><span class="motion-dot"></span>Settings</div>
        <div class="motion-list-item"><span class="motion-dot"></span>Profile</div>
      </div>
    `,
    'motion-micro': `
      <div class="motion-demo motion-micro-demo">
        <button class="motion-btn motion-btn-before">Add to Cart</button>
      </div>
    `,
    'motion-transition': `
      <div class="motion-demo motion-transition-demo">
        <div class="motion-card motion-card-before">
          <div class="motion-card-icon">📦</div>
          <div class="motion-card-text">Order Placed</div>
        </div>
      </div>
    `,
    
    // ========== TYPOGRAPHY ==========
    'typography-pairing': `
      <div class="typo-demo typo-pairing-before">
        <div class="typo-heading">Welcome to the Future</div>
        <div class="typo-body">Experience innovation like never before with our cutting-edge platform designed for modern teams.</div>
      </div>
    `,
    'typography-hierarchy': `
      <div class="typo-demo typo-hierarchy-before">
        <div class="typo-h1">Article Title</div>
        <div class="typo-meta">Published January 2025</div>
        <div class="typo-p">This is the body text of the article containing the main content and ideas.</div>
      </div>
    `,
    
    // ========== INTERACTION DESIGN ==========
    'interaction-states': `
      <div class="int-demo int-states-demo">
        <div class="int-state-row">
          <span class="int-state-label">Poor</span>
          <button class="int-btn int-btn-poor">Click Me</button>
        </div>
        <div class="int-state-row">
          <span class="int-state-label">Good</span>
          <button class="int-btn int-btn-good">Click Me</button>
        </div>
      </div>
    `,
    'interaction-affordance': `
      <div class="int-demo int-affordance-before">
        <div class="int-aff-item int-aff-poor">
          <span>Learn more</span>
        </div>
        <div class="int-aff-item int-aff-poor">
          <span>Settings</span>
        </div>
      </div>
    `,
    'interaction-feedback': `
      <div class="int-demo int-feedback-before">
        <button class="int-fb-btn int-fb-silent">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <span class="int-fb-label">Click — nothing happens</span>
      </div>
    `,
    
    // ========== COLOR & CONTRAST ==========
    'color-palette': `
      <div class="color-demo color-palette-before">
        <div class="color-swatch swatch-1"></div>
        <div class="color-swatch swatch-2"></div>
        <div class="color-swatch swatch-3"></div>
        <div class="color-swatch swatch-4"></div>
        <div class="color-swatch swatch-5"></div>
        <div class="color-card">
          <span class="card-title">Title</span>
          <span class="card-subtitle">Subtitle</span>
          <button class="card-btn">Action</button>
        </div>
      </div>
    `,
    'color-accent': `
      <div class="color-demo color-accent-before">
        <div class="color-accent-card">
          <div class="color-accent-title">Premium Plan</div>
          <div class="color-accent-text">Unlock all features and get priority support.</div>
          <button class="color-accent-btn">Upgrade Now</button>
        </div>
      </div>
    `,
    'color-contrast': `
      <div class="color-demo color-contrast-static">
        <div class="contrast-example contrast-fail">
          <span class="contrast-badge">Fails WCAG</span>
          <div class="contrast-text">Hard to Read</div>
          <div class="contrast-ratio">2.5:1</div>
        </div>
        <div class="contrast-example contrast-pass">
          <span class="contrast-badge">Passes AAA</span>
          <div class="contrast-text">Easy to Read</div>
          <div class="contrast-ratio">12.6:1</div>
        </div>
      </div>
    `,
    
    // ========== RESPONSIVE DESIGN ==========
    'responsive-touch': `
      <div class="resp-demo resp-touch-demo">
        <div class="resp-touch-row">
          <span class="resp-label">Too Small</span>
          <div class="resp-touch-targets resp-touch-bad">
            <button>×</button>
            <button>−</button>
            <button>+</button>
          </div>
        </div>
        <div class="resp-touch-row">
          <span class="resp-label">Accessible</span>
          <div class="resp-touch-targets resp-touch-good">
            <button>×</button>
            <button>−</button>
            <button>+</button>
          </div>
        </div>
      </div>
    `,
    'responsive-fluid': `
      <div class="resp-demo resp-fluid-demo">
        <div class="resp-fluid-container">
          <div class="resp-fluid-fixed">
            <span>Fixed 400px</span>
            <div class="resp-fluid-bar" style="width: 400px; max-width: 100%;"></div>
          </div>
          <div class="resp-fluid-adaptive">
            <span>Fluid 80%</span>
            <div class="resp-fluid-bar" style="width: 80%;"></div>
          </div>
        </div>
      </div>
    `,
    'responsive-adapt': `
      <div class="resp-demo resp-adapt-demo">
        <div class="resp-device resp-device-mobile">
          <div class="resp-device-screen">
            <div class="resp-block resp-header"></div>
            <div class="resp-block resp-content"></div>
          </div>
          <span>Mobile</span>
        </div>
        <div class="resp-device resp-device-tablet">
          <div class="resp-device-screen">
            <div class="resp-block resp-header"></div>
            <div class="resp-block-row">
              <div class="resp-block resp-content"></div>
              <div class="resp-block resp-content"></div>
            </div>
          </div>
          <span>Tablet</span>
        </div>
        <div class="resp-device resp-device-desktop">
          <div class="resp-device-screen">
            <div class="resp-block-row">
              <div class="resp-block resp-sidebar"></div>
              <div class="resp-block resp-content"></div>
            </div>
          </div>
          <span>Desktop</span>
        </div>
      </div>
    `
  };
  return contents[demoId] || '<div style="padding: 2rem; text-align: center; color: #999;">Demo coming soon</div>';
}

function renderGenericDemo(skillId) {
  return `
    <div class="demo-container">
      <div class="demo-viewport">
        <div style="text-align: center; color: var(--c-ash); padding: var(--s-xl);">
          <p>Demo for ${skillId.replace(/-/g, ' ')} coming soon</p>
        </div>
      </div>
    </div>
  `;
}

export function setupDemoTabs() {
  document.querySelectorAll('.demo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.demoTab;
      const container = tab.closest('.demo-tabbed-container');
      
      container.querySelectorAll('.demo-tab').forEach(t => { t.classList.remove('active'); });
      tab.classList.add('active');
      
      container.querySelectorAll('.demo-panel').forEach(p => { p.classList.remove('active'); });
      container.querySelector(`[data-demo-panel="${tabId}"]`)?.classList.add('active');
    });
  });
}
