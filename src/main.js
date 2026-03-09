import './style.css';
import { formatInput, getDownloadName, inferModeFromFile, samples } from './formatter.js';

const STORAGE_KEY = 'format-foundry:last-mode';

const state = {
  mode: localStorage.getItem(STORAGE_KEY) || 'json',
  output: '',
  lastTransform: 'formatted',
};

document.querySelector('#app').innerHTML = `
  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Format Foundry</p>
        <h1>JSON and XML cleanup without sending your data anywhere.</h1>
        <p class="lede">
          Format, minify, validate, import, and export structured text in a focused workspace
          built for fast browser-based use. Everything runs locally in your browser.
        </p>
        <div class="hero-notes" aria-label="Trust highlights">
          <span>No backend</span>
          <span>No tracking</span>
          <span>GitHub Pages ready</span>
        </div>
      </div>
      <aside class="hero-card" aria-label="Quick guide">
        <p class="hero-card-label">Keyboard shortcuts</p>
        <ul class="shortcut-list">
          <li><kbd>Ctrl</kbd><span>+</span><kbd>Enter</kbd><span>Format active input</span></li>
          <li><kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>M</kbd><span>Minify active input</span></li>
          <li><kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>C</kbd><span>Copy output</span></li>
          <li><kbd>Ctrl</kbd><span>+</span><kbd>O</kbd><span>Import file</span></li>
        </ul>
      </aside>
    </header>

    <main class="workspace" aria-label="Formatter application">
      <section class="control-panel">
        <div class="tabs" role="tablist" aria-label="Formatter mode">
          <button class="tab-button" type="button" role="tab" data-mode="json" id="tab-json">JSON</button>
          <button class="tab-button" type="button" role="tab" data-mode="xml" id="tab-xml">XML</button>
        </div>

        <div class="action-row" aria-label="Formatter actions">
          <button class="action-button action-button-strong" type="button" data-action="format">Format</button>
          <button class="action-button action-button-strong" type="button" data-action="minify">Minify</button>
          <button class="action-button" type="button" data-action="sample">Load sample</button>
          <button class="action-button" type="button" data-action="import">Import file</button>
          <button class="action-button" type="button" data-action="copy">Copy output</button>
          <button class="action-button" type="button" data-action="download">Download</button>
          <button class="action-button action-button-muted" type="button" data-action="clear">Clear</button>
        </div>
      </section>

      <section class="message-strip" aria-label="Application status">
        <p class="status-message" id="statusMessage" aria-live="polite"></p>
        <p class="error-message" id="errorMessage" aria-live="assertive"></p>
      </section>

      <section class="editor-grid">
        <div class="editor-card editor-card-drop" id="dropZone">
          <div class="editor-card-head">
            <div>
              <p class="card-kicker">Input</p>
              <h2>Paste or drop structured data</h2>
            </div>
            <p class="card-note">Supports .json and .xml import. Drag a file anywhere onto this panel.</p>
          </div>
          <label class="sr-only" for="inputEditor">Input editor</label>
          <textarea
            id="inputEditor"
            class="editor"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
          ></textarea>
          <div class="drop-hint" id="dropHint" aria-hidden="true">Drop your file to import it into the active workspace.</div>
        </div>

        <div class="editor-card">
          <div class="editor-card-head">
            <div>
              <p class="card-kicker">Output</p>
              <h2>Validated result</h2>
            </div>
            <p class="card-note">Copy or download the result after formatting or minifying.</p>
          </div>
          <label class="sr-only" for="outputEditor">Output editor</label>
          <textarea id="outputEditor" class="editor editor-output" spellcheck="false" readonly></textarea>
        </div>
      </section>

      <section class="support-grid" aria-label="Product details">
        <article class="info-card">
          <p class="card-kicker">Privacy</p>
          <h3>All processing stays local.</h3>
          <p>
            Format Foundry never sends your data to a server. JSON and XML parsing happens entirely in
            your browser session.
          </p>
        </article>
        <article class="info-card">
          <p class="card-kicker">Workflow</p>
          <h3>Built for paste-heavy tasks.</h3>
          <p>
            Keep moving with keyboard shortcuts, drag-and-drop import, downloadable output, and crisp
            error feedback when data is malformed.
          </p>
        </article>
        <article class="info-card">
          <p class="card-kicker">FAQ</p>
          <h3>What does this support?</h3>
          <p>
            v1 supports JSON and XML formatting, minifying, sample loading, import/export, and GitHub
            Pages-friendly static deployment.
          </p>
        </article>
      </section>
    </main>

    <footer class="site-footer">
      <p>Format Foundry is a free static tool for personal and public use.</p>
      <p>Deployable on GitHub Pages with no server required.</p>
    </footer>

    <input class="sr-only" id="fileInput" type="file" accept=".json,.xml,text/json,text/xml,application/json,application/xml" />
  </div>
`;

const inputEditor = document.querySelector('#inputEditor');
const outputEditor = document.querySelector('#outputEditor');
const errorMessage = document.querySelector('#errorMessage');
const statusMessage = document.querySelector('#statusMessage');
const fileInput = document.querySelector('#fileInput');
const dropZone = document.querySelector('#dropZone');
const dropHint = document.querySelector('#dropHint');
const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
const actionButtons = Array.from(document.querySelectorAll('.action-button'));

function setMode(mode, announce = true) {
  state.mode = mode;
  localStorage.setItem(STORAGE_KEY, mode);

  for (const button of tabButtons) {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  }

  inputEditor.placeholder = mode === 'json'
    ? 'Paste JSON like {"team":"foundry","ready":true}'
    : 'Paste XML like <project><name>foundry</name></project>';
  clearMessages();
  if (announce) {
    setStatus(`Ready for ${mode.toUpperCase()} input.`, false);
  }
}

function clearMessages() {
  errorMessage.textContent = '';
  statusMessage.classList.remove('is-success');
}

function setStatus(message, success) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-success', Boolean(success));
}

function setError(message) {
  errorMessage.textContent = message;
  statusMessage.classList.remove('is-success');
}

function setOutput(value, transformLabel) {
  state.output = value;
  state.lastTransform = transformLabel;
  outputEditor.value = value;
  syncActionAvailability();
}

function syncActionAvailability() {
  const hasOutput = state.output.trim().length > 0;
  for (const button of actionButtons) {
    if (button.dataset.action === 'copy' || button.dataset.action === 'download') {
      button.disabled = !hasOutput;
    }
  }
}

function requireInput() {
  if (inputEditor.value.trim()) {
    return true;
  }
  setOutput('', state.lastTransform);
  setError(`Add some ${state.mode.toUpperCase()} first.`);
  setStatus('Waiting for input.', false);
  return false;
}

function runTransform(action) {
  if (!requireInput()) {
    return;
  }

  try {
    clearMessages();
    const transform = action === 'format' ? 'formatted' : 'minified';
    const result = formatInput(state.mode, inputEditor.value, transform);
    setOutput(result, transform);
    setStatus(`${capitalize(transform)} ${state.mode.toUpperCase()} successfully.`, true);
  } catch (error) {
    setOutput('', state.lastTransform);
    setError(error instanceof Error ? error.message : `Unable to ${action} ${state.mode.toUpperCase()}.`);
    setStatus('Fix the input and try again.', false);
  }
}

function loadSample() {
  inputEditor.value = samples[state.mode];
  setOutput('', state.lastTransform);
  clearMessages();
  setStatus(`Loaded ${state.mode.toUpperCase()} sample data.`, true);
}

function clearWorkspace() {
  inputEditor.value = '';
  setOutput('', state.lastTransform);
  clearMessages();
  setStatus('Workspace cleared.', false);
}

async function copyOutput() {
  if (!state.output.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(state.output);
  } catch {
    outputEditor.focus();
    outputEditor.select();
    document.execCommand('copy');
  }

  setStatus('Output copied to the clipboard.', true);
}

function downloadOutput() {
  if (!state.output.trim()) {
    return;
  }

  const blob = new Blob([state.output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getDownloadName(state.mode, state.lastTransform);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus('Download started.', true);
}

function openFilePicker() {
  fileInput.click();
}

async function importFile(file) {
  if (!file) {
    return;
  }

  const text = await file.text();
  const inferredMode = inferModeFromFile(file.name, text) || state.mode;
  if (inferredMode !== state.mode) {
    setMode(inferredMode, false);
  }
  inputEditor.value = text;
  setOutput('', state.lastTransform);
  clearMessages();
  setStatus(`Imported ${file.name}.`, true);
}

function handleAction(action) {
  if (action === 'format' || action === 'minify') {
    runTransform(action);
    return;
  }

  if (action === 'sample') {
    loadSample();
    return;
  }

  if (action === 'clear') {
    clearWorkspace();
    return;
  }

  if (action === 'copy') {
    void copyOutput();
    return;
  }

  if (action === 'download') {
    downloadOutput();
    return;
  }

  openFilePicker();
}

function handleDropState(active) {
  dropZone.classList.toggle('is-dropping', active);
  dropHint.classList.toggle('is-visible', active);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => handleAction(button.dataset.action));
});

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  await importFile(file);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    handleDropState(true);
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => handleDropState(false));
});

dropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  handleDropState(false);
  const [file] = Array.from(event.dataTransfer?.files || []);
  await importFile(file);
});

window.addEventListener('keydown', (event) => {
  const modifier = event.ctrlKey || event.metaKey;

  if (modifier && event.key === 'Enter') {
    event.preventDefault();
    runTransform('format');
  }

  if (modifier && event.shiftKey && event.key.toLowerCase() === 'm') {
    event.preventDefault();
    runTransform('minify');
  }

  if (modifier && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    void copyOutput();
  }

  if (modifier && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    openFilePicker();
  }
});

setMode(state.mode);
syncActionAvailability();
