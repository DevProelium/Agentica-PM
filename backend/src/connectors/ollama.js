import fetch from 'node-fetch';
import { BaseConnector } from './base-connector.js';

export class OllamaConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model   = config.model   || 'llama3';
  }

  async chat(messages, options = {}) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    this.model,
        messages,
        stream:   false,
        options: {
          temperature: options.temperature ?? 0.8,
          num_predict: options.maxTokens  || 1024,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return {
      content: data.message?.content || '',
      tokens:  (data.prompt_eval_count || 0) + (data.eval_count || 0),
    };
  }

  async embed(text) {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama embed error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.embedding;
  }
}
