import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createLegacyServer } from '../../scripts/legacy-server.js';

let root: string | undefined;
let server: Server | undefined;
afterEach(async () => {
  if (server) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
  if (root) await rm(root, { recursive: true, force: true });
  server = undefined;
  root = undefined;
});

it('serves the unchanged prototype and refuses repo files, traversal and mutations', async () => {
  root = await mkdtemp(join(tmpdir(), 'halay-server-'));
  await mkdir(join(root, 'legacy/v0.2'), { recursive: true });
  const original = '<!doctype html><p>Halay — katıl 🎵</p>\r\n';
  await writeFile(join(root, 'legacy/v0.2/index.html'), original);
  await writeFile(join(root, 'legacy/v0.2/README.md'), 'Prototype');
  await writeFile(join(root, '.env'), 'must-not-be-served');
  server = await createLegacyServer(root);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP address');
  expect(address.address).toBe('127.0.0.1');
  const url = `http://127.0.0.1:${address.port}`;
  expect(await (await fetch(url)).text()).toBe(original);
  expect(await (await fetch(`${url}/README.md`)).text()).toBe('Prototype');
  expect((await fetch(`${url}/.env`)).status).toBe(404);
  expect((await fetch(`${url}/%2e%2e/.env`)).status).toBe(404);
  expect((await fetch(url, { method: 'POST' })).status).toBe(405);
  expect(await (await fetch(url, { method: 'HEAD' })).text()).toBe('');
});
