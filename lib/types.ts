export type AppRole = 'superAdmin' | 'user';

export type CompanyRole =
  | 'Software Engineer'
  | 'QA / Quality Auditor'
  | 'Operations / Runner Operator'
  | 'Customer Success / Account Manager'
  | 'Management'
  | 'Other';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  roleInCompany: CompanyRole | string;
  jobFunction: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditSession {
  sessionId: string;
  userId: string;
  topic: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  interactionCount: number;
  lastActivity?: string;
  firstPrompt?: string;
  summaryId?: string;
}

export interface Interaction {
  interactionId: string;
  userId: string;
  sessionId: string;
  userPrompt: string;
  geminiResponse: string;
  modelUsed: string;
  timestamp: string;
  responseFailed?: boolean;
}

export interface PainPoint {
  description: string;
  impact: string;
  severity: 'low' | 'medium' | 'high';
  frequency: string;
}

export interface AuditSummary {
  summaryId: string;
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;
  createdAt: string;
  processArea: string;
  processSteps: string[];
  painPoints: PainPoint[];
  complaints: string[];
  suggestions: string[];
  quickWins: string[];
  openQuestions: string[];
  needsReview?: boolean;
  rawText?: string;
}

export interface CompanyBasisDoc {
  docId: string;
  title: string;
  extractedText: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
}

export interface ConsolidatedReport {
  reportId: string;
  title: string;
  generatedAt: string;
  summaryCount: number;
  painPointsByArea: Record<
    string,
    Array<{
      description: string;
      severity: 'low' | 'medium' | 'high';
      reportedByRole: string;
      summaryId: string;
    }>
  >;
  executiveNarrative: string;
  modelUsed: string;
}

export interface ThreatSummaryItem {
  threat: string;
  zone: 'Input Surfaces' | 'Planning & Reasoning' | 'Tool Execution' | 'Memory & State' | 'Inter-System Communication';
  affectedComponent: string;
  countermeasure: string;
}
