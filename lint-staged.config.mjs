// Husky runs `npm run check:staged` before every commit. That command starts
// lint-staged, which uses this file to choose checks based on the files staged
// with `git add`. lint-staged automatically adds formatter/linter fixes back to
// the commit and temporarily protects unstaged changes in partially staged files.
export default {
  // Backend TypeScript uses the tools installed in backend/node_modules.
  // Jest's --findRelatedTests option runs only tests affected by these files.
  "backend/{src,test}/**/*.ts": [
    // The trailing `--` tells npm that lint-staged's file paths are arguments
    // for the underlying script, rather than arguments for npm itself.
    "npm --prefix backend run format:staged --",
    "npm --prefix backend run lint:staged --",
    "npm --prefix backend run test:staged --",
  ],

  // Frontend JavaScript and TypeScript use the frontend tool configuration.
  "frontend/**/*.{js,jsx,ts,tsx}": [
    "npm --prefix frontend run format:staged --",
    "npm --prefix frontend run lint:staged --",
    "npm --prefix frontend run test:staged --",
  ],

  // JSON files can be formatted, but ESLint and Jest do not need to process them.
  "frontend/**/*.json": ["npm --prefix frontend run format:staged --"],
};
