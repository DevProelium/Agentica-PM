-- ============================================================
-- Crisalida Ecosystem – PostgreSQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── 1. users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  coins         INTEGER NOT NULL DEFAULT 100,
  gems          INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. refresh_tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── 3. agents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  personality     TEXT NOT NULL DEFAULT 'friendly',
  avatar_url      TEXT,
  model_provider  TEXT NOT NULL DEFAULT 'openai',
  model_name      TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  api_key_enc     TEXT,
  system_prompt   TEXT,
  hunger          INTEGER NOT NULL DEFAULT 80 CHECK (hunger BETWEEN 0 AND 100),
  happiness       INTEGER NOT NULL DEFAULT 80 CHECK (happiness BETWEEN 0 AND 100),
  energy          INTEGER NOT NULL DEFAULT 80 CHECK (energy BETWEEN 0 AND 100),
  hygiene         INTEGER NOT NULL DEFAULT 80 CHECK (hygiene BETWEEN 0 AND 100),
  social          INTEGER NOT NULL DEFAULT 80 CHECK (social BETWEEN 0 AND 100),
  xp              INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  coins_balance   INTEGER NOT NULL DEFAULT 0,
  current_skin    TEXT NOT NULL DEFAULT 'default',
  current_env     TEXT NOT NULL DEFAULT 'bedroom',
  is_alive        BOOLEAN NOT NULL DEFAULT TRUE,
  last_fed_at     TIMESTAMPTZ,
  last_tick_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);

-- ── 4. agent_memories ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_memories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  memory_type TEXT NOT NULL DEFAULT 'episodic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memories_agent ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON agent_memories
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 5. chat_messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content    TEXT NOT NULL,
  tokens     INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_agent ON chat_messages(agent_id, created_at DESC);

-- ── 6. knowledge_items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  source_url TEXT,
  file_key   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_agent ON knowledge_items(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_items
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 7. environments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS environments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  room_key     TEXT NOT NULL DEFAULT 'bedroom',
  furniture    JSONB NOT NULL DEFAULT '[]',
  lighting     JSONB NOT NULL DEFAULT '{"color":"#ffffff","intensity":1}',
  wallpaper    TEXT NOT NULL DEFAULT 'default',
  floor        TEXT NOT NULL DEFAULT 'wood',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_env_agent ON environments(agent_id);

-- ── 8. store_items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL CHECK (category IN ('skin','furniture','food','accessory','environment')),
  price_coins  INTEGER NOT NULL DEFAULT 0,
  price_gems   INTEGER NOT NULL DEFAULT 0,
  asset_key    TEXT,
  preview_url  TEXT,
  rarity       TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. inventory ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES store_items(id),
  quantity     INTEGER NOT NULL DEFAULT 1,
  acquired_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

-- ── 10. transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('purchase','reward','gift','penalty','transfer')),
  currency     TEXT NOT NULL CHECK (currency IN ('coins','gems')),
  amount       INTEGER NOT NULL,
  description  TEXT,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id, created_at DESC);

-- ── 11. achievements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  icon_url     TEXT,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  reward_xp    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ── 12. metaverse_rooms ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS metaverse_rooms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  room_type    TEXT NOT NULL DEFAULT 'public',
  scene_config JSONB NOT NULL DEFAULT '{}',
  max_players  INTEGER NOT NULL DEFAULT 20,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Triggers: updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_agents_updated
    BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_env_updated
    BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Seed: achievements ────────────────────────────────────────
INSERT INTO achievements (key, name, description, reward_coins, reward_xp) VALUES
  ('first_chat', 'First Words', 'Send your first message to your agent', 10, 50),
  ('feed_10', 'Caregiver', 'Feed your agent 10 times', 20, 100),
  ('level_5', 'Growing Up', 'Reach level 5 with any agent', 50, 200),
  ('level_10', 'Thriving', 'Reach level 10 with any agent', 100, 500),
  ('knowledge_10', 'Scholar', 'Add 10 knowledge items', 30, 150),
  ('metaverse_first', 'Explorer', 'Visit the metaverse for the first time', 25, 100)
ON CONFLICT (key) DO NOTHING;

-- ── Seed: store_items ─────────────────────────────────────────
INSERT INTO store_items (name, description, category, price_coins, rarity) VALUES
  ('Classic Blue', 'A clean blue skin for your agent', 'skin', 50, 'common'),
  ('Sunset Orange', 'Warm sunset tones', 'skin', 75, 'common'),
  ('Galaxy Purple', 'A mysterious galaxy pattern', 'skin', 150, 'rare'),
  ('Golden Aura', 'Legendary golden skin', 'skin', 500, 'legendary'),
  ('Cozy Couch', 'A comfortable couch for the bedroom', 'furniture', 40, 'common'),
  ('Bookshelf', 'Store your knowledge visually', 'furniture', 60, 'common'),
  ('Gaming Desk', 'A sleek gaming setup', 'furniture', 120, 'rare'),
  ('Ramen Bowl', 'Feed your agent ramen', 'food', 10, 'common'),
  ('Sushi Platter', 'Premium meal for your agent', 'food', 25, 'rare'),
  ('Garden Room', 'A peaceful garden environment', 'environment', 200, 'epic')
ON CONFLICT DO NOTHING;
