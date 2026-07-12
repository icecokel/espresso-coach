import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const runner = resolve(root, "scripts/run-e2e.sh");
const prePushHook = resolve(root, ".githooks/pre-push");
const installHooks = resolve(root, "scripts/install-git-hooks.sh");

assert.equal(
  packageJson.scripts["pretest:e2e"],
  "playwright install chromium",
  "E2E must install Chromium before the test lifecycle starts",
);
assert.equal(
  packageJson.scripts["test:e2e"],
  "sh scripts/run-e2e.sh",
  "E2E must use the runner with failure-aware artifact cleanup",
);
assert.equal(
  packageJson.scripts["setup:hooks"],
  "sh scripts/install-git-hooks.sh",
  "the repository must provide a reproducible Git hook setup command",
);

await access(prePushHook);
await access(installHooks);

const [prePushContents, installHooksContents] = await Promise.all([
  readFile(prePushHook, "utf8"),
  readFile(installHooks, "utf8"),
]);
assert.match(prePushContents, /npm run test:e2e/);
assert.match(prePushContents, /SKIP_PREPUSH_E2E/);
assert.match(installHooksContents, /config core\.hooksPath \.githooks/);

async function runRunner(testStatus) {
  const binDir = await mkdtemp(join(tmpdir(), "espresso-coach-e2e-bin-"));
  const commandLog = join(binDir, "commands.log");
  const npxPath = join(binDir, "npx");
  await writeFile(
    npxPath,
    `#!/bin/sh
printf '%s\\n' "$*" >> "$E2E_FAKE_LOG"
case "$1" in
  expo)
    mkdir -p dist
    exit 0
    ;;
  playwright)
    mkdir -p output/playwright
    printf 'trace' > output/playwright/trace.txt
    exit "$E2E_FAKE_TEST_STATUS"
    ;;
  *)
    exit 64
    ;;
esac
`,
  );
  await chmod(npxPath, 0o755);

  try {
    const result = spawnSync("sh", [runner], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        E2E_FAKE_LOG: commandLog,
        E2E_FAKE_TEST_STATUS: String(testStatus),
      },
    });
    const commands = await readFile(commandLog, "utf8");
    return { result, commands };
  } finally {
    await rm(binDir, { force: true, recursive: true });
  }
}

async function cleanGeneratedArtifacts() {
  await rm(resolve(root, "dist"), { force: true, recursive: true });
  await rm(resolve(root, "output/playwright"), { force: true, recursive: true });
}

await cleanGeneratedArtifacts();
try {
  const success = await runRunner(0);
  assert.equal(success.result.status, 0);
  assert.match(success.commands, /^expo export --platform web --output-dir dist$/m);
  assert.match(success.commands, /^playwright test$/m);
  await assert.rejects(readFile(resolve(root, "dist"), "utf8"));
  await assert.rejects(readFile(resolve(root, "output/playwright"), "utf8"));

  const failure = await runRunner(23);
  assert.equal(failure.result.status, 23, "test failure exit code must be preserved");
  assert.equal(await readFile(resolve(root, "output/playwright/trace.txt"), "utf8"), "trace");
  await assert.rejects(readFile(resolve(root, "dist"), "utf8"));
} finally {
  await cleanGeneratedArtifacts();
}
