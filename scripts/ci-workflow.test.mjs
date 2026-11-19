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
test("CI has one Gate for dynamically selected test lanes only", () => {
  assert.match(ciWorkflow, /pull_request:\s*\n\s+branches: \[main\]\s*\n\s+types: \[opened, synchronize, reopened, ready_for_review\]/);
  assert.doesNotMatch(ciWorkflow, /types:.*edited/);
  assert.match(ciWorkflow, /needs: \[changes, docs-rules, lint, go, desktop, codeql, memory\]/);
  assert.doesNotMatch(ciWorkflow, /docs-impact|cache-impact|metadata-gate/);
  assert.match(ciWorkflow, /github\.event_name != 'pull_request' \|\| needs\.changes\.outputs\.full == 'true'/);

  const gateBody = job(ciWorkflow, "gate");
  const script = shellStep(gateBody, "Verify every selected check passed");

  function makeNeeds({ event = "pull_request", flags = {}, results = {} } = {}) {
    const outputs = {
      code: "false", desktop: "false", desktop_direct: "false",
      sdk: "false", workflow: "false", full: "false", ...flags,
    };
    const selected = {
      lint: ["code", "desktop", "workflow"].some(k => outputs[k] === "true"),
      go: ["code", "sdk"].some(k => outputs[k] === "true"),
      desktop: outputs.desktop === "true",
      codeql: ["code", "desktop", "workflow"].some(k => outputs[k] === "true"),
      memory: event !== "pull_request" || outputs.full === "true",
    };
    const needs = {
      changes: { result: "success", outputs },
      "docs-rules": { result: "success" },
    };
    for (const [name, needed] of Object.entries(selected)) {
      needs[name] = { result: needed ? "success" : "skipped" };
    }
    for (const [name, result] of Object.entries(results)) {
      needs[name] = { ...needs[name], result };
    }
    return needs;
  }

  const run = (needs, event = "pull_request") => spawnSync("bash", ["-e", "-c", script], {
    env: { ...process.env, RESULTS: JSON.stringify(needs), EVENT_NAME: event },
  }).status;

  const cases = [
    [makeNeeds(), "pull_request"],
    [makeNeeds({ flags: { workflow: "true" } }), "pull_request"],
    [makeNeeds({ flags: { code: "true", desktop: "true" } }), "pull_request"],
    [makeNeeds({ flags: { sdk: "true" } }), "pull_request"],
    [makeNeeds({ flags: { code: "true", desktop: "true", sdk: "true", workflow: "true", full: "true" } }), "pull_request"],
    [makeNeeds({ event: "push", flags: { code: "true", desktop: "true", sdk: "true", workflow: "true", full: "true" } }), "push"],
    [makeNeeds({ event: "workflow_dispatch", flags: { code: "true", desktop: "true", sdk: "true", workflow: "true", full: "true" } }), "workflow_dispatch"],
  ];
  for (const [needs, event] of cases) {
    assert.equal(run(needs, event), 0, event + ": " + JSON.stringify(needs));
  }

  // Every selected check must succeed; every unselected lane must be skipped.
  const workflowOnly = makeNeeds({ flags: { workflow: "true" } });
  for (const [name, value] of [["lint", "skipped"], ["codeql", "failure"], ["go", "success"], ["desktop", "success"], ["memory", "success"]]) {
    const wrong = structuredClone(workflowOnly);
    wrong[name].result = value;
    assert.notEqual(run(wrong, "pull_request"), 0, name + "=" + value + " must fail Gate");
  }

  // Main push always includes memory; it cannot silently skip.
  const pushMissingMemory = makeNeeds({ event: "push", flags: { full: "true" }, results: { memory: "skipped" } });
  assert.notEqual(run(pushMissingMemory, "push"), 0, "main push cannot skip memory");

  for (const name of ["changes", "docs-rules"]) {
    const wrong = makeNeeds();
    wrong[name].result = "failure";
    assert.notEqual(run(wrong, "pull_request"), 0, name + " failure must fail Gate");
  }
});

test("PR metadata is one required job for all relevant PR events", () => {
  const metadata = workflow("pr-metadata");
  assert.match(metadata, /pull_request_target:[\s\S]*types: \[opened, synchronize, reopened, ready_for_review, edited\]/);
  assert.match(metadata, /group: pr-metadata-\$\{\{ github\.event\.pull_request\.number \}\}/);
  assert.match(metadata, /cancel-in-progress: true/);
  assert.match(metadata, /pull-requests: read/);
  assert.doesNotMatch(metadata, /metadata-gate|edited-docs-impact|edited-cache-impact/);

  const body = job(metadata, "pr-metadata");
  assert.doesNotMatch(body, /^\s{4}if:/m);
  assert.match(body, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(body, /persist-credentials: false/);
  for (const script of ["check-docs-impact.sh", "check-cache-impact.sh", "check-blast-radius.sh"]) {
    assert.ok(body.includes("scripts/" + script), script + " must run in the same metadata job");
  }
  assert.ok(body.includes("changed-files.txt"));
  assert.ok(body.includes("pulls/$" + "{PR_NUMBER}/files"));
  assert.match(body, /--jq '\.\[\] \| \.filename, \(\.previous_filename \/\/ empty\)'/);
});

test("Blast Radius validator enforces one recognized level and a meaningful reason", () => {
  const script = new URL("../scripts/check-blast-radius.sh", import.meta.url).pathname;
  const run = body => spawnSync("bash", [script], {
    env: { ...process.env, PR_BODY: body },
  }).status;
  assert.equal(run("Blast-radius: local - only a local settings label changes"), 0);
  assert.equal(run("Blast-radius: cross-component - shared Agent contract affects CLI and desktop"), 0);
  assert.equal(run("Blast-radius: broad - migration can affect all persisted user memory"), 0);
  for (const body of [
    "",
    "Blast-radius: TODO",
    "Blast-radius: urgent - unknown scope",
    "Blast-radius: local",
    "Blast-radius: local - TODO",
    "Blast-radius: local - reason\nBlast-radius: broad - another reason",
  ]) {
    assert.notEqual(run(body), 0, "invalid declaration unexpectedly passed: " + body);
  }
});

test("Release reuses main-push CI and publishes only a complete draft release", () => {
  const release = workflow("release");
  const windows = workflow("build-release-windows");
  assert.ok(!release.includes("check-memory.yml"), "Release must not run memory a second time");
  assert.match(release, /select\(\.name == "CI" and \.event == "push" and \.head_branch == "main"\)/);
  assert.match(windows, /Verify official main-push CI/);
  assert.match(windows, /select\(\.name == "CI" and \.event == "push" and \.head_branch == "main"\)/);

  // A public version release is immutable on rerun. Recovery updates only the
  // mutable anchor from the already-published per-version manifest.
  assert.match(windows, /anchor_only:/);
  assert.match(windows, /build:\s*\n\s+if: \$\{\{ inputs\.anchor_only != true \}\}/);
  assert.match(windows, /release:\s*\n\s+needs: \[verify, build\]\s*\n\s+if: \$\{\{ always\(\)[^\n]*inputs\.anchor_only == true/);
  assert.match(windows, /already public\. Refusing to replace published assets/);
  assert.match(windows, /rerun this workflow with anchor_only=true/);
  assert.match(windows, /Restore manifest from published release for anchor-only recovery/);
  assert.match(windows, /gh release download "\$RELEASE_TAG" -p latest\.json -D manifest-input/);
  assert.match(windows, /gh release edit wails-latest --draft=false --latest=false/);

  const publish = windows.indexOf('gh release edit "$RELEASE_TAG" --draft=false');
  const binaries = windows.indexOf('gh release upload "$RELEASE_TAG" "dist/$' + '{exe_asset}"');
  const signature = windows.indexOf('dist/Reasonix-windows-amd64.exe.minisig');
  const immutableManifest = windows.indexOf('gh release upload "$RELEASE_TAG" manifest-input/latest.json');
  const catalog = windows.indexOf('mv catalog/versions.json.new catalog/versions.json');
  const anchorAssets = windows.indexOf('gh release upload wails-latest catalog/versions.json manifest-input/latest.json');
  assert.ok(binaries >= 0 && signature > binaries && immutableManifest > signature);
  assert.ok(catalog > immutableManifest);
  assert.ok(publish > catalog, "the version release must remain a draft until the catalog is prepared");
  assert.ok(anchorAssets > publish, "the update anchor is changed only after the version release is public");
});
