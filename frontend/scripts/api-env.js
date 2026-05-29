const fs = require('node:fs');
const { networkInterfaces } = require('node:os');
const path = require('node:path');

const API_PORT = '3000';
const VIRTUAL_INTERFACE_PATTERN = /docker|hyper-v|loopback|virtual|vmware|vbox|wsl/i;
const ENV_FILE_VALUES = readEnvFile(path.join(__dirname, '..', '.env'));
const RENDER_API_URL =
  process.env.READOVO_RENDER_API_URL ?? ENV_FILE_VALUES.EXPO_PUBLIC_RENDER_API_URL;

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

function parseApiArgs(argv) {
  let apiMode = 'local';
  const forwardedArgs = [];

  for (const arg of argv) {
    if (arg === '--local') {
      apiMode = 'local';
      continue;
    }

    if (arg === '--render' || arg === '--remote') {
      apiMode = 'render';
      continue;
    }

    if (arg.startsWith('--api=')) {
      const value = arg.slice('--api='.length).trim();

      if (value !== 'local' && value !== 'render') {
        throw new Error(`Unsupported API mode "${value}". Use "local" or "render".`);
      }

      apiMode = value;
      continue;
    }

    forwardedArgs.push(arg);
  }

  return { apiMode, forwardedArgs };
}

function getApiUrl(apiMode, host) {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.trim();
  }

  if (apiMode === 'render') {
    if (!RENDER_API_URL) {
      throw new Error('EXPO_PUBLIC_RENDER_API_URL is required for the render API mode.');
    }

    return RENDER_API_URL;
  }

  return `http://${host}:${API_PORT}`;
}

function createApiEnv(apiMode) {
  const host = getLocalIpv4Address();
  const apiUrl = getApiUrl(apiMode, host);

  return {
    apiUrl,
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: apiUrl,
      EXPO_PUBLIC_REACTOTRON_HOST: process.env.EXPO_PUBLIC_REACTOTRON_HOST ?? host,
      REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REACT_NATIVE_PACKAGER_HOSTNAME ?? host,
    },
    host,
  };
}

function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      values[key] = value.replace(/^['"]|['"]$/g, '');

      return values;
    }, {});
}

module.exports = {
  API_PORT,
  createApiEnv,
  parseApiArgs,
};
