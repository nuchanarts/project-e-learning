# Feature Specification: E-Learning Platform for รพ.สต.

**Feature Branch**: `001-elearning-platform`
**Created**: 2026-03-24
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration & Login (Priority: P1)

เจ้าหน้าที่ รพ.สต. สมัครสมาชิกและเข้าสู่ระบบเพื่อเข้าถึงคอร์สเรียนได้

**Why this priority**: Authentication คือประตูของทั้งระบบ ต้องมีก่อนทุก feature

**Independent Test**: สมัครสมาชิก → login → เห็น dashboard → logout สำเร็จ

**Acceptance Scenarios**:

1. **Given** ผู้ใช้ใหม่, **When** กรอก email/password และสมัคร, **Then** ระบบสร้างบัญชีและเข้า dashboard
2. **Given** ผู้ใช้มีบัญชีแล้ว, **When** กรอก credential ถูกต้อง, **Then** เข้าสู่ระบบสำเร็จ
3. **Given** password ผิด, **When** กด login, **Then** แสดง error message ชัดเจน
4. **Given** session หมดอายุ, **When** เข้าหน้าที่ต้อง auth, **Then** redirect ไปหน้า login

---

### User Story 2 - ดูและเรียนคอร์ส (Priority: P1)

ผู้ใช้เข้าถึงรายการคอร์ส เลือกคอร์ส และดูวิดีโอบทเรียนได้ โดยระบบบันทึก progress

**Why this priority**: Core value ของแพลตฟอร์ม

**Independent Test**: login → เลือกคอร์ส → ดูวิดีโอ → progress ถูกบันทึก → reload ยัง progress ถูก

**Acceptance Scenarios**:

1. **Given** ผู้ใช้ login, **When** เข้าหน้า courses, **Then** เห็นรายการคอร์สทั้งหมดที่เปิดใช้งาน
2. **Given** ผู้ใช้ดูวิดีโอถึง 80% ขึ้นไป, **When** จบหรือ pause, **Then** ระบบ mark วิดีโอนั้นว่า completed
3. **Given** ผู้ใช้ดูวิดีโอไม่ถึง 80%, **When** ออกจากหน้า, **Then** ระบบบันทึก progress ณ จุดนั้นไว้
4. **Given** ผู้ใช้ผ่านทุกวิดีโอในคอร์ส, **Then** ระบบ mark คอร์สนั้นว่า completed อัตโนมัติ

---

### User Story 3 - ดู Dashboard & Personal Progress (Priority: P2)

ผู้ใช้เห็นสถานะการเรียนของตัวเองในภาพรวม

**Why this priority**: ช่วย motivation และ self-tracking

**Independent Test**: login → เข้า dashboard → เห็น % completion แต่ละคอร์ส

**Acceptance Scenarios**:

1. **Given** ผู้ใช้มีคอร์สที่กำลังเรียน, **When** เข้า dashboard, **Then** เห็น progress แต่ละคอร์สเป็น %
2. **Given** ผู้ใช้จบบางคอร์ส, **When** เข้า dashboard, **Then** แยกชัดเจน กำลังเรียน vs เรียนจบ

---

### User Story 4 - รับและดาวน์โหลด Certificate (Priority: P2)

ผู้ใช้ที่เรียนจบคอร์สรับ certificate ได้

**Why this priority**: เพิ่ม motivation และเป็น proof of completion

**Independent Test**: เรียนจบคอร์ส → กดรับใบประกาศ → ดาวน์โหลด PDF ได้

**Acceptance Scenarios**:

1. **Given** ผู้ใช้จบคอร์ส, **When** เข้าหน้าคอร์สนั้น, **Then** เห็นปุ่มรับใบประกาศนียบัตร
2. **Given** กดรับ certificate, **Then** ดาวน์โหลด PDF ที่มีชื่อผู้ใช้และชื่อคอร์สถูกต้อง
3. **Given** ยังเรียนไม่จบ, **When** พยายามเข้า certificate URL, **Then** ระบบปฏิเสธ

---

### User Story 5 - Admin จัดการคอร์สและดู Analytics (Priority: P3)

Admin เพิ่ม/แก้ไข/ลบคอร์ส วิดีโอ และดูข้อมูล KPI ได้

**Why this priority**: จำเป็นสำหรับดูแลระบบระยะยาว แต่ไม่ block MVP

**Independent Test**: Admin login → เพิ่มคอร์สใหม่ → ผู้ใช้ทั่วไปเห็นคอร์สนั้น

**Acceptance Scenarios**:

1. **Given** Admin login, **When** เพิ่มคอร์สใหม่พร้อมวิดีโอ, **Then** ผู้ใช้ทั่วไปเห็นทันที
2. **Given** Admin เข้า analytics, **Then** เห็น Users count, Completion rate, Learning time

---

### User Story 6 - Export รายงานไปยัง Google Sheets (Priority: P3)

Admin export ข้อมูล KPI ออกไปยัง Google Sheets

**Why this priority**: Reporting เท่านั้น ไม่กระทบ core function

**Acceptance Scenarios**:

1. **Given** Admin กด export, **Then** ข้อมูลปรากฏใน Google Sheets ที่กำหนด
2. **Given** Google Sheets ไม่พร้อม, **Then** แจ้ง error แต่ข้อมูลหลักปลอดภัย

---

### Edge Cases

- ผู้ใช้ปิดหน้าต่างระหว่างดูวิดีโอ → บันทึก progress ณ จุดสุดท้ายที่ ping ได้
- วิดีโอโหลดไม่ได้ → แสดง error + retry ไม่นับ progress
- Certificate ถูก request ซ้ำ → ส่งไฟล์เดิมกลับ ไม่สร้างใหม่
- Admin ลบวิดีโอที่ผู้ใช้กำลังดูอยู่ → แสดง error ที่ user-friendly

---

## Requirements *(mandatory)*

### Functional Requirements

**Auth**
- **FR-001**: ระบบต้องรองรับสมัครสมาชิกด้วย email + password
- **FR-002**: ระบบต้องรองรับ login/logout และ session refresh อัตโนมัติ
- **FR-003**: ระบบต้องแยก role: `user` และ `admin`

**Course**
- **FR-004**: ระบบต้องแสดงรายการคอร์สที่เปิดใช้งาน
- **FR-005**: แต่ละคอร์สต้องมีวิดีโอ >= 1 รายการ เรียงตามลำดับ

**Progress**
- **FR-006**: ระบบต้องบันทึก % progress ของ video แต่ละรายการต่อ user ใน database
- **FR-007**: Video ที่ดูครบ >= 80% ต้อง mark เป็น completed (คำนวณใน backend)
- **FR-008**: Course ที่ video ทุกรายการ completed ต้อง mark course เป็น completed

**Certificate**
- **FR-009**: ระบบต้องสร้าง certificate เฉพาะเมื่อ course completed
- **FR-010**: Certificate ต้องมี: ชื่อผู้ใช้, ชื่อคอร์ส, วันที่จบ
- **FR-011**: Certificate ต้องบันทึกใน DB ไม่ generate ใหม่ทุกครั้ง

**Analytics**
- **FR-012**: Admin เห็น KPI: จำนวน users, completion rate, learning time
- **FR-013**: ระบบต้อง export KPI ไปยัง Google Sheets ได้
- **FR-014**: Google Sheets ใช้สำหรับ reporting เท่านั้น

### Key Entities

- **User**: ผู้ใช้งาน มี role (admin/user), email, password hash
- **Course**: คอร์สเรียน มีชื่อ คำอธิบาย สถานะเปิด/ปิด
- **Video**: วิดีโอในคอร์ส มีลำดับ ความยาว (วินาที) URL
- **Progress**: บันทึกว่า User ดู Video ถึง % เท่าไร และ completed หรือยัง
- **Certificate**: หลักฐานการจบคอร์ส มี User + Course + วันที่

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: สมัครสมาชิกและ login ได้ภายใน 2 นาที
- **SC-002**: ระบบบันทึก video progress แม่นยำ ± 5%
- **SC-003**: Video >= 80% ได้ completed ทุกครั้ง (0% error)
- **SC-004**: Certificate สร้างและดาวน์โหลดได้ภายใน 10 วินาที
- **SC-005**: Admin export ไปยัง Google Sheets ได้ภายใน 30 วินาที
- **SC-006**: ระบบรองรับผู้ใช้พร้อมกัน >= 200 คน โดยไม่สูญหาย progress data

---

## Assumptions

- ผู้ใช้หลักคือเจ้าหน้าที่ รพ.สต. มีความรู้ใช้เว็บพื้นฐาน
- วิดีโอ host บน external service (YouTube/S3) ไม่ host เอง
- ไม่เก็บข้อมูลผู้ป่วย (PDPA compliant)
- Multi-session allowed
- Admin จัดการผ่าน admin panel
