# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generate Prisma client then compile TypeScript
RUN npx prisma generate --schema=src/db/schema.prisma && \
    npx tsc --project tsconfig.json

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy compiled output + generated Prisma client into dist (mirrors src layout after tsc)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/src/db/schema.prisma ./dist/db/schema.prisma

ENV HOST=0.0.0.0
ENV PORT=3090

EXPOSE 3090

CMD ["node", "dist/index.js"]
