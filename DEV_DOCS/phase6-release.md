# Phase 6: 质量保障与发布

> **目标:** 确保生产就绪  
> **预计工期:** 2 周  
> **状态:** ⬜ 未开始  
> **前置依赖:** Phase 4 (核心功能完成), Phase 5 (体验优化完成)  
> **返回:** [主开发文档](./README.md)

---

## 6.1 测试

- **MCP Server 测试:** isQCodeAgent 侧的 MCP 接口单元测试 (pytest)
- **集成测试:** CLI → MCP → isQCodeAgent 端到端工作流
- **回归测试:** 复用 isQCodeAgent 已有的 66+ 单元测试和 23 个集成测试
- **CLI 测试:** 为新增 Slash 命令编写 Vitest 测试
- 确保 `npm run preflight` 全量通过

---

## 6.2 CI/CD

- 适配 GitHub Actions 工作流
- 添加 Python MCP Server 的 CI 流水线
- 配置 npm 发布到 `@isqcoder` scope
- 配置 PyPI 发布 `isqcoder-mcp-server`
- 设置 nightly / preview / stable 发布节奏

---

## 6.3 文档完善

- 编写 isQCoder 专属的「快速开始」指南
- MCP Server 部署与配置文档
- Python + isQ 混合编程教程
- 创建量子开发场景的教程示例

---

## 6.4 Docker Compose 一键部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  isqcoder-mcp:
    build: ./isQCodeAgent
    command: python -m isq_agent.mcp_server
    environment:
      - LLM_PROVIDER=zhipu
      - ISQC_DOCKER_IMAGE=isqc-python:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # Docker-in-Docker
    depends_on:
      - qdrant

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - '6333:6333'
    volumes:
      - qdrant_data:/qdrant/storage

  isqc-python:
    image: isqc-python:latest
    # 由 MCP Server 动态调用，不持续运行
    profiles: ['tools']

volumes:
  qdrant_data:
```

---

## 6.5 发布

- `npm publish --scope=@isqcoder` (CLI)
- `pip install isqcoder-mcp-server` (MCP Server)
- Docker Compose 一键部署（包含 isqc + isqtools + MCP Server + Qdrant）
- GitHub Release 及 changelog

---

## 验证清单

- [ ] 全部测试通过 (Vitest + pytest)
- [ ] Docker Compose 一键部署可用
- [ ] `./bundle/isqcoder.js` 可正常启动
- [ ] `pip install isqcoder-mcp-server` 可安装
