/**
 * Sync readable release script: auto.src.js → auto.user.js
 * Use this for ScriptCat / Greasy Fork / GitHub main install URL.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'auto.src.js');
const dest = path.join(root, 'auto.user.js');
fs.copyFileSync(src, dest);
console.log(`ok: auto.src.js → auto.user.js (${fs.statSync(dest).size} B)`);
