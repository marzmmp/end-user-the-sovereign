# Build from repo root: docker build -f agents/yahdin/Dockerfile -t sovereign-yahdin .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahdin/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahdin/tsconfig.json ./tsconfig.json
COPY agents/yahdin/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7008
ENV NODE_ENV=production
EXPOSE 7008
CMD ["node", "dist/server.js"]
