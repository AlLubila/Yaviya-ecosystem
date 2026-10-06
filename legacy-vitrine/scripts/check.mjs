import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const html = await readFile('index.html', 'utf8');
const css = await readFile('styles.css', 'utf8');
const js = await readFile('app.js', 'utf8');
const failures = [];
for (const id of ['productGrid', 'cartButton', 'newsletterForm', 'searchInput']) if (!html.includes(`id="${id}"`)) failures.push(`élément #${id} absent`);
for (const file of ['/styles.css', '/app.js']) if (!html.includes(file)) failures.push(`référence ${file} absente`);
if (!css.includes('@media(max-width:580px)')) failures.push('mise en page mobile absente');
if (!js.includes('renderProducts(); renderCart();')) failures.push('initialisation JavaScript absente');
for (const file of ['app.js', 'catalog/catalog.js', 'catalog/products.js']) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`syntaxe ${file} invalide : ${result.stderr}`);
}
if (!js.includes("import { catalog } from './catalog/catalog.js'")) failures.push('adaptateur catalogue absent');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Vérifications statiques réussies.');
