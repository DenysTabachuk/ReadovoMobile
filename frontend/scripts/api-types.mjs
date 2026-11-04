import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

async function main() {
  // import.meta.url is the URL of this script, not a dynamic import.
  // Resolve the input relative to this file, regardless of the working directory.
  const schema = new URL('../../backend/openapi/openapi.json', import.meta.url);
  // Build the output URL the same way, then convert it to a filesystem path
  // (for example, C:\ReadovoMobile\frontend\api\generated\transport.d.ts on Windows).
  const artifact = fileURLToPath(
    new URL('../api/generated/transport.d.ts', import.meta.url),
  );

  // Read the OpenAPI document and generate a TypeScript syntax tree (AST).
  // astToString below converts that tree into the source text of the types file.
  // A documented server default must not make an optional HTTP input required.
  const ast = await openapiTS(schema, {
    alphabetize: true,
    defaultNonNullable: false,
    rootTypes: true,
    rootTypesNoSchemaPrefix: true,
    rootTypesKeepCasing: true,
  });

  // Find the project's Prettier settings for the output file.
  const config = await prettier.resolveConfig(artifact);
  // Convert the generated syntax tree to text and prepend the generated-file notice.
  // Format that text using project rules; output is a string, not a file yet.
  const output = await prettier.format(COMMENT_HEADER + astToString(ast), {
    ...config,
    parser: 'typescript',
    // Always use LF (\n), rather than Windows CRLF (\r\n), for stable output.
    endOfLine: 'lf',
  });

  if (process.argv.includes('--check')) {
    let current;
    try {
      // 'utf8' makes this return the entire file as a string, rather than bytes.
      // Sync means execution waits until reading finishes; unreadable files throw.
      current = readFileSync(artifact, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (current?.replaceAll('\r\n', '\n') !== output) {
      throw new Error(
        'Transport types are missing or stale. Run npm run contracts:generate from the repository root.',
      );
    }
    console.log('Frontend transport types are current.');
    return;
  }
  // dirname removes the filename, leaving the folder that will contain the output.
  const outputDirectory = dirname(artifact);
  // Create that folder and any missing parent folders. Existing folders are fine.
  mkdirSync(outputDirectory, { recursive: true });
  // Write the generated text to the file, replacing its previous contents if present.
  writeFileSync(artifact, output);
  console.log('Generated frontend/api/generated/transport.d.ts');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
