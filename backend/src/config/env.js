import { z } from 'zod';

const schema = z.object({
  // PostgreSQL
  POSTGRES_HOST:     z.string().default('localhost'),
  POSTGRES_PORT:     z.coerce.number().default(5432),
  POSTGRES_DB:       z.string(),
  POSTGRES_USER:     z.string(),
  POSTGRES_PASSWORD: z.string(),

  // MinIO
  MINIO_ENDPOINT:   z.string().default('localhost'),
  MINIO_PORT:       z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET:     z.string().default('crisalida-assets'),
  MINIO_USE_SSL:    z.string().transform(v => v === 'true').default('false'),

  // JWT
  JWT_SECRET:           z.string().min(16),
  JWT_EXPIRES_IN:       z.string().default('15m'),
  JWT_REFRESH_SECRET:   z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // App
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  PORT:       z.coerce.number().default(3000),
  LOG_LEVEL:  z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3001,http://localhost:3002'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(16),

  // Worker
  TICK_INTERVAL_MS:     z.coerce.number().default(300000),
  BEHAVIOR_INTERVAL_MS: z.coerce.number().default(600000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export default env;
