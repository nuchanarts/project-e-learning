# Tasks: E-Learning Platform

**Branch**: `001-elearning-platform` | **Date**: 2026-03-24 | **Plan**: [plan.md](./plan.md)

---

## Phase 0 — Project Setup

- [ ] **T001** Initialize backend: Node.js + Express + TypeScript + Prisma
- [ ] **T002** Initialize frontend: Vite + React 18 + TypeScript + Tailwind CSS
- [ ] **T003** Setup PostgreSQL database + Prisma schema migration
- [ ] **T004** Configure Jest สำหรับ backend (unit + integration)
- [ ] **T005** Configure Playwright สำหรับ E2E tests
- [ ] **T006** Setup ESLint + Prettier + Husky pre-commit hooks
- [ ] **T007** Create shared component library structure (Button, Card, Modal, Form, Table)

---

## Phase 1 — Auth Module (P1)

- [ ] **T010** [TEST] เขียน unit tests: AuthService (register, login, refresh, logout)
- [ ] **T011** [TEST] เขียน integration tests: POST /auth/register, /auth/login, /auth/refresh
- [ ] **T012** Implement: UserRepository (create, findByEmail)
- [ ] **T013** Implement: AuthService (register, login, refreshToken, logout)
- [ ] **T014** Implement: AuthController + routes
- [ ] **T015** Implement: JWT middleware (validateToken)
- [ ] **T016** Frontend: LoginPage component
- [ ] **T017** Frontend: RegisterPage component
- [ ] **T018** Frontend: AuthContext + useAuth hook
- [ ] **T019** Frontend: ProtectedRoute component
- [ ] **T020** Commit: `feat(auth): implement JWT authentication`

---

## Phase 2 — Course & Video Module (P1)

- [ ] **T021** [TEST] เขียน unit tests: CourseService (list, getById)
- [ ] **T022** [TEST] เขียน integration tests: GET /courses, GET /courses/:id
- [ ] **T023** Implement: CourseRepository, VideoRepository
- [ ] **T024** Implement: CourseService
- [ ] **T025** Implement: CourseController + routes
- [ ] **T026** Frontend: CourseListPage (with loading/error/empty states)
- [ ] **T027** Frontend: CourseDetailPage + VideoPlayer component
- [ ] **T028** Commit: `feat(course): implement course and video listing`

---

## Phase 3 — Progress Tracking (P1)

- [ ] **T030** [TEST] เขียน unit tests: ProgressService (save, check >= 80%, course completion)
- [ ] **T031** [TEST] เขียน integration tests: POST /progress
- [ ] **T032** Implement: ProgressRepository
- [ ] **T033** Implement: ProgressService (saveProgress, checkVideoCompletion, checkCourseCompletion)
- [ ] **T034** Implement: ProgressController + routes
- [ ] **T035** Frontend: VideoPlayer progress tracking (debounce 5s, save on pause/end)
- [ ] **T036** Frontend: Progress indicators บน CourseDetail
- [ ] **T037** Commit: `feat(progress): implement video progress tracking with 80% completion rule`

---

## Phase 4 — Dashboard (P2)

- [ ] **T040** [TEST] เขียน unit tests: DashboardService
- [ ] **T041** [TEST] เขียน integration tests: GET /dashboard
- [ ] **T042** Implement: DashboardService + Controller
- [ ] **T043** Frontend: DashboardPage (course cards with progress)
- [ ] **T044** Commit: `feat(dashboard): implement user learning dashboard`

---

## Phase 5 — Certificate (P2)

- [ ] **T050** [TEST] เขียน unit tests: CertificateService (generate, check eligibility)
- [ ] **T051** [TEST] เขียน integration tests: GET /certificates/:courseId
- [ ] **T052** Implement: CertificateRepository
- [ ] **T053** Implement: CertificateService (generate PDF, store, retrieve)
- [ ] **T054** Implement: CertificateController + routes
- [ ] **T055** Frontend: Certificate download button + CertificateListPage
- [ ] **T056** Commit: `feat(certificate): implement certificate generation and download`

---

## Phase 6 — Admin Panel (P3)

- [ ] **T060** Implement: Admin course CRUD (create, update, delete)
- [ ] **T061** Implement: AnalyticsService (users count, completion rate, learning time)
- [ ] **T062** Frontend: AdminDashboard + CourseManagement pages
- [ ] **T063** Commit: `feat(admin): implement admin panel and analytics`

---

## Phase 7 — Google Sheets Export (P3)

- [ ] **T070** Setup Google Sheets API credentials
- [ ] **T071** Implement: SheetsExportService
- [ ] **T072** Implement: POST /admin/export/sheets endpoint
- [ ] **T073** Frontend: Export button บน Admin analytics
- [ ] **T074** Commit: `feat(analytics): implement Google Sheets KPI export`

---

## Phase 8 — E2E Tests & Polish

- [ ] **T080** [E2E] Playwright: auth flow (register → login → logout)
- [ ] **T081** [E2E] Playwright: course listing and video playback
- [ ] **T082** [E2E] Playwright: progress tracking and course completion
- [ ] **T083** [E2E] Playwright: certificate download
- [ ] **T084** Performance audit (Lighthouse): page load < 3s
- [ ] **T085** Security review: JWT, input validation, CORS
- [ ] **T086** Final commit + tag: `v1.0.0`

---

## Progress Summary

| Phase | Tasks | Done |
|-------|-------|------|
| 0 - Setup | 7 | 0 |
| 1 - Auth | 11 | 0 |
| 2 - Course | 8 | 0 |
| 3 - Progress | 8 | 0 |
| 4 - Dashboard | 5 | 0 |
| 5 - Certificate | 7 | 0 |
| 6 - Admin | 4 | 0 |
| 7 - Sheets | 5 | 0 |
| 8 - E2E | 7 | 0 |
| **Total** | **62** | **0** |
