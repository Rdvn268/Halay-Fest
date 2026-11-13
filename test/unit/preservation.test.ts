import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

interface PreservedFile { path: string; sha256: string; bytes?: number }
const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('docs/legacy-manifest.json', root), 'utf8')) as {
  files: PreservedFile[];
  archive: PreservedFile;
};

for (const file of [...manifest.files, manifest.archive]) {
  it(`preserves the recorded bytes of ${file.path}`, async () => {
    const bytes = await readFile(new URL(file.path, root));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
    if (file.bytes !== undefined) expect(bytes.length).toBe(file.bytes);
  });
}
