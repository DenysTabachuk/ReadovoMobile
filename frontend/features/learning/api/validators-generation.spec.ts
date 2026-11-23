import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

it('generates deterministic standalone guards from the selected OpenAPI schemas', () => {
  const generatorUrl = pathToFileURL(
    resolve(__dirname, '../../../scripts/api-validators.mjs'),
  ).href;
  const contractPath = resolve(
    __dirname,
    '../../../../backend/openapi/openapi.json',
  );
  const script = `
    import { readFileSync } from 'node:fs';
    import { createContext, runInContext } from 'node:vm';
    import { buildLearningValidators } from ${JSON.stringify(generatorUrl)};
    const document = JSON.parse(readFileSync(${JSON.stringify(contractPath)}, 'utf8'));
    const catalogue = { supportedLevels: ['A1'], defaultLevel: 'A1', topic: null, topics: [], lessons: [] };
    const first = await buildLearningValidators(document);
    const second = await buildLearningValidators(structuredClone(document));
    if (first.javascript !== second.javascript || first.declarations !== second.declarations) throw new Error('Nondeterministic generation');
    const context = createContext({ exports: {} }, { codeGeneration: { strings: false, wasm: false } });
    runInContext(first.javascript, context);
    if (!context.exports.isGetLearningCatalogueResponse(catalogue)) throw new Error('Valid catalogue rejected');
    if (context.exports.isGetLearningCatalogueResponse({ ...catalogue, topics: null })) throw new Error('Invalid catalogue accepted');
    const changed = structuredClone(document);
    changed.components.schemas.GetLearningCatalogueResponse.properties.topics.minItems = 1;
    const updated = await buildLearningValidators(changed);
    const changedContext = createContext({ exports: {} }, { codeGeneration: { strings: false, wasm: false } });
    runInContext(updated.javascript, changedContext);
    if (changedContext.exports.isGetLearningCatalogueResponse(catalogue)) throw new Error('Schema change was ignored');
    const unsupported = structuredClone(document);
    unsupported.components.schemas.VocabularyLessonWord.properties.imageSourceUrl.format = 'unsupported-format';
    let rejected = false;
    try { await buildLearningValidators(unsupported); } catch { rejected = true; }
    if (!rejected) throw new Error('Unknown format was silently ignored');
    console.log('Standalone generation verified');
  `;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      encoding: 'utf8',
      timeout: 30_000,
    },
  );
  if (result.error) throw result.error;
  expect({ status: result.status, stderr: result.stderr }).toEqual({
    status: 0,
    stderr: '',
  });
  expect(result.stdout).toContain('Standalone generation verified');
}, 35_000);
