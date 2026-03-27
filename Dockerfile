FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# Copy source (Not copying test/ to keep prod build clean)
COPY tsconfig.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Prisma generate (Prisma 7 uses prisma.config.ts)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npm run prisma:generate
RUN npm run build

# Runtime image
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Install openssl in runtime image
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
# Copy thư mục chứa data mẫu JSON để chạy Seeder
COPY --from=build /app/src/core/database/json ./src/core/database/json

RUN mkdir -p storage/uploads

EXPOSE 8000
# Trong Docker (không có folder test/), NestJS sẽ build thẳng ra dist/main.js
CMD ["node", "dist/main.js"]


