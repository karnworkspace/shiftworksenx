#!/bin/bash
set -e

DOMAIN="shiftwork.senxgroup.com"
EMAIL="admin@senxgroup.com"  # <-- เปลี่ยนเป็นอีเมลจริงสำหรับ Let's Encrypt

echo "============================================"
echo "  Shiftwork Deploy Script"
echo "  Domain: $DOMAIN"
echo "  Database: Supabase (external)"
echo "============================================"

# --- Step 1: Copy .env ---
if [ ! -f .env ]; then
  echo "[1/5] Creating .env from .env.production..."
  cp .env.production .env
else
  echo "[1/5] .env already exists, skipping..."
fi

# --- Step 2: Build & start containers ---
echo "[2/5] Building and starting containers..."
docker compose --env-file .env up -d --build

# --- Step 3: Run Prisma migrations & seed ---
echo "[3/5] Running database migrations to Supabase..."
docker compose exec backend npx prisma db push --accept-data-loss

echo "[3/5] Seeding database..."
docker compose exec backend npx tsx prisma/seed.ts

# --- Step 4: Get SSL certificate ---
echo "[4/5] Requesting SSL certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# --- Step 5: Switch to SSL nginx config & reload ---
echo "[5/5] Switching to HTTPS config..."
docker compose cp nginx/nginx.conf frontend:/etc/nginx/conf.d/default.conf
docker compose exec frontend nginx -s reload

echo ""
echo "============================================"
echo "  Deploy complete!"
echo "  https://$DOMAIN"
echo ""
echo "  Default login:"
echo "    Email:    admin@senx.com"
echo "    Password: admin123"
echo "============================================"
