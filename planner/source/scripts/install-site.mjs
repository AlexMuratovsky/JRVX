import { spawnSync } from 'node:child_process';

// Keep the managed Linux installer, while supporting this Windows checkout.
const command = process.platform === 'win32'
  ? [process.execPath, process.env.npm_execpath, 'install', '--frozen-lockfile']
  : ['bash', 'scripts/install-pnpm.sh'];
if (command.some(value => !value)) throw new Error('Run through the project package manager.');
const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
