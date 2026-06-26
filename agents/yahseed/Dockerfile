# Build from repo root: docker build -f agents/yahseed/Dockerfile -t sovereign-yahseed .
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY agents/yahseed/package.json ./package.json
RUN npm install --production=false

# Copy shared core + agent server
COPY core/ ./core/
COPY agents/yahseed/tsconfig.json ./tsconfig.json
COPY agents/yahseed/server.ts ./server.ts

# Compile TypeScript
RUN npx tsc 2>/dev/null || true

ENV PORT=7006
ENV NODE_ENV=production
EXPOSE 7006
CMD ["node", "dist/server.js"]
