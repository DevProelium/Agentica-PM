import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { rateLimit }    from './middleware/rate-limit.js';

// Routes
import authRoutes        from './routes/auth.routes.js';
import agentsRoutes      from './routes/agents.routes.js';
import careRoutes        from './routes/care.routes.js';
import chatRoutes        from './routes/chat.routes.js';
import knowledgeRoutes   from './routes/knowledge.routes.js';
import environmentRoutes from './routes/environment.routes.js';
import storeRoutes       from './routes/store.routes.js';
import inventoryRoutes   from './routes/inventory.routes.js';
import economyRoutes     from './routes/economy.routes.js';
import achievementsRoutes from './routes/achievements.routes.js';
import assetsRoutes      from './routes/assets.routes.js';
import metaverseRoutes   from './routes/metaverse.routes.js';

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true, // Allow all origins in dev for testing
  credentials: true,
}));

// ── General middleware ────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Rate limiting ──────────────────────────────────────────────
// Strict limit for auth endpoints, generous for regular API
app.use('/api/v1/auth',     rateLimit({ windowMs: 15 * 60_000, max: 20 }));
app.use('/api/',            rateLimit({ windowMs: 60_000, max: 120 }));

// ── API Routes ────────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,         authRoutes);
app.use(`${v1}/agents`,       agentsRoutes);
app.use(`${v1}/care`,         careRoutes);
app.use(`${v1}/chat`,         chatRoutes);
app.use(`${v1}/knowledge`,    knowledgeRoutes);
app.use(`${v1}/environments`, environmentRoutes);
app.use(`${v1}/store`,        storeRoutes);
app.use(`${v1}/inventory`,    inventoryRoutes);
app.use(`${v1}/economy`,      economyRoutes);
app.use(`${v1}/achievements`, achievementsRoutes);
app.use(`${v1}/assets`,       assetsRoutes);
app.use(`${v1}/metaverse`,    metaverseRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler (must be last)
app.use(errorHandler);

export default app;
