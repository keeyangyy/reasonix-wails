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
test("single PR entry gates metadata checks and dynamically selected lanes", () => {
  assert.match(ciWorkflow, /pull_request:\s*\n\s+branches: \[main\]\s*\n\s+types: \[opened, synchronize, reopened, ready_for_review\]/);
  assert.doesNotMatch(ciWorkflow, /types:.*edited/);
  assert.match(ciWorkflow, /needs: \[changes, docs-rules, docs-impact, cache-impact, lint, go, desktop, codeql, memory\]/);
  assert.match(ciWorkflow, /pull-requests: read/);
  assert.match(job(ciWorkflow, "metadata-gate"), /github\.event_name == 'pull_request'/);
  assert.match(ciWorkflow, /EVENT_NAME: \$\{\{ github\.event_name \}\}/);
  assert.match(ciWorkflow, /github\.event_name != 'pull_request' \|\| needs\.changes\.outputs\.full == 'true'/);

  for (const [name, scriptPath, fileName] of [
    ["docs-impact", "scripts/check-docs-impact.sh", "docs-impact-files.txt"],
    ["cache-impact", "scripts/check-cache-impact.sh", "cache-impact-files.txt"],
  ]) {
    const body = job(ciWorkflow, name);
    assert.match(body, /github\.event_name == 'pull_request'/);
    assert.match(body, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
    assert.match(body, new RegExp(fileName.replaceAll(".", "\\.")));
    assert.ok(body.includes(scriptPath));
    assert.ok(body.includes("pulls/${PR_NUMBER}/files"));
  }

  const gateBody = job(ciWorkflow, "gate");
  assert.ok(gateBody.includes("docs-impact"));
  assert.ok(gateBody.includes("cache-impact"));
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
      "docs-impact": { result: event === "pull_request" ? "success" : "skipped" },
      "cache-impact": { result: event === "pull_request" ? "success" : "skipped" },
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
    assert.notEqual(run(wrong), 0, name + "=" + value + " must fail Gate");
  }

  // PR metadata is mandatory in the main Gate.
  for (const name of ["docs-impact", "cache-impact"]) {
    const wrong = makeNeeds();
    wrong[name].result = "failure";
    assert.notEqual(run(wrong), 0, name + " failure must fail Gate");
    wrong[name].result = "skipped";
    assert.notEqual(run(wrong), 0, name + " skipped must fail Gate on a PR");
  }

  // Main push has no PR metadata, but memory is mandatory even for its full CI.
  for (const name of ["docs-impact", "cache-impact"]) {
    const wrong = makeNeeds({ event: "push", flags: { full: "true" } });
    wrong[name].result = "success";
    assert.notEqual(run(wrong, "push"), 0, name + " unexpectedly ran on push");
  }
  const pushMissingMemory = makeNeeds({ event: "push", flags: { full: "true" }, results: { memory: "skipped" } });
  assert.notEqual(run(pushMissingMemory, "push"), 0, "main push cannot skip memory");

  for (const name of ["changes", "docs-rules"]) {
    const wrong = makeNeeds();
    wrong[name].result = "failure";
    assert.notEqual(run(wrong), 0, name + " failure must fail Gate");
  }
});

test("PR body edits revalidate metadata without rerunning code CI", () => {
  const metadata = workflow("pr-metadata");
  assert.match(metadata, /pull_request_target:[\s\S]*types: \[edited\]/);
  for (const name of ["edited-docs-impact", "edited-cache-impact"]) {
    const body = job(metadata, name);
    assert.match(body, /github\.event\.action == 'edited'/);
    assert.ok(body.includes(name === "edited-docs-impact" ? "scripts/check-docs-impact.sh" : "scripts/check-cache-impact.sh"));
  }
  const gateBody = job(metadata, "metadata-gate");
  assert.match(gateBody, /needs: \[edited-docs-impact, edited-cache-impact\]/);
  assert.match(gateBody, /always\(\) && github\.event\.action == 'edited'/);
  const script = shellStep(gateBody, "Verify edited PR metadata checks");

  const run = (docs, cache) => spawnSync("bash", ["-e", "-c", script], {
    env: { ...process.env, RESULTS: JSON.stringify({
      "edited-docs-impact": { result: docs },
      "edited-cache-impact": { result: cache },
    }) },
  }).status;
  assert.equal(run("success", "success"), 0);
  for (const [docs, cache] of [["failure", "success"], ["success", "failure"], ["skipped", "success"], ["success", "cancelled"]]) {
    assert.notEqual(run(docs, cache), 0, "metadata-gate must reject " + docs + "/" + cache);
  }
});

test("Release reuses main-push CI and publishes only a complete draft release", () => {
  const release = workflow("release");
  const windows = workflow("build-release-windows");
  assert.ok(!release.includes("check-memory.yml"), "Release must not run memory a second time");
  assert.match(release, /select\(\.name == "CI" and \.event == "push" and \.head_branch == "main"\)/);
  assert.match(windows, /Verify official main-push CI/);
  assert.match(windows, /select\(\.name == "CI" and \.event == "push" and \.head_branch == "main"\)/);

  const publish = windows.indexOf('gh release edit "$RELEASE_TAG" --draft=false');
  const binaries = windows.indexOf('gh release upload "$RELEASE_TAG" "dist/${exe_asset}"');
  const signature = windows.indexOf('dist/Reasonix-windows-amd64.exe.minisig');
  const immutableManifest = windows.indexOf('gh release upload "$RELEASE_TAG" manifest-input/latest.json');
  const catalog = windows.indexOf('mv catalog/versions.json.new catalog/versions.json');
  const anchorAssets = windows.indexOf('gh release upload wails-latest catalog/versions.json manifest-input/latest.json');
  assert.ok(binaries >= 0 && signature > binaries && immutableManifest > signature);
  assert.ok(catalog > immutableManifest);
  assert.ok(publish > catalog, "the version release must remain a draft until the catalog is prepared");
  assert.ok(anchorAssets > publish, "the update anchor is changed only after the version release is public");
});
