/**
 * Removes @font-face declarations from PrimeNG theme CSS.
 *
 * The Angular application builder corrupts .woff/.woff2 binary files when it processes
 * them as CSS url() references, causing OTS parsing errors in the browser console.
 * Roboto is already loaded from Google Fonts CDN via index.html, so these bundled
 * font declarations are unnecessary.
 *
 * Run automatically via postinstall hook.
 */
const fs = require('fs');
const path = require('path');

const themePath = path.join(__dirname, '..', 'node_modules', 'primeng', 'resources', 'themes', 'md-dark-indigo', 'theme.css');

if (!fs.existsSync(themePath)) {
    process.exit(0);
}

let css = fs.readFileSync(themePath, 'utf8');
const original = css;

// Remove @font-face blocks and their preceding comments
css = css.replace(/\/\*\s*roboto-[\s\S]*?\*\/\s*@font-face\s*\{[^}]*\}/g, '');

if (css !== original) {
    fs.writeFileSync(themePath, css, 'utf8');
}
