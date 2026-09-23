# HireX — Requirements

> Living document. Last updated: 2026-09-24. Companion to [PROJECT_PLAN.md](PROJECT_PLAN.md).

Legend: **[MVP]** = required for first release · **[v2]** = fast-follow · **[opt-in]** = user must enable.

## 1. Functional requirements

### FR-1 Accounts & authentication
- FR-1.1 **[MVP]** Users can sign up / log in via email + password and OAuth (Google, LinkedIn).
- FR-1.2 **[MVP]** Users can view, edit, export, and delete their account and data (GDPR).
- FR-1.3 **[MVP]** Session management with secure, httpOnly tokens; password reset.

### FR-2 Resume & profile
- FR-2.1 **[MVP]** Upload a resume (PDF/DOCX). Files stored encrypted.
- FR-2.2 **[MVP]** Parse the resume into a structured profile (skills, experience,
  education, titles, locations).
- FR-2.3 **[MVP]** User can review and correct the parsed profile.
- FR-2.4 **[MVP]** Support multiple resume versions per user.

### FR-3 Job preferences
- FR-3.1 **[MVP]** Capture target roles, seniority, and industries.
- FR-3.2 **[MVP]** Capture locations (city / state / country), remote/hybrid/onsite.
- FR-3.3 **[MVP]** Capture salary expectations and must-haves / deal-breakers.
- FR-3.4 **[MVP]** Set an auto-approve confidence threshold (default: off).

### FR-4 Job discovery & matching
- FR-4.1 **[MVP]** Discover openings via at least one ATS/job-board integration.
- FR-4.2 **[MVP]** Rank openings by an explainable match score (0–100).
- FR-4.3 **[MVP]** Show *why* a job matched (skills, location, seniority overlap).
- FR-4.4 **[v2]** Discover top relevant companies in a target geography and monitor
  their careers pages for new openings.
- FR-4.5 **[MVP]** Filter/sort matches; save or dismiss a job.

### FR-5 AI tailoring
- FR-5.1 **[MVP]** Generate a resume tailored to a specific job description.
- FR-5.2 **[MVP]** Generate a cover letter per job.
- FR-5.3 **[MVP]** Show an ATS relevance/keyword score before applying.
- FR-5.4 **[MVP]** User can edit AI output before it is used.

### FR-6 Application submission
- FR-6.1 **[MVP]** Queue applications with a preview (resume, cover letter, answers).
- FR-6.2 **[MVP]** One-click approve; **[opt-in]** auto-approve above threshold.
- FR-6.3 **[MVP]** Submit via official channels / supported ATS using automated form-fill.
- FR-6.4 **[MVP]** Record submission status and store what was submitted.
- FR-6.5 **[MVP]** Retry failed submissions; surface manual-fallback when automation fails.

### FR-7 Application tracking
- FR-7.1 **[MVP]** Kanban pipeline: matched → applied → screening → interview → offer/rejected.
- FR-7.2 **[MVP]** Manual status edits and notes per application.
- FR-7.3 **[v2]** Auto-update status by parsing inbound recruiter emails (opt-in).

### FR-8 Notifications
- FR-8.1 **[MVP]** Email notifications for new high-fit matches and pending approvals.
- FR-8.2 **[MVP]** Configurable digest (daily/weekly) and per-event toggles.

### FR-9 Recruiter outreach (deferred)
- FR-9.1 **[v2][opt-in]** Send personalized, rate-limited outreach **only** to
  opted-in / published contacts, with unsubscribe and suppression handling.
- FR-9.2 **[v2]** Never bulk-mail scraped lists; never the default behavior (see PLAN §5).

## 2. Non-functional requirements

- **NFR-1 Security:** PII and resumes encrypted at rest and in transit; secrets in a
  vault; least-privilege access; audit log of automated actions.
- **NFR-2 Privacy/compliance:** GDPR/CAN-SPAM/CASL aligned; data export & erasure;
  clear consent for any outreach.
- **NFR-3 Reliability:** background jobs are idempotent with retries; a stuck
  automation job must not block the user-facing API.
- **NFR-4 Performance:** dashboard interactions < 300 ms P95 (excluding async jobs);
  match results within seconds of request.
- **NFR-5 Scalability:** worker pool scales horizontally; queue-based decoupling.
- **NFR-6 Observability:** structured logs, error tracking, dashboards for automation
  success rate and email deliverability.
- **NFR-7 Accessibility:** WCAG 2.1 AA for the web dashboard.
- **NFR-8 Maintainability:** typed end-to-end (TS on API/frontend), tests on core
  logic, CI on every PR.
- **NFR-9 Rate/ToS compliance:** respect robots.txt, per-domain rate limits; no
  captcha/bot-detection circumvention.

## 3. Sample user stories

- As a **job seeker**, I upload my resume and get a ranked list of relevant roles in
  my chosen city, so I don't have to search job boards manually.
- As a **selective seeker**, I only get notified about roles above 80% fit, so I'm
  not overwhelmed.
- As a **busy professional**, I review a tailored application and approve it in one
  tap, so applying takes seconds.
- As a **privacy-conscious user**, I can export and permanently delete all my data.
- As a **user**, I see why each job matched and can edit the AI-tailored resume
  before it's submitted, so I stay in control of my application.

## 4. Acceptance criteria (MVP definition of done)

- A user can go from **signup → resume upload → preferences → ranked matches →
  tailored application → approve → submitted → tracked** end to end.
- Every automated submission is logged and reviewable.
- No email is sent without unsubscribe handling.
- Core parsing, matching, and submission logic is covered by tests, green in CI.
