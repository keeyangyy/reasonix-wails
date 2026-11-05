import { app } from "../lib/bridge";

/** Runtime-only bridge ports used by App owners; presentation never imports Wails directly. */
export const desktopBridge = {

  getTopicSummary: (request: Parameters<typeof app.GetTopicSummary>[0]) => app.GetTopicSummary(request),
  cancelJobForTab: (tabId: string, jobId: string) => app.CancelJobForTab(tabId, jobId),
  dismissTodoBatchForTab: (tabId: string, batchKey: string) => app.DismissTodoBatchForTab(tabId, batchKey),
  terminalOutputForTab: (tabId: string, sessionId: string) => app.TerminalOutputForTab(tabId, sessionId),
  acceptDeliveryToTab: (tabId: string) => app.AcceptDeliveryToTab(tabId),
  listTabs: app.ListTabs,
  openTaskSessionForTab: app.OpenTaskSessionForTab,
  listSessionsForTab: app.ListSessionsForTab,
  closeMergedWorktreeTab: app.CloseMergedWorktreeTab,
  finalizeWorktreeMerge: app.FinalizeWorktreeMerge,
};
