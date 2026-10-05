import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const html = await readFile('index.html', 'utf8');
const failures = [];
for (const reference of ['styles.css', 'script.js', 'assets/hero.png']) {
  if (!html.includes(reference)) failures.push(`référence ${reference} absente`);
}
for (const file of ['aide.html', 'confidentialite.html', 'congo.html', 'publicite.html']) {
  try { await access(file); } catch { failures.push(`page ${file} absente`); }
}
const modules = (await readdir('assets/js')).filter(file => file.endsWith('.js'));
for (const file of ['script.js', ...modules.map(file => `assets/js/${file}`)]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`syntaxe ${file} invalide : ${result.stderr}`);
}
if (modules.length < 20) failures.push('modules du site complet absents');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Vérifications statiques réussies.');
