import { OpenAIConnector }    from './openai.js';
import { AnthropicConnector } from './anthropic.js';
import { OllamaConnector }    from './ollama.js';
import { LmStudioConnector }  from './lmstudio.js';

/**
 * Create an AI connector from an agent's configuration.
 * Decrypts the stored API key if needed.
 */
export function createConnector(provider, model, apiKeyEnc) {
  const apiKey = decryptApiKey(apiKeyEnc);

  switch (provider) {
    case 'openai':
      return new OpenAIConnector({ apiKey, model });

    case 'anthropic':
      return new AnthropicConnector({ apiKey, model });

    case 'ollama':
      return new OllamaConnector({ model, baseUrl: apiKeyEnc /* reuse field for URL */ });

    case 'lmstudio':
      return new LmStudioConnector({ model, baseUrl: apiKeyEnc });

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Trivial XOR-based decryption matching the encryption in agent.service.js.
 * In production replace with AES-256-GCM.
 */
function decryptApiKey(enc) {
  if (!enc) return null;
  try {
    const buf = Buffer.from(enc, 'base64');
    return buf.toString('utf8');
  } catch {
    return enc;
  }
}
