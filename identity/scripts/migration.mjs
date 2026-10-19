import { openSync, closeSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { inspectSource, migrateIdentity } from '../src/migration.mjs';

const [mode, sourcePath, destinationPath, ...extra] = process.argv.slice(2);
if (!['inspect', 'candidate'].includes(mode) || !sourcePath || extra.length || (mode === 'inspect' && destinationPath) || (mode === 'candidate' && !destinationPath)) {
  throw Error('Usage: node scripts/migration.mjs inspect SOURCE.sqlite | candidate SOURCE.sqlite NEW.sqlite');
}
if ([sourcePath, destinationPath].filter(Boolean).some(path => /^[a-z]+:\/\//i.test(path))) throw Error('Only local SQLite files are accepted');
const source = new DatabaseSync(realpathSync(sourcePath), { readOnly: true });
try {
  if (mode === 'inspect') {
    const report = inspectSource(source);
    console.log(JSON.stringify(report, null, 2));
    if (!report.ready) process.exitCode = 1;
  } else {
    const report = inspectSource(source);
    if (!report.ready) throw Error(`Preflight blocked: ${Object.keys(report.blockers).join(', ')}`);
    const destination = resolve(destinationPath);
    // Exclusive creation prevents accidental overwrites, including the source file.
    const fd = openSync(destination, 'wx', 0o600); closeSync(fd);
    const target = new DatabaseSync(destination);
    try { console.log(JSON.stringify(migrateIdentity(source, target), null, 2)); }
    finally { target.close(); }
  }
} finally { source.close(); }
