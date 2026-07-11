# Solar Static Repo Ground Rules

These rules are authoritative for all future work in this repository.

1. Centralize design tokens.
   - Color palette, font stacks, layout constants, animation timing, shadows, and renderer-safe raw values live in `shared/design/tokens.mjs`.
   - CSS files and renderer modules should consume generated variables or exported token values instead of introducing new literals.
2. Centralize display strings.
   - User-facing copy, labels, document titles, validation text, static page content, and accessibility strings live in `shared/copy/site-copy.mjs` or approved content data modules.
3. Centralize UI components.
   - Reuse shared components from `components/ui/` before adding new one-off controls or layout chrome.
4. Centralize functions and classes.
   - Reuse existing helpers first.
   - If reuse is not enough, extend or wrap existing helpers.
   - If extension is not appropriate, create a named alternative version.
   - Add new functions/classes only when none of the above fits.
5. Optimize authored file size.
   - Keep files small enough for human review and AI context.
   - Prefer focused modules over large catch-all files.
   - Generated files and binary/content assets are allowed to be large, but must be clearly marked or treated as source assets.

Run `npm run verify` before handing off repo-wide changes.
