import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { generateContentWithFallback } from '@/lib/server/gemini';
import { ConsolidatedReport } from '@/lib/types';
import { saveConsolidatedReportToFirestore } from '@/lib/firestore-service';

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    if (!user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Super Admin credentials required.' },
        { status: 403 }
      );
    }

    const summaries = auditStore.getAllSummaries(user.email);
    if (summaries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No user summaries available to consolidate.' },
        { status: 400 }
      );
    }

    // Aggregate pain points by process area
    const painPointsByArea: ConsolidatedReport['painPointsByArea'] = {};

    summaries.forEach((sum) => {
      const area = sum.processArea || 'General Scraper Operations';
      if (!painPointsByArea[area]) {
        painPointsByArea[area] = [];
      }

      sum.painPoints.forEach((p) => {
        painPointsByArea[area].push({
          description: p.description,
          severity: p.severity,
          reportedByRole: sum.userRole,
          summaryId: sum.summaryId
        });
      });
    });

    // Generate executive narrative using Gemini with fallback ladder
    const consolidationPrompt = `You are the Lead Auditor synthesizing an executive cross-user audit report for AIMyScrape (SimpleCode AI) and Monetaria Group operations.

SUMMARIES COMPILED ACROSS EMPLOYEES:
${summaries
  .map(
    (s) =>
      `[Summary ID: ${s.summaryId}]
Role: ${s.userRole}
Process Area: ${s.processArea}
Steps: ${s.processSteps.join(' -> ')}
Pain Points: ${s.painPoints.map((p) => `${p.description} (${p.severity} severity)`).join('; ')}
Complaints: ${s.complaints.join('; ')}
Suggestions: ${s.suggestions.join('; ')}`
  )
  .join('\n\n')}

INSTRUCTIONS:
1. Provide an executive summary of systemic process bottlenecks across Scraper Maintenance, False-Zero Detection, NYSCEF Court Filings, and Runner Infrastructure.
2. DO NOT quote or blame individual employees by name. Cite findings strictly by Summary ID (e.g. "[sum-danilo-01]") and role.
3. Recommend prioritized architectural and operational reforms for the engineering leadership.`;

    const result = await generateContentWithFallback(
      consolidationPrompt,
      'You are a senior technical quality auditor for public-records API systems.'
    );

    const report: ConsolidatedReport = {
      reportId: `rep-${Date.now()}`,
      title: `AIMyScrape Executive Quality Audit Consolidation (${new Date().toLocaleDateString()})`,
      generatedAt: new Date().toISOString(),
      summaryCount: summaries.length,
      painPointsByArea,
      executiveNarrative: result.text,
      modelUsed: result.modelUsed
    };

    auditStore.saveConsolidatedReport(user.email, report);

    // Also persist directly to Cloud Firestore: auditReports/{reportId}
    await saveConsolidatedReportToFirestore(report).catch(console.error);

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
