import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

export const requiredLegacyFiles = [
  'index.html',
  'README.md',
] as const;

const assetExtensions = new Set([
  '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac',
  '.glb', '.gltf', '.fbx', '.obj', '.blend',
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ktx2',
  '.ttf', '.otf', '.woff', '.woff2', '.mp4', '.webm',
]);
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.ts', '.json']);

export interface FileRecord {
  path: string;
  bytes: number;
  sha256: string;
  kind: 'asset' | 'archive' | 'source' | 'document';
  licenseStatus: 'unverified';
}

export interface LegacyAudit {
  schemaVersion: 1;
  sourceStatus: 'missing-source' | 'source-present-unverified';
  missingFiles: string[];
  runtimeVerification: 'not-performed';
  files: FileRecord[];
  externalReferences: string[];
  limitations: string[];
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

/** Read-only inventory. Symbolic links are rejected so the audit stays in its source tree. */
async function listFiles(directory: string): Promise<string[]> {
  if (!(await exists(directory))) return [];
  const info = await lstat(directory);
  if (info.isSymbolicLink()) throw new Error(`Symbolic link is not audited: ${directory}`);
  if (!info.isDirectory()) throw new Error(`Expected directory: ${directory}`);
  const paths: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not audited: ${path}`);
    if (entry.isDirectory()) paths.push(...await listFiles(path));
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Unsupported file type: ${path}`);
  }
  return paths.sort();
}

export async function auditLegacy(root: string): Promise<LegacyAudit> {
  const legacyDirectory = join(root, 'legacy');
  if (await exists(legacyDirectory) && (await lstat(legacyDirectory)).isSymbolicLink()) {
    throw new Error(`Symbolic link is not audited: ${legacyDirectory}`);
  }
  const paths = [
    ...await listFiles(join(root, 'legacy', 'v0.2')),
    ...await listFiles(join(root, 'assets')),
  ];
  const files: FileRecord[] = [];
  const references = new Set<string>();
  for (const path of paths) {
    const bytes = await readFile(path);
    const extension = extname(path).toLowerCase();
    files.push({
      path: relative(root, path).split(sep).join('/'),
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      kind: assetExtensions.has(extension) ? 'asset'
        : extension === '.zip' ? 'archive'
        : textExtensions.has(extension) ? 'source' : 'document',
      licenseStatus: 'unverified',
    });
    if (textExtensions.has(extension)) {
      for (const match of bytes.toString('utf8').matchAll(/https?:\/\/[^\s"'<>`\)]+/g)) {
        try {
          const url = new URL(match[0]);
          // Query strings, fragments and credentials may contain sensitive values.
          url.username = '';
          url.password = '';
          url.search = '';
          url.hash = '';
          references.add(url.toString());
        } catch {
          // A lexical reference is not necessarily a valid absolute URL.
        }
      }
    }
  }
  const inventory = new Set(files.map((file) => file.path));
  const missingFiles = requiredLegacyFiles
    .map((file) => `legacy/v0.2/${file}`)
    .filter((file) => !inventory.has(file));

  return {
    schemaVersion: 1,
    sourceStatus: missingFiles.length ? 'missing-source' : 'source-present-unverified',
    missingFiles,
    runtimeVerification: 'not-performed',
    files: files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    externalReferences: [...references].sort(),
    limitations: [
      'File presence and hashes do not prove v0.2 opens or behaves correctly.',
      'Archives are hashed but not extracted or inspected.',
      'External references are lexical hints only; no remote content is fetched.',
      'License rights require manual review, including embedded and procedural assets.',
      'This inventory does not run the browser; consult the separate browser tests and phase report.',
    ],
  };
}
