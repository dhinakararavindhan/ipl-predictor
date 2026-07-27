# The Stands — fixtures-sync worker image
# Build from the repo root:  docker build -f services/fixtures-sync/Dockerfile .
FROM node:22-alpine
WORKDIR /repo

# workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY services/fixtures-sync/package.json services/fixtures-sync/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --ignore-scripts

COPY packages/core packages/core
COPY services/fixtures-sync services/fixtures-sync

ENV NODE_ENV=production
CMD ["npm", "start", "-w", "services/fixtures-sync"]
