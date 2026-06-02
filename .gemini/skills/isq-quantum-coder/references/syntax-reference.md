# isQ Syntax Reference

Complete syntax reference for the isQ quantum programming language.

## Table of Contents

1. [Package & Import](#package--import)
2. [Types](#types)
3. [Classical Operations](#classical-operations)
4. [Quantum Operations](#quantum-operations)
5. [Procedures](#procedures)
6. [Control Flow](#control-flow)
7. [Modifiers](#modifiers)
8. [Custom Gates (defgate)](#custom-gates)
9. [Oracles](#oracles)
10. [Templates](#templates)
11. [Runtime Parameters](#runtime-parameters)

## Package & Import

```isq
// Package declaration (matches directory name in file path)
package mypackage;

// Import standard library (REQUIRED for built-in gates)
import std;

// Import another isQ file (dot-separated path)
import aaa.ccc;  // imports aaa/ccc.isq relative to parent of package root
```

**Key rules:**
- Package root matched from file path, bottom-up by folder name
- Global variables/procedures accessible via qualified names: `aaa.ccc.varname`
- `main` procedure is NEVER importable

## Types

### Primitive Types

| Type | Description | Default | Example |
|------|-------------|---------|---------|
| `int` | 64-bit signed integer | 0 | `int a = 42;` |
| `double` | Double precision float | 0.0 | `double d = pi;` |
| `bool` | Boolean | false | `bool b = true;` |
| `qbit` | Quantum bit | \|0⟩ | `qbit q;` |
| `unit` | Void return type | — | `unit main() {}` |

Built-in constant: `pi` = 3.14159...

### Arrays

```isq
qbit q[3];                  // Fixed-length array (global: must be integer literal)
int a[] = [1, 2, 3];        // Init array (NO length specifier)
int b[a.length];             // Local array, expression-length OK
```

**Never combine length AND initializer**: `int a[3] = [1,2,3]` is INVALID.

### Slices

```isq
a[2:4]      // elements at index 2, 3
a[:2]       // first 2 elements (start defaults to 0)
a[2:]       // from index 2 to end
a[2:0:-1]   // reverse: elements at index 2, 1 (step=-1, all fields required)
```

### Automatic Type Conversion

`bool → int → double` (automatic). `true → 1`, `false → 0`.

## Classical Operations

### Operators

| Category | Operators |
|----------|-----------|
| Arithmetic | `+`, `-`, `*`, `/`, `**` (power), `%` |
| Comparison | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Logical | `&&`, `and`, `\|\|`, `or`, `!`, `not` |
| Bitwise | `&`, `\|\|\|`, `^` (XOR) |
| Shift | `>>`, `<<` |

### Print & Assert

```isq
print a;          // Print int or double
assert true;      // OK
assert(3 == 4);   // Program abort
```

### Pure Classical Expressions (experimental)

```isq
int a = let b: int = 1 in b + b;  // let-binding

int a = letrec factorial(n: int) -> int =
    if n <= 0 then 1 else n * factorial(n - 1)
  in factorial(4);  // Recursive lambda
```

## Quantum Operations

### Basic Operations

```isq
H(q[0]);                    // Single-qubit gate
CNOT(q[0], q[1]);           // Two-qubit gate
Toffoli(c1, c2, target);    // Three-qubit gate
Rx(theta, q);               // Parameterized gate (ANGLE FIRST)
U3(theta, phi, lambda, q);  // Universal single-qubit
```

### Measurement

```isq
bool x = M(q);              // Measure single qubit → bool
int x = M(q);               // Measure single qubit → int (0 or 1)
int x = M(q_array);         // Measure array → int (first qubit = lowest bit)
```

### Array/Slice Application

```isq
H(p);              // = H(p[0]); H(p[1]); H(p[2]);
CNOT(p, q[:2]);    // = CNOT(p[0],q[0]); CNOT(p[1],q[1]);
```

### Quantum State Preparation

```isq
qbit q[2];
q = [1, 0, 0, -1];       // Amplitude array (normalized automatically)
q = |0> - |3>;            // Ket expression (little-endian)
```

**Little-endian**: `q = |2>;` means `q[1]=|1⟩, q[0]=|0⟩`.

### Reset

```isq
|0>(q);   // Reset qubit to |0⟩
```

## Procedures

```isq
// No return (use 'procedure', 'unit', or return type 'unit')
unit swap(qbit a, qbit b) { ... }
procedure swap(qbit a, qbit b) { ... }  // equivalent

// With return
double compute(int a, double b[]) { return 0.0; }

// Alternative parameter syntax
unit circuit(a: qbit, b: qbit) { ... }

// Procedure as parameter
unit circuit(qbit a, qbit b, unit two_bit_gate(qbit, qbit)) {
    two_bit_gate(a, b);
}
// Alt: unit circuit(a: qbit, b: qbit, gate: (qbit, qbit)->unit) { ... }
```

### `deriving gate`

Convert pure-quantum procedure to gate (enables `ctrl`/`inv`):

```isq
unit swap(qbit a, qbit b) {
    CNOT(b, a); CNOT(a, b); CNOT(b, a);
} deriving gate

// Now usable with modifiers:
ctrl swap(control, q[0], q[1]);
```

**Restrictions**: No classical side-effects, array params must have fixed length.

## Control Flow

### if/else

```isq
if (condition) {    // Braces ALWAYS required
    ...
} else {
    ...
}
```

### for loop

```isq
for i in 0:10 { ... }      // Range [0, 10), step 1
for j in 0:10:3 { ... }    // Range [0, 10), step 3
for v in array { ... }     // Array iteration
```

Supports `break` and `continue`.

### while loop

```isq
while (condition) { ... }  // Braces ALWAYS required
```

### switch-case

```isq
switch a {
    case 1: b = 3;
    case 2: b = 4;
    default: b = 5;
}
```

**NO fall-through** (unlike C). No `break` needed.

Quantum switch:

```isq
switch q {
    case |3>: ctrl Rx(pi, r, p);
    default: H(p);
}
```

## Modifiers

| Modifier | Syntax | Effect |
|----------|--------|--------|
| `ctrl` | `ctrl Gate(c, t)` | Gate applied when control=\|1⟩ |
| `ctrl<N>` | `ctrl<2> S(c1, c2, t)` | N control qubits |
| `nctrl` | `nctrl X(c, t)` | Gate applied when control=\|0⟩ |
| `inv` | `inv S(q)` | Conjugate transpose (S†) |

Combinable: `nctrl inv S(c, t)` — negative-controlled inverse S.

## Custom Gates

### Matrix Definition

```isq
defgate Rs = [
    0.5+0.8660254j, 0, 0, 0;
    0, 1, 0, 0;
    0, 0, 1, 0;
    0, 0, 0, 1
];
Rs(q[0], q[1]);  // Apply 2-qubit gate
```

Must be unitary, size must be power of 2. Defined outside procedures, used inside.

### Permutation Definition

```isq
defgate Tof(3) = perm [0, 1, 2, 3, 4, 5, 7, 6];
// Maps |i⟩→|perm[i]⟩
```

## Oracles

### Value Table

```isq
oracle g(2, 1) = [0, 1, 0, 0];  // f: {0,1}^2 → {0,1}^1
// g(n_work, n_ancilla) = [f(0), f(1), ..., f(2^n - 1)]
g(q[2], q[1], q[0]);  // Apply oracle
```

### Boolean Function

```isq
oracle bool[1] g(bool x[2]) {
    bool res[] = [x[0] && !x[1]];
    return res;
}
g(p, q);  // p: qbit[2] (work), q: qbit[1] (ancilla)
```

## Templates

```isq
unit fun<int N>() { print N; }
unit fun::<6>() { print 6666; }  // Specialization

unit main() {
    fun::<2>();       // Prints 2
    fun::<(3+1)>();   // Expressions need parentheses
}
```

Enables recursive patterns and compile-time specialization.

## Runtime Parameters

```isq
unit main(int i_par[], double d_par[]) {
    Rx(d_par[0], q);
    if (i_par[1] == 2) { ... }
}
```

Pass at simulation: `isqc simulate -i 1 -i 2 -d 1.3 file.so`
