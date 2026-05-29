const { spawn } = require('node:child_process');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { API_PORT, createApiEnv, parseApiArgs } = require('./api-env');

const METRO_PORT = '8081';
const REACTOTRON_PORT = '9090';

const { apiMode, forwardedArgs } = parseApiArgs(process.argv.slice(2));
const { apiUrl, env, host } = createApiEnv(apiMode);
const expoBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);
const args = ['start', '--lan', ...forwardedArgs];

console.log(`[Readovo] Dev host: ${host}`);
console.log(`[Readovo] API mode: ${apiMode}`);
console.log(`[Readovo] API URL: ${apiUrl}`);
console.log(`[Readovo] Reactotron host: ${host}`);
console.log(`[Readovo] Metro host override: ${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);

tryReversePorts([METRO_PORT, API_PORT, REACTOTRON_PORT]);

const child = spawn(expoBin, args, {
  env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

function tryReversePorts(ports) {
  try {
    const devicesOutput = execFileSync('adb', ['devices'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const hasConnectedDevice = devicesOutput
      .split('\n')
      .some((line) => /\bdevice$/.test(line.trim()) && !line.startsWith('List of devices'));

    if (!hasConnectedDevice) {
      return;
    }

    for (const port of ports) {
      execFileSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], {
        stdio: 'ignore',
      });
    }

    console.log(`[Readovo] ADB reverse enabled for ports: ${ports.join(', ')}`);
  } catch {
    console.log('[Readovo] ADB reverse skipped: no adb device detected or adb is unavailable');
  }
}
