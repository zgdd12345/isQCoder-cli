# isQCoder MCP Tools Reference

Complete reference for all MCP tools provided by the isQCoder MCP server.

## Connection

The MCP server runs as SSE transport (default port 8765):

```bash
python -m isq_agent.mcp_server --transport sse --port 8765
```

## Tools

### isq_compile

**Compile isQ code and check for errors.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | ✅ | isQ source code |
| `file_path` | string | ❌ | Optional file path for error locating |

**Returns:**

```json
{
  "success": true/false,
  "errors": [...],
  "raw_stderr": "...",
  "raw_stdout": "...",
  "exit_code": 0,
  "error_summary": "..."
}
```

---

### isq_simulate

**Compile and simulate an isQ program.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `code` | string | ✅ | — | isQ source code |
| `shots` | integer | ❌ | 1000 | Number of sampling shots |
| `debug` | boolean | ❌ | false | Enable debug mode (shows `print` output) |

**Returns:**

```json
{
  "success": true/false,
  "phase": "compile" or "simulate",
  "stdout": "...",
  "probabilities": {"00": 500, "11": 500},
  "execution_time": 1.23,
  "visualization": "..."
}
```

---

### isq_auto_fix

**Full compile-fix-evolve loop. Most powerful tool for reliable code generation.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `task` | string | ✅ | — | Quantum programming task description |
| `max_iterations` | integer | ❌ | 5 | Max fix iterations |
| `expected_output` | string | ❌ | — | Expected output for validation |

**Returns:**

```json
{
  "code": "import std; ...",
  "success": true/false,
  "iterations": 3,
  "algorithm_type": "grover",
  "compile_success": true,
  "simulation_output": "{...}",
  "rules_learned": [...]
}
```

---

### isq_generate

**Generate isQ code without compilation (fast prototype).**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | ✅ | Quantum programming task description |
| `algorithm_type` | string | ❌ | Algorithm hint (grover, bell_state, teleportation, etc.) |

**Returns:**

```json
{
  "code": "import std; ...",
  "plan": "...",
  "explanation": "...",
  "method": "fast_path" or "planner_coder"
}
```

---

### isq_fast_path

**Instant template matching for common tasks (near-zero latency).**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | ✅ | User task text |

**Returns (matched):**

```json
{
  "matched": true,
  "template_name": "bell_state",
  "code": "import std; ...",
  "algorithm_type": "bell_state",
  "qubit_count": 2
}
```

**Returns (not matched):** `{"matched": false, "template_name": null, "code": null}`

---

### isq_rag_search

**Search the isQ knowledge base for syntax, examples, and stdlib docs.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Search query text |
| `top_k` | integer | ❌ | 5 | Number of results to return |

**Returns:**

```json
{
  "results": [
    {"type": "documentation", "content": "...", "source": "isq_knowledge_base"},
    {"type": "code_examples", "content": "...", "source": "isq_code_examples"}
  ]
}
```

---

### isq_rules_query

**Query the experience rules database (learned from past compilation errors).**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | ❌ | — | Filter: syntax, type, semantic, pattern |
| `keyword` | string | ❌ | — | Keyword search |
| `top_k` | integer | ❌ | 5 | Max results |

---

### isqtools_run

**Execute Python+isQ code in Docker sandbox.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `python_code` | string | ✅ | — | Python code using isqtools library |
| `isq_files` | array | ❌ | — | Associated .isq files: `[{"filename":"x.isq","content":"..."}]` |
| `timeout` | integer | ❌ | 60 | Execution timeout (seconds) |

**Returns:**

```json
{
  "stdout": "...",
  "stderr": "...",
  "exit_code": 0,
  "execution_time": 5.2
}
```

---

### isqtools_auto_fix

**Python+isQ execution with automatic error diagnosis and repair.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `python_code` | string | ✅ | — | Python code |
| `isq_files` | array | ❌ | — | Associated .isq files |
| `task_description` | string | ❌ | — | Context for intelligent repair |
| `max_retries` | integer | ❌ | 3 | Max retry rounds |
| `timeout` | integer | ❌ | 60 | Per-execution timeout (seconds) |

**Repair strategies:**
- isQ compile error → calls `isq_auto_fix` internally
- Python runtime error → LLM analysis + regenerate Python
- isqtools API error → RAG search for correct usage
