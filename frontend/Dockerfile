# syntax=docker/dockerfile:1

# ---------- Stage 1: build the site (Node, discarded afterwards) ----------
FROM node:24-alpine AS build
WORKDIR /app

# Install exactly what package-lock.json says. Copying only these two files
# first lets Docker reuse the install step when only source files change.
COPY package.json package-lock.json ./
RUN npm ci

# Bring in the source and bake the finished files into /app/dist.
COPY . .
RUN npm run build

# ---------- Stage 2: serve the files (tiny nginx, no Node) ----------
# The "unprivileged" nginx image runs as a normal user and listens on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
