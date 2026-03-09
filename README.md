# Format Foundry

Format Foundry is a privacy-first JSON and XML formatter built for fast browser-based cleanup. It formats, minifies, validates, imports, copies, and exports structured text without sending data to a backend.

![Format Foundry preview](./public/social-card.svg)

## Why this version is launch-ready

- Professional single-page UI with distinct product branding
- JSON and XML formatting plus minify, import, export, copy, and sample loading
- Keyboard shortcuts and drag-and-drop file support
- Accessibility-focused status messaging and tab behavior
- Vite-based production build with relative asset paths for GitHub Pages
- CI and Pages workflow files ready for a standalone repository

## Local development

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

Quality checks:

```bash
npm run lint
npm run test
```

## Keyboard shortcuts

- `Ctrl/Cmd + Enter`: format active input
- `Ctrl/Cmd + Shift + M`: minify active input
- `Ctrl/Cmd + Shift + C`: copy output
- `Ctrl/Cmd + O`: import file

## GitHub Pages deployment

This app uses `base: './'`, so it can be hosted safely under a GitHub Pages project subpath.

1. Push this folder as its own GitHub repository.
2. Keep the workflow files under `.github/workflows/`.
3. In GitHub, enable Pages with GitHub Actions as the source.
4. Push to `main` to trigger the deploy workflow.

## Repo setup checklist

- Update the issue template discussion URL in `.github/ISSUE_TEMPLATE/config.yml`
- Replace `private: true` in `package.json` if you want to publish the package metadata later
- Add your final repository URL if you want an absolute canonical link in `index.html`

## FAQ

### Does this upload my data?

No. Parsing and formatting happen entirely in your browser.

### What file types can I import?

`.json` and `.xml` files are supported in v1.

### Can I deploy it without a server?

Yes. The build output is static and intended for GitHub Pages.
