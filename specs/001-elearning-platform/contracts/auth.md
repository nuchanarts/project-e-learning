# API Contract: Auth Module

## POST /auth/register

**Request**
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "ชื่อผู้ใช้"
}
```

**Response 201**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "USER" },
  "accessToken": "JWT",
  "refreshToken": "JWT"
}
```

**Errors**: 400 (validation), 409 (email exists)

---

## POST /auth/login

**Request**
```json
{ "email": "...", "password": "..." }
```

**Response 200**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "USER" },
  "accessToken": "JWT",
  "refreshToken": "JWT"
}
```

**Errors**: 400 (validation), 401 (invalid credentials)

---

## POST /auth/refresh

**Request**
```json
{ "refreshToken": "JWT" }
```

**Response 200**
```json
{ "accessToken": "JWT", "refreshToken": "JWT" }
```

**Errors**: 401 (invalid/expired token)

---

## POST /auth/logout

**Headers**: `Authorization: Bearer <token>`

**Response 200**
```json
{ "message": "Logged out successfully" }
```
