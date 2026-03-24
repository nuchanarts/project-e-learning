# CLAUDE.md — BGS E-Learning Platform

## Project Overview

E-Learning Platform สำหรับเจ้าหน้าที่ รพ.สต. ระดับประเทศ
Stack: React (Vite + Tailwind) + Node.js (Express) + PostgreSQL

## Key Rules

1. **Backend is Source of Truth** — all logic in service layer
2. **TDD** — write tests BEFORE implementation (Red → Green → Refactor)
3. **Reuse First** — search for existing component/function before creating new
4. **Always Commit** — commit every logical unit of work that is complete
5. **Centralize Business Logic** — service layer only, not in controller or UI

## Speckit Workflow

```
/speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement → /speckit.analyze
```

## Learning Business Rules

- Video >= 80% watched = completed (backend calculation only)
- Course = all videos completed = course completed
- Certificate: backend-generated, stored in DB, never re-generated

## Architecture

```
backend/src/modules/{auth,course,progress,certificate,analytics}/
  controller.ts  ← HTTP layer only
  service.ts     ← ALL business logic here
  repository.ts  ← DB queries only

frontend/src/
  components/    ← shared reusable components
  pages/         ← page-level components
  hooks/         ← shared business hooks
  services/      ← API call functions
```

## Commit Convention

```
feat(scope): description
fix(scope): description
test(scope): description
refactor(scope): description
docs(scope): description
```

## Spec Location

- Constitution: `.specify/memory/constitution.md`
- Active spec: `specs/001-elearning-platform/`
- Tasks: `specs/001-elearning-platform/tasks.md`
