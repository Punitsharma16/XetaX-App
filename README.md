# XetaX CRM Mobile (React Native / Expo SDK 57, JavaScript)

Android/iOS companion app for **XetaX CRM**. It talks to the **same Spring Boot backend** as the
web panel (`https://api.xetacrm.pro/`) with the same login, roles and data — nothing in the backend
or the Angular panel was changed for it. All source is plain JS/JSX (no TypeScript).

## Run on your phone (Expo Go)
```bash
cd xetax-mobile
npm install --legacy-peer-deps     # first time only
npx expo start                     # scan the QR with Expo Go (phone + laptop on the same Wi-Fi)
```
If the phone can't reach the laptop, use `npx expo start --tunnel`.

Server: production by default. On the login screen tap **Server** to switch to local
(`http://10.0.2.2:8085/` for the Android emulator; edit `src/lib/config.js` for a LAN IP).

APK / AAB build steps: see [BUILD.md](BUILD.md).

## Screens ↔ backend
| Screen | Backend |
|---|---|
| Login / Register / Verify email (OTP) / Forgot password | `auth/v1/login`, `auth/api/v1/users/register`, `auth/v1/verify-email/send|confirm`, `auth/v1/forgot-password`, `auth/v1/refresh` (silent token refresh on 401) |
| Home — record/contact/task counts, pipeline stage bars, desk badge | `dashboard`, `stage/forms/{id}/stages`, `desk/badge` |
| Records — forms list → records per form (search, stage filter, pull to refresh, infinite scroll) | `api/forms`, `{slug}/all`, `{slug}/search` |
| Record detail — call/WhatsApp/email, move stage, linked tasks, activity timeline, delete | `{slug}/{id}`, `{slug}/stage/{id}`, `{slug}/activity`, `{slug}/delete` |
| Record create / edit with the form's dynamic fields | `api/fields/{formId}`, `{slug}/save`, `{slug}/update` |
| Inbox — WhatsApp conversations + chat thread (24h window, templates), Desk requests (accept/decline, reply, AI suggestion, resolve) | `whatsapp/*`, `desk/*` |
| Tasks (filter, mark done, new task linked to a record) | `tasks/*` |
| AI assistant (chat over your CRM data) | `ai/chat` |
| More — Contacts, Invoices + detail, Team (add member), Notifications, Profile, sign out | `contacts`, `invoices`, `team`, `notifications`, `auth/v1/logoutRefreshToken` |

Not on mobile (use the web panel): form/stage design, automations, WhatsApp setup, billing.

## Structure
```
src/app/         expo-router screens: (auth)/*, (tabs)/{index,records,inbox,tasks,more}, record/*, records/[slug], chat/[id], desk/[id], invoice/[id], task/new, ai, contacts, invoices, team, notifications, profile
src/services/    one API wrapper per area (index.js)
src/lib/         api.js (fetch + Bearer + envelope unwrap + refresh), storage.js, config.js, hooks.js
src/state/       auth provider (auth.jsx), toast provider
src/features/    fields.jsx — renders/edits a record field by its FieldType
src/ui/          shared components (index.jsx) + theme tokens (theme.js)
```
