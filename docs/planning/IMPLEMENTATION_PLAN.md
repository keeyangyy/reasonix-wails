# Reasonix Wails：分阶段实施计划（Codex 执行版）

> 状态：**待执行的工作说明**，不是已完成的代码修改。整理日期：2026-11-05。
>
> 来源：`keeyangyy/DeepSeek-Reasonix` 的 `wails-mine`；目标仓库：`keeyangyy/reasonix-wails`，默认分支 `main`。保留目标分支完整 Git 祖先历史，不在旧 Fork 上直接实施独立化。
>
> **关键约束**：第一阶段先完成独立 Windows 产品和可验证发行链；第二阶段才进行前端／会话架构重构。不要为了“精简”删除已确认的 Agent、插件、会话功能。所有未完成的实现不得写成已交付功能。

## 0. 执行方式及交付规则

**请新会话中的 Codex 按 M0 → M10 顺序执行，一次只处理一个可验收的里程碑。** 每个里程碑：先检查实际源码与依赖、给出涉及文件和风险 → 小范围修改 → 跑相应测试与 Windows 构建 → 提供精简变更摘要、测试结果、剩余问题和提交记录 → 再进入下一步。

硬性规则：

1. **绝对禁止误改原 Fork、Studio 和真实用户数据。** 所有破坏性测试在临时账户、复制数据或专用测试目录进行；不清理 `%APPDATA%` 下的共享权威数据。
2. **不要作全仓库 `reasonix` 字符串替换。** Go module、导入路径、历史协议及数据字段可能需要保留；只调整明确属于新产品身份、发布与旧服务的运行引用。
3. **不要把前端重构混入第一阶段。** 为解除依赖而做的小范围组件调整可以；会话数据所有权、事件流和 Transcript 大改列入第二阶段。
4. **功能保留 ≠ 代码原样保留。** 必须保留已确认的功能与数据契约；具体实现可逐步替换。不能因清理 CLI/Serve/SSH 连带删除 MCP、Agent 核心、Windows 终端、IM Bot 或 SDK。
5. **接口与持久化优先保持向后兼容。** 新旧 Reasonix 与 Studio 可能同时运行；所有共享字段的新增／删除／覆盖必须通过兼容矩阵，尤其是会话、记忆、索引、插件和配置。
6. **没有成功验证签名，禁止发布自动更新。** Minisign、载荷清单和原子回滚不可降级；Authenticode 可选。私钥不应出现在仓库、日志、Issue 或测试附件中。
7. **所有代码、配置及脚本文本默认 UTF-8 无 BOM + LF**（NSIS 等已有编码特殊要求须先验证兼容性；不为统一换行造成无关大面积 diff）。在 Windows 以 PowerShell 7 为主，跨 shell 脚本明确调用其依赖的环境。
8. **每一步保留可回退提交／Tag 和变更说明**，提交前检查 `git status`、`git diff --check`。不得用 `git reset --hard`、大范围 `git clean`、覆盖用户设置作为常规清理手段。
9. **新仓库创建、公开 Release、更新签名身份和删除旧部署**等涉及外部状态或不可逆操作，在执行前让用户确认目标及授权；普通本地编辑与测试可继续按步骤推进。
10. **不假设基线 CI 一定全绿。** 第一步记录既有失败、平台限制和待办，区分“历史失败”和本次引入的回归。

**每步报告模板**：本步目标｜检查到的事实（文件／调用路径）｜修改文件｜保留／删除理由｜实际执行的测试与结果｜未解决风险｜下步建议。未测试则写“未测试”，不得写“已验证”。

## 1. 已确认的最终目标和非目标

| 领域 | 最终约束 |
|---|---|
| Git | 新的非 Fork 仓库、`main`、保留从 `wails-mine` 到基线 SHA 的 Git 祖先；旧 Fork 保留不变 |
| 平台 | 只发行 Windows x64 Wails/WebView2 桌面产品；保留需要的跨平台 Go SDK／格式与通用源码 |
| 安装 | 独立默认目录、卸载注册表键、快捷方式、AUMID、运行锁、WebView2 私有数据；**绝不覆盖旧程序** |
| 用户数据 | Studio/旧程序所需的既有配置、会话、记忆、插件数据路径和格式保持兼容；只隔离产品私有／可再生数据 |
| 发行 | Windows NSIS 安装器 + 版本化便携 ZIP，均保留安全更新；取消正式 CLI/npm/非 Windows 桌面发行 |
| 更新 | 新仓库固定 Release 更新锚点；**沿用当前单锚点及 Stable/Beta 客户端过滤算法**，不改成双锚点；保留镜像、代理、Minisign、安全回滚 |
| 签名 | 3.68 选择**有条件复用**既有 Minisign 私钥：必须证明控制权、隔离和后续维护能力；不满足则另建签名身份并经用户确认 |
| 删除 | SSH/SFTP/Remote Wails、独立 Serve/Web、ACP、正式 CLI/TUI、云账户／论坛／崩溃 Worker、旧远程商店、过时迁移、非 Windows 桌面构建 |
| 保留 | Agent / Control、Windows 终端、MCP、Extension Protocol/SDK/插件兼容、Bot、Heartbeat、LSP、Hooks、Skills、记忆、上下文、会话历史、主题及其它已确认功能 |
| 前端 | 第一阶段尽可能维持现状；第二阶段专项重构事件、状态和 Transcript，确保完整功能回归 |
| 官网 | 精简 Astro 静态官网，以 GitHub Pages 发布；不部署动态云端服务 |

产品展示名、EXE 与安装目录建议采用 `Reasonix Wails` / `reasonix-wails.exe` / `%LOCALAPPDATA%\Programs\Reasonix-Wails`，但这是**待落地的命名提议**；第 M2 步检查实际标识后由用户确认最终公开品牌、图标授权和外部可见名称。内部 `module reasonix` 暂时不改，以防引起不必要的导入冲突。

## 2. 阶段一：独立 Windows 产品与安全精简

### M0 — 固定基线与风险清单（只读优先）

**目标**：对 `wails-mine` 固定可追踪快照，而非按仓库文件名猜测删除范围。

操作：

1. 读取 `git status`、基线 commit SHA、tag、分支、Go/Wails/Node/NSIS/Windows 工具链；记录现存测试情况。
2. 绘制下列运行链：程序入口 → Wails App → Controller/Agent → 会话存储／事件 → 前端；以及安装器 → Launcher → Update Helper → installlayout → Release 锚点。
3. 建立逐文件 **KEEP / REMOVE / REPLACE / COMPAT** 表。扫描 CLI、Serve、ACP、SSH、`remote_*`、Workers、旧域名、安装/卸载标识和发布脚本中的引用；每项必须给出调用方。
4. 对标已确认的 3.1—3.75 功能约束（完整摘要见 `DECISIONS.md`）。不明状态只标为待核，不擅自删。
5. 先执行基线：Go package tests、前端 `pnpm build`、现有与 Transcript、Updater、Installer 有关的测试；保存失败清单及环境说明。

**证据入口**：`go.mod`（当前 `go 1.26.0` / `toolchain go1.26.10`）、`desktop/wails.json`、`desktop/frontend/package.json`（pnpm `10.34.5`）、`scripts/package-windows-desktop.sh`、`.github/workflows/release-windows.yml`、`desktop/build/windows/installer/project.nsi`。

**验收**：提交 `docs/BASELINE_AUDIT.md`（SHA + 依赖图 + 风险表 + 原始测试结果）；未触动用户现有数据或旧程序。

### M1 — 创建独立代码仓库（需授权后创建／推送）

**目标**：新建普通仓库 `keeyangyy/reasonix-wails`，从 `wails-mine` 完整祖先创建 `main`，旧 Fork 不变。

一个可审阅的本地准备过程（示例，**非自动执行命令**）：

```powershell
# 不使用 --depth，保留当前分支完整祖先历史。
git clone --branch wails-mine https://github.com/keeyangyy/DeepSeek-Reasonix.git reasonix-wails
Set-Location reasonix-wails
git switch -c main
# 保留来源远端，另设新仓库 origin；在新仓库实际创建后才推送。
git remote rename origin source-fork
git remote add origin https://github.com/keeyangyy/reasonix-wails.git
git log -1 --format='%H %s'
git remote -v
```

不要重写作者信息、压缩历史、冒充上游官方提交或删除原 LICENSE。新仓库创建和首次 Push 前需用户确认仓库可见性及权限。**不应复制旧 Fork 的 Releases、Issues、Secrets 到新仓库后假装已可用**。

**验收**：`main` HEAD 与 M0 记录的基线一致；祖先链保留；旧 Fork 未受影响；新仓库默认分支正确，项目以非 Fork 身份存在。

### M2 — 独立 Windows 产品身份和目录隔离

**目标**：新安装既不覆盖旧 Reasonix，也不会误用旧程序卸载项和更新指针。

任务：

- 定义**产品身份矩阵**：展示名、版本、EXE、永久 Launcher、Update Helper、专用激活器、portable 根入口、NSIS Product/Uninstall Key、`InstallLocation`、AUMID、快捷方式、托盘、单实例 mutex/IPC、任务栏图标、通知、WebView2 user-data 路径、崩溃日志目录。
- 修改 `desktop/wails.json`、NSIS `project.nsi`、程序入口／平台身份层、资源文件和相关 tests。统一新身份，不仅仅改可执行文件名。
- 默认 per-user 安装；保留用户自选目录和后续升级时的 `InstallLocation`，不得回落覆盖旧 Reasonix 目录。
- **不自动迁移旧产品安装、桌面偏好和旧快捷方式**；旧 Studio 与旧 Wails 的程序、卸载项和更新机制保持原样。
- 共享数据层建立明确白名单：配置、会话、记忆、插件；可再生缓存、窗口布局和运行锁使用新产品命名空间。禁止把所有 `%APPDATA%\reasonix` 自动改名或搬迁。

**验收**：两套产品能同时出现在 Windows 程序列表，快捷方式/通知/单实例行为相互独立；卸载新产品不会更改旧安装或共享权威数据；自定义安装路径升级后仍有效。

### M3 — 删掉不再发布的产品入口与旧云服务

**目标**：按真实引用图完成“产品裁剪”，而不是按文件名批量删除。

**建议拆为独立小提交**：

1. **CLI/TUI/Serve/ACP**：断开独立 CLI/TUI 正式产品入口、`serve` 前端和 ACP 适配器，并将仍被 Wails 使用的 Go Agent 工具、slash command、SDK 和开发测试入口留在内核或替换为内部 Runner。**过渡期不可先删掉打包脚本仍强制要求的 CLI/Guard EXE**；二者的最终物理删除必须和 M5 的安装器、载荷清单改造同一提交组完成。
2. **SSH/SFTP/Remote**：删除远程连接、远程窗口、远程标签、Remote 项目树、远程协议和绑定；保留旧配置字段的无损读写兼容，以及普通 HTTP、模型请求、代理和 Windows 本地终端。检查前端生成绑定、导航、types、CSS、测试、App 生命周期和桌面构建清单。
3. **云服务残留**：删除账户／论坛／崩溃上报 Workers、在线旧插件商店及远程 Registry 后端的运行引用；**不新增**官方 MCP Registry 商店；MCP 手动配置与插件安装完整保留。移除 `crash.reasonix.io` 自动上传，改成本地脱敏诊断及手动 GitHub Issues 反馈。
4. **历史实现**：已确认删除旧 `internal/autoresearch` 兼容代码；精简可证明不再使用的旧迁移（3.59 B），但不删除任何现有用户的 `.reasonix/autoresearch/` 数据或仍需识别的历史字段。
5. **依赖收敛**：待功能调用链清理完成后，检查 `go mod tidy` 结果、前端依赖、测试和脚本，禁止预先删通用依赖造成级联失败。

**验收**：应用没有远程 Serve/SSH/ACP 运行入口和调用；Win 本地终端、MCP、Extension Protocol、Bot、Heartbeat、Hooks、Slash、SDK、会话核心仍可工作；不存在自动遥测请求。M5 之前如仍保留由安装脚本强制引用的旧 EXE，只视为**临时兼容构建依赖**，不得把过渡产物对外发布；M5 最终清零。

### M4 — Windows x64 专用构建与脚本收敛

任务：

- 仅保留 Windows x64 桌面编译与打包；删除 Linux/macOS 桌面安装／WebKit／签名流程及专用 CI；**不因 Windows-only 删除通用 Go API/SDK 和跨平台数据格式**。
- 删掉 npm/CLI/Homebrew 和 Cloudflare Worker 专属发布工作流；保留必要 Go 测试、Benchmark（开发 runner 代替正式 CLI）、CodeQL、Windows 构建发布、Pages。
- 更新 `desktop/frontend/package.json`：移除 Remote 测试、脚本、CSS 对已删除文件的硬引用；保留 Transcript/Updater/WebView2/Plugin 回归测试，并将真正的构建阻塞改为有效检查。
- 处理 pnpm/Go/NSIS 依赖及重现性；避免把 GitHub 运行器与本地 bash/PowerShell 环境混为一谈。

**验收**：Windows x64 clean checkout 的 **Go/Wails 应用构建**、前端 `pnpm build` 与必要测试通过；旧 installer 打包链可能仍依赖 M5 才能切换的 Guard/CLI，因此本步不批准 Release，也不把过渡包装产物列为最终验收。M5 完成后要求从干净检出能完整构建 NSIS/portable，且没有废弃生产载荷依赖。

### M5 — 安装布局、Guard 替换与安全卸载（高风险）

**已核实的实际依赖**：

- `scripts/package-windows-desktop.sh` 当前强制 `reasonix-desktop.exe`、`reasonix-guard.exe`、`reasonix-launcher.exe`、`reasonix-update-helper.exe`、`reasonix-cli.exe`、`reasonix-uninstall.exe`，并校验 **EXE 数量精确相等**；不可直接删 CLI/Guard 而不更新列表。
- `desktop/build/windows/installer/project.nsi` 当前提取/调用 Guard 执行布局激活，维护 `InstallLocation` 和 per-user HKCU 卸载项；必须先替代才删除旧 Guard。
- `internal/installlayout/activate.go` 中默认 `AllowedVersionMembers()` **仍包含 CLI**；必须与新版本载荷清单同步调整。

**执行顺序**：

1. 单独创建 **轻量安装布局激活器**，唯一职责是安全调用既有 `installlayout` 的暂存目录、验证、原子切换 `current.json`、失败回滚；不继承旧 Guard 的安装迁移/云服务逻辑。
2. 将 NSIS 安装器切换为调用新激活器，验证相同或更严格的文件白名单、安全路径边界、幂等性及并发锁。
3. 调整 `installlayout.AllowedVersionMembers()`、NSIS 宏、打包脚本 `required_payload`、EXE 精确计数、签名清单、测试夹具及相关 `Go` 工具，移除 CLI/Guard 条目、纳入新身份。
4. 验证新 Launcher、Update Helper、主程序和 Uninstaller 的 `versions/<version>` + 根目录职责：启动从 `current.json` 决定目标，不覆盖正在运行的旧文件。保留旧版本回退能力。
5. **便携 ZIP** 继续采用版本化布局并支持验签后原地更新，不能变成简单单 EXE/平铺 ZIP。与安装版维护不同的升级根、卸载行为和状态检测，不允许跨产品安装目录误判。
6. Uninstaller 仅删除属于本产品的可执行文件、独立注册表/快捷方式/私有 WebView2 状态；不触碰 Studio、旧 Reasonix 或任何共享会话/配置/记忆数据。

**验收矩阵**：全新安装、覆盖新产品旧版本升级、修改安装路径后升级、升级中取消、内容损坏、签名错误、激活器失败、磁盘满、文件锁定、双进程同时升级、便携版原地升级、便携回滚、卸载后旧程序运行。每项记录实际目录树和 `current.json` 前后值。

### M6 — Studio 数据兼容与并发安全

这一步是**上线阻塞条件**，不应只凭“路径相同”就宣布兼容。

1. 识别旧 `wails-mine`、最新 Studio 当前使用的实际配置／会话／记忆／插件路径、文件格式、索引、锁及写入顺序；建立**权威数据 / 派生缓存 / 产品私有状态**三类清单。若存在版本协议差异，优先用适配器兼容，不直接改写源数据。
2. 用**复制的测试档案**完成：新产品首次启动、加载旧会话、编辑配置、追加一轮对话、读取记忆、回滚、导出、更新索引；比较修改前后的关键字段和未知字段保真。
3. 测试 Studio 与新 Wails 同时打开、相同项目不同会话及相同会话的访问；对数据库写竞争、会话租约、缓存重建、Bot/Heartbeat 单一消费者等设计互斥或明确拒绝并发，不允许静默覆盖。
4. 保留配置中旧 SSH/ACP/Worker 等**兼容字段**，但不启动相应旧功能；不能在保存配置时不加区分地丢弃未知键。
5. 只允许重建真正的缓存；对会话本体、事件日志、Checkpoint 和长期记忆保留备份／回滚能力。

**验收**：已知数据版本的读取／写入／恢复通过；并发测试中无丢消息、损坏数据库、会话串写；旧 Studio 原数据仍能打开。未证明兼容前禁止在用户真实数据上跑自动迁移。

### M7 — Minisign、更新锚点和发布门禁（高风险）

**确认选择的原样保留项**：

- 3.67 A：新仓库的**固定 Release 更新锚点**，使用 `latest.json`、`versions.json`，保留镜像与代理。
- 3.73 **C**：继续**同一个最新版本指针 + 客户端 Stable/Beta 过滤**。用户已长期实际使用，**不得把单锚点重构成双锚点，也不能将此项当成既有设计缺陷**。仅迁移相关 URL 和做回归测试。
- 3.68 **B**：优先判断既有 Minisign 私钥是否完全受控且适合新的产品发布身份；不可把“仓库里有公钥”当作私钥可用的证明。若不满足，需在发布前征得用户同意切换到新签名身份并更新客户端信任公钥。
- 3.74 A：**先全部签名并验证，再公开 Release**；Authenticode 非强制，但若使用，安装后的载荷和外层安装器签名须正确。

**任务**：

1. 整理 `desktop/updater.go`、`desktop/internal/update/verify.go`、`desktop/cmd/sign`、Release 工作流和前端更新界面的所有旧仓库、更新源、下载页面、Redirect allow-list、Manifest 路径及公钥引用。
2. 迁移到新仓库，但保持现有频道过滤逻辑和正式语义；测试“最新为 Beta，Stable 仍应获得正确版本”等真实场景，不引入双锚点。
3. 对 installer/portable、载荷 manifest、manifest 签名、版本清单和签名的嵌入式公钥实施严格验证，任何部分缺失应**拒绝自动更新，不得静默降级**。
4. **修复已有发布时序**：Build → 安装载荷、签名、更新清单与回归验证 → 上传完整素材至 Draft Release → 验证所有预期资源 → **一次性公开发布** → 再原子维护固定锚点；若锚点更新失败，要明确状态、避免传播不完整索引，并支持安全重试。
5. 若需要 GitHub Secrets，要求用户在 GitHub 安全界面配置，不得复制私钥到输出或提交；避免在 Fork 未经授权的 PR 上调用带私钥的发布 job。

**验收**：正常更新、Stable/Beta 分流、代理／镜像、签名损坏、资源缺失、版本目录一致性、失败回滚、定制安装根、跨旧产品更新隔离；没有发布前公开可下载但清单不完整的版本。签名条件无法满足时只交付本地构建／测试产物，**不正式公开自动更新**。

### M8 — 可复现 CI、静态官网和品牌合规

- GitHub Actions 收敛为：Windows x64 构建/测试/发布、必要 Go 检查、CodeQL、GitHub Pages。权限最小化，发布 job 受 tag/来源校验，避免旧 Fork tag 越权。
- 维护精简 Astro 静态官网（介绍、截图、下载、文档、更新日志），部署 Pages，不引入 cloud account/forum/crash Worker。网页与 README 的下载地址只指向新仓库 Release；发布前不得放死链假装已可用。
- 更新 README、CHANGELOG、贡献说明、LICENSE/NOTICE/第三方版权和源头说明；去掉官方身份暗示、旧徽章、旧社区/赞助链接及旧 CLI 安装命令。
- **品牌发布门**：核实新名称与图标的独立发行权；未确认时使用可授权的独立素材，不能以 MIT 源码许可代替图标／商标许可。

**验收**：Pages 实际可打开且下载指向正确；发布工作流不调用 CLI/npm/Worker/非 Windows 桌面；全部许可证和来源说明完整。

### M9 — 全功能回归及安装/更新验收

必须在 **Windows x64 真实环境** 验证：

| 类别 | 最低验收场景 |
|---|---|
| 启动／多实例 | 新产品独立启动，旧 Studio/旧 Wails 并存；托盘、通知、窗口位置与 WebView2 故障恢复 |
| Agent | 多提供商、计划、审批/Guardian、Hooks、Slash、工具调用、子代理及取消 |
| 会话 | 新建、重开、多标签、Inbox/Steer、重启恢复、长会话流、自动／手动压缩、回退／检查点 |
| 持久化 | 与 Studio 共享已有兼容会话／记忆／插件配置，未知字段不丢、跨进程冲突受控 |
| 工具 | PowerShell/CMD/Bash 本地终端、Git Worktree、LSP、图片、文件引用、Web Search/Fetch、MCP 与扩展 Sidecar |
| 自动化 | Heartbeat、Bot、任务监控、托盘隐藏时继续运行；无 Windows 登录自动启动新增行为 |
| UI | 主题、字体/缩放、简繁英、Markdown/KaTeX、Diff、历史查询、回收站、导出四种格式 |
| 安装 | NSIS 新装／升级／卸载／自定义路径；portable 安全自更新／回滚；旧产品文件和共享数据未变 |
| 发行 | GitHub Release 资源完整、Minisign 正确、Stable/Beta 现行算法正确、无旧服务运行调用或自动上传 |

输出 `docs/VALIDATION_REPORT.md`：每项环境、输入、实际结果、日志/截图路径及未覆盖项。**有 P0 级损坏、会话丢失或安装误卸载问题，不得发布正式版本**。

### M10 — 阶段一封版与阶段二基线

完成 README 中的真实构建安装说明、Release Notes、当前功能及已知限制。建立稳定基线 tag/commit，保留 M0 基线对比与回退途径。**用户明确确认后**才公开首个 Release。

第一阶段交付判定：

- [ ] 独立仓库/Windows 安装身份已稳定，旧程序未受影响。
- [ ] CLI/Serve/ACP/SSH/Worker/非 Windows 发行目标清理完成。
- [ ] Agent、插件、会话、终端、Bot、Heartbeat 等承诺功能无严重退化。
- [ ] NSIS + portable 可安全安装、升级、回滚和卸载。
- [ ] 私钥控制条件已核实，Minisign 和发布门禁通过。
- [ ] Shared Studio 用户数据兼容和并发风险有实际验证证据。
- [ ] 当前单锚点 Stable/Beta 更新行为回归通过。
- [ ] 具有可恢复的 Git 基线、构建测试结果及已知问题记录。

## 3. 阶段二：前端与会话体系渐进重构（第一阶段封版后）

**不是重新实现整个 Agent 内核。** 聚焦会话的事件路由、状态所有权、实时/历史统一与渲染层；保留现有 Wails + Go 的能力与可共享数据格式。参考 Deepzora 的思想是“单一权威状态、稳定 ID、减少重复持久化”，**不直接搬用其 Electron 源码或删除 Reasonix 仍依赖的历史机制**。

### F0 — 映射现状和建立性能基线

- 画出一次请求从 Compose → Wails Bridge → Controller → Agent Loop → Session 持久化 → 事件 → 前端 Store → Transcript 的完整链路。
- 核实目前哪些是权威状态、哪些是派生视图：history/event JSONL、会话索引、前端缓存、多标签 Controller、Inbox、Worktree、后台任务和 WebView2 恢复。
- 收集用户已报告的问题：`/clear` 实际清理与刷新、Windows 审批弹窗重复、思考块展开规则、语音注入选项、语言切换导致配置损坏、思考面板宽度不统一；按重现率和数据风险排序。
- 保留现有 `test:transcript`、`test:stream`、`test:transcript-browser`、`test:app-lifecycle` 等测试，测量实际基线并记录环境，**不要编造 FPS 或延迟指标**。

### F1 — 明确不变量与接口契约

- 会话身份：使用已有的稳定 SessionID/TurnID/消息标识；若某处仅靠文件路径推断身份，用适配层逐步修正。
- 事件与命令：明确创建、追加、部分输出、完成、取消、审批、工具结果、恢复、压缩、清空、回退、转接和多标签切换的顺序语义。
- 数据所有权：单一权威的 Go 运行／持久化状态；前端 Store 是可重建投影。不得让多个组件各自重新解析文件并竞争写入。
- 兼容：不在此阶段直接修改共享 Studio 会话 schema；如确需新版本协议，先设计双读、回滚及 Studio 测试，再申请决策。
- 并发不变量：旧回调不能污染新激活标签；同一事件重复投递须幂等；断线恢复不能重放工具的有副作用操作。

**交付**：`docs/SESSION_ARCHITECTURE.md`、事件/状态图、契约和故障注入测试计划。先经用户审阅，然后再改核心代码。

### F2 — 统一 Wails Bridge 与会话前端投影

将散落的前端订阅／路由拆成稳定边界：`SessionCommandService`（发命令）、`SessionEventRouter`（按会话分发）、`SessionProjection`（确定性状态投影）和 UI 选择器／视图组件。名称为设计建议而非要求新建对应目录。通过兼容适配层切入，避免单次替换所有前端调用方。

测试：多会话并行、Tab 快速切换、迟到事件、重复事件、乱序可检测场景、重启回放、Clear/Undo/Compaction 后历史一致性。

### F3 — Transcript 和虚拟滚动重构

保留当前已确认的流式渲染、长会话虚拟化、滚动锚点、跨消息逻辑选择、KaTeX、图片、工具卡片和思考折叠。重新划分数据投影与视觉测量：

- 只有一个被明确授权的滚动写入者（保留现有 Scroll Writer 校验思想）。
- 历史与实时输出使用同一标准消息投影，切换/回放不出现重复消息。
- 思考展开策略：当前流式思考可展开，其余按用户期望折叠；保持用户主动操作优先级。
- 测试动态高度、表格、LaTeX、代码块、流式追加、重新测量、跨条目选择和自动滚动/手动滚动抢占。

每次迁移 1 个交互路径，用旧组件和新组件的回归对比决定是否切换；不能以取消虚拟化来规避长会话 Bug。

### F4 — 输入、队列、多标签和恢复一致性

聚合 Compose、文件附件、`@` 引用、Slash、Inbox/Steer、Todo、后台任务、审批和 Undo 的前端生命周期。Controller 必须明确哪些命令属于当前会话、哪些作用于异步运行任务；用户快速切换会话、停止任务或重启应用时不能把操作投递到错误目标。

### F5 — 完整可观测性与性能、安全回归

使用脱敏本地追踪关联 `session / turn / event / render`，保留控制级日志与前端调试开关；不上传遥测。建立多标签并发、超长历史、断线重连、语言配置切换、WebView2 恢复、数据 schema、插件和 Bot 的集成测试。性能目标根据 F0 基线和用户可感知问题共同确定。

### F6 — 完成切换、清理旧实现并封版

先完成新/旧路径验收，再删除重复 Store、事件订阅和旧兼容接口；禁止先删再补。输出架构说明、运行排错指南、交互验收记录，独立 tag 发布。

## 4. 明确的释放阻塞项与非阻塞项

### 正式公开发布前必须解决

1. **签名私钥控制权**：3.68 B 只是条件选择，不代表旧私钥已验证。若不满足，须申请采用新密钥。
2. **共享数据安全**：真实 Studio 的 schema / 锁 / 并发访问仍需运行时验证。发现写坏风险则禁止对真实共享数据试运行。
3. **安装器产品身份与卸载作用域**：必须通过旧版共存、不同安装路径、卸载不删共享数据测试。
4. **品牌／图标及授权边界**：独立公开发行不可暗示官方身份；第三方素材使用权需确认。
5. **发布门禁与签名工件**：未通过就只构建测试，不把未签名更新设置成受信任发行物。

### 不应被错误列为阻塞

- **单更新锚点本身不是冲突。** 用户已明确其现有 Stable/Beta 算法长期正常运行；按 3.73 C 原样保留并测试。
- **不需要在第一阶段重构会话前端**；只有 P0 数据损坏等阻塞风险须先修复。
- 不需要第一阶段购买域名、部署动态服务、接入官方 MCP 在线 Registry、创建 CLI/npm 产品。
- 原模块内某些历史 Go 命名暂未改，不构成独立 Windows 应用身份冲突。

## 5. 各里程碑建议提交边界

| 步骤 | 建议提交前缀 | 不允许混入 |
|---|---|---|
| M0 | `docs: baseline audit` | 功能删除、公开发布 |
| M1 | `chore: establish independent repo` | Git history rewrite |
| M2 | `refactor(windows): isolate app identity` | 共享核心数据路径迁移 |
| M3 | `refactor: remove obsolete surfaces` | 前端会话体系整体重写 |
| M4 | `build: windows-only pipelines` | 删除通用 Go SDK |
| M5 | `build(installer): replace guard activation` | 无验证的卸载/清理 |
| M6 | `test: studio shared-data compatibility` | 直接改真实用户数据 |
| M7 | `build(release): signed atomic publication` | 在签名前公开 Release |
| M8 | `docs: independent site and provenance` | 旧官网/社区冒充 |
| M9 | `test: windows end-to-end acceptance` | 未测试却宣称通过 |
| M10 | `release: phase-one baseline` | 未授权对外发布 |

## 6. 给新会话的首条执行指令（可直接复制）

> 我准备按 `docs/IMPLEMENTATION_PLAN.md` 分步实现 `reasonix-wails`。请先阅读 `README.md`、`README.zh-CN.md`、`docs/DECISIONS.md` 和 `docs/IMPLEMENTATION_PLAN.md`。**先做 M0：仅审计 `wails-mine` 当前 HEAD、调用关系、构建与测试基线，产出 `docs/BASELINE_AUDIT.md` 和建议的最小 M1 改动列表，不要立即执行 M1—M10，不要动旧 Fork 或真实 Studio 用户数据，也不要发布 Release。** 每一步完成都要给出修改文件、测试证据和风险，请我确认再执行下一里程碑。第一阶段禁止顺带重写前端会话系统；第二阶段单独设计。尤其注意 3.68 B 条件复用私钥、3.73 C 保留现有单锚点频道过滤，以及 3.70 A Guard 职责迁出。

## 7. 关键源码索引（原分支，执行时重新核对 HEAD）

- [Go 依赖](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/go.mod)
- [Wails 配置](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/wails.json)
- [前端 scripts](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/frontend/package.json)
- [NSIS 安装器](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/build/windows/installer/project.nsi)
- [Windows 打包脚本](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/scripts/package-windows-desktop.sh)
- [原子版本激活](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/internal/installlayout/activate.go)
- [Windows Release workflow](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/.github/workflows/release-windows.yml)
- [更新器](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/updater.go)
- [更新签名验证](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/internal/update/verify.go)
- [流式渲染控制](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/frontend/src/lib/transcriptKernel.ts)
- [会话 Inbox](https://github.com/keeyangyy/DeepSeek-Reasonix/blob/wails-mine/desktop/inbox_app.go)

