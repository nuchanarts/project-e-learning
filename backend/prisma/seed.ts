import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Force utf8mb4 for TIS-620 MySQL (BMS/HOSxP server)
  await prisma.$executeRawUnsafe('SET NAMES utf8mb4');
  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bgs.local' },
    update: {},
    create: {
      email: 'admin@bgs.local',
      passwordHash: adminHash,
      name: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
    },
  });

  // Regular user
  const userHash = await bcrypt.hash('user1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@bgs.local' },
    update: {},
    create: {
      email: 'user@bgs.local',
      passwordHash: userHash,
      name: 'เจ้าหน้าที่ รพ.สต.',
      role: 'USER',
    },
  });

  // Sample course
  const course = await prisma.course.upsert({
    where: { id: 'course-001' },
    update: {},
    create: {
      id: 'course-001',
      title: 'การดูแลสุขภาพเบื้องต้น',
      description: 'คอร์สพื้นฐานสำหรับเจ้าหน้าที่ รพ.สต.',
      isActive: true,
      videos: {
        create: [
          { title: 'บทที่ 1: บทนำ', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 300, order: 1 },
          { title: 'บทที่ 2: หลักการพื้นฐาน', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480, order: 2 },
          { title: 'บทที่ 3: การปฏิบัติ', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 600, order: 3 },
        ],
      },
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Accounts:');
  console.log('  Admin : admin@bgs.local  / admin1234');
  console.log('  User  : user@bgs.local   / user1234');
  console.log(`  Course: "${course.title}" (3 videos)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
