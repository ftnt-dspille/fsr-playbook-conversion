import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load source files in dependency order into the global context.
// The converter files are written as browser globals (no module system),
// so we eval them into globalThis to make their functions available in tests.
const sourceFiles = [
    'converter/constants.js',
    'converter/fsr-to-fas.js',
    'converter/fas-to-fsr.js',
];

for (const file of sourceFiles) {
    const src = readFileSync(join(root, file), 'utf8');
    vm.runInThisContext(src, { filename: file });
}
