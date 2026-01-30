# Integrations Roadmap

This document describes integrations that are **planned** or **partially implemented** in Keep Notes App. Backend APIs exist where noted; full provider connectivity and UI are coming in future releases.

---

## Calendar (Google Calendar, Outlook)

**Status:** Planned — backend mocked.

**Current:** The app exposes:

- `GET /api/calendar/events` — returns mock events (no real calendar).
- `POST /api/notes/:id/create-calendar-event` — creates a mock event from a note’s deadline (no real calendar sync).

**Planned:**

- OAuth with Google Calendar and/or Microsoft Graph (Outlook).
- Real fetch of events in a date range.
- “Add to calendar” from a note deadline that creates a real event.
- Optional: sidebar or view showing upcoming calendar events next to notes.

**Env (future):** `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `MICROSOFT_GRAPH_CLIENT_ID`, etc.

---

## Email (parse, email-to-note)

**Status:** Planned — backend mocked.

**Current:** The app exposes:

- `POST /api/email/parse` — parses email payload (mock; no IMAP/OAuth).
- `POST /api/email/to-note` — converts parsed email to a note and creates it (mock).

**Planned:**

- Real email ingestion (e.g. IMAP, Gmail API, or Microsoft Graph).
- Parse sender, subject, body, attachments; create note with optional “source: email” tag.
- Optional UI: “Import from email” or inbox-style list that creates notes from emails.

**Env (future):** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, or SMTP/IMAP credentials.

---

## Cloud Storage (Google Drive, Dropbox, OneDrive)

**Status:** Planned — backend mocked.

**Current:** The app exposes:

- `GET /api/cloud/:provider/files` — returns mock file list (no real Drive/Dropbox/OneDrive).

**Planned:**

- OAuth with Google Drive, Dropbox, Microsoft OneDrive.
- Real “list files” and optional “attach file to note” or “link file” (store link + metadata in note).
- UI: picker to attach or link a cloud file to a note.

**Env (future):** `GOOGLE_DRIVE_CLIENT_ID`, `DROPBOX_APP_KEY`, `ONEDRIVE_CLIENT_ID`, etc.

---

## Task Management (Todoist, Asana, Jira)

**Status:** Planned — backend stubbed.

**Current:** The app exposes:

- `POST /api/tasks/:platform/create` — creates a task from a note (Todoist/Asana/Jira-style); implementation is stubbed (no real API calls).

**Planned:**

- Real API integration with Todoist, Asana, and/or Jira (OAuth or API keys).
- “Send to Todoist/Asana/Jira” from a note: create task with title/description and optional link back to note.
- Optional UI: show linked task ID or open task in external app.

**Env (future):** `TODOIST_API_KEY`, `ASANA_ACCESS_TOKEN`, `JIRA_HOST`, `JIRA_API_TOKEN`, etc.

---

## Summary

| Integration   | API exists | Real provider | UI        |
|---------------|------------|---------------|-----------|
| Calendar      | Yes (mock) | No            | Planned   |
| Email         | Yes (mock) | No            | Planned   |
| Cloud Storage | Yes (mock) | No            | Planned   |
| Task Mgmt     | Yes (stub) | No            | Planned   |

For **News**, **Financial** (stocks/crypto/indexes/movers), **Social** (X, Reddit), **Deadlines**, **Predictive/Nyuzi**, and **Intelligence**, see the main [README](README.md) and in-app Integrations.
