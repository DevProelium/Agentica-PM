// ── Agent stats ───────────────────────────────────────────────
export const STAT_MAX    = 100;
export const STAT_MIN    = 0;

// Tick decay per interval
export const HUNGER_DECAY    = 5;
export const ENERGY_DECAY    = 3;
export const HYGIENE_DECAY   = 2;
export const HAPPINESS_DECAY = 1;
export const SOCIAL_DECAY    = 2;

// Care actions XP rewards
export const XP_FEED    = 10;
export const XP_PLAY    = 20;
export const XP_SLEEP   = 5;
export const XP_CLEAN   = 15;
export const XP_CHAT    = 5;

// Economy
export const DAILY_REWARD_COINS = 50;
export const DAILY_REWARD_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 hours

// Agent levels
export const XP_PER_LEVEL = 100; // xp_needed = level * XP_PER_LEVEL

// WebSocket message types
export const WS_TYPES = {
  CONNECTED:        'connected',
  CHAT_REPLY:       'chat:reply',
  AGENT_STATE:      'agent:state',
  CARE_UPDATE:      'care:update',
  META_JOIN:        'metaverse:player_joined',
  META_LEAVE:       'metaverse:player_left',
  META_MOVE:        'metaverse:player_moved',
  META_CHAT:        'metaverse:chat',
  ERROR:            'error',
};

// AI Providers
export const AI_PROVIDERS = ['openai', 'anthropic', 'ollama', 'lmstudio'];

// Store categories
export const STORE_CATEGORIES = ['skin', 'furniture', 'food', 'accessory', 'environment'];

// Rarity levels
export const RARITIES = ['common', 'rare', 'epic', 'legendary'];

// Metaverse
export const MAX_ROOM_PLAYERS = 20;
