// Husky runs `npm run check:staged` before every commit. That command starts
// lint-staged, which uses this file to choose checks based on the files staged
// with `git add`. lint-staged automatically adds formatter/linter fixes back to
// the commit and temporarily protects unstaged changes in partially staged
// files. The Husky hook runs the full TypeScript check before starting
// lint-staged because type errors can cross file boundaries.
export default {
  // Backend tools come from backend/node_modules. TypeScript strict mode has
  // already been checked by the preceding command in .husky/pre-commit.
  // Jest's --findRelatedTests option runs only tests affected by these files.
  "backend/{src,test}/**/*.ts": [
    // The trailing `--` tells npm that lint-staged's file paths are arguments
    // for the underlying script, rather than arguments for npm itself.
    "npm --prefix backend run format:staged --",
    "npm --prefix backend run lint:staged --",
    "npm --prefix backend run test:staged --",
  ],

  // The frontend is also in strict mode. These tasks handle formatting,
  // ESLint, and related tests after the full TypeScript check has passed.
  "frontend/**/*.{js,jsx,ts,tsx}": [
    "npm --prefix frontend run format:staged --",
    "npm --prefix frontend run lint:staged --",
    "npm --prefix frontend run test:staged --",
  ],

  // JSON files can be formatted, but ESLint and Jest do not need to process them.
  "frontend/**/*.json": ["npm --prefix frontend run format:staged --"],
};
