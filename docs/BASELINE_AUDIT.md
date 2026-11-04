# M0 基线审计

> 审计日期：2026-11-05
> 状态：只读审计，未修改任何源码、未触碰旧 Fork、未操作用户真实数据。
> 作用：M1—M10 的事实基线。后续里程碑以本文件记录的 SHA 和行为为准。

## 1. 基线与仓库

| 项 | 值 |
|---|---|
| 源码来源 | `keeyangyy/DeepSeek-Reasonix` · `wails-mine` |
| 基线 SHA | `e5abdb676ac34826f9a5f40b4a9f159a0f644fde` |
| 基线提交时间 | 2026-11-04 22:05:08 +0800 |
| 基线提交标题 | `style(config): 项目保存补丁逻辑移入 preserve.go，压住 edit.go 增量` |
| 新仓库 | `keeyangyy/reasonix-wails`（public，`fork=false`，`parent=none`） |
| 默认分支 | `main`（由 `wails-mine` 建立，保留完整祖先） |
| 旧 Fork | 未改动，仅作为来源归档 |
| 引入分支 | 只有 `main`；`studio` 线不引入 |

## 2. 工具链（以仓库声明为准）

| 项 | 值 |
|---|---|
| Go 模块 | `module reasonix`；桌面为嵌套模块 `reasonix/desktop` |
| Go 版本 | `go 1.26.0` / `toolchain go1.26.10` |
| 前端 | React + TypeScript + Vite，pnpm `10.34.5` |
| 桌面 | Wails v2 + WebView2，Windows x64 |
| 安装器 | NSIS（`desktop/build/windows/installer/project.nsi`） |
| 签名 | Minisign（发布）+ Authenticode（可选） |

## 3. 结构规模

| 区域 | 规模 |
|---|---|
| `internal/` 直接子目录 | 102 |
| `cmd/` 入口 | 7（`reasonix`、`reasonix-launcher`、`reasonix-legacy-migrator`、`e2ebench`、`extension-protocol-gen`、`reasonix-plugin-example`、`signpath-contract`） |
| 桌面入口 | `desktop/main.go` |
| `docs/` 文档 | 166 个文件（中英双份为主） |
| 待裁剪模块 | `internal/remote` 50 文件、`internal/serve` 69、`internal/acp` 40、`internal/autoresearch` 7 |

## 4. 运行链

### 4.1 桌面主链（已核实）

```text
desktop/main.go (Wails v2)
  └── embed frontend/dist
  └── 直接绑定 control.Controller（无 HTTP 中转）
        └── internal/assembly/boot.Build
              └── providers / tools / gate / session
        └── runtime 事件 → 前端
```

- 桌面端不经过 `internal/serve`，删除 Serve 网页工作台不影响桌面主链。
- `cmd/reasonix`（CLI）与桌面共享同一个 `internal/*` 内核。

### 4.2 安装 / 更新链（已核实）

```text
NSIS project.nsi
  └── 解压载荷到 $PLUGINSDIR 暂存
  └── reasonix-guard.exe --activate-staging（布局激活器）
        └── internal/installlayout：校验 → 原子提交 current.json → 失败回滚
  └── 写 HKCU 卸载项

desktop/update_catalog.go
  └── releaseDownloadBase = https://github.com/keeyangyy/DeepSeek-Reasonix/releases/download/
  └── 固定锚点 wails-latest（latest.json / versions.json）
  └── desktop/internal/update/verify.go：内嵌 Minisign 公钥
```

## 5. 关键常量与当前值

| 项 | 当前值 | 位置 |
|---|---|---|
| 产品名 | `Reasonix` | `desktop/wails.json` → `info.productName` |
| Wails name | `reasonix-desktop` | 同上 |
| companyName | `Reasonix` | 同上 |
| 版权 | `Copyright © 2026 Reasonix Contributors` | 同上 |
| 默认安装根 | `$LOCALAPPDATA\Programs\${INFO_PRODUCTNAME}` | `project.nsi` |
| 卸载键 | `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Reasonix` | `project.nsi` |
| 旧键检测 | `REASONIX_LEGACY_UNINST_KEY` 指向同一个键 | `project.nsi` |
| AUMID | `Reasonix` | `internal/appidentity/identity.go` |
| 历史 AUMID | `dev.reasonix.desktop` | 同上 |
| 共享数据根 | `%APPDATA%\reasonix`（Roaming） | `internal/config/paths.go` |
| 环境变量覆盖 | `REASONIX_HOME` | 同上 |
| 载荷清单 | 6 个 EXE，**精确计数校验** | `scripts/package-windows-desktop.sh` |
| 版本成员白名单 | desktop + cli + update-helper | `internal/installlayout/activate.go` |
| 内嵌 Minisign 公钥 | key id `238315CA90ACADED` | `desktop/internal/update/verify.go` |
| 崩溃/遥测端点 | `https://crash.reasonix.io/v1/{report,metrics,ping}` | `desktop` 内硬编码 |

## 6. 风险清单

| 级别 | 风险 | 证据 | 处理里程碑 |
|---|---|---|---|
| P0 | 新安装器若沿用旧卸载键或 `InstallDirRegKey`，可能装进旧目录，卸载时 `Delete current.json` + `RMDir /r versions` 破坏旧安装 | `project.nsi` 中 `InstallDirRegKey` 与 `REASONIX_LEGACY_UNINST_KEY` | M2 |
| P0 | 共享数据根 `%APPDATA%\reasonix` 与 Studio/旧 Wails 并发写 | `internal/config/paths.go` | M6 |
| P0 | 打包脚本要求 EXE 数量精确相等；删除 CLI/Guard 必须同批改造，否则构建直接失败 | `package-windows-desktop.sh` | M3/M5 |
| P0 | 崩溃/遥测端点会在运行时向 `crash.reasonix.io` 上报 | 硬编码 `crashEndpoint` / `metricsEndpoint` / `pingEndpoint` | M3 |
| P1 | 更新源与校验白名单指向旧仓库 `keeyangyy/DeepSeek-Reasonix` | `desktop/update_catalog.go` | M7 |
| P1 | Minisign 私钥复用未验证：旧仓库存在 Secret 名称，但无法从外部证明其内容与内嵌公钥匹配 | `gh api .../actions/secrets` 返回名称 | M7（发布前） |
| P1 | AUMID、WebView2 用户数据、单实例锁若不变，会与旧版互相干扰 | `identity.go`、`wails.json` | M2 |
| P1 | 前端本地状态（localStorage/IndexedDB）随 WebView2 用户数据目录变化而重置 | 需 M2 实测 | M2/M6 |

## 7. 测试基线

**本机未执行完整测试**：项目规则禁止本地运行耗时超过 3 分钟的大型测试（desktop 整套约 10 分钟）。以下是可用的验证入口，完整结果应在 CI 或 c675 上采集：

| 范围 | 命令 |
|---|---|
| Go 全量 | `go test ./...` |
| 桌面短测 | `make desktop-test-short` |
| 前端构建 | `cd desktop/frontend && pnpm build` |
| Transcript | `pnpm test:transcript` |
| 流式 | `pnpm test:stream` |
| 安装/更新契约 | `scripts/validate-desktop-release-manifest.sh` 等 |

**基线状态标记为"未测试"**，不得在后续报告中写成"已验证"。

## 8. 待验证项（阻塞发布）

1. Minisign 私钥是否确由用户控制，且能签出与 `238315CA90ACADED` 匹配的签名。
2. 新旧客户端同时访问 `%APPDATA%\reasonix` 时的写入竞争行为。
3. 修改 AUMID/WebView2 目录后，前端本地状态的实际影响范围。
4. NSIS 在"旧版已安装 + 新目录安装 + 卸载"三种组合下的行为。
5. 新仓库 Actions Secrets 需要重新配置，不能跨仓库继承。

## 9. M2 准入结论

- 基线已固定，新仓库已建立，祖先历史完整。
- 命名与图标按用户决定：产品名 `Reasonix Wails`，沿用原图标。
- 首版版本号按 `0.1.0` 规划，tag 形如 `wails-v0.1.0`。
- 安装身份必须整体替换，不能只改 EXE 名。
- 进入 M2 前不需要再确认功能范围；所有功能边界以 `docs/planning/DECISIONS.md` 为准。
