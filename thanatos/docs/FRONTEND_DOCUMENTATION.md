# Thanatos Frontend Documentation

## Project Overview
The Thanatos frontend is a Vue.js 3 application built with Vite, designed for a student community platform. It features a modern "Glassmorphism" aesthetic with high responsiveness.

## Tech Stack
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Maps**: Google Maps JS API Loader
- **Icons**: SVG / Lucide-style

## Core Components

### 1. Authentication (Login.vue)
- Supports tabbed Login/Registration.
- Uses `authStore` (Pinia) to persist user data in `localStorage`.
- Features keyboard navigation (`Enter` key support).

### 2. Mental Health (Mentalhealth.vue)
- **Forums**: Dynamic channel selection, post feed, pinning logic.
- **Posts**: Full CRUD with multi-file attachment support.
- **Calendar**: Community event listing with "Interested" tracking.
- **Modals**: Centralized modal system for detail views and creation forms.

### 3. Physical Health (Physicalhealthpage.vue)
- Integration with Google Places API.
- Geolocation-based search for gyms and parks within a 20km radius.

## State Management (Pinia)
The `authStore` handles:
- User sessions and role-based permissions (`ADMIN`, `LESSADMIN`, `USER`).
- Automated redirection on logout.
- Persisted state across reloads.

## Configuration & Environment
- **API URL**: Configured in `.env` via `VITE_API_BASE_URL`.
- **Tunnel Support**: The `api.js` client automatically handles relative paths for Cloudflare Tunnel compatibility.

## Usage
### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
