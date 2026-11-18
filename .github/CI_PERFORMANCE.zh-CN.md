# CI 与发版执行

[English](CI_PERFORMANCE.md)

## 工作流结构

`ci.yml` 是所有 PR 和 push 到 main 的唯一常规入口。分类器按改动选择
文档、Workflow、Go、SDK、Desktop 检查；push main 执行完整代码基线，但不执行 memory 筛查。
`ci-full.yml` 负责手动和每晚全量回归。 `gate` 要求分类选中的 lane 为
`success`，未选中的 lane 为 `skipped`；Ruleset 同时要求
`gate` 和 `CodeRabbit`。

实际工作放在可复用工作流里：`check-changes`、`check-docs-rules`、
`check-lint`、`check-go`、`check-desktop`、`check-codeql`、`check-memory`。
每个文件只负责一件事，也能单独排查。可复用工作流读不到调用方的 `changes`
job，因此 diff 判定结果通过 inputs 传入；它也不能超过调用方的权限，所以入口
文件统一授予 `security-events: write` 供 CodeQL lane 使用。

## Desktop PR 检查

`desktop / desktop-prepare` 统一生成 Wails 绑定并构建一次 Linux 前端，产物供
`desktop / desktop-frontend`、`desktop / desktop-browser`、`desktop / desktop-go`
三个独立 job 使用。`check-desktop.yml` 内的 `desktop` 汇总拒绝失败、取消和
意外跳过；只有路径检测成功且判定无关时，才接受各分组跳过。随后 `gate` 把该
汇总与其余所有 lane 一起判定。

`node desktop/frontend/scripts/run-ci-tests.mjs --list` 可以查看单测清单。
它展开原有专用脚本和生命周期钩子，自动发现新增测试，并保留每个 TypeScript
测试原有的 loader，每个套件只执行一次。未知命令语法或冲突调用会直接失败。
CI 同时运行两个隔离进程，历史性能基准在它们结束后单独运行。
本地仍可使用原有的 `pnpm test:*` 专用命令。

## 内存筛查

协议 v2 仍要求三个独立进程，每个完成 128 轮 full、128 轮 windowed、
128 轮 safety 和 512 轮 mixed 往返，保持相同检查点、五份堆快照、GC、
稳定帧等待与判定阈值。只有明确启用 mock 内存 soak 的 URL 会去掉夹具人为
设置的 1.5 秒 hydration 延迟；加载仍经过异步定时器任务。
普通浏览器和原生几何测试继续使用原来的延迟路径。

采样时鼠标停在会话行之外；布局切换后先完成一次会话往返，再记录预热基线，
避免采到菜单的临时状态。报告声明协议版本，汇总拒绝旧协议。
`timings.json` 在测试宿主侧记录导航、稳定帧等待、GC、堆快照与解析的次数、
总耗时和最大耗时。短程 profiling 仅用于诊断，不能通过完整筛查门禁。
筛查通过仍不等于完成离线堆引用归因。