import fetch from 'node-fetch';
import { BaseConnector } from './base-connector.js';

export class OpenAIConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.apiKey  = config.apiKey;
    this.model   = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async chat(messages, options = {}) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
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
      throw new Error(`OpenAI error ${res.status}: ${body}`);
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
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI embed error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  }
}
