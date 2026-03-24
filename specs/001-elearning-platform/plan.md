# Implementation Plan: E-Learning Platform for รพ.สต.

**Branch**: `001-elearning-platform` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)

---

## Summary

สร้าง E-Learning Platform สำหรับเจ้าหน้าที่ รพ.สต. รองรับการเรียนผ่านวิดีโอ บันทึก progress อัตโนมัติ สร้าง certificate เมื่อจบคอร์ส และ export KPI ไป Google Sheets

Stack: React (Vite + Tailwind) + Node.js (Express) + PostgreSQL + Google Sheets API

---

## Technical Context

**Language/Version**: Node.js 20 LTS, React 18, TypeScript
**Primary Dependencies**: Express, Prisma ORM, JWT, React Router, Tailwind CSS, Playwright
**Storage**: PostgreSQL
**Testing**: Jest (unit/integration), Playwright (E2E)
**Target Platform**: Web (desktop + mobile browser)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Page load < 3s, API < 500ms, Certificate < 10s
**Constraints**: PDPA compliant, ไม่เก็บข้อมูลผู้ป่วย, JWT auth
**Scale/Scope**: >= 200 concurrent users, ระดับประเทศ

---

## Constitution Check

- [x] Backend as source of truth — all logic in service layer
- [x] Code split: controller → service → repository
- [x] TDD: tests written before implementation
- [x] Reusable components: shared UI component library
- [x] Always commit per logical unit
- [x] No Google Sheets as DB
- [x] JWT auth with expiry + refresh
- [x] Logging on all critical operations

---

## Project Structure

### Documentation

```text
specs/001-elearning-platform/
├── plan.md              # This file
├── research.md          # Technology research
├── data-model.md        # DB schema design
├── quickstart.md        # Setup guide
├── contracts/           # API contracts
│   ├── auth.md
│   ├── courses.md
│   ├── progress.md
│   └── certificates.md
└── tasks.md             # Actionable tasks
```

### Source Code Structure

```text
BGS E-Learning/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          (controller, service, repository)
│   │   │   ├── course/        (controller, service, repository)
│   │   │   ├── progress/      (controller, service, repository)
│   │   │   ├── certificate/   (controller, service, repository)
│   │   │   └── analytics/     (controller, service, repository)
│   │   ├── middleware/        (auth, logging, validation)
│   │   ├── shared/            (types, utils, constants)
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── frontend/
│   ├── src/
│   │   ├── components/        (shared UI components)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── courses/
│   │   │   ├── dashboard/
│   │   │   └── admin/
│   │   ├── hooks/             (shared business hooks)
│   │   ├── services/          (API calls)
│   │   └── lib/               (utils, constants)
│   └── tests/
│
└── e2e/                       (Playwright tests)
    ├── auth.spec.ts
    ├── courses.spec.ts
    ├── progress.spec.ts
    └── certificate.spec.ts
```

---

## Implementation Phases

### Phase 0 — Research & Setup
- Setup monorepo structure
- Initialize backend (Node.js + Express + Prisma)
- Initialize frontend (Vite + React + Tailwind)
- Setup PostgreSQL + migrations
- Configure Jest + Playwright

### Phase 1 — Auth Module (P1)
- TDD: เขียน tests auth ก่อน
- Implement: register, login, logout, refresh token
- Middleware: JWT validation

### Phase 2 — Course & Video Module (P1)
- TDD: เขียน tests course CRUD
- Implement: course listing, video listing
- Frontend: CourseList page, VideoPlayer page

### Phase 3 — Progress Tracking (P1)
- TDD: เขียน tests progress logic (≥80% rule)
- Implement: progress save (async), completion check
- Frontend: progress bar, completion indicators

### Phase 4 — Dashboard (P2)
- Implement: user dashboard with progress summary
- Frontend: Dashboard page with course cards

### Phase 5 — Certificate (P2)
- TDD: เขียน tests certificate generation
- Implement: generate PDF, store in DB, download endpoint

### Phase 6 — Admin Panel (P3)
- Implement: course/video CRUD, analytics view

### Phase 7 — Google Sheets Export (P3)
- Implement: KPI export to Google Sheets

### Phase 8 — E2E Tests & Polish
- Playwright E2E tests ทุก user story
- Performance tuning
- Security review
