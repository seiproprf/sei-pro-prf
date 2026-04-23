# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + `Do instead`.

## Execution & Validation
1. **[2026-04-23] Extension code lives in `dist/`**
   Do instead: edit `dist/` directly and validate by reloading the unpacked extension in the browser.
2. **[2026-04-23] Browser automation should prefer the repo's Playwright CLI wrapper**
   Do instead: use `scripts/playwright-open-extension.sh` for local extension sessions and keep artifacts out of the repo.
3. **[2026-04-23] Capture the live DOM before guessing about SEI page bugs**
   Do instead: inspect the rendered HTML and console logs together, then trace the relevant `init_*.js` entry point.

## Repo Constraints
1. **[2026-04-23] There is no build pipeline here**
   Do instead: avoid inventing package or bundling steps; validate by loading `dist/` as-is.
2. **[2026-04-23] Browser compatibility is via `browser.*` with a Chrome shim**
   Do instead: preserve the `isChrome` shim pattern and avoid direct `chrome.*` usage outside the compatibility bridge.
3. **[2026-04-23] SEI version differences are handled by global flags**
   Do instead: branch selectors and DOM logic on `isNewSEI`, `isSEI_5`, and version helpers instead of hard-coding one layout.

## Domain Behavior Guardrails
1. **[2026-04-23] Sensitive SEI flows can change the page structure**
   Do instead: verify password-gated or sigiloso cases separately before assuming a generic tree-layout bug.
2. **[2026-04-23] Content scripts are page-specific**
   Do instead: confirm the exact `manifest.json` match pattern and injected entry point for the page under investigation.
3. **[2026-04-23] Visual overlap usually points to CSS/load-order failures**
   Do instead: inspect injected stylesheets, duplicated initializers, and DOM classes around the affected container before changing behavior code.
4. **[2026-04-23] Sigiloso flows need per-frame dependencies**
   Do instead: load `modalLink.js` and `jquery-ui` inside each frame that calls `initModalNewSEISigiloso`, because the parent page does not share those globals with iframes.
5. **[2026-04-23] `modalLink.js` needs a fallback URL when the page has no script tag**
   Do instead: resolve `js/lib/modalLink.js` with `getUrlExtension()` when `reloadModalLink()` cannot find an existing `<script src*="modalLink">`.
