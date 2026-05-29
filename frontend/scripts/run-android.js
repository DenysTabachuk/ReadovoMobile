const { spawn } = require('node:child_process');
const path = require('node:path');
const { createApiEnv, parseApiArgs } = require('./api-env');

const { apiMode, forwardedArgs } = parseApiArgs(process.argv.slice(2));
const { apiUrl, env, host } = createApiEnv(apiMode);
const expoBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo',
);
const args = ['run:android', ...forwardedArgs];

console.log(`[Readovo] Android build API mode: ${apiMode}`);
console.log(`[Readovo] Android build API URL: ${apiUrl}`);
console.log(`[Readovo] Android build host: ${host}`);

const child = spawn(expoBin, args, {
  env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
