import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceDockRegion } from "../app-shell/WorkspaceDockRegion";
import type { Translator } from "../lib/i18n";
import { projectConversation, projectConversationLayout } from "../app-runtime/conversationProjection";
import { initialState } from "../lib/useController";
import type { BackgroundRuntimeView } from "../lib/types";

const local = { ...initialState, running: true, activeTurnId: "local-turn", turnTokens: 999,
  turnStartAt: 111, sessionTokens: 999, sessionCost: 999, sessionCurrency: "USD",
  context: { used: 999, window: 999, sessionTokens: 999 }, balance: { available: true, display: "LOCAL" },
  meta: { ready: true, eventChannel: "local-events", cwd: "local-cwd", label: "local-model", workspaceName: "local-project", gitBranch: "local-branch",
    imageInputEnabled: true, visionFallbackEnabled: true, pinnedFiles: [{ path: "local-file", sizeBytes: 10, tokenEstimate: 5 }] },
} as typeof initialState;
const background = [{ id: "local-runtime" }] as unknown as BackgroundRuntimeView[];
const view = projectConversation({ local, activeTabId: "local", backgroundRuntimes: background, connectingLabel: "connecting" });
assert.equal(view.runtime, local, "projection shares the canonical state and message arrays");
assert.equal(view.context.items, local.items);
assert.equal(view.context.tabId, "local");
assert.equal(view.composer.modelLabel, "local-model");
assert.equal(view.composer.cwd, "local-cwd");
assert.equal(view.composer.turnTokens, 999);
assert.equal(view.composer.turnStartAt, 111);
assert.equal(view.composer.currency, "USD");
assert.deepEqual(view.composer.pinnedFiles, local.meta.pinnedFiles);
assert.equal(view.composer.attachmentInputEnabled, true);
assert.equal(view.composer.imageInputEnabled, true);
assert.equal(view.composer.imageUnderstandingEnabled, true);
assert.equal(view.composer.localDurableGuidance, true);
assert.equal(view.composer.turnId, "local-turn");
assert.equal(view.composer.context, local.context);
assert.equal(view.composer.balance, local.balance);
assert.equal(view.status.context, local.context);
assert.equal(view.status.balance, local.balance);
assert.equal(view.status.backgroundRuntimes, background);
assert.equal(view.status.gitBranch, "local-branch");
assert.equal(view.status.workspaceName, "local-project");
assert.equal(view.status.cost, 999);
assert.equal(view.status.sessionTokens, 999);
for (const chatVisible of [false, true]) for (const localToolsEnabled of [false, true]) for (const dockMode of ["files", "changed", "context"]) {
  const layout = projectConversationLayout({ chatVisible, localToolsEnabled, dockMode, dockRenderable: true,
    dockGridOpen: true, dockOverlay: true, dockOpen: true, dockMaximized: true, terminalOpen: true });
  const permitted = chatVisible && (localToolsEnabled || !["files", "changed"].includes(dockMode));
  assert.equal(layout.dockVisible, permitted);
  assert.equal(layout.dockGridOpen, permitted);
  assert.equal(layout.dockOverlay, permitted);
  assert.equal(layout.terminalOpen, chatVisible && localToolsEnabled);
  assert.equal(layout.dockMaximized, chatVisible, "automation masks stored maximization without modifying the preference");
  if (!localToolsEnabled && (dockMode === "files" || dockMode === "changed")) {
    const noop = () => {};
    const markup = renderToStaticMarkup(createElement(WorkspaceDockRegion, {
      visible: layout.dockVisible, overlay: layout.dockOverlay, mode: dockMode,
      creation: false, showContext: true, t: ((key: string) => key) as Translator,
      onMode: noop, context: view.context,
      workspaceKey: "fixture", workspace: { open: layout.dockVisible, maximized: false, onClose: noop, onToggleMaximized: noop },
    }));
    assert.equal(markup, "", "actual dock region never mounts local Files/Changes when local tools are disabled");
  }
}
console.log("conversation projection: shared source identity and local-tool layout policy passed");
