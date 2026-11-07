import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  UserProfile,
  AuditSession,
  Interaction,
  AuditSummary,
  CompanyBasisDoc,
  ConsolidatedReport
} from './types';

// Strict Undefined-Stripping Helper
export function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Resilient non-blocking write helper with timeout guard
export async function safeWriteWithTimeout<T>(
  writePromise: Promise<T>,
  timeoutMs = 4000
): Promise<void> {
  let timer: any;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  await Promise.race([
    writePromise
      .then(() => {
        if (timer) clearTimeout(timer);
      })
      .catch((err) => {
        console.warn('Firestore write warning:', err?.message || err);
      }),
    timeout
  ]);
}

// 1. Connection Validation per Skill Directive
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running offline/waiting for network handshake.');
    }
    return false;
  }
}

// 2. Profiles: users/{userId}
export async function saveProfileToFirestore(profile: UserProfile): Promise<UserProfile> {
  try {
    const cleanData = stripUndefined(profile);
    await safeWriteWithTimeout(
      setDoc(doc(db, 'users', profile.userId), cleanData, { merge: true })
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save profile to Firestore:', error);
    return profile;
  }
}

export async function getProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch profile from Firestore:', error);
    return null;
  }
}

// 3. Audit Sessions: users/{userId}/sessions/{sessionId}
export async function saveSessionToFirestore(session: AuditSession): Promise<AuditSession> {
  try {
    const cleanData = stripUndefined(session);
    await safeWriteWithTimeout(
      setDoc(doc(db, 'users', session.userId, 'sessions', session.sessionId), cleanData, {
        merge: true
      })
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save session to Firestore:', error);
    return session;
  }
}

export async function getSessionsFromFirestore(userId: string): Promise<AuditSession[]> {
  const path = `users/${userId}/sessions`;
  try {
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const snap = await getDocs(sessionsCol);
    const sessions: AuditSession[] = [];
    snap.forEach((d) => {
      sessions.push(d.data() as AuditSession);
    });
    return sessions.sort(
      (a, b) =>
        new Date(b.lastActivity || b.updatedAt).getTime() -
        new Date(a.lastActivity || a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch sessions from Firestore:', error);
    return [];
  }
}

// 4. Interactions: users/{userId}/interactions/{interactionId}
export async function saveInteractionToFirestore(interaction: Interaction): Promise<Interaction> {
  try {
    const cleanData = stripUndefined(interaction);
    await safeWriteWithTimeout(
      setDoc(
        doc(db, 'users', interaction.userId, 'interactions', interaction.interactionId),
        cleanData
      )
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save interaction to Firestore:', error);
    return interaction;
  }
}

export async function getInteractionsFromFirestore(
  userId: string,
  sessionId?: string
): Promise<Interaction[]> {
  const path = `users/${userId}/interactions`;
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = sessionId
      ? query(colRef, where('sessionId', '==', sessionId))
      : colRef;
    const snap = await getDocs(q);
    const list: Interaction[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Interaction);
    });
    return list.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch interactions from Firestore:', error);
    return [];
  }
}

// 5. Structured Summaries: users/{userId}/summaries/{summaryId}
export async function saveSummaryToFirestore(summary: AuditSummary): Promise<AuditSummary> {
  try {
    const cleanData = stripUndefined(summary);
    await safeWriteWithTimeout(
      setDoc(
        doc(db, 'users', summary.userId, 'summaries', summary.summaryId),
        cleanData,
        { merge: true }
      )
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save summary to Firestore:', error);
    return summary;
  }
}

export async function getSummariesFromFirestore(userId: string): Promise<AuditSummary[]> {
  const path = `users/${userId}/summaries`;
  try {
    const colRef = collection(db, 'users', userId, 'summaries');
    const snap = await getDocs(colRef);
    const list: AuditSummary[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AuditSummary);
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch summaries from Firestore:', error);
    return [];
  }
}

// 6. Company Basis Documents: companyBasis/{docId}
export async function saveCompanyBasisToFirestore(
  basisDoc: CompanyBasisDoc
): Promise<CompanyBasisDoc> {
  try {
    const cleanData = stripUndefined(basisDoc);
    await safeWriteWithTimeout(
      setDoc(doc(db, 'companyBasis', basisDoc.docId), cleanData, { merge: true })
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save company basis to Firestore:', error);
    return basisDoc;
  }
}

export async function getCompanyBasisFromFirestore(): Promise<CompanyBasisDoc[]> {
  const path = 'companyBasis';
  try {
    const colRef = collection(db, 'companyBasis');
    const snap = await getDocs(colRef);
    const list: CompanyBasisDoc[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CompanyBasisDoc);
    });
    return list.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch company basis from Firestore:', error);
    return [];
  }
}

// 7. Consolidated Reports: auditReports/{reportId}
export async function saveConsolidatedReportToFirestore(
  report: ConsolidatedReport
): Promise<ConsolidatedReport> {
  try {
    const cleanData = stripUndefined(report);
    await safeWriteWithTimeout(
      setDoc(doc(db, 'auditReports', report.reportId), cleanData, { merge: true })
    );
    return cleanData;
  } catch (error) {
    console.error('Failed to save consolidated report to Firestore:', error);
    return report;
  }
}

export async function getConsolidatedReportsFromFirestore(): Promise<ConsolidatedReport[]> {
  const path = 'auditReports';
  try {
    const colRef = collection(db, 'auditReports');
    const snap = await getDocs(colRef);
    const list: ConsolidatedReport[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ConsolidatedReport);
    });
    return list.sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to fetch consolidated reports from Firestore:', error);
    return [];
  }
}

// 8. Seeder: Ensures Firestore has initial benchmark SOPs & starter data
export async function seedInitialDataToFirestore(): Promise<void> {
  try {
    // Check if company basis exists
    const basisSnap = await getDocs(collection(db, 'companyBasis'));
    if (basisSnap.empty) {
      const initialBasis: CompanyBasisDoc[] = [
        {
          docId: 'basis-doc-01',
          title: 'AIMyScrape Scraper Engineering & False-Zero Prevention Standard',
          extractedText: `AIMYSCRAPE STANDARD OPERATING PROCEDURE (SOP-08):
1. False-Zero Zero Tolerance Policy: When querying 50-state SOS databases or NYSCEF, any network timeout, Cloudflare block, or unsolved captcha MUST be returned as status 'UNKNOWN', NEVER as 'NO RECORDS FOUND'. Falsely reporting zero records causes Monetaria to miss active debtor assets.
2. NYSCEF Court Filing Protocol: NYSCEF e-filing involves court fee debit cards and irreversible docket commitments. Filings must pass strict schema validation, attorney confirmation, and deduplication idempotency keys.
3. Runner Fleet Management: Residential runner nodes must maintain minimum 99.4% uptime. When a state registry rotates bot protections, runner operators must deploy updated headers within 45 minutes.
4. Entity Status Verification: Mergers and dissolved status changes must be validated against entity history logs to prevent serving summons on inactive shell companies.`,
          uploadedAt: '2026-10-15T10:00:00Z',
          uploadedBy: 'jarreza_250000000100@uic.edu.ph',
          fileSize: 1048
        },
        {
          docId: 'basis-doc-02',
          title: 'Monetaria MCA Collections Workflow & Escalation SLA',
          extractedText: `MONETARIA PARTNERSHIP SPECIFICATION (V3):
1. Bulk Debtors Campaigns: Monetaria submits weekly batches of 2,500+ commercial debtors for cross-registry screening. Queue pacing must not exceed 12 queries/second to prevent NYSCEF rate limit suspensions.
2. Servicemembers Civil Relief Act (SCRA): DoD DMDC active duty military certificates must be freshly pulled within 30 days of filing judgment.
3. PACER Bankruptcy Sync: Daily automated PACER searches must flag any voluntary bankruptcy petition before noon ET to uphold 11 U.S.C. § 362 automatic stay compliance.`,
          uploadedAt: '2026-10-16T14:30:00Z',
          uploadedBy: 'jarreza_250000000100@uic.edu.ph',
          fileSize: 840
        }
      ];

      for (const b of initialBasis) {
        await saveCompanyBasisToFirestore(b);
      }
    }
  } catch (err) {
    console.error('Firestore seeding warning:', err);
  }
}
