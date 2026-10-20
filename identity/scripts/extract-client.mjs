// Recover readable browser assets from the archived Worker using an isolated runtime.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRuntime, root, origin } from '../test/helpers/runtime.mjs';

const runtime = await createRuntime({}, { recovered: true });
try {
  const directory = new URL('reference/client/', root);
  await mkdir(directory, { recursive: true });
  for (const file of ['id-next.js', 'id-next.css']) {
    const response = await runtime.mf.dispatchFetch(`${origin}/assets/${file}`);
    assert.equal(response.status, 200);
    const content = await response.text();
    assert(content.length > 1000);
    await writeFile(new URL(file, directory), content);
    console.log(`Recovered reference/client/${file}`);
  }
} finally { await runtime.dispose(); }
