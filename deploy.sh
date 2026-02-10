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
  echo "[1/6] Creating .env from .env.production..."
  cp .env.production .env
else
  echo "[1/6] .env already exists, skipping..."
fi

# --- Step 2: Stop old containers (if any) ---
echo "[2/6] Stopping old shiftwork containers..."
docker stop shiftwork-frontend shiftwork-backend 2>/dev/null || true
docker rm shiftwork-frontend shiftwork-backend 2>/dev/null || true

# --- Step 3: Build & start new containers ---
echo "[3/6] Building and starting containers..."
docker compose --env-file .env up -d --build

# --- Step 4: Run Prisma migrations & seed ---
echo "[4/6] Running database migrations to Supabase..."
docker compose exec backend npx prisma db push --accept-data-loss

echo "[4/6] Seeding database..."
docker compose exec backend npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

# --- Step 5: Setup Nginx site config + SSL ---
echo "[5/6] Setting up Nginx site config..."
sudo cp nginx/shiftwork.senxgroup.com /etc/nginx/sites-enabled/shiftwork.senxgroup.com

# ขอ SSL certificate (ครั้งแรกเท่านั้น — ถ้ามีแล้วจะข้าม)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "[5/6] Requesting SSL certificate..."
  sudo certbot certonly --webroot -w /var/www/html \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"
else
  echo "[5/6] SSL certificate already exists, skipping..."
fi

# --- Step 6: Reload Nginx ---
echo "[6/6] Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "============================================"
echo "  Deploy complete!"
echo "  https://$DOMAIN"
echo ""
echo "  Default login:"
echo "    Email:    admin@senx.com"
echo "    Password: admin123"
echo "============================================"
