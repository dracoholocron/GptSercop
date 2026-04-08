FROM node:22-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate --schema=src/db/schema.prisma

ENV HOST=0.0.0.0
ENV PORT=3090

EXPOSE 3090

CMD ["node", "--loader", "tsx", "src/index.ts"]
