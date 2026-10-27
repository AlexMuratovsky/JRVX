import { createRequire } from 'node:module';
import path from 'node:path';
const local = createRequire(import.meta.url);
const fallback = createRequire(new URL('../../identity/package.json', import.meta.url));
let modulePath;
try { modulePath = local.resolve('esbuild'); }
catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; modulePath = fallback.resolve('esbuild'); }
const { build } = local(modulePath);
await build({ absWorkingDir: import.meta.dirname, entryPoints: ['worker-v332.mjs'],
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  external: ['cloudflare:workers'], outfile: path.join(import.meta.dirname, 'build/worker-v332.mjs') });
console.log('Built local CAS read-only recovery Worker v332; no deployment or database operation performed.');
