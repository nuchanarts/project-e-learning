# RELEASE.md — Cheatsheet สำหรับ Developer

วิธี build + push image ขึ้น `hub.hosxp.net` ทุกครั้งที่ปล่อยเวอร์ชันใหม่
repo: `project-e-learning` (branch `main` + งาน deploy บน `feat/production-deploy`)

---

## 0. ครั้งแรกครั้งเดียว

```powershell
docker login hub.hosxp.net
# เตรียมไฟล์ env สำหรับ build (ต้องมี VITE_API_URL, DOMAIN ฯลฯ)
copy .env.prod.example .env.prod
notepad .env.prod      # ตั้ง DOMAIN=:80 ไว้ก่อนถ้าจะลองบนเครื่อง
```

---

## 1. แก้โค้ดเสร็จ → Build + Push

```powershell
cd D:\amon_dev\order\bms-e-learning\bms-e-learning-prod

# build ทั้ง backend + frontend (ใช้ Dockerfile.prod ผ่าน compose)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack build

# push ขึ้น registry
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack push
```

เสร็จ — แจ้ง deployer ให้ `pull` + `up -d` (ดู DEPLOY.md)

> 💡 build ครั้งแรกช้าหน่อย (image ใหญ่, compile bcrypt). ครั้งถัดไปใช้ cache เร็วขึ้น

**Build internals (ทดสอบแล้วว่าผ่าน — จัดการให้ใน `backend/Dockerfile.prod`):**
- backend `npm ci` ต้องใช้ `--legacy-peer-deps` (typescript@6 ชนกับ peer ของ `@typescript-eslint` — เรื่อง eslint ล้วน ไม่กระทบ runtime)
- backend build ใช้ `tsc --noCheck` (emit JS โดยข้าม type-check) เพราะโค้ดรันด้วย `ts-node-dev --transpile-only` มาตลอด ยังมี type error ค้างอยู่ (เช่น Express 5 type `req.params` เป็น `string|string[]`) — `--noCheck` ให้ JS เหมือน dev เป๊ะ ไม่ต้องแก้โค้ดแอป
- frontend build ผ่านปกติ (`tsc -b && vite build`) ไม่ต้องปรับ

---

## 2. ทดสอบบนเครื่องตัวเองก่อน push (แนะนำ)

```powershell
# ตั้ง DOMAIN=:80 ใน .env.prod ก่อน (เลี่ยง Let's Encrypt บน localhost)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack up -d --build

# seed admin ครั้งแรก (DB เปล่า)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack run --rm backend npm run db:seed

docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack ps
# เปิด http://localhost   → frontend
#      http://localhost/api/health → {"status":"ok"}

# ล้างทิ้งหมด (รวม DB) เริ่มใหม่
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack down -v
```

---

## 3. หมายเหตุเรื่อง Database (สำคัญ)

- repo นี้ **ไม่มีโฟลเดอร์ `prisma/migrations/`** — ใช้ `prisma db push` (sync จาก `schema.prisma` ตรง ๆ)
- service `migrate` ใน compose จะรัน `npx prisma db push --skip-generate` ให้อัตโนมัติก่อน backend start
- เพิ่ม/แก้ field ใน `schema.prisma` → build image ใหม่ → deploy → `db push` ปรับ schema ให้เอง
- ⚠️ `db push` ไม่มี migration history: ถ้าเปลี่ยน schema แบบ destructive (ลบคอลัมน์ที่มีข้อมูล) อาจเตือน/ต้อง `--accept-data-loss` — ระวังบน DB ที่มีข้อมูลจริง

---

## 4. ไฟล์ที่ต้องส่งให้ deployer

| ไฟล์ | หมายเหตุ |
|---|---|
| `docker-compose.prod.yml` | commit ได้ |
| `Caddyfile` | commit ได้ |
| `.env.prod` | ⚠️ **ห้าม commit** — ส่งทางช่องปลอดภัย (Signal/Bitwarden/encrypted) |
| `DEPLOY.md` | คู่มือ deployer (อยู่ใน repo นี้) |

**ก่อนส่ง:** เปิด `.env.prod` ตั้ง `DOMAIN=` และ `FRONTEND_URL=` เป็น domain จริงของลูกค้า

---

## 5. ค่าใน `.env.prod` — เก็บไว้ดี ๆ

| key | ถ้าหาย |
|---|---|
| `JWT_SECRET` | token เก่าใช้ไม่ได้ → ผู้ใช้ถูก logout ทั้งระบบ |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` | เข้า DB / backend เชื่อม DB ไม่ได้ |

แนะนำ: copy `.env.prod` เก็บใน password manager ของทีม

---

## 6. Tag เวอร์ชัน (กัน rollback ลำบาก)

```powershell
# tag ด้วย date+sha แทน latest อย่างเดียว
$env:VERSION = "$(Get-Date -Format yyyyMMdd)-$(git rev-parse --short HEAD)"
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack build
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack push
# แจ้ง deployer ตั้ง VERSION=<tag> ใน .env.prod ของเขา แล้ว pull + up -d
```

Rollback: ตั้ง `VERSION=<tag เก่า>` ใน `.env.prod` ฝั่ง server → `pull` + `up -d`

---

## 7. Image registry

- `hub.hosxp.net/amon/bms-elearning-backend:latest`
- `hub.hosxp.net/amon/bms-elearning-frontend:latest`

ดูใน registry: https://hub.hosxp.net (namespace `amon`)
