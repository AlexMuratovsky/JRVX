import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
if (git.status !== 0 || !/^[a-f0-9]{40}$/.test(git.stdout.trim())) throw Error('Cannot resolve Git commit');
const dirty = spawnSync('git', ['status', '--porcelain', '--', '.'], { cwd: root, encoding: 'utf8' });
if (dirty.status !== 0 || dirty.stdout.trim()) throw Error('Commit identity changes before deploying');
const check = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status ?? 1);
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, 'deploy', '--config', 'wrangler.jsonc', '--keep-vars', '--message', `JRVX ID staging; Git ${git.stdout.trim()}`], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
