export const samples = {
  json: `{
  "product": "Northline",
  "workflow": "format-json-xml",
  "privacy": "local-first",
  "features": ["format", "minify", "copy", "download", "import"],
  "release": {
    "version": "1.0.0",
    "ready": true
  }
}`,
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<product name="Northline" workflow="format-json-xml" privacy="local-first">
  <features>
    <feature>format</feature>
    <feature>minify</feature>
    <feature>copy</feature>
    <feature>download</feature>
    <feature>import</feature>
  </features>
  <release version="1.0.0" ready="true" />
</product>`,
};

export function formatInput(mode, input, transform) {
  const value = input.trim();
  if (!value) {
    throw new Error(`Add some ${mode.toUpperCase()} first.`);
  }

  if (mode === 'json') {
    return transform === 'formatted' ? formatJson(value) : minifyJson(value);
  }

  return transform === 'formatted' ? formatXml(value) : minifyXml(value);
}

export function formatJson(input) {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch (error) {
    throw new Error(normalizeJsonError(error), { cause: error });
  }
}

export function minifyJson(input) {
  try {
    return JSON.stringify(JSON.parse(input));
  } catch (error) {
    throw new Error(normalizeJsonError(error), { cause: error });
  }
}

export function formatXml(input) {
  const documentNode = parseXml(input);
  return Array.from(documentNode.childNodes)
    .map((node) => serializeNode(node, 0))
    .filter(Boolean)
    .join('\n');
}

export function minifyXml(input) {
  const documentNode = parseXml(input);
  const cleaned = documentNode.cloneNode(true);
  stripWhitespaceNodes(cleaned);
  return new XMLSerializer().serializeToString(cleaned);
}

export function inferModeFromFile(name, content) {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.json')) {
    return 'json';
  }
  if (lowerName.endsWith('.xml')) {
    return 'xml';
  }

  const value = content.trim();
  if (value.startsWith('{') || value.startsWith('[')) {
    return 'json';
  }
  if (value.startsWith('<')) {
    return 'xml';
  }

  return null;
}

export function getDownloadName(mode, transform) {
  return `format-json-xml-${transform}.${mode}`;
}

function normalizeJsonError(error) {
  const message = error instanceof Error ? error.message : 'Invalid JSON input.';
  return `JSON parse error: ${message}`;
}

function parseXml(input) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('XML parsing requires a browser-like environment.');
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(input, 'application/xml');
  const parserError = documentNode.querySelector('parsererror');
  if (parserError) {
    throw new Error(normalizeXmlError(parserError.textContent || 'Invalid XML input.'));
  }
  return documentNode;
}

function normalizeXmlError(raw) {
  return `XML parse error: ${String(raw)
    .replace(/\s+/g, ' ')
    .replace(/^This page contains the following errors:\s*/i, '')
    .replace(/Below is a rendering of the page up to the first error\.\s*/i, '')
    .trim()}`;
}

function stripWhitespaceNodes(node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() === '') {
      node.removeChild(child);
      return;
    }
    stripWhitespaceNodes(child);
  });
}

function serializeNode(node, level) {
  const indent = '  '.repeat(level);
  const nextIndent = '  '.repeat(level + 1);

  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    return `${indent}<?${node.target} ${node.data}?>`;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.nodeName;
    const attributes = Array.from(node.attributes)
      .map((attribute) => ` ${attribute.name}="${escapeXml(attribute.value)}"`)
      .join('');
    const children = Array.from(node.childNodes).filter((child) => {
      return child.nodeType !== Node.TEXT_NODE || child.textContent.trim() !== '';
    });

    if (!children.length) {
      return `${indent}<${tagName}${attributes} />`;
    }

    if (children.length === 1 && isInlineTextNode(children[0])) {
      return `${indent}<${tagName}${attributes}>${serializeInlineNode(children[0])}</${tagName}>`;
    }

    const content = children
      .map((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          return `${nextIndent}${escapeXml(child.textContent.trim())}`;
        }
        return serializeNode(child, level + 1);
      })
      .join('\n');

    return `${indent}<${tagName}${attributes}>\n${content}\n${indent}</${tagName}>`;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return `${indent}${escapeXml(node.textContent.trim())}`;
  }

  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${indent}<![CDATA[${node.textContent}]]>`;
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return `${indent}<!--${node.textContent}-->`;
  }

  return '';
}

function isInlineTextNode(node) {
  return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE;
}

function serializeInlineNode(node) {
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.textContent}]]>`;
  }
  return escapeXml(node.textContent);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
