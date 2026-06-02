---
name: isq-quantum-coder
description: Guide for writing isQ quantum programs and using MCP tools to compile, simulate, and debug quantum code. Use when the user asks to write isQ code, create quantum circuits, compile or simulate quantum programs, debug isQ compilation errors, or work with the isQCoder MCP server tools (isq_compile, isq_simulate, isq_auto_fix, isq_generate, isq_fast_path, isq_rag_search, isq_rules_query, isqtools_run, isqtools_auto_fix).
---

# isQ Quantum Coder

Write correct isQ quantum programs and use MCP tools to compile, simulate, and debug them.

## MCP Tool Workflow

Choose the right tool based on task complexity:

### Decision Tree

```
User wants quantum code
  ├─ Simple/common task (Bell, GHZ, teleportation)?
  │   └─ Use: isq_fast_path → instant template
  │       └─ If not matched → fall through to next
  ├─ Quick prototype (no compilation needed)?
  │   └─ Use: isq_generate → AI-generated code
  ├─ Need to verify code?
  │   └─ Use: isq_compile (syntax check) → isq_simulate (run)
  ├─ Need reliable, auto-correcting code?
  │   └─ Use: isq_auto_fix → compile-fix-evolve loop
  └─ Python + isQ mixed execution?
      └─ Use: isqtools_auto_fix → Docker sandbox with auto-repair
```

### Tool Quick Reference

| Tool | When to Use | Latency |
|------|-------------|---------|
| `isq_fast_path` | Common tasks (Bell, GHZ, teleport) | ~0ms |
| `isq_generate` | Quick prototype, no validation needed | ~2-5s |
| `isq_compile` | Verify syntax only | ~1-2s |
| `isq_simulate` | Compile + run simulation | ~2-5s |
| `isq_auto_fix` | Reliable code with auto-repair (up to 5 retries) | ~10-30s |
| `isq_rag_search` | Look up isQ syntax, examples, stdlib | ~1s |
| `isq_rules_query` | Find common pitfalls and best practices | ~0.5s |
| `isqtools_run` | Execute Python+isQ in Docker sandbox | ~5-15s |
| `isqtools_auto_fix` | Python+isQ with auto-repair (up to 3 retries) | ~15-60s |

For detailed tool parameters and return values, see [mcp-tools.md](references/mcp-tools.md).

### Recommended Workflow

1. **Try fast path first**: Call `isq_fast_path` with the task description. If matched, return the template code directly.
2. **Generate code**: If fast path fails, use `isq_generate` or write code manually based on syntax rules below.
3. **Compile and simulate**: Use `isq_compile` to verify, then `isq_simulate` to run.
4. **Auto-fix if needed**: If compilation fails, use `isq_auto_fix` for the full compile-fix loop.
5. **Search knowledge**: Use `isq_rag_search` for syntax questions and `isq_rules_query` for known pitfalls.

## isQ Essential Syntax

Every isQ file should start with `import std;` (provides built-in gates: H, X, Y, Z, S, T, CNOT, etc.).

### Program Structure

```isq
import std;

// Global variables (qbits must be global for --probs)
qbit q[2];

// Entry point
procedure main() {
    H(q[0]);
    CNOT(q[0], q[1]);
    int a = M(q[0]);
    int b = M(q[1]);
    print a;
}
```

### Types

- `qbit` — quantum bit, default `|0⟩`
- `int` — 64-bit signed integer
- `double` — double precision float (`pi` is built-in)
- `bool` — `true` / `false`
- Arrays: `qbit q[3];`, `int a[] = [1, 2, 3];`
- Slices: `q[0:2]`, `q[2:0:-1]`

### Quantum Gates

Single-qubit: `X(q)`, `Y(q)`, `Z(q)`, `H(q)`, `S(q)`, `T(q)`
Rotation: `Rx(theta, q)`, `Ry(theta, q)`, `Rz(theta, q)` — **angle first, qubit second**
Universal: `U3(theta, phi, lambda, q)`
Two-qubit: `CNOT(control, target)`, `CZ(c, t)`
Three-qubit: `Toffoli(c1, c2, target)`
Measurement: `int result = M(q);` or `bool b = M(q);`

For the complete gate reference with matrices, see [gates-reference.md](references/gates-reference.md).

### Control Flow

```isq
// For loop (Python-style range)
for i in 0:10 { ... }
for i in 0:10:2 { ... }  // with step

// While loop
while (condition) { ... }

// If-else (braces REQUIRED)
if (x > 0) { ... } else { ... }

// Switch-case (NO fall-through, no break needed)
switch a { case 1: ... case 2: ... default: ... }
```

### Gate Modifiers

```isq
ctrl X(control, target);     // Controlled-X (= CNOT)
ctrl<2> S(c1, c2, target);   // Double-controlled S
nctrl X(control, target);    // Negative-controlled X
inv S(q);                    // Inverse (S†)
nctrl inv S(c, target);      // Combined modifiers
```

### Procedures

```isq
// No return value: use 'procedure' or 'unit'
unit swap(qbit a, qbit b) { ... }

// With return value
double compute(int a, double b[]) { return ...; }

// Make procedure act as gate (for ctrl/inv modifiers)
unit my_gate(qbit a, qbit b) {
    CNOT(a, b);
    H(a);
} deriving gate
```

### Custom Gates & Oracles

```isq
// Define gate by matrix
defgate MyGate = [1,0,0,0; 0,1,0,0; 0,0,0,1; 0,0,1,0];

// Define gate by permutation
defgate Tof(3) = perm [0, 1, 2, 3, 4, 5, 7, 6];

// Oracle by truth table
oracle g(2, 1) = [0, 1, 0, 0];

// Oracle by boolean function
oracle bool[1] g(bool x[2]) {
    bool res[] = [x[0] && !x[1]];
    return res;
}
```

For the full syntax reference, see [syntax-reference.md](references/syntax-reference.md).
For code examples by difficulty level, see [examples.md](references/examples.md).

## Common Pitfalls

1. **Missing `import std;`** — Most programs need this for built-in gates.
2. **Rotation gate argument order** — `Rx(angle, qubit)`, NOT `Rx(qubit, angle)`.
3. **Braces required** — `if`/`while` blocks MUST have `{}` even for single statements.
4. **For-loop syntax** — Use `for i in 0:N { }`, not C-style `for(;;)`.
5. **Array init with length** — `int a[] = [1,2]` (no length) or `int a[3]` (no init), never both.
6. **Measurement type** — `M(q)` returns `bool` or `int` depending on context. `M(q_array)` returns `int` with bits.
7. **Global qubits for `--probs`** — When using `isq_simulate` with probability output, measured qubits must be global.
8. **Switch-case has no fall-through** — Unlike C, no `break` needed.
9. **`deriving gate` restrictions** — Procedure must be purely quantum (no classical side effects). Array params must have fixed length.
10. **Package and import paths** — Package keyword matches directory name. Import uses dot-separated path relative to parent of package root.
