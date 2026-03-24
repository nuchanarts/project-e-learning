# Data Model: E-Learning Platform

**Branch**: `001-elearning-platform` | **Date**: 2026-03-24

---

## Database Schema (PostgreSQL + Prisma)

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String
  role         Role          @default(USER)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  progress     Progress[]
  certificates Certificate[]
}

enum Role {
  USER
  ADMIN
}

model Course {
  id           String        @id @default(uuid())
  title        String
  description  String
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  videos       Video[]
  certificates Certificate[]
}

model Video {
  id         String     @id @default(uuid())
  courseId   String
  title      String
  url        String
  duration   Int        // วินาที
  order      Int
  createdAt  DateTime   @default(now())
  course     Course     @relation(fields: [courseId], references: [id])
  progress   Progress[]

  @@index([courseId, order])
}

model Progress {
  id          String   @id @default(uuid())
  userId      String
  videoId     String
  courseId    String
  percent     Float    @default(0)  // 0.0 - 100.0
  completed   Boolean  @default(false)
  watchedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  video       Video    @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
  @@index([userId, courseId])
}

model Certificate {
  id        String   @id @default(uuid())
  userId    String
  courseId  String
  filePath  String
  issuedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}
```

---

## Business Logic Rules

- **Progress**: `completed = percent >= 80`
- **Course Completion**: ทุก video ใน course มี `completed = true`
- **Certificate**: สร้างได้เฉพาะเมื่อ course completed แล้ว
- **Certificate Uniqueness**: 1 user + 1 course = 1 certificate เท่านั้น

---

## Indexes

| Table       | Index                          | Reason                          |
|-------------|--------------------------------|---------------------------------|
| users       | email (unique)                 | Login lookup                    |
| videos      | (courseId, order)              | Ordered video listing           |
| progress    | (userId, videoId) unique       | Progress upsert                 |
| progress    | (userId, courseId)             | Course completion check         |
| certificates| (userId, courseId) unique      | Prevent duplicate certificates  |
