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
      cid: '1234567890000',
      hospital: 'สำนักงานสาธารณสุขจังหวัด',
      position: 'ผู้ดูแลระบบ',
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
      cid: '1234567890001',
      hospital: 'รพ.สต.บ้านใหม่',
      position: 'เจ้าหน้าที่สาธารณสุข',
    },
  });

  // Sample course 1
  const course1 = await prisma.course.upsert({
    where: { id: 'course-001' },
    update: {},
    create: {
      id: 'course-001',
      title: 'การดูแลสุขภาพเบื้องต้น',
      description: 'คอร์สพื้นฐานสำหรับเจ้าหน้าที่ รพ.สต.',
      category: 'สุขภาพพื้นฐาน',
      isActive: true,
      videos: {
        create: [
          { title: 'บทที่ 1: บทนำ', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 300, order: 1 },
          { title: 'บทที่ 2: หลักการพื้นฐาน', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 480, order: 2 },
          { title: 'บทที่ 3: การปฏิบัติ', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 600, order: 3 },
        ],
      },
      quizQuestions: {
        create: [
          {
            text: 'อาการใดบ่งชี้ว่าผู้ป่วยมีภาวะฉุกเฉิน?',
            options: JSON.stringify(['ปวดหัวเล็กน้อย', 'หมดสติ', 'ไอเล็กน้อย', 'ปวดท้องน้อย']),
            correctIndex: 1,
            order: 1,
          },
          {
            text: 'ขั้นตอนแรกในการปฐมพยาบาลคืออะไร?',
            options: JSON.stringify(['โทรแจ้ง 1669', 'ประเมินความปลอดภัย', 'ให้ยาผู้ป่วย', 'เคลื่อนย้ายผู้ป่วย']),
            correctIndex: 1,
            order: 2,
          },
          {
            text: 'ค่า SpO2 ปกติอยู่ในช่วงใด?',
            options: JSON.stringify(['70-80%', '80-90%', '95-100%', '60-70%']),
            correctIndex: 2,
            order: 3,
          },
        ],
      },
    },
  });

  // Sample course 2 (different category)
  const course2 = await prisma.course.upsert({
    where: { id: 'course-002' },
    update: {},
    create: {
      id: 'course-002',
      title: 'การบริหารยาในชุมชน',
      description: 'คอร์สเกี่ยวกับการจ่ายและติดตามการใช้ยาในชุมชน',
      category: 'เภสัชกรรมชุมชน',
      isActive: true,
      videos: {
        create: [
          { title: 'บทที่ 1: หลักการบริหารยา', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 420, order: 1 },
          { title: 'บทที่ 2: การจ่ายยาอย่างปลอดภัย', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 360, order: 2 },
        ],
      },
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Accounts:');
  console.log('  Admin : admin@bgs.local  / admin1234');
  console.log('  User  : user@bgs.local   / user1234');
  console.log(`  Course 1: "${course1.title}" (3 videos, 3 quiz questions) — category: สุขภาพพื้นฐาน`);
  console.log(`  Course 2: "${course2.title}" (2 videos) — category: เภสัชกรรมชุมชน`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
