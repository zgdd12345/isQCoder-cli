/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Zhipu (智谱) ContentGenerator adapter.
 *
 * Translates between Google GenAI types (used throughout the codebase) and
 * the OpenAI-compatible API format that Zhipu's GLM models expose at
 * https://open.bigmodel.cn/api/paas/v4.
 */

import type {
  Content,
  Part,
  FunctionCall,
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  Candidate,
  Tool,
  GenerateContentConfig,
} from '@google/genai';
import type { ContentGenerator } from './contentGenerator.js';
import type { LlmRole } from '../telemetry/llmRole.js';
import { debugLogger } from '../utils/debugLogger.js';

// ─── Zhipu API constants ────────────────────────────────────────────────────

export const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
export const ZHIPU_DEFAULT_MODEL = 'glm-5';
export const ZHIPU_FALLBACK_MODEL = 'glm-4.7';

// ─── OpenAI-compatible request/response types ──────────────────────────────

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  tools?: OpenAITool[];
  tool_choice?: string | { type: string; function: { name: string } };
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  stream?: boolean;
}

interface OpenAIStreamToolCall {
  index?: number;
  id?: string;
  type?: 'function';
  function?: {
    name?: string;
    arguments?: string;
  };
}

interface OpenAIDelta {
  role?: string;
  content?: string | null;
  tool_calls?: OpenAIStreamToolCall[];
}

interface OpenAIChatResponseChoice {
  index: number;
  message?: {
    role: string;
    content?: string | null;
    tool_calls?: OpenAIToolCall[];
  };
  finish_reason: string | null;
  delta?: OpenAIDelta;
}

interface OpenAIChatResponse {
  id: string;
  choices: OpenAIChatResponseChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

// ─── Translation helpers ────────────────────────────────────────────────────

/**
 * Resolve model alias to a Zhipu model name.
 * If the requested model is a Gemini model or 'auto', use the Zhipu default.
 */
export function resolveZhipuModel(requestedModel: string): string {
  if (
    requestedModel.startsWith('gemini-') ||
    requestedModel === 'auto' ||
    requestedModel === 'pro' ||
    requestedModel === 'flash' ||
    requestedModel === 'flash-lite' ||
    requestedModel.startsWith('auto-gemini')
  ) {
    return ZHIPU_DEFAULT_MODEL;
  }
  // Allow explicit Zhipu model names to pass through
  if (requestedModel.startsWith('glm-')) {
    return requestedModel;
  }
  return ZHIPU_DEFAULT_MODEL;
}

/**
 * Extract text from a Content's parts.
 */
function partsToText(parts?: Part[]): string {
  if (!parts) return '';
  return parts
    .filter((p) => p.text !== undefined && !p.thought)
    .map((p) => p.text ?? '')
    .join('');
}

/**
 * Normalize systemInstruction to a string.
 * The GenAI SDK uses ContentUnion which can be Content, string, or Part[].
 */
function normalizeSystemInstruction(
  systemInstruction: unknown,
): string | undefined {
  if (!systemInstruction) return undefined;
  if (typeof systemInstruction === 'string') return systemInstruction;
  if (Array.isArray(systemInstruction)) {
    return systemInstruction
      .map((p: unknown) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object' && 'text' in p) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          return (p as Part).text ?? '';
        }
        return '';
      })
      .join('');
  }
  if (typeof systemInstruction === 'object' && 'parts' in systemInstruction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return partsToText((systemInstruction as Content).parts);
  }
  if (typeof systemInstruction === 'object' && 'text' in systemInstruction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (systemInstruction as Part).text ?? '';
  }
  return undefined;
}

/**
 * Convert Google GenAI Content[] to OpenAI messages[].
 */
function contentsToMessages(
  contents: Content[],
  systemInstruction?: unknown,
): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [];

  // Handle system instruction
  const systemText = normalizeSystemInstruction(systemInstruction);
  if (systemText) {
    messages.push({ role: 'system', content: systemText });
  }

  for (const content of contents) {
    const role = content.role === 'model' ? 'assistant' : 'user';
    const parts = content.parts ?? [];

    // Check if this content has function calls (assistant with tool_calls)
    const functionCalls = parts.filter((p) => p.functionCall);
    // Check if this content has function responses (tool messages)
    const functionResponses = parts.filter((p) => p.functionResponse);

    if (functionResponses.length > 0) {
      // Each function response becomes a separate 'tool' message
      for (const part of functionResponses) {
        const fr = part.functionResponse;
        if (fr) {
          messages.push({
            role: 'tool',
            tool_call_id: fr.id ?? fr.name ?? 'unknown',
            content: JSON.stringify(fr.response ?? {}),
          });
        }
      }
    } else if (functionCalls.length > 0) {
      // Assistant message with tool calls
      const textContent = partsToText(parts);
      const toolCalls: OpenAIToolCall[] = functionCalls.map((p, idx) => ({
        id: p.functionCall?.id ?? `call_${idx}`,
        type: 'function' as const,
        function: {
          name: p.functionCall?.name ?? '',
          arguments: JSON.stringify(p.functionCall?.args ?? {}),
        },
      }));
      messages.push({
        role: 'assistant',
        content: textContent || null,
        tool_calls: toolCalls,
      });
    } else {
      // Regular text message
      const textContent = partsToText(parts);
      messages.push({
        role,
        content: textContent || '',
      });
    }
  }

  return messages;
}

/**
 * Convert Google GenAI Tool[] (FunctionDeclarations) to OpenAI tools[].
 */
function toolsToOpenAI(tools?: unknown): OpenAITool[] | undefined {
  if (!tools || !Array.isArray(tools) || tools.length === 0) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  for (const tool of tools as Tool[]) {
    if (
      'functionDeclarations' in tool &&
      Array.isArray(tool.functionDeclarations)
    ) {
      for (const fd of tool.functionDeclarations) {
        openaiTools.push({
          type: 'function',
          function: {
            name: fd.name ?? '',
            description: fd.description,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            parameters: fd.parameters as unknown as Record<string, unknown>,
          },
        });
      }
    }
  }
  return openaiTools.length > 0 ? openaiTools : undefined;
}

/**
 * Build usage metadata from an OpenAI response.
 */
function buildUsageMetadata(
  usage?: OpenAIChatResponse['usage'],
): Record<string, number> | undefined {
  if (!usage) return undefined;
  return {
    promptTokenCount: usage.prompt_tokens,
    candidatesTokenCount: usage.completion_tokens,
    totalTokenCount: usage.total_tokens,
  };
}

/**
 * Attach `text` and `functionCalls` getters to a response-like object.
 * GenerateContentResponse is a class with getters, so we define them manually.
 */
function attachResponseGetters(
  resp: Record<string, unknown>,
): GenerateContentResponse {
  Object.defineProperty(resp, 'text', {
    get(): string | undefined {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const candidates = this.candidates as Candidate[] | undefined;
      const firstCandidate = candidates?.[0];
      if (!firstCandidate?.content?.parts) return undefined;
      const textParts = firstCandidate.content.parts
        .filter((p: Part) => p.text !== undefined && !p.thought)
        .map((p: Part) => p.text ?? '');
      return textParts.length > 0 ? textParts.join('') : undefined;
    },
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(resp, 'functionCalls', {
    get(): FunctionCall[] | undefined {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const candidates = this.candidates as Candidate[] | undefined;
      const firstCandidate = candidates?.[0];
      if (!firstCandidate?.content?.parts) return undefined;
      const fcs = firstCandidate.content.parts
        .filter((p: Part) => p.functionCall)
        .map((p: Part) => p.functionCall!);
      return fcs.length > 0 ? fcs : undefined;
    },
    enumerable: true,
    configurable: true,
  });

  // Add required stub properties
  if (!('data' in resp)) {
    Object.defineProperty(resp, 'data', {
      get() {
        return undefined;
      },
      enumerable: true,
      configurable: true,
    });
  }
  if (!('executableCode' in resp)) {
    Object.defineProperty(resp, 'executableCode', {
      get() {
        return undefined;
      },
      enumerable: true,
      configurable: true,
    });
  }
  if (!('codeExecutionResult' in resp)) {
    Object.defineProperty(resp, 'codeExecutionResult', {
      get() {
        return undefined;
      },
      enumerable: true,
      configurable: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return resp as unknown as GenerateContentResponse;
}

/**
 * Convert an OpenAI chat response to a Google GenAI GenerateContentResponse.
 */
function openAIResponseToGenAI(
  resp: OpenAIChatResponse,
): GenerateContentResponse {
  const candidates: Candidate[] = resp.choices.map((choice) => {
    const msg = choice.message ?? choice.delta;
    if (!msg) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return {
        content: { role: 'model', parts: [] },
        finishReason: 'STOP',
      } as unknown as Candidate;
    }

    const parts: Part[] = [];

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    // Add function calls
    if (
      'tool_calls' in msg &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (msg as { tool_calls?: OpenAIToolCall[] }).tool_calls
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const toolCalls = (msg as { tool_calls: OpenAIToolCall[] }).tool_calls;
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch (parseError) {
          debugLogger.debug(
            `[Zhipu] Failed to parse tool call arguments for "${tc.function.name}": ` +
              `raw="${tc.function.arguments}", error=${String(parseError)}`,
          );
          args = {};
        }
        const fc: FunctionCall = {
          id: tc.id,
          name: tc.function.name,
          args,
        };
        parts.push({ functionCall: fc });
      }
    }

    // Map OpenAI finish reasons to GenAI finish reasons
    let finishReason: string | undefined;
    switch (choice.finish_reason) {
      case 'stop':
      case 'tool_calls':
      case 'function_call':
        finishReason = 'STOP';
        break;
      case 'length':
        finishReason = 'MAX_TOKENS';
        break;
      case 'content_filter':
        finishReason = 'SAFETY';
        break;
      default:
        finishReason = choice.finish_reason ?? undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return {
      content: { role: 'model', parts },
      finishReason,
      index: choice.index,
    } as unknown as Candidate;
  });

  return attachResponseGetters({
    candidates,
    modelVersion: resp.model,
    responseId: resp.id,
    usageMetadata: buildUsageMetadata(resp.usage),
  });
}

/**
 * Normalize contents from GenerateContentParameters to Content[].
 */
function normalizeContents(
  contents: GenerateContentParameters['contents'],
): Content[] {
  if (Array.isArray(contents)) {
    // Check if it's Content[] or PartUnion[]
    if (contents.length > 0 && typeof contents[0] === 'string') {
      return [{ role: 'user', parts: [{ text: contents.join('') }] }];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return contents as Content[];
  }
  if (typeof contents === 'string') {
    return [{ role: 'user', parts: [{ text: contents }] }];
  }
  return [{ role: 'user', parts: [{ text: String(contents) }] }];
}

/**
 * Build the OpenAI request body from GenAI parameters.
 */
function buildRequestBody(
  model: string,
  contents: Content[],
  config: GenerateContentConfig | undefined,
  stream: boolean,
): OpenAIChatRequest {
  const messages = contentsToMessages(contents, config?.systemInstruction);
  const tools = toolsToOpenAI(config?.tools);

  return {
    model,
    messages,
    stream,
    ...(tools && { tools }),
    ...(config?.temperature !== undefined && {
      temperature: config.temperature,
    }),
    ...(config?.topP !== undefined && { top_p: config.topP }),
    ...(config?.maxOutputTokens !== undefined && {
      max_tokens: config.maxOutputTokens,
    }),
    ...(config?.stopSequences && { stop: config.stopSequences }),
  };
}

// ─── ZhipuContentGenerator ─────────────────────────────────────────────────

/**
 * A ContentGenerator implementation that calls Zhipu's GLM API
 * using the OpenAI-compatible chat/completions endpoint.
 */
export class ZhipuContentGenerator implements ContentGenerator {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = process.env['ZHIPU_API_BASE_URL'] ?? ZHIPU_BASE_URL;
  }

  async generateContent(
    request: GenerateContentParameters,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<GenerateContentResponse> {
    const model = resolveZhipuModel(request.model);
    const config = request.config;
    const contents = normalizeContents(request.contents);
    const body = buildRequestBody(model, contents, config, false);

    try {
      const resp = await this.fetchChatCompletions(body);
      return openAIResponseToGenAI(resp);
    } catch (error) {
      // If the primary model fails, try the fallback
      if (model === ZHIPU_DEFAULT_MODEL) {
        debugLogger.debug(
          `[Zhipu] Primary model ${model} failed, trying fallback ${ZHIPU_FALLBACK_MODEL}: ${String(error)}`,
        );
        body.model = ZHIPU_FALLBACK_MODEL;
        const resp = await this.fetchChatCompletions(body);
        return openAIResponseToGenAI(resp);
      }
      throw error;
    }
  }

  async generateContentStream(
    request: GenerateContentParameters,
    _userPromptId: string,
    _role: LlmRole,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const model = resolveZhipuModel(request.model);
    const config = request.config;
    const contents = normalizeContents(request.contents);
    const body = buildRequestBody(model, contents, config, true);

    const apiKey = this.apiKey;
    const baseUrl = this.baseUrl;

    async function* streamGenerator(): AsyncGenerator<GenerateContentResponse> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: config?.abortSignal ?? undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zhipu API error (${String(response.status)}): ${errorText}`,
        );
      }

      if (!response.body) {
        throw new Error('Zhipu API returned no response body for stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // Accumulate tool calls across stream chunks
      const accumulatedToolCalls: Map<
        number,
        { id: string; name: string; arguments: string }
      > = new Map();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              const chunk = JSON.parse(data) as OpenAIChatResponse;
              const choice = chunk.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta;
              if (!delta) continue;

              // Accumulate tool call arguments
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  const existing = accumulatedToolCalls.get(idx);
                  if (existing) {
                    existing.arguments += tc.function?.arguments ?? '';
                    if (tc.function?.name) {
                      existing.name = tc.function.name;
                    }
                    if (tc.id) {
                      existing.id = tc.id;
                    }
                  } else {
                    accumulatedToolCalls.set(idx, {
                      id: tc.id ?? `call_${idx}`,
                      name: tc.function?.name ?? '',
                      arguments: tc.function?.arguments ?? '',
                    });
                  }
                }
              }

              // Build response for text chunks only
              if (delta.content) {
                const contentText = delta.content;
                yield attachResponseGetters({
                  candidates: [
                    {
                      content: {
                        role: 'model',
                        parts: [{ text: contentText }],
                      },
                      finishReason:
                        choice.finish_reason === 'stop' ? 'STOP' : undefined,
                    },
                  ],
                  usageMetadata: buildUsageMetadata(chunk.usage),
                });
              }

              // If finish reason is tool_calls, emit the accumulated tool calls
              if (
                choice.finish_reason === 'tool_calls' ||
                choice.finish_reason === 'function_call'
              ) {
                const toolParts: Part[] = [];
                for (const [, tc] of accumulatedToolCalls) {
                  let args: Record<string, unknown> = {};
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    args = JSON.parse(tc.arguments) as Record<string, unknown>;
                  } catch (parseError) {
                    debugLogger.debug(
                      `[Zhipu] Failed to parse streamed tool call arguments for "${tc.name}": ` +
                        `raw="${tc.arguments}", error=${String(parseError)}`,
                    );
                    args = {};
                  }
                  toolParts.push({
                    functionCall: {
                      id: tc.id,
                      name: tc.name,
                      args,
                    },
                  });
                }

                yield attachResponseGetters({
                  candidates: [
                    {
                      content: { role: 'model', parts: toolParts },
                      finishReason: 'STOP',
                    },
                  ],
                  usageMetadata: buildUsageMetadata(chunk.usage),
                });
              }

              // Emit a finish chunk if stop reason is 'stop' and no content
              if (choice.finish_reason === 'stop' && !delta.content) {
                yield attachResponseGetters({
                  candidates: [
                    {
                      content: { role: 'model', parts: [] },
                      finishReason: 'STOP',
                    },
                  ],
                  usageMetadata: buildUsageMetadata(chunk.usage),
                });
              }
            } catch {
              // Skip unparseable SSE lines
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    return streamGenerator();
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    // Zhipu doesn't have a dedicated token counting endpoint.
    // Provide a rough estimate based on character count.
    // Chinese characters ≈ 1.5 tokens, English words ≈ 1 token.
    let totalChars = 0;
    if (request.contents) {
      const contents = Array.isArray(request.contents)
        ? request.contents
        : [request.contents];
      for (const content of contents) {
        if (typeof content === 'string') {
          totalChars += content.length;
        } else if (
          content &&
          typeof content === 'object' &&
          'parts' in content
        ) {
          totalChars += partsToText(content.parts).length;
        }
      }
    }
    // Rough estimate: 1 token per 1.5 characters for mixed CJK/English
    const estimatedTokens = Math.ceil(totalChars / 1.5);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return {
      totalTokens: estimatedTokens,
    } as unknown as CountTokensResponse;
  }

  async embedContent(
    _request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    // Zhipu has an embedding API at /embeddings but with different model names.
    // For now, throw a clear error if embedding is attempted.
    throw new Error(
      'Embedding is not yet supported with Zhipu API. Use Gemini API for embedding tasks.',
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private async fetchChatCompletions(
    body: OpenAIChatRequest,
  ): Promise<OpenAIChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Zhipu API error (${String(response.status)}): ${errorText}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (await response.json()) as OpenAIChatResponse;
  }
}
