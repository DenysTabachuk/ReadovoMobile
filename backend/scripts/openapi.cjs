const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');

const JSON_INDENT_SPACES = 2;

// Node runs this JavaScript file directly. Register ts-node first so require()
// can also load backend .ts files using the project's NestJS/decorator settings.
// __dirname is this script's folder; resolve() builds an absolute path from it.
require('ts-node').register({
  project: resolve(__dirname, '../tsconfig.json'),
});
// This script uses CommonJS to load backend TypeScript through ts-node directly.
const { exportOpenApi } = require('../src/openapi/export-openapi');
const artifact = resolve(__dirname, '../openapi/openapi.json');

async function main() {
  // Get the API description as a JavaScript object, without starting an HTTP server.
  const document = await exportOpenApi();
  // Convert it to JSON text. The second argument runs for each nested value;
  // replace objects with copies whose keys have a stable alphabetical order.
  // This prevents key ordering alone from changing the generated file.
  const output =
    JSON.stringify(
      document,
      (_key, value) => {
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          // entries: { b: 2, a: 1 } -> [['b', 2], ['a', 1]].
          const entries = Object.entries(value);
          entries.sort(([leftKey], [rightKey]) => {
            if (leftKey < rightKey) return -1;
            if (leftKey > rightKey) return 1;
            return 0;
          });
          // Rebuild the object from the sorted entries, without modifying the input.
          return Object.fromEntries(entries);
        }
        // Keep primitives, null and array ordering unchanged.
        return value;
      },
      JSON_INDENT_SPACES,
    ) + '\n';
  // output is now a string with two-space indentation and a final newline.

  // --check compares with the existing file instead of writing a new one.
  if (process.argv.includes('--check')) {
    let current;
    try {
      // 'utf8' returns the file contents as a string, rather than a byte buffer.
      current = readFileSync(artifact, 'utf8');
    } catch (error) {
      // ENOENT means the file is missing; report it as stale below.
      // Other reading errors must still fail immediately.
      if (error.code !== 'ENOENT') throw error;
    }
    // Ignore Windows CRLF versus LF line endings when comparing text.
    if (current?.replaceAll('\r\n', '\n') !== output) {
      throw new Error(
        'OpenAPI artifact is missing or stale. Run npm run contracts:generate from the repository root.',
      );
    }
    console.log('OpenAPI artifact is current.');
    // Stop here so check mode never reaches the file-writing code below.
    return;
  }
  // dirname removes the filename. Create that folder and any missing parents;
  // recursive: true also allows the folder to exist already.
  const outputDirectory = dirname(artifact);
  mkdirSync(outputDirectory, { recursive: true });
  // Write the JSON string, replacing the previous file if it exists.
  writeFileSync(artifact, output);
  console.log('Generated backend/openapi/openapi.json');
}

// Report failures and return exit code 1, which makes npm/CI mark the command failed.
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
