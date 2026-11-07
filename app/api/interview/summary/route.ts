import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { generateContentWithFallback } from '@/lib/server/gemini';
import { buildSummaryExtractionPrompt } from '@/server/prompts/auditInterview';
import { AuditSummary } from '@/lib/types';
import { saveSummaryToFirestore, saveSessionToFirestore } from '@/lib/firestore-service';

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const rawBody = await req.json().catch(() => ({}));
    const data = rawBody && typeof rawBody === 'object' ? rawBody : {};

    const sessionId = (data.sessionId || '').trim();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    const interactions = auditStore.getUserInteractions(user.userId, sessionId);
    if (interactions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot summarize empty session without interactions.' },
        { status: 400 }
      );
    }

    const profile = auditStore.getProfile(user.userId) || {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      roleInCompany: 'Software Engineer',
      jobFunction: 'Core Scraper Maintenance',
      createdAt: new Date().toISOString()
    };

    const conversationHistory: Array<{ role: 'user' | 'model'; content: string }> = [];
    interactions.forEach((i) => {
      conversationHistory.push({ role: 'user', content: i.userPrompt });
      conversationHistory.push({ role: 'model', content: i.geminiResponse });
    });

    const extractionPrompt = buildSummaryExtractionPrompt(conversationHistory, {
      userRole: profile.roleInCompany,
      jobFunction: profile.jobFunction,
      displayName: profile.displayName,
      companyBasisDocs: []
    });

    let rawJsonText = '';
    let parsed: any = null;
    let needsReview = false;

    try {
      const result = await generateContentWithFallback(
        extractionPrompt,
        'You are a JSON synthesis engine. Output valid RFC 8259 JSON only without markdown formatting.'
      );
      rawJsonText = (result.text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(rawJsonText);
    } catch (parseErr) {
      // Retry once per Section 6
      try {
        const retryResult = await generateContentWithFallback(
          `Fix and format the following text into valid JSON with fields processArea, processSteps, painPoints, complaints, suggestions, quickWins, openQuestions:\n\n${rawJsonText}`,
          'Output valid JSON only.'
        );
        const cleaned = (retryResult.text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (finalErr) {
        needsReview = true;
      }
    }

    const summary: AuditSummary = {
      summaryId: `sum-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.userId,
      userName: profile.displayName,
      userRole: profile.roleInCompany,
      sessionId,
      createdAt: new Date().toISOString(),
      processArea: parsed?.processArea || 'Scraper Maintenance',
      processSteps: Array.isArray(parsed?.processSteps) ? parsed.processSteps : [],
      painPoints: Array.isArray(parsed?.painPoints)
        ? parsed.painPoints.map((p: any) => ({
            description: String(p.description || ''),
            impact: String(p.impact || ''),
            severity: ['low', 'medium', 'high'].includes(p.severity) ? p.severity : 'medium',
            frequency: String(p.frequency || 'sporadic')
          }))
        : [],
      complaints: Array.isArray(parsed?.complaints) ? parsed.complaints : [],
      suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions : [],
      quickWins: Array.isArray(parsed?.quickWins) ? parsed.quickWins : [],
      openQuestions: Array.isArray(parsed?.openQuestions) ? parsed.openQuestions : [],
      needsReview,
      rawText: needsReview ? rawJsonText : undefined
    };

    const saved = auditStore.saveSummary(summary);

    // Persist summary to Cloud Firestore: users/{userId}/summaries/{summaryId}
    await saveSummaryToFirestore(saved).catch(console.error);

    // Update and persist session status as completed
    const existingSession = auditStore.getSession(sessionId);
    if (existingSession) {
      existingSession.status = 'completed';
      existingSession.summaryId = saved.summaryId;
      existingSession.updatedAt = new Date().toISOString();
      auditStore.saveSession(existingSession);

      // Persist completed status to Cloud Firestore: users/{userId}/sessions/{sessionId}
      await saveSessionToFirestore(existingSession).catch(console.error);
    }

    return NextResponse.json({ success: true, summary: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
