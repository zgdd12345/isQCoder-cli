# isQ Code Examples

Annotated examples organized by difficulty level.

## Basic: Bell State

Creates a maximally entangled Bell state (|00⟩ + |11⟩)/√2.

```isq
import std;

procedure main() {
    qbit q[2];

    // Create superposition on first qubit
    H(q[0]);

    // Entangle with second qubit using CNOT
    CNOT(q[0], q[1]);
    // Alternative: ctrl X(q[0], q[1]);

    // Measure both qubits — results always correlate
    int a = M(q[0]);
    int b = M(q[1]);
    print a - b;  // Always prints 0
}
```

**Expected output**: `{"00": ~500, "11": ~500}` with 1000 shots.

---

## Basic: GHZ State (N qubits)

Generalizes Bell state to N qubits. All qubits measured as 0 or all as 1.

```isq
import std;

procedure main() {
    qbit q[3];

    // Superposition on first qubit
    H(q[0]);

    // Entangle chain: CNOT cascade
    for i in 0:2 {
        CNOT(q[i], q[i + 1]);
    }

    // Measure all
    M(q[0]); M(q[1]); M(q[2]);
}
```

**Expected output**: `{"000": ~500, "111": ~500}`.

---

## Basic: Single Qubit Operations

```isq
import std;

procedure main() {
    qbit q;

    // Different gates
    X(q);         // Flip: |0⟩ → |1⟩
    H(q);         // Superposition
    Rx(pi/4, q);  // Rotation (angle first!)

    int r = M(q);
    print r;
}
```

---

## Intermediate: Quantum Teleportation

Teleport a quantum state from source to destination using entanglement.

```isq
import std;

bool m1, m2;
qbit q_src, q_anc, q_dest;

procedure Teleport(qbit qsrc, qbit qanc, qbit qdest) {
    // Create entangled pair (ancilla-destination)
    H(qanc);
    CNOT(qanc, qdest);

    // Bell measurement on source-ancilla
    CNOT(qsrc, qanc);
    H(qsrc);
    m1 = M(qsrc);
    m2 = M(qanc);

    // Corrections based on measurement
    if (m2) { X(qdest); }
    if (m1) { Z(qdest); }
}

procedure main() {
    X(q_src);  // Prepare |1⟩ state to teleport
    Teleport(q_src, q_anc, q_dest);
    print M(q_dest);  // Should be 1
}
```

---

## Intermediate: Deutsch-Jozsa Algorithm

Determines if a boolean function is constant or balanced in one query.

```isq
import std;

// Oracle: balanced function f(x) = x
oracle g(1, 1) = [0, 1];

procedure main() {
    qbit q[2];

    // Prepare input superposition and ancilla
    X(q[0]);
    H(q[0]); H(q[1]);

    // Apply oracle
    g(q[1], q[0]);

    // Interfere input
    H(q[1]);

    // Measure input qubit: 0 = constant, 1 = balanced
    M(q[1]);
}
```

---

## Intermediate: Bernstein-Vazirani Algorithm

Finds a hidden bit string s in one query.

```isq
import std;

// Oracle for s = "101" (binary 5): f(x) = x·s mod 2
oracle bv_oracle(3, 1) = [0, 1, 0, 1, 1, 0, 1, 0];

procedure main() {
    qbit input[3], output[1];

    // Prepare ancilla in |-⟩
    X(output[0]);
    H(output[0]);

    // Create superposition of all inputs
    for i in 0:3 { H(input[i]); }

    // Query oracle
    bv_oracle(input, output);

    // Hadamard to decode
    for i in 0:3 { H(input[i]); }

    // Measure to get s
    M(input);
}
```

**Expected output**: `{"101": 1000}` (= binary 5).

---

## Advanced: Grover Search (3 qubits)

Searches for marked state among N=8 states.

```isq
import std;

procedure main() {
    qbit ancilla[11];
    qbit work[3];

    for i in 0:10 {
        // Create uniform superposition
        H(work[0]); H(work[1]); H(work[2]);

        // Oracle: mark target state
        CZ(work[0], work[2]);
        CZ(work[0], work[1]);

        // Diffusion operator
        H(work[0]); H(work[1]); H(work[2]);
        X(work[0]); X(work[1]); X(work[2]);
        Toffoli(work[2], work[1], ancilla[i]);
        CNOT(ancilla[i], work[0]);
        Toffoli(work[2], work[1], ancilla[i]);
        X(work[0]); X(work[1]); X(work[2]);
        H(work[0]); H(work[1]); H(work[2]);
    }
}
```

---

## Advanced: Quantum Phase Estimation (QPE)

```isq
import std;

procedure main() {
    qbit counting[3];
    qbit eigenstate;

    // Prepare eigenstate
    X(eigenstate);

    // Hadamard on counting register
    for i in 0:3 { H(counting[i]); }

    // Controlled-U^(2^k) operations
    ctrl Rz(pi, counting[0], eigenstate);
    ctrl Rz(2.0 * pi, counting[1], eigenstate);
    ctrl Rz(4.0 * pi, counting[2], eigenstate);

    // Inverse QFT on counting register
    // (simplified — full QFT requires controlled rotations)
    for i in 0:3 { H(counting[i]); }

    // Measure counting register to get phase
    M(counting);
}
```

---

## Pattern: Repeat Until Success

```isq
import std;

procedure main() {
    qbit q;
    bool result = true;

    while (result) {
        H(q);
        result = M(q);
    }
    // q is now in |0⟩ state (post-selected)
}
```

---

## Pattern: Controlled Custom Gate (deriving gate)

```isq
import std;

unit my_swap(qbit a, qbit b) {
    CNOT(b, a);
    CNOT(a, b);
    CNOT(b, a);
} deriving gate

procedure main() {
    qbit q[3];
    X(q[0]);
    X(q[1]);

    // Controlled-SWAP using the derived gate
    ctrl my_swap(q[0], q[1], q[2]);
}
```
