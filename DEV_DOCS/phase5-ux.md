# Phase 5: 开发体验优化

> **目标:** 提升量子开发者的日常使用体验  
> **预计工期:** 2–3 周  
> **状态:** ✅ 已完成  
> **前置依赖:** Phase 3 (知识增强), Phase 4 (调用链就绪)  
> **返回:** [主开发文档](./README.md)

---

## 5.1 Slash 命令扩展

在 `packages/cli/src/commands/` 中新增量子专属命令：

| 命令                     | 功能                                      | 后端                 |
| ------------------------ | ----------------------------------------- | -------------------- |
| `/qrun [file]`           | 编译+模拟 isQ 文件                        | MCP `isq_simulate`   |
| `/qfix [file]`           | 自动修复 isQ 编译错误                     | MCP `isq_auto_fix`   |
| `/qpy [file]`            | 执行 isqtools Python 代码                 | MCP `isqtools_run`   |
| `/qsearch [query]`       | 搜索 isQ 知识库                           | MCP `isq_rag_search` |
| `/qtemplate [algorithm]` | 生成量子算法模板代码                      | MCP `isq_fast_path`  |
| `/qenv`                  | 检查量子开发环境 (Docker, isqc, isqtools) | MCP `isqtools_run`   |

---

## 5.2 量子代码高亮

在 `packages/cli` 中为 `.isq` 文件添加语法高亮支持：

- 扩展 `highlight.js` 或 `lowlight` 配置，添加 isQ 语言定义
- 关键字: `qbit`, `procedure`, `import`, `ctrl`, `deriving gate`, `oracle`, `H`,
  `X`, `Y`, `Z`, `M`
- 确保代码输出 / diff 显示正确高亮

---

## 5.3 量子结果可视化

利用 CLI 的 Ink (React) 渲染能力展示量子结果：

```
┌─ Quantum Simulation Results ─────────────────┐
│ |00⟩  ████████████████████████░░░░  49.4%     │
│ |01⟩  ░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.8%     │
│ |10⟩  ░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.8%     │
│ |11⟩  ████████████████████████░░░░  49.0%     │
│ ─────────────────────────────────────────     │
│ Shots: 1000 | Qubits: 2 | Time: 0.23s        │
└───────────────────────────────────────────────┘
```

---

## 5.4 VS Code 扩展适配

更新 `packages/vscode-ide-companion/`：

- 修改扩展 ID 和显示名称
- 添加 `.isq` 文件类型关联
- 提供侧边栏量子电路预览面板（远期目标）

---

## 验证清单

- [x] `/qrun`, `/qfix`, `/qpy`, `/qsearch`, `/qtemplate`, `/qenv` 命令已实现
- [x] `.isq` 代码语法高亮（lowlight isQ 语法定义）
- [x] 量子结果概率分布可视化（MCP Server `_format_quantum_results`
      ASCII 条形图）
