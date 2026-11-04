# 当前进度与接续说明

> 更新：2026-11-05
> 分支：`main` · 仓库：`keeyangyy/reasonix-wails`
> 用途：任何新会话先读本文件，再读 `docs/planning/IMPLEMENTATION_PLAN.md`。

## 1. 里程碑状态

| 里程碑 | 状态 | 提交 / 证据 |
|---|---|---|
| M0 基线审计 | ✅ 完成 | `4c78b02` · `docs/BASELINE_AUDIT.md` |
| M1 独立仓库 | ✅ 完成 | 仓库 public、`fork=false`、默认 `main`，基线 `e5abdb676`，祖先历史完整 |
| M2 身份隔离 | ✅ 代码完成、待实物验证 | `0976a640` · `docs/APP_IDENTITY.md` |
| M3 裁剪 | 🟡 进行中 | 隐私部分已提交 `82617dad` |
| M4—M10 | ⬜ 未开始 | 见实施计划 |

## 2. 已完成的具体改动

### M1

- 从 `wails-mine` 的 `e5abdb676` 建立 `main`，只推送 `main`，不引入 `studio` 分支。
- 旧 Fork `keeyangyy/DeepSeek-Reasonix` 保持原样，仅作来源归档。

### M2

- 产品名 `Reasonix Wails`，公司名 `Reasonix Wails`，Wails 项目名 `reasonix-wails`。
- 安装根显式写死 `%LOCALAPPDATA%\Programs\Reasonix-Wails`。
- 卸载键 `...\Uninstall\Reasonix Wails`（通过 `UNINST_KEY_NAME`）。
- 删除 `.onInit` 中读取上游卸载键推断安装位置的分支。
- 快捷方式只认领 `Reasonix Wails.lnk` / `reasonix-wails*.lnk`。
- AUMID `Reasonix.Wails`；单实例/托盘命名空间 `com.reasonix.wails`。
- WebView2 配置目录 `%APPDATA%\reasonix-wails\WebView2`。
- 窗口标题与托盘文案改为 `Reasonix Wails`。
- **未改**：共享数据根 `%APPDATA%\reasonix`、EXE 名、安装包名（M5 处理）。

### M3（已完成部分）

- 清空 `crashEndpoint` / `metricsEndpoint` / `pingEndpoint`，发送函数在空端点时直接返回。
- 效果：不再向 `crash.reasonix.io` 发送任何数据；待发崩溃文件会被清理而非重试。
- 本地诊断、手动导出、脱敏流程保留。

## 3. 已执行的验证

| 命令 | 结果 |
|---|---|
| `go build ./...`（根模块） | 通过 |
| `cd desktop && go build ./...` | 通过 |
| `go test ./internal/appidentity/` | 通过 |
| `go test ./desktop/internal/instanceidentity/` | 通过 |
| `go test -run 'SingleInstance' ./...`（desktop） | 通过 |
| `go test -run 'Crash\|Telemetry\|Metrics\|Ping' .`（desktop） | 通过 |

**未执行**：NSIS 实际构建、安装/卸载实物测试、前端 `pnpm build`、完整 `go test ./...`。

## 4. 下一次接续点

### 4.1 M2 收尾（优先）

1. 构建 NSIS 安装器，确认：
   - 默认目录为 `%LOCALAPPDATA%\Programs\Reasonix-Wails`
   - 卸载键为 `...\Uninstall\Reasonix Wails`
   - 旧安装存在时不会被导向旧目录
2. 双装测试：新旧同时安装、同时运行、分别卸载。
3. 确认 WebView2 目录创建失败时回退正常。

### 4.2 M3 后续（按风险从低到高）

1. `internal/autoresearch`：删除旧归档兼容层。注意 `autoresearch_manager.go` 被 Goal 流程使用，需把 `legacyResearchArchive` 改为空实现，不能直接删文件。
2. `internal/acp` + `internal/cli/acp.go`：移除 ACP 子命令与协议实现；确认 CLI 仍能编译（M5 前 `reasonix-cli.exe` 仍是打包依赖）。
3. `internal/remote` / `internal/serve` / SSH 相关：涉及前端生成绑定与导航，需前端同步改动，建议单独分支完成。
4. 依赖收敛：上述清理完成后再跑 `go mod tidy`。

### 4.3 不要做

- 不要删除 `cmd/reasonix`、`reasonix-guard`、`reasonix-cli` 的源码或产物，直到 M5 同步改造打包脚本与载荷清单。
- 不要做全仓库 `reasonix` 字符串替换。
- 不要改写 `%APPDATA%\reasonix` 的共享数据。
- 不要把未测试项写成"已验证"。

## 5. 仍待用户确认的事项

1. Minisign 私钥是否确由本人控制（旧仓库 Secrets 名称存在，但内容未验证）。
2. 是否需要 Authenticode 签名（影响 SmartScreen 提示）。
3. 官网是否进首发（当前计划：首发不依赖官网）。
