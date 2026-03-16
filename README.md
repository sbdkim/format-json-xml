# Format JSON & XML

A local-first JSON and XML formatter for cleaning up structured data entirely in the browser.

## Live Demo
Static GitHub Pages deployment is supported, but no published URL is documented in the repo yet.

## Key Features
- Format, minify, and validate JSON and XML
- Import, export, copy, and sample-loading workflows
- Keyboard shortcuts for common formatting actions
- Drag-and-drop file support
- Accessibility-focused status messaging and tab behavior

## Tech Stack
- Vite
- Vanilla JavaScript
- Static GitHub Pages-friendly build output

## Setup / Run Locally
```bash
npm install
npm run dev
```

## Tests
```bash
npm run lint
npm run test
```

## Deployment Notes
- The app uses `base: './'`, so it can be hosted safely under a GitHub Pages project subpath.
- Keep shared assets relative so the same build works locally and when deployed.
- Use `npm run build` to generate the static output.

## Project Layout
- `src/` formatter logic and browser UI code
- `public/` static assets and manifest
- `.github/workflows/` CI and Pages deployment workflows
- `vite.config.js` static-hosting configuration

## Notes
- All parsing and formatting happen in the browser.
- The public product name is `Format JSON & XML`, and the repo slug target is `format-json-xml`.
