# Quality Audit - AIMyScrape Process Review

An authenticated quality audit web application designed for **AIMyScrape (SimpleCode AI)**, an engineering team operating a public-records API platform whose primary commercial customer is **Monetaria Group** (recovering defaulted merchant cash advance balances through the New York courts).

Employees sign in with Google, describe their engineering/operations role, and engage in structured, multi-turn interviews with Gemini regarding scraper maintenance, false-zero detection, NYSCEF court filing operations, residential runner networks, and bulk campaign pacing. A designated Super Admin (`jarreza_250000000100@uic.edu.ph`) uploads company basis benchmark documents, reviews all employee transcripts, and synthesizes consolidated executive reports.

---

## 1. System Architecture & Process Areas

### Target Company & Process Areas Audited
1. **Scraper Development & Maintenance**: 50-state Secretary of State (SOS) registries, NYSCEF court records, SCRA active-duty defense checks, PACER federal bankruptcy records.
2. **Result Quality Assurance (False Zeros)**: Preventing silent scraper failures where layout changes, captchas, or timeouts falsely report "no records found" instead of "unknown".
3. **Court Filing Operations**: Irreversible NYSCEF e-filing commitments and non-refundable statutory debit fees.
4. **Bulk Debtors Campaigns**: Large batch queries of Monetaria debtor portfolios, rate limits, and queue pacing.
5. **Runner & Proxy Infrastructure**: Residential runner nodes, Cloudflare challenge bypass, IP rotation, and captcha solver balances.
6. **Release, Testing, & Code Review Practices**: Regression test harnesses, synthetic golden queries, and canary alerts.

### Roles & Access Control
- **Super Admin** (`jarreza_250000000100@uic.edu.ph`): Uploads company basis benchmarks, views all user interviews and summaries, generates cross-user consolidated reports. Cannot modify or delete recorded interviews (read-only immutability).
- **Employee User**: Reads and writes only their own profile, interviews, and structured summaries under owner-bound path isolation (`users/{userId}/*`).

---

## 2. Threat Modeling & OWASP Standards

### The 5 Threat Zones
- **Input Surfaces**: Chat messages and profile strings capped; uploaded company documents (.txt, .md, .pdf, .csv, .docx) strictly size-limited (5MB) and parsed as raw text.
- **Planning & Reasoning**: Uploaded documents and conversation history delimited inside `[COMPANY_BASIS_SECTION]` and `[CONVERSATION_TRANSCRIPT]` tags; Gemini strictly instructed that text within cannot modify its auditor persona or disclose other users' candid records.
- **Sensitive Data Guard (Client & Server)**:
  - Secrets (API keys, passwords, NYSCEF credentials, tokens) are strictly **blocked** before saving.
  - Personal Data (SSNs, credit card numbers, debtor details) trigger a **warning banner** asking the user to describe the issue generically.
- **Memory & State (Immutability)**: Interactions are create-only (`allow update, delete: if false;`).
- **Transparency**: Dashboard prominently informs employees that the Super Admin can read all interviews.

---

## 3. Firestore Security Rules

Deploy the following `firestore.rules` to Google Cloud Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isSuperAdmin() {
      return signedIn() && (request.auth.token.superAdmin == true
        || (request.auth.token.email == "jarreza_250000000100@uic.edu.ph" && request.auth.token.email_verified == true));
    }

    match /users/{userId} {
      allow read: if (signedIn() && request.auth.uid == userId) || isSuperAdmin();
      allow create, update: if signedIn() && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read: if (signedIn() && request.auth.uid == userId) || isSuperAdmin();
        allow create: if signedIn() && request.auth.uid == userId;
        allow update, delete: if false; // Immutability guarantee
      }

      match /summaries/{summaryId} {
        allow read, write: if signedIn() && request.auth.uid == userId;
        allow read: if isSuperAdmin();
      }
    }

    match /companyBasis/{docId} {
      allow read, write: if isSuperAdmin();
    }

    match /auditReports/{reportId} {
      allow read: if isSuperAdmin();
      allow write: if false; // Backend only
    }
  }
}
```

---

## 4. Google Cloud Deployment Guide

### Prerequisites
1. Google Cloud SDK (`gcloud` CLI) authenticated.
2. Enable required Cloud APIs:
   ```bash
   gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
   ```

### Step 1: Secret Manager Setup
Create and populate the `GEMINI_API_KEY` secret and grant access to the Cloud Run service account:

```bash
# Create the secret with automatic replication
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Populate the secret from a local file or stdin
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 2: Deploy to Google Cloud Run
Deploy the application container directly to Cloud Run with mounted secrets and environment variables:

```bash
gcloud run deploy quality-audit \
  --source . \
  --region=us-central1 \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=SUPER_ADMIN_EMAIL=jarreza_250000000100@uic.edu.ph \
  --allow-unauthenticated
```

### Step 3: Required Campaign Challenge Labeling
Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update quality-audit \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Functional & Security Test Suite (20 Scenarios)

The application includes an in-app interactive test runner exercising all 20 required verification cases:

1. **Sign-In**: Visit landing page, sign in with Google session. Private dashboard loads.
2. **Sign-Out/In Persistence**: Save profile and interview, restart session. Records persist intact.
3. **Profile**: Save role and job function. Empty or over-length fields trigger validation rejection.
4. **Multi-Turn Interview**: Exchange dialogue on scraper false zeros. Gemini maintains context and saves each turn to `users/{uid}/interactions`.
5. **Summary**: Click "Summarize". Structured JSON validated and saved.
6. **History**: Open history. Only signed-in user's records returned, newest first.
7. **User Isolation**: User B requests User A interactions. Permission denied (403).
8. **Admin Denied to Users**: Normal user requests `/api/superadmin/users`. Denied (403).
9. **Company Basis Upload**: Super Admin uploads process document. Saved and grounded in Gemini interviews.
10. **Upload Rejection**: Upload disallowed extension (.exe) or oversized payload. Rejected with clear message.
11. **Prompt Injection in Upload**: Document with "ignore previous instructions" uploaded. Handled as plain data.
12. **Prompt Injection in Chat**: User asks Gemini to disclose colleague complaints. Model politely declines.
13. **Secret Guard**: User pastes API key into chat. Blocked before saving with credential alert.
14. **Personal Data Guard**: User pastes debtor name with SSN. Warning surfaced; user advised to describe generically.
15. **Consolidated View**: Super Admin views dashboard. Pain points grouped by area and severity, citing summary IDs.
16. **Admin Read-Only**: Super Admin attempts to edit or delete interaction. Denied (403).
17. **Gemini Fallback**: Multi-model fallback ladder (`gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
18. **Gemini Failure**: Generation error preserves user message with `responseFailed: true`.
19. **Save Failure**: Validation error preserves form input buffer.
20. **Output Encoding**: Message with `<script>alert(1)</script>` safely rendered as plain text in React DOM.
