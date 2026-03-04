FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY tsconfig.json nest-cli.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Prisma generate requires DATABASE_URL to be set (adapter config reads it)
ENV DATABASE_URL="mysql://user:pass@localhost:3306/db"

RUN npm run prisma:generate
RUN npm run build

# Runtime image
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p storage/uploads

EXPOSE 8000
CMD ["node", "dist/main.js"]
