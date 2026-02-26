# Phase 0: 预备阶段

> **目标:** 确保开发环境就绪、关键外部依赖可用 **预计工期:** 1 周 **状态:**
> 🟡 进行中 **最后更新:** 2026-02-25 **环境:** Linux 工作站 **返回:**
> [主开发文档](./README.md)

---

## 0.1 npm scope 申请

- 前往 [npmjs.com/org/create](https://www.npmjs.com/org/create) 创建 `@isqcoder`
  organization
- 确认所有目标包名可用

**当前状态:** ⬜ 待手动操作

> **备注:** 根 `package.json` 已使用 `@isqcoder/isqcoder-cli` 命名，子包仍保留
> `@google/gemini-cli-*` 命名，将在 Phase 1 统一替换。当前需确认 npmjs.com 上
> `@isqcoder` org 已创建。

**目标包名清单:**

| 当前包名                          | 目标包名                         |
| --------------------------------- | -------------------------------- |
| `@isqcoder/isqcoder-cli` (root)   | `@isqcoder/isqcoder-cli` ✅      |
| `@google/gemini-cli`              | `@isqcoder/cli`                  |
| `@google/gemini-cli-core`         | `@isqcoder/core`                 |
| `@google/gemini-cli-sdk`          | `@isqcoder/sdk`                  |
| `@google/gemini-cli-a2a-server`   | `@isqcoder/a2a-server`           |
| `@google/gemini-cli-test-utils`   | `@isqcoder/test-utils`           |
| `gemini-cli-vscode-ide-companion` | `@isqcoder/vscode-ide-companion` |

---

## 0.2 MCP Python SDK 兼容性验证

```bash
conda activate isqcoder
cd /home/alba/Project/isQCoder/isQCodeAgent
pip install -r requirements.txt -e .
python -c "from mcp.server import Server; print('MCP SDK OK')"
```

- 确认 `mcp-python-sdk` 与 isQCodeAgent 的 Python 3.10+ / LangGraph /
  LangChain 依赖无冲突
- `mcp>=1.0.0` 已在 `requirements.txt` 中

**当前状态:** ⬜ 待执行

> **备注:** 使用 conda `isqcoder` 虚拟环境。

---

## 0.3 Docker 镜像验证

- 确认 `arclightquantum/isqc:ubuntu-0.0.1` Docker 镜像可用
- 验证 isqtools 在镜像中可正常 import 和执行
- 确保 CI 环境可以 pull 镜像

**当前状态:** ⬜ 待执行

> **备注:** 基础镜像为
> `arclightquantum/isqc:ubuntu-0.0.1`，自定义 Dockerfile 位于
> `isQCodeAgent/docker/Dockerfile.isq`。

**验证步骤:**

```bash
# 1. 拉取基础镜像
docker pull arclightquantum/isqc:ubuntu-0.0.1

# 2. 验证 isqc 编译器
docker run --rm arclightquantum/isqc:ubuntu-0.0.1 isqc --version

# 3. 验证 isqtools
docker run --rm arclightquantum/isqc:ubuntu-0.0.1 \
    python3 -c "import isqtools; print('isqtools OK')"

# 4. 如需构建自定义镜像
cd /home/alba/Project/isQCoder/isQCodeAgent
docker build -t isq-sandbox:latest -f docker/Dockerfile.isq .
```

---

## 0.4 上游同步基线

- 创建 `upstream` 跟踪分支，对齐当前基线 `v0.30.0-nightly.20260210`
- 确保 `npm run preflight` 在当前代码上通过

**当前状态:** 🟡 部分完成

**已完成:**

- [x] 添加 `upstream` remote → `https://github.com/google-gemini/gemini-cli.git`
- [x] `git fetch upstream --tags` 完成
- [x] 创建本地 `upstream` 分支 @ `v0.30.0-nightly.20260210.8257ec447` (commit
      `64147042f`)

**待完成:**

- [ ] `npm install` (本地 sandbox 权限限制，需手动执行)
- [ ] `npm run preflight` 验证

**Git 状态快照 (2026-02-25):**

```
当前分支: main @ fe65d562d
upstream 分支: upstream @ 64147042f (基线 v0.30.0-nightly.20260210)
upstream/main: 领先基线 ~291 commits
已有本地修改: package.json, AboutBox.tsx, ToolsList.tsx, windowTitle.ts, snippets.ts
```

---

## 辅助工具

已创建自动化设置脚本 `scripts/phase0-setup.sh`，可选择性运行各子任务：

```bash
# 运行所有检查
./scripts/phase0-setup.sh all

# 运行单个任务
./scripts/phase0-setup.sh npm       # 0.1 npm scope
./scripts/phase0-setup.sh mcp       # 0.2 MCP SDK
./scripts/phase0-setup.sh docker    # 0.3 Docker
./scripts/phase0-setup.sh upstream  # 0.4 上游同步
./scripts/phase0-setup.sh preflight # 0.5 Preflight
```

---

## 验证清单

- [ ] npm `@isqcoder` organization 已创建
- [ ] `mcp-python-sdk` 在 isQCodeAgent 虚拟环境中安装成功
- [ ] `arclightquantum/isqc:ubuntu-0.0.1` Docker 镜像可用
- [ ] `npm run preflight` 在当前代码上通过
- [x] `upstream` remote 已添加并 fetch
- [x] `upstream` 跟踪分支已创建 @ 基线 tag
