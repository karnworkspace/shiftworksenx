# 🚀 คู่มือ Deploy (Frontend + Backend)

เอกสารนี้อธิบายการนำระบบไปใช้งานจริง (Production) และการสร้างไฟล์ `.zip` สำหรับอัปโหลด deploy

---

## ⚡ Quick Start (สำหรับ Deploy ครั้งแรก)

### ขั้นตอนโดยย่อ:

1. **ดาวน์โหลด** zip files จาก GitHub Releases หรือ Actions
2. **Backend**: แตก zip → ตั้ง `.env` → `npm ci` → `npm run db:push` → `npm start`
3. **Frontend**: แตก zip → วาง static files บน Nginx/Server
4. **Nginx**: ตั้ง reverse proxy `/api` → backend + SPA rewrite

ตัวอย่าง Nginx config อยู่ที่ **Section 3**

---

## ✅ สถานะปัจจุบัน (ในโปรเจคนี้)

ตอนนี้โปรเจคมี output สำหรับ deploy แล้วที่โฟลเดอร์ `deploy/`:

- `deploy/frontend-dist.zip` — ไฟล์ static ที่ build แล้ว (React + Vite)
- `deploy/backend-deploy.zip` — Backend ที่ compile แล้ว (Express + TypeScript `dist/`) พร้อม `prisma/` และไฟล์ package

> หมายเหตุ: Frontend จะเรียก API ที่ `/api` เป็นค่าเริ่มต้น (ถ้าไม่ตั้ง `VITE_API_URL`) เพื่อให้ใช้งานแบบ “โดเมนเดียว + reverse proxy” ได้ง่าย

---

## ทางเลือกการ Deploy (เลือกแบบใดแบบหนึ่ง)

### แบบ A (แนะนำ): โดเมนเดียว + Reverse Proxy

- Frontend: serve เป็น static (เช่น Nginx)
- Backend: รันเป็น Node service (เช่น port 5000)
- Nginx proxy `/api` → `http://127.0.0.1:5000/api`

ข้อดี: ไม่ต้องฝัง URL ของ API ใน build และลดปัญหา CORS

### แบบ B: Frontend/Backend คนละโดเมน

- Frontend: deploy บน static hosting
- Backend: deploy บนอีกโดเมน (เช่น `https://api.example.com`)
- ต้อง build frontend โดยตั้ง `VITE_API_URL` เช่น `https://api.example.com/api`

---

## 📦 GitHub Actions (CI/CD อัตโนมัติ)

โปรเจคนี้มี GitHub Actions workflow ที่จะ build และสร้าง zip อัตโนมัติเมื่อ push โค้ดขึ้น GitHub

### การทำงาน

**เมื่อ push หรือ PR ไปยัง `main`:**
- Build frontend + backend อัตโนมัติ
- สร้าง `backend-deploy.zip` และ `frontend-dist.zip`
- เก็บเป็น **Artifacts** บน GitHub (เก็บ 30 วัน)
- ดาวน์โหลดได้จาก Actions > [ชื่อ workflow run] > Artifacts

**เมื่อ push tag (เช่น `v1.0.1`):**
- Build ทั้งหมด
- สร้าง **GitHub Release** พร้อมแนบไฟล์ zip
- ผู้ deploy ดาวน์โหลด zip จาก Releases page ได้เลย

### วิธีสร้าง Release

**ขั้นตอน 1: บน local machine**

```bash
# เปลี่ยนเวอร์ชันตามต้องการ (เช่น v1.0.2)
git add -A
git commit -m "chore: prepare release v1.0.2"
git tag v1.0.2
git push origin main
git push origin v1.0.2
```

**ขั้นตอน 2: GitHub Actions จะทำให้อัตโนมัติ**
- ดูความคืบหน้าที่ Actions tab
- หลังจากเสร็จ (3-5 นาที) → ไปที่ **Releases** page
- ดาวน์โหลด `backend-deploy.zip` และ `frontend-dist.zip` เลย

> **💡 ไม่ต้องสร้าง zip ด้วยมือ** — GitHub Actions จะทำให้อัตโนมัติเมื่อ push tag

### ดาวน์โหลดไฟล์ Deploy

**จาก Releases (แนะนำ):**
1. ไปที่ `https://github.com/<username>/<repo>/releases`
2. เลือก Release version ที่ต้องการ
3. ดาวน์โหลด `backend-deploy.zip` และ `frontend-dist.zip`

**จาก Actions Artifacts:**
1. ไปที่ Actions tab
2. เลือก workflow run ที่ต้องการ
3. Scroll ลงไปที่ Artifacts section
4. ดาวน์โหลด zip ที่ต้องการ

---

## 1) Deploy Backend (จาก zip)

### 1.1 แตกไฟล์

- แตกไฟล์ `deploy/backend-deploy.zip` ไปยังโฟลเดอร์บนเครื่องเซิร์ฟเวอร์ เช่น `C:\apps\shift-work-backend`

โครงสร้างที่ควรเห็น:

- `dist/`
- `prisma/`
- `package.json`, `package-lock.json`
- `.env.example`
- (ถ้ามี) `.env.supabase.example`

### 1.2 ตั้งค่า Environment (.env)

สร้างไฟล์ `.env` จาก `.env.example` แล้วแก้ค่าที่จำเป็น:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `NODE_ENV=production`
- `FRONTEND_URL` (กรณี deploy คนละโดเมน/ต้องการจำกัด CORS)

### 1.3 ติดตั้ง Dependencies

รันในโฟลเดอร์ที่แตก zip:

```bash
npm ci
```

> ถ้าต้องการลดขนาดใน production ภายหลัง สามารถใช้ flow build แยก (ติดตั้ง dev ระหว่าง build แล้วค่อย prune) แต่สำหรับการเริ่ม deploy แบบ zip แนะนำให้ใช้ `npm ci` เพื่อให้ Prisma พร้อมใช้งาน

### 1.4 ตั้งค่า Database (ครั้งแรกเท่านั้น)

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

- `db:push` จะสร้างตารางตาม `prisma/schema.prisma`
- `db:seed` จะสร้างข้อมูลตัวอย่าง (รวม admin)

### 1.5 รัน Backend

```bash
npm start
```

ตรวจสอบ:
- `GET /health` ควรตอบ `{ status: "OK" }`

---

## 2) Deploy Frontend (จาก zip)

### 2.0 Build Frontend (ถ้าต้องเปลี่ยน API URL)

หากต้องการให้ frontend เรียก API จากโดเมนอื่น (ไม่ใช่ `/api`) ให้ build ด้วย `VITE_API_URL`:

```bash
# ตัวอย่าง: build ให้เรียก API จาก https://api.example.com
cd frontend
VITE_API_URL=https://api.example.com/api npm run build

# ⚠️ สำคัญ: ทำความสะอาดไฟล์ ._ (macOS resource fork) ก่อน zip
cd ..
./clean-build.sh
```

ถ้าไม่ตั้ง `VITE_API_URL` (ค่าเริ่มต้น) frontend จะเรียก `/api` (ใช้ domain เดียว + reverse proxy)

> **หมายเหตุ**: ไฟล์รูปภาพ (login-bg.png, senx-logo.webp) จะถูก build อัตโนมัติไปที่ `dist/assets/` พร้อม hash ในชื่อไฟล์ (เช่น `login-bg-a1b2c3.png`) เพื่อป้องกันปัญหา cache

### 2.1 แตกไฟล์

- แตกไฟล์ `deploy/frontend-dist.zip`
- จะได้ไฟล์เช่น `index.html` และโฟลเดอร์ `assets/`

### 2.2 นำขึ้น Static Hosting

ตัวอย่างแนวทาง:

- Nginx/Apache: วางไฟล์ในโฟลเดอร์เว็บ (เช่น `/var/www/shift-work/`)
- Netlify / Cloudflare Pages / S3: อัปโหลดไฟล์ทั้งหมดใน zip

### 2.3 ตั้งค่า SPA Rewrite (สำคัญ)

เพราะเป็น React Router (SPA) ต้อง rewrite ทุก path กลับไปที่ `index.html`

- **Nginx**: ใช้ `try_files $uri $uri/ /index.html;`
- **Netlify**: เพิ่ม `_redirects` เป็น `/* /index.html 200`

---

## 3) Reverse Proxy ตัวอย่าง (Nginx) — แบบ A

ตัวอย่าง Nginx config ที่จะ serve static frontend และ proxy `/api` ไป backend:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/shift-work/frontend;
        try_files $uri $uri/ /index.html;  # SPA rewrite
    }

    # API proxy ไป Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**วิธีใช้:**
1. แตก `frontend-dist.zip` ไปยัง `/var/www/shift-work/frontend`
2. แก้ไข `your-domain.com` เป็นโดเมนจริง
3. Backend รัน port 5000 (`PORT=5000` ใน `.env`)
4. `sudo systemctl reload nginx`

## 4) Reverse Proxy ตัวอย่าง (Nginx) — แบบ A (เดิม)

ตัวอย่าง config (สรุปแนวคิด):

- Serve static frontend
- Proxy `/api` ไป backend

สิ่งที่ต้องได้:

- เปิดเว็บ `https://your-domain/` แล้วโหลด frontend
- frontend เรียก `https://your-domain/api/...` แล้วไป backend ได้

---

## 5) สร้างไฟล์ zip ใหม่ (บนเครื่อง Dev)

ถ้ามีการแก้โค้ด แล้วต้องการสร้าง zip ใหม่:

### Backend
```bash
cd backend
npm install
npm run build
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

จากนั้นสร้าง zip ใหม่ด้วยสคริปต์:

- Windows: `deploy/create-deploy-zips.ps1`

---

## 5) Checklist ก่อนขึ้นระบบจริง

- ✅ ตั้ง `NODE_ENV=production`
- ✅ เปลี่ยน `JWT_*_SECRET` ให้เป็นค่า random ยาวๆ (อย่างน้อย 32 ตัวอักษร)
- ✅ ตั้ง `DATABASE_URL` เป็น production database (และเปิด SSL ถ้าจำเป็น)
- ✅ ตั้งค่า backup/restore database
- ✅ ตั้งค่า process manager (เช่น pm2 / NSSM / systemd) ให้ backend auto-restart
- ✅ ตั้ง `FRONTEND_URL` เป็น domain จริง (เพื่อ CORS)
- ✅ ทำ HTTPS (ใช้ Let's Encrypt สำหรับ Nginx)
- ✅ ตรวจสอบ backend health: `GET /health` ตอบ `{"status":"OK"}`

---

## 📞 Support & Troubleshooting

### Backend ไม่ขึ้น
- ตรวจ logs: `npm start` แล้อดูข้อความ error
- ตรวจ `DATABASE_URL` — ต้อง PostgreSQL หรือ Supabase
- ตรวจ `JWT_*_SECRET` — ต้องไม่ว่างเปล่า

### Frontend หน้าขาว
- ตรวจ Network tab — API call ไปไหน?
- ตรวจ Nginx logs: `/var/log/nginx/error.log`
- ตรวจ SPA rewrite — ใช้ `try_files` ในวิธีที่ถูกต้อง

### Login ไม่ได้
- ตรวจว่าได้รัน `npm run db:seed` แล้วไหม
- ลองเข้าด้วย admin (default: username `admin`, password ตามที่ seed ตั้งไว้)
