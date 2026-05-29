const { spawn } = require('node:child_process');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { networkInterfaces } = require('node:os');
const path = require('node:path');

const API_PORT = '3000';
const METRO_PORT = '8081';
const REACTOTRON_PORT = '9090';
const VIRTUAL_INTERFACE_PATTERN = /docker|hyper-v|loopback|virtual|vmware|vbox|wsl/i;

function getLocalIpv4Address() {
  if (process.env.READOVO_DEV_HOST) {
    return process.env.READOVO_DEV_HOST.trim();
  }

  const interfaces = networkInterfaces();
  const addresses = [];

  for (const [name, values] of Object.entries(interfaces)) {
    if (!values || VIRTUAL_INTERFACE_PATTERN.test(name)) {
      continue;
    }

    for (const value of values) {
      if (value.family === 'IPv4' && !value.internal) {
        addresses.push(value.address);
      }
    }
  }

  return addresses.find((address) => address.startsWith('192.168.')) ?? addresses[0] ?? 'localhost';
}

const host = getLocalIpv4Address();
const expoBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);
const args = ['start', '--lan', ...process.argv.slice(2)];
const env = {
  ...process.env,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:${API_PORT}`,
  EXPO_PUBLIC_REACTOTRON_HOST: process.env.EXPO_PUBLIC_REACTOTRON_HOST ?? host,
  REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REACT_NATIVE_PACKAGER_HOSTNAME ?? host,
};

console.log(`[Readovo] Dev host: ${host}`);
console.log(`[Readovo] API URL: http://${host}:${API_PORT}`);
console.log(`[Readovo] Reactotron host: ${host}`);
console.log(`[Readovo] Metro host override: ${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);

writeLocalEnv(host);
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

function writeLocalEnv(host) {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const content = [
    `EXPO_PUBLIC_API_URL=http://${host}:${API_PORT}`,
    `EXPO_PUBLIC_REACTOTRON_HOST=${host}`,
    '',
  ].join('\n');

  fs.writeFileSync(envLocalPath, content);
  console.log('[Readovo] Updated .env.local with the current dev host');
}
