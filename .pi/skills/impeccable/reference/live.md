Launch interactive live variant mode: select elements in the browser, pick a design action, and get AI-generated HTML+CSS variants hot-swapped via the dev server's HMR.

## Prerequisites

- A running development server with hot module replacement (Vite, Next.js, Bun, etc.), OR a static HTML file open in the browser
- The impeccable CLI installed (`npm i -g impeccable`)

## Start the Server

1. Read `.impeccable.md` if it exists. Keep the design context in mind for variant generation.
2. Start the live variant server:
   ```bash
   npx impeccable live &
   ```
3. Note the **port** and **token** printed to stdout.

## Inject the Browser Script

Find the project's main HTML entry point. This varies by framework:

| Framework | Typical file |
|-----------|-------------|
| Plain HTML | `index.html` |
| Vite / React | `index.html` (project root) |
| Next.js (App Router) | `app/layout.tsx` (add a `<Script>` component) |
| Next.js (Pages) | `pages/_document.tsx` |
| Nuxt | `app.vue` or `nuxt.config.ts` |
| Svelte / SvelteKit | `src/app.html` |

Add the script tag between comment markers (replace PORT with the actual port):

**HTML / Vue / Svelte:**
```html
<!-- impeccable-live-start -->
<script src="http://localhost:PORT/live.js"></script>
<!-- impeccable-live-end -->
```

**JSX / TSX (React, Next.js):**
```jsx
{/* impeccable-live-start */}
<script src="http://localhost:PORT/live.js"></script>
{/* impeccable-live-end */}
```

Place it before the closing `</body>` or at the end of the layout component. Save the file. The dev server will reload and the element picker will activate.

If browser automation tools are available, also navigate to the page so the user can see it.

## Enter the Poll Loop

Run a blocking poll loop. On each iteration, wait for a browser event and respond:

```
LOOP:
  Run: npx impeccable poll
  Read the JSON output. Dispatch based on the "type" field:

  TYPE "generate":
    → See "Handle Generate" below

  TYPE "accept":
    → See "Handle Accept" below

  TYPE "discard":
    → See "Handle Discard" below

  TYPE "exit":
    → Break the loop

  TYPE "timeout":
    → Continue (re-poll)

END LOOP
```

## Handle Generate

The event contains: `{id, action, freeformPrompt, count, element}`.

### Step 1: Find the source file

Use `element.tagName`, `element.id`, `element.classes`, `element.textContent`, and `element.outerHTML` to locate the element in the project source. Search for matching markup across the codebase.

### Step 2: Create the variant wrapper

Wrap the original element in a variant container. Use the comment syntax appropriate for the framework:

**HTML / Vue / Svelte:**
```html
<!-- impeccable-variants-start SESSION_ID -->
<div data-impeccable-variants="SESSION_ID" data-impeccable-variant-count="COUNT" style="display: contents">
  <div data-impeccable-variant="original" style="display: none">
    <!-- move the original element here -->
  </div>
</div>
<!-- impeccable-variants-end SESSION_ID -->
```

**JSX / TSX:**
```jsx
{/* impeccable-variants-start SESSION_ID */}
<div data-impeccable-variants="SESSION_ID" data-impeccable-variant-count={COUNT} style={{display: 'contents'}}>
  <div data-impeccable-variant="original" style={{display: 'none'}}>
    {/* move the original element here */}
  </div>
</div>
{/* impeccable-variants-end SESSION_ID */}
```

Replace SESSION_ID with `event.id` and COUNT with `event.count`.

`display: contents` makes the wrapper layout-transparent, preserving the original element's relationship with its parent (flex/grid child, etc.).

### Step 3: Generate variants one by one

For each variant (1 through COUNT):

1. **Load the design command's reference file.** If `event.action` is "bolder", load `reference/bolder.md`. If "impeccable" (the default), use the main design principles from this skill without loading a sub-command reference.

2. **Generate a complete replacement** for the original element. Each variant is a full HTML+CSS rewrite, not a patch. Consider the element's context (computed styles, parent structure, CSS custom properties from `event.element`).

3. **Diversify across variants.** Each variant should take a distinctly different approach. For "bolder", one might focus on type weight, another on color saturation, another on spatial scale, another on structural change. Do NOT generate 4 variations on the same idea.

4. **If a freeform prompt was provided** (`event.freeformPrompt`), use it as additional guidance for all variants.

5. **Write the variant** into the wrapper in the source file:
   ```html
   <div data-impeccable-variant="N" style="display: none">
     <!-- variant N content -->
   </div>
   ```
   The first variant should NOT have `style="display: none"` (it should be visible by default).

6. **Write scoped CSS** if the variant needs styles beyond inline:
   ```css
   /* impeccable-variants-css-start SESSION_ID */
   @scope ([data-impeccable-variant="N"]) {
     :scope { /* styles for the variant root */ }
     .child-class { /* styles for children */ }
   }
   /* impeccable-variants-css-end SESSION_ID */
   ```
   Place the CSS in a `<style>` block in the same file, or in the component's CSS file.

7. **Save the file** after each variant. The dev server's HMR will update the browser, and the live script's MutationObserver will detect the new variant and activate it in the cycler UI.

### Step 4: Signal completion

After all variants are written:
```bash
npx impeccable poll --reply SESSION_ID done
```

## Handle Accept

The event contains: `{id, variantId}`.

The user accepted a specific variant. For v1 (inspection mode):
1. Read the accepted variant's HTML from the source (the content inside `[data-impeccable-variant="VARIANT_ID"]`).
2. Present the variant code to the user in the conversation.
3. Clean up the source: remove the entire variant wrapper (everything between `impeccable-variants-start` and `impeccable-variants-end` markers), and restore the original element.
4. Remove any scoped CSS blocks (between `impeccable-variants-css-start` and `impeccable-variants-css-end` markers).
5. Reply:
   ```bash
   npx impeccable poll --reply SESSION_ID done
   ```

## Handle Discard

The event contains: `{id}`.

1. Remove the variant wrapper from the source file.
2. Restore the original element (the content inside `[data-impeccable-variant="original"]`).
3. Remove any scoped CSS blocks for this session.
4. Reply:
   ```bash
   npx impeccable poll --reply SESSION_ID done
   ```

## Cleanup (on exit)

When the loop ends:

1. **Remove the injected script tag** from the source file. Delete everything between `<!-- impeccable-live-start -->` and `<!-- impeccable-live-end -->` (inclusive). Use the appropriate comment syntax for the framework.
2. **Remove any leftover variant wrappers** (search for `impeccable-variants-start` markers and clean up).
3. **Stop the server**:
   ```bash
   npx impeccable live stop
   ```

## Variant Generation Guidelines

- Each variant must be a **complete element replacement**, not a CSS-only patch. Rewrite the entire element with the design transformation applied.
- Use **`@scope`** for CSS isolation. This is supported in Chrome 118+, Firefox 128+, Safari 17.4+, which covers all modern dev browsers.
- Follow the design principles from this skill (typography, color, spatial design, etc.) and the `.impeccable.md` project context if available.
- If no `.impeccable.md` exists, generate brand-agnostic variants. The live UI will show a warning to the user.
- **Non-interactive mode**: do NOT ask the user for clarification during generation. If context is missing, proceed with reasonable defaults.
