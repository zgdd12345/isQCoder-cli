# Phase 4: isqtools Python 调用链

> **目标:** 实现完整的 Python → isQ 量子计算工作流  
> **预计工期:** 2–3 周  
> **状态:** 🟡 进行中  
> **前置依赖:** Phase 2 (MCP Server 就绪)  
> **返回:** [主开发文档](./README.md)

---

## 4.1 核心工作流

这是本项目的最终目标工作流：

```
用户: "用 Python 实现 Grover 搜索算法"
    ↓
isQCoder-cli (Gemini LLM)
    │
    ├── 1. 调用 isq_rag_search("Grover algorithm")
    │      → 获取 Grover 算法的 isQ 实现参考
    │
    ├── 2. 生成 Python + isQ 混合代码:
    │      ├── grover.isq      # isQ 量子核心
    │      └── main.py         # Python 驱动层 (isqtools)
    │
    ├── 3. 调用 isq_compile(grover.isq)
    │      → 检查编译是否通过
    │      → 若失败: 调用 isq_auto_fix 自动修复
    │
    ├── 4. 调用 isqtools_run(main.py, isq_files=[grover.isq])
    │      → 在 Docker 中执行 Python 代码
    │      → Python 通过 isqtools/subprocess 调用编译好的 isQ 程序
    │      → 返回量子模拟结果
    │
    └── 5. 展示结果 + 解释量子态分布
```

**或使用 `isqtools_auto_fix` 一键完成步骤 3-4:**

```
用户: "用 Python 实现 Grover 搜索算法"
    ↓
isQCoder-cli → isqtools_auto_fix(python_code, isq_files, task_description)
    │
    ├── 执行 Python+isQ 混合代码
    ├── 若 isQ 编译错误 → 自动调用 isq_auto_fix 修复 → 重试
    ├── 若 Python 运行时错误 → 返回结构化诊断 → LLM 重生成
    ├── 若 isqtools API 错误 → RAG 检索正确用法 → LLM 重生成
    └── 最多 3 轮重试
```

---

## 4.2 isqtools_run MCP Tool 实现

### 增强后的接口（已实现）

```python
@server.tool("isqtools_run")
async def run_isqtools(
    python_code: str,
    isq_files: list[dict] = [],      # [{"filename": "grover.isq", "content": "..."}]
    timeout: int = 60
) -> ExecutionResult:
    """
    在 Docker 沙箱中执行 isqtools Python 代码:
    1. 创建临时目录
    2. 将 python_code 写入 main.py
    3. 将 isq_files 中的所有 .isq 文件写入同一目录
    4. Docker run: isqc-python:latest python main.py
    5. 解析输出 (stdout, stderr, exit_code, execution_time)
    """
```

### 关键改进（相比 Phase 2 版本）

- **isq_files 参数**: 支持将 `.isq` 文件与 Python 代码一起放入 Docker 容器
- **直接管理临时目录**: 不再依赖
  `DockerManager.execute_code`，直接创建临时目录和 Docker 命令
- **Python 专用命令**: 使用 `python main.py` 而非 `isqc` 命令

---

## 4.3 isqtools_auto_fix MCP Tool（新增）

### 自动修复闭环

当 `isqtools_run` 执行失败时的修复流程：

```
isqtools_run 失败
    ↓
错误类型判断 (_classify_isqtools_error):
    ├── isQ 编译错误 → isq_auto_fix (复用 isQCodeAgent 编译循环)
    │                   → 修复 .isq 文件 → 重新执行
    ├── Python 运行时错误 → 结构化诊断 + RAG 辅助
    │                       → 返回给 isQCoder-cli LLM 重新生成
    ├── isqtools API 错误 → RAG 检索 isqtools 正确用法
    │                       → 返回给 isQCoder-cli LLM 参考
    └── 超时错误 → 直接中止
    ↓
修复后重新执行
    ↓
最多 3 轮
```

### 错误分类算法

| 错误类型         | 识别特征                                               | 修复策略                            |
| ---------------- | ------------------------------------------------------ | ----------------------------------- |
| `isq_compile`    | stderr 包含 `isqc`、`.isq`、`qbit` 等 + 编译错误关键词 | 调用 `run_multi_agent` 编译修复循环 |
| `python_runtime` | Python `Traceback`、`NameError`、`TypeError` 等        | 返回结构化诊断给客户端 LLM          |
| `isqtools_api`   | `isqtools`、`ImportError`、`ModuleNotFoundError`       | RAG 检索正确 API 用法               |
| `timeout`        | exit_code=-1 + "超时" 关键词                           | 直接中止                            |
| `unknown`        | 以上均不匹配                                           | 返回原始错误信息                    |

---

## 4.4 Python 代码生成模板（System Prompt）

System Prompt 中注入 isqtools 使用模式（已集成到 `snippets.ts`）：

```python
# 模式 1: 直接编译运行 .isq 文件
import subprocess
result = subprocess.run(["isqc", "run", "--debug", "program.isq"],
                        capture_output=True, text=True)

# 模式 2: 通过 isqtools SDK
import isqtools
circuit = isqtools.Circuit()
circuit.load("program.isq")
result = circuit.simulate(shots=1000)
print(result.probabilities)

# 模式 3: 混合编程 (推荐)
# 用 Python 生成参数 → 传入 isQ 程序 → 解析量子结果 → Python 后处理
```

### System Prompt 集成

- 新增 `renderIsqtoolsWorkflow()` 函数在 `snippets.ts` 中
- 包含推荐工作流步骤、三种编程模式、isQ 语法快速参考
- 在 `promptProvider.ts` 中通过 `isqtoolsWorkflow` section 控制开关
- 当前默认启用

---

## 4.5 架构决策

### 为什么 \_run_isqtools_in_docker 不使用 DockerManager？

`DockerManager` 是为 isQ 编译设计的，其 `execute_code` 方法会自动执行
`isqc compile/run` 命令。对于 Python 执行场景，我们需要：

1. 写入多个文件（`.py` + 多个 `.isq`）到同一目录
2. 使用 `python main.py` 而非 `isqc` 命令
3. 更精细的 Docker 参数控制

因此直接管理 `subprocess.run(["docker", "run", ...])` 更合适。

### 为什么 Python 运行时错误不在 MCP Server 端自动修复？

Python 代码的重生成需要 LLM 能力，而 MCP
Server 不直接调用 isQCoder-cli 的 Gemini LLM。因此 `isqtools_auto_fix`
对 Python 错误仅提供**结构化诊断**（traceback 解析 +
RAG 辅助），由 isQCoder-cli 的 LLM 根据诊断结果重新生成 Python 代码。

---

## 验证清单

### 本地完成（代码开发）

- [x] `server.py` — `isqtools_run` 增强：支持 `isq_files` 参数
- [x] `server.py` — 新增 `_run_isqtools_in_docker` 独立执行函数
- [x] `server.py` — 新增 `_classify_isqtools_error` 错误分类
- [x] `server.py` — 新增 `isqtools_auto_fix` MCP Tool 注册
- [x] `server.py` — 新增 `_tool_isqtools_auto_fix` 自动修复循环实现
- [x] `server.py` — 新增 `_attempt_isqtools_fix` 修复策略路由
- [x] `server.py` — 新增 `_fix_isq_compile_error` / `_fix_python_runtime_error`
      / `_fix_isqtools_api_error`
- [x] `snippets.ts` — 新增 `renderIsqtoolsWorkflow()` System Prompt 注入
- [x] `promptProvider.ts` — 激活 `isqtoolsWorkflow` section
- [x] `test_mcp_server.py` — 新增 `TestIsqtoolsRunTool` 测试类
- [x] `test_mcp_server.py` — 新增 `TestIsqtoolsAutoFixTool` 测试类
- [x] `test_mcp_server.py` — 新增 `TestErrorClassification` 测试类
- [x] Python 语法校验通过

### 远程服务器执行（运行时验证）

- [ ] `isqtools_run` 能在 Docker 沙箱中执行含 .isq 文件的 Python 代码
- [ ] `isqtools_auto_fix` isQ 编译错误 → 自动修复 → 重新执行成功
- [ ] `isqtools_auto_fix` Python 运行时错误 → 结构化诊断返回
- [ ] `isqtools_auto_fix` 超时场景 → 正确中止
- [ ] 端到端: "用 Python 实现 Bell 态" → 生成 .isq + .py
      → 编译 → 执行 → 展示结果
- [ ] 编译失败时自动触发修复循环
- [ ] `pytest tests/test_mcp_server.py` 全部通过
