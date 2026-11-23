import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import formats from 'ajv-formats/dist/formats.js';
import prettier from 'prettier';

// Pilot only: extend adoption deliberately, without validating unrelated features.
const LEARNING_OPERATIONS = [
  'getLearningCatalogue',
  'getLearningLesson',
  'checkReadingAnswer',
  'checkVocabularyAnswer',
];
const CONTRACT_ID = 'readovo-contract';
const GENERATED_HEADER =
  '// Generated from backend/openapi/openapi.json. Do not edit.\n';
const runtimePath = fileURLToPath(
  new URL('../api/generated/learning-validators.js', import.meta.url),
);
const declarationPath = fileURLToPath(
  new URL('../api/generated/learning-validators.d.ts', import.meta.url),
);

/**
 * Compiles thematic lesson responses using the same standalone schema pipeline.
 * @param document - Canonical OpenAPI document, including the learning operations.
 * @returns JavaScript guards and declarations; no runtime Ajv dependency.
 * @example
 * const output = await buildLearningValidators(document); // guards include isGetLearningLessonResponse
 */
export async function buildLearningValidators(document) {
  return buildResponseValidators(document, LEARNING_OPERATIONS);
}

async function buildResponseValidators(document, operations) {
  const ajv = new Ajv({
    strict: false,
    allErrors: false,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    inlineRefs: false,
    code: { source: true, lines: true },
    logger: {
      log() {},
      warn(message) {
        throw new Error(message);
      },
      error(message) {
        throw new Error(message);
      },
    },
  });
  // ajv-formats' fast mode uses standalone RegExp validators for these formats.
  // Register the regexes directly so generated code has no format-library imports.
  ajv.addFormat('uuid', formats.fastFormats.uuid);
  ajv.addFormat('uri', formats.fastFormats.uri);
  ajv.addSchema(document, CONTRACT_ID);

  const exports = {};
  const schemaNames = [];
  for (const operationId of operations) {
    const matches = [];
    for (const path of Object.values(document.paths)) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = path[method];
        if (operation?.operationId === operationId) matches.push(operation);
      }
    }
    if (matches.length !== 1)
      throw new Error(`Expected one operation for ${operationId}.`);
    const reference =
      matches[0].responses?.['200']?.content?.['application/json']?.schema
        ?.$ref;
    const prefix = '#/components/schemas/';
    if (typeof reference !== 'string' || !reference.startsWith(prefix)) {
      throw new Error(`Expected a named JSON 200 response for ${operationId}.`);
    }
    const name = reference.slice(prefix.length);
    if (!/^[A-Za-z_$][\w$]*$/.test(name))
      throw new Error(`Unsupported response schema name: ${name}.`);
    if (schemaNames.includes(name))
      throw new Error(`Duplicate response schema: ${name}.`);
    schemaNames.push(name);
    exports[`is${name}`] = CONTRACT_ID + reference;
  }

  // CJS is the generated artifact format supported directly by both Metro and Jest.
  // The generator itself is an ES module; the app executes only these compiled guards.
  const code = standaloneCode(ajv, exports);
  if (
    /\brequire\s*\(|\bimport\s|\beval\s*\(|\bnew\s+Function\s*\(/.test(code)
  ) {
    throw new Error(
      'Vocabulary validators must remain self-contained without runtime compilation/imports.',
    );
  }
  const config = await prettier.resolveConfig(runtimePath);
  const javascript = await prettier.format(GENERATED_HEADER + code, {
    ...config,
    parser: 'babel',
    endOfLine: 'lf',
  });
  const declarations = await prettier.format(
    GENERATED_HEADER +
      `import type { ${schemaNames.join(', ')} } from './transport';\n\n` +
      schemaNames
        .map(
          (name) =>
            `export declare function is${name}(value: unknown): value is ${name};`,
        )
        .join('\n') +
      '\n',
    { ...config, parser: 'typescript', endOfLine: 'lf' },
  );
  return { javascript, declarations };
}

async function main() {
  const document = JSON.parse(
    readFileSync(
      new URL('../../backend/openapi/openapi.json', import.meta.url),
      'utf8',
    ),
  );
  const learning = await buildLearningValidators(document);
  for (const [path, output] of [
    [runtimePath, learning.javascript],
    [declarationPath, learning.declarations],
  ]) {
    if (process.argv.includes('--check')) {
      let current;
      try {
        current = readFileSync(path, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (current?.replaceAll('\r\n', '\n') !== output) {
        throw new Error(
          'Learning response validators are missing or stale. Run npm run contracts:generate from the repository root.',
        );
      }
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, output);
    }
  }
  console.log(
    process.argv.includes('--check')
      ? 'Learning response validators are current.'
      : 'Generated Learning response validators and declarations.',
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
