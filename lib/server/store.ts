import {
  UserProfile,
  Interaction,
  AuditSummary,
  CompanyBasisDoc,
  ConsolidatedReport,
  AuditSession
} from '../types';

export const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || 'jarreza_250000000100@uic.edu.ph';

// Initial Profiles
const SEED_PROFILES: UserProfile[] = [
  {
    userId: 'usr_super_admin',
    email: SUPER_ADMIN_EMAIL,
    displayName: 'Elena Vance (Super Admin)',
    roleInCompany: 'Management',
    jobFunction: 'VP of Quality & Infrastructure Operations',
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    userId: 'usr_eng_danilo',
    email: 'danilo@aimyscrape.com',
    displayName: 'Danilo Reyes',
    roleInCompany: 'Software Engineer',
    jobFunction: 'Core Scraper Development & NYSCEF E-filing API',
    createdAt: '2026-10-05T09:30:00Z'
  },
  {
    userId: 'usr_qa_maya',
    email: 'maya@aimyscrape.com',
    displayName: 'Maya Lin',
    roleInCompany: 'QA / Quality Auditor',
    jobFunction: 'Automated Regression & False-Zero Verification',
    createdAt: '2026-10-08T11:15:00Z'
  },
  {
    userId: 'usr_ops_leo',
    email: 'leo@aimyscrape.com',
    displayName: 'Leo Martinez',
    roleInCompany: 'Operations / Runner Operator',
    jobFunction: 'Residential Runner Fleet & Captcha Solver Infrastructure',
    createdAt: '2026-10-12T14:00:00Z'
  }
];

// Initial Company Basis Documents (Uploaded by Super Admin as Audit Benchmark)
const SEED_COMPANY_BASIS: CompanyBasisDoc[] = [
  {
    docId: 'basis-doc-01',
    title: 'AIMyScrape Scraper Engineering & False-Zero Prevention Standard',
    extractedText: `AIMYSCRAPE STANDARD OPERATING PROCEDURE (SOP-08):
1. False-Zero Zero Tolerance Policy: When querying 50-state SOS databases or NYSCEF, any network timeout, Cloudflare block, or unsolved captcha MUST be returned as status 'UNKNOWN', NEVER as 'NO RECORDS FOUND'. Falsely reporting zero records causes Monetaria to miss active debtor assets.
2. NYSCEF Court Filing Protocol: NYSCEF e-filing involves court fee debit cards and irreversible docket commitments. Filings must pass strict schema validation, attorney confirmation, and deduplication idempotency keys.
3. Runner Fleet Management: Residential runner nodes must maintain minimum 99.4% uptime. When a state registry rotates bot protections, runner operators must deploy updated headers within 45 minutes.
4. Entity Status Verification: Mergers and dissolved status changes must be validated against entity history logs to prevent serving summons on inactive shell companies.`,
    uploadedAt: '2026-10-15T10:00:00Z',
    uploadedBy: SUPER_ADMIN_EMAIL,
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
    uploadedBy: SUPER_ADMIN_EMAIL,
    fileSize: 840
  }
];

// Initial Seed Summaries
const SEED_SUMMARIES: AuditSummary[] = [
  {
    summaryId: 'sum-danilo-01',
    userId: 'usr_eng_danilo',
    userName: 'Danilo Reyes',
    userRole: 'Software Engineer',
    sessionId: 'sess-danilo-101',
    createdAt: '2026-10-22T16:20:00Z',
    processArea: 'Scraper Maintenance',
    processSteps: [
      'Monitor state SOS HTML DOM shifts via diff alert webhooks',
      'Update CSS selectors and reverse-engineer API payload changes',
      'Test in staging sandbox with 50 known corporate entities',
      'Deploy hotfix to production scraper cluster'
    ],
    painPoints: [
      {
        description: 'Delaware and Texas SOS portal silent layout changes cause false-zero return before alarms sound',
        impact: 'Monetaria missed 3 active debtor corporate filings last month',
        severity: 'high',
        frequency: 'sporadic'
      },
      {
        description: 'NYSCEF e-filing lacks staging environment, forcing developers to test on live docket with 1-cent test fees',
        impact: 'High anxiety during releases; accidental docket entries impossible to undo',
        severity: 'high',
        frequency: 'on release'
      }
    ],
    complaints: [
      'Lack of automated visual regression testing for state SOS portals',
      'Monetaria support tickets are routed directly to Slack without reproduction steps'
    ],
    suggestions: [
      'Implement synthetic golden-record probing every 15 minutes for each of the 50 state registries',
      'Build a local NYSCEF e-filing mock server that simulates docket clerk rejections'
    ],
    quickWins: [
      'Add canary query alerting for Delaware SOS endpoint',
      'Enforce strict JSON schema validation on scraper parser outputs'
    ],
    openQuestions: [
      'Can Monetaria provide standardized batch files with expected outcomes for test harnesses?'
    ]
  },
  {
    summaryId: 'sum-maya-01',
    userId: 'usr_qa_maya',
    userName: 'Maya Lin',
    userRole: 'QA / Quality Auditor',
    sessionId: 'sess-maya-201',
    createdAt: '2026-10-24T10:45:00Z',
    processArea: 'Result QA & False-Zeros',
    processSteps: [
      'Review daily automated comparison of AIMyScrape results against manual state registry lookups',
      'Flag name-matching discrepancies (e.g., L & B vs L AND B)',
      'File Jira bug for scraper parsers reporting unknown status',
      'Audit SCRA certificate expiration timestamps'
    ],
    painPoints: [
      {
        description: 'Fuzzy string matching on DBA names fails when legal name has punctuation or Roman numerals',
        impact: 'Guarantor corporate entities marked as not found when debtor operated under slightly modified DBA',
        severity: 'medium',
        frequency: 'weekly'
      }
    ],
    complaints: [
      'No centralized dashboard to view historical false-zero trends across scrapers'
    ],
    suggestions: [
      'Implement Levenshtein distance thresholding and legal suffix stripping before lookup',
      'Require QA sign-off before new state scraper parser changes are promoted to production'
    ],
    quickWins: [
      'Create automated weekly false-zero report for Monetaria accounts team'
    ],
    openQuestions: [
      'Who owns the legal determination when entity status is listed as "In Good Standing - Forfeited Franchise"?'
    ]
  },
  {
    summaryId: 'sum-leo-01',
    userId: 'usr_ops_leo',
    userName: 'Leo Martinez',
    userRole: 'Operations / Runner Operator',
    sessionId: 'sess-leo-301',
    createdAt: '2026-10-26T15:30:00Z',
    processArea: 'Runner Infrastructure',
    processSteps: [
      'Provision and maintain pool of 180+ local residential runner nodes',
      'Monitor IP block lists and Cloudflare challenge rates',
      'Rotate runner proxies when error rate on NYSCEF or SOS exceeds 2%',
      'Monitor 2Captcha and CapSolver API balances'
    ],
    painPoints: [
      {
        description: 'Residential ISP providers unexpectedly dropping blocks during morning peak hours',
        impact: 'Large Monetaria bulk check batches stall or time out midway through execution',
        severity: 'high',
        frequency: 'weekly'
      }
    ],
    complaints: [
      'Lack of automated circuit breaker to pause batch queue when runner pool health drops below 70%'
    ],
    suggestions: [
      'Implement multi-provider residential proxy failover (BrightData + Oxylabs fallback)',
      'Build automated captcha solver health checks'
    ],
    quickWins: [
      'Set low-balance alerts on captcha solving APIs at $100 threshold'
    ],
    openQuestions: [
      'What is our maximum cost-per-query threshold when commercial collections volume spikes?'
    ]
  }
];

// Initial Interactions for Danilo
const SEED_INTERACTIONS: Interaction[] = [
  {
    interactionId: 'int-danilo-01',
    userId: 'usr_eng_danilo',
    sessionId: 'sess-danilo-101',
    userPrompt: 'Hi, I want to talk about how we maintain our state Secretary of State scrapers and the problems we face with false zeros.',
    geminiResponse: 'Hello Danilo. Thank you for participating in this quality audit. As a Software Engineer maintaining our core scrapers, your insight is vital to ensuring AIMyScrape delivers reliable public records data to Monetaria Group.\n\nTo begin, could you walk me through the specific processes and steps you follow when a state Secretary of State registry updates its portal or when you build a new scraper?',
    modelUsed: 'gemini-3.8-flash',
    timestamp: '2026-10-22T16:00:00Z'
  },
  {
    interactionId: 'int-danilo-02',
    userId: 'usr_eng_danilo',
    sessionId: 'sess-danilo-101',
    userPrompt: 'We monitor DOM shifts with diff webhooks. But Delaware and Texas changed their layout recently, and instead of throwing errors, our parser returned empty results—a false zero. Monetaria missed debtor corporate records.',
    geminiResponse: 'That is a critical process vulnerability. A silent failure where a layout shift produces an empty result rather than an explicit error directly violates our False-Zero Zero Tolerance Policy (SOP-08).\n\nWhen this Delaware and Texas incident occurred, what downstream friction or complaints did this cause, and why did our staging verification fail to catch it prior to hitting Monetaria?',
    modelUsed: 'gemini-3.8-flash',
    timestamp: '2026-10-22T16:05:00Z'
  }
];

// Initial Seed Sessions
const SEED_SESSIONS: AuditSession[] = [
  {
    sessionId: 'sess-danilo-101',
    userId: 'usr_eng_danilo',
    topic: 'Scraper Maintenance & False-Zero Prevention (SOP-08)',
    status: 'completed',
    createdAt: '2026-10-22T16:00:00Z',
    updatedAt: '2026-10-22T16:20:00Z',
    interactionCount: 2,
    lastActivity: '2026-10-22T16:20:00Z',
    firstPrompt: 'Hi, I want to talk about how we maintain our state Secretary of State scrapers and the problems we face with false zeros.',
    summaryId: 'sum-danilo-01'
  },
  {
    sessionId: 'sess-maya-201',
    userId: 'usr_qa_maya',
    topic: 'Result QA & False-Zero Verification',
    status: 'completed',
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T10:45:00Z',
    interactionCount: 0,
    lastActivity: '2026-10-24T10:45:00Z',
    firstPrompt: 'Result QA & False-Zeros',
    summaryId: 'sum-maya-01'
  },
  {
    sessionId: 'sess-leo-301',
    userId: 'usr_ops_leo',
    topic: 'Residential Runner Fleet & Captcha Solver Uptime',
    status: 'completed',
    createdAt: '2026-10-26T15:00:00Z',
    updatedAt: '2026-10-26T15:30:00Z',
    interactionCount: 0,
    lastActivity: '2026-10-26T15:30:00Z',
    firstPrompt: 'Runner Infrastructure',
    summaryId: 'sum-leo-01'
  },
  {
    sessionId: 'sess-active-session',
    userId: 'usr_super_admin',
    topic: 'AIMyScrape Core Process & Infrastructure Audit',
    status: 'active',
    createdAt: '2026-10-27T09:00:00Z',
    updatedAt: '2026-10-27T09:00:00Z',
    interactionCount: 0,
    lastActivity: '2026-10-27T09:00:00Z',
    firstPrompt: 'AIMyScrape Core Process & Infrastructure Audit'
  }
];

class QualityAuditStore {
  private profiles: Map<string, UserProfile> = new Map();
  private sessions: Map<string, AuditSession> = new Map();
  private interactions: Interaction[] = [];
  private summaries: AuditSummary[] = [];
  private companyBasis: CompanyBasisDoc[] = [];
  private consolidatedReports: ConsolidatedReport[] = [];

  constructor() {
    this.resetToSeed();
  }

  public resetToSeed(): void {
    this.profiles.clear();
    SEED_PROFILES.forEach((p) => this.profiles.set(p.userId, { ...p }));
    this.sessions.clear();
    SEED_SESSIONS.forEach((s) => this.sessions.set(s.sessionId, { ...s }));
    this.interactions = JSON.parse(JSON.stringify(SEED_INTERACTIONS));
    this.summaries = JSON.parse(JSON.stringify(SEED_SUMMARIES));
    this.companyBasis = JSON.parse(JSON.stringify(SEED_COMPANY_BASIS));
    this.consolidatedReports = [];
  }

  public isSuperAdmin(email: string): boolean {
    if (!email) return false;
    return (
      email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim() ||
      email.includes('jarreza_250000000100')
    );
  }

  // User Profile
  public getProfile(userId: string): UserProfile | null {
    return this.profiles.get(userId) || null;
  }

  public getProfileByEmail(email: string): UserProfile | null {
    for (const p of this.profiles.values()) {
      if (p.email.toLowerCase() === email.toLowerCase()) {
        return p;
      }
    }
    return null;
  }

  public saveProfile(profile: UserProfile): UserProfile {
    const existing = this.profiles.get(profile.userId);
    const updated: UserProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || profile.createdAt || new Date().toISOString()
    };
    this.profiles.set(profile.userId, updated);
    return updated;
  }

  // Interactions (Create-Only / Immutability per Directive 3)
  public addInteraction(interaction: Interaction): Interaction {
    // Immutability: Interactions can never be updated or deleted once committed
    this.interactions.push({ ...interaction });
    return interaction;
  }

  public getUserInteractions(userId: string, sessionId?: string): Interaction[] {
    return this.interactions
      .filter((i) => i.userId === userId && (!sessionId || i.sessionId === sessionId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Sessions Management & Persistence
  public getSession(sessionId: string): AuditSession | null {
    const s = this.sessions.get(sessionId);
    return s ? { ...s } : null;
  }

  public saveSession(session: AuditSession): AuditSession {
    const existing = this.sessions.get(session.sessionId);
    // Strict Undefined-Stripping per Directive 6
    const sanitized: AuditSession = {
      sessionId: session.sessionId,
      userId: session.userId,
      topic: session.topic || existing?.topic || 'General Process Audit',
      status: session.status || existing?.status || 'active',
      createdAt: existing?.createdAt || session.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interactionCount: typeof session.interactionCount === 'number'
        ? session.interactionCount
        : existing?.interactionCount || 0,
      lastActivity: session.lastActivity || existing?.lastActivity || new Date().toISOString(),
      firstPrompt: session.firstPrompt || existing?.firstPrompt || session.topic,
      ...(session.summaryId ? { summaryId: session.summaryId } : (existing?.summaryId ? { summaryId: existing.summaryId } : {}))
    };
    this.sessions.set(session.sessionId, sanitized);
    return sanitized;
  }

  public getUserSessions(userId: string): Array<
    AuditSession & {
      summary?: AuditSummary;
    }
  > {
    const userInteractions = this.interactions.filter((i) => i.userId === userId);
    const userSummaries = this.summaries.filter((s) => s.userId === userId);

    const sessionMap = new Map<string, AuditSession & { summary?: AuditSummary }>();

    // 1. Populate from persisted sessions
    for (const s of this.sessions.values()) {
      if (s.userId === userId) {
        sessionMap.set(s.sessionId, {
          ...s,
          summary: userSummaries.find((sum) => sum.sessionId === s.sessionId)
        });
      }
    }

    // 2. Reconcile with summaries
    for (const sum of userSummaries) {
      const existing = sessionMap.get(sum.sessionId);
      if (existing) {
        existing.summary = sum;
        if (existing.status !== 'completed') {
          existing.status = 'completed';
          existing.summaryId = sum.summaryId;
        }
      } else {
        const synthesized: AuditSession = {
          sessionId: sum.sessionId,
          userId: sum.userId,
          topic: sum.processArea || 'Process Audit',
          status: 'completed',
          createdAt: sum.createdAt,
          updatedAt: sum.createdAt,
          interactionCount: 0,
          lastActivity: sum.createdAt,
          firstPrompt: sum.processArea,
          summaryId: sum.summaryId
        };
        this.sessions.set(sum.sessionId, synthesized);
        sessionMap.set(sum.sessionId, { ...synthesized, summary: sum });
      }
    }

    // 3. Reconcile with interactions
    for (const inter of userInteractions) {
      const existing = sessionMap.get(inter.sessionId);
      if (existing) {
        const count = userInteractions.filter((i) => i.sessionId === inter.sessionId).length;
        existing.interactionCount = Math.max(existing.interactionCount, count);
        if (new Date(inter.timestamp).getTime() > new Date(existing.lastActivity || existing.updatedAt).getTime()) {
          existing.lastActivity = inter.timestamp;
          existing.updatedAt = inter.timestamp;
        }
        if (!existing.firstPrompt || existing.firstPrompt === existing.topic) {
          existing.firstPrompt = inter.userPrompt;
        }
      } else {
        const count = userInteractions.filter((i) => i.sessionId === inter.sessionId).length;
        const synthesized: AuditSession = {
          sessionId: inter.sessionId,
          userId: inter.userId,
          topic: inter.userPrompt.slice(0, 80) || 'Process Audit',
          status: 'active',
          createdAt: inter.timestamp,
          updatedAt: inter.timestamp,
          interactionCount: count,
          lastActivity: inter.timestamp,
          firstPrompt: inter.userPrompt
        };
        this.sessions.set(inter.sessionId, synthesized);
        sessionMap.set(inter.sessionId, {
          ...synthesized,
          summary: userSummaries.find((s) => s.sessionId === inter.sessionId)
        });
      }
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) =>
        new Date(b.lastActivity || b.updatedAt).getTime() -
        new Date(a.lastActivity || a.updatedAt).getTime()
    );
  }

  public getAllInteractionsForAdmin(requestingEmail: string): Interaction[] {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Super Admin access required to inspect all interactions.');
    }
    return [...this.interactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Summaries
  public saveSummary(summary: AuditSummary): AuditSummary {
    const idx = this.summaries.findIndex((s) => s.summaryId === summary.summaryId);
    if (idx >= 0) {
      this.summaries[idx] = summary;
    } else {
      this.summaries.unshift(summary);
    }
    return summary;
  }

  public getUserSummaries(userId: string): AuditSummary[] {
    return this.summaries.filter((s) => s.userId === userId);
  }

  public getAllSummaries(requestingEmail: string): AuditSummary[] {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Super Admin access required.');
    }
    return [...this.summaries];
  }

  public getSummaryById(summaryId: string): AuditSummary | null {
    return this.summaries.find((s) => s.summaryId === summaryId) || null;
  }

  // Company Basis Docs
  public getCompanyBasisDocs(): CompanyBasisDoc[] {
    return [...this.companyBasis];
  }

  public addCompanyBasisDoc(
    requestingEmail: string,
    doc: Omit<CompanyBasisDoc, 'docId' | 'uploadedAt' | 'uploadedBy'>
  ): CompanyBasisDoc {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Only the Super Admin can upload company basis documents.');
    }
    const newDoc: CompanyBasisDoc = {
      docId: `basis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: doc.title,
      extractedText: doc.extractedText,
      fileSize: doc.fileSize,
      uploadedAt: new Date().toISOString(),
      uploadedBy: requestingEmail
    };
    this.companyBasis.unshift(newDoc);
    return newDoc;
  }

  public deleteCompanyBasisDoc(requestingEmail: string, docId: string): boolean {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Only the Super Admin can delete company basis documents.');
    }
    const initialLen = this.companyBasis.length;
    this.companyBasis = this.companyBasis.filter((d) => d.docId !== docId);
    return this.companyBasis.length < initialLen;
  }

  // Consolidated Reports
  public saveConsolidatedReport(
    requestingEmail: string,
    report: ConsolidatedReport
  ): ConsolidatedReport {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Only Super Admin can save consolidated reports.');
    }
    this.consolidatedReports.unshift(report);
    return report;
  }

  public getConsolidatedReports(requestingEmail: string): ConsolidatedReport[] {
    if (!this.isSuperAdmin(requestingEmail)) {
      throw new Error('Forbidden: Only Super Admin can view consolidated reports.');
    }
    return [...this.consolidatedReports];
  }
}

// Global Singleton
declare global {
  var __qualityAuditStore: QualityAuditStore | undefined;
}

export const auditStore =
  global.__qualityAuditStore || (global.__qualityAuditStore = new QualityAuditStore());
