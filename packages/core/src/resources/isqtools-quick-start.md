# isqtools Python SDK Quick Start

## Installation

```bash
pip install isqtools
```

## Basic Usage

### Import

```python
import isqtools
```

### Define a Quantum Circuit with isQ

```python
# Write isQ code as a string
isq_code = """
import std;
procedure main() {
    qbit q[2];
    H(q[0]);
    ctrl X(q[0], q[1]);
    print M(q[0]);
    print M(q[1]);
}
"""

# Compile and simulate
result = isqtools.run(isq_code)
print(result)
```

### Using isqtools API

```python
import isqtools

# Create a quantum task
task = isqtools.LocalTask()

# Write isQ source file
with open("bell.isq", "w") as f:
    f.write("""
import std;
procedure main() {
    qbit q[2];
    H(q[0]);
    ctrl X(q[0], q[1]);
    print M(q[0]);
    print M(q[1]);
}
""")

# Compile
task.compile("bell.isq")

# Simulate with specified shots
result = task.simulate(shots=1000)
print(result)
```

## Docker Environment

isqtools requires the isQ compiler toolchain. Use the Docker image:

```bash
docker run -it --rm arclightquantum/isqc-python:latest
```

This image includes:

- isQ compiler (`isqc`)
- Python 3.10+
- isqtools package
- Quantum simulator

## Key Concepts

| Concept          | Description                          |
| ---------------- | ------------------------------------ |
| `isqtools.run()` | Compile and run isQ code in one call |
| `LocalTask`      | Manage compile/simulate lifecycle    |
| `compile()`      | Compile `.isq` file to IR            |
| `simulate()`     | Run quantum simulation               |
| `shots`          | Number of measurement repetitions    |
