# Windows 产品身份矩阵

> 里程碑：M2 · 2026-11-05
> 状态：代码改动已完成，`go build` 与相关单测通过；**安装器实物验证尚未执行**（需要 Windows + NSIS 构建环境）。

## 1. 目标

新旧两套客户端必须能在同一台机器并存：

- 上游 Reasonix（Studio / 旧 Wails）保持原样。
- 本项目有独立的安装目录、卸载项、快捷方式、AUMID、单实例锁和 WebView2 配置目录。
- 共享的**用户数据**（`%APPDATA%\reasonix`）保持不动，兼容性验证见 M6。

## 2. 身份矩阵

| 身份项 | 旧值（上游/旧 Wails） | 新值（Reasonix Wails） | 代码位置 |
|---|---|---|---|
| 产品名 | `Reasonix` | `Reasonix Wails` | `desktop/wails.json` |
| 公司名 | `Reasonix` | `Reasonix Wails` | `desktop/wails.json` |
| Wails 项目名 | `reasonix-desktop` | `reasonix-wails` | `desktop/wails.json` |
| 输出 EXE | `reasonix-desktop` | **暂不变**（M5 与打包脚本同批） | `desktop/wails.json` |
| 安装根 | `%LOCALAPPDATA%\Programs\Reasonix` | `%LOCALAPPDATA%\Programs\Reasonix-Wails` | `project.nsi` |
| 卸载键 | `...\Uninstall\Reasonix` | `...\Uninstall\Reasonix Wails` | `project.nsi`（`UNINST_KEY_NAME`） |
| 快捷方式 | `Reasonix.lnk` | `Reasonix Wails.lnk` | `internal/appidentity` |
| AUMID | `Reasonix` | `Reasonix.Wails` | `internal/appidentity/identity.go` |
| 单实例 / 托盘命名空间 | `com.reasonix.desktop` | `com.reasonix.wails` | `desktop/internal/instanceidentity` |
| WebView2 配置目录 | `%APPDATA%\reasonix-desktop.exe` | `%APPDATA%\reasonix-wails\WebView2` | `desktop/main.go` |
| 共享数据根 | `%APPDATA%\reasonix` | **不变** | `internal/config/paths.go` |
| 版权 | `Copyright © 2026 Reasonix Contributors` | **不变** | `desktop/wails.json` |

## 3. 关键取舍

### 3.1 EXE 名与安装包名本轮不改

`scripts/package-windows-desktop.sh` 要求载荷里恰好 6 个 EXE（`reasonix-desktop` / `guard` / `launcher` / `update-helper` / `cli` / `uninstall`），并做精确计数。如果 M2 先改 EXE 名，构建链会在 M3/M4 期间直接失败。

**结论**：M2 只改对外可见身份和隔离边界；EXE、安装包名、便携入口留到 M5 与打包脚本、载荷清单同批修改。

### 3.2 不再从旧注册表键推断安装位置

原 `.onInit` 会读取上游 `...\Uninstall\Reasonix` 的 `InstallLocation` / `UninstallString`，把新安装器导向旧目录。这会让卸载段 `Delete current.json`、`RMDir /r versions` 破坏旧安装。

**结论**：删除该分支。新安装器只信任自己的卸载键和默认目录；旧键仅由 `deleteLegacyInstallerStateIfOwned` 在"同目录"条件下清理，不会跨目录操作。

### 3.3 快捷方式只认领本产品

`reasonixShortcutName` 原先匹配任何以 `reasonix` 开头的 `.lnk`，会"修复"上游快捷方式的 AUMID。改为只匹配 `Reasonix Wails` / `reasonix-wails`。

### 3.4 单实例锁独立

单实例 ID 由数据家目录派生，原前缀与上游相同。共用一个数据目录时，先启动的一方会阻止另一方。

**结论**：前缀改为 `com.reasonix.wails`，两套客户端可以同时运行；更新交接（`REASONIX_UPDATE_INSTANCE_ID`）也随之独立，不与旧更新链混用。

### 3.5 WebView2 配置目录独立

前端 localStorage / IndexedDB 属于产品私有、可重建状态。放进独立目录后，新旧客户端不会并发写同一 profile。

**代价**：从旧 Wails 版切过来时，界面偏好（主题、布局、缩放等）会重置一次。会话、配置、记忆仍在共享数据根，不受影响。

## 4. 已验证

| 检查 | 结果 |
|---|---|
| `go test ./internal/appidentity/` | 通过 |
| `cd desktop && go build ./...` | 通过 |
| `go test ./desktop/internal/instanceidentity/` | 通过 |

## 5. 未验证（M2 收尾前必须补）

1. NSIS 实际构建：`makensis` 读取新的 `UNINST_KEY_NAME` 与默认目录，生成安装器。
2. 双装测试：先装旧版再装新版，确认程序列表出现两项、卸载互不影响。
3. 旧版运行中启动新版：单实例锁不互相唤醒。
4. WebView2 目录创建失败时的回退行为（当前返回空字符串，由 Wails 使用默认路径）。
5. 自定义安装路径后升级：`InstallLocation` 仍指向自定义目录。

## 6. 下一步

M3：按引用图删除 CLI/TUI/Serve/ACP/SSH/云服务入口。注意打包脚本在 M5 前仍会强制要求 `reasonix-cli.exe` 与 `reasonix-guard.exe`，因此 M3 只断开"产品入口与运行引用"，不做物理删除。
