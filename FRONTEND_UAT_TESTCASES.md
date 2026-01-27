# Frontend UAT Test Cases (Shift Work SENX Juristic)

เอกสารนี้เป็นชุด Test case สำหรับให้ผู้ใช้ทดสอบการทำงานของ **Frontend (React + Vite + Ant Design)** แบบ Manual/UAT

## วัตถุประสงค์ของการทดสอบการใช้งาน (UAT)

- ยืนยันว่า Flow งานหลักของผู้ใช้งานทำได้ครบถ้วน (Login > จัดการโครงการ/พนักงาน > จัดกะ > ดูรายงาน)
- ตรวจสอบความถูกต้องของข้อมูลที่แสดงผลและการบันทึก (CRUD, ตารางเวร, รายงาน, Cost Sharing)
- ตรวจสอบสิทธิ์การใช้งาน (Role/Permissions) และการเข้าถึงเมนู/หน้าจอที่ถูกต้อง
- ตรวจสอบความพร้อมใช้งานของหน้าจอสำคัญ รวมถึงข้อความแจ้งเตือน/validation และการจัดการ error
- ลดความเสี่ยงก่อนใช้งานจริง โดยค้นหาปัญหาที่กระทบผู้ใช้ (การใช้งาน, ข้อมูลผิด, การดาวน์โหลดรายงาน)

---

## 1) ขอบเขตหน้าจอที่ทดสอบ

- Login (`/login`)
- Dashboard Layout + เมนูตามสิทธิ์ (`/dashboard/*`)
- โครงการ (`/dashboard/projects`)
- พนักงาน (`/dashboard/staff`)
- ตารางเวร (`/dashboard/roster`)
- รายงาน/สรุป + ดาวน์โหลด PDF (`/dashboard/reports`)
- ตั้งค่า (ประเภทกะ) (`/dashboard/settings`)
- จัดการผู้ใช้/สิทธิ์ (`/dashboard/users`)

---

## 2) สภาพแวดล้อม/ข้อมูลตั้งต้น (แนะนำ)

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000` (อ้างอิงจาก README)
- บัญชีทดสอบ (ตาม README): `admin@senx.com / admin123`

ข้อมูลตัวอย่างที่ควรมีเพื่อให้ทดสอบครบ:
- โครงการอย่างน้อย 2 โครงการ (เช่น Project A, Project B)
- พนักงานอย่างน้อย 5 คน/โครงการ และมีทั้ง Active/Inactive
- ประเภทกะ (Shift Types) อย่างน้อย:
  - กะทำงาน: `1`, `2`, `3` (หรือชื่ออื่น) โดย `isWorkShift = true`
  - ไม่ทำงาน: `OFF` โดย `isWorkShift = false`
  - สถานะอื่น (ถ้ามีในระบบ): ขาด/ลา/ป่วย/สาย (ใช้สำหรับรายงานหักเงิน)
- ตั้งค่า Cost Sharing บางส่วน (เช่น Project A แชร์ 20% ไป Project B)
- ผู้ใช้เพิ่มเติม (นอกเหนือจาก Super Admin) อย่างน้อย 1 คน เพื่อทดสอบเมนูตามสิทธิ์ (permissions)

รูปแบบการบันทึกผลแนะนำ:
- Result: Pass/Fail
- Evidence: แนบภาพหน้าจอหรือข้อความ error
- Defect: ลิงก์ issue/รายละเอียดการเกิดซ้ำ

---

## 3) Test Cases

รูปแบบ:
- ID / ชื่อ
- Preconditions
- Steps
- Expected Result

### A) Authentication / Session / Permission

**AUTH-01: เข้าสู่ระบบสำเร็จ**
- Preconditions: มีผู้ใช้ `admin@senx.com`
- Steps: เปิดหน้า `/login` > กรอก email/password ที่ถูกต้อง > กด “เข้าสู่ระบบ”
- Expected: เข้าหน้า `/dashboard` ได้, มีเมนูด้านซ้าย, เห็นชื่อผู้ใช้บนมุมขวาบน

**AUTH-02: เข้าสู่ระบบด้วยรหัสผ่านผิด**
- Steps: กรอก email ถูกต้อง + password ผิด > กดเข้าสู่ระบบ
- Expected: แสดงข้อความ error และไม่เข้า dashboard

**AUTH-03: Validate ฟอร์ม Login**
- Steps: กดเข้าสู่ระบบโดยไม่กรอกฟิลด์ / กรอก email รูปแบบผิด
- Expected: แสดง validation message ใต้ฟิลด์, ไม่ส่ง request

**AUTH-04: Reload แล้วยังอยู่ในระบบ**
- Preconditions: Login สำเร็จแล้ว
- Steps: รีเฟรชหน้า (F5) บน `/dashboard/roster`
- Expected: ยังเข้าได้ (session/token ถูกเก็บไว้), ไม่เด้งกลับ `/login`

**AUTH-05: Logout**
- Preconditions: Login สำเร็จแล้ว
- Steps: คลิกเมนูผู้ใช้มุมขวาบน > “ออกจากระบบ”
- Expected: กลับหน้า `/login` และเข้า `/dashboard/*` ไม่ได้จนกว่าจะ login ใหม่

**AUTH-06: เข้าหน้าหลังบ้านโดยไม่ login**
- Steps: เปิด URL `/dashboard/roster` ในหน้าต่างใหม่/Incognito
- Expected: Redirect ไป `/login`

**AUTH-07: เมนูตามสิทธิ์ (permissions)**
- Preconditions: มี user ที่ไม่ใช่ SUPER_ADMIN และกำหนด permissions บางเมนู
- Steps: Login ด้วย user ดังกล่าว
- Expected: แสดงเฉพาะเมนูที่ได้รับสิทธิ์เท่านั้น (เช่น มี `roster` แต่ไม่มี `users`)

**AUTH-08: SUPER_ADMIN เห็นทุกเมนู**
- Preconditions: Login ด้วย role = `SUPER_ADMIN`
- Steps: เปิด Dashboard
- Expected: เห็นทุกเมนู (reports/roster/staff/projects/users/settings)

### B) Projects (โครงการ + Cost Sharing)

**PRJ-01: โหลดรายการโครงการ**
- Preconditions: มีโครงการอย่างน้อย 1 รายการ
- Steps: ไปหน้า “โครงการ”
- Expected: เห็นตารางรายการโครงการ, ไม่มี error, แสดง staff count ต่อโครงการได้

**PRJ-02: สร้างโครงการใหม่ (ขั้นต่ำ)**
- Steps: กด “เพิ่มโครงการ” > กรอกชื่อ > กดบันทึก
- Expected: โครงการใหม่แสดงในตารางทันที

**PRJ-03: Validate ชื่อโครงการ**
- Steps: กดเพิ่มโครงการ > ไม่กรอกชื่อ > กดบันทึก
- Expected: แจ้งเตือน “กรุณากรอกชื่อโครงการ”

**PRJ-04: แก้ไขโครงการ**
- Steps: เลือกโครงการ > กดแก้ไข > เปลี่ยนชื่อ/สถานที่ > บันทึก
- Expected: ข้อมูลอัปเดตในตาราง, ไม่มีข้อมูลหาย

**PRJ-05: ลบโครงการ (ยืนยันก่อนลบ)**
- Steps: กดลบโครงการ > ยืนยัน
- Expected: โครงการหายจากตาราง, แสดง success message

**PRJ-06: Cost Sharing - เพิ่มรายการปลายทาง**
- Preconditions: มีอย่างน้อย 2 โครงการ
- Steps: แก้ไขโครงการ A > ใน Cost Sharing กด “เพิ่ม” > เลือกโครงการปลายทางเป็น B > ใส่ % = 20 > บันทึก
- Expected: บันทึกสำเร็จ, เปิดแก้ไขอีกครั้งเห็นรายการที่เพิ่ม

**PRJ-07: Cost Sharing - ไม่ให้เลือกโครงการตัวเองเป็นปลายทาง**
- Steps: แก้ไขโครงการ A > เปิด dropdown โครงการปลายทาง
- Expected: ไม่พบโครงการ A ในรายการให้เลือก

**PRJ-08: Cost Sharing - จำกัด % 0-100**
- Steps: ใส่ % < 0 หรือ > 100 > กดบันทึก
- Expected: ฟอร์มแจ้งเตือนและไม่ให้บันทึก

### C) Staff (พนักงาน)

**STF-01: เปลี่ยนโครงการแล้วรายการพนักงานเปลี่ยนตาม**
- Preconditions: มีพนักงานในหลายโครงการ
- Steps: ไปหน้า “พนักงาน” > เปลี่ยนโครงการจาก dropdown
- Expected: ตารางแสดงเฉพาะพนักงานในโครงการที่เลือก

**STF-02: เพิ่มพนักงานใหม่**
- Steps: เลือกโครงการ > กด “เพิ่มพนักงาน” > กรอก รหัส/ชื่อ/ตำแหน่ง/ค่าแรง > บันทึก
- Expected: พนักงานใหม่แสดงในตาราง

**STF-03: Validate ฟิลด์บังคับ (รหัส/ชื่อ/ตำแหน่ง/ค่าแรง)**
- Steps: เปิด modal เพิ่มพนักงาน > เว้นฟิลด์บังคับ > กดบันทึก
- Expected: แจ้งเตือนครบทุกฟิลด์ที่จำเป็น, ไม่บันทึก

**STF-04: แก้ไขพนักงาน**
- Steps: กดแก้ไขพนักงาน > แก้ชื่อ/ตำแหน่ง/เบอร์/ค่าแรง/หมายเหตุ > บันทึก
- Expected: ข้อมูลอัปเดตในตาราง

**STF-05: เปลี่ยนสถานะเป็น Inactive**
- Preconditions: มีพนักงาน Active
- Steps: กดทำให้ Inactive (หรือปุ่มยกเลิกการทำงาน) ของพนักงานคนนั้น
- Expected: สถานะเปลี่ยน, (ควร) ไม่ถูกดึงไปแสดงในหน้าตารางเวร/รายงานที่กรองเฉพาะ Active

### D) Roster (ตารางเวร)

**ROS-01: โหลดตารางเวรตามโครงการ/เดือน**
- Preconditions: มีพนักงาน Active ในโครงการ
- Steps: ไปหน้า “ตารางเวร” > เลือกโครงการ > เลือกเดือน
- Expected: แสดงตารางรายพนักงาน x วันที่, ไม่มี error

**ROS-02: สลับเดือนแล้วจำนวนคอลัมน์วันถูกต้อง**
- Steps: เลือกเดือน 30 วัน/31 วัน/ก.พ. > สังเกตจำนวนคอลัมน์วัน
- Expected: จำนวนคอลัมน์เท่ากับจำนวนวันของเดือนนั้น

**ROS-03: เลือกวัน แล้วสถิติด้านบนอัปเดต**
- Steps: คลิกเลือก “วันที่” (หัวตารางวัน) ให้เปลี่ยนวัน > ดูการ์ดสถิติ (เข้างาน/ขาด/ลา/วันหยุด)
- Expected: ค่าบนการ์ดเปลี่ยนตามวันที่เลือก

**ROS-04: เปลี่ยนกะของพนักงาน 1 ช่อง**
- Steps: คลิก cell ของพนักงานในวันที่เลือก > เลือกกะจาก modal
- Expected: cell แสดงรหัสกะใหม่และสีใหม่, ปิด modal, ไม่ error

**ROS-05: ป้องกันการกดซ้ำระหว่างกำลังบันทึก**
- Steps: คลิก cell > เลือกกะ > ระหว่าง loading ลองกดกะซ้ำหลายครั้ง
- Expected: ระบบไม่ส่งซ้ำจนเกิดข้อมูลผิดพลาด/ไม่ crash, ปุ่มถูก disable ระหว่างบันทึก

**ROS-06: Persist หลัง refresh**
- Preconditions: มีการเปลี่ยนกะแล้ว
- Steps: รีเฟรชหน้า แล้วกลับมาที่เดือน/โครงการเดิม
- Expected: เห็นค่ากะที่บันทึกไว้

**ROS-07: Legend แสดงครบตาม Shift Types**
- Preconditions: มี shift types หลายรายการ
- Steps: ดูส่วน “สัญลักษณ์/Legend”
- Expected: แสดงรายการทั้งหมดตรงกับหน้าตั้งค่า (code/name/color)

### E) Settings (Shift Types)

**SET-01: เปิดหน้า Settings ต้อง login**
- Steps: เปิด `/dashboard/settings` โดยไม่ login
- Expected: เด้งกลับ `/login`

**SET-02: แสดงรายการ Shift Types**
- Preconditions: มี shift types ในระบบ
- Steps: ไปหน้า “ตั้งค่า”
- Expected: เห็นตาราง shift types พร้อม code/name/time/color/isWorkShift

**SET-03: เพิ่ม Shift Type ใหม่**
- Steps: กด “เพิ่มกะใหม่” > กรอก code/name > เลือกสี > บันทึก
- Expected: แสดงรายการใหม่ในตาราง, ไปหน้า Roster แล้วเห็นใน Legend/Modal เลือกกะ

**SET-04: แก้ไข Shift Type**
- Steps: กดแก้ไข > เปลี่ยนชื่อ/เวลา/สี/สถานะ isWorkShift > บันทึก
- Expected: ตารางอัปเดต และ Roster ใช้ค่าที่เปลี่ยน

**SET-05: ลบ Shift Type (ที่ไม่ใช่ระบบ)**
- Steps: เลือก shift ที่สร้างเอง > กดลบ > ยืนยัน
- Expected: ลบสำเร็จ และไม่แสดงใน Roster

**SET-06: Shift Type ระบบลบไม่ได้**
- Preconditions: มีรายการที่ `isSystemDefault = true`
- Steps: พยายามกดลบ/แก้ไขรายการนั้น
- Expected: ปุ่มลบ/แก้ไขถูก disable และมีคำอธิบายว่า “ไม่สามารถลบกะระบบได้”

### F) Reports (สรุป/หักเงิน/Cost Sharing + PDF)

**RPT-01: โหลดรายงานตามโครงการ/เดือน**
- Steps: ไปหน้า “รายงาน” > เลือกโครงการ > เลือกเดือน
- Expected: แสดงตารางรายงาน + การ์ดสรุป, ไม่มี error

**RPT-02: ตัวเลขสรุป (รวมวันทำงาน/ขาด/ลา) สอดคล้องกับ Roster**
- Preconditions: มีข้อมูล roster ในเดือนนั้น
- Steps: เทียบจำนวน “ขาด/ลา/OFF” ของพนักงาน 1 คนจากหน้า Roster กับหน้า Reports
- Expected: จำนวนสอดคล้องกัน

**RPT-03: Cost Sharing - แสดง Received/Shared Out**
- Preconditions: ตั้งค่า Cost Sharing ระหว่างโครงการอย่างน้อย 1 คู่ และมีข้อมูลหักเงิน
- Steps: เปิดหน้า Reports ของโครงการปลายทาง/ต้นทาง
- Expected: แสดง tag “รับจากโครงการอื่น” / “แชร์ไปโครงการอื่น” ตามการตั้งค่า

**RPT-04: ดาวน์โหลดรายงาน PDF**
- Preconditions: มีข้อมูล roster ในเดือนที่เลือก
- Steps: ไปหน้า Reports > กด “ดาวน์โหลด PDF”
- Expected: ระบบสร้างไฟล์และดาวน์โหลดสำเร็จ, มีข้อความ “ดาวน์โหลดรายงาน PDF แล้ว”

**RPT-05: ดาวน์โหลด PDF โดยยังไม่เลือกโครงการ**
- Steps: ทำให้ selected project ว่าง (ถ้ามีกรณีนี้) แล้วกดดาวน์โหลด
- Expected: แจ้งเตือนให้เลือกโครงการก่อน

### G) Users (จัดการผู้ใช้/สิทธิ์)

**USR-01: โหลดรายการผู้ใช้**
- Steps: ไปหน้า “จัดการผู้ใช้”
- Expected: เห็นตาราง users, มี role และ permissions แสดง

**USR-02: สร้างผู้ใช้ใหม่**
- Steps: กด “เพิ่มผู้ใช้” > กรอกชื่อ/อีเมล/role/password > เลือก permissions > กดสร้าง
- Expected: ผู้ใช้ใหม่แสดงในตาราง, login ด้วยผู้ใช้นี้ได้ (ถ้าระบบอนุญาต)

**USR-03: Validate email/required fields**
- Steps: ไม่กรอกฟิลด์บังคับ หรือกรอก email ไม่ถูกต้อง > กดสร้าง
- Expected: ฟอร์มแจ้งเตือน, ไม่สร้าง

**USR-04: แก้ไขผู้ใช้ + เปลี่ยน permissions**
- Steps: กดแก้ไขผู้ใช้ > ปรับ permissions (เช่น เอา `users` ออก) > บันทึก
- Expected: ค่าในตารางอัปเดต, login ด้วย user แล้วเมนูเปลี่ยนตามสิทธิ์

**USR-05: เปลี่ยนรหัสผ่าน**
- Steps: ในรายการผู้ใช้กด “เปลี่ยนรหัสผ่าน” > กรอก password ใหม่/ยืนยัน > บันทึก
- Expected: เปลี่ยนสำเร็จ, login ด้วยรหัสใหม่ได้

**USR-06: Validate เปลี่ยนรหัสผ่าน (ขั้นต่ำ/ยืนยันไม่ตรง)**
- Steps: กรอกรหัสสั้นกว่า 6 หรือ confirm ไม่ตรง > บันทึก
- Expected: ฟอร์มแจ้งเตือน, ไม่บันทึก

**USR-07: ลบผู้ใช้**
- Steps: กดลบ > ยืนยัน
- Expected: ผู้ใช้ถูกลบและหายจากตาราง

---

## 4) Smoke Test (ชุดสั้นสำหรับเช็คก่อนส่งงาน)

1) Login ได้ (AUTH-01) และ Logout ได้ (AUTH-05)  
2) สร้างโครงการ 1 รายการ (PRJ-02)  
3) เพิ่มพนักงาน 1 คนในโครงการ (STF-02)  
4) กำหนดกะในตารางเวร 1 ช่อง (ROS-04) และ refresh แล้วยังอยู่ (ROS-06)  
5) เปิดรายงานและดาวน์โหลด PDF ได้ (RPT-01, RPT-04)  
