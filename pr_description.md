## Summary

Hey @pbakaus 👋

I ran your skills through `tessl skill review` at work and found some targeted improvements. Here's the full before/after:

| Skill | Before | After | Change |
|-------|--------|-------|--------|
| distill | 31% | 80% | +49% |
| delight | 32% | 74% | +42% |
| polish | 44% | 80% | +36% |
| animate | 55% | 89% | +34% |
| clarify | 49% | 83% | +34% |
| critique | 51% | 85% | +34% |
| normalize | 46% | 80% | +34% |
| optimize | 49% | 83% | +34% |
| adapt | 48% | 81% | +33% |
| extract | 48% | 81% | +33% |
| harden | 49% | 79% | +30% |
| arrange | 51% | 76% | +25% |
| bolder | 51% | 76% | +25% |
| colorize | 48% | 72% | +24% |
| overdrive | 48% | 70% | +22% |
| typeset | 64% | 85% | +21% |
| audit | 61% | 81% | +20% |
| onboard | 56% | 75% | +19% |
| quieter | 59% | 76% | +17% |
| teach-impeccable | 68% | 80% | +12% |
| frontend-design | 76% | 76% | +0% |

![Score Card](score_card.png)

**Note:** These skills are auto-generated from `source/skills/` via your build system, so the changes target the source files directly. The `dist/` outputs were regenerated with `bun run build`.

<details>
<summary>Changes made</summary>

All changes are limited to the `description` field in each skill's YAML frontmatter (in `source/skills/*/SKILL.md`). No skill body content was modified.

The consistent improvement across all skills was adding:
- **"Use when..." clauses** with explicit trigger terms — the #1 issue flagged by the reviewer. Without these, agents have no clear signal for when to select a skill from a large library.
- **Natural user keywords** — terms users would actually say (e.g., "too bold", "laggy", "spacing issues") rather than abstract descriptors.
- **Specific concrete actions** — listing what the skill actually does rather than describing outcomes in vague terms.
- **Quoted string format** — ensuring descriptions use standard YAML quoted strings.

`frontend-design` was already well-scored and left unchanged.

</details>

## Type of change

- [x] New / updated skill reference

## Checklist

- [x] Source files updated in `source/`
- [x] `bun run build` ran successfully
- [ ] `bun test` passes
- [ ] Tested with at least one provider (Cursor / Claude Code / Gemini CLI / Codex / Copilot / Kiro / OpenCode)
- [ ] README / DEVELOP.md updated if needed

---

Honest disclosure — I work at @tesslio where we build tooling around skills like these. Not a pitch - just saw room for improvement and wanted to contribute.

Want to self-improve your skills? Just point your agent (Claude Code, Codex, etc.) at [this Tessl guide](https://docs.tessl.io/evaluate/optimize-a-skill-using-best-practices) and ask it to optimize your skill. Ping me - [@rohan-tessl](https://github.com/rohan-tessl) - if you hit any snags.

Thanks in advance 🙏
