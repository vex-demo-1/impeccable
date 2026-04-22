# Framework fixtures

Representative project shapes for exercising live mode against different framework conventions. Each fixture is a small directory tree that the test harness copies into a temp git repo, then drives `live-inject.mjs`, `live-wrap.mjs`, `live-accept.mjs`, and `is-generated.mjs` against.

## Layout

```
<fixture>/
  files/              project tree the test copies into tmp
  gitignore.txt       becomes .gitignore in tmp (so we can commit the real files here)
  fixture.json        config + expected results the test consumes
```

`fixture.json` schema:

```json
{
  "name": "human-readable label",
  "config": { ...contents for live-inject.mjs config.json ... },
  "sourceFiles": ["paths that is-generated should classify as source (false)"],
  "generatedFiles": ["paths that is-generated should classify as generated (true)"],
  "wrapCases": [
    {
      "name": "description",
      "args": { "classes": "...", "tag": "...", "elementId": "..." },
      "expectedFile": "where wrap should land (relative to fixture root)",
      "expectsError": "optional error code, e.g. element_not_in_source"
    }
  ]
}
```

## Current fixtures

| Fixture | Shape |
|---|---|
| `vite-react/` | Tracked `index.html` shell + `src/App.jsx`. Inject into the shell. |
| `nextjs-app/` | `app/layout.tsx` as JSX inject target (commentSyntax `jsx`). |
| `astro/` | `src/layouts/Layout.astro` as inject target. HTML comments. |
| `sveltekit/` | `src/app.html` shell + `src/routes/+page.svelte`. |
| `multipage-with-generator/` | `src/` tracked, `dist/` gitignored. Exercises the is-generated guard and `element_not_in_source` fallback. |

Add new fixtures by cloning a directory, swapping files, and updating `fixture.json`.
