import fs from 'node:fs';
import path from 'node:path';
const source = path.resolve('worker');
const output = path.resolve('dist/server');
fs.mkdirSync(output, { recursive: true });
for (const name of fs.readdirSync(source)) {
  if (name.endsWith('.js')) fs.copyFileSync(path.join(source, name), path.join(output, name));
}
// Un dossier frontend/ placé ici peut être intégré au même Worker.
const assets = {};
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
if (fs.existsSync('frontend')) {
  function collect(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) { collect(path.join(directory, entry.name), relative + '/'); continue; }
      const ext = entry.name.split('.').at(-1), type = types[ext];
      if (!type) continue;
      const binary = ['png', 'jpg', 'webp'].includes(ext);
      assets['/' + relative] = { binary, type, data: fs.readFileSync(path.join(directory, entry.name), binary ? 'base64' : 'utf8') };
    }
  }
  collect('frontend');
}
fs.writeFileSync(path.join(output, 'assets.js'), 'export default ' + JSON.stringify(assets) + ';\n');
console.log('Backend préparé : dist/server/index.js');
