# isQ Language Quick Reference

## File Structure

```isq
import std;

procedure main() {
    // code here
}
```

## Types

| Type   | Example          | Notes                  |
| ------ | ---------------- | ---------------------- |
| `qbit` | `qbit q[n];`     | Inside procedures only |
| `bool` | `bool b = true;` | Can be global          |
| `int`  | `int a = 0;`     | —                      |

## For Loops

```isq
for i in 0:n { ... }      // [0, n)
for i in 1:n { ... }      // [1, n)
for i in 0:n:2 { ... }    // step = 2
```

**NOT** C-style: `for (int i = 0; i < n; i++)` is INVALID.

## Quantum Gates

| Gate        | Syntax                                       |
| ----------- | -------------------------------------------- |
| Hadamard    | `H(q[0]);`                                   |
| Pauli-X/Y/Z | `X(q[0]);`                                   |
| Phase S/T   | `S(q[0]);`                                   |
| Rotation    | `Rx(theta, q[0]);`                           |
| CNOT        | `CNOT(q[0], q[1]);` or `ctrl X(q[0], q[1]);` |
| CZ          | `CZ(q[0], q[1]);`                            |
| Toffoli     | `Toffoli(q[0], q[1], q[2]);`                 |

## Measurement

```isq
bool result = M(q[0]);  // returns bool
print M(q[0]);           // print result directly
```

## Print

```isq
print M(q[0]);     // OK
print variable;    // OK
// print(expr);    // WRONG - no parentheses
// print a, b;     // WRONG - single arg only
```

## Comments

```isq
// single line comment
/* multi-line
   comment */
// # is NOT valid for comments
```

## Functions

```isq
procedure myFunc(qbit q) { ... }
// void, def, proc are NOT valid keywords
```

## Deriving Gate

```isq
procedure oracle(qbit q[2]) deriving gate {
    // Only unitary operations allowed
    // NO print, M(), reset, if, for
    X(q[0]);
    CZ(q[0], q[1]);
}
```
