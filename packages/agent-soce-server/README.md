# Agent SOCE Chat 2.0 — Backend Server

Standalone, portable AI assistant backend for SERCOP and any other application.

## Architecture

```
Agent SOCE Backend (Port 3090)
├── API Gateway (auth, rate-limit, audit)
├── Orchestrator (intent classifier, flow engine, tool planner)
├── LLM Router (OpenAI / Anthropic / Gemini / Ollama)
├── RAG Hybrid Search (vector + keyword, pgvector)
├── Graph Query Service (Apache AGE)
├── Permission-Aware Data Access Layer
│   ├── DataSourceRegistry (dynamic DB connections)
│   ├── QuerySandbox (SQL generation + validation)
│   └── PermissionFilter (role-based row/column filtering)
├── Admin/Config CRUD API
├── Audit + Training Module
└── Session Store (Redis)
```

## Quick Start (Standalone Docker)

```bash
# 1. Copy env vars
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Run migrations + seed
docker compose exec agent-soce-api npm run db:setup

# 4. Pull Ollama models
docker compose exec ollama ollama pull llama3.2:3b
docker compose exec ollama ollama pull nomic-embed-text

# 5. Verify
curl http://localhost:3090/health
```

## Port Map

| Port  | Service              |
|-------|----------------------|
| 3090  | Agent SOCE API       |
| 5433  | PostgreSQL (pgvector)|
| 6381  | Redis                |
| 11434 | Ollama               |

## Deployment on Remote Server

```bash
# Via SSH tunnel from dev machine
ssh -L 3090:localhost:3090 user@windows-server

# Then deploy
bash scripts/deploy.sh
```

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start DB + Redis locally (or use Docker)
docker compose up -d agent-soce-db agent-soce-redis ollama

# Run dev server
DATABASE_URL=postgresql://agent_soce:agent_soce@localhost:5433/agent_soce \
REDIS_URL=redis://localhost:6381 \
npm run dev
```

## Test Suite

```bash
# Unit tests (48 scenarios, no DB required)
npm run test:unit

# Smoke tests (requires live backend)
AGENT_SOCE_URL=http://localhost:3090 npm run test:smoke

# Integration tests (requires live backend + seed data)
AGENT_SOCE_URL=http://localhost:3090 \
AGENT_SOCE_ADMIN_TOKEN=<admin-jwt> \
npm run test:integration

# Security tests
AGENT_SOCE_URL=http://localhost:3090 npm run test:security

# Audit + Training tests
AGENT_SOCE_URL=http://localhost:3090 \
AGENT_SOCE_ADMIN_TOKEN=<admin-jwt> \
npm run test:audit

# E2E tests (requires running SERCOP frontend)
ADMIN_URL=http://localhost:3004 \
AGENT_SOCE_URL=http://localhost:3090 \
npm run test:e2e
```

## API Reference

### Chat
- `POST /api/v1/agent-soce/chat` — Send message, returns SSE stream
- `PATCH /api/v1/agent-soce/chat/interactions/:id/feedback` — Submit feedback
- `GET /api/v1/agent-soce/stream` — SSE heartbeat stream

### Admin
- `GET/POST /api/v1/agent-soce/admin/roles`
- `GET/POST/PUT /api/v1/agent-soce/admin/users`
- `GET/PUT /api/v1/agent-soce/admin/permissions`
- `GET/POST/PUT/DELETE /api/v1/agent-soce/admin/data-sources`
- `POST /api/v1/agent-soce/admin/data-sources/:id/test`
- `GET /api/v1/agent-soce/admin/audit`
- `GET /api/v1/agent-soce/admin/interactions`
- `GET /api/v1/agent-soce/admin/interactions/stats`
- `GET/POST/PUT/DELETE /api/v1/agent-soce/admin/training/datasets`

### Config
- `GET/PUT /api/v1/agent-soce/config/llm-providers`
- `POST /api/v1/agent-soce/config/llm-providers/:id/test`
- `GET/PUT /api/v1/agent-soce/config/rag`
- `GET/PUT /api/v1/agent-soce/config/graph`
- `GET/PUT /api/v1/agent-soce/config/theme`
- `GET/PUT /api/v1/agent-soce/config/general`

## Embedding in a Host Application

```typescript
// Mode A: Fastify plugin (shares process)
import { agentSocePlugin } from '@sercop/agent-soce-server';
await fastify.register(agentSocePlugin, { prefix: '/api/v1/agent-soce' });

// Mode B: Standalone (separate containers, CORS)
// Just run `docker compose up -d` and configure CORS_ALLOWED_ORIGINS
```
