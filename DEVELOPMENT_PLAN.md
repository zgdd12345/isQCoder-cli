# isQCoder-cli 开发方案

> **版本:** v0.3-draft | **日期:** 2026-02-25

---

本开发方案已拆分为模块化文档，便于并行开发。

## 📂 文档结构

所有开发文档位于 [`DEV_DOCS/`](./DEV_DOCS/) 目录：

| 文档                                                      | 说明                                                     |
| --------------------------------------------------------- | -------------------------------------------------------- |
| [**README.md**](./DEV_DOCS/README.md)                     | 📋 主开发文档 — 项目概述、开发规划、进度追踪、架构决策   |
| [phase0-preparation.md](./DEV_DOCS/phase0-preparation.md) | Phase 0: 预备阶段 — npm scope、MCP SDK、Docker、上游同步 |
| [phase1-branding.md](./DEV_DOCS/phase1-branding.md)       | Phase 1: 品牌体系完整替换 — 包名、引用、构建、配置       |
| [phase2-mcp-server.md](./DEV_DOCS/phase2-mcp-server.md)   | Phase 2: MCP Server 封装 — 架构设计、Tools 定义、实现    |
| [phase3-knowledge.md](./DEV_DOCS/phase3-knowledge.md)     | Phase 3: 知识增强 — System Prompt、RAG、知识文档         |
| [phase4-isqtools.md](./DEV_DOCS/phase4-isqtools.md)       | Phase 4: isqtools 调用链 — 核心工作流、自动修复闭环      |
| [phase5-ux.md](./DEV_DOCS/phase5-ux.md)                   | Phase 5: 体验优化 — Slash 命令、代码高亮、可视化         |
| [phase6-release.md](./DEV_DOCS/phase6-release.md)         | Phase 6: 质量保障与发布 — 测试、CI/CD、Docker Compose    |

> **入口:** 请从 [DEV_DOCS/README.md](./DEV_DOCS/README.md) 开始阅读。
