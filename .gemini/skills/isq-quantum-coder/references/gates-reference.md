# isQ Quantum Gates Reference

Complete reference for all built-in quantum gates in isQ.

## Single-Qubit Gates

| Gate | Signature | Description |
|------|-----------|-------------|
| `X` | `X(qbit q)` | Pauli-X (bit flip) |
| `Y` | `Y(qbit q)` | Pauli-Y |
| `Z` | `Z(qbit q)` | Pauli-Z (phase flip) |
| `H` | `H(qbit q)` | Hadamard (creates superposition) |
| `S` | `S(qbit q)` | Phase gate (S² = Z) |
| `T` | `T(qbit q)` | π/8 gate (T² = S) |

## Rotation Gates

> **⚠️ Argument order: angle FIRST, qubit SECOND.**

| Gate | Signature | Description |
|------|-----------|-------------|
| `Rx` | `Rx(double θ, qbit q)` | Rotation about X axis |
| `Ry` | `Ry(double θ, qbit q)` | Rotation about Y axis |
| `Rz` | `Rz(double θ, qbit q)` | Rotation about Z axis |
| `X2P` | `X2P(qbit q)` | Rx(π/2) |
| `X2M` | `X2M(qbit q)` | Rx(-π/2) |
| `Y2P` | `Y2P(qbit q)` | Ry(π/2) |
| `Y2M` | `Y2M(qbit q)` | Ry(-π/2) |

## Universal Gate

| Gate | Signature | Description |
|------|-----------|-------------|
| `U3` | `U3(double θ, double φ, double λ, qbit q)` | Generic single-qubit rotation |

Equivalences: `U3(θ, -π/2, π/2) = Rx(θ)`, `U3(θ, 0, 0) = Ry(θ)`

## Multi-Qubit Gates

| Gate | Signature | Description |
|------|-----------|-------------|
| `CNOT` | `CNOT(qbit control, qbit target)` | Controlled-NOT |
| `CZ` | `CZ(qbit control, qbit target)` | Controlled-Z |
| `Toffoli` | `Toffoli(qbit c1, qbit c2, qbit target)` | Double-controlled NOT |

## Special Operations

| Operation | Signature | Description |
|-----------|-----------|-------------|
| `M` | `M(qbit q)` → `bool`/`int` | Measurement (collapses state) |
| `M` | `M(qbit q[])` → `int` | Array measurement (first qubit = lowest bit) |
| `\|0>` | `\|0>(qbit q)` | Reset qubit to \|0⟩ |
| `GPhase` | `GPhase(double θ)` | Global phase (no qubit param) |

## Gate Modifiers

Apply to any gate or `deriving gate` procedure:

```isq
ctrl X(c, t);         // Controlled-X = CNOT
ctrl<2> S(c1, c2, t); // Doubly-controlled S
nctrl X(c, t);        // Negative-controlled X (acts when c = |0⟩)
inv S(q);             // S† (conjugate transpose)
nctrl inv S(c, t);    // Combined: negative-controlled S†
```

## Custom Gate Definition

### By Matrix

```isq
defgate MyGate = [
    0.5+0.8660254j, 0, 0, 0;
    0, 1, 0, 0;
    0, 0, 1, 0;
    0, 0, 0, 1
];
// Matrix must be unitary, size = power of 2
// Define OUTSIDE procedures, use INSIDE
```

### By Permutation

```isq
defgate MyPerm(3) = perm [0, 1, 2, 3, 4, 5, 7, 6];
// Only for gates that permute computational basis states
// Maps |i⟩ → |perm[i]⟩
```

## Array/Slice Application

Gates applied to arrays act element-wise:

```isq
qbit p[3], q[3];
H(p);              // = H(p[0]); H(p[1]); H(p[2]);
CNOT(p, q[:2]);    // = CNOT(p[0],q[0]); CNOT(p[1],q[1]);
                   // Length determined by SHORTEST array
```
