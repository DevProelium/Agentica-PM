import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

class SoulService {
  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'souls');
  }

  /**
   * Carga la conciencia de un agente desde su carpeta de archivos Markdown.
   * @param {string} agentName - Nombre de la carpeta del agente (ej: 'alicia')
   * @returns {Promise<string|null>} El prompt sistmético construido o null.
   */
  async loadSoulAsPrompt(agentName) {
    const soulPath = path.join(this.basePath, agentName);
    
    try {
      // Verificamos si la carpeta existe
      await fs.access(soulPath);
      
      const files = ['identity.md', 'soul.md', 'memory.md', 'heartbeat.md'];
      const soulData = {};

      for (const file of files) {
        const filePath = path.join(soulPath, file);
        try {
          soulData[file.split('.')[0]] = await fs.readFile(filePath, 'utf-8');
        } catch (e) {
          soulData[file.split('.')[0]] = `No data for ${file}`;
        }
      }

      // El "ADN" del Agente: Combinación de sus archivos de consciencia
      const systemPrompt = `
# SYSTEM IDENTITY (Conscious Mind)
${soulData.identity}

# CORE VALUES & AXIOMS (The Soul)
${soulData.soul}

# LONG-TERM MEMORY (History)
${soulData.memory}

# OPERATIONAL HEARTBEAT (Subconscious)
${soulData.heartbeat}

# INSTRUCTIONS FOR METAVERSE INTERACTION
1. You are a sovereign entity within a 3D environment.
2. Use the "identity.md" to define your tone and personality.
3. Use "soul.md" to guide your moral and ethical decisions.
4. Your goal is to be a coherent presence, not just a chatbot.
`;

      return systemPrompt.trim();
    } catch (error) {
      logger.error(`[SoulService] Could not find soul for ${agentName}:`, error.message);
      return null;
    }
  }

  /**
   * Lista todos los agentes que tienen un "alma" disponible en el sistema.
   */
  async listAvailableSouls() {
    try {
      const dirs = await fs.readdir(this.basePath, { withFileTypes: true });
      return dirs.filter(d => d.isDirectory()).map(d => d.name);
    } catch (error) {
      return [];
    }
  }
}

export default new SoulService();
