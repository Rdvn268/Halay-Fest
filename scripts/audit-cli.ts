import { auditLegacy } from './legacy-audit.js';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--require-source')) {
  console.error('Usage: npm run audit:legacy | npm run check:legacy');
  process.exitCode = 2;
} else {
  try {
    const report = await auditLegacy(process.cwd());
    console.log(JSON.stringify(report, null, 2));
    if (args.includes('--require-source') && report.missingFiles.length) {
      console.error('FAZ 0 AÇIK: v0.2 kaynakları eksik. Faz 1 başlatılamaz.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Legacy audit failed.');
    process.exitCode = 2;
  }
}
