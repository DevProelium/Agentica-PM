/**
 * Shared type definitions (JSDoc typedefs – used for documentation and IDE support).
 * In a TypeScript project these would be interfaces.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {number} coins
 * @property {number} gems
 * @property {string} created_at
 */

/**
 * @typedef {Object} Agent
 * @property {string}  id
 * @property {string}  user_id
 * @property {string}  name
 * @property {string}  personality
 * @property {string}  model_provider
 * @property {string}  model_name
 * @property {number}  hunger
 * @property {number}  happiness
 * @property {number}  energy
 * @property {number}  hygiene
 * @property {number}  social
 * @property {number}  xp
 * @property {number}  level
 * @property {boolean} is_alive
 * @property {string}  current_skin
 * @property {string}  current_env
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} agent_id
 * @property {string} user_id
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 * @property {number} tokens
 * @property {string} created_at
 */

/**
 * @typedef {Object} StoreItem
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price_coins
 * @property {number} price_gems
 * @property {string} rarity
 */

/**
 * @typedef {Object} WsMessage
 * @property {string} type
 * @property {*}      payload
 */

/**
 * @typedef {Object} MetaverseRoom
 * @property {string}  id
 * @property {string}  name
 * @property {string}  room_type
 * @property {number}  max_players
 * @property {boolean} is_active
 */

export const Types = {}; // empty export so it's a valid ES module
