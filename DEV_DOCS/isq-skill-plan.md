# isQ Quantum Coding Skill 实现计划

## 背景

当前 isQCoder-cli 项目已经拥有完整的 MCP 服务器（运行在 isQCodeAgent 中），提供 9 个核心 MCP 工具用于 isQ 量子代码的编译、模拟和自动修复。然而，isQCoder-cli 的 AI 代理要有效利用这些工具，需要理解 isQ 语言语法、量子门操作、编程模式，以及如何正确调用 MCP 工具。

**核心目标**：创建一个 `isq-quantum-coder` skill，使 AI 代理能够：

1. 正确编写 isQ 量子代码（基于完整的语言参考）
2. 高效调用 MCP 工具进行编译和模拟
3. 按照推荐工作流处理从简单到复杂的量子编程任务

## 优势分析

| 方面         | 没有 Skill               | 有 Skill                 |
| ------------ | ------------------------ | ------------------------ |
| isQ 语法知识 | 依赖模型训练数据（不全） | 完整语法参考按需加载     |
| MCP 工具调用 | 需每次发现工具并理解参数 | 有明确的工作流指导       |
| 代码质量     | 易出现语法错误           | 有最佳实践和常见陷阱参考 |
| 效率         | 需多轮试错               | 按推荐路径直达结果       |
| 上下文占用   | 每次对话重复解释         | 按需加载，渐进式披露     |

## Proposed Changes

### isQ Quantum Coder Skill

Skill 安装目录: `.gemini/skills/isq-quantum-coder/`

---

#### [NEW] [.gemini/skills/isq-quantum-coder/SKILL.md](../.gemini/skills/isq-quantum-coder/SKILL.md)

核心技能文件，包含：

1. **YAML Frontmatter** —
   `name: isq-quantum-coder`，描述覆盖所有触发场景（写 isQ 代码、量子编程、MCP 编译/模拟）
2. **MCP 工具工作流** — 分层推荐策略：
   - 简单任务 → `isq_fast_path`（零延迟模板）
   - 快速原型 → `isq_generate`（planner+coder，不编译验证）
   - 需要验证 → `isq_compile` + `isq_simulate`
   - 端到端可靠代码 → `isq_auto_fix`（自动修复闭环）
   - Python+isQ 混合 → `isqtools_run` / `isqtools_auto_fix`
3. **isQ 代码编写基本规则** — 关键语法要点速查（精简版）
4. **常见错误与陷阱** — 从规则库中提炼的高频 bug
5. **参考文件导航** — 指向详细参考文档的索引

---

#### [NEW] [.gemini/skills/isq-quantum-coder/references/syntax-reference.md](../.gemini/skills/isq-quantum-coder/references/syntax-reference.md)

isQ 完整语法参考（从原始文档精炼），包含：

- 类型系统（`qbit`, `int`, `bool`, `double`, 数组, 切片）
- 量子操作（量子门、测量、defgate、量子态制备）
- Procedure 定义（含 `deriving gate`、模板）
- 控制流（if/for/while/switch-case）
- 修饰符（`ctrl`, `nctrl`, `inv`）
- Oracle 定义（值表法、布尔函数法）
- 包和导入系统
- 运行时参数

---

#### [NEW] [.gemini/skills/isq-quantum-coder/references/gates-reference.md](../.gemini/skills/isq-quantum-coder/references/gates-reference.md)

量子门速查表：

- 全部内置门签名（X, Y, Z, H, S, T, Rx, Ry, Rz, X2P, X2M, Y2P, Y2M, U3, CNOT,
  CZ, Toffoli, GPhase）
- `defgate` 自定义门示例
- `ctrl`/`nctrl`/`inv` 修饰符用法

---

#### [NEW] [.gemini/skills/isq-quantum-coder/references/mcp-tools.md](../.gemini/skills/isq-quantum-coder/references/mcp-tools.md)

MCP 工具完整参考：

- 每个工具的详细参数说明和返回值格式
- 使用场景对比表
- 调用示例

---

#### [NEW] [.gemini/skills/isq-quantum-coder/references/examples.md](../.gemini/skills/isq-quantum-coder/references/examples.md)

按难度分类的完整 isQ 代码示例，包含注释：

- 基础：Bell 态、GHZ 态、单量子比特操作
- 中级：量子隐形传态、Deutsch-Jozsa
- 高级：Grover 搜索、QFT、QPE

## 文件大小控制

| 文件                | 目标大小 | 说明                                     |
| ------------------- | -------- | ---------------------------------------- |
| SKILL.md            | ~300 行  | 核心工作流 + 速查规则，控制在 500 行以内 |
| syntax-reference.md | ~250 行  | 完整语法精炼版                           |
| gates-reference.md  | ~100 行  | 门签名速查                               |
| mcp-tools.md        | ~150 行  | 工具参考                                 |
| examples.md         | ~200 行  | 带注释示例合集                           |

## Verification Plan

### Manual Verification

由于 Skill 的验证需要在交互式 isQCoder CLI 会话中进行，建议以下验证步骤：

1. **Skill 安装验证**：
   - 确认 `.gemini/skills/isq-quantum-coder/SKILL.md` 存在且 YAML
     frontmatter 格式正确
   - 确认所有 `references/` 文件存在且可被引用

2. **内容正确性验证**：
   - 检查 SKILL.md 中引用的所有参考文件路径是否正确
   - 确认 isQ 语法文档中的代码示例与原始文档一致
   - 确认 MCP 工具参数说明与 `server.py` 中的 `inputSchema` 匹配

3. **实际使用验证**（需要用户手动测试）：
   - 在 isQCoder
     CLI 中请求 "写一个 Bell 态程序"，验证是否触发 skill 并正确使用 MCP 工具
   - 在 isQCoder CLI 中请求 "编译运行 isQ GHZ 态"，验证完整工作流
