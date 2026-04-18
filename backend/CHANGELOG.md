# Thanatos Backend - Changelog

## [v1.1.0] - 2026-04-17 (Current Hackathon Session)

### Added
- **Calendar Interests**: Created `event_interests` table to track student participation.
- **Location Support**: Added `location` field to `calendar_events` table and API.
- **Admin Moderation**: Added endpoints for Admins to approve/delete events via CMS.
- **Auth Flexibility**: Login now supports both `email` and `username` as identifiers.
- **Security**: Added dynamic CORS policy to support Cloudflare Tunnels (`trycloudflare.com`).

### Fixed
- **CORS Issues**: Resolved origin mismatch for Cloudflare tunnel users.
- **Broken Paths**: Fixed 404 errors for `/auth/logout` and `/calendar/:id/interest`.
- **CMS Logic**: Fixed function scoping and variable naming (`events` vs `calendar`) in EJS templates.

### Changed
- **Migrations**: Updated schema to v8 with interest tracking and location support.
- **Auth Response**: Login now returns full user metadata for frontend storage.
