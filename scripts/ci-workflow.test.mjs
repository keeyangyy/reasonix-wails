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
  const success = { CHANGES_RESULT: "success", SHOULD_RUN: "true", PREPARE_RESULT: "success", GO_RESULT: "success", FRONTEND_RESULT: "success", BROWSER_RESULT: "success" };
  const run = env => spawnSync("bash", ["-e", "-c", script], { env: { ...process.env, ...env } }).status;
  assert.equal(run(success), 0);
  for (const key of ["PREPARE_RESULT", "GO_RESULT", "FRONTEND_RESULT", "BROWSER_RESULT", "CHANGES_RESULT"]) {
    for (const value of ["failure", "cancelled", "skipped", ""]) assert.notEqual(run({ ...success, [key]: value }), 0, `${key}=${value}`);
  }
  assert.equal(run({ ...success, SHOULD_RUN: "false", PREPARE_RESULT: "skipped", GO_RESULT: "skipped", FRONTEND_RESULT: "skipped", BROWSER_RESULT: "skipped" }), 0);
  assert.notEqual(run({ ...success, SHOULD_RUN: "false" }), 0);
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
