# isQCoder-cli 测试执行文档

> **版本:** v1.0 | **创建日期:** 2026-02-26 | **总测试计划:**
> [testing-plan.md](../testing-plan.md)

---

## 文件夹结构

本文件夹包含按测试阶段拆分的独立测试执行文档，便于不同测试人员**并行执行**。

| 文件                                                           | 阶段                     | 预计工时 | 负责人 | 状态      |
| -------------------------------------------------------------- | ------------------------ | -------- | ------ | --------- |
| [phase1-build-verification.md](./phase1-build-verification.md) | Phase 1: 构建验证 (L1)   | 0.5 天   | 待分配 | 🔲 未开始 |
| [phase2-unit-tests.md](./phase2-unit-tests.md)                 | Phase 2: 单元回归 (L2)   | 1 天     | 待分配 | 🔲 未开始 |
| [phase3-component-tests.md](./phase3-component-tests.md)       | Phase 3: 组件与配置 (L3) | 1 天     | 待分配 | 🔲 未开始 |
| [phase4-integration-tests.md](./phase4-integration-tests.md)   | Phase 4: 集成测试 (L4)   | 2 天     | 待分配 | 🔲 未开始 |
| [phase5-e2e-scenarios.md](./phase5-e2e-scenarios.md)           | Phase 5: 端到端场景 (L5) | 1.5 天   | 待分配 | 🔲 未开始 |

**预计总测试周期：约 6 天**

---

## 执行依赖关系

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
(构建验证)   (单元回归)   (组件测试)   (集成测试)   (E2E 场景)
```

> [!IMPORTANT]
>
> - Phase 1 必须首先完成并通过，后续阶段才有意义
> - Phase 2 和 Phase 3 之间可以**部分并行**（L2 品牌验证通过后即可开始 L3）
> - Phase 4 需要 Docker 和 MCP Server 环境就绪
> - Phase 5 需要所有前置阶段的核心测试通过

---

## 状态图标说明

| 图标 | 含义               |
| ---- | ------------------ |
| 🔲   | 未开始             |
| 🔄   | 进行中             |
| ✅   | 通过               |
| ❌   | 失败               |
| ⚠️   | 有 Known Issue     |
| ⏭️   | 跳过（需说明原因） |

---

## 测试环境准备 Checklist

在开始任何测试之前，请确认以下环境已就绪：

- [ ] Node.js ≥ 20.x 已安装
- [ ] Python ≥ 3.10 已安装
- [ ] Docker ≥ 24.x 已安装并运行
- [ ] `GEMINI_API_KEY` 或 `ZHIPU_API_KEY` 环境变量已配置
- [ ] Docker 镜像 `arclightquantum/isqc:ubuntu-0.0.1` 已拉取
- [ ] Docker 镜像 `isqc-python:latest` 已构建
- [ ] Qdrant 容器已启动（用于 RAG 测试）
- [ ] isQCodeAgent Python MCP Server 已配置到 `~/.isqcoder/settings.json`

---

## 测试报告汇总

完成所有阶段后，在此记录汇总结果：

| 阶段         | 总用例数 | 通过 | 失败 | 跳过 | 通过率 |
| ------------ | -------- | ---- | ---- | ---- | ------ |
| Phase 1 (L1) | 7        | -    | -    | -    | -      |
| Phase 2 (L2) | 29       | -    | -    | -    | -      |
| Phase 3 (L3) | 25       | -    | -    | -    | -      |
| Phase 4 (L4) | 33       | -    | -    | -    | -      |
| Phase 5 (L5) | 7 场景   | -    | -    | -    | -      |
| **合计**     | **101+** | -    | -    | -    | -      |

---

## 发布阻塞条件 (Must Fix)

- [ ] L1 构建与静态检查全部通过
- [ ] L2 现有单元测试 0 失败
- [ ] L4-01~L4-02 MCP Server 连接和工具发现正常
- [ ] L4-06~L4-08 isQ 编译和模拟功能正常
- [ ] S2 isQ 代码开发完整流程走通
- [ ] 品牌替换无用户可见残留
