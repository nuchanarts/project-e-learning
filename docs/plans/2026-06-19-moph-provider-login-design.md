# MOPH Provider ID Login — Design

วันที่: 2026-06-19 · Branch: `feat/moph-provider-login` (แตกจาก `main`)

## เป้าหมาย

เพิ่มการเข้าสู่ระบบด้วย **MOPH Provider ID** (OAuth2) สำหรับเจ้าหน้าที่ สธ./รพ.สต.
อ้างอิง pattern จากโปรเจค `fdh-claim-status` และ `atlas-dashboard-UAT` ที่ใช้ MOPH Provider ID
ผ่านตัวกลาง **BMS Auth Proxy**

## การตัดสินใจสำคัญ

- **backend เป็นคนเรียก BMS proxy** (ไม่ใช่ browser) → `app_id` / encryption key อยู่ฝั่ง server เท่านั้น
  (โปรเจคตัวอย่างเรียกจาก browser ทำให้ key โผล่ใน bundle)
- จับคู่ user เก่าด้วย **`providerSub`** (subject จาก MOPH) — เป็น key ที่เสถียร
- จาก token จริง: claim ผู้ใช้ซ้อนอยู่ใน `client.*`
  - **email** = `client.email` (plaintext) → auto-prefill ในฟอร์มได้
  - **name/hospital/position** = จาก `provider_staff` (รองรับหลาย org) + `client.*`
  - stable id = `client.provider_id` (ใช้เป็น `providerSub`; `sub` มี `@hospital_code` ต่อกัน เลยต่างกันต่อ รพ.)
  - **cid** = มาแบบเข้ารหัส/แฮชเท่านั้น (`cid_aes` / `cid_hash` / `cid_encrypt`) — **ไม่มี 13 หลัก plaintext**
    → ต้องให้ผู้ใช้กรอกเอง เว้นแต่ขอ AES key ถอด `cid_aes` จากทีม BMS
  → user ใหม่ยังต้องมีหน้า **complete-profile** (email มักเติมให้แล้ว เหลือ cid ถ้าต้องการ)
- ส่งข้อมูล provider ข้ามหน้าด้วย **registrationToken** (JWT อายุ 10 นาที, เซ็นด้วย `JWT_SECRET`)
  → client ถือได้แต่แก้ไม่ได้ (กันปลอม hcode/สังกัด)

## Flow

```
A) frontend: ปุ่ม "เข้าสู่ระบบด้วย MOPH" → redirect ไป MOPH authorize → กลับมาที่ callback?code=..
B) POST /auth/moph/callback { code }
   backend → bmsProvider.exchangeCode(code) (เข้ารหัส app_id, เรียก BMS proxy)
           → findByProviderSub(sub)
              ├─ เจอ    → ออก JWT → { status:'logged_in', user, accessToken, refreshToken }
              └─ ไม่เจอ → เซ็น registrationToken → { status:'need_profile', registrationToken, prefill }
C) frontend โชว์ฟอร์ม (เฉพาะ need_profile): email(จำเป็น) + cid(ถ้าต้องการ) + เลือก รพ.ถ้าหลาย org
D) POST /auth/moph/complete { registrationToken, email, cid, hcode }
   backend verify token → สร้าง row (passwordHash=null, authProvider='moph', providerSub) → ออก JWT
E) guard: /auth/login ถ้า user.passwordHash == null → 400 ("ใช้ปุ่ม MOPH")
```

## Use cases

| # | สถานการณ์ | ผลลัพธ์ |
|---|---|---|
| UC1 | จนท.ใหม่ login ครั้งแรก | need_profile → กรอก email → สร้าง row → login |
| UC2 | จนท.เก่า (เคย complete) | match providerSub → login ทันที |
| UC3 | MOPH user กด login email/password | 400 → "ใช้ปุ่ม MOPH" |
| UC4 | กรอกฟอร์มเกิน 10 นาที | registrationToken หมดอายุ → 401 → login ใหม่ |
| UC5 | จนท.หลายหน่วยงาน | ฟอร์มให้เลือก รพ. (`hcode`) |
| UC6 | email/cid ที่กรอกชนบัญชีเดิม | v1: 409 error (account-linking ไว้ทำทีหลัง) |

## การเปลี่ยน schema (`User`)

- `passwordHash` — **คงเดิม NOT NULL**; MOPH account เก็บ bcrypt ของรหัส**สุ่ม** (ไม่มีรหัสผ่านจริง)
- `providerSubHash String? @unique @db.VarChar(64)` — **sha256 ของ MOPH provider id** (ไม่เก็บค่าดิบ)
- match user เก่าด้วย `hashProviderSub(provider_id)`; guard กัน password login เมื่อ `providerSubHash != null`

> **Migration บน prod (additive ล้วน ไม่กระทบข้อมูลเดิม):**
> ```sql
> ALTER TABLE `User`
>   ADD COLUMN `providerSubHash` VARCHAR(64) NULL,
>   ADD UNIQUE INDEX `User_providerSubHash_key` (`providerSubHash`);
> ```
> (หรือ `prisma db push` — แต่ ALTER ตรง ๆ ปลอดภัยกว่าบน prod ที่ schema มาจาก SQL import)

## ไฟล์ backend

| ไฟล์ | บทบาท |
|---|---|
| `auth/mophCrypto.ts` | AES-256-CBC encrypt app_id (มี test round-trip) |
| `auth/bmsProvider.ts` | เรียก BMS proxy + map response + decode JWT claims (sub/cid/email) |
| `auth/auth.service.ts` | `loginWithMophCode`, `completeMophRegistration`, guard (มี test) |
| `auth/auth.repository.ts` | `findByProviderSub`, `create` รองรับ provider fields + nullable password |
| `auth/auth.controller.ts` / `auth.routes.ts` | `POST /auth/moph/callback`, `POST /auth/moph/complete` |

## ENV ที่ต้องตั้ง

**backend** (ลับ — server เท่านั้น):
- `MOPH_BMS_AUTH_BASE_URL` — เช่น `https://bms-authen-provider.bmscloud.in.th/api/v1/auth`
- `MOPH_BMS_APP_ID` — app UUID ของแอป e-learning
- `MOPH_BMS_ENCRYPTION_KEY` — AES key 32 ตัวอักษร
- `MOPH_REDIRECT_URI` — `https://e-learning.bmscloud.in.th` (origin เปล่า ไม่มี `/` ท้าย ไม่มี `#`)

> ⚠️ **redirect_uri ต้องตรงกันแบบ byte-match ทั้ง 3 ที่:** (1) ที่ลงทะเบียนกับ MOPH/BMS
> (2) ที่ frontend ใส่ใน authorize URL (`window.location.origin`) (3) backend `MOPH_REDIRECT_URI`
> — MOPH เด้ง `?code` กลับมาที่ origin root แล้ว `MophCallbackWatcher` พาเข้า `#/dashboard` หรือ `#/auth/moph/complete` เอง

**frontend** (public ได้):
- `VITE_MOPH_URL` — เช่น `https://moph.id.th`
- `VITE_MOPH_CLIENT_ID` — client_id ของแอป e-learning

> ⚠️ ต้อง **ขอ client_id / app_id / encryption_key ของแอป e-learning เราเองจากทีม BMS** ก่อนใช้งานจริง
> (โค้ด + test เสร็จแล้ว รอแค่เอา key มาใส่ env)

## สถานะ

- [x] schema + prisma generate
- [x] service layer + tests (17 tests ผ่าน)
- [x] repository / controller / routes
- [x] bmsProvider + mophCrypto adapters
- [ ] frontend (ปุ่ม MOPH, หน้า callback, หน้า complete-profile)
- [ ] `prisma db push` ขึ้น DB จริง
- [ ] ใส่ค่า ENV จริงจากทีม BMS
- [ ] ทดสอบ end-to-end กับ MOPH UAT
```
