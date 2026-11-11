# 1) Build the static site (Node 22 + the pnpm version pinned in package.json "packageManager")
FROM node:22-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.34.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Demo accounts come from .env; fall back to the template when .env was not shipped.
RUN [ -f .env ] || cp .env.example .env
RUN pnpm build

# 2) Serve the built files with nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
