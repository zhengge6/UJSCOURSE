/**
 * Optional private build: auto.src.js → auto.obf.user.js
 * ScriptCat / Greasy Fork must use the readable auto.user.js (sync from auto.src.js).
 * Preserves the ==UserScript== header block.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'auto.src.js');
const outPath = path.join(root, 'auto.obf.user.js');

const raw = fs.readFileSync(srcPath, 'utf8');
const headerMatch = raw.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
if (!headerMatch) {
  console.error('Missing UserScript header in auto.src.js');
  process.exit(1);
}
const header = headerMatch[0];
const body = raw.slice(headerMatch.index + header.length).replace(/^\uFEFF?\r?\n*/, '');

const result = JavaScriptObfuscator.obfuscate(body, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.65,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 0.85,
  splitStrings: true,
  splitStringsChunkLength: 6,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  reservedNames: [
    '^\\$',
    '^jQuery$',
    '^GM_',
    '^unsafeWindow$',
    '^GM_openInTab$',
    '^GM_xmlhttpRequest$'
  ],
  reservedStrings: []
});

const out = `${header}\n\n${result.getObfuscatedCode()}\n`;
fs.writeFileSync(outPath, out, 'utf8');
console.log(
  `ok: ${path.basename(srcPath)} (${raw.length} B) → ${path.basename(outPath)} (${out.length} B)`
);
