# API Contract: Courses Module

## GET /courses

**Headers**: `Authorization: Bearer <token>`

**Response 200**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "ชื่อคอร์ส",
      "description": "คำอธิบาย",
      "videoCount": 5,
      "userProgress": { "completedVideos": 2, "percent": 40 }
    }
  ]
}
```

---

## GET /courses/:id

**Response 200**
```json
{
  "id": "uuid",
  "title": "ชื่อคอร์ส",
  "description": "...",
  "videos": [
    {
      "id": "uuid",
      "title": "บทที่ 1",
      "url": "https://...",
      "duration": 600,
      "order": 1,
      "progress": { "percent": 85, "completed": true }
    }
  ],
  "isCompleted": false
}
```

**Errors**: 404 (not found), 401 (unauthorized)

---

## POST /courses (Admin only)

**Request**
```json
{
  "title": "ชื่อคอร์ส",
  "description": "คำอธิบาย",
  "videos": [
    { "title": "บทที่ 1", "url": "https://...", "duration": 600, "order": 1 }
  ]
}
```

**Response 201**
```json
{ "id": "uuid", "title": "...", "videoCount": 1 }
```
