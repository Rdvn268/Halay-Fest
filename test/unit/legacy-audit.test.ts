import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditLegacy, requiredLegacyFiles } from '../../scripts/legacy-audit.js';

const roots: string[] = [];
async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'halay-phase0-'));
  roots.push(root);
  await mkdir(join(root, 'legacy', 'v0.2'), { recursive: true });
  return root;
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('read-only legacy inventory', () => {
  it('reports all absent sources without claiming a working prototype', async () => {
    const root = await fixture();
    const report = await auditLegacy(root);
    expect(report.sourceStatus).toBe('missing-source');
    expect(report.missingFiles).toHaveLength(2);
    expect(report.runtimeVerification).toBe('not-performed');
    expect(report.files).toEqual([]);
  });

  it('handles a checkout without a legacy directory', async () => {
    const root = await fixture();
    await rm(join(root, 'legacy'), { recursive: true });
    expect((await auditLegacy(root)).missingFiles).toHaveLength(2);
  });

  it('hashes original bytes unchanged, retaining Turkish text and binary files', async () => {
    const root = await fixture();
    const content = Buffer.from('katıl — Halay/horon 🎵\r\n', 'utf8');
    await writeFile(join(root, 'legacy/v0.2/index.html'), content);
    const asset = Buffer.from([0, 255, 128, 13, 10]);
    await writeFile(join(root, 'legacy/v0.2/sample.WAV'), asset);
    const before = await readFile(join(root, 'legacy/v0.2/index.html'));
    const report = await auditLegacy(root);
    expect(report.files.find((file) => file.path.endsWith('index.html'))?.sha256)
      .toBe(createHash('sha256').update(content).digest('hex'));
    expect(report.files.find((file) => file.path.endsWith('sample.WAV')))
      .toMatchObject({ bytes: 5, kind: 'asset', licenseStatus: 'unverified' });
    expect(await readFile(join(root, 'legacy/v0.2/index.html'))).toEqual(before);
  });

  it('keeps runtime and rights unverified even when all required filenames exist', async () => {
    const root = await fixture();
    for (const file of requiredLegacyFiles) {
      await writeFile(join(root, 'legacy/v0.2', file), 'Synthetic fixture, not the prototype');
    }
    const report = await auditLegacy(root);
    expect(report.missingFiles).toEqual([]);
    expect(report.sourceStatus).toBe('source-present-unverified');
    expect(report.runtimeVerification).toBe('not-performed');
    expect(report.files.every((file) => file.licenseStatus === 'unverified')).toBe(true);
    expect(report.files).toHaveLength(2);
  });

  it('lists remote hints without fetching them or retaining credentials/query strings', async () => {
    const root = await fixture();
    await writeFile(join(root, 'legacy/v0.2/index.html'), [
      '<script src="https://cdn.example.invalid/three.js?key=private#secret"></script>',
      '<audio src="https://name:password@example.invalid/song.ogg"></audio>',
      '<script src="https://cdn.example.invalid/three.js"></script>',
    ].join('\n'));
    const report = await auditLegacy(root);
    expect(report.externalReferences).toEqual([
      'https://cdn.example.invalid/three.js', 'https://example.invalid/song.ogg',
    ]);
  });

  it('scans nested asset folders and produces stable portable paths', async () => {
    const root = await fixture();
    await mkdir(join(root, 'assets', 'audio'), { recursive: true });
    await writeFile(join(root, 'assets/audio/test.ogg'), 'synthetic');
    const first = await auditLegacy(root);
    expect(first.files[0]?.path).toBe('assets/audio/test.ogg');
    expect(await auditLegacy(root)).toEqual(first);
  });

  it('rejects directory links instead of scanning outside the checkout', async () => {
    const root = await fixture();
    const outside = await fixture();
    await symlink(outside, join(root, 'legacy/v0.2/external'), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(auditLegacy(root)).rejects.toThrow('Symbolic link is not audited');
  });

  it('rejects a linked inventory root', async () => {
    const root = await fixture();
    const outside = await fixture();
    await symlink(outside, join(root, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(auditLegacy(root)).rejects.toThrow('Symbolic link is not audited');
  });

  it('rejects a linked legacy parent', async () => {
    const root = await fixture();
    const outside = await fixture();
    await rm(join(root, 'legacy'), { recursive: true });
    await symlink(join(outside, 'legacy'), join(root, 'legacy'), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(auditLegacy(root)).rejects.toThrow('Symbolic link is not audited');
  });
});
