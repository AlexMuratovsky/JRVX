import './verify-recovery.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['src/worker.mjs', 'src/client/id-next.js', 'src/client/id-next.css', 'scripts/build.mjs', 'wrangler.jsonc', 'pnpm-lock.yaml', 'recovered/manifest.json'];
const hash = createHash('sha256');
for (const file of files) hash.update(file + '\0').update((await readFile(resolve(root, file), 'utf8')).replaceAll('\r\n', '\n')).update('\0');
const sourceBuild = hash.digest('hex').slice(0, 20);
await mkdir(resolve(root, '.build/app'), { recursive: true });
await copyFile(resolve(root, 'recovered/worker.js'), resolve(root, '.build/app/legacy.js'));
await build({
  absWorkingDir: root, entryPoints: ['src/worker.mjs'], outfile: '.build/app/worker.js',
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', charset: 'utf8',
  define: { __JRVX_SOURCE_BUILD__: JSON.stringify(sourceBuild) },
  plugins: [{ name: 'verified-runtime-and-client-text', setup(builder) {
    builder.onResolve({ filter: /recovered\/worker\.js$/ }, () => ({ path: './legacy.js', external: true }));
    builder.onResolve({ filter: /\?raw$/ }, args => ({ path: relative(root, resolve(dirname(args.importer), args.path.slice(0, -4))).replaceAll('\\', '/'), namespace: 'client-text' }));
    builder.onLoad({ filter: /.*/, namespace: 'client-text' }, async args => ({ contents: (await readFile(resolve(root, args.path), 'utf8')).replaceAll('\r\n', '\n'), loader: 'text' }));
  }}]
});
const modules = [];
for (const name of ['worker.js', 'legacy.js']) {
  const bytes = await readFile(resolve(root, '.build/app', name));
  modules.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
assert(modules[0].bytes < 150000, 'Unexpected client adapter size');
await writeFile(resolve(root, '.build/manifest.json'), JSON.stringify({ sourceBuild, modules }, null, 2) + '\n');
console.log(`Built JRVX ID ${sourceBuild}: editable client and verified authentication module`);
