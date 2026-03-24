<!--
SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0 (MINOR: added Code Quality, TDD, UX, Performance, Dev Workflow principles)
Templates: ⚠ plan-template.md, tasks-template.md (review task categories)
-->

# BGS E-Learning Constitution

## Purpose

ระบบนี้ออกแบบเพื่อเป็น Learning + Data Platform สำหรับเจ้าหน้าที่ รพ.สต. ระดับประเทศ

---

## I. Simplicity & Modularity

ระบบต้องแบ่งเป็น module อิสระ: auth, course, progress, certificate, analytics
แต่ละ module ต้องสามารถพัฒนา ทดสอบ และ deploy ได้แยกกัน

---

## II. Backend as Source of Truth

Backend เป็นเจ้าของข้อมูลทั้งหมด ห้าม store ข้อมูลสำคัญใน LocalStorage หรือ frontend state
ทุก business logic MUST อยู่ใน backend (service layer) เท่านั้น

---

## III. Code Quality (NON-NEGOTIABLE)

Code MUST แบ่งเป็น 3 layers: controller → service → repository
ห้าม duplicate logic — MUST สร้าง reusable function/component ทุกครั้งที่ใช้ซ้ำ >= 2 ครั้ง
Business logic MUST centralize ใน service layer ห้ามกระจายใน controller หรือ UI
ห้าม hardcode ค่าที่เปลี่ยนได้ใน frontend

---

## IV. TDD Testing Standards (NON-NEGOTIABLE)

ทุก feature MUST เขียน test ก่อน implement (Red → Green → Refactor)
Unit tests MUST cover: service layer ทั้งหมด, repository queries หลัก
Integration tests MUST cover: API endpoints ทุกตัว, auth flow, E2E ด้วย Playwright
Video progress (>=80% rule) และ certificate generation MUST มี dedicated tests
ห้าม push code ที่ทำให้ existing tests fail

---

## V. User Experience Consistency

UI component ที่ใช้บ่อยต้องสร้างเป็น shared component (Button, Card, Modal, Form, Table)
ทุกหน้า MUST ใช้ design system เดียวกัน (Tailwind config + component library)
Loading state, error state, empty state MUST มีใน component ที่ fetch data ทุกตัว

---

## VI. Performance Requirements

Page load (initial) MUST < 3 วินาที
Video progress save MUST ไม่บล็อก UI (async background)
API response MUST < 500ms สำหรับ read operations
Certificate generation MUST < 10 วินาที

---

## VII. Security

ใช้ JWT authentication — token MUST มี expiry และ refresh mechanism
ไม่เก็บข้อมูลผู้ป่วย (PDPA compliant)
ทุก protected endpoint MUST validate token ใน middleware
Input validation MUST ทำทั้ง frontend และ backend

---

## VIII. Observability

ทุก action สำคัญ (login, progress save, certificate generate, export) MUST มี log
Error MUST log พร้อม context (userId, courseId, timestamp)
ห้าม log ข้อมูลส่วนบุคคลหรือ credentials

---

## IX. Google Sheets Rules

ใช้ได้เฉพาะ reporting/export เท่านั้น — ห้ามใช้เป็น primary database
ถ้า Google Sheets ล้มเหลว MUST ไม่กระทบ core functionality

---

## X. Learning Business Rules

Video >= 80% watched = completed (คำนวณใน backend เท่านั้น)
Course = ทุก video completed = course completed
Certificate MUST generate จาก backend และ MUST มี record ใน DB

---

## Dev Workflow

**Always Commit**: MUST commit ทุก logical unit of work ที่เสร็จ ป้องกัน mistake
Format: `type(scope): description` (feat/fix/test/refactor/docs)
ห้าม commit code ที่ยังไม่ผ่าน tests

**Reuse First**: ก่อนเขียน function/component ใหม่ MUST ค้นหาก่อนว่ามีอยู่แล้วหรือเปล่า

**Use Speckit Skills**: speckit.specify → speckit.plan → speckit.tasks → speckit.implement → speckit.analyze

---

## Anti-Patterns

- No Google Sheets as database
- No hardcode in frontend
- No missing logs on critical operations
- No business logic in controller or UI
- No duplicate code — abstract ก่อนใช้ครั้งที่ 2
- No push without passing tests

---

## Governance

Constitution นี้ supersedes practices อื่นทั้งหมด
Amendment ต้องมี: documentation, team approval, migration plan
ทุก PR MUST verify compliance กับ principles นี้

**Version**: 1.1.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
