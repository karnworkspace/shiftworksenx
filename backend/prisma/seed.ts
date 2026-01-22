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

  // สร้างโครงการตัวอย่าง
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'คอนโดมิเนียมแกรนด์สุขุมวิท',
      location: 'สุขุมวิท 71',
      themeColor: '#3b82f6',
      managerId: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: {
      id: 'proj-2',
      name: 'หมู่บ้านภัสสร',
      location: 'พระราม 2',
      themeColor: '#10b981',
      managerId: admin.id,
    },
  });

  const project3 = await prisma.project.upsert({
    where: { id: 'proj-3' },
    update: {},
    create: {
      id: 'proj-3',
      name: 'ทาวน์โฮมเดอะแกรนด์',
      location: 'บางนา-ตราด กม.8',
      themeColor: '#f59e0b',
      managerId: admin.id,
    },
  });

  console.log('✅ Created projects');

  // สร้าง Cost Sharing (โครงการ 1 แชร์ให้โครงการ 2 และ 3)
  await prisma.costSharing.createMany({
    data: [
      {
        sourceProjectId: project1.id,
        destinationProjectId: project2.id,
        percentage: 30,
      },
      {
        sourceProjectId: project1.id,
        destinationProjectId: project3.id,
        percentage: 20,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created cost sharing');

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

  // สร้าง MonthlyAttendance สำหรับการคำนวณค่าหัก
  await prisma.monthlyAttendance.createMany({
    data: [
      {
        staffId: staff1.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 24,
        totalAbsent: 0,
        totalLate: 1,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 50,
      },
      {
        staffId: staff2.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 26,
        totalAbsent: 0,
        totalLate: 0,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 0,
      },
      {
        staffId: staff4.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 24,
        totalAbsent: 1,
        totalLate: 0,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 450,
      },
      {
        staffId: staff5.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 24,
        totalAbsent: 0,
        totalLate: 2,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 100,
      },
      {
        staffId: staff6.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 26,
        totalAbsent: 0,
        totalLate: 0,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 0,
      },
      {
        staffId: staff7.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 22,
        totalAbsent: 0,
        totalLate: 0,
        totalSickLeave: 3,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 0,
      },
      {
        staffId: staff8.id,
        rosterId: roster1.id,
        year: currentYear,
        month: currentMonth,
        totalWorkDays: 25,
        totalAbsent: 0,
        totalLate: 0,
        totalSickLeave: 0,
        totalPersonalLeave: 0,
        totalVacation: 0,
        deductionAmount: 0,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created monthly attendance records');

  console.log('🎉 Seed completed!');
  console.log('📧 Login with: admin@senx.com');
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
