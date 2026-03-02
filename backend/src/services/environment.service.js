/**
 * Entorno de percepción del Agente.
 * Mantiene lo que el agente "ve" u "oye" en el Metaverso de forma persistente.
 */
class EnvironmentService {
  constructor() {
    this.perceptions = new Map(); // roomId -> { objects: [], players: [], lastUpdate: Date }
  }

  /**
   * Actualiza la escena que ve el agente en una sala específica.
   */
  updateScene(roomId, data) {
    this.perceptions.set(roomId, {
      ...data,
      lastUpdate: new Date()
    });
  }

  /**
   * Genera una descripción en lenguaje natural de lo que el agente percibe.
   */
  getPerceptionPrompt(roomId) {
    const p = this.perceptions.get(roomId);
    if (!p) return "The environment is empty or dark. You don't see anyone around.";

    const playersNames = p.players?.map(pl => pl.name).join(', ') || 'none';
    const objectsList = p.objects?.map(obj => obj.name).join(', ') || 'none';

    return `
# CURRENT ENVIRONMENT PERCEPTION (What you see now)
- Location: Room ${roomId}
- People nearby: ${playersNames}
- Objects visible: ${objectsList}
- Last system check: ${new Date().toLocaleTimeString()}

Use this information to ground your response. If someone is close to you, acknowledge them. If the room is crowded, mention it.
`;
  }
}

export default new EnvironmentService();
