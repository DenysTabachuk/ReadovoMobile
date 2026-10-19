// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const { readdirSync } = require('node:fs');
const path = require('node:path');

const featureNames = readdirSync(path.join(__dirname, 'features'), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Resolve actual files so relative imports cannot bypass the feature boundaries.
const featureZones = featureNames.map((feature) => ({
  target: `./features/${feature}`,
  from: featureNames
    .filter((other) => other !== feature)
    .map((other) => `./features/${other}`),
  except: ['./index.ts', './index.tsx'],
  message: 'Import another feature through its root index.ts.',
}));

const apiZones = featureNames.flatMap((feature) => [
  {
    target: `./features/${feature}/api`,
    from: `./features/${feature}/screens`,
    message: 'API modules must not depend on screen internals.',
  },
  {
    target: ['requests', 'queries', 'mutations', 'utils'].map(
      (group) => `./features/${feature}/api/${group}`,
    ),
    from: `./features/${feature}/api/index.ts`,
    message: 'Import an API sibling or group barrel directly to avoid cycles.',
  },
]);

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', 'android/**', 'ios/**'],
  },
  {
    files: ['*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', __filename: 'readonly' },
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    settings: {
      'import/resolver': {
        typescript: { project: path.join(__dirname, 'tsconfig.json') },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          basePath: __dirname,
          zones: [
            {
              target: [
                './api',
                './components',
                './constants',
                './devtools',
                './hooks',
                './providers',
                './utils',
                './localization',
              ],
              from: './features',
              message: 'Shared modules must not depend on features.',
            },
            ...featureZones,
            ...apiZones,
          ],
        },
      ],
    },
  },
  {
    // Enforce signature conventions in the migrated data layer without forcing
    // unrelated legacy screens and utilities to migrate in the same change.
    files: ['features/**/api/{requests,queries,mutations}/**/*.{ts,tsx}'],
    rules: {
      'max-params': ['error', { max: 3 }],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ":matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression) > :matches(Identifier, ObjectPattern)[typeAnnotation.typeAnnotation.type='TSTypeLiteral']",
          message: 'Declare the parameter object as a named type or interface.',
        },
        {
          selector:
            ":matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression) > AssignmentPattern > :matches(Identifier, ObjectPattern)[typeAnnotation.typeAnnotation.type='TSTypeLiteral']",
          message: 'Declare the parameter object as a named type or interface.',
        },
      ],
    },
  },
  {
    files: ['features/**/api/requests/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                '@tanstack/react-query',
                '@tanstack/react-query/*',
              ],
              message:
                'Keep HTTP requests independent of React and React Query.',
            },
          ],
        },
      ],
    },
  },
]);
