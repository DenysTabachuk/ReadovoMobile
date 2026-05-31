const { spawn } = require('node:child_process');
const path = require('node:path');
const { createApiEnv, parseApiArgs } = require('./api-env');

const { apiMode, forwardedArgs } = parseApiArgs(['--api=render', ...process.argv.slice(2)]);
const { apiUrl, env } = createApiEnv(apiMode);
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleBin = path.join(__dirname, '..', 'android', gradleCommand);
const args = ['assembleRelease', ...forwardedArgs];

console.log(`[Readovo] Android release API mode: ${apiMode}`);
console.log(`[Readovo] Android release API URL: ${apiUrl}`);

const child = spawn(gradleBin, args, {
  cwd: path.join(__dirname, '..', 'android'),
  env,
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
