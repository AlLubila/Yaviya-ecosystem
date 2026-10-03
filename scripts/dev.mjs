import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv.includes('--dist') ? 'dist' : '.';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const safePath = normalize(pathname === '/' ? 'index.html' : pathname.slice(1)).replace(/^\.\.(\/|\\|$)/, '');
  try {
    const body = await readFile(join(root, safePath));
    response.writeHead(200, { 'Content-Type': types[extname(safePath)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404); response.end('Page introuvable'); }
});
server.listen(3000, '127.0.0.1', () => console.log(`YAVIYA disponible sur http://127.0.0.1:3000 (${root})`));
