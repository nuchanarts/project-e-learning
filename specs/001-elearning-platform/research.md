# Research: E-Learning Platform

**Branch**: `001-elearning-platform` | **Date**: 2026-03-24

---

## Stack Decisions

### Backend: Node.js + Express + Prisma
- Express: lightweight, widely used, ง่ายต่อการ maintain
- Prisma ORM: type-safe, migration support, PostgreSQL excellent support
- JWT (jsonwebtoken): stateless auth, ไม่ต้องมี session store

### Frontend: React 18 + Vite + Tailwind CSS
- Vite: fast dev server, fast build
- React 18: concurrent features, hooks ecosystem
- Tailwind: utility-first, consistent design system
- React Router v6: client-side routing

### Database: PostgreSQL
- ACID compliance สำหรับ progress tracking
- JSON support สำหรับ metadata
- Prisma migrations สำหรับ schema versioning

### Testing: Jest + Playwright
- Jest: unit/integration tests สำหรับ backend
- React Testing Library: component tests
- Playwright: E2E tests ครอบคลุม user journeys

### Video Progress Tracking
- ใช้ HTML5 video `timeupdate` event — fire ทุก 250ms
- Debounce save ทุก 5 วินาที เพื่อลด API calls
- Save ณ `onPause`, `onEnded` events เสมอ
- Progress = (currentTime / duration) * 100

### Certificate Generation
- `pdfkit` หรือ `puppeteer` สำหรับ PDF generation
- Template-based: HTML → PDF
- Store ใน local filesystem หรือ S3-compatible storage

### Google Sheets Integration
- Google Sheets API v4
- Service Account authentication
- Export ทำแบบ batch ไม่ใช่ real-time

---

## Security Considerations

- bcrypt สำหรับ password hashing (salt rounds = 12)
- JWT access token: 15 นาที, refresh token: 7 วัน
- Rate limiting บน auth endpoints
- Helmet.js สำหรับ HTTP security headers
- Input validation: Zod schema validation

---

## Performance Considerations

- Database indexes: users.email, progress.(userId, videoId), certificates.(userId, courseId)
- API response caching สำหรับ course listing (5 นาที)
- Video progress: async save ไม่บล็อก UI
- Lazy loading สำหรับ frontend pages
