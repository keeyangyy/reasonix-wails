> **已归档（2026-11）**：wails-mine 重建/挂载阶段的历史方案。后续采用按文件搬移，挂载收敛方案已撤销；数字、分支与路径仅作取证，不再维护。

# wails-mine 各主题文件清单

> 生成于 2026-10-14 · 每主题改动文件的并集；标注所属主题数（>1 为跨主题共享）

## T1 · fork CI 与发版链

- .github/workflows/app-memory.yml
- .github/workflows/build-probe-windows.yml
- .github/workflows/build-windows.yml
- .github/workflows/cache-impact.yml
- .github/workflows/ci-rerun.yml  ← 共享: MIX,T1
- .github/workflows/ci.yml
- .github/workflows/codeql.yml
- .github/workflows/deploy-accounts-worker.yml
- .github/workflows/deploy-crash-worker.yml
- .github/workflows/deploy-forum-worker.yml
- .github/workflows/docs-impact.yml
- .github/workflows/pages.yml
- .github/workflows/release-manual.yml  ← 共享: T1,T8
- .github/workflows/release-stable-trigger.yml
- .github/workflows/release-verify-issues.yml
- .github/workflows/release-windows.yml  ← 共享: T1,T27
- .github/workflows/stale-report-sweep.yml
- .github/workflows/update-star-history.yml
- internal/acp/client_integration_test.go
- internal/acp/dispatch_test.go
- internal/acp/e2e_test.go
- internal/acp/inbox_drain_test.go
- internal/acp/server_test.go
- internal/acp/service_lock_test.go
- internal/acp/write_access_test.go
- internal/boot/effect_test.go
- internal/cli/chat_tui_queued_paste_test.go
- internal/cli/gitstatus_test.go
- internal/control/input_test.go
- internal/control/recovery_test.go
- internal/control/teardown_quiet_test.go
- internal/serve/serve_test.go
- scripts/check-wails-pin.sh

## T2 · transcript 重放/去重/渲染

- "docs/reasonix-transcript-dedup-\346\212\245\345\221\212.md"
- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/frontend/bench/transcript-live-layout.html
- desktop/frontend/bench/transcript-live-layout.mjs
- desktop/frontend/bench/transcript-live-layout.tsx
- desktop/frontend/bench/transcript-session-replay.mjs  ← 共享: MIX,T2
- desktop/frontend/package.json  ← 共享: MIX,T12,T2
- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/activate-topic-stale.test.tsx
- desktop/frontend/src/__tests__/ask-order-self-repro.test.ts  ← 共享: T2,T6
- desktop/frontend/src/__tests__/clear-session-identity-race.test.ts
- desktop/frontend/src/__tests__/context-panel-capacity.test.tsx
- desktop/frontend/src/__tests__/context-window-ring.test.tsx
- desktop/frontend/src/__tests__/hydrate-history-apply.test.ts  ← 共享: MIX,T2
- desktop/frontend/src/__tests__/hydrate-prepend-replay-rows.test.ts
- desktop/frontend/src/__tests__/markdown-pipeline.test.tsx
- desktop/frontend/src/__tests__/markdown-streaming-worker.test.tsx
- desktop/frontend/src/__tests__/mermaid-rendering.test.tsx
- desktop/frontend/src/__tests__/new-session-load-race.test.tsx
- desktop/frontend/src/__tests__/provider-display-name.test.tsx
- desktop/frontend/src/__tests__/provider-editor-compact.test.tsx
- desktop/frontend/src/__tests__/ready-event-meta-sync.test.tsx
- desktop/frontend/src/__tests__/ready-meta-reconcile.test.tsx
- desktop/frontend/src/__tests__/remote-switch-from-local.test.tsx
- desktop/frontend/src/__tests__/replay-cursor-clamp.test.ts
- desktop/frontend/src/__tests__/replay-page-adopt.test.ts
- desktop/frontend/src/__tests__/replay-page-coexist.test.ts
- desktop/frontend/src/__tests__/replay-poison-cure.test.ts
- desktop/frontend/src/__tests__/replay-turn-rebuild.test.ts
- desktop/frontend/src/__tests__/running-tab-history-hydration.test.tsx
- desktop/frontend/src/__tests__/session-switch-dedup-repro.test.tsx
- desktop/frontend/src/__tests__/session-switch-diagnostics.test.ts
- desktop/frontend/src/__tests__/session-switch-page-ahead-repro.test.tsx
- desktop/frontend/src/__tests__/stream-delta-batch.test.ts
- desktop/frontend/src/__tests__/switch-tab-preserve.test.ts
- desktop/frontend/src/__tests__/tab-switch-hydration.test.tsx
- desktop/frontend/src/__tests__/tab-switch-session-rebind.test.tsx
- desktop/frontend/src/__tests__/terminal-panel-commands.test.tsx
- desktop/frontend/src/__tests__/topic-activation.test.tsx
- desktop/frontend/src/__tests__/transcript-dedup-regression.test.ts
- desktop/frontend/src/__tests__/transcript-messageid-dedup.test.ts
- desktop/frontend/src/__tests__/transcript-process-fold.test.ts  ← 共享: T11,T2
- desktop/frontend/src/__tests__/transcript-rows.test.ts
- desktop/frontend/src/__tests__/transcript-running-older.test.tsx
- desktop/frontend/src/__tests__/transcript-timeline.test.ts
- desktop/frontend/src/__tests__/transcript-turnid-align.test.ts
- desktop/frontend/src/__tests__/turn-event-projection-reset.test.ts
- desktop/frontend/src/__tests__/use-controller-history-live-race.test.tsx
- desktop/frontend/src/__tests__/use-controller-stale-turn-watchdog.test.tsx
- desktop/frontend/src/__tests__/use-controller-stream-progress.test.ts
- desktop/frontend/src/app-runtime/useAppSessionComposition.ts
- desktop/frontend/src/app-runtime/useSessionUndo.ts
- desktop/frontend/src/app-shell/AppOverlayHost.tsx
- desktop/frontend/src/app-shell/AppRuntimeView.tsx  ← 共享: T12,T13,T2
- desktop/frontend/src/app-shell/ChatPaneRegion.tsx
- desktop/frontend/src/components/Markdown.tsx
- desktop/frontend/src/components/ProcessFoldHeader.tsx  ← 共享: T12,T2
- desktop/frontend/src/components/ProjectTree.tsx  ← 共享: T14,T2,T21
- desktop/frontend/src/components/SubagentPreview.tsx
- desktop/frontend/src/components/Transcript.tsx  ← 共享: T11,T2
- desktop/frontend/src/lib/assistantItems.ts
- desktop/frontend/src/lib/frontendDiagnosticBridge.ts
- desktop/frontend/src/lib/frontendDiagnostics.ts
- desktop/frontend/src/lib/hydrateHistoryApply.ts  ← 共享: MIX,T2
- desktop/frontend/src/lib/replayRebuild.ts
- desktop/frontend/src/lib/runtimeMeta.ts
- desktop/frontend/src/lib/searchTranscript.ts
- desktop/frontend/src/lib/sessionIdentity.ts
- desktop/frontend/src/lib/sessionSwitchDiagnostics.ts
- desktop/frontend/src/lib/streamDeltaBatch.ts
- desktop/frontend/src/lib/transcriptItemIds.ts
- desktop/frontend/src/lib/transcriptRows.ts  ← 共享: T11,T12,T2,T6
- desktop/frontend/src/lib/transcriptStore.ts
- desktop/frontend/src/lib/transcriptTimeline.ts
- desktop/frontend/src/lib/turnEventProjection.ts  ← 共享: T2,T6,T8
- desktop/frontend/src/lib/types.ts  ← 共享: T11,T12,T13,T2,T8
- desktop/frontend/src/lib/useController.ts  ← 共享: MIX,T2,T6,T8
- desktop/frontend/src/lib/useTranscriptHistoryNavigation.ts
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/main.tsx
- desktop/frontend/src/styles.css  ← 共享: MIX,T13,T14,T2
- desktop/history_slice.go  ← 共享: T2,T28
- desktop/scripts/ci-local.ps1  ← 共享: T10,T2,T25
- desktop/tabs_planner_notice_test.go
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- desktop/turn_runtime_api.go  ← 共享: T2,T4
- internal/agent/context_recovery_test.go
- internal/agent/reasoning_replay_recovery.go
- internal/agent/reasoning_replay.go
- internal/agent/run_loop.go
- internal/agent/sampling_recovery.go
- internal/agent/session_test.go
- internal/agent/session_turn_markers.go
- internal/agent/session.go
- internal/control/in_flight_turn.go
- internal/control/port.go
- internal/event/event.go  ← 共享: T2,T6,T8
- internal/eventwire/wire_test.go
- internal/eventwire/wire.go  ← 共享: T2,T6
- internal/provider/provider.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T3 · 测试隔离与稳定性

- desktop/go.mod
- desktop/main_test.go
- desktop/project_root_catalog_test.go
- desktop/topic_live_runtime_test.go
- go.mod
- internal/agent/main_test.go
- internal/agent/save_dag_shutdown_test.go
- internal/boot/config_home_test.go
- internal/remote/jump_resolve_test.go
- internal/tool/contract_test.go

## T4 · repolint/预算/门禁

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/fork_boundary_inherit_test.go  ← 共享: T4,T6
- desktop/fork_tab.go  ← 共享: MIX,T4,T5,T6
- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/session_catalog.go  ← 共享: MIX,T4,T8
- desktop/tabs_topic_test.go  ← 共享: MIX,T26,T4
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- desktop/turn_runtime_api.go  ← 共享: T2,T4
- docs/reasonix-transcript-dedup-report.md
- internal/agent/parallel_writer_claim_test.go  ← 共享: MIX,T4
- internal/control/goal_run_ceiling_test.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T5 · 思考强度会话化

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/fork_tab.go  ← 共享: MIX,T4,T5,T6
- desktop/new_session_inherit_test.go
- desktop/session_effort_switch_test.go
- desktop/session_effort.go
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- internal/agent/branch.go  ← 共享: T26,T5
- internal/agent/session_effort_test.go

## T6 · 压缩 compaction

- desktop/fork_boundary_inherit_test.go  ← 共享: T4,T6
- desktop/fork_tab.go  ← 共享: MIX,T4,T5,T6
- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/ask-order-self-repro.test.ts  ← 共享: T2,T6
- desktop/frontend/src/__tests__/compact-sidecar-restore.test.ts
- desktop/frontend/src/__tests__/compaction-anchor-order.test.ts
- desktop/frontend/src/__tests__/compaction-anchor-restore.test.ts
- desktop/frontend/src/__tests__/compaction-visible.test.ts
- desktop/frontend/src/__tests__/turn-event-projection-replay-window.test.ts
- desktop/frontend/src/components/Message.tsx
- desktop/frontend/src/components/useTranscriptRowRenderer.tsx
- desktop/frontend/src/lib/bridge.ts  ← 共享: T11,T12,T13,T14,T6
- desktop/frontend/src/lib/compactionAnchor.ts
- desktop/frontend/src/lib/transcriptRows.ts  ← 共享: T11,T12,T2,T6
- desktop/frontend/src/lib/turnEventProjection.ts  ← 共享: T2,T6,T8
- desktop/frontend/src/lib/useController.ts  ← 共享: MIX,T2,T6,T8
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/latest_compaction.go
- internal/agent/agent.go  ← 共享: T11,T12,T6
- internal/agent/compact_cache_prefix_test.go
- internal/agent/compact_fold_shrink_test.go
- internal/agent/compact_projection.go  ← 共享: MIX,T11,T6
- internal/agent/compact_slim.go
- internal/agent/compact.go  ← 共享: T11,T25,T6,T8
- internal/agent/context_receipt.go  ← 共享: T11,T6
- internal/agent/fork_projection_test.go
- internal/agent/fork_projection.go  ← 共享: T11,T6
- internal/agent/session_context_compaction_test.go
- internal/checkpoint/checkpoint.go
- internal/control/branch_ops.go
- internal/control/controller.go  ← 共享: T6,T8
- internal/control/fork_projection_test.go
- internal/control/replay_ledger_dedup_test.go
- internal/control/turn_events.go  ← 共享: T6,T8
- internal/event/event.go  ← 共享: T2,T6,T8
- internal/eventwire/wire.go  ← 共享: T2,T6
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T7 · 会话打开等待与日志轮转

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/session_open_wait_test.go
- desktop/session_open_wait.go
- internal/agent/session_dag_rotate_test.go
- internal/agent/session_dag_rotate.go

## T8 · 会话标题与自动命名

- .github/workflows/release-manual.yml  ← 共享: T1,T8
- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/autotitle_refresh_repro_test.go
- desktop/frontend/src/lib/turnEventProjection.ts  ← 共享: T2,T6,T8
- desktop/frontend/src/lib/types.ts  ← 共享: T11,T12,T13,T2,T8
- desktop/frontend/src/lib/useController.ts  ← 共享: MIX,T2,T6,T8
- desktop/history_catalog.go
- desktop/session_ai_title.go
- desktop/session_catalog_runtime.go
- desktop/session_catalog.go  ← 共享: MIX,T4,T8
- desktop/session_title_topic_propagation.go
- desktop/session_topic_title_resolver_test.go
- desktop/session_topic_title_resolver.go
- desktop/tabs_auto_title_retry_test.go
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- desktop/topic_live_runtime.go
- internal/agent/compact.go  ← 共享: T11,T25,T6,T8
- internal/agent/session_foreign_test.go  ← 共享: T26,T8
- internal/agent/session_foreign.go  ← 共享: T26,T8
- internal/control/controller.go  ← 共享: T6,T8
- internal/control/prompt_replay.go
- internal/control/session_title_test.go  ← 共享: MIX,T8
- internal/control/session_title.go  ← 共享: MIX,T8
- internal/control/turn_events.go  ← 共享: T6,T8
- internal/event/event_workspace.go
- internal/event/event.go  ← 共享: T2,T6,T8
- internal/historycatalog/catalog.go
- internal/sessioncatalog/catalog.go
- internal/sessioncatalog/lineage.go
- internal/sessioncatalog/reconcile.go
- internal/sessioncatalog/topic_title_authority_test.go
- internal/store/session.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T9 · 配置保存与渲染

- internal/config/completion.go
- internal/config/config_preserve_swap_test.go
- internal/config/preserve.go  ← 共享: MIX,T9
- internal/config/render_test.go
- internal/config/render.go  ← 共享: T13,T9
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T10 · 本地 CI 门 ci-local

- desktop/scripts/ci-local.ps1  ← 共享: T10,T2,T25

## T11 · 过程折叠与折叠索引

- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/session-experience-settings.test.tsx  ← 共享: MIX,T11
- desktop/frontend/src/__tests__/transcript-fold-policy.test.ts
- desktop/frontend/src/__tests__/transcript-process-fold.test.ts  ← 共享: T11,T2
- desktop/frontend/src/components/SessionExperienceSettings.tsx  ← 共享: MIX,T11
- desktop/frontend/src/components/SettingsPanel.tsx  ← 共享: T11,T13
- desktop/frontend/src/components/Transcript.tsx  ← 共享: T11,T2
- desktop/frontend/src/lib/bridge.ts  ← 共享: T11,T12,T13,T14,T6
- desktop/frontend/src/lib/processFoldPolicy.ts
- desktop/frontend/src/lib/transcriptFoldPolicy.ts
- desktop/frontend/src/lib/transcriptRows.ts  ← 共享: T11,T12,T2,T6
- desktop/frontend/src/lib/types.ts  ← 共享: T11,T12,T13,T2,T8
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/settings_app.go  ← 共享: T11,T13
- docs/TOOL_CONTRACT.md
- docs/TOOL_CONTRACT.zh-CN.md
- internal/agent/agent_config.go
- internal/agent/agent.go  ← 共享: T11,T12,T6
- internal/agent/compact_commit.go
- internal/agent/compact_compress_index_test.go
- internal/agent/compact_index_test.go
- internal/agent/compact_index.go
- internal/agent/compact_projection.go  ← 共享: MIX,T11,T6
- internal/agent/compact_recall.go
- internal/agent/compact_search.go
- internal/agent/compact.go  ← 共享: T11,T25,T6,T8
- internal/agent/context_receipt.go  ← 共享: T11,T6
- internal/agent/execute_one.go  ← 共享: MIX,T11
- internal/agent/extensions_test.go
- internal/agent/fork_projection.go  ← 共享: T11,T6
- internal/agent/maintenance_commit.go
- internal/agent/projection.go  ← 共享: MIX,T11
- internal/agent/save_recovery_helpers.go
- internal/agent/session_extract_budget_test.go
- internal/agent/task_options.go
- internal/agent/task.go  ← 共享: MIX,T11,T12
- internal/boot/agent_preset.go
- internal/boot/boot_test.go  ← 共享: T11,T26
- internal/boot/boot.go  ← 共享: T11,T12
- internal/boot/compaction_retention_effect_test.go
- internal/boot/testdata/golden/prefix_shape.json
- internal/boot/testdata/golden/provider_request.json
- internal/boot/testdata/golden/tool_schemas.json
- internal/config/config.go  ← 共享: MIX,T11,T13
- internal/config/edit.go  ← 共享: MIX,T11,T13
- internal/tool/builtin/contextbudget.go
- internal/tool/builtin/recall.go
- internal/tool/context_budget.go
- internal/tool/recall.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T13 · 主题与外观

- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/automation-regions.test.tsx
- desktop/frontend/src/__tests__/theme-quick-switch.test.tsx
- desktop/frontend/src/__tests__/theme-schedule.test.ts
- desktop/frontend/src/app-runtime/useThemeQuickSwitch.ts
- desktop/frontend/src/app-shell/AppRuntimeView.tsx  ← 共享: T12,T13,T2
- desktop/frontend/src/app-shell/chromeRegionBuilders.ts
- desktop/frontend/src/app-shell/SidebarRegion.tsx
- desktop/frontend/src/app-shell/ThemeQuickSwitch.tsx
- desktop/frontend/src/components/AppearanceOverview.tsx
- desktop/frontend/src/components/SettingsPanel.tsx  ← 共享: T11,T13
- desktop/frontend/src/lib/bridge.ts  ← 共享: T11,T12,T13,T14,T6
- desktop/frontend/src/lib/theme.ts
- desktop/frontend/src/lib/themeExperience.ts
- desktop/frontend/src/lib/themeSchedule.ts
- desktop/frontend/src/lib/types.ts  ← 共享: T11,T12,T13,T2,T8
- desktop/frontend/src/lib/useResolvedTheme.ts
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/styles.css  ← 共享: MIX,T13,T14,T2
- desktop/settings_app.go  ← 共享: T11,T13
- desktop/settings_preferences.go
- desktop/theme_app.go
- desktop/theme_pack.go
- internal/config/config.go  ← 共享: MIX,T11,T13
- internal/config/desktop_preferences.go
- internal/config/edit.go  ← 共享: MIX,T11,T13
- internal/config/render.go  ← 共享: T13,T9
- internal/config/theme_schedule_test.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T12 · 子代理/写锁

- desktop/frontend/package.json  ← 共享: MIX,T12,T2
- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/subagent-status-strip.test.ts
- desktop/frontend/src/app-shell/AppRuntimeView.tsx  ← 共享: T12,T13,T2
- desktop/frontend/src/app-shell/DecisionFooterRegion.tsx
- desktop/frontend/src/components/ProcessFoldHeader.tsx  ← 共享: T12,T2
- desktop/frontend/src/components/SubagentRunningStrip.css
- desktop/frontend/src/components/SubagentRunningStrip.tsx
- desktop/frontend/src/lib/bridge.ts  ← 共享: T11,T12,T13,T14,T6
- desktop/frontend/src/lib/subagentInventory.ts
- desktop/frontend/src/lib/transcriptRows.ts  ← 共享: T11,T12,T2,T6
- desktop/frontend/src/lib/types.ts  ← 共享: T11,T12,T13,T2,T8
- desktop/frontend/src/lib/useSubagentRuns.ts
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/subagents_runs.go
- internal/agent/agent.go  ← 共享: T11,T12,T6
- internal/agent/context_capsule.go
- internal/agent/path_bound_tools_test.go
- internal/agent/path_bound_tools.go
- internal/agent/profile_spec.go
- internal/agent/readonly_capability_search_test.go
- internal/agent/subagent_format.go
- internal/agent/subagent_label_test.go
- internal/agent/subagent_label.go
- internal/agent/subagent_store_terminal.go
- internal/agent/subagent_store.go
- internal/agent/task.go  ← 共享: MIX,T11,T12
- internal/agent/tool_write_coordination.go  ← 共享: MIX,T12
- internal/agent/workspace_lease_regression_test.go  ← 共享: MIX,T12
- internal/boot/boot.go  ← 共享: T11,T12
- internal/boot/subagent_outcome.go
- internal/tool/resolved.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T14 · 回收站与会话删除

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/frontend/scripts/check-bundle-budget.mjs  ← 共享: T11,T12,T13,T14,T2,T4,T6
- desktop/frontend/src/__tests__/permanent-delete-wiring.test.ts
- desktop/frontend/src/__tests__/trash-bulk-actions.test.tsx
- desktop/frontend/src/__tests__/trash-turns-filter.test.tsx
- desktop/frontend/src/components/HistoryPanel.tsx  ← 共享: T14,T21
- desktop/frontend/src/components/HistorySelectionBar.tsx
- desktop/frontend/src/components/ProjectTree.tsx  ← 共享: T14,T2,T21
- desktop/frontend/src/components/ProjectTreeSessionArchiveMenu.tsx
- desktop/frontend/src/components/ProjectTreeTopicRemoval.tsx
- desktop/frontend/src/components/TrashPage.css
- desktop/frontend/src/components/TrashPage.tsx
- desktop/frontend/src/lib/bridge.ts  ← 共享: T11,T12,T13,T14,T6
- desktop/frontend/src/lib/managementLocale.ts
- desktop/frontend/src/lib/projectTreeArchive.ts
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/styles.css  ← 共享: MIX,T13,T14,T2
- desktop/session_artifact_removal.go
- desktop/topic_archive_metadata.go
- desktop/topic_archive_ownership.go
- desktop/topic_archive_test.go  ← 共享: T14,T26
- desktop/topic_archive.go
- desktop/topic_purge_test.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

## T15 · shellsafe 只读白名单

- internal/shellsafe/shellsafe_test.go
- internal/shellsafe/shellsafe.go

## T16 · 大文件拆分重构

- internal/recovery/gate_approval.go
- internal/recovery/gate_decision.go
- internal/recovery/gate_lifecycle.go
- internal/recovery/gate_message.go
- internal/recovery/gate_persist.go
- internal/recovery/gate.go
- internal/recovery/rules_command_grant.go
- internal/recovery/rules_command_risk.go
- internal/recovery/rules_command_safe.go
- internal/recovery/rules_command_tools.go
- internal/recovery/rules_scope.go
- internal/recovery/rules.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9
- workers/crash-report/src/events.ts
- workers/crash-report/src/groups.ts
- workers/crash-report/src/handlers.ts
- workers/crash-report/src/index.ts
- workers/crash-report/src/maintenance.ts
- workers/crash-report/src/normalize.ts
- workers/crash-report/src/telemetry.ts
- workers/crash-report/src/versions.ts

## T17 · taskmonitor

- internal/taskmonitor/jsonstore_windows_test.go
- internal/taskmonitor/jsonstore.go

## T18 · 提示词历史 nonce

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/meta_config_readonly_test.go
- desktop/prompt_history_nonce_test.go

## T19 · 会话路径安全

- internal/agent/save.go
- internal/agent/session_path_component_test.go
- internal/agent/session_paths.go

## T20 · memory 存储

- internal/memory/index.go
- internal/memory/quickadd_test.go
- internal/memory/quickadd.go
- internal/memory/store_unreadable_test.go
- internal/memory/store_v2.go
- internal/memory/store.go

## T21 · IME 输入法

- desktop/frontend/src/__tests__/history-session-rename-ime.test.tsx
- desktop/frontend/src/__tests__/project-tree-rename-optimistic.test.ts
- desktop/frontend/src/__tests__/topicbar-region.test.tsx
- desktop/frontend/src/app-shell/TopicbarRegion.tsx
- desktop/frontend/src/components/HistoryPanel.tsx  ← 共享: T14,T21
- desktop/frontend/src/components/ProjectTree.tsx  ← 共享: T14,T2,T21
- desktop/frontend/src/components/ProjectTreeOrganization.tsx

## T22 · capability 路由

- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/frontend/src/__tests__/tool-card-subject.test.tsx
- desktop/frontend/src/__tests__/tool-data-archive.test.ts
- desktop/frontend/src/__tests__/tool-subject.test.ts
- desktop/frontend/src/components/ToolCard.tsx  ← 共享: MIX,T22
- desktop/frontend/src/lib/archivedToolItems.ts
- desktop/frontend/src/lib/tools.ts
- desktop/history_test.go  ← 共享: T22,T26
- desktop/history_tool_subject.go
- internal/capability/capability_test.go
- internal/capability/capability.go

## T23 · runtimepolicy

- internal/agent/prose_mutation_scope_test.go
- internal/runtimepolicy/constraints_test.go
- internal/runtimepolicy/constraints.go

## T24 · event 合并

- internal/event/coalesce_toolprogress_test.go
- internal/event/coalesce.go

## T25 · 上下文估算与投影

- desktop/scripts/ci-local.ps1  ← 共享: T10,T2,T25
- internal/agent/compact.go  ← 共享: T11,T25,T6,T8
- internal/agent/context_estimate_cold_test.go
- internal/agent/context_estimate_repro_test.go
- internal/agent/context_manager.go
- internal/agent/context_usage_lineage_test.go
- internal/agent/context_usage.go
- internal/agent/output_budget.go
- internal/agent/preflight.go  ← 共享: MIX,T25
- internal/agent/profile_boundary_test.go
- internal/agent/projection_lineage_rebind_test.go
- internal/agent/projection_stale_rebuild_test.go
- internal/agent/run_usage.go
- internal/provider/context_limit_repro_test.go
- internal/provider/context_limit.go

## T26 · 会话归属与跨线隔离

- desktop/app_autosave_test.go
- desktop/app_test.go
- desktop/checkpoints_cancode_test.go
- desktop/history_slice_test.go
- desktop/history_test.go  ← 共享: T22,T26
- desktop/memory_suggestions_test.go
- desktop/recovery_copy_sweep_test.go
- desktop/recovery_gc_test.go
- desktop/session_heads_test.go  ← 共享: MIX,T26
- desktop/session_prompt_test.go
- desktop/session_recovery_cleanup_test.go
- desktop/session_takeover_promote_test.go
- desktop/session_transition_test.go
- desktop/tabs_telemetry_test.go
- desktop/tabs_topic_test.go  ← 共享: MIX,T26,T4
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- desktop/topic_archive_test.go  ← 共享: T14,T26
- desktop/topic_migration_marker_test.go
- desktop/workspace_watcher_darwin_test.go
- internal/agent/branch.go  ← 共享: T26,T5
- internal/agent/session_foreign_test.go  ← 共享: T26,T8
- internal/agent/session_foreign.go  ← 共享: T26,T8
- internal/boot/boot_test.go  ← 共享: T11,T26
- internal/historycatalog/catalog_test.go
- internal/historycatalog/rebuild_test.go
- internal/sessioncatalog/lineage_test.go
- internal/sessioncatalog/reconcile_idle_test.go

## T27 · 自动更新源

- .github/workflows/release-windows.yml  ← 共享: T1,T27
- desktop/internal/update/update_test.go
- desktop/internal/update/verify.go
- desktop/updater_test.go
- desktop/updater.go

## T28 · 会话指纹自愈

- desktop/history_slice_rebuild.go
- desktop/history_slice.go  ← 共享: T2,T28
- desktop/session_fingerprint_selfheal.go
- internal/cli/doctor.go
- internal/doctor/fingerprint_test.go
- internal/doctor/fingerprint.go

## T29 · 列表计数投影

- internal/agent/save_listing_liveness_test.go
- internal/agent/save_tool_checkpoint.go

## MIX · 混主题 merge

- .github/workflows/ci-rerun.yml  ← 共享: MIX,T1
- desktop/app.go  ← 共享: MIX,T14,T18,T2,T22,T4,T5,T7,T8
- desktop/autotitle_rebuild_backfill_test.go
- desktop/fork_tab.go  ← 共享: MIX,T4,T5,T6
- desktop/frontend/bench/transcript-session-replay.html
- desktop/frontend/bench/transcript-session-replay.mjs  ← 共享: MIX,T2
- desktop/frontend/bench/transcript-session-replay.tsx
- desktop/frontend/package.json  ← 共享: MIX,T12,T2
- desktop/frontend/src/__tests__/ask-card-identity.test.tsx
- desktop/frontend/src/__tests__/ask-card-layout.test.ts
- desktop/frontend/src/__tests__/ask-card-supplement.test.tsx
- desktop/frontend/src/__tests__/compaction-prepend-order.test.ts
- desktop/frontend/src/__tests__/hydrate-history-apply.test.ts  ← 共享: MIX,T2
- desktop/frontend/src/__tests__/remote-session-surface.test.tsx
- desktop/frontend/src/__tests__/session-experience-settings.test.tsx  ← 共享: MIX,T11
- desktop/frontend/src/components/AskCard.tsx
- desktop/frontend/src/components/AssistantReasoningPanel.tsx
- desktop/frontend/src/components/InlineAssistantReasoning.tsx
- desktop/frontend/src/components/SessionExperienceSettings.tsx  ← 共享: MIX,T11
- desktop/frontend/src/components/ToolCard.tsx  ← 共享: MIX,T22
- desktop/frontend/src/lib/defaultCollapsedPreference.ts
- desktop/frontend/src/lib/hydrateHistoryApply.ts  ← 共享: MIX,T2
- desktop/frontend/src/lib/useController.ts  ← 共享: MIX,T2,T6,T8
- desktop/frontend/src/locales/en.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh-TW.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/locales/zh.ts  ← 共享: MIX,T11,T12,T13,T14,T2,T6
- desktop/frontend/src/styles.css  ← 共享: MIX,T13,T14,T2
- desktop/rename_refreshes_catalog_title_test.go
- desktop/session_catalog_idempotent_test.go
- desktop/session_catalog.go  ← 共享: MIX,T4,T8
- desktop/session_heads_test.go  ← 共享: MIX,T26
- desktop/tabs_topic_test.go  ← 共享: MIX,T26,T4
- desktop/tabs.go  ← 共享: MIX,T2,T26,T4,T5,T8
- internal/agent/compact_projection.go  ← 共享: MIX,T11,T6
- internal/agent/context_status.go
- internal/agent/execute_one.go  ← 共享: MIX,T11
- internal/agent/fleet.go
- internal/agent/lineage_key_test.go
- internal/agent/parallel_writer_claim_test.go  ← 共享: MIX,T4
- internal/agent/preflight.go  ← 共享: MIX,T25
- internal/agent/projection_fallback_test.go
- internal/agent/projection_fallback.go
- internal/agent/projection_model_switch_test.go
- internal/agent/projection_raw_hash_test.go
- internal/agent/projection_valid_test.go
- internal/agent/projection.go  ← 共享: MIX,T11
- internal/agent/save_dag_authority_test.go
- internal/agent/save_dag_plan.go
- internal/agent/task_profile_test.go
- internal/agent/task.go  ← 共享: MIX,T11,T12
- internal/agent/tool_call_plan.go
- internal/agent/tool_write_coordination.go  ← 共享: MIX,T12
- internal/agent/workspace_lease_regression_test.go  ← 共享: MIX,T12
- internal/agent/workspace_lease_test.go
- internal/config/config_preserve_formats_test.go
- internal/config/config_preserve_test.go
- internal/config/config.go  ← 共享: MIX,T11,T13
- internal/config/edit.go  ← 共享: MIX,T11,T13
- internal/config/preserve.go  ← 共享: MIX,T9
- internal/control/session_title_test.go  ← 共享: MIX,T8
- internal/control/session_title.go  ← 共享: MIX,T8
- internal/doctor/session_projection_redact_test.go
- internal/doctor/session_redact.go
- internal/guardian/guardian.go
- internal/i18n/i18n.go
- internal/i18n/messages_en.go
- internal/i18n/messages_zh_tw.go
- internal/i18n/messages_zh.go
- tools/repolint/baseline.json  ← 共享: MIX,T11,T12,T13,T14,T16,T2,T4,T6,T8,T9

