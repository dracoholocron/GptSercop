# SERCOP V2 API – multi-stage (Fase 0)
# Build: deps + Prisma generate + TypeScript compile
# Runtime: Node + dist + node_modules (incl. Prisma client)

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3080

COPY package.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3080

USER node
CMD ["node", "dist/index.js"]
