# 🚀 GitHub Setup และ CI/CD

คู่มือการตั้งค่า GitHub repository และ CI/CD สำหรับโปรเจค Shift Work Management System

## 📋 ขั้นตอนการตั้งค่า GitHub

### 1. สร้าง GitHub Repository

1. ไปที่ https://github.com/new
2. ตั้งชื่อ repository (เช่น `shift-work-senx`)
3. เลือก **Private** (แนะนำ - เพื่อความปลอดภัย)
4. **อย่า** เลือก "Initialize with README" (เพราะโปรเจคมีแล้ว)
5. คลิก "Create repository"

### 2. Push โค้ดขึ้น GitHub

เปิด Terminal/PowerShell ในโฟลเดอร์โปรเจค:

```powershell
# ตรวจสอบว่ามี git init แล้วหรือยัง
git status

# ถ้ายังไม่มี ให้ init ใหม่
git init

# เพิ่มไฟล์ทั้งหมด (จะไม่เอาไฟล์ใน .gitignore)
git add -A

# สร้าง commit แรก
git commit -m "Initial commit: Shift Work Management System v1.0"

# เชื่อมต่อกับ GitHub (เปลี่ยน URL เป็นของคุณ)
git remote add origin https://github.com/<username>/<repo>.git

# เปลี่ยน branch เป็น main
git branch -M main

# Push ขึ้น GitHub
git push -u origin main
```

### 3. ตรวจสอบว่า Push สำเร็จ

ไปที่ repository บน GitHub แล้วตรวจสอบว่ามีไฟล์:
- ✅ `frontend/` และ `backend/` folders
- ✅ `DEPLOY_GUIDE.md`, `README.md`
- ✅ `.github/workflows/build-deploy.yml`
- ✅ **ไม่มี** `.env`, `node_modules/`, `dist/`

---

## 🤖 GitHub Actions CI/CD

โปรเจคมี workflow อัตโนมัติแล้ว (ที่ `.github/workflows/build-deploy.yml`)

### การทำงานอัตโนมัติ

**ทุกครั้งที่ push code:**
1. Build frontend และ backend
2. สร้าง zip files
3. เก็บเป็น Artifacts (ดาวน์โหลดได้ 30 วัน)

**เมื่อ push tag (v*):**
1. Build ทั้งหมด
2. สร้าง GitHub Release
3. แนบ `backend-deploy.zip` และ `frontend-dist.zip`

### ดู Build Status

1. ไปที่ tab "Actions" ใน repository
2. คลิกที่ workflow run ล่าสุด
3. ดูว่า build สำเร็จหรือไม่ (✅ เขียว / ❌ แดง)

---

## 📦 วิธีสร้าง Release

### ขั้นตอนที่ 1: อัปเดตเวอร์ชัน

แก้ไขไฟล์ `VERSION` (ถ้ามี) หรือ `package.json`:

```json
{
  "version": "1.0.2"
}
```

### ขั้นตอนที่ 2: Commit และ Tag

```bash
git add -A
git commit -m "chore(release): v1.0.2"
git tag v1.0.2
git push origin main
git push origin v1.0.2
```

หรือใช้สคริปต์ `release.ps1`:

```powershell
.\release.ps1 -Version "1.0.2"
```

### ขั้นตอนที่ 3: รอ Build เสร็จ

- ไปที่ Actions tab
- รอ workflow "Build and Deploy" รันจบ (ประมาณ 3-5 นาที)
- ถ้าสำเร็จ จะเห็น Release ใหม่ที่ tab "Releases"

---

## 👥 เพิ่มสิทธิ์ผู้ Deploy

### เพิ่ม Collaborator

1. ไปที่ Settings > Collaborators
2. คลิก "Add people"
3. ใส่ username หรืออีเมล GitHub ของผู้ deploy
4. เลือกสิทธิ์:
   - **Read** - ดูโค้ดและดาวน์โหลด Release ได้
   - **Write** - แก้โค้ดได้ (ให้ถ้าจำเป็น)

### สร้าง Team (สำหรับองค์กร)

ถ้ามีหลายคน แนะนำสร้าง GitHub Organization:
1. สร้าง Organization (ฟรีสำหรับ public repos)
2. ย้าย repository ไปที่ Organization
3. สร้าง Team (เช่น "Deployers")
4. ตั้งสิทธิ์ Team เป็น "Read" บน repository

---

## 🔐 ตั้งค่า Secrets (สำหรับ Advanced Deployment)

ถ้าต้องการให้ GitHub Actions deploy อัตโนมัติ (SSH/API):

1. ไปที่ Settings > Secrets and variables > Actions
2. คลิก "New repository secret"
3. เพิ่ม secrets ที่จำเป็น:

```
DATABASE_URL           - Supabase/PostgreSQL connection string
JWT_ACCESS_SECRET      - Random string สำหรับ JWT access token
JWT_REFRESH_SECRET     - Random string สำหรับ JWT refresh token
DEPLOY_SSH_KEY         - Private key สำหรับ SSH deploy (ถ้าใช้)
DEPLOY_HOST            - IP/hostname ของเซิร์ฟเวอร์
```

> **หมายเหตุ:** ตอนนี้ workflow ยัง**ไม่ได้**ใช้ secrets เหล่านี้ เพราะเป็นแบบ manual deploy (ดาวน์โหลด zip แล้วไป deploy เอง)

---

## 📥 ดาวน์โหลดไฟล์สำหรับ Deploy

### วิธีที่ 1: จาก GitHub Releases (แนะนำ)

1. ไปที่ `https://github.com/<username>/<repo>/releases`
2. คลิก Release version ที่ต้องการ (เช่น `v1.0.2`)
3. ดาวน์โหลด:
   - `backend-deploy.zip`
   - `frontend-dist.zip`

### วิธีที่ 2: จาก Actions Artifacts

1. ไปที่ Actions tab
2. คลิก workflow run ที่ต้องการ
3. Scroll ลงไปที่ "Artifacts" section
4. ดาวน์โหลด zip ที่ต้องการ

---

## 🚨 Troubleshooting

### ❌ Build Failed

**ดูใน Actions logs:**
1. ไปที่ Actions > คลิก workflow ที่ล้มเหลว
2. คลิกที่ job "Build Frontend & Backend"
3. อ่าน error message

**ปัญหาที่พบบ่อย:**
- Missing dependencies: รัน `npm install` ใน local แล้ว push ใหม่
- TypeScript errors: แก้ error ใน code แล้ว push ใหม่
- Build timeout: ลด dependencies หรือเพิ่ม RAM ของ runner

### ❓ ไม่เห็น Artifacts

- ต้องรอ workflow รันจบก่อน (ดูที่ Actions tab)
- Artifacts เก็บได้ 30 วัน หลังจากนั้นจะหายอัตโนมัติ
- ถ้าต้องการเก็บถาวร ให้สร้าง Release (push tag)

### 🔑 Permission Denied

- ตรวจสอบว่า Personal Access Token (PAT) ของคุณมีสิทธิ์ `repo` และ `workflow`
- ถ้าใช้ SSH ตรวจสอบว่าเพิ่ม SSH key แล้ว

---

## 📖 อ้างอิง

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) - คู่มือ deploy แบบละเอียด
