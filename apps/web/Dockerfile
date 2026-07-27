# The Stands — web app image (Next.js standalone)
# Build from the repo root:  docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY services/fixtures-sync/package.json services/fixtures-sync/
RUN npm ci --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules node_modules
COPY package.json ./
COPY packages/core packages/core
COPY apps/web apps/web
# NEXT_PUBLIC_* are inlined at build time — pass your real values
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build -w apps/web

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static apps/web/.next/static
COPY --from=build /repo/apps/web/public apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
