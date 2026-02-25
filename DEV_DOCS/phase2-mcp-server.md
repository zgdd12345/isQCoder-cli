# Phase 2: isQCodeAgent → MCP Server 封装

> **目标:** 将 isQCodeAgent 的核心能力封装为 MCP (Model Context Protocol)
> Server，供 isQCoder-cli 调用。这是整个方案的关键桥梁。  
> **预计工期:** 2–3 周  
> **状态:** 🟡 进行中  
> **前置依赖:** Phase 0 (MCP SDK 验证), Phase 1 (包名已完成)  
> **返回:** [主开发文档](./README.md)

---

## 2.1 架构设计

```
isQCoder-cli (TypeScript)
    │
    │  MCP Protocol (stdio / SSE)
    │
    ▼
isqcoder-mcp-server (Python)
    │
    ├── tools/
    │   ├── isq_compile      # 编译 .isq 文件
    │   ├── isq_simulate     # 模拟运行量子程序
    │   ├── isq_auto_fix     # 编译-修复-进化循环 (核心)
    │   ├── isq_generate     # 根据描述生成 isQ 代码
    │   ├── isq_rag_search   # 搜索 isQ 知识库
    │   ├── isq_fast_path    # 快速路径模板匹配
    │   ├── isq_rules_query  # 查询经验规则库
    │   └── isqtools_run     # 执行 isqtools Python 代码
    │
    ├── resources/
    │   ├── isq://language-spec   # isQ 语言规范
    │   ├── isq://stdlib          # 标准库参考
    │   └── isq://examples/{name} # 算法示例（动态扫描）
    │
    └── prompts/
        ├── quantum-task         # 量子任务 prompt 模板
        └── debug-quantum        # 量子调试 prompt 模板
```

---

## 2.2 运行环境说明

> [!IMPORTANT] **本地 vs 远程分工**
>
> - **本地开发机** — 仅进行代码编写、语法检查和静态分析
> - **远程服务器** — Python 虚拟环境创建、依赖安装、MCP
>   Server 启动运行、Docker 容器执行（isQ 编译/模拟）、端到端集成测试
>
> MCP Server 和 Docker 沙箱均需要远程服务器环境支持，不在本地执行。

---

## 2.3 MCP Server 实现

> [!NOTE] **前置条件:** Phase 0 中已完成 `mcp-python-sdk`
> 安装和兼容性验证（远程服务器）。

### 实现文件结构

在 `isQCodeAgent` 项目中新增 `src/isq_agent/mcp_server/` 模块：

```
src/isq_agent/mcp_server/
├── __init__.py    # 包初始化，版本号
├── __main__.py    # 入口点：python -m isq_agent.mcp_server
└── server.py      # 核心实现：Tools/Resources/Prompts 注册
```

### 关键设计决策

1. **异步包装**: 所有 isQCodeAgent 组件都是同步的，通过 `asyncio.to_thread()`
   包装为非阻塞调用
2. **双传输模式**: 支持 `stdio`（生产用）和 `SSE`（调试用）两种 MCP 传输方式
3. **懒加载**: 各组件在首次调用时才加载导入，避免启动时的重依赖
4. **错误降级**: RAG 检索等可选组件初始化失败时 graceful fallback
5. **日志隔离**: stdio 模式下日志写入 stderr，不干扰 MCP 协议通信

### 启动方式（远程服务器上执行）

```bash
# 标准 stdio 模式（用于 isQCoder-cli 配置）
python -m isq_agent.mcp_server

# SSE 调试模式
python -m isq_agent.mcp_server --transport sse --port 8765

# 日志级别控制
python -m isq_agent.mcp_server --log-level DEBUG
```

---

## 2.4 MCP Tools 详细定义

| MCP Tool          | 输入                     | 输出                                     | 复用 isQCodeAgent 组件               |
| ----------------- | ------------------------ | ---------------------------------------- | ------------------------------------ |
| `isq_compile`     | `code`, `file_path`      | `{success, errors[], warnings[]}`        | `executor.py` + `error_parser.py`    |
| `isq_simulate`    | `code`, `shots`, `debug` | `{probabilities, stdout, stderr}`        | `executor.py` + `result_verifier.py` |
| `isq_auto_fix`    | `task`, `max_iterations` | `{code, iterations, rules_learned[]}`    | 完整 `multi_agent/graph.py` 流水线   |
| `isq_generate`    | `task`, `algorithm_type` | `{code, plan, explanation}`              | `coder.py` + `planner.py`            |
| `isq_rag_search`  | `query`, `top_k`         | `{results[{content, score, source}]}`    | `rag/retrieval/`                     |
| `isqtools_run`    | `python_code`, `timeout` | `{stdout, stderr, exit_code, figures[]}` | `docker_executor.py` (扩展)          |
| `isq_fast_path`   | `task`                   | `{code, template_name}` 或 null          | `fast_path.py`                       |
| `isq_rules_query` | `category`, `keyword`    | `{rules[]}`                              | `rule_store.py`                      |

---

## 2.5 isQCoder-cli 侧 MCP 配置

在 `~/.isqcoder/settings.json` 中配置 MCP Server：

```json
{
  "mcpServers": {
    "isqcoder": {
      "command": "python",
      "args": ["-m", "isq_agent.mcp_server"],
      "cwd": "/path/to/isQCodeAgent",
      "env": {
        "LLM_PROVIDER": "zhipu",
        "ISQC_DOCKER_IMAGE": "isqc-python:latest"
      }
    }
  }
}
```

> 示例配置文件见 `DEV_DOCS/examples/mcp-settings.example.json`

---

## 2.6 快速路径集成

将 isQCodeAgent 的 11 个快速路径模板通过 MCP 暴露：

```
用户输入: "生成一个 Bell 态程序"
    ↓
isQCoder-cli LLM 判断 → 调用 isq_fast_path tool
    ↓
isQCodeAgent fast_path.py → 匹配 "bell_state" 模板
    ↓
返回预编译代码 (0 LLM 调用, <1s)
    ↓
可选: 调用 isq_simulate → 验证结果
```

---

## 2.7 依赖变更

### 新增依赖

- `mcp>=1.0.0` — MCP Python SDK（已添加到 `requirements.txt`）
- `starlette`、`uvicorn` — SSE 模式可选依赖（由 `mcp` SDK 间接引入）

### 新增入口点

- `pyproject.toml` 中添加 `isqcoder-mcp-server` 脚本入口

---

## 验证清单

### 本地完成（代码开发）

- [x] `src/isq_agent/mcp_server/` 模块结构创建
- [x] `server.py` — 8 个 MCP Tools 注册实现
- [x] `server.py` — Resources 注册（language-spec, stdlib, examples）
- [x] `server.py` — Prompts 注册（quantum-task, debug-quantum）
- [x] `__main__.py` — stdio/SSE 双传输模式入口
- [x] `requirements.txt` — 添加 `mcp` 依赖
- [x] `pyproject.toml` — 添加 `isqcoder-mcp-server` 入口点
- [x] `tests/test_mcp_server.py` — 单元测试
- [x] `DEV_DOCS/examples/mcp-settings.example.json` — 配置示例
- [x] Python 语法校验通过（`ast.parse`）

### 远程服务器执行（运行时验证）

- [ ] 创建 Python 虚拟环境并安装全部依赖（含 `mcp`）
- [ ] `python -m isq_agent.mcp_server` 可正常启动
- [ ] `pytest tests/test_mcp_server.py` 单元测试通过
- [ ] Docker 镜像可用，`isq_compile` / `isq_simulate` tools 可正常调用
- [ ] `isqtools_run` 能在 Docker 沙箱中执行 Python 代码
- [ ] isQCoder-cli 能连接 MCP Server（端到端集成测试）
