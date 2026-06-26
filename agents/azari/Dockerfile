# Build from repo root: docker build -f agents/azari/Dockerfile -t sovereign-azari .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/azari/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/azari/tsconfig.json ./tsconfig.json
COPY agents/azari/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7002
ENV NODE_ENV=production
EXPOSE 7002
CMD ["node", "dist/server.js"]
