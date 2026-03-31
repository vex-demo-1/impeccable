import { renderCommandDemo, initCommandDemo } from "../demo-renderer.js";
import { initSplitCompare } from "../effects/split-compare.js";
import { commandProcessSteps, commandCategories, commandRelationships, betaCommands } from "../data.js";

// Track current split instance and command for cleanup
let currentSplitInstance = null;
let currentCommandId = null;
let sourceCache = {}; // Cache fetched source content

const MOBILE_BREAKPOINT = 900;

function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function initGlassTerminal() {
    // Initial setup if needed
}

export function renderTerminalLayout(commands) {
    const container = document.querySelector('.commands-gallery');
    if (!container) return;

    if (isMobile()) {
        renderMobileLayout(container, commands);
    } else {
        renderDesktopLayout(container, commands);
    }

    // Re-render on resize crossing breakpoint
    let wasMobile = isMobile();
    window.addEventListener('resize', () => {
        const nowMobile = isMobile();
        if (nowMobile !== wasMobile) {
            wasMobile = nowMobile;
            currentSplitInstance = null;
            currentCommandId = null;
            if (nowMobile) {
                renderMobileLayout(container, commands);
            } else {
                renderDesktopLayout(container, commands);
            }
        }
    });
}

// ============================================
// DESKTOP LAYOUT - Magazine Spread
// ============================================

let magazineState = {
    currentIndex: 0,
    commands: [],
    isTransitioning: false,
    keyboardBound: false,
    intersectionObserver: null
};

const categoryOrder = ['diagnostic', 'quality', 'intensity', 'adaptation', 'enhancement', 'system'];
const categoryLabels = {
    'diagnostic': 'Diagnose',
    'quality': 'Quality',
    'intensity': 'Intensity',
    'adaptation': 'Adaptation',
    'enhancement': 'Enhancement',
    'system': 'System'
};

function renderDesktopLayout(container, commands) {
    magazineState.commands = commands;

    // Determine starting index from URL hash
    const hash = window.location.hash;
    let startIndex = 0;
    if (hash && hash.startsWith('#cmd-')) {
        const cmdId = hash.slice(5);
        const idx = commands.findIndex(c => c.id === cmdId);
        if (idx >= 0) startIndex = idx;
    }
    magazineState.currentIndex = startIndex;

    // Build ordered list with category separators for nav
    const grouped = {};
    commands.forEach(cmd => {
        const cat = commandCategories[cmd.id] || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(cmd);
    });

    // Filter out deprecated shims
    const deprecated = new Set(['teach-impeccable', 'frontend-design']);
    const filteredCommands = commands.filter(c => !deprecated.has(c.id));
    magazineState.commands = filteredCommands;

    // Build spreads HTML
    const spreadsHTML = filteredCommands.map((cmd, i) => renderSpread(cmd, i, i === startIndex)).join('');

    // Build fisheye list
    const fisheyeHTML = filteredCommands.map((cmd, i) => {
        const cat = commandCategories[cmd.id] || 'other';
        return `<button class="fisheye-item${i === startIndex ? ' is-active' : ''}" data-index="${i}" data-id="${cmd.id}" data-cat="${cat}"><span class="fisheye-slash">/</span>${cmd.id}</button>`;
    }).join('');

    container.innerHTML = `
        <div class="magazine-container">
            <div class="fisheye-list" id="fisheye-list">
                <div class="fisheye-scroll">${fisheyeHTML}</div>
            </div>
            <div class="magazine-viewport">
                ${spreadsHTML}
            </div>
        </div>
    `;

    // Init demo for active spread
    initSpreadDemo(startIndex);

    // Set up interactions
    setupFisheyeList(filteredCommands);
    setupMagazineKeyboard(filteredCommands);
    setupMagazineIntersection(container);
}

function renderSpread(cmd, index, isActive) {
    const cat = commandCategories[cmd.id] || 'other';
    const isBeta = betaCommands.includes(cmd.id);
    const relationship = commandRelationships[cmd.id];
    // Build relationship flow
    let flowHTML = '';
    if (relationship) {
        if (relationship.pairs) {
            flowHTML = `
                <div class="spread-flow">
                    <span class="spread-flow-icon">&#8596;</span>
                    <span class="spread-flow-label">pairs with</span>
                    <span class="spread-flow-cmd">/${relationship.pairs}</span>
                </div>`;
        } else if (relationship.leadsTo && relationship.leadsTo.length > 0) {
            flowHTML = `
                <div class="spread-flow">
                    <span class="spread-flow-icon">&#8594;</span>
                    <span class="spread-flow-label">leads to</span>
                    ${relationship.leadsTo.map(c => `<span class="spread-flow-cmd">/${c}</span>`).join(' ')}
                </div>`;
        } else if (relationship.combinesWith && relationship.combinesWith.length > 0) {
            flowHTML = `
                <div class="spread-flow">
                    <span class="spread-flow-icon">+</span>
                    <span class="spread-flow-label">combines with</span>
                    ${relationship.combinesWith.map(c => `<span class="spread-flow-cmd">/${c}</span>`).join(' ')}
                </div>`;
        }
        if (!flowHTML && relationship.flow) {
            flowHTML = `
                <div class="spread-flow">
                    <span class="spread-flow-label">${relationship.flow}</span>
                </div>`;
        }
    }

    return `
        <div class="magazine-spread${isActive ? ' active' : ''}" data-index="${index}" data-category="${cat}" data-id="${cmd.id}" id="cmd-${cmd.id}">
            <div class="spread-identity">
                <span class="spread-category-label">${categoryLabels[cat] || cat}</span>
                <h3 class="spread-command-name"><span class="spread-slash">/</span>${cmd.id}${isBeta ? '<span class="beta-badge">BETA</span>' : ''}</h3>
                <p class="spread-description">${cmd.description}</p>
                ${flowHTML}
            </div>
            <div class="spread-demo-area" data-demo-index="${index}">
                <!-- Demo rendered lazily -->
            </div>
        </div>
    `;
}

function initSpreadDemo(index) {
    const cmd = magazineState.commands[index];
    if (!cmd) return;

    const spread = document.querySelector(`.magazine-spread[data-index="${index}"]`);
    if (!spread) return;

    const demoArea = spread.querySelector('.spread-demo-area');
    if (!demoArea) return;

    // Cleanup previous split instance
    if (currentSplitInstance) {
        currentSplitInstance.destroy();
        currentSplitInstance = null;
    }

    currentCommandId = cmd.id;

    // Only render HTML once; re-init split compare every time
    if (demoArea.dataset.loaded !== 'true') {
        demoArea.innerHTML = renderCommandDemo(cmd.id);
        demoArea.dataset.loaded = 'true';
    }

    const splitComparison = demoArea.querySelector('.demo-split-comparison');
    if (splitComparison) {
        currentSplitInstance = initSplitCompare(splitComparison, {
            defaultPosition: 50
        });
    }
    initCommandDemo(cmd.id, demoArea);
}

function goToSpread(newIndex, commands) {
    if (newIndex < 0 || newIndex >= commands.length) return;
    if (newIndex === magazineState.currentIndex) return;

    const oldIndex = magazineState.currentIndex;
    magazineState.currentIndex = newIndex;

    const spreads = document.querySelectorAll('.magazine-spread');

    // Destroy the old split instance before switching
    if (currentSplitInstance) {
        currentSplitInstance.destroy();
        currentSplitInstance = null;
    }

    // Mark old as exiting
    spreads[oldIndex]?.classList.remove('active');
    spreads[oldIndex]?.classList.add('exiting');

    // Mark new as active
    spreads[newIndex]?.classList.add('active');
    spreads[newIndex]?.classList.remove('exiting');

    // No fisheye sync here -- fisheye drives goToSpread, not the other way around

    // Update URL hash
    const cmd = commands[newIndex];
    if (cmd) {
        history.replaceState(null, '', `#cmd-${cmd.id}`);
    }

    // Init demo for new spread (lazy)
    initSpreadDemo(newIndex);

    // Clean exiting class after transition
    setTimeout(() => {
        spreads[oldIndex]?.classList.remove('exiting');
    }, 500);
}

function setupFisheyeList(commands) {
    const list = document.getElementById('fisheye-list');
    const scroll = list?.querySelector('.fisheye-scroll');
    const items = list ? [...list.querySelectorAll('.fisheye-item')] : [];
    if (!list || !scroll || !items.length) return;

    // Fixed item height (matches CSS). All math is index-based.
    const ITEM_H = 39; // px per item (font 1.5rem * 1.3 line-height + 4px*2 padding)
    const RADIUS = 4; // items on each side affected by fisheye
    const count = items.length;
    let currentActive = -1;

    // Convert scroll position to fractional center index
    const scrollToFractional = () => {
        // Scroll area: padding-top puts index 0 at center when scrollTop=0
        return scroll.scrollTop / ITEM_H;
    };

    // Apply fisheye visual based on fractional center
    const applyFisheye = (center) => {
        items.forEach((item, i) => {
            const dist = Math.abs(i - center);
            const ratio = Math.max(0, 1 - dist / RADIUS);
            // Strong ease-out for dramatic center pop
            const eased = ratio * ratio * (3 - 2 * ratio); // smoothstep
            const scale = 0.35 + eased * 0.65;
            const opacity = 0.06 + eased * 0.94;
            item.style.transform = `scale(${scale})`;
            item.style.opacity = opacity;
        });
    };

    const activate = (idx) => {
        idx = Math.max(0, Math.min(count - 1, Math.round(idx)));
        if (idx === currentActive) return;
        currentActive = idx;
        items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
        goToSpread(idx, commands);
    };

    const scrollToIndex = (idx, behavior = 'smooth') => {
        idx = Math.max(0, Math.min(count - 1, idx));
        scroll.scrollTo({ top: idx * ITEM_H, behavior });
    };

    // Scroll: update fisheye + activate nearest
    let raf = null;
    scroll.addEventListener('scroll', () => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            const center = scrollToFractional();
            applyFisheye(center);
            activate(Math.round(center));
        });
    }, { passive: true });

    // Click to jump
    items.forEach((item, i) => {
        item.addEventListener('click', () => scrollToIndex(i));
    });

    // Expose for keyboard/external nav
    list._scrollToCommand = (idx) => scrollToIndex(idx);

    // Init
    const startIdx = magazineState.currentIndex;
    currentActive = -1;
    // Set padding so index 0 sits at center and last index sits at center
    const padH = list.clientHeight / 2 - ITEM_H / 2;
    scroll.style.paddingTop = `${padH}px`;
    scroll.style.paddingBottom = `${padH}px`;
    scroll.scrollTop = startIdx * ITEM_H;
    applyFisheye(startIdx);
    activate(startIdx);
}

function setupMagazineKeyboard(commands) {
    if (magazineState.keyboardBound) return;
    magazineState.keyboardBound = true;

    document.addEventListener('keydown', (e) => {
        // Only respond when magazine is visible (desktop)
        if (isMobile()) return;
        const magazineEl = document.querySelector('.magazine-container');
        if (!magazineEl) return;

        // Check if magazine is somewhat in the viewport
        const rect = magazineEl.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;

        const fisheyeList = document.getElementById('fisheye-list');
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            fisheyeList?._scrollToCommand?.(magazineState.currentIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            fisheyeList?._scrollToCommand?.(magazineState.currentIndex - 1);
        }
    });
}

function setupMagazineIntersection(container) {
    // When the magazine section enters the viewport, ensure the active demo is rendered
    if (magazineState.intersectionObserver) {
        magazineState.intersectionObserver.disconnect();
    }

    magazineState.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initSpreadDemo(magazineState.currentIndex);
            }
        });
    }, { threshold: 0.1 });

    const magazineEl = container.querySelector('.magazine-container');
    if (magazineEl) {
        magazineState.intersectionObserver.observe(magazineEl);
    }
}

function truncateDescription(text, maxLen = 120) {
    if (text.length <= maxLen) return text;
    // Cut at last sentence boundary within limit, or last word boundary
    const truncated = text.slice(0, maxLen);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > maxLen * 0.5) return truncated.slice(0, lastPeriod + 1);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace) + '...';
}

// ============================================
// MOBILE LAYOUT - Carousel + Sticky Demo
// ============================================

function renderMobileLayout(container, commands) {
    // Build carousel pills
    const carouselHTML = commands.map((cmd, i) => `
        <button class="mobile-cmd-pill${i === 0 ? ' active' : ''}" data-id="${cmd.id}">
            /${cmd.id}
        </button>
    `).join('');

    // Build command info cards (one per command, only active one shown)
    const infoCardsHTML = commands.map((cmd, i) => {
        const relationship = commandRelationships[cmd.id];
        let relationshipHTML = '';

        if (relationship) {
            if (relationship.pairs) {
                relationshipHTML = `<div class="mobile-cmd-rel">↔ pairs with <code>/${relationship.pairs}</code></div>`;
            } else if (relationship.leadsTo && relationship.leadsTo.length > 0) {
                relationshipHTML = `<div class="mobile-cmd-rel">→ leads to ${relationship.leadsTo.map(c => `<code>/${c}</code>`).join(', ')}</div>`;
            }
        }

        return `
            <div class="mobile-cmd-info${i === 0 ? ' active' : ''}" data-id="${cmd.id}">
                <h3 class="mobile-cmd-name">/${cmd.id}</h3>
                <p class="mobile-cmd-desc">${cmd.description}</p>
                ${relationshipHTML}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mobile-commands-layout">
            <div class="mobile-carousel-wrapper">
                <div class="mobile-carousel">
                    ${carouselHTML}
                </div>
            </div>
            <div class="mobile-demo-area" id="mobile-demo-content">
                ${renderCommandDemo(commands[0]?.id || 'audit')}
            </div>
            <div class="mobile-info-area">
                ${infoCardsHTML}
            </div>
        </div>
    `;

    setupMobileInteractions(commands);
}

function setupMobileInteractions(commands) {
    const pills = document.querySelectorAll('.mobile-cmd-pill');
    const demoArea = document.getElementById('mobile-demo-content');
    const infoCards = document.querySelectorAll('.mobile-cmd-info');

    // Initialize first demo's split compare
    const initialSplit = demoArea.querySelector('.demo-split-comparison');
    if (initialSplit) {
        currentSplitInstance = initSplitCompare(initialSplit, {
            defaultPosition: 50,
            minPosition: 10,
            maxPosition: 90
        });
    }
    if (commands[0]) initCommandDemo(commands[0].id, demoArea);

    // Pill click/tap handler
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            const cmdId = pill.dataset.id;
            const cmd = commands.find(c => c.id === cmdId);
            if (!cmd || currentCommandId === cmdId) return;

            currentCommandId = cmdId;

            // Update active pill
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            // Scroll pill into view horizontally
            pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

            // Update info card
            infoCards.forEach(card => {
                card.classList.toggle('active', card.dataset.id === cmdId);
            });

            // Cleanup previous split
            if (currentSplitInstance) {
                currentSplitInstance.destroy();
                currentSplitInstance = null;
            }

            // Update demo
            demoArea.innerHTML = renderCommandDemo(cmdId);

            // Init new split compare
            const splitComparison = demoArea.querySelector('.demo-split-comparison');
            if (splitComparison) {
                currentSplitInstance = initSplitCompare(splitComparison, {
                    defaultPosition: 50
                });
            }
            initCommandDemo(cmdId, demoArea);
        });
    });
}

// ============================================
// STACKED WINDOWS - Tab Switching
// ============================================

function setupStackTabs() {
    const tabs = document.querySelectorAll('.terminal-stack-tab');
    const demoWindow = document.querySelector('.terminal-window--demo');
    const sourceWindow = document.querySelector('.terminal-window--source');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;

            // Update tab states
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch windows
            if (view === 'source') {
                demoWindow.classList.add('is-back');
                sourceWindow.classList.add('is-front');
            } else {
                demoWindow.classList.remove('is-back');
                sourceWindow.classList.remove('is-front');
            }
        });
    });
}

async function fetchCommandSource(cmdId) {
    // Check cache first
    if (sourceCache[cmdId]) {
        return sourceCache[cmdId];
    }

    try {
        const response = await fetch(`/api/command-source/${cmdId}`);
        if (!response.ok) throw new Error('Failed to fetch source');
        const data = await response.json();
        sourceCache[cmdId] = data.content;
        return data.content;
    } catch (error) {
        console.error('Error fetching command source:', error);
        return null;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function updateSourceContent(cmdId) {
    const titleEl = document.getElementById('source-title');
    const contentEl = document.getElementById('source-content');

    if (!titleEl || !contentEl) return;

    titleEl.textContent = `${cmdId}.md`;
    contentEl.innerHTML = '<span class="source-loading">Loading...</span>';

    const source = await fetchCommandSource(cmdId);
    if (source) {
        contentEl.textContent = source;
    } else {
        contentEl.innerHTML = '<span class="source-loading">Source not available</span>';
    }
}

