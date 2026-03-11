# Build from repo root: docker build -f apps/public-portal/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build --workspace=public-portal

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/apps/public-portal/.next/standalone ./
COPY --from=builder /app/apps/public-portal/.next/static ./apps/public-portal/.next/static
EXPOSE 3001
CMD ["node", "apps/public-portal/server.js"]
