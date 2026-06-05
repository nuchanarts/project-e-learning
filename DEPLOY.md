# DEPLOY.md — คู่มือสำหรับ Deployer

ระบบ: **BMS E-Learning Platform** (เวอร์ชัน `main` — production)
รูปแบบ: pull docker image จาก `hub.hosxp.net` มา run หลัง Caddy (auto-TLS)

> ⚠️ **อ่านก่อน:** deployment ชุดก่อนหน้านี้ถูก build จาก branch เก่า (`001`) ที่มีแค่ 5 ตาราง
> เวอร์ชันนี้มาจาก `main` ซึ่งมี **17 ตาราง** และ schema คนละชุดกัน — **ต้องล้าง DB เก่าทิ้งก่อน**
> (ดูข้อ 3) ไม่งั้นจะ migrate ทับไม่ได้. domain / server / ใบ TLS เดิม **ใช้ต่อได้ตามเดิม**.

---

## 1. สิ่งที่ได้รับ

วางทั้งหมดในโฟลเดอร์เดียวกันบน server:

| ไฟล์ | หน้าที่ |
|---|---|
| `docker-compose.prod.yml` | นิยาม service ทั้งหมด |
| `Caddyfile` | reverse proxy + TLS |
| `.env.prod` | secret + config (⚠️ ห้ามแชร์ต่อ / ห้าม commit) |

---

## 2. Prerequisites บน server

- [ ] Docker Engine 24+ และ Docker Compose v2
- [ ] สิทธิ์ `pull` บน `hub.hosxp.net` (repo `amon/bms-elearning-backend`, `amon/bms-elearning-frontend`)
- [ ] **DNS A record** ของ domain ชี้มาที่ IP ของ server (ทำก่อน start Caddy ไม่งั้น Let's Encrypt fail)
- [ ] Firewall เปิด port **80** และ **443**

---

## 3. ⚠️ ถ้าเคย deploy เวอร์ชันเก่า (branch 001) ไว้บน server นี้ — ล้างก่อน

```bash
cd /path/to/old-bms-elearning      # โฟลเดอร์ของชุดเก่า

# หยุด + ลบ container และ "ลบ DB volume เก่า" (schema 5 ตารางของเก่า)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack down -v
```

- `-v` จะลบ volume `mysql_data` เก่า → schema เก่าหายหมด (ตามที่ตกลงว่าล้างได้)
- ใบ Let's Encrypt ของ Caddy (`caddy_data`) จะถูกลบด้วยถ้าใช้โฟลเดอร์เดิม — ไม่เป็นไร Caddy ขอใหม่ให้เอง
- **ถ้าไม่เคย deploy บน server นี้** ข้ามข้อนี้ได้เลย

---

## 4. Deploy เวอร์ชันใหม่ (main)

```bash
# 4.1 เข้าโฟลเดอร์ที่มี 3 ไฟล์ (docker-compose.prod.yml, Caddyfile, .env.prod)
cd /path/to/bms-elearning

# 4.2 แก้ .env.prod — อย่างน้อยต้องตั้ง DOMAIN เป็นโดเมนจริง
nano .env.prod
#   DOMAIN=elearning.yourdomain.com    ← โดเมนจริง
#   FRONTEND_URL=https://elearning.yourdomain.com
# (JWT_SECRET / MYSQL_PASSWORD ถ้าใช้ค่าที่ dev ส่งมาก็ไม่ต้องแตะ)

# 4.3 login registry (ครั้งเดียวต่อ server)
docker login hub.hosxp.net

# 4.4 pull image
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack pull

# 4.5 start ทุก service
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack up -d
```

**ลำดับที่เกิดขึ้นอัตโนมัติ:**
1. `mysql` สร้าง database + user
2. `migrate` รัน `prisma db push` → สร้างตาราง **17 ตาราง** จาก schema
3. `backend` start (เช็ค `/health`)
4. `frontend` (nginx) serve SPA
5. `caddy` ขอ Let's Encrypt cert + เปิด domain

ใช้เวลารวม ~40-90 วินาที (ครั้งแรก mysql init นานหน่อย)

---

## 5. สร้างบัญชี Admin ครั้งแรก (แนะนำ — ทำครั้งเดียว)

DB ที่ล้างใหม่จะ **ว่างเปล่า ยังไม่มี user** → ต้อง seed บัญชี admin เพื่อเข้าระบบครั้งแรก:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack \
  run --rm backend npm run db:seed
```

> สร้าง admin: **`admin@bgs.local` / `admin1234`**
> 🔒 **ล็อกอินครั้งแรกแล้วเปลี่ยนรหัสทันที** (seed ไว้สำหรับ bootstrap เท่านั้น)

---

## 6. เช็คว่ารันสำเร็จ

```bash
# รอจน backend/frontend/mysql ขึ้น (healthy)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack ps

# ดู log realtime (Ctrl+C ออกได้ ไม่ปิด container)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack logs -f

# เปิด browser
#   https://<domain>          ← frontend
#   https://<domain>/api/health ← ควรได้ {"status":"ok"}
```

---

## 7. Deploy เวอร์ชันถัดไป (เมื่อ dev แจ้งว่ามี image ใหม่)

```bash
cd /path/to/bms-elearning
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack pull
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack up -d
```

- container ถูก recreate ด้วย image ใหม่อัตโนมัติ
- **MySQL data คงอยู่** (อยู่ใน volume `mysql_data`) — ไม่ต้อง `-v`
- `migrate` รัน `prisma db push` ใหม่ ปรับ schema ให้ตรง schema ล่าสุดอัตโนมัติก่อน backend start

---

## 8. คำสั่งที่ใช้บ่อย

```bash
# หยุดทุก service (data คงอยู่)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack down

# restart แค่ backend (เช่นแก้ env)
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack restart backend

# เข้า shell backend
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack exec backend sh

# เข้า MySQL CLI
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack exec mysql mysql -u bms_user -p bms_elearning
```

---

## 9. ⚠️ ข้อห้ามสำคัญ

| ❌ ห้ามทำ (หลัง go-live) | เหตุผล |
|---|---|
| `docker compose ... down -v` | `-v` ลบ volume → **ข้อมูลผู้ใช้/คอร์ส/ใบประกาศหายหมด** (ใช้ `-v` ได้เฉพาะตอนล้างของเก่าในข้อ 3) |
| `docker volume rm bms-elearning-prod_mysql_data` | ผลเหมือนข้างบน |
| commit / แชร์ `.env.prod` | มี secret (JWT, password) |
| แก้ `Caddyfile` แล้วลืม restart caddy | การเปลี่ยนแปลงไม่มีผลจน restart |

---

## 10. Backup database (แนะนำตั้ง cron)

```bash
# ทุกวัน 02:00
0 2 * * * docker compose --env-file /path/to/.env.prod -f /path/to/docker-compose.prod.yml --profile full-stack exec -T mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" bms_elearning' > /backups/bms-$(date +\%Y\%m\%d).sql
```

restore:
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile full-stack exec -T mysql sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" bms_elearning' < /backups/bms-YYYYMMDD.sql
```

---

## 11. Troubleshooting

| อาการ | สาเหตุที่น่าจะเป็น | วิธีแก้ |
|---|---|---|
| `pull` ขึ้น `unauthorized` | ยังไม่ login / ไม่มีสิทธิ์ | `docker login hub.hosxp.net` หรือขอ admin เปิดสิทธิ์ |
| Caddy ขอ cert ไม่ได้ | DNS ยังไม่ propagate / port 80 ปิด | `dig <domain>` + เช็ค firewall port 80 |
| backend ไม่ขึ้น (unhealthy) | DB ยังไม่พร้อม / migrate fail | `docker compose logs migrate backend` |
| `migrate` exit != 0 | schema เก่าค้างใน DB | ยืนยันว่าทำข้อ 3 (`down -v`) แล้ว ล้าง DB เก่าจริง |
| ล็อกอินไม่ได้เลย (DB ว่าง) | ยังไม่ได้ seed | ทำข้อ 5 |
| Port 80 ใช้ไม่ได้ | มี nginx/apache อื่นใช้อยู่ | ปิด service เดิม หรือเปลี่ยน `HTTP_PORT` ใน `.env.prod` |

---

## 12. ติดต่อ

ปัญหา deploy → ทักหา developer (ผู้ส่งไฟล์ชุดนี้)

**Image registry:**
- `hub.hosxp.net/amon/bms-elearning-backend:latest`
- `hub.hosxp.net/amon/bms-elearning-frontend:latest`
