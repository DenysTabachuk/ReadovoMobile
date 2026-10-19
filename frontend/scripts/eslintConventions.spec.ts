import { execFileSync } from 'node:child_process';
import path from 'node:path';

type LintCase = {
  name: string;
  filePath: string;
  code: string;
  expectedRule?: string;
};
type LintCaseResult = { name: string; rules: (string | null)[] };

const cases: LintCase[] = [
  {
    name: 'shared alias import cannot depend on a feature',
    filePath: 'components/button/index.tsx',
    code: "export { useAuth } from '@/features/auth';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'shared relative import cannot bypass the boundary',
    filePath: 'components/button/index.tsx',
    code: "export { useAuth } from '../../features/auth';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'another feature can use the public feature API',
    filePath: 'features/articles/index.ts',
    code: "export { useAuth } from '@/features/auth';",
  },
  {
    name: 'another feature cannot import internal types',
    filePath: 'features/articles/index.ts',
    code: "export type { DictionaryWord } from '@/features/dictionary/api/types';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'relative imports cannot bypass another feature public API',
    filePath: 'features/articles/index.ts',
    code: "export type { DictionaryWord } from '../dictionary/api/types';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'a feature can access its own internals',
    filePath: 'features/articles/index.ts',
    code: "export type { ArticleBlock } from './api/types';",
  },
  {
    name: 'API modules cannot import their screen internals',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: "export { buildSelectedFragment } from '../../../screens/ArticleScreen/utils/buildSelectedFragment';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'API modules cannot import their own aggregate barrel',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: "export { fetchWikipediaArticleDetail } from '../../';",
    expectedRule: 'import/no-restricted-paths',
  },
  {
    name: 'API modules can use the request group barrel',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: "export { fetchWikipediaArticleDetail } from '../../requests';",
  },
  {
    name: 'HTTP modules cannot import React',
    filePath:
      'features/articles/api/requests/fetchWikipediaArticleDetail/index.ts',
    code: "export { useState } from 'react';",
    expectedRule: 'no-restricted-imports',
  },
  {
    name: 'HTTP modules cannot import React Query',
    filePath:
      'features/articles/api/requests/fetchWikipediaArticleDetail/index.ts',
    code: "export { useQuery } from '@tanstack/react-query';",
    expectedRule: 'no-restricted-imports',
  },
  {
    name: 'query modules can use React Query',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: "export { useQuery } from '@tanstack/react-query';",
  },
  {
    name: 'four positional parameters require an object in the migrated API',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: 'export function combine(a: number, b: number, c: number, d: number) { return a + b + c + d; }',
    expectedRule: 'max-params',
  },
  {
    name: 'inline parameter object types require a named type',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: 'export function select({ id }: { id: number }) { return id; }',
    expectedRule: 'no-restricted-syntax',
  },
  {
    name: 'default parameter object types also require a named type',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: 'export const select = ({ id }: { id: number } = { id: 1 }) => id;',
    expectedRule: 'no-restricted-syntax',
  },
  {
    name: 'named parameter objects are allowed',
    filePath: 'features/articles/api/queries/useArticleDetailQuery/index.ts',
    code: 'type Params = { id: number }; export function select({ id }: Params) { return id; }',
  },
];

// Use a plain Node process to load the real Expo/ESLint configuration; Jest's
// module loader cannot load all resolver dependencies the same way as ESLint CLI.
const lintProgram = `
  const { ESLint } = require('eslint');
  const cases = JSON.parse(process.argv[1]);
  (async () => {
    const eslint = new ESLint();
    const results = [];
    for (const item of cases) {
      const [result] = await eslint.lintText(item.code, { filePath: item.filePath });
      results.push({ name: item.name, rules: result.messages.map((message) => message.ruleId) });
    }
    process.stdout.write(JSON.stringify(results));
  })().catch((error) => { console.error(error); process.exitCode = 1; });
`;

describe('frontend convention lint configuration', () => {
  let results: LintCaseResult[];

  beforeAll(() => {
    const output = execFileSync(
      process.execPath,
      ['-e', lintProgram, JSON.stringify(cases)],
      {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
        timeout: 30000,
      },
    );
    results = JSON.parse(output) as LintCaseResult[];
  }, 35000);

  it.each(cases)('$name', ({ name, expectedRule }) => {
    const result = results.find((item) => item.name === name);
    expect(result).toBeDefined();
    if (expectedRule) {
      expect(result?.rules).toContain(expectedRule);
    } else {
      expect(result?.rules).toEqual([]);
    }
  });
});
