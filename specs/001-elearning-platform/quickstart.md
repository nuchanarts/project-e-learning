# Quickstart Guide: E-Learning Platform

**Branch**: `001-elearning-platform` | **Date**: 2026-03-24

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- npm / pnpm
- Git

## Setup

```bash
# 1. Clone & install
git clone <repo>
cd "BGS E-Learning"

# 2. Backend setup
cd backend
cp .env.example .env
# แก้ไข DATABASE_URL, JWT_SECRET ใน .env
npm install
npx prisma migrate dev
npm run dev    # port 3001

# 3. Frontend setup
cd ../frontend
cp .env.example .env
# แก้ไข VITE_API_URL=http://localhost:3001
npm install
npm run dev    # port 5173

# 4. Run tests
cd backend && npm test
cd frontend && npm test
cd e2e && npx playwright test
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/bgs_elearning
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
GOOGLE_SHEETS_CREDENTIALS=./credentials/google-service-account.json
GOOGLE_SHEETS_ID=your-sheet-id
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Default Admin Account

```
Email: admin@bgs.local
Password: (ตั้งผ่าน seed script)
```

## API Endpoints Summary

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| POST   | /auth/register                | สมัครสมาชิก             |
| POST   | /auth/login                   | เข้าสู่ระบบ             |
| POST   | /auth/refresh                 | Refresh JWT token        |
| GET    | /courses                      | รายการคอร์ส             |
| GET    | /courses/:id                  | รายละเอียดคอร์ส         |
| POST   | /progress                     | บันทึก progress          |
| GET    | /dashboard                    | ข้อมูล dashboard        |
| GET    | /certificates/:courseId       | ดาวน์โหลด certificate   |
| GET    | /admin/analytics              | ข้อมูล KPI (admin only) |
| POST   | /admin/export/sheets          | Export ไป Google Sheets  |
