import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';

/** Phase 0 preview: serves only the two preserved prototype files, never the repo root. */
export async function createLegacyServer(root: string) {
  const html = await readFile(join(root, 'legacy/v0.2/index.html'));
  const readme = await readFile(join(root, 'legacy/v0.2/README.md'));
  return createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = (request.url ?? '/').split('?')[0];
    const content = path === '/' || path === '/index.html' ? html
      : path === '/README.md' ? readme : undefined;
    if (path === '/favicon.ico') {
      response.writeHead(204).end();
    } else if (content) {
      response.writeHead(200, {
        'Content-Type': path === '/README.md' ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8',
        'Content-Length': content.length,
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } else {
      response.writeHead(404).end('Not found');
    }
  });
}
