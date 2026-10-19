const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "..");

// A .git file also identifies a linked worktree; archives have no Git config to set.
if (
  process.platform === "win32" &&
  existsSync(path.join(repositoryRoot, ".git"))
) {
  const result = spawnSync(
    "git",
    ["config", "--local", "core.longpaths", "true"],
    { cwd: repositoryRoot, stdio: "inherit" },
  );

  if (result.error || result.status !== 0) {
    console.error(
      "Failed to enable Git long-path support for this checkout.",
      result.error?.message ?? `Git exited with code ${result.status}.`,
    );
    process.exit(1);
  }
}
