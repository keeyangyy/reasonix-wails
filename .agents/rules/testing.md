# 测试

证明改动按预期工作：功能、bug 修复、边界与并发。预检只防 CI 红，不做功能判断。

## 时机

- 改完功能：跑受影响用例，确认行为符合预期。
- 修 bug：先复现、再修、再验证、最后固化成用例。
- 合并 main 前：与预检一起做最后一轮。
- 全量测试不在本地跑；本地只跑受影响范围，完整测试交云端 CI。

## bug 修复顺序

1. **先复现**：改动前用最小步骤稳定复现；复现不了先别改。
2. **再修**：改代码。
3. **验证**：同一手段再跑一次，确认现象消失。
4. **防回归**：把复现步骤固化成用例。

## GUI / 视觉改动

桌面端是 Wails + WebView2，纯视觉问题按三级取证：

- **一级：用户截图**。适合 hover、间距、颜色等一眼可见的问题。
- **二级：单测断言判断函数**。根因在渲染前判断逻辑时，抽成纯函数直接断言。
- **三级：vite dev server + 浏览器**。涉及真实排版（重叠、跳动、位移）时用。

前端改动必须给用户看渲染图再提交，并说明改前改后差异。

### 浏览器验证的两个陷阱

- **mock 数据未必有目标状态**：未读、等待确认、运行中等状态由本地存储驱动，默认通常是“全部已读”。复现要手动改基线，例如：

```js
localStorage.setItem('projectTree:readActivityBaselineAt', '1');
localStorage.removeItem('projectTree:readActivity');
```

- **无头浏览器不推进 CSS 过渡**：`getComputedStyle` 会返回起始值。读之前先结束动画：

```js
document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) {} });
```

## 先分层，再上机

渲染类问题先拆数据层和渲染层，不要一上来就构建截图。

1. **数据层**：用 node 跑真实 reducer + 真实会话数据，打印 `items` 的 `kind` 序列和目标元素索引。
2. **渲染层**：数据层已证明元素在正确位置、仍看不见，才构建 + 截图。

## 应用内自检

构建版里临时埋点，把关键信息写回后端日志：

- 组件挂载时记录 `getBoundingClientRect()`、`getComputedStyle`（display/visibility/opacity）、`document.elementFromPoint(中心点)`；
- 后端加 `XxxDiag(line string)` 写到 `%APPDATA%\reasonix\diagnostics\`，前端通过 `window.go.main.App.XxxDiag?.()` 调用；
- 同一份日志里也记后端判断结果，前后端对不上时能看出断在哪边。

交付前 `rg TEMP-DIAG` 确认无残留，并还原 `wailsjs/` 生成文件里多出来的方法。

## Wails 截图

- `qwinsta` 里目标用户会话必须是 **Active**（RDP 连着）；ssh 服务会话拿不到桌面。
- 用 `schtasks` 投递到用户会话，脚本里先最大化 + `BringWindowToTop` + `SetForegroundWindow`。
- 不依赖 WebView2 的 CDP 端口，常被宿主或其它进程占用/覆盖。

## 隔离要求（必读）

会访问或修改 Reasonix 用户状态的 Go 测试/后端集成测试，先确认 `TestMain` 走 `internal/testenv` 的 `IsolateUserState`：清除继承的 `REASONIX_HOME` 并重定向用户目录。缺隔离先补防线再运行。纯前端 JSDOM/Vitest 不要求 Go `TestMain`。

- 输出出现真实用户数据目录时立即停止并查隔离。
- 可能触发桌面项目聚合的宿主测试，运行前关闭 Reasonix 桌面应用。
- 用合成夹具或单独目录的数据副本，禁止把用户运行目录当可写夹具。
- 事故成因见 [experiences.md](experiences.md)。

## 行为验证

- 受影响包：`go test ./<包>/ -count=1`；desktop 相关在 `desktop/` 下单独跑。
- 前端跑受影响的 Vitest 用例，而不是整个套件。
- 断言落在用户可见结果上（输出、状态、渲染）。

## 竞态回放

覆盖后台运行后切入、ask 等待/回答、较早消息分页、失败重试、流结束与会话切换交错。

- 用 deferred promise、fake timer 或可暂停的 `requestAnimationFrame`，不靠随机等待。
- 检查消息唯一性、会话归属、工具/思考/正文顺序、直播与最终正文一致、历史补齐不覆盖新内容。

## 布局验证

JSDOM 不提供真实排版。用 Playwright 固定视口，在直播首批字符、中途和结束后读 `Range.getClientRects()`，检查连续句子、滚动锚点、折叠与按钮是否跳动或重叠。

- `desktop/frontend/bench/transcript-live-layout.mjs`
- 扩大验证：`npx -y pnpm@10 run test:transcript-browser`

## 人工实测

自动用例覆盖不到的交互（真实切换、拖拽、系统集成）由人工点一遍；前端改动用渲染图给用户确认后再提交。
