import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { generateContentWithFallback } from '@/lib/server/gemini';
import { buildAuditSystemInstruction } from '@/server/prompts/auditInterview';
import { inspectSensitiveData } from '@/lib/sensitive-data-guard';
import { saveInteractionToFirestore, saveSessionToFirestore } from '@/lib/firestore-service';

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const rawBody = await req.json().catch(() => ({}));
    const data = rawBody && typeof rawBody === 'object' ? rawBody : {};

    const userMessage = (data.message || '').trim().slice(0, 4000); // 4,000 char cap
    const sessionId = (data.sessionId || `sess-${Date.now()}`).trim();

    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    // 1. Sensitive Data Guard (Test Case 13 & 14)
    const inspection = inspectSensitiveData(userMessage);
    if (inspection.hasSecret) {
      // Test Case 13: Secrets blocked before saving
      return NextResponse.json(
        {
          success: false,
          error: inspection.secretReason || 'Input contains a detected secret or credential.'
        },
        { status: 400 }
      );
    }

    // 2. Fetch User Profile & Company Basis
    const profile = auditStore.getProfile(user.userId) || {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      roleInCompany: 'Software Engineer',
      jobFunction: 'Core scraper maintenance & public records API',
      createdAt: new Date().toISOString()
    };

    const companyBasisDocs = auditStore.getCompanyBasisDocs().map((d) => ({
      title: d.title,
      content: d.extractedText
    }));

    // 3. Retrieve past session interactions for multi-turn dialogue
    const pastInteractions = auditStore.getUserInteractions(user.userId, sessionId);

    // Build system instruction with strict delimiter boundaries
    const systemInstruction = buildAuditSystemInstruction({
      userRole: profile.roleInCompany,
      jobFunction: profile.jobFunction,
      displayName: profile.displayName,
      companyBasisDocs
    });

    // Build prompt with conversation history
    const conversationPrompt = pastInteractions.length > 0
      ? `PAST INTERVIEW DIALOGUE IN THIS SESSION:
${pastInteractions
  .map((i) => `Employee: ${i.userPrompt}\nAuditor: ${i.geminiResponse}`)
  .join('\n\n')}

Current Employee Reply: ${userMessage}

Respond as the quality auditor with a single focused follow-up question or reflection exploring this process area in depth.`
      : `The employee says: "${userMessage}"\n\nRespond as the quality auditor with your initial inquiry covering their process ownership.`;

    let geminiResponseText = '';
    let modelUsed = 'gemini-3.8-flash';
    let responseFailed = false;

    try {
      const result = await generateContentWithFallback(conversationPrompt, systemInstruction);
      geminiResponseText = result.text;
      modelUsed = result.modelUsed;
    } catch (genErr: any) {
      // Test Case 18: If Gemini fails, still save user message with responseFailed flag
      responseFailed = true;
      geminiResponseText = 'The auditor response could not be generated at this moment. Your message has been saved. Please retry.';
      modelUsed = 'failed';
    }

    // Save interaction immutably
    const interaction = auditStore.addInteraction({
      interactionId: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.userId,
      sessionId,
      userPrompt: userMessage,
      geminiResponse: geminiResponseText,
      modelUsed,
      timestamp: new Date().toISOString(),
      responseFailed
    });

    // Persist interaction to Firestore: users/{userId}/interactions/{interactionId}
    await saveInteractionToFirestore(interaction).catch(console.error);

    // Update and persist session metadata
    let existingSession = auditStore.getSession(sessionId);
    if (!existingSession) {
      existingSession = auditStore.saveSession({
        sessionId,
        userId: user.userId,
        topic: userMessage.slice(0, 100),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        interactionCount: 1,
        firstPrompt: userMessage
      });
    } else {
      existingSession.interactionCount = (existingSession.interactionCount || 0) + 1;
      existingSession.updatedAt = new Date().toISOString();
      if (!existingSession.firstPrompt || existingSession.firstPrompt === existingSession.topic) {
        existingSession.firstPrompt = userMessage;
      }
      auditStore.saveSession(existingSession);
    }

    // Persist updated session to Firestore: users/{userId}/sessions/{sessionId}
    await saveSessionToFirestore(existingSession).catch(console.error);

    return NextResponse.json({
      success: !responseFailed,
      interaction,
      modelUsed,
      warning: inspection.hasPersonalData ? inspection.personalDataReason : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
