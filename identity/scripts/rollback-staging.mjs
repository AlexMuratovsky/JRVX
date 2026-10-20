import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [version, ...extra] = process.argv.slice(2);
if (extra.length || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(version ?? '')) throw Error('Pass the exact previous staging version UUID');
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
if (config.name !== 'jrvx-id-next' || config.vars.ENVIRONMENT !== 'staging' || config.routes || config.env) throw Error('Rollback is restricted to the isolated staging Worker');
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, 'rollback', version, '--config', 'wrangler.jsonc', '--yes', '--message', 'JRVX ID isolated staging rollback'], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
