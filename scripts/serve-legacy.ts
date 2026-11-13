import { createLegacyServer } from './legacy-server.js';

const port = Number(process.env['PORT'] ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('PORT must be an integer between 1024 and 65535.');
}
const server = await createLegacyServer(process.cwd());
server.on('error', (error) => {
  console.error(`Legacy preview failed: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`HALAY FEST v0.2 — yalnızca yerel DEMO: http://127.0.0.1:${port}`);
  console.log('Durdurmak için Ctrl+C. Three.js ve fontlar için internet gerekir.');
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close());
}
