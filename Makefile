.PHONY: dev prod down logs clean db-migrate db-seed minio-setup build

# ── Development ──────────────────────────────────────────────────────────────
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-d:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# ── Production ───────────────────────────────────────────────────────────────
prod:
	docker compose up --build -d

build:
	docker compose build

down:
	docker compose down

# ── Database ─────────────────────────────────────────────────────────────────
db-migrate:
	docker compose exec backend node -e "import('./db/migrate.js').then(m => m.default())"

db-seed:
	docker compose exec backend node -e "import('./db/seed.js').then(m => m.default())"

db-shell:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# ── MinIO ────────────────────────────────────────────────────────────────────
minio-setup:
	@echo "Setting up MinIO bucket..."
	docker compose exec backend node -e " \
	  import('./src/config/minio.js').then(({ default: client, BUCKET }) => \
	    client.bucketExists(BUCKET).then(exists => \
	      exists ? console.log('Bucket already exists') : \
	      client.makeBucket(BUCKET, 'us-east-1').then(() => \
	        console.log('Bucket created: ' + BUCKET) \
	      ) \
	    ) \
	  )"

# ── Logs ─────────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-db:
	docker compose logs -f postgres

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	docker system prune -f

clean-all:
	docker compose down -v --remove-orphans
	docker system prune -af --volumes

# ── Helpers ──────────────────────────────────────────────────────────────────
ps:
	docker compose ps

restart-backend:
	docker compose restart backend
