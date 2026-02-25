# Phase 1: 品牌体系完整替换

> **目标:** 所有用户可见的标识、包名、命令名统一为 isQCoder  
> **预计工期:** 1–2 周  
> **状态:** ✅ 基本完成  
> **前置依赖:** Phase 0  
> **返回:** [主开发文档](./README.md)

---

## 当前状态

> [!NOTE] **已完成的品牌替换项目：**
>
> - ✅ 所有 6 个子包 `package.json` 名称已更新为 `@isqcoder/*`
> - ✅ 所有 `bin` 入口已改为 `isqcoder`
> - ✅ `esbuild.config.js` 输出文件名已改为 `bundle/isqcoder.js`
> - ✅ 485+ TypeScript 源文件中的 `@google/gemini-cli-*` 导入已全部替换
> - ✅ `eslint.config.js` 中的包名引用已更新
> - ✅ `GEMINI_DIR` 常量已改为 `.isqcoder`（保留 `GEMINI_DIR` 别名）
> - ✅ `DEFAULT_CONTEXT_FILENAME` 已改为 `ISQCODER.md`
> - ✅ 系统配置目录 (macOS/Windows/Linux) 已更新
> - ✅ 环境变量 `ISQCODER_SYSTEM_SETTINGS_PATH` 已替换
> - ✅ 用户可见文本 "Gemini CLI" → "isQCoder" 已批量替换
> - ✅ 内部标识符 (keychain, telemetry, temp files, User-Agent) 已替换
> - ✅ VSCode 扩展命令 ID 已更新
>
> **保留不变的项目：**
>
> - `GEMINI_API_KEY` 等 API 环境变量（仍使用 Gemini API）
> - `@google/genai` 依赖（Gemini API SDK）
> - GitHub URLs（指向上游原始仓库的引用链接）
> - 内部代码类名 (`GeminiClient`, `GeminiChat` 等) — 后续阶段再处理
> - `snippets.legacy.ts`（历史快照，不修改）

---

## 1.1 包名与注册表

| 文件/位置                                             | 当前值 (已验证)                   | 目标值                              |
| ----------------------------------------------------- | --------------------------------- | ----------------------------------- |
| `package.json` (根) → `name`                          | `@isqcoder/isqcoder-cli` ✅       | 无需修改                            |
| `packages/cli/package.json` → `name`                  | `@google/gemini-cli`              | `@isqcoder/isqcoder-cli`            |
| `packages/core/package.json` → `name`                 | `@google/gemini-cli-core`         | `@isqcoder/isqcoder-cli-core`       |
| `packages/sdk/package.json` → `name`                  | `@google/gemini-cli-sdk`          | `@isqcoder/isqcoder-cli-sdk`        |
| `packages/a2a-server/package.json` → `name`           | `@google/gemini-cli-a2a-server`   | `@isqcoder/isqcoder-a2a-server`     |
| `packages/test-utils/package.json` → `name`           | `@google/gemini-cli-test-utils`   | `@isqcoder/isqcoder-cli-test-utils` |
| `packages/vscode-ide-companion/package.json` → `name` | `gemini-cli-vscode-ide-companion` | `@isqcoder/isqcoder-vscode`         |

---

## 1.2 跨文件引用修复

**关键引用点 (已验证存在 23+ 处):**

- 所有 `package.json` 中的 `dependencies` / `devDependencies` 引用:
  - `@google/gemini-cli-core` (出现在 cli, sdk, a2a-server, test-utils)
  - `@google/gemini-cli-test-utils` (出现在 cli, core)
- TypeScript 源码中的 `import ... from '@google/gemini-cli-core'` 等
- ESLint 配置 `eslint.config.js` 中的包名引用
- `esbuild.config.js` 中的 external 列表 (`gemini-cli-devtools`)
- CI/CD 脚本和 Dockerfile 中的引用
- 所有 `package.json` 中的 `repository.url` (仍指向
  `google-gemini/gemini-cli.git`)
- `packages/vscode-ide-companion/package.json` 中的 VS Code 命令 ID
  (`gemini-cli.*`)
- 根 `package.json` 中的 `scripts` 引用 (`@google/gemini-cli-a2a-server`)

---

## 1.3 二进制命令与构建配置

- `packages/cli/package.json` → `bin.gemini` 改为 `bin.isqcoder`
- **`esbuild.config.js`** → `outfile: 'bundle/gemini.js'` 改为
  `outfile: 'bundle/isqcoder.js'`
- `esbuild.config.js` → 错误日志中的 `'gemini.js build failed'` 更新
- 根 `package.json` → `bin.isqcoder` 当前指向 `bundle/gemini.js`，需改为
  `bundle/isqcoder.js`
- 脚本 `scripts/start.js` 等中的路径引用

---

## 1.4 配置目录与环境变量

| 当前                                       | 目标                                   | 修改位置                                                     |
| ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------ |
| `GEMINI_DIR = '.gemini'`                   | `ISQCODER_DIR = '.isqcoder'`           | `packages/core/src/utils/paths.ts`                           |
| `~/.gemini/`                               | `~/.isqcoder/`                         | 由上述常量控制，自动生效                                     |
| `'GeminiCli'` (macOS 系统配置路径)         | `'IsQCoder'`                           | `packages/core/src/config/storage.ts` `getSystemConfigDir()` |
| `'gemini-cli'` (Linux/Win 系统配置路径)    | `'isqcoder'`                           | 同上                                                         |
| `GEMINI_CLI_SYSTEM_SETTINGS_PATH` 环境变量 | `ISQCODER_SYSTEM_SETTINGS_PATH`        | `storage.ts` `getSystemSettingsPath()`                       |
| `GEMINI.md` 上下文文件                     | `ISQCODER.md`（保留 `GEMINI.md` 兼容） | `packages/core/src/tools/memoryTool.ts`                      |
| `GEMINI_API_KEY` 等 API 环境变量           | 保留原名不变（仍使用 Gemini API）      | —                                                            |

> [!NOTE] 配置目录名由 `packages/core/src/utils/paths.ts` 中的 `GEMINI_DIR`
> 常量控制，`storage.ts` 中的 `Storage`
> 类所有方法均引用此常量。修改此单一常量即可影响全部路径。但
> `getSystemConfigDir()` 中的硬编码字符串需单独修改。

---

## 1.5 项目上下文文件

- 项目根目录 `GEMINI.md` → 更名为
  `ISQCODER.md`（同时更新内容为 isQCoder 项目描述）
- 保留 `GEMINI.md` 作为软链接或兼容别名
- `DEFAULT_CONTEXT_FILENAME` 常量从 `'GEMINI.md'` 改为 `'ISQCODER.md'`

---

## 1.6 UI 与文档

- 全局搜索替换 `Gemini CLI` → `isQCoder` (UI 组件、帮助文本)
- 更新 `README.md`、`CONTRIBUTING.md`、`ROADMAP.md` 品牌内容
- 更新 `docs/` 目录下所有文档

---

## 验证

```bash
# 确保所有引用一致
grep -rn "gemini-cli" packages/ --include="*.ts" --include="*.tsx" --include="*.json"
grep -rn "@google/" packages/ --include="*.json"
grep -rn "GEMINI_DIR\|gemini-cli\|GeminiCli" packages/core/src/ --include="*.ts"
npm run preflight  # 全量检查
```

### 验证清单

- [ ] `grep -rn "@google/" packages/ --include="*.json"` 无结果
- [ ] `grep -rn "gemini-cli" packages/ --include="*.ts" --include="*.json"` 仅剩
      `gemini-cli-devtools` (external)
- [ ] `npm run preflight` 全量通过
- [ ] `npm run build` 构建成功
- [ ] `npm run bundle` 生成 `bundle/isqcoder.js`
- [ ] UI 中不再出现 "Gemini" 字样
