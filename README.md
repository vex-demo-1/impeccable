# impeccable.style

The anti-slop framework for AI design. One skill and 15 commands that fight model bias and produce intentional, distinctive frontends.

> **Visit [impeccable.style](https://impeccable.style)** to download bundles for Cursor, Claude Code, Gemini CLI, or Codex CLI.

## The Problem

Every LLM learned from the same generic templates. Without guidance, you get the same predictable mistakes: Inter font, purple gradients, cards nested in cards, gray text on colored backgrounds. This framework fights that bias.

## What's Included

### The Skill: frontend-design

A comprehensive design skill that guides creation of distinctive, production-grade frontend interfaces. Includes 7 domain-specific reference files:

- **typography** - Type systems, font selection, modular scales, fluid type, OpenType features
- **color-and-contrast** - OKLCH color spaces, tinted neutrals, dark mode, accessibility
- **spatial-design** - Spacing systems, grids, visual hierarchy, container queries
- **motion-design** - Easing curves, perceived performance, reduced motion, staggering
- **interaction-design** - Form design, focus states, loading patterns, keyboard navigation
- **responsive-design** - Mobile-first, fluid design, input detection, safe areas
- **ux-writing** - Button labels, error messages, empty states, accessibility

### Commands (15)

| Command | Purpose |
|---------|---------|
| **normalize** | Align with design system standards |
| **audit** | Quality audit with severity ratings |
| **polish** | Final pass before shipping |
| **clarify** | Improve unclear UX copy |
| **optimize** | Performance improvements |
| **harden** | Error handling, i18n, edge cases |
| **quieter** | Tone down overly bold designs |
| **bolder** | Amplify boring designs |
| **simplify** | Strip to essence |
| **animate** | Add purposeful motion |
| **colorize** | Introduce strategic color |
| **delight** | Add moments of joy |
| **extract** | Pull into design system |
| **adapt** | Adapt for different devices |
| **onboard** | Design onboarding flows |

### Patterns & Anti-Patterns

The skill includes curated patterns that fight model bias:

**Do**: Use modular type scales, pair distinctive fonts, use off-whites and near-blacks, create visual rhythm through varied spacing, use asymmetry and unexpected compositions.

**Don't**: Use overused fonts (Arial, Inter), use gray text on colored backgrounds, use pure black/gray (always tint), wrap everything in cards, nest cards inside cards, use bounce/elastic easing.

## Installation

### Cursor

```bash
# From website ZIP
unzip impeccable-style-cursor.zip -d your-project/

# From repo
cp -r dist/cursor/.cursor .cursor/
```

### Claude Code

```bash
# Global
cp -r dist/claude-code/.claude/* ~/.claude/

# Project-specific
cp -r dist/claude-code/.claude .claude/
```

### Gemini CLI

```bash
cp -r dist/gemini/.gemini/* ~/.gemini/
cp dist/gemini/GEMINI*.md ~/your-project-root/
```

### Codex CLI

```bash
cp -r dist/codex/.codex/* ~/.codex/
cp dist/codex/AGENTS*.md ~/your-project-root/
```

## Usage

**Cursor, Claude Code:**
```
/normalize
/audit
/polish
```

**Gemini:**
```
/normalize <optional-feature>
/audit <optional-area>
```

**Codex:**
```
/prompts:normalize
/prompts:audit
```

## Development

```bash
git clone https://github.com/pbakaus/vibe-design-plugins.git
cd vibe-design-plugins
bun run build
bun run dev  # http://localhost:3000
```

### Project Structure

- `source/` - Single source of truth for all content
- `dist/` - Generated provider-specific files
- `public/` - Website
- `scripts/` - Build system

See [DEVELOP.md](DEVELOP.md) for contributor guidelines.

## Provider Comparison

| Feature | Cursor | Claude Code | Gemini CLI | Codex CLI |
|---------|--------|-------------|------------|-----------|
| Command Args | No | Yes | Yes | Yes |
| Frontmatter | No | Yes | Yes (TOML) | Yes |
| Modular Skills | No | No | Yes | Yes |

## License

See LICENSE file.

---

Created by [Paul Bakaus](https://www.paulbakaus.com)
