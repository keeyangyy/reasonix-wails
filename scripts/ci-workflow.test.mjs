import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import test from "node:test";

const workflow = name => readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8");
function job(source, name) {
  const body = source.match(new RegExp(`\\n  ${name}:\\n([\\s\\S]*?)(?=\\n  [a-z][a-z0-9-]*:|$)`))?.[1];
  assert.ok(body, name);
  return body;
}
function condition(body, context) {
  const expression = body.match(/^    if: (.+)$/m)[1].replace(/^\$\{\{\s*|\s*\}\}$/g, "")
    .replace(/needs\.([a-z][a-z0-9-]*)/g, 'needs["$1"]');
  return vm.runInNewContext(expression, { always: () => true, cancelled: () => false, ...context });
}
function shellStep(body, name) {
  return body.split(`      - name: ${name}\n`)[1].match(/        run: \|\n((?:          .*\n|\n)+)/)[1]
    .replace(/^          /gm, "");
}
const ci = workflow("ci");

test("required desktop aggregate rejects every failed, cancelled or unexpectedly skipped child", () => {
  const script = shellStep(job(ci, "desktop"), "Verify desktop validation jobs");
  const base = { CHANGES_RESULT: "success", SHOULD_RUN: "true", WINDOWS_RUN: "true", PREPARE_RESULT: "success", GO_RESULT: "success", FRONTEND_RESULT: "success", BROWSER_RESULT: "success", WINDOWS_RESULT: "success", WINDOWS_GO_RESULT: "success" };
  const run = env => spawnSync("bash", ["-e", "-c", script], { env: { ...process.env, ...env } }).status;
  // Exhaustive run (push to main, release/*): every lane must succeed.
  assert.equal(run(base), 0);
  // Ordinary root-module PR: the Linux lanes run, the Windows lanes are not
  // scheduled and are allowed to report skipped.
  assert.equal(run({ ...base, WINDOWS_RUN: "false", WINDOWS_RESULT: "skipped", WINDOWS_GO_RESULT: "skipped" }), 0);
  // Docs-only: nothing runs.
  assert.equal(run({ ...base, SHOULD_RUN: "false", WINDOWS_RUN: "false", PREPARE_RESULT: "skipped", GO_RESULT: "skipped", FRONTEND_RESULT: "skipped", BROWSER_RESULT: "skipped", WINDOWS_RESULT: "skipped", WINDOWS_GO_RESULT: "skipped" }), 0);
  // A lane that should have run but did not (or failed) fails the aggregate.
  for (const key of ["PREPARE_RESULT", "GO_RESULT", "FRONTEND_RESULT", "BROWSER_RESULT", "WINDOWS_RESULT", "WINDOWS_GO_RESULT", "CHANGES_RESULT"]) {
    for (const value of ["failure", "cancelled", "skipped", ""]) assert.notEqual(run({ ...base, [key]: value }), 0, `${key}=${value}`);
  }
  // A lane that was not scheduled must not report success either.
  assert.notEqual(run({ ...base, WINDOWS_RUN: "false" }), 0);
});



test("all Linux consumers use the prepared build and reject a failed preparation", () => {
  const context = { github: { event_name: "pull_request" },
    needs: { changes: { outputs: { desktop: "true" } }, "desktop-prepare": { result: "success" } } };
  const aggregate = job(ci, "desktop");
  for (const name of ["desktop-go", "desktop-frontend", "desktop-browser"]) {
    const body = job(ci, name);
    assert.ok(aggregate.includes(name));
    assert.ok(body.includes("needs: [changes, desktop-prepare]"));
    assert.ok(body.includes("name: ${{ needs.desktop-prepare.outputs.artifact_name }}"));
    assert.ok(!body.includes("pnpm --dir frontend build"));
    assert.equal(condition(body, context), true);
    assert.equal(condition(body, { ...context, needs: { ...context.needs, "desktop-prepare": { result: "failure" } } }), false);
  }
});
