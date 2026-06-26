# Build from repo root: docker build -f agents/yahli-el/Dockerfile -t sovereign-yahli-el .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahli-el/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahli-el/tsconfig.json ./tsconfig.json
COPY agents/yahli-el/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7003
ENV NODE_ENV=production
EXPOSE 7003
CMD ["node", "dist/server.js"]
