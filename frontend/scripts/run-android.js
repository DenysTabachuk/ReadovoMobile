const { execFileSync, spawn } = require('node:child_process');
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

if (apiMode === 'local') {
  try {
    const api = new URL(apiUrl);
    if (api.hostname === 'localhost' || api.hostname === '127.0.0.1') {
      const port = api.port || (api.protocol === 'https:' ? '443' : '80');
      execFileSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], {
        stdio: 'ignore',
      });
      console.log(`[Readovo] ADB reverse enabled for API port ${port}`);
    }
  } catch {
    console.warn(
      '[Readovo] Could not reverse the API port. Connect an ADB device or use a reachable LAN API URL.',
    );
  }
}

const child = spawn(expoBin, args, {
  env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
