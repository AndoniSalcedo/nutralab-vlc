import { env } from '@/config/env';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Cliente OpenRouter para llamadas de chat, visión, documentos y tool calling.
 */
class OpenRouterClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || env.OPEN_ROUTER_API || '';
    this.messages = {
      create: this.createMessage.bind(this)
    };
  }

  async createMessage(params = {}) {
    const apiKey = this.apiKey || env.OPEN_ROUTER_API || '';

    if (!apiKey) {
      throw new Error('No se ha configurado la API key de OpenRouter (OPEN_ROUTER_API está vacía).');
    }

    // Modelo por defecto unificado (gpt-6-luna-pro)
    let model = params.model || env.AI_MODEL || 'openai/gpt-6-luna-pro';
    if (typeof model === 'string' && model.startsWith('claude-')) {
      model = env.AI_MODEL || 'openai/gpt-6-luna-pro';
    }

    // Normalizar mensajes al formato de OpenRouter / OpenAI
    const messages = (params.messages || []).map(msg => {
      let content = msg.content;
      if (Array.isArray(content)) {
        content = content.map(part => {
          if (part.type === 'text') {
            return { type: 'text', text: part.text };
          }
          if (part.type === 'image_url') {
            return {
              type: 'image_url',
              image_url: typeof part.image_url === 'string' ? { url: part.image_url } : part.image_url
            };
          }
          if (part.type === 'image' && part.source?.type === 'base64') {
            return {
              type: 'image_url',
              image_url: {
                url: `data:${part.source.media_type || 'image/jpeg'};base64,${part.source.data}`
              }
            };
          }
          if (part.type === 'document' && part.source?.type === 'base64') {
            return {
              type: 'file',
              file: {
                filename: 'document.pdf',
                file_data: `data:${part.source.media_type || 'application/pdf'};base64,${part.source.data}`
              }
            };
          }
          if (part.type === 'file') {
            return part;
          }
          return part;
        });
      }
      return {
        role: msg.role,
        content
      };
    });

    const payload = {
      model,
      messages,
      max_tokens: params.max_tokens || 8192
    };

    if (params.temperature !== undefined) {
      payload.temperature = params.temperature;
    }

    // Soporte para tools (function calling)
    if (Array.isArray(params.tools) && params.tools.length > 0) {
      payload.tools = params.tools.map(tool => {
        if (tool.type === 'function') return tool;
        return {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema || tool.parameters || {}
          }
        };
      });

      if (params.tool_choice) {
        if (typeof params.tool_choice === 'object') {
          if (params.tool_choice.type === 'tool' && params.tool_choice.name) {
            payload.tool_choice = {
              type: 'function',
              function: { name: params.tool_choice.name }
            };
          } else if (params.tool_choice.type === 'function') {
            payload.tool_choice = params.tool_choice;
          } else {
            payload.tool_choice = params.tool_choice.type || 'auto';
          }
        } else {
          payload.tool_choice = params.tool_choice;
        }
      }
    }

    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nutralab.es',
        'X-Title': 'Nutralab VLC'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errMsg = errorData?.error?.message || `OpenRouter API error ${response.status}: ${response.statusText}`;
      const err = new Error(errMsg);
      err.status = response.status;
      err.error = errorData?.error;
      throw err;
    }

    const data = await response.json();
    const choice = data.choices?.[0] || {};
    const message = choice.message || {};
    const toolCalls = message.tool_calls || [];

    // Construir estructura compatible tanto con Anthropic (content array con text/tool_use) como OpenAI (choices)
    const content = [];
    if (message.content) {
      content.push({ type: 'text', text: message.content });
    }

    for (const tc of toolCalls) {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(tc.function.arguments);
      } catch {
        parsedInput = tc.function.arguments;
      }
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: parsedInput
      });
    }

    return {
      id: data.id,
      model: data.model,
      role: 'assistant',
      content,
      choices: data.choices,
      stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : (choice.finish_reason || 'stop'),
      raw: data
    };
  }
}

export const aiClient = new OpenRouterClient();

export function getMaxTokens() {
  const parsed = env.AI_PLAN_MAX_TOKENS;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 32000;
}
