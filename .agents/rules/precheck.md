# 本地预检

目标：在 push 前发现云端 CI 会红的问题，不判断功能是否正确。先跑第 1 档，按改动面补第 2 档，第 3 档交云端。

执行位置：仓库所在的本地盘。不要经 SMB / 网络挂载盘执行，极慢。

## 时机

- 分支开发完即跑第 1 档，不只 push 前。
- 补测试/补文档后重跑对应档，别只跑改动的那一项。
- 合并 main 前再跑一次第 2 档的相关项。

## 第 1 档｜秒级

| 检查 | 覆盖 |
|---|---|
| `git diff --check` | 行尾空白、末尾换行 |
| `gofmt -l .` | 根模块格式；desktop 嵌套模块单独处理 |
| `go run ./tools/repolint` | 行数预算、essay、测试文件规模；不放宽 baseline |

## 第 2 档｜按改动面

| 改动 | 检查 |
|---|---|
| 根模块 Go | `go build ./...`；`golangci-lint run ./...`（与 CI 版本口径对齐） |
| 受影响包 | `go test ./<包>/ -count=1` |
| desktop 或依赖根包 | `desktop/` 下 `go build ./...`，只跑受影响用例 |
| 前端 | `desktop/frontend` 下 `npx -y pnpm@10 run build` |

前端预算以 `desktop/frontend/scripts/check-bundle-budget.mjs` 当前阈值为准；接近上限时优先复用现成 key 或把非首屏样式挪进 lazy chunk，不放宽阈值。

## 第 3 档｜交云端

workflow 契约与全量测试在云端跑；本地只跑能覆盖本次改动的最小范围。`bash scripts/check-wails-pin.test.sh`、`node --test scripts/*.test.mjs` 等脚本按需跑，开发机缺工具时以 CI 为准。

## 与测试的分工

预检只保证机器检查通过；功能是否正确看 [testing.md](testing.md)。
