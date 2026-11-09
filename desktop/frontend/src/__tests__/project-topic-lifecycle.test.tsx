import assert from "node:assert/strict";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useProjectTopicCommands } from "../app-runtime/useProjectTopicCommands";
import type { ProjectTopicPorts } from "../app-runtime/projectTopicOwner";
import { enqueueNavigationRequest, type NavigationCoalescingRefs } from "../lib/openTopicCoalescing";

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const dom = new JSDOM("<div id='root'></div>");
Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
const root = createRoot(document.getElementById("root")!);
let commands!: ReturnType<typeof useProjectTopicCommands>;
const effects: string[] = [];
const localRequests = new Map<string, ReturnType<typeof deferred<void>>>();
type NavigationInput = { kind: "isolated-worktree"; workspaceRoot: string };
const navigationRefs: NavigationCoalescingRefs<NavigationInput> = {
  seqRef: { current: 0 }, runningRef: { current: false }, pendingRef: { current: null },
};
let navigationGate: ReturnType<typeof deferred<void>> | undefined;
const ports: ProjectTopicPorts = {
  renameLocal: async (id, title) => {
    effects.push(`rename:${id}:${title}`);
    const gate = deferred<void>(); localRequests.set(id, gate); await gate.promise;
  },
  markChanged: () => { effects.push("refresh-projects"); },
  refreshTabs: async () => [],
  syncActive: async () => { effects.push("sync-current"); },
};
const navigation = {
  openBlank: async (scope: string, path: string) => { effects.push(`blank:${scope}:${path}`); },
  enqueue: (input: NavigationInput) => enqueueNavigationRequest(navigationRefs, input, async request => {
    effects.push(`worktree:${request.workspaceRoot}`);
    if (navigationGate) await navigationGate.promise;
    if (request.seq === navigationRefs.seqRef.current && navigationGate) effects.push(`visible:${request.workspaceRoot}`);
  }),
  switchFolder: async (path?: string) => { effects.push(`project:${path}`); },
};
function Probe({ tab }: { tab: string }) {
  commands = useProjectTopicCommands({ visible: { tabId: tab, sessionKey: tab },
    topic: { id: tab, title: tab, target: { kind: "local", topicId: tab } },
    ports, navigation, reportError: error => { throw error; },
  });
  return null;
}
async function paint(tab: string) { await act(async () => root.render(<Probe tab={tab} />)); }
try {
  await paint("A");
  const first = commands;
  await paint("B");
  assert.equal(commands.onCreateTopic, first.onCreateTopic);
  assert.equal(commands.onCreateIsolatedWorktree, first.onCreateIsolatedWorktree);
  assert.equal(commands.onAddProject, first.onAddProject);
  await commands.onCreateTopic("global", "ignored");
  await commands.onCreateIsolatedWorktree("worktree");
  await commands.onAddProject("project");
  assert.deepEqual(effects, ["blank:global:", "worktree:worktree", "project:project"]);

  effects.length = 0;
  navigationGate = deferred<void>();
  const firstNavigation = commands.onCreateIsolatedWorktree("A");
  const supersededNavigation = commands.onCreateIsolatedWorktree("B");
  const lastNavigation = commands.onCreateIsolatedWorktree("C");
  await supersededNavigation;
  assert.deepEqual(effects, ["worktree:A"], "replaced requests do not execute while the first backend call is pending");
  navigationGate.resolve();
  await Promise.all([firstNavigation, lastNavigation]);
  assert.deepEqual(effects, ["worktree:A", "worktree:C", "visible:C"], "real coalescing queue accepts the last worktree command and rejects old UI continuation");
  assert.equal(navigationRefs.pendingRef.current, null);
  assert.equal(navigationRefs.runningRef.current, false);
  navigationGate = undefined;

  effects.length = 0;
  await act(async () => commands.startActiveTopicRename());
  await act(async () => commands.setTopicTitleDraft("changed"));
  await act(async () => commands.cancelActiveTopicRename());
  await commands.commitActiveTopicRename();
  assert.deepEqual(effects, [], "escape followed by blur never submits a rename");


  await paint("A");
  await act(async () => commands.startActiveTopicRename());
  await act(async () => commands.setTopicTitleDraft("source title"));
  let pending!: Promise<void>;
  await act(async () => { pending = commands.commitActiveTopicRename(); });
  localRequests.get("A")!.resolve();
  await act(async () => { await pending; });
  assert.deepEqual(effects, ["rename:A:source title", "refresh-projects", "sync-current"], "a rename retains its own topic, refreshes projects and resyncs the visible tab");

  effects.length = 0;
  const renameA = commands.renameTopic("A", "one");
  const renameB = commands.renameTopic("B", "two");
  localRequests.get("A")!.resolve(); await renameA;
  localRequests.get("B")!.resolve(); await renameB;
  assert.equal(effects.filter(effect => effect === "refresh-projects").length, 2, "unrelated topics retain independent operation lanes");

  effects.length = 0;
  await act(async () => commands.startActiveTopicRename());
  await act(async () => { pending = commands.commitActiveTopicRename(); });
  await act(async () => root.unmount());
  localRequests.get("A")!.resolve(); await pending;
  first.onAddProject("stale");
  assert.equal(effects.includes("project:stale"), false, "a disposed feature cannot navigate");
  console.log("project/topic commands: stable entry, targeted rename, independent lanes and disposal passed");
} finally { dom.window.close(); }
