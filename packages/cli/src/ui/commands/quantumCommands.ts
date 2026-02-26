/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Quantum-specific slash commands for isQCoder.
 *
 * These commands provide quick access to isQ quantum computing workflows
 * via the MCP Server integration (isQCodeAgent backend).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  CommandContext,
  SlashCommand,
  SlashCommandActionReturn,
} from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';

/**
 * /qrun [file] — Compile and simulate an isQ file.
 * Reads the specified .isq file and asks the LLM to compile and simulate it
 * using the isq_compile and isq_simulate MCP tools.
 */
export const qrunCommand: SlashCommand = {
  name: 'qrun',
  description:
    'Compile and simulate an isQ quantum program. Usage: /qrun <file.isq>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const filePath = args?.trim();
    if (!filePath) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Usage: /qrun <file.isq>\nPlease specify an isQ file to compile and simulate.',
      };
    }

    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    const resolvedPath = path.resolve(targetDir, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        type: 'message',
        messageType: 'error',
        content: `File not found: ${resolvedPath}`,
      };
    }

    const code = fs.readFileSync(resolvedPath, 'utf-8');

    return {
      type: 'submit_prompt',
      content: [
        {
          text: `Please compile and simulate the following isQ quantum program from file "${filePath}". Use the isq_compile tool first to check for errors, then use isq_simulate to run it and show the quantum measurement results.\n\n\`\`\`isq\n${code}\n\`\`\``,
        },
      ],
    };
  },
  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<string[]> => {
    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    try {
      const entries = fs.readdirSync(targetDir);
      return entries
        .filter((e) => e.endsWith('.isq') && e.startsWith(partialArg))
        .map((e) => e);
    } catch {
      return [];
    }
  },
};

/**
 * /qfix [file] — Auto-fix isQ compilation errors.
 * Reads the specified .isq file and asks the LLM to use the isq_auto_fix
 * MCP tool to automatically repair compilation errors.
 */
export const qfixCommand: SlashCommand = {
  name: 'qfix',
  description: 'Auto-fix isQ compilation errors. Usage: /qfix <file.isq>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const filePath = args?.trim();
    if (!filePath) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Usage: /qfix <file.isq>\nPlease specify an isQ file to fix.',
      };
    }

    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    const resolvedPath = path.resolve(targetDir, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        type: 'message',
        messageType: 'error',
        content: `File not found: ${resolvedPath}`,
      };
    }

    const code = fs.readFileSync(resolvedPath, 'utf-8');

    return {
      type: 'submit_prompt',
      content: [
        {
          text: `The following isQ program from "${filePath}" has compilation errors. Please use the isq_auto_fix tool to automatically diagnose and fix the errors, then show me the corrected code and explain what was wrong.\n\n\`\`\`isq\n${code}\n\`\`\``,
        },
      ],
    };
  },
  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<string[]> => {
    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    try {
      const entries = fs.readdirSync(targetDir);
      return entries
        .filter((e) => e.endsWith('.isq') && e.startsWith(partialArg))
        .map((e) => e);
    } catch {
      return [];
    }
  },
};

/**
 * /qpy [file] — Execute isqtools Python code in Docker sandbox.
 * Reads a Python file and asks the LLM to run it using the isqtools_run
 * MCP tool inside the isQ Docker container.
 */
export const qpyCommand: SlashCommand = {
  name: 'qpy',
  description:
    'Execute isqtools Python code in Docker sandbox. Usage: /qpy <file.py>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (
    context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const filePath = args?.trim();
    if (!filePath) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Usage: /qpy <file.py>\nPlease specify a Python file to execute.',
      };
    }

    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    const resolvedPath = path.resolve(targetDir, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        type: 'message',
        messageType: 'error',
        content: `File not found: ${resolvedPath}`,
      };
    }

    const code = fs.readFileSync(resolvedPath, 'utf-8');

    // Also look for .isq files in the same directory to include
    const dir = path.dirname(resolvedPath);
    const isqFiles: Array<{ filename: string; content: string }> = [];
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.endsWith('.isq')) {
          const isqPath = path.join(dir, entry);
          isqFiles.push({
            filename: entry,
            content: fs.readFileSync(isqPath, 'utf-8'),
          });
        }
      }
    } catch {
      // Ignore directory read errors
    }

    const isqContext =
      isqFiles.length > 0
        ? `\n\nThe following .isq files are in the same directory and should be included:\n${isqFiles.map((f) => `\n**${f.filename}:**\n\`\`\`isq\n${f.content}\n\`\`\``).join('\n')}`
        : '';

    return {
      type: 'submit_prompt',
      content: [
        {
          text: `Please execute the following Python code from "${filePath}" using the isqtools_run tool in the Docker sandbox.${isqContext}\n\n\`\`\`python\n${code}\n\`\`\``,
        },
      ],
    };
  },
  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<string[]> => {
    const targetDir = context.services.config?.getTargetDir() || process.cwd();
    try {
      const entries = fs.readdirSync(targetDir);
      return entries
        .filter((e) => e.endsWith('.py') && e.startsWith(partialArg))
        .map((e) => e);
    } catch {
      return [];
    }
  },
};

/**
 * /qsearch [query] — Search the isQ knowledge base via RAG.
 */
export const qsearchCommand: SlashCommand = {
  name: 'qsearch',
  description: 'Search isQ knowledge base. Usage: /qsearch <query>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const query = args?.trim();
    if (!query) {
      return {
        type: 'message',
        messageType: 'error',
        content:
          'Usage: /qsearch <query>\nExample: /qsearch how to create a Bell state in isQ',
      };
    }

    return {
      type: 'submit_prompt',
      content: [
        {
          text: `Please search the isQ knowledge base using the isq_rag_search tool for: "${query}". Show the most relevant results with code examples if available.`,
        },
      ],
    };
  },
};

/**
 * /qtemplate [algorithm] — Generate quantum algorithm template code.
 * Uses the fast-path system for instant template matching.
 */
export const qtemplateCommand: SlashCommand = {
  name: 'qtemplate',
  description:
    'Generate quantum algorithm template. Usage: /qtemplate <algorithm>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (
    _context: CommandContext,
    args: string,
  ): Promise<SlashCommandActionReturn> => {
    const algorithm = args?.trim();
    if (!algorithm) {
      return {
        type: 'message',
        messageType: 'info',
        content: [
          'Usage: /qtemplate <algorithm>',
          '',
          'Available templates:',
          '  bell      — Bell state (quantum entanglement)',
          '  ghz       — GHZ state (multi-qubit entanglement)',
          '  hadamard  — Hadamard gate (superposition)',
          '  cnot      — CNOT entanglement',
          '  teleport  — Quantum teleportation',
          '  grover    — Grover search algorithm',
          '  qft       — Quantum Fourier Transform',
          '',
          'Example: /qtemplate bell',
        ].join('\n'),
      };
    }

    return {
      type: 'submit_prompt',
      content: [
        {
          text: `Please use the isq_fast_path tool to generate a template for: "${algorithm}". If a template matches, show the code. If not, generate the isQ code using isq_generate.`,
        },
      ],
    };
  },
  completion: async (): Promise<string[]> => [
    'bell',
    'ghz',
    'hadamard',
    'cnot',
    'teleport',
    'grover',
    'qft',
  ],
  showCompletionLoading: false,
};

/**
 * /qenv — Check quantum development environment status.
 */
export const qenvCommand: SlashCommand = {
  name: 'qenv',
  description: 'Check quantum development environment (Docker, isqc, MCP)',
  kind: CommandKind.BUILT_IN,
  autoExecute: true,
  action: async (context: CommandContext): Promise<void> => {
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: [
          '🔍 Checking quantum development environment...',
          '',
          'Use the following to verify your setup:',
          '  • Docker: `docker --version`',
          '  • isQ compiler: `docker run --rm isqc-python:latest isqc --version`',
          '  • MCP Server: `python -m isq_agent.mcp_server --help`',
          '  • Qdrant: `curl http://localhost:6333/collections`',
          '',
          'Or ask me: "Check if the quantum development environment is ready"',
        ].join('\n'),
      },
      Date.now(),
    );
  },
};
