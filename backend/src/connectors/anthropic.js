import fetch from 'node-fetch';
import { BaseConnector } from './base-connector.js';

export class AnthropicConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.apiKey  = config.apiKey;
    this.model   = config.model || 'claude-3-haiku-20240307';
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async chat(messages, options = {}) {
    // Anthropic separates system from conversation messages
    const systemMsg = messages.find(m => m.role === 'system');
    const convMsgs  = messages.filter(m => m.role !== 'system');

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      this.model,
        max_tokens: options.maxTokens || 1024,
        system:     systemMsg?.content,
        messages:   convMsgs,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return {
      content: data.content[0].text,
      tokens:  (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  async embed(_text) {
    throw new Error('Anthropic does not support embeddings natively; use OpenAI for embeddings.');
  }
}
