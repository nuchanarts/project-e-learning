# API Contract: Certificates Module

## GET /certificates/:courseId

ดาวน์โหลด certificate สำหรับ course ที่จบแล้ว

**Headers**: `Authorization: Bearer <token>`

**Response 200**: PDF file (Content-Type: application/pdf)

**Errors**:
- 403: course ยังไม่จบ
- 404: course not found
- 401: unauthorized

---

## GET /certificates

รายการ certificate ทั้งหมดของ user

**Response 200**
```json
{
  "certificates": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "courseTitle": "ชื่อคอร์ส",
      "issuedAt": "2026-03-24T00:00:00Z"
    }
  ]
}
```
