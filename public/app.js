import {
	initGlassTerminal,
	renderTerminalLayout,
} from "./js/components/glass-terminal.js";
import { initLensEffect } from "./js/components/lens.js";
import { initFrameworkViz } from "./js/components/framework-viz.js";
import { initScrollReveal } from "./js/utils/reveal.js";
import { initAnchorScroll, initHashTracking } from "./js/utils/scroll.js";
import { initSectionNav } from "./js/components/section-nav.js";

// ============================================
// STATE
// ============================================

let allCommands = [];

// ============================================
// CONTENT LOADING
// ============================================

function escapeHtml(value) {
	if (typeof value !== "string") return "";
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

async function loadContent() {
	try {
		const [commandsRes, patternsRes] = await Promise.all([
			fetch("/api/commands"),
			fetch("/api/patterns"),
		]);

		// Check for HTTP errors
		if (!commandsRes.ok) {
			throw new Error(`Commands API failed: ${commandsRes.status}`);
		}
		if (!patternsRes.ok) {
			throw new Error(`Patterns API failed: ${patternsRes.status}`);
		}

		allCommands = await commandsRes.json();
		const patternsData = await patternsRes.json();

		// Render commands (Glass Terminal)
		renderTerminalLayout(allCommands);

		// Render patterns with tabbed navigation
		renderPatternsWithTabs(patternsData.patterns, patternsData.antipatterns);
	} catch (error) {
		console.error("Failed to load content:", error);
		showLoadError(error);
	}
}

function showLoadError(error) {
	// Show error in commands section
	const commandsGallery = document.querySelector('.commands-gallery');
	if (commandsGallery) {
		commandsGallery.innerHTML = `
			<div class="load-error" role="alert">
				<div class="load-error-icon" aria-hidden="true">⚠</div>
				<h3 class="load-error-title">Failed to load commands</h3>
				<p class="load-error-text">There was a problem loading the content. Please check your connection and try again.</p>
				<button class="btn btn-secondary load-error-retry" onclick="location.reload()">
					Retry
				</button>
			</div>
		`;
	}

	// Show error in patterns section
	const patternsContainer = document.getElementById("patterns-categories");
	if (patternsContainer) {
		patternsContainer.innerHTML = `
			<div class="load-error" role="alert">
				<div class="load-error-icon" aria-hidden="true">⚠</div>
				<h3 class="load-error-title">Failed to load patterns</h3>
				<p class="load-error-text">There was a problem loading the content. Please check your connection and try again.</p>
				<button class="btn btn-secondary load-error-retry" onclick="location.reload()">
					Retry
				</button>
			</div>
		`;
	}
}

function renderPatternsWithTabs(patterns, antipatterns) {
	const container = document.getElementById("patterns-categories");
	if (!container || !patterns || !antipatterns) return;

	const antipatternMap = {};
	antipatterns.forEach(cat => { antipatternMap[cat.name] = cat.items; });

	const icons = ['Aa', '&#9673;', '&#9638;', '&#10697;', '&#9881;', '&#9113;', '&#9998;', '&#9998;'];

	const itemsHTML = patterns.map((category, i) => {
		const antiItems = antipatternMap[category.name] || [];
		const totalCount = antiItems.length + category.items.length;
		return `
		<li class="disclosure-item" data-active="${i === 0 ? 'true' : 'false'}" data-index="${i}">
			<button class="disclosure-tab" aria-expanded="${i === 0 ? 'true' : 'false'}">
				<span class="disclosure-tab-label">${escapeHtml(category.name)}</span>
				<span class="disclosure-tab-icon">${icons[i] || '&#8226;'}</span>
			</button>
			<div class="disclosure-content">
				<div class="disclosure-toggle">
					<button class="disclosure-toggle-btn disclosure-toggle-btn--anti is-active" data-show="anti">Don't</button>
					<button class="disclosure-toggle-btn disclosure-toggle-btn--do" data-show="do">Do</button>
				</div>
				<div class="disclosure-content-inner">
					<div class="disclosure-columns">
						<div class="disclosure-col" data-col="anti">
							<ul>${antiItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
						</div>
						<div class="disclosure-col" data-col="do" hidden>
							<ul>${category.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
						</div>
					</div>
				</div>
			</div>
		</li>`;
	}).join('');

	container.innerHTML = `<ul class="disclosure-list">${itemsHTML}</ul>`;

	const list = container.querySelector('.disclosure-list');
	const items = list.querySelectorAll('.disclosure-item');

	const activate = (event) => {
		const closest = event.target.closest('.disclosure-item');
		if (!closest) return;
		const index = [...items].indexOf(closest);
		const cols = [...items].map((item, i) => {
			item.dataset.active = (index === i).toString();
			item.querySelector('.disclosure-tab').setAttribute('aria-expanded', index === i ? 'true' : 'false');
			return index === i ? '10fr' : '1fr';
		}).join(' ');
		list.style.setProperty('grid-template-columns', cols);
	};

	// Sync article width for content sizing
	const syncWidth = () => {
		const w = Math.max(...[...items].map(i => i.offsetWidth));
		list.style.setProperty('--dl-article-width', w);
	};
	window.addEventListener('resize', syncWidth);
	syncWidth();

	list.addEventListener('pointermove', activate);
	list.addEventListener('click', activate);
	list.addEventListener('focus', activate, true);

	// Don't/Do toggle within each card
	list.addEventListener('click', (e) => {
		const btn = e.target.closest('.disclosure-toggle-btn');
		if (!btn) return;
		e.stopPropagation();
		const item = btn.closest('.disclosure-item');
		const show = btn.dataset.show;
		item.querySelectorAll('.disclosure-toggle-btn').forEach(b => b.classList.remove('is-active'));
		btn.classList.add('is-active');
		item.querySelectorAll('.disclosure-col').forEach(col => {
			col.hidden = col.dataset.col !== show;
		});
	});
}

// ============================================
// EVENT HANDLERS
// ============================================

// Sync prefix radio buttons to hidden checkbox + update download button label
document.querySelectorAll('input[name="prefix-choice"]').forEach((radio) => {
	radio.addEventListener('change', () => {
		const prefixToggle = document.getElementById('prefix-toggle');
		if (prefixToggle) prefixToggle.checked = radio.value === 'prefixed';
		const btnLabel = document.querySelector('#download-zip-btn span');
		if (btnLabel) {
			btnLabel.textContent = radio.value === 'prefixed'
				? 'Download prefixed zip'
				: 'Download universal zip';
		}
	});
});

// Handle bundle download clicks via event delegation
document.addEventListener("click", (e) => {
	const bundleBtn = e.target.closest("[data-bundle]");
	if (bundleBtn) {
		const provider = bundleBtn.dataset.bundle;
		const prefixToggle = document.getElementById('prefix-toggle');
		const usePrefixed = prefixToggle && prefixToggle.checked;
		const bundleName = usePrefixed ? `${provider}-prefixed` : provider;
		window.location.href = `/api/download/bundle/${bundleName}`;
	}

	// Handle copy button clicks
	const copyBtn = e.target.closest("[data-copy]");
	if (copyBtn) {
		const textToCopy = copyBtn.dataset.copy;
		const onCopied = () => {
			copyBtn.classList.add('copied');
			setTimeout(() => copyBtn.classList.remove('copied'), 1500);
		};
		if (navigator.clipboard?.writeText) {
			navigator.clipboard.writeText(textToCopy).then(onCopied).catch(() => {});
		} else {
			// Fallback for non-HTTPS or older browsers
			const ta = Object.assign(document.createElement('textarea'), { value: textToCopy, style: 'position:fixed;left:-9999px' });
			document.body.appendChild(ta);
			ta.select();
			try { document.execCommand('copy'); onCopied(); } catch {}
			ta.remove();
		}
	}
});


// ============================================
// STARTUP
// ============================================

function init() {
	initAnchorScroll();
	initHashTracking();
	initLensEffect();
	initScrollReveal();
	initGlassTerminal();
	initFrameworkViz();
	initSectionNav();
	loadContent();

	document.body.classList.add("loaded");
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
