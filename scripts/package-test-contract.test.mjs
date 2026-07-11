import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(packageJson.scripts["test:unit"], "vitest run");
assert.equal(
  packageJson.scripts.test,
  "npm run test:unit && npm run test:e2e:runner",
  "npm test must run the E2E runner contract check after unit tests",
);
