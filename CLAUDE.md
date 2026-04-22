# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEI Pro is a browser extension (Chrome, Firefox, Edge) that adds advanced features to Brazil's "Sistema Eletrônico de Informações" (SEI) — a government electronic information system. Compatible with SEI 4.0+ and SEI 5.x. Licensed under AGPL-3.0.

## Development

There is no build system, package manager, or test framework. All source code lives directly in `dist/` and is loaded by the browser as-is. To develop:

1. Load `dist/` as an unpacked extension in Chrome (`chrome://extensions`) or Firefox (`about:debugging`)
2. Edit files in `dist/` directly
3. Reload the extension and refresh the SEI page to test changes

## Architecture

### Manifest V3 Extension (`dist/manifest.json`)

The manifest defines **9 content script entries**, each targeting specific SEI page URLs via `matches` patterns. Different pages get different script/CSS bundles:

- **All SEI pages** (`init_all.js`): Loads `sei-functions-pro.js` and core CSS for features available everywhere (advanced styling, dark mode, font icons)
- **Main process lists** (`init.js`): Process grouping, favorites, projects, deadlines, Kanban boards, Google Sheets integration
- **Document editor** (`init.js` on `editor_montar`): CKEditor enhancements — table styles, legislation links, footnotes, QR codes, AI tools, auto-save
- **Document tree** (`init_arvore.js`): Quick menus, drag-and-drop upload, document info, annotations
- **Document viewer** (`init_visualizacao.js`, `init_visualizacao_html.js`): Paragraph numbers, watermarks, confidentiality marks
- **Login pages** (`init_pwd.js`): Password auto-fill fix for SEI 4.0+
- **Database/host config** (`init_db.js`): Host-specific configuration loading

### Key Source Files (`dist/js/`)

- `sei-functions-pro.js` — Core shared module. Contains all utility functions, configuration management (`checkConfigValue`, `getConfigValue`, `getOptionsPro`), localStorage wrappers, SEI version detection (`isNewSEI`, `isSEI_5`), and DOM selectors that adapt to SEI version differences
- `sei-pro.js` — Main page features: process list grouping, Kanban view, Google Sheets integration, batch actions
- `sei-pro-editor.js` — CKEditor plugin layer: table styling, copy formatting, image editing, auto-save, keyboard shortcuts
- `sei-pro-arvore.js` — Document tree enhancements: quick action menus, file upload via dropzone, annotations
- `sei-pro-ai.js` — AI integration supporting OpenAI and Google Gemini APIs for document review, interactive writing, and dictation
- `sei-pro-favoritos.js` — Favorite processes management
- `sei-pro-projetos.js` / `sei-pro-atividades.js` — Project management with Gantt charts (frappe-gantt) and Kanban (jKanban)
- `sei-legis.js` — Legislation enumeration (Legística) for legal documents
- `sei-pro-icons.js` — Icon definitions for quick action menus
- `sei-pro-docs-lote.js` — Batch document operations
- `sei-pro-visualizacao.js` — Document visualization enhancements

### Browser Compatibility Pattern

The extension supports both Chrome and Firefox using a compatibility shim:
```js
const isChrome = (typeof browser === "undefined");
if (isChrome) { var browser = chrome; }
```
All browser API calls (`storage`, `runtime`, `tabs`) use the `browser.*` namespace with this pattern. The `getUrlExtension()` helper wraps `runtime.getURL()` for cross-browser use.

### SEI Version Handling

Code adapts to multiple SEI versions using global flags:
- `isNewSEI` — Detects SEI 4.x+ (new sidebar menu layout)
- `isSEI_5` — Detects SEI 5.x (new editor component)
- `compareVersionNumbers()` — Used for fine-grained version checks (e.g., SEI 4.1.0+)

Many DOM selectors and variable assignments branch on these flags to handle UI differences between SEI versions.

### Configuration System

User settings are stored via `chrome.storage.sync` and cached in `localStorage` as `configBasePro` (JSON array). Configuration is queried using jmespath expressions. Key functions:
- `checkConfigValue(name)` — Boolean check if a feature is enabled
- `getConfigValue(name)` — Get a feature's configured value
- `getOptionsPro(name)` — Get extension option value
- `localStorageRestorePro(key)` — Restore parsed JSON from localStorage

### Third-Party Libraries (`dist/js/lib/`)

jQuery 3.4.1 + jQuery UI, jmespath (config queries), DOMPurify (HTML sanitization), moment.js (dates), CKEditor, frappe-gantt, jKanban, Chart.js, Leaflet (maps), Dropzone, PDF.js, Tesseract.js (OCR), html2canvas, PapaParse (CSV), diff2html, and others.

## Other Directories

- `pages/` — Feature documentation in Markdown, served via GitHub Pages (Jekyll)
- `img/` — Screenshots and GIFs used in documentation
- `_config.yml` — Jekyll theme config for GitHub Pages site
