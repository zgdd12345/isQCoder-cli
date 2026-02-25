# Common Quantum Algorithm Patterns in isQ

## Bell State (2-Qubit Entanglement)

```isq
import std;
procedure main() {
    qbit q[2];
    H(q[0]);
    ctrl X(q[0], q[1]);
    print M(q[0]);
    print M(q[1]);
}
```

Creates maximally entangled state: measurement results are always correlated.

## GHZ State (N-Qubit Entanglement)

```isq
import std;
procedure main() {
    qbit q[3];
    H(q[0]);
    ctrl X(q[0], q[1]);
    ctrl X(q[0], q[2]);
    print M(q[0]);
    print M(q[1]);
    print M(q[2]);
}
```

Generalizes Bell state to N qubits: all measure 0 or all measure 1.

## Grover Search (2-Qubit, Target |11>)

```isq
import std;
procedure main() {
    qbit q[2];
    // Superposition
    H(q[0]); H(q[1]);
    // Oracle: phase-flip target
    CZ(q[0], q[1]);
    // Diffusion operator
    H(q[0]); H(q[1]);
    X(q[0]); X(q[1]);
    CZ(q[0], q[1]);
    X(q[0]); X(q[1]);
    H(q[0]); H(q[1]);
    // Measure
    print M(q[0]);
    print M(q[1]);
}
```

Amplitude amplification: boosts probability of target state.

## Quantum Teleportation

```isq
import std;
bool m1, m2;

procedure Teleport(qbit qsrc, qbit qanc, qbit qdest) {
    H(qanc);
    CNOT(qanc, qdest);
    CNOT(qsrc, qanc);
    H(qsrc);
    m1 = M(qsrc);
    m2 = M(qanc);
    if (m2) { X(qdest); }
    if (m1) { Z(qdest); }
}

procedure main() {
    qbit q[3];
    X(q[0]);  // Prepare state to teleport
    Teleport(q[0], q[1], q[2]);
    print M(q[2]);  // Should print true (1)
}
```

Transfers quantum state using entanglement and classical communication.

## Quantum Oracle with Deriving Gate

```isq
import std;

procedure oracle(qbit q[2]) deriving gate {
    X(q[0]); X(q[1]);
    CZ(q[0], q[1]);
    X(q[0]); X(q[1]);
}

procedure main() {
    qbit q[2];
    H(q[0]); H(q[1]);
    oracle(q);
    H(q[0]); H(q[1]);
    print M(q[0]);
    print M(q[1]);
}
```

`deriving gate` marks a procedure as a unitary operation (no
print/M/reset/if/for inside).

## Uniform Superposition (N Qubits)

```isq
import std;
procedure main() {
    qbit q[4];
    for i in 0:4 {
        H(q[i]);
    }
    for i in 0:4 {
        print M(q[i]);
    }
}
```

Creates equal superposition of all 2^N basis states.
