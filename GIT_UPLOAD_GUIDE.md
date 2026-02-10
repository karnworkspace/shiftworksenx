# 📤 คำแนะนำการอัปโหลดโค้ดขึ้น Git

## 🔧 ติดตั้ง Git (ถ้ายังไม่มี)

### Windows
1. ดาวน์โหลด Git จาก https://git-scm.com/download/win
2. ติดตั้งโดยใช้ค่า default ทั้งหมด
3. เปิด Terminal ใหม่แล้วทดสอบ:
```bash
git --version
```

## 📋 ขั้นตอนการอัปโหลดขึ้น Git

### 1. เปิด PowerShell ที่โฟลเดอร์โครงการ

```powershell
cd "c:\Users\tanongsakn\Desktop\Project Dev\Shift Work SENX Juristic"
```

### 2. ตั้งค่า Git (ครั้งแรกเท่านั้น)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. เริ่มต้น Git Repository

```bash
# สร้าง Git repository
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# สร้าง commit แรก
git commit -m "Initial commit: Shift Work Management System v1.0"
```

### 4. เชื่อมต่อกับ GitHub/GitLab

#### วิธีที่ 1: GitHub

```bash
# สร้าง repository ใหม่บน GitHub (https://github.com/new)
# แล้วรันคำสั่งนี้ (เปลี่ยน URL เป็นของคุณ)

git remote add origin https://github.com/username/shift-work-senx.git
git branch -M main
git push -u origin main
```

#### วิธีที่ 2: GitLab

```bash
# สร้าง repository ใหม่บน GitLab
# แล้วรันคำสั่งนี้ (เปลี่ยน URL เป็นของคุณ)

git remote add origin https://gitlab.com/username/shift-work-senx.git
git branch -M main
git push -u origin main
```

#### วิธีที่ 3: Bitbucket

```bash
# สร้าง repository ใหม่บน Bitbucket
# แล้วรันคำสั่งนี้

git remote add origin https://bitbucket.org/username/shift-work-senx.git
git branch -M main
git push -u origin main
```

## 📝 การ Commit และ Push ในอนาคต

### อัปเดตโค้ดใหม่

```bash
# ดูไฟล์ที่เปลี่ยนแปลง
git status

# เพิ่มไฟล์ที่ต้องการ commit
git add .

# หรือเพิ่มเฉพาะไฟล์ที่ต้องการ
git add path/to/file.ts

# สร้าง commit พร้อมข้อความ
git commit -m "Add: Staff management feature"

# อัปโหลดขึ้น remote
git push
```

### ตัวอย่าง Commit Messages

```bash
# เพิ่มฟีเจอร์ใหม่
git commit -m "Add: Cost sharing report export feature"

# แก้ไข bug
git commit -m "Fix: Roster grid display issue on mobile"

# ปรับปรุงโค้ด
git commit -m "Refactor: Optimize staff query performance"

# อัปเดตเอกสาร
git commit -m "Docs: Update USER_GUIDE.md with new features"

# แก้ไขสไตล์
git commit -m "Style: Improve dashboard card layout"
```

## 🌿 การทำงานกับ Branch

### สร้าง Branch ใหม่

```bash
# สร้าง branch สำหรับฟีเจอร์ใหม่
git checkout -b feature/add-notification

# ทำงานและ commit
git add .
git commit -m "Add: Notification system"

# Push branch ใหม่
git push -u origin feature/add-notification
```

### Merge Branch

```bash
# กลับไปที่ main branch
git checkout main

# ดึงการเปลี่ยนแปลงล่าสุด
git pull

# Merge feature branch
git merge feature/add-notification

# Push การเปลี่ยนแปลง
git push
```

## 🔄 ดึงโค้ดล่าสุดจาก Remote

```bash
# ดึงและ merge อัตโนมัติ
git pull

# หรือดึงมาดูก่อน
git fetch
git merge origin/main
```

## 📦 ไฟล์ที่ไม่ควร Commit

ระบบได้สร้าง `.gitignore` ไว้แล้ว ซึ่งจะไม่ commit ไฟล์เหล่านี้:
- `node_modules/` - Dependencies
- `.env` - Environment variables (รหัสผ่าน, API keys)
- `dist/`, `build/` - Build outputs
- `package-lock.json` - Lock files
- Log files

## ⚠️ ข้อควรระวัง

### 1. ห้ามเปิดเผยข้อมูลสำคัญ

❌ **อย่า commit:**
- `.env` files
- รหัสผ่าน Database
- API Keys
- JWT Secret
- ข้อมูลส่วนตัว

✅ **ควร commit:**
- `.env.example` (ตัวอย่างโดยไม่มีค่าจริง)

### 2. สร้าง .env.example

```bash
# backend/.env.example
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key-here"
PORT=3001
```

### 3. ตั้งค่า Repository เป็น Private

ถ้าเป็นโครงการภายในองค์กร ควรตั้งเป็น **Private Repository**

## 🔐 ใช้ SSH แทน HTTPS (แนะนำ)

### สร้าง SSH Key

```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# คัดลอก public key
cat ~/.ssh/id_ed25519.pub
```

### เพิ่ม SSH Key ใน GitHub/GitLab

1. ไปที่ Settings → SSH Keys
2. วาง public key ที่คัดลอกมา
3. Save

### เปลี่ยน Remote เป็น SSH

```bash
# เช็ค remote ปัจจุบัน
git remote -v

# เปลี่ยนเป็น SSH
git remote set-url origin git@github.com:username/shift-work-senx.git
```

## 📊 ตรวจสอบ Git Status

```bash
# ดูสถานะปัจจุบัน
git status

# ดูประวัติ commit
git log --oneline

# ดูการเปลี่ยนแปลง
git diff

# ดู remote repositories
git remote -v

# ดู branch ทั้งหมด
git branch -a
```

## 🆘 การแก้ปัญหา

### ยกเลิก Changes ที่ยังไม่ได้ Commit

```bash
# ยกเลิกการเปลี่ยนแปลงไฟล์เดียว
git checkout -- path/to/file.ts

# ยกเลิกทั้งหมด
git reset --hard HEAD
```

### Undo Commit ล่าสุด

```bash
# เก็บการเปลี่ยนแปลงไว้
git reset --soft HEAD~1

# ลบการเปลี่ยนแปลงทิ้ง
git reset --hard HEAD~1
```

### แก้ Commit Message

```bash
# แก้ commit ล่าสุด
git commit --amend -m "New commit message"
```

### ลบไฟล์ที่ commit ไปแล้ว

```bash
# ลบจาก Git แต่เก็บไว้ในเครื่อง
git rm --cached path/to/file

# Commit การเปลี่ยนแปลง
git commit -m "Remove sensitive file"
git push
```

## 📚 ทรัพยากรเพิ่มเติม

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [GitLab Documentation](https://docs.gitlab.com/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

## ✅ Checklist ก่อน Push

- [ ] ลบ sensitive data (รหัสผ่าน, API keys)
- [ ] อัปเดต `.env.example`
- [ ] ทดสอบโค้ดแล้ว
- [ ] อัปเดต README.md (ถ้ามีการเปลี่ยนแปลง)
- [ ] เขียน commit message ที่ชัดเจน
- [ ] ตรวจสอบ `.gitignore`

---

**หมายเหตุ**: ถ้ามีปัญหาหรือข้อสงสัย สามารถถามได้เสมอครับ!
