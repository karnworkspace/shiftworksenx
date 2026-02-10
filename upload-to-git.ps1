# สคริปต์สำหรับอัปโหลดโค้ดขึ้น Git

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Git Upload Script - Shift Work Management" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่ามี Git หรือไม่
try {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git not found!" -ForegroundColor Red
    Write-Host "กรุณาติดตั้ง Git จาก: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "กำลังตรวจสอบ Git repository..." -ForegroundColor Yellow

# ตรวจสอบว่ามี .git หรือไม่
if (Test-Path .git) {
    Write-Host "✓ Git repository พบแล้ว" -ForegroundColor Green
    
    # แสดงสถานะปัจจุบัน
    Write-Host ""
    Write-Host "สถานะ Git ปัจจุบัน:" -ForegroundColor Cyan
    git status
    
    Write-Host ""
    $addFiles = Read-Host "ต้องการเพิ่มไฟล์ทั้งหมดหรือไม่? (Y/n)"
    
    if ($addFiles -ne "n" -and $addFiles -ne "N") {
        Write-Host "กำลังเพิ่มไฟล์..." -ForegroundColor Yellow
        git add .
        
        Write-Host ""
        $commitMsg = Read-Host "ใส่ commit message (หรือกด Enter เพื่อใช้ข้อความ default)"
        
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Update: Code improvements and new features"
        }
        
        Write-Host "กำลัง commit..." -ForegroundColor Yellow
        git commit -m "$commitMsg"
        
        Write-Host ""
        $doPush = Read-Host "ต้องการ push ขึ้น remote หรือไม่? (Y/n)"
        
        if ($doPush -ne "n" -and $doPush -ne "N") {
            Write-Host "กำลัง push..." -ForegroundColor Yellow
            git push
            Write-Host ""
            Write-Host "✓ อัปโหลดสำเร็จ!" -ForegroundColor Green
        } else {
            Write-Host "ข้าม push - คุณสามารถรัน 'git push' เองได้ภายหลัง" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "✗ ไม่พบ Git repository" -ForegroundColor Red
    Write-Host ""
    $initGit = Read-Host "ต้องการสร้าง Git repository ใหม่หรือไม่? (Y/n)"
    
    if ($initGit -ne "n" -and $initGit -ne "N") {
        Write-Host ""
        Write-Host "กำลังสร้าง Git repository..." -ForegroundColor Yellow
        git init
        
        Write-Host "กำลังเพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
        git add .
        
        Write-Host "กำลังสร้าง initial commit..." -ForegroundColor Yellow
        git commit -m "Initial commit: Shift Work Management System v1.0"
        
        Write-Host ""
        Write-Host "✓ สร้าง Git repository สำเร็จ!" -ForegroundColor Green
        Write-Host ""
        Write-Host "ขั้นตอนต่อไป:" -ForegroundColor Cyan
        Write-Host "1. สร้าง repository บน GitHub/GitLab/Bitbucket" -ForegroundColor Yellow
        Write-Host "2. รันคำสั่ง:" -ForegroundColor Yellow
        Write-Host "   git remote add origin <URL>" -ForegroundColor White
        Write-Host "   git branch -M main" -ForegroundColor White
        Write-Host "   git push -u origin main" -ForegroundColor White
        Write-Host ""
        Write-Host "ตัวอย่าง URL:" -ForegroundColor Cyan
        Write-Host "   GitHub:    https://github.com/username/shift-work-senx.git" -ForegroundColor White
        Write-Host "   GitLab:    https://gitlab.com/username/shift-work-senx.git" -ForegroundColor White
        Write-Host "   Bitbucket: https://bitbucket.org/username/shift-work-senx.git" -ForegroundColor White
        Write-Host ""
        
        $addRemote = Read-Host "ต้องการเพิ่ม remote repository เลยหรือไม่? (y/N)"
        
        if ($addRemote -eq "y" -or $addRemote -eq "Y") {
            Write-Host ""
            $remoteUrl = Read-Host "ใส่ URL ของ remote repository"
            
            if (-not [string]::IsNullOrWhiteSpace($remoteUrl)) {
                Write-Host "กำลังเพิ่ม remote..." -ForegroundColor Yellow
                git remote add origin $remoteUrl
                
                Write-Host "กำลังเปลี่ยนชื่อ branch เป็น main..." -ForegroundColor Yellow
                git branch -M main
                
                Write-Host ""
                $doPush = Read-Host "ต้องการ push เลยหรือไม่? (Y/n)"
                
                if ($doPush -ne "n" -and $doPush -ne "N") {
                    Write-Host "กำลัง push..." -ForegroundColor Yellow
                    git push -u origin main
                    Write-Host ""
                    Write-Host "✓ อัปโหลดสำเร็จ!" -ForegroundColor Green
                } else {
                    Write-Host "ข้าม push - คุณสามารถรัน 'git push -u origin main' เองได้ภายหลัง" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "ยกเลิก - ไม่มีการเปลี่ยนแปลง" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  เสร็จสิ้น!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "เอกสารเพิ่มเติม:" -ForegroundColor Cyan
Write-Host "  - GIT_UPLOAD_GUIDE.md - คู่มือการใช้ Git แบบละเอียด" -ForegroundColor White
Write-Host "  - USER_GUIDE.md - คู่มือการใช้งานระบบ" -ForegroundColor White
Write-Host ""
