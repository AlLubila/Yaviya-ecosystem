import { readFile } from 'node:fs/promises';
const html = await readFile('index.html', 'utf8');
const css = await readFile('styles.css', 'utf8');
const js = await readFile('app.js', 'utf8');
const failures = [];
for (const id of ['productGrid', 'cartButton', 'newsletterForm', 'searchInput']) if (!html.includes(`id="${id}"`)) failures.push(`élément #${id} absent`);
for (const file of ['/styles.css', '/app.js']) if (!html.includes(file)) failures.push(`référence ${file} absente`);
if (!css.includes('@media(max-width:580px)')) failures.push('mise en page mobile absente');
if (!js.includes('renderProducts(); renderCart();')) failures.push('initialisation JavaScript absente');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Vérifications statiques réussies.');
