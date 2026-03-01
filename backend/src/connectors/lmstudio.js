import fetch from 'node-fetch';
import { BaseConnector } from './base-connector.js';

/**
 * LM Studio exposes an OpenAI-compatible API on localhost.
 */
export class LmStudioConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
    this.model   = config.model   || 'local-model';
  }

  async chat(messages, options = {}) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       this.model,
        messages,
        max_tokens:  options.maxTokens  || 1024,
        temperature: options.temperature ?? 0.8,
        stream:      false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LM Studio error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const choice = data.choices[0];
    return {
      content: choice.message.content,
      tokens:  data.usage?.total_tokens ?? 0,
    };
  }

  async embed(text) {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: text }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LM Studio embed error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  }
}
