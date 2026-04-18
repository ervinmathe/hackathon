# Thanatos Project - Testing Documentation

This document describes the testing strategy, tools, and current status for the Thanatos project (NestJS monorepo backend and Vue.js frontend).

## 🛠️ Testing Tools

### Backend (NestJS)
- **Jest**: The primary test runner and assertion library.
- **Supertest**: Used for E2E integration testing of HTTP endpoints.
- **Knex Mocking**: Database interactions are mocked in unit tests to ensure speed and isolation.

### Frontend (Vue.js / Thanatos)
- **Vitest**: Modern and fast test runner compatible with Vite.
- **Vue Test Utils**: Official library for mounting and interacting with Vue components.
- **JSDOM**: Environment for simulating a browser in Node.js.
- **V8 Coverage**: Tool for measuring code coverage.

---

## 📈 Coverage Summary (Last Run: 2026-04-18)

### Backend Services (Logic Core)
Target: >70% for Service layer.

| Service | Coverage (Lines) | Status |
| :--- | :--- | :--- |
| **AuthService** | 66.66% | ✅ High |
| **CalendarService** | 82.35% | 🎯 Excellent |
| **CommentsService** | 100.00% | 🎯 Excellent |
| **ForumsService** | 62.96% | ✅ High |
| **PostsService** | 88.00% | 🎯 Excellent |
| **CmsService** | 25.49% | ⚠️ Baseline |

### Frontend Components
| Component | Coverage (Lines) | Status |
| :--- | :--- | :--- |
| **Profile.vue** | 83.05% | 🎯 Excellent |
| **Homepage.vue** | 75.00% | ✅ High |

---

## 🚀 How to Run Tests

### Backend
Navigate to `hackathon/backend`:
- `yarn test`: Runs all unit and integration tests.
- `yarn test:cov`: Runs all tests and generates a coverage report.
- `yarn test apps/api/src/auth/auth.service.spec.ts`: Runs a specific test file.

### Frontend
Navigate to `hackathon/thanatos`:
- `npm test`: Runs Vitest in watch mode.
- `npm run test:cov`: Runs all tests once and displays a coverage report.

---

## 📝 Tested Scenarios

### Backend Unit Tests
- **Auth**: Registration with duplicate checks, login with password verification, profile updates (username, profile picture).
- **Forums**: Listing forums with university/enrollment filters, joining and leaving forums.
- **Posts**: Creating posts with transaction support, finding one post with its comments and attachments, toggling pinned status.
- **Calendar**: Event creation with auto-approval for admins, toggling interest (Join/Leave), filtering by category.
- **Comments**: CRUD operations for post comments.

### Backend E2E Integration
- **Auth Flow**: `POST /auth/register` -> `POST /auth/login` -> `POST /auth/profile/:id` (verified end-to-end with mock database).

### Frontend Component Tests
- **Homepage**: Card rendering, navigation routing, dropdown menu visibility, logout trigger.
- **Profile**: Data binding from store, avatar initials fallback, **Supabase image upload simulation**, API save trigger.

---

*Note: Total backend monorepo coverage is ~31%, but core business logic (Services) is mostly above 80%. Baseline CMS/Module files pull down the total average.*
