// Husky runs `npm run check:staged` before every commit. The --hide-all option
// temporarily hides unstaged and untracked files, so these checks see only the
// files selected with `git add`.
export default {
  // Backend source files use the default Jest configuration rooted at src.
  "backend/src/**/*.ts": [
    // The trailing `--` tells npm to pass lint-staged's file paths to the
    // underlying tool instead of treating them as npm arguments.
    "npm --prefix backend run format:staged --",
    "npm --prefix backend run lint:staged --",
    "npm --prefix backend run test:staged --",
  ],

  // Tests outside src require the dedicated e2e Jest configuration. The
  // function prevents lint-staged from appending paths to the command, so the
  // complete small e2e suite runs when any e2e test file changes.
  "backend/test/**/*.ts": [
    "npm --prefix backend run format:staged --",
    "npm --prefix backend run lint:staged --",
    () => "npm --prefix backend run test:e2e -- --runInBand",
  ],

  "frontend/**/*.{js,jsx,ts,tsx}": [
    "npm --prefix frontend run format:staged --",
    "npm --prefix frontend run lint:staged --",
    "npm --prefix frontend run test:staged --",
  ],

  // JSON files need formatting, but ESLint and Jest do not process them.
  "frontend/**/*.json": ["npm --prefix frontend run format:staged --"],

  // Run the full TypeScript check against the staged project snapshot.
  // The function stops lint-staged from adding file paths to this command.
  "*": () => "npm run typecheck",
};
