# isQCoder

<p align="center">
  <strong>🔬 面向量子计算的终端 AI 编程助手</strong><br>
  <em>Quantum-First Terminal AI Coding Assistant for the isQ Language</em>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node.js">
  <img src="https://img.shields.io/badge/python-3.12-blue" alt="Python">
  <img src="https://img.shields.io/badge/isQ-quantum-purple" alt="isQ">
</p>

---

isQCoder 是基于 [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)
的二次开发，融合了 **isQCodeAgent** 多智能体系统的核心能力，通过 MCP (Model
Context Protocol) 提供交互式量子编程终端体验。

用自然语言描述量子算法 →
AI 自动生成 isQ 代码 → 编译器验证 → 模拟运行 → 结果可视化，全部在终端中完成。

## ✨ 核心特性

### 🧠 智能量子编程

- **自然语言 → isQ 代码** — 描述量子算法，AI 自动生成可编译的 isQ 程序
- **编译器在环修复** — 编译失败时多智能体系统自动诊断和修复，100% 首次通过率
- **Fast-Path 模板** — 11 种常见量子算法模板（Bell 态、GHZ、Grover 等），0
  LLM 调用、秒级生成
- **RAG 知识检索** — 297 向量知识库，语义搜索 isQ 语法、标准库和量子算法示例

### ⚡ 量子专属命令

| 命令                | 功能                      | 示例                     |
| ------------------- | ------------------------- | ------------------------ |
| `/qrun <file.isq>`  | 编译并模拟 isQ 文件       | `/qrun bell.isq`         |
| `/qfix <file.isq>`  | 自动修复编译错误          | `/qfix broken.isq`       |
| `/qpy <file.py>`    | 执行 isqtools Python 代码 | `/qpy grover_sim.py`     |
| `/qsearch <query>`  | 搜索 isQ 知识库           | `/qsearch Hadamard gate` |
| `/qtemplate <algo>` | 生成量子算法模板          | `/qtemplate bell`        |
| `/qenv`             | 检查量子开发环境          | `/qenv`                  |

### 🎨 开发体验

- **isQ 语法高亮** — 终端中 `.isq`
  代码块自动语法着色（量子门、`qbit`、`ctrl`/`inv`）
- **量子结果可视化** — 模拟结果以 ASCII 条形图展示概率分布
- **Docker 沙箱** — isQ 编译和模拟在容器内安全执行

```
┌─ Quantum Simulation Results ────────────────────┐
│ |00⟩  ██████████████░░░░░░░░░░░░░░  49.4%       │
│ |01⟩  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.8%       │
│ |10⟩  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.8%       │
│ |11⟩  ██████████████░░░░░░░░░░░░░░  49.0%       │
│ ───────────────────────────────────────────────  │
│ Qubits: 2 | Shots: 1000 | Time: 0.23s           │
└──────────────────────────────────────────────────┘
```

### 🔧 继承 Gemini CLI 全部能力

- Google Search 实时信息检索
- 代码理解与生成（支持任意语言）
- Shell 命令执行、文件操作
- MCP Server 扩展集成
- 会话检查点（保存/恢复对话）

## 📦 安装

### 前置条件

- **Node.js** ≥ 20.0.0
- **Python** 3.12+（推荐使用 Conda）
- **Docker**（用于 isQ 编译器沙箱执行）

### 快速安装

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/isQCoder-cli.git
cd isQCoder-cli

# 2. 安装依赖 & 构建
npm install
npm run build

# 3. 设置 Python 环境 (isQCodeAgent 后端)
conda create -n isqcoder python=3.12
conda activate isqcoder
cd ../isQCodeAgent
pip install -r requirements.txt -e .

# 4. 拉取 isQ 编译器 Docker 镜像
docker pull arclightquantum/isqc:ubuntu-0.0.1
```

### 启动 MCP Server

isQCoder 通过 MCP Server 连接 isQCodeAgent 后端：

```bash
# 启动 MCP Server（SSE 模式）
conda activate isqcoder
cd isQCodeAgent
python -m isq_agent.mcp_server --transport sse --port 8765
```

### 配置 MCP 连接

在 `.isqcoder/settings.json` 中配置 MCP Server：

```json
{
  "mcpServers": {
    "isqcoder": {
      "url": "http://localhost:8765/sse"
    }
  }
}
```

## 🚀 快速上手

### 启动 isQCoder

```bash
cd your-quantum-project/
isqcoder
```

### 使用示例

#### 生成 Bell 态程序

```
> 用 isQ 语言生成一个 Bell 态程序并运行

# AI 自动：
# 1. 调用 isq_fast_path → 匹配 Bell 态模板
# 2. 调用 isq_compile → 编译验证
# 3. 调用 isq_simulate → 模拟运行
# 4. 显示概率分布可视化
```

#### 使用 Slash 命令

```
> /qtemplate grover        # 快速生成 Grover 搜索模板
> /qrun my_algorithm.isq   # 编译+模拟运行
> /qfix broken.isq         # 自动修复编译错误
> /qsearch 量子隐形传态     # 搜索知识库
> /qpy simulate.py         # 执行 Python 量子仿真脚本
> /qenv                    # 检查环境状态
```

#### 用自然语言探索量子计算

```
> 什么是 Grover 搜索算法？用 isQ 实现一个在 4 个元素中搜索的例子
> 这段 isQ 代码有错误，帮我修复
> 把这个量子傅里叶变换算法改成 3 量子比特版本
```

## 🏗️ 架构

```
isQCoder-cli (TypeScript/React-Ink)
    │
    │ Slash Commands (/qrun, /qfix, /qpy, ...)
    │
    ▼
  Gemini LLM  ←→  MCP Protocol (SSE/stdio)
                        │
                        ▼
              isQCodeAgent MCP Server (Python)
                   │         │         │
                   ▼         ▼         ▼
              isq_compile  RAG     Fast-Path
              isq_simulate Search  Templates
              isq_auto_fix │         │
                   │       ▼         ▼
                   ▼    Qdrant    11 Patterns
              Docker Sandbox    4 Direct Routes
              (isqc compiler)
```

## � 认证方式

isQCoder 支持多种认证方式访问 Gemini LLM：

| 方式               | 适用场景           | 配置                          |
| ------------------ | ------------------ | ----------------------------- |
| **Google OAuth**   | 个人开发者（免费） | 启动后跟随浏览器登录流程      |
| **Gemini API Key** | 需要模型控制       | `export GEMINI_API_KEY="..."` |
| **Vertex AI**      | 企业级部署         | `export GOOGLE_API_KEY="..."` |

## 📂 项目结构

```
isQCoder-cli/
├── packages/
│   ├── cli/                  # CLI 终端 UI (React/Ink)
│   │   └── src/
│   │       ├── ui/commands/  # Slash 命令 (包括量子命令)
│   │       └── ui/utils/     # 语法高亮 (isqLanguage.ts)
│   ├── core/                 # 核心逻辑、Gemini API 调用
│   ├── a2a-server/           # Agent-to-Agent 服务
│   └── vscode-ide-companion/ # VS Code 扩展
├── DEV_DOCS/                 # 开发文档 (Phase 0-6)
├── docs/                     # 用户文档
└── scripts/                  # 构建/发布脚本
```

## 🧪 开发

```bash
# 安装依赖
npm install

# 构建所有包
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint && npm run typecheck

# 完整预检 (构建+测试+lint)
npm run preflight
```

## 🤝 贡献

欢迎贡献！本项目基于 Apache 2.0 开源协议。

- 报告 Bug 和功能建议
- 改进文档
- 提交代码改进
- 分享 MCP Server 扩展

详见 [贡献指南](./CONTRIBUTING.md)。

## � 致谢

isQCoder 基于以下开源项目构建：

- [Google Gemini CLI](https://github.com/google-gemini/gemini-cli)
  — 终端 AI 助手框架
- [isQ](https://isq.arclightquantum.com/) — 弧光量子编程语言
- [isQCodeAgent](../isQCodeAgent/) — 多智能体量子编程系统

## 📄 许可证

[Apache License 2.0](LICENSE)

---

<p align="center">
  Built with ❤️ for quantum computing
</p>
