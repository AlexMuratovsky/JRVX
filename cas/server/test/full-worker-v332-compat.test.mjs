// Run the complete historical actual Worker/D1/DO scenarios against the local
// v332 source without changing the original test's default v330 behavior.
import { fileURLToPath } from 'node:url';
process.env.CAS_FULL_WORKER_SOURCE = fileURLToPath(new URL('../worker-v332.mjs', import.meta.url));
process.env.CAS_FULL_WORKER_RECOVERY = 'v332';
process.env.CAS_FULL_WORKER_RESULT_NAME = 'full-worker-v332-compat-result.json';
await import('./full-worker-v330.test.mjs');
