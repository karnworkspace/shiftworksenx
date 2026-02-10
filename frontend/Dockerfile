FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Nginx stage ---
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config will be mounted via docker-compose
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
