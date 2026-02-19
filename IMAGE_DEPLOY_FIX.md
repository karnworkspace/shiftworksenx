# แก้ปัญหารูปภาพพื้นหลังไม่แสดงเมื่อ Deploy

## สาเหตุของปัญหา

เมื่อ deploy frontend ไปยัง production อาจพบปัญหารูปภาพพื้นหลังหน้า Login ไม่แสดง มีสาเหตุหลักดังนี้:

### 1. ไฟล์ ._ (macOS Resource Fork)
macOS สร้างไฟล์พิเศษชื่อ `._filename` เพื่อเก็บ metadata ซึ่งอาจทำให้ web server สับสนได้

### 2. Path ของ Assets ไม่ถูกต้อง
ถ้า web server ตั้งค่า base path ไม่ตรงกับที่ Vite build มา อาจทำให้หา assets ไม่เจอ

### 3. Web Server ไม่ได้ serve folder assets/
บาง hosting อาจจำเป็นต้องตั้งค่าพิเศษเพื่อ serve static files

## วิธีแก้ไข

### ✅ 1. Clean Build ก่อน Deploy (สำคัญที่สุด!)

ก่อนสร้าง zip ให้ clean ไฟล์ ._ เสมอ:

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Clean ไฟล์ ._ 
./clean-build.sh

# สร้าง zip
cd deploy
powershell -ExecutionPolicy Bypass -File create-deploy-zips.ps1
```

หรือใน macOS/Linux:
```bash
# Clean ไฟล์ ._ ใน dist
find frontend/dist -name "._*" -type f -delete
find backend/dist -name "._*" -type f -delete
```

### ✅ 2. ตรวจสอบ vite.config.ts

ไฟล์ `frontend/vite.config.ts` ได้ถูกแก้ไขให้ assets ไม่ถูก inline และมี hash ในชื่อไฟล์:

```typescript
export default defineConfig({
  build: {
    assetsInlineLimit: 0, // ไม่ inline assets เลย
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  // ...
});
```

### ✅ 3. ตรวจสอบ Web Server Configuration

#### Nginx
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/shift-work;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Serve static assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteBase /

# Handle assets directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/assets/
RewriteRule . /index.html [L]

# Cache static assets
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|js|css)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>
```

## วิธีตรวจสอบหลัง Deploy

### 1. เปิด Browser DevTools (F12)
- ไปที่ tab **Network**
- Reload หน้า Login
- ดูว่ามี request ไปที่ `assets/login-bg-*.png` หรือไม่
- ถ้า status code **404** = ไฟล์หาไม่เจอ
- ถ้า status code **200** = โหลดสำเร็จ

### 2. ตรวจสอบ Console
เปิด Console ดูว่ามี error แบบนี้หรือไม่:
```
GET https://example.com/assets/login-bg-abc123.png 404 (Not Found)
```

### 3. ตรวจสอบไฟล์ที่อัปโหลด
ตรวจสอบว่าโฟลเดอร์ `assets/` มีไฟล์เหล่านี้:
- `login-bg-*.png` (ประมาณ 7-8 MB)
- `senx-logo-*.webp` (ประมาณ 4 KB)
- `index-*.js` (ประมาณ 2-3 MB)

## Checklist สำหรับ Deploy ครั้งต่อไป

- [ ] Build frontend ด้วย `npm run build`
- [ ] รัน `./clean-build.sh` เพื่อลบไฟล์ ._
- [ ] สร้าง zip ด้วย `create-deploy-zips.ps1` (Windows) หรือ script อื่น
- [ ] แตก zip และตรวจสอบว่ามีโฟลเดอร์ `assets/`
- [ ] ตรวจสอบว่าไฟล์ `login-bg-*.png` และ `senx-logo-*.webp` อยู่ใน `assets/`
- [ ] อัปโหลดทั้งหมดไปยัง web server
- [ ] ตรวจสอบว่า web server config อนุญาตให้ serve folder `assets/`
- [ ] ทดสอบเปิดหน้า Login และดูว่ารูปขึ้นหรือไม่

## สรุป

**ครั้งนี้รูปภาพจะแสดงแน่นอน** ถ้า:
1. ✅ รัน `./clean-build.sh` ก่อนสร้าง zip
2. ✅ ใช้ `vite.config.ts` ที่อัปเดตแล้ว (มี `assetsInlineLimit: 0`)
3. ✅ อัปโหลดโฟลเดอร์ `assets/` ไปด้วย
4. ✅ Web server ตั้งค่าให้ serve static files ถูกต้อง
