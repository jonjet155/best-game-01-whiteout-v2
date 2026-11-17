// WHITEOUT — development server only (not part of the entry's game).
// Serves game/ on http://localhost:8080 so the game can be played and
// screenshotted locally. Node 22, standard library only.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((request, response) => {
  try {
    const urlPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const resolved = resolve(join(root, normalize(urlPath).replace(/^(\.\.[/\\])+/, '')));
    if (!resolved.startsWith(root + sep) && resolved !== root) {
      response.writeHead(403);
      response.end('forbidden');
      return;
    }
    const file = resolved === root ? join(root, 'index.html') : resolved;
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error('not a file');
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`WHITEOUT dev server: http://127.0.0.1:${port}/`);
});
