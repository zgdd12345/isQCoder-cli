# Phase 3: 量子计算知识增强

> **目标:** 让 AI 理解 isQ 语言规范和量子计算基础概念  
> **预计工期:** 2–3 周  
> **状态:** ✅ 已完成  
> **前置依赖:** Phase 1 (品牌替换完成), Phase 2 (MCP RAG 可用)  
> **返回:** [主开发文档](./README.md)

---

## 3.1 System Prompt 深度扩展

**文件:** `packages/core/src/prompts/snippets.ts`

新增 `renderIsqKnowledge()` 函数，融合 isQCodeAgent `coder_prompt.py`
中已验证的规则：

```
# isQ Language Reference
## Core Syntax
- import std; / procedure main() { ... }
- qbit q[n]; / for i in 0:n { ... }
- FORBIDDEN: void, def, proc, C-style for, print(), # comments

## Quantum Gates
- H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, CZ, Toffoli, ctrl X
- M(q[i]) → bool

## Deriving Gate
- 只允许酉操作，禁止 print/M/reset/if/for

## 代码示例
- Bell State, Grover Search (2-qubit)

## 可用工具提示
- isq_compile / isq_simulate / isq_auto_fix / isqtools_run / isq_rag_search
```

**集成方式:** `getCoreSystemPrompt()` →
`renderIsqKnowledge(options.isqKnowledge)` → 始终启用

---

## 3.2 知识库双通道

| 通道     | 实现方式                                | 适用场景               |
| -------- | --------------------------------------- | ---------------------- |
| **静态** | `packages/core/src/resources/` 内置文档 | 基础概念、快速参考     |
| **动态** | MCP `isq_rag_search` tool               | 深度检索、代码示例匹配 |

已创建的静态知识文档：

```
resources/
├── isq-quick-reference.md    # isQ 语法速查
├── isqtools-quick-start.md   # Python SDK 快速上手
├── quantum-patterns.md       # 常见量子算法模式 (Bell, GHZ, Grover, Teleportation)
└── resource-registry.ts      # MCP 资源注册表 (已有)
```

深度知识通过 MCP RAG 按需检索（复用 isQCodeAgent 的 97 个文档块 + Qdrant）。

---

## 3.3 ISQCODER.md 项目模板

示例模板：[ISQCODER.example.md](./examples/ISQCODER.example.md)

`DEFAULT_CONTEXT_FILENAME` 已在品牌替换阶段设为 `'ISQCODER.md'`。

---

## 验证清单

- [x] System Prompt 包含 isQ 语法规则 (`renderIsqKnowledge()`)
- [x] 静态知识文档已创建 (3 个 .md 文件)
- [x] ISQCODER.md 模板已创建
- [x] `promptProvider.test.ts` 新增测试用例
- [ ] `isq_rag_search` 返回相关结果 (依赖 Phase 2 MCP Server)
