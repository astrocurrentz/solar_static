# Solar Static Studio Repo Ground Rules

These rules are authoritative for all future work in this repository.

1. Preserve the studio structure.
   - Active website work belongs in `website/`.
   - Company materials belong in `company/`.
   - Internal operating materials belong in `operating-system/`.
   - Product work belongs in `products/`.
   - Client work belongs in `clients/`.
   - Shared source assets belong in `assets/`.
   - Historical material belongs in `archive/`; the previous root website snapshot lives in `archive/old-website/`.
2. Centralize design tokens.
   - Color palette, font stacks, layout constants, animation timing, shadows, and renderer-safe raw values live in the active website's shared design token module.
   - CSS files and renderer modules should consume generated variables or exported token values instead of introducing new literals.
3. Centralize display strings.
   - User-facing copy, labels, document titles, validation text, static page content, and accessibility strings live in the active website's shared copy module or approved content data modules.
4. Centralize UI components.
   - Reuse shared UI components before adding new one-off controls or layout chrome.
5. Centralize functions and classes.
   - Reuse existing helpers first.
   - If reuse is not enough, extend or wrap existing helpers.
   - If extension is not appropriate, create a named alternative version.
   - Add new functions/classes only when none of the above fits.
6. Optimize authored file size.
   - Keep files small enough for human review and AI context.
   - Prefer focused modules over large catch-all files.
   - Generated files and binary/content assets are allowed to be large, but must be clearly marked or treated as source assets.

Run the relevant verification command before handing off repo-wide changes. For the archived Vite website, run `npm run verify` from `archive/old-website/`.
