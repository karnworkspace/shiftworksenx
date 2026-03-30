import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed: ไม่มีข้อมูลที่ต้องเติม');
  console.log('ℹ️  กรุณาเพิ่มข้อมูลผ่านหน้าเว็บโดยตรง');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
