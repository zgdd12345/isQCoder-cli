# Project Context

- **Simulator:** isq-simulator
- **Target Qubits:** 10
- **Algorithm Focus:** VQE / QAOA / Grover / General
- **Python Version:** 3.10+
- **isqtools Version:** >= 0.5

# Conventions

- Use isQ v2.x syntax
- Python code interacts with isQ via isqtools
- Docker environment: arclightquantum/isqc-python:latest
- All isQ files must start with `import std;`
- Entry point must be `procedure main() { ... }`
- Use `for i in 0:n { }` loop syntax (NOT C-style)

# Preferred Patterns

- Use `deriving gate` for reusable unitary operations
- Measure results with `print M(q[i]);`
- Comment code with `//` (NOT `#`)
