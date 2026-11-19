import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const classifier = resolve(import.meta.dirname, "ci-classify-changes.sh");
function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}
function fixture(t) {
  const dir = mkdtempSync(resolve(tmpdir(), "reasonix-ci-classify-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.test");
  git(dir, "config", "user.name", "CI Fixture");
  writeFileSync(resolve(dir, "README.md"), "base\n");
  git(dir, "add", ".");
  git(dir, "commit", "-qm", "base");
  const base = git(dir, "rev-parse", "HEAD");
  function file(name, value = "changed\n") {
    const path = resolve(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, value);
  }
  function classify({ event = "pull_request", ref = "docs/example", files = [] } = {}) {
    for (const [name, value] of files) file(name, value);
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "change", "--allow-empty");
    const head = git(dir, "rev-parse", "HEAD");
    return run(base, head, { event, ref });
  }
  function run(baseSha, headSha, { event = "pull_request", ref = "docs/example" } = {}) {
    const out = execFileSync("bash", [classifier], {
      cwd: dir, encoding: "utf8",
      env: { ...process.env, CI_EVENT_NAME: event, CI_HEAD_REF: ref, CI_BASE_SHA: baseSha, CI_HEAD_SHA: headSha },
    });
    return Object.fromEntries(out.trim().split("\n").map(x => x.split("=")));
  }
  return { dir, base, file, classify, run };
}
const expected = (overrides = {}) => ({
  code: "false", desktop: "false", desktop_direct: "false", sdk: "false",
  workflow: "false", full: "false", ...overrides,
});

test("Chinese, whitespace and quotes in Markdown paths stay documentation", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["docs/analysis/技术风险与回归点.md", "ok"],
    ["docs/design/has space.md", "ok"],
    ['docs/design/quote"here.md', "ok"],
    ["docs/design/with\nnewline.md", "ok"],
  ] }), expected());
});
test("PR metadata validators schedule workflow checks without source builds", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["scripts/check-docs-impact.sh", "#!/usr/bin/env bash"],
    ["scripts/check-cache-impact.sh", "#!/usr/bin/env bash"],
    ["scripts/check-blast-radius.sh", "#!/usr/bin/env bash"],
  ] }), expected({ workflow: "true" }));
});
test("workflow YAML plus Chinese docs schedules only workflow checks", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["docs/analysis/工程协作经验.md", "ok"],
    [".github/workflows/ci.yml", "name: CI"],
  ] }), expected({ workflow: "true" }));
});
test("source code inside docs/ and benchmarks/ is not mistaken for text", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["docs/embed.go", "package docs"],
    ["benchmarks/compaction/main.go", "package main"],
  ] }), expected({ code: "true", desktop: "true" }));
});
test("benchmark source alone does not trigger the desktop module", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["benchmarks/compaction/main.go", "package main"]] }), expected({ code: "true" }));
});
test("renaming a source file into docs keeps original source in classification", t => {
  const f = fixture(t);
  f.file("internal/original.go", "package original");
  git(f.dir, "add", "-A");
  git(f.dir, "commit", "-qm", "source");
  const base = git(f.dir, "rev-parse", "HEAD");
  mkdirSync(resolve(f.dir, "docs/archive"), { recursive: true });
  renameSync(resolve(f.dir, "internal/original.go"), resolve(f.dir, "docs/archive/original.md"));
  git(f.dir, "add", "-A");
  git(f.dir, "commit", "-qm", "rename");
  assert.deepEqual(f.run(base, git(f.dir, "rev-parse", "HEAD")), expected({ code: "true", desktop: "true" }));
});
test("root source enables Go and downstream desktop compilation", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["internal/control/foo.go", "package foo"]] }), expected({ code: "true", desktop: "true" }));
});
test("desktop source enables the native desktop matrix", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["desktop/frontend/src/index.ts", "export {}"]] }), expected({ desktop: "true", desktop_direct: "true" }));
});
test("sdk-only change needs SDK checks", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["sdk/go/example.go", "package example"]] }), expected({ sdk: "true" }));
});
test("an unrecognized source path conservatively runs code checks", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["configs/runner.toml", "x=1"]] }), expected({ code: "true", desktop: "true" }));
});
test("release PRs and non-PR runs always select all lanes", t => {
  const f = fixture(t);
  const all = { code: "true", desktop: "true", desktop_direct: "true", sdk: "true", workflow: "true", full: "true" };
  assert.deepEqual(f.classify({ ref: "release/v2.0.0", files: [["release-notes/releases.json", "{}"]] }), all);
  // GitHub startsWith() is case-insensitive, but the Bash classifier intentionally is not.
  assert.deepEqual(f.classify({ ref: "Release/v2.0.0", files: [["release-notes/releases.json", "{}"]] }), expected());
  assert.deepEqual(f.classify({ event: "push", files: [["README.md", "new"]] }), all);
});
test("three-dot diff uses PR merge-base rather than changes merged into main later", t => {
  const f = fixture(t);
  git(f.dir, "checkout", "-qb", "feature");
  f.file("docs/guide/中国.md", "guide");
  git(f.dir, "add", "-A");
  git(f.dir, "commit", "-qm", "feature");
  const head = git(f.dir, "rev-parse", "HEAD");
  git(f.dir, "checkout", "-q", git(f.dir, "branch", "--list").split("\n").map(x => x.replace(/^\*?\s*/, "")).find(x => x !== "feature"));
  f.file("internal/control/new.go", "package control");
  git(f.dir, "add", "-A");
  git(f.dir, "commit", "-qm", "concurrent code merge");
  assert.deepEqual(f.run(git(f.dir, "rev-parse", "HEAD"), head), expected());
});

test("desktop and SDK Markdown files do not start source builds", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["desktop/README.md", "# desktop"],
    ["sdk/go/README.md", "# sdk"],
    ["desktop/frontend/public/provider-icons/SOURCE.md", "credit"],
  ] }), expected());
});
test("unknown files under docs are treated conservatively as code", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["docs/experimental/controller.m", "disp(1)"]] }), expected({ code: "true", desktop: "true" }));
});
test("static docs artifacts and build data stay documentation-only", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [
    ["docs/.nojekyll", ""],
    ["docs/index.html", "<html></html>"],
    ["benchmarks/fixtures/input.json", "{}"],
  ] }), expected());
});

test("extension documentation does not trigger Go, desktop, or SDK; source does", t => {
  const f = fixture(t);
  assert.deepEqual(f.classify({ files: [["internal/extension/README.md", "# extension"]] }), expected());
  assert.deepEqual(f.classify({ files: [["internal/extension/protocol/schema.go", "package protocol"]] }), expected({ code: "true", desktop: "true", sdk: "true" }));
});
