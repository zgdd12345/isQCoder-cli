/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * isQ language definition for highlight.js / lowlight.
 *
 * Provides syntax highlighting for the isQ quantum programming language.
 * Based on the isQ language specification from the isQCoder project.
 *
 * @see https://isq.arclightquantum.com/
 */
import type { HLJSApi, Language } from 'highlight.js';

export function isqLanguage(_hljs: HLJSApi): Language {
  // isQ keywords
  const KEYWORDS = {
    keyword: [
      'procedure',
      'function',
      'import',
      'package',
      'if',
      'else',
      'for',
      'in',
      'while',
      'return',
      'let',
      'var',
      'const',
      'print',
      'ctrl',
      'nctrl',
      'inv',
      'deriving',
      'gate',
      'oracle',
      'pass',
      'switch',
      'case',
      'default',
      'break',
      'continue',
    ],
    type: ['qbit', 'int', 'double', 'bool', 'unit'],
    literal: ['true', 'false', 'M'],
    built_in: [
      // Single-qubit gates
      'H',
      'X',
      'Y',
      'Z',
      'S',
      'T',
      'Rx',
      'Ry',
      'Rz',
      'U1',
      'U2',
      'U3',
      'SX',
      'Sd',
      'Td',
      // Multi-qubit gates
      'CNOT',
      'CZ',
      'CX',
      'SWAP',
      'CCX',
      'Toffoli',
      'Fredkin',
      // Measurement & utilities
      'GPhase',
      'BP',
      // Standard library
      'std',
    ],
  };

  // Number modes
  const NUMBER = {
    className: 'number',
    variants: [
      { begin: '\\b\\d+\\.\\d+\\b' }, // float
      { begin: '\\b0x[0-9a-fA-F]+\\b' }, // hex
      { begin: '\\b0b[01]+\\b' }, // binary
      { begin: '\\b\\d+\\b' }, // integer
    ],
    relevance: 0,
  };

  // String mode
  const STRING = {
    className: 'string',
    variants: [{ begin: '"', end: '"', contains: [{ begin: '\\\\.' }] }],
  };

  // Comment modes
  const LINE_COMMENT = {
    className: 'comment',
    begin: '//',
    end: '$',
    relevance: 0,
  };

  const BLOCK_COMMENT = {
    className: 'comment',
    begin: '/\\*',
    end: '\\*/',
    contains: ['self' as const],
  };

  // Procedure/function definition
  const PROCEDURE = {
    className: 'title.function',
    begin: '(?:procedure|function)\\s+',
    end: '\\s*\\(',
    excludeBegin: true,
    excludeEnd: true,
    keywords: KEYWORDS,
  };

  // Import statement
  const IMPORT = {
    className: 'meta',
    begin: '\\bimport\\b',
    end: ';',
    keywords: KEYWORDS,
  };

  // Quantum-specific: qubit array declarations like qbit q[2]
  const QBIT_DECL = {
    begin: '\\bqbit\\b',
    keywords: KEYWORDS,
    relevance: 10,
  };

  // Quantum gates with high relevance
  const QUANTUM_GATE = {
    className: 'built_in',
    begin:
      '\\b(?:H|X|Y|Z|S|T|CNOT|CZ|CX|SWAP|CCX|Rx|Ry|Rz|U1|U2|U3|SX|Sd|Td|GPhase|Toffoli|Fredkin)\\b',
    relevance: 5,
  };

  // Measurement
  const MEASUREMENT = {
    className: 'literal',
    begin: '\\bM\\s*\\(',
    end: '\\)',
    keywords: KEYWORDS,
    relevance: 10,
  };

  // ctrl/inv modifiers
  const MODIFIER = {
    className: 'keyword',
    begin: '\\b(?:ctrl|nctrl|inv)\\b',
    relevance: 5,
  };

  // deriving gate
  const DERIVING = {
    className: 'keyword',
    begin: '\\bderiving\\s+gate\\b',
    relevance: 10,
  };

  return {
    name: 'isQ',
    aliases: ['isq'],
    case_insensitive: false,
    keywords: KEYWORDS,
    contains: [
      LINE_COMMENT,
      BLOCK_COMMENT,
      STRING,
      NUMBER,
      PROCEDURE,
      IMPORT,
      QBIT_DECL,
      QUANTUM_GATE,
      MEASUREMENT,
      MODIFIER,
      DERIVING,
    ],
  };
}
