import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // สร้าง Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@senx.com' },
    update: {},
    create: {
      email: 'admin@senx.com',
      password: hashedPassword,
      name: 'Admin SENX',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created admin:', admin.email);

  // สร้าง Site Admin (non-SUPER_ADMIN user with project access)
  const siteAdminPassword = await bcrypt.hash('admin123', 10);
  const siteAdmin = await prisma.user.upsert({
    where: { email: 'siteadmin@gmail.com' },
    update: {},
    create: {
      email: 'siteadmin@gmail.com',
      password: siteAdminPassword,
      name: 'Site Admin',
      role: 'SITE_MANAGER',
      permissions: ['reports', 'roster', 'staff', 'projects'],
    },
  });

  console.log('✅ Created site admin:', siteAdmin.email);

  // สร้างประเภทกะการทำงาน (Shift Types)
  const defaultShifts = [
    {
      code: 'OFF',
      name: 'หยุด',
      startTime: null,
      endTime: null,
      color: '#6b7280', // เทา
      isWorkShift: false,
    },
    {
      code: 'ขาด',
      name: 'ขาดงาน',
      startTime: null,
      endTime: null,
      color: '#ef4444', // แดง
      isWorkShift: false,
      isSystemDefault: true, // ไม่ให้ลบ
    },
    {
      code: '1',
      name: 'กะเช้า',
      startTime: '08:00',
      endTime: '16:00',
      color: '#3b82f6', // น้ำเงิน
      isWorkShift: true,
    },
    {
      code: '2',
      name: 'กะบ่าย',
      startTime: '16:00',
      endTime: '00:00',
      color: '#10b981', // เขียว
      isWorkShift: true,
    },
    {
      code: 'ดึก',
      name: 'กะดึก',
      startTime: '00:00',
      endTime: '08:00',
      color: '#8b5cf6', // ม่วง
      isWorkShift: true,
    },
    {
      code: 'ลา',
      name: 'ลาพักร้อน',
      startTime: null,
      endTime: null,
      color: '#f59e0b', // ส้ม
      isWorkShift: false,
    },
    {
      code: 'ป่วย',
      name: 'ลาป่วย',
      startTime: null,
      endTime: null,
      color: '#fbbf24', // ส้มอ่อน
      isWorkShift: false,
    },
    {
      code: 'กิจ',
      name: 'ลากิจ',
      startTime: null,
      endTime: null,
      color: '#f97316', // ส้มเข้ม
      isWorkShift: false,
    },
  ];

  // Upsert all default shifts
  for (const shift of defaultShifts) {
    await prisma.shiftType.upsert({
      where: { code: shift.code },
      update: {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        color: shift.color,
        isWorkShift: shift.isWorkShift,
      },
      create: shift,
    });
  }

  console.log('✅ Created/updated shift types');

  // สร้างโครงการตัวอย่าง
  const project1 = await prisma.project.create({
    data: {
      name: 'คอนโดมิเนียมแกรนด์สุขุมวิท',
      location: 'สุขุมวิท 71',
      themeColor: '#3b82f6',
      managerId: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'หมู่บ้านภัสสร',
      location: 'พระราม 2',
      themeColor: '#10b981',
      managerId: admin.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'ทาวน์โฮมเดอะแกรนด์',
      location: 'บางนา-ตราด กม.8',
      themeColor: '#f59e0b',
      managerId: admin.id,
    },
  });

  console.log('✅ Created projects');

  // สร้าง UserProject assignments สำหรับ siteAdmin
  await prisma.userProject.createMany({
    data: [
      { userId: siteAdmin.id, projectId: project1.id },
      { userId: siteAdmin.id, projectId: project2.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Assigned projects to site admin (project 1 & 2)');

  // สร้างพนักงานตัวอย่าง - โครงการ 1
  const staff1 = await prisma.staff.create({
    data: {
      name: 'สมชาย ใจดี',
      position: 'รปภ.เช้า',
      phone: '081-234-5678',
      wagePerDay: 450,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: true,
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      name: 'สมหญิง สุขใจ',
      position: 'แม่บ้าน',
      phone: '089-876-5432',
      wagePerDay: 400,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: true,
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      name: 'ประยุทธ์ มั่นคง',
      position: 'รปภ.สแปร์',
      phone: '092-111-2233',
      wagePerDay: 450,
      staffType: 'SPARE',
      projectId: project1.id,
      isActive: true,
    },
  });

  const staff4 = await prisma.staff.create({
    data: {
      name: 'วิชัย รักษาชาติ',
      position: 'รปภ.บ่าย',
      phone: '086-888-9999',
      wagePerDay: 450,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: true,
    },
  });

  const staff5 = await prisma.staff.create({
    data: {
      name: 'ธนากร สมบูรณ์',
      position: 'รปภ.ดึก',
      phone: '093-777-6666',
      wagePerDay: 480,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: true,
    },
  });

  const staff6 = await prisma.staff.create({
    data: {
      name: 'นภา ดีเลิศ',
      position: 'พนักงานทำความสะอาด',
      phone: '088-444-3333',
      wagePerDay: 380,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: true,
    },
  });

  // พนักงานโครงการ 2
  const staff7 = await prisma.staff.create({
    data: {
      name: 'สมศักดิ์ วิริยะ',
      position: 'ช่างซ่อมบำรุง',
      phone: '085-555-6677',
      wagePerDay: 500,
      staffType: 'REGULAR',
      projectId: project2.id,
      isActive: true,
    },
  });

  const staff8 = await prisma.staff.create({
    data: {
      name: 'อนุชา กล้าหาญ',
      position: 'รปภ.',
      phone: '082-333-4444',
      wagePerDay: 450,
      staffType: 'REGULAR',
      projectId: project2.id,
      isActive: true,
    },
  });

  const staff9 = await prisma.staff.create({
    data: {
      name: 'พิมพ์ใจ แจ่มใส',
      position: 'แม่บ้าน',
      phone: '091-222-1111',
      wagePerDay: 400,
      staffType: 'REGULAR',
      projectId: project2.id,
      isActive: true,
    },
  });

  // พนักงานโครงการ 3
  const staff10 = await prisma.staff.create({
    data: {
      name: 'ชัยวัฒน์ เจริญ',
      position: 'รปภ.',
      phone: '087-666-7777',
      wagePerDay: 450,
      staffType: 'REGULAR',
      projectId: project3.id,
      isActive: true,
    },
  });

  const staff11 = await prisma.staff.create({
    data: {
      name: 'สุภาพร มานะ',
      position: 'พนักงานสวน',
      phone: '084-999-8888',
      wagePerDay: 420,
      staffType: 'REGULAR',
      projectId: project3.id,
      isActive: true,
    },
  });

  // พนักงานที่ไม่ได้ใช้งาน (Inactive)
  const staff12 = await prisma.staff.create({
    data: {
      name: 'บุญมี ลาออก',
      position: 'รปภ.',
      phone: '080-111-2222',
      wagePerDay: 450,
      staffType: 'REGULAR',
      projectId: project1.id,
      isActive: false,
    },
  });

  console.log('✅ Created 12 staff members');

  // สร้างตารางเวรสำหรับเดือนปัจจุบัน (มกราคม 2026)
  const currentYear = 2026;
  const currentMonth = 1;
  const daysInMonth = 31;

  // สร้าง Roster
  const roster1 = await prisma.roster.create({
    data: {
      projectId: project1.id,
      year: currentYear,
      month: currentMonth,
    },
  });

  console.log('✅ Created roster for project 1');

  // สร้าง RosterEntry สำหรับพนักงานในโครงการ 1
  const shiftPatterns = {
    [staff1.id]: ['1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1', 'OFF', '1', '1', '1'],
    [staff2.id]: ['1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1'],
    [staff4.id]: ['2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2', 'OFF', '2', '2', '2'],
    [staff5.id]: ['ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก', 'OFF', 'ดึก', 'ดึก', 'ดึก'],
    [staff6.id]: ['1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1', '1', '1', 'OFF', 'OFF', '1', '1', '1'],
  };

  for (const [staffId, shifts] of Object.entries(shiftPatterns)) {
    for (let day = 1; day <= daysInMonth; day++) {
      await prisma.rosterEntry.create({
        data: {
          rosterId: roster1.id,
          staffId: staffId,
          day: day,
          shiftCode: shifts[day - 1],
        },
      });
    }
  }

  console.log('✅ Created roster entries for 31 days');

  console.log('🎉 Seed completed!');
  console.log('📧 Login with: admin@senx.com (SUPER_ADMIN - sees all projects)');
  console.log('📧 Login with: siteadmin@gmail.com (SITE_MANAGER - sees project 1 & 2 only)');
  console.log('🔑 Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
