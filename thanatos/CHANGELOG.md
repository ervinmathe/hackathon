# Thanatos Frontend (Vue) - Changelog

## [v1.1.0] - 2026-04-17 (Current Hackathon Session)

### Added
- **Post CRUD**: Complete Create, Read, Update, and Delete functionality for forum posts.
- **Multi-file Upload**: Support for attaching multiple files (PDFs, images) to posts with individual removal.
- **Event Proposer**: New modal with separate Date/Time pickers and Location support for community events.
- **Social Interaction**: Implemented "Interested" toggle with real-time counters for events.
- **Role Visibility**: Added role-badges to the navbar to clearly show current permissions (`ADMIN`, `USER`).
- **Global Navigation**: Moved "Sign Out" to the main navbar for accessibility from any page.
- **Keyboard UX**: Added "Enter to next field" navigation in Login and Register forms.

### Fixed
- **UI Restoration**: Restored the "Design 1" (Glassmorphism) aesthetic after template corruption.
- **Tunnel Support**: Fixed `baseURL` logic in `api.js` to automatically handle Cloudflare Tunnels.
- **Post Detail**: Fixed broken `openPost` function to correctly show comments and attachments.
- **Form Validation**: Prevented creation of empty posts/events and added time-interval validation.

### Changed
- **Auth Store**: Updated Pinia store to handle redirection to root (`/`) on logout.
- **Component Structure**: Optimized `Mentalhealth.vue` for better modal management and state handling.
