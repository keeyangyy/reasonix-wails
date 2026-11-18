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
const desktopWorkflow = workflow("check-desktop");

test("required desktop aggregate rejects every failed, cancelled or unexpectedly skipped child", () => {
  const script = shellStep(job(desktopWorkflow, "desktop"), "Verify desktop validation jobs");
  const base = { CHANGES_RESULT: "success", SHOULD_RUN: "true", WINDOWS_RUN: "true", PREPARE_RESULT: "success", GO_RESULT: "success", FRONTEND_RESULT: "success", BROWSER_RESULT: "success", WINDOWS_RESULT: "success", WINDOWS_GO_RESULT: "success" };
  const run = env => spawnSync("bash", ["-e", "-c", script], { env: { ...process.env, ...env } }).status;
  // Exhaustive run: every lane must succeed.
  assert.equal(run(base), 0);
  // Root-module PR: the Windows lanes are not scheduled, and a skipped check
  // still counts as passing for the PR total, so the aggregate accepts it.
  assert.equal(run({ ...base, WINDOWS_RUN: "false", WINDOWS_RESULT: "skipped", WINDOWS_GO_RESULT: "skipped" }), 0);
  // Docs/workflow-only diff: nothing is scheduled at all.
  assert.equal(run({ ...base, SHOULD_RUN: "false", WINDOWS_RUN: "false", PREPARE_RESULT: "skipped", GO_RESULT: "skipped", FRONTEND_RESULT: "skipped", BROWSER_RESULT: "skipped", WINDOWS_RESULT: "skipped", WINDOWS_GO_RESULT: "skipped" }), 0);
  // A scheduled lane that did not run (or failed) fails the aggregate.
  for (const key of ["PREPARE_RESULT", "GO_RESULT", "FRONTEND_RESULT", "BROWSER_RESULT", "WINDOWS_RESULT", "WINDOWS_GO_RESULT", "CHANGES_RESULT"]) {
    for (const value of ["failure", "cancelled", "skipped", ""]) {
      assert.notEqual(run({ ...base, [key]: value }), 0, `${key}=${value}`);
    }
  }
});

test("all Linux consumers use the prepared build and reject a failed preparation", () => {
  const context = {
    github: { event_name: "pull_request" },
    inputs: { desktop: "true" },
    needs: { "desktop-prepare": { result: "success" } },
  };
  const aggregate = job(desktopWorkflow, "desktop");
  for (const name of ["desktop-go", "desktop-frontend", "desktop-browser"]) {
    const body = job(desktopWorkflow, name);
    assert.ok(aggregate.includes(name));
    assert.ok(body.includes("needs: [desktop-prepare]"));
    assert.ok(body.includes("name: ${{ needs.desktop-prepare.outputs.artifact_name }}"));
    assert.ok(!body.includes("pnpm --dir frontend build"));
    assert.equal(condition(body, context), true);
    assert.equal(condition(body, { ...context, needs: { "desktop-prepare": { result: "failure" } } }), false);
  }
});

const ciWorkflow = workflow("ci");
test("single PR entry selects only required lanes and rejects every incorrect outcome", () => {
  assert.match(ciWorkflow, /pull_request:\s*\n\s+branches: \[main\]/);
  assert.match(ciWorkflow, /needs: \[changes, docs-rules, lint, go, desktop, codeql, memory\]/);
  const script = shellStep(job(ciWorkflow, "gate"), "Verify every selected lane passed");
  function base(flags = {}, release = false) {
    const outputs = {
      code: "false", desktop: "false", desktop_direct: "false",
      sdk: "false", workflow: "false", full: "false", ...flags,
    };
    const active = {
      lint: ["code", "desktop", "workflow"].some(k => outputs[k] === "true"),
      go: ["code", "sdk"].some(k => outputs[k] === "true"),
      desktop: outputs.desktop === "true",
      codeql: ["code", "desktop", "workflow"].some(k => outputs[k] === "true"),
      memory: release,
    };
    return {
      changes: { result: "success", outputs },
      "docs-rules": { result: "success" },
      ...Object.fromEntries(Object.entries(active).map(([name, needed]) => [name, { result: needed ? "success" : "skipped" }])),
    };
  }
  const run = (needs, release = false) => spawnSync("bash", ["-e", "-c", script], {
    env: { ...process.env, RESULTS: JSON.stringify(needs), IS_RELEASE_PR: String(release) },
  }).status;
  const cases = [
    [base(), false],
    [base({ workflow: "true" }), false],
    [base({ code: "true", desktop: "true" }), false],
    [base({ sdk: "true" }), false],
    [base({ code: "true", desktop: "true", sdk: "true", workflow: "true", full: "true" }, true), true],
  ];
  for (const [needs, release] of cases) {
    assert.equal(run(needs, release), 0, JSON.stringify(needs));
    for (const name of ["lint", "go", "desktop", "codeql", "memory"]) {
      const wrong = structuredClone(needs);
      wrong[name].result = wrong[name].result === "success" ? "skipped" : "success";
      assert.notEqual(run(wrong, release), 0, "incorrect lane " + name + " was allowed");
    }
    for (const name of ["changes", "docs-rules"]) {
      const wrong = structuredClone(needs);
      wrong[name].result = "failure";
      assert.notEqual(run(wrong, release), 0, name + " failure was allowed");
    }
  }
});
