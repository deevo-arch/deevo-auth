const fs = require('fs');
const path = require('path');

// Simple build: copy src to dist with CJS and ESM variants
const src = fs.readFileSync(path.join(__dirname, 'src', 'index.js'), 'utf8');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// CJS version (remove ESM export lines)
const cjs = src
  .replace(/^export \{.*\};?$/gm, '')
  .replace(/^export default.*$/gm, '');

fs.writeFileSync(path.join(distDir, 'index.js'), cjs);

// ESM version (remove CJS export lines)
const esm = src
  .replace(/if \(typeof module.*\n(.*\n)*?.*module\.exports\.default.*\n\}/m, '');

fs.writeFileSync(path.join(distDir, 'index.mjs'), esm);

// Copy type definitions
const types = fs.readFileSync(path.join(__dirname, 'src', 'index.d.ts'), 'utf8');
fs.writeFileSync(path.join(distDir, 'index.d.ts'), types);

console.log('✓ Built deevo-auth SDK to dist/');
