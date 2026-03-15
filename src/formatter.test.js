import { describe, expect, test } from 'vitest';
import {
  formatInput,
  formatJson,
  formatXml,
  getDownloadName,
  inferModeFromFile,
  minifyJson,
  minifyXml,
} from './formatter.js';

describe('JSON formatting', () => {
  test('formats nested JSON with two spaces', () => {
    expect(formatJson('{"project":"foundry","ready":true}')).toBe(`{
  "project": "foundry",
  "ready": true
}`);
  });

  test('minifies formatted JSON', () => {
    expect(minifyJson(`{
  "project": "foundry",
  "ready": true
}`)).toBe('{"project":"foundry","ready":true}');
  });

  test('keeps readable parse errors', () => {
    expect(() => formatInput('json', '{"bad":}', 'formatted')).toThrow(/JSON parse error:/);
  });
});

describe('XML formatting', () => {
  test('formats nested XML with attributes', () => {
    expect(formatXml('<root><item id="1">Hello</item><meta ready="true" /></root>')).toBe(`<root>
  <item id="1">Hello</item>
  <meta ready="true" />
</root>`);
  });

  test('minifies XML by removing whitespace-only nodes', () => {
    expect(minifyXml(`<root>
  <item>Hello</item>
</root>`)).toBe('<root><item>Hello</item></root>');
  });

  test('surfaces malformed XML errors', () => {
    expect(() => formatInput('xml', '<root><item></root>', 'formatted')).toThrow(/XML parse error:/);
  });
});

describe('helpers', () => {
  test('infers mode from file extension', () => {
    expect(inferModeFromFile('sample.xml', '')).toBe('xml');
    expect(inferModeFromFile('sample.json', '')).toBe('json');
  });

  test('falls back to content detection', () => {
    expect(inferModeFromFile('sample.txt', '{"a":1}')).toBe('json');
    expect(inferModeFromFile('sample.txt', '<root />')).toBe('xml');
  });

  test('creates download names', () => {
    expect(getDownloadName('json', 'formatted')).toBe('format-json-xml-formatted.json');
  });
});
