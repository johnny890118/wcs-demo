FROM node:22.13.1-alpine3.21@sha256:e2b39f7b64281324929257d0f8004fb6cb4bf0fdfb9aa8cedb235a766aec31da AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.13.1-alpine3.21@sha256:e2b39f7b64281324929257d0f8004fb6cb4bf0fdfb9aa8cedb235a766aec31da AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.api.json ./
COPY apps ./apps
COPY src ./src
RUN npm run build:api

FROM node:22.13.1-alpine3.21@sha256:e2b39f7b64281324929257d0f8004fb6cb4bf0fdfb9aa8cedb235a766aec31da AS runtime
WORKDIR /app
LABEL org.opencontainers.image.title="Warehouse Platform API" \
      org.opencontainers.image.description="Smart Warehouse Platform execution API"
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3001
RUN addgroup --system --gid 1001 warehouse \
  && adduser --system --uid 1001 warehouse
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force
COPY --from=builder --chown=warehouse:warehouse /app/dist ./dist
COPY --chown=warehouse:warehouse apps/api/migrations ./apps/api/migrations
COPY --chown=warehouse:warehouse apps/api/seeds ./apps/api/seeds
USER warehouse
EXPOSE 3001
CMD ["node", "dist/runtime/main.mjs"]
