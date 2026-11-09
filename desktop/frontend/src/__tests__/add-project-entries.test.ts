// Run: tsx src/__tests__/add-project-entries.test.ts
// Source-contract test: the add-project entry points offer only local
// actions now that the remote workspace surface is gone, and the removed
// sidebar quick button must stay gone.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let passed = 0;
let failed = 0;
function ok(value: boolean, label: string) {
  if (value) {
    process.stdout.write(`  PASS  ${label}\n`);
    passed += 1;
  } else {
    process.stdout.write(`  FAIL  ${label}\n`);
    failed += 1;
  }
}

console.log("\nAdd-project entry matrix");
const here = dirname(fileURLToPath(import.meta.url));
const treeSource = readFileSync(resolve(here, "../components/ProjectTree.tsx"), "utf8");
const addControlsSource = readFileSync(resolve(here, "../components/ProjectTreeAddControls.tsx"), "utf8");
const hookSource = readFileSync(resolve(here, "../components/useProjectCreation.tsx"), "utf8");
const appSource = readFileSync(resolve(here, "../AppRuntime.tsx"), "utf8");
const locales = ["en", "zh", "zh-TW"].map((name) =>
  readFileSync(resolve(here, `../locales/${name}.ts`), "utf8"),
);

// Workbench "+" menu: local actions only; the remote wizard is gone.
ok(
  !/openRemoteConnectFlow/.test(treeSource) && !/remote-connection/.test(addControlsSource),
  "workbench + menu no longer offers a remote connection item",
);
ok(
  /key: "blank-project"[\s\S]*?key: "open-local-folder"/.test(addControlsSource),
  "workbench + menu keeps blank project before open-local-folder",
);

// Classic/creation "+": no longer a direct picker; renders a menu that
// contains the remote connection item.
ok(
  /project-tree__add-project[\s\S]*?aria-haspopup="menu"/.test(addControlsSource),
  "classic/creation + button opens a menu instead of the direct picker",
);
ok(
  /ProjectTreeHeaderAddControl[\s\S]*?items=\{classicHeaderAddItems\}/.test(treeSource),
  "classic/creation + menu is the two-item local/remote list",
);

// Empty state: the local action only.
ok(
  !/ProjectTreeRemoteAction/.test(treeSource) && !/project-tree__empty-secondary/.test(addControlsSource),
  "empty state offers only the local action",
);

// The remote wizard is not mounted by the creation hook anymore.
ok(
  !/RemoteConnectWizardEntry/.test(hookSource),
  "useProjectCreation no longer loads a remote wizard",
);

// Removed sidebar quick button: gone from App.tsx and no locale key remains.
ok(!/sidebar__new--remote/.test(appSource), "removed sidebar quick button leaves no JSX behind");
ok(!/creation\.sidebar\.remote/.test(appSource), "no creation.sidebar.remote usage in App.tsx");
for (const [index, source] of locales.entries()) {
  ok(!/creation\.sidebar\.remote/.test(source), `creation.sidebar.remote removed from locale #${index + 1}`);
  ok(/"projectTree\.remoteConnection"/.test(source), `projectTree.remoteConnection present in locale #${index + 1}`);
}

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
