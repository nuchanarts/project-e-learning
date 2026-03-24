# API Contract: Progress Module

## POST /progress

บันทึก video progress (เรียกแบบ async ทุก 5 วินาที และเมื่อ pause/end)

**Headers**: `Authorization: Bearer <token>`

**Request**
```json
{
  "videoId": "uuid",
  "courseId": "uuid",
  "percent": 45.5
}
```

**Response 200**
```json
{
  "videoId": "uuid",
  "percent": 45.5,
  "completed": false,
  "courseCompleted": false
}
```

**Notes**:
- `completed = true` เมื่อ `percent >= 80`
- `courseCompleted = true` เมื่อทุก video ใน course completed

---

## GET /progress/:courseId

**Response 200**
```json
{
  "courseId": "uuid",
  "isCompleted": false,
  "completionPercent": 40,
  "videos": [
    { "videoId": "uuid", "percent": 100, "completed": true },
    { "videoId": "uuid", "percent": 45, "completed": false }
  ]
}
```
