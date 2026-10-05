import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const entry of [
  'index.html',
  'aide.html',
  'confidentialite.html',
  'congo.html',
  'publicite.html',
  'script.js',
  'styles.css',
  'assets'
]) {
  await cp(entry, `dist/${entry}`, { recursive: true });
}

console.log('Frontend YAVIYA complet créé dans dist/.');
