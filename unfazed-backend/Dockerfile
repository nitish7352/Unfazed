# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# ── Production image ────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=base /app/node_modules ./node_modules
COPY . .

# Create upload dirs
RUN mkdir -p uploads/avatars uploads/documents && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
