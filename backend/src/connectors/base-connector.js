/**
 * Base connector interface. All AI connectors extend this class.
 */
export class BaseConnector {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Send a list of messages and get a completion.
   * @param {Array<{role: string, content: string}>} messages
   * @param {object} options
   * @returns {Promise<{content: string, tokens: number}>}
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * Generate an embedding vector for text.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embed(text) {
    throw new Error('embed() must be implemented by subclass');
  }

  /**
   * Check connectivity / credentials.
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await this.chat([{ role: 'user', content: 'ping' }], { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
