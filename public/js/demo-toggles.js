// ============================================
// DEMO TOGGLES - Handle before/after toggle interactions
// ============================================

export function setupDemoToggles() {
  document.querySelectorAll('.demo-toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const demoId = toggle.dataset.demo;
      const isActive = toggle.classList.toggle('active');
      
      // Update labels
      const labels = toggle.parentElement.querySelectorAll('.demo-toggle-label');
      labels[0].classList.toggle('active', !isActive);
      labels[1].classList.toggle('active', isActive);
      
      // Update demo state
      handleDemoToggle(demoId, isActive);
    });
  });
  
  // Setup interactive buttons
  setupInteractiveButtons();
}

export function setupCommandDemoToggles(allCommands, selectCommand) {
  document.querySelectorAll('.command-demo-area .demo-toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const demoId = toggle.dataset.demo;
      const isActive = toggle.classList.toggle('active');
      
      const labels = toggle.parentElement.querySelectorAll('.demo-toggle-label');
      labels[0].classList.toggle('active', !isActive);
      labels[1].classList.toggle('active', isActive);
      
      handleCommandDemoToggle(demoId, isActive);
    });
  });
  
  document.querySelectorAll('.command-detail-panel .relationship-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const commandId = tag.dataset.command;
      const command = allCommands.find(c => c.id === commandId);
      if (command) selectCommand(command);
    });
  });
}

function setupInteractiveButtons() {
  // Like button feedback demo
  document.querySelectorAll('.int-fb-active[data-action="like"]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('liked');
      const label = btn.nextElementSibling;
      if (label) {
        label.textContent = btn.classList.contains('liked') ? 'Liked!' : 'Click me!';
      }
    });
  });
}

function handleDemoToggle(demoId, isAfter) {
  const viewport = document.getElementById(`${demoId}-viewport`);
  if (!viewport) return;
  
  viewport.dataset.state = isAfter ? 'after' : 'before';
  
  // Handle specific demo transformations
  switch (demoId) {
    // UX Writing
    case 'uxwriting-error':
      toggleUXError(viewport, isAfter);
      break;
    case 'uxwriting-buttons':
      toggleUXButtons(viewport, isAfter);
      break;
    case 'uxwriting-empty':
      toggleUXEmpty(viewport, isAfter);
      break;
      
    // Spatial Design
    case 'spatial-grid':
      toggleSpatialGrid(viewport, isAfter);
      break;
    case 'spatial-hierarchy':
      toggleSpatialHierarchy(viewport, isAfter);
      break;
    case 'spatial-whitespace':
      toggleSpatialWhitespace(viewport, isAfter);
      break;
      
    // Motion Design
    case 'motion-stagger':
      toggleMotionStagger(viewport, isAfter);
      break;
    case 'motion-micro':
      toggleMotionMicro(viewport, isAfter);
      break;
    case 'motion-transition':
      toggleMotionTransition(viewport, isAfter);
      break;
      
    // Typography
    case 'typography-pairing':
      toggleTypoPairing(viewport, isAfter);
      break;
    case 'typography-hierarchy':
      toggleTypoHierarchy(viewport, isAfter);
      break;
      
    // Interaction Design
    case 'interaction-states':
      // No content change needed - CSS handles it
      break;
    case 'interaction-affordance':
      toggleAffordance(viewport, isAfter);
      break;
    case 'interaction-feedback':
      toggleFeedback(viewport, isAfter);
      break;
      
    // Color & Contrast
    case 'color-palette':
      toggleColorPalette(viewport, isAfter);
      break;
    case 'color-accent':
      toggleColorAccent(viewport, isAfter);
      break;
  }
}

// ========== UX WRITING ==========

function toggleUXError(viewport, isAfter) {
  const demo = viewport.querySelector('.uxw-demo');
  if (!demo) return;
  
  if (isAfter) {
    demo.className = 'uxw-demo uxw-error-after';
    demo.innerHTML = `
      <div class="uxw-error-icon">🔐</div>
      <div class="uxw-error-title">You don't have access</div>
      <div class="uxw-error-text">Your session may have expired. Sign in again to continue.</div>
      <div class="uxw-error-action">Sign in →</div>
    `;
  } else {
    demo.className = 'uxw-demo uxw-error-before';
    demo.innerHTML = `
      <div class="uxw-error-icon">⚠</div>
      <div class="uxw-error-title">Error 403</div>
      <div class="uxw-error-text">Access denied. Authentication failure occurred.</div>
    `;
  }
}

function toggleUXButtons(viewport, isAfter) {
  const demo = viewport.querySelector('.uxw-demo');
  if (!demo) return;
  
  if (isAfter) {
    demo.innerHTML = `
      <div class="uxw-button-context">Delete account permanently?</div>
      <div class="uxw-button-row">
        <button class="uxw-btn uxw-btn-danger">Delete My Account</button>
        <button class="uxw-btn uxw-btn-secondary">Keep Account</button>
      </div>
    `;
  } else {
    demo.innerHTML = `
      <div class="uxw-button-context">Delete account permanently?</div>
      <div class="uxw-button-row">
        <button class="uxw-btn uxw-btn-primary">Submit</button>
        <button class="uxw-btn uxw-btn-secondary">Cancel</button>
      </div>
    `;
  }
}

function toggleUXEmpty(viewport, isAfter) {
  const demo = viewport.querySelector('.uxw-demo');
  if (!demo) return;
  
  if (isAfter) {
    demo.className = 'uxw-demo uxw-empty-after';
    demo.innerHTML = `
      <div class="uxw-empty-icon">📝</div>
      <div class="uxw-empty-title">No projects yet</div>
      <div class="uxw-empty-text">Create your first project to get started.</div>
      <div class="uxw-empty-action"><button class="uxw-btn uxw-btn-primary">Create Project</button></div>
    `;
  } else {
    demo.className = 'uxw-demo uxw-empty-before';
    demo.innerHTML = `
      <div class="uxw-empty-icon">📁</div>
      <div class="uxw-empty-title">No items</div>
    `;
  }
}

// ========== SPATIAL DESIGN ==========

function toggleSpatialGrid(viewport, isAfter) {
  const demo = viewport.querySelector('.spatial-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'spatial-demo spatial-grid-after' : 'spatial-demo spatial-grid-before';
  
  // Reset inline styles on children
  demo.querySelectorAll('.spatial-card-item').forEach((item, i) => {
    item.style.width = isAfter ? '' : ['45%', '30%', '55%', '25%'][i];
  });
}

function toggleSpatialHierarchy(viewport, isAfter) {
  const demo = viewport.querySelector('.spatial-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'spatial-demo spatial-hierarchy-after' : 'spatial-demo spatial-hierarchy-before';
}

function toggleSpatialWhitespace(viewport, isAfter) {
  const demo = viewport.querySelector('.spatial-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'spatial-demo spatial-whitespace-after' : 'spatial-demo spatial-whitespace-before';
}

// ========== MOTION DESIGN ==========

function toggleMotionStagger(viewport, isAfter) {
  if (isAfter) {
    // Trigger re-animation by cloning elements
    const items = viewport.querySelectorAll('.motion-list-item');
    items.forEach(item => {
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
    });
  }
}

function toggleMotionMicro(viewport, isAfter) {
  const btn = viewport.querySelector('.motion-btn');
  if (!btn) return;
  
  btn.className = isAfter ? 'motion-btn motion-btn-after' : 'motion-btn motion-btn-before';
}

function toggleMotionTransition(viewport, isAfter) {
  const card = viewport.querySelector('.motion-card');
  if (!card) return;
  
  card.className = isAfter ? 'motion-card motion-card-after' : 'motion-card motion-card-before';
  
  if (isAfter) {
    card.querySelector('.motion-card-icon').textContent = '✓';
    card.querySelector('.motion-card-text').textContent = 'Order Confirmed';
  } else {
    card.querySelector('.motion-card-icon').textContent = '📦';
    card.querySelector('.motion-card-text').textContent = 'Order Placed';
  }
}

// ========== TYPOGRAPHY ==========

function toggleTypoPairing(viewport, isAfter) {
  const demo = viewport.querySelector('.typo-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'typo-demo typo-pairing-after' : 'typo-demo typo-pairing-before';
}

function toggleTypoHierarchy(viewport, isAfter) {
  const demo = viewport.querySelector('.typo-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'typo-demo typo-hierarchy-after' : 'typo-demo typo-hierarchy-before';
}

// ========== INTERACTION DESIGN ==========

function toggleAffordance(viewport, isAfter) {
  const demo = viewport.querySelector('.int-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'int-demo int-affordance-after' : 'int-demo int-affordance-before';
}

function toggleFeedback(viewport, isAfter) {
  const demo = viewport.querySelector('.int-demo');
  if (!demo) return;
  
  if (isAfter) {
    demo.className = 'int-demo int-feedback-after';
    demo.innerHTML = `
      <button class="int-fb-btn int-fb-active" data-action="like">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
      <span class="int-fb-label">Click to try!</span>
    `;
    // Re-setup interactive button
    setupInteractiveButtons();
  } else {
    demo.className = 'int-demo int-feedback-before';
    demo.innerHTML = `
      <button class="int-fb-btn int-fb-silent">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
      <span class="int-fb-label">Click — nothing happens</span>
    `;
  }
}

// ========== COLOR & CONTRAST ==========

function toggleColorPalette(viewport, isAfter) {
  const demo = viewport.querySelector('.color-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'color-demo color-palette-after' : 'color-demo color-palette-before';
}

function toggleColorAccent(viewport, isAfter) {
  const demo = viewport.querySelector('.color-demo');
  if (!demo) return;
  
  demo.className = isAfter ? 'color-demo color-accent-after' : 'color-demo color-accent-before';
}

// ========== COMMAND DEMOS ==========

function handleCommandDemoToggle(demoId, isAfter) {
  switch (demoId) {
    case 'command-bolder':
      handleBolderDemo(isAfter);
      break;
    case 'command-animate':
      handleAnimateDemo(isAfter);
      break;
    case 'command-normalize':
      handleNormalizeDemo(isAfter);
      break;
  }
}

function handleBolderDemo(isAfter) {
  const viewport = document.getElementById('command-bolder-viewport');
  if (!viewport) return;
  
  if (isAfter) {
    viewport.innerHTML = `
      <div style="text-align: center; padding: var(--s-lg); max-width: 320px;">
        <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 300; font-style: italic; margin-bottom: 12px; color: var(--c-text); line-height: 1;">Introducing Our Product</div>
        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--c-accent); margin-bottom: 24px;">A solution for modern teams</div>
        <button style="padding: 14px 32px; background: var(--c-text); color: var(--c-paper); border: none; font-size: 0.9375rem; font-weight: 500; letter-spacing: 0.02em;">Learn More</button>
      </div>
    `;
  } else {
    viewport.innerHTML = `
      <div style="text-align: center; padding: var(--s-md); max-width: 280px;">
        <div style="font-size: 1.125rem; font-weight: 500; margin-bottom: 8px; color: var(--c-charcoal);">Introducing Our Product</div>
        <div style="font-size: 0.875rem; color: var(--c-ash); margin-bottom: 16px;">A solution for modern teams</div>
        <button style="padding: 8px 16px; background: var(--c-mist); color: var(--c-charcoal); border: none; border-radius: 4px; font-size: 0.875rem;">Learn More</button>
      </div>
    `;
  }
}

function handleAnimateDemo(isAfter) {
  const viewport = document.getElementById('command-animate-viewport');
  if (viewport) {
    viewport.dataset.state = isAfter ? 'after' : 'before';
    if (isAfter) {
      const page = viewport.querySelector('.motion-demo-page');
      if (page) {
        const clone = page.cloneNode(true);
        page.parentNode.replaceChild(clone, page);
      }
    }
  }
}

function handleNormalizeDemo(isAfter) {
  const viewport = document.getElementById('command-normalize-viewport');
  if (!viewport) return;
  
  if (isAfter) {
    viewport.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--s-sm); width: 100%; max-width: 260px;">
        <div style="padding: var(--s-md); background: var(--c-bg); border-radius: 4px; border-left: 2px solid var(--c-accent);">
          <div style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 4px; color: var(--c-text);">Card One</div>
          <div style="font-size: 0.8125rem; color: var(--c-ash);">Consistent description text</div>
        </div>
        <div style="padding: var(--s-md); background: var(--c-bg); border-radius: 4px; border-left: 2px solid var(--c-accent);">
          <div style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 4px; color: var(--c-text);">Card Two</div>
          <div style="font-size: 0.8125rem; color: var(--c-ash);">Same spacing and styles</div>
        </div>
        <div style="padding: var(--s-md); background: var(--c-bg); border-radius: 4px; border-left: 2px solid var(--c-accent);">
          <div style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 4px; color: var(--c-text);">Card Three</div>
          <div style="font-size: 0.8125rem; color: var(--c-ash);">Unified design system</div>
        </div>
      </div>
    `;
  } else {
    viewport.innerHTML = `
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
    `;
  }
}
