import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { saveSessionToFirestore } from '@/lib/firestore-service';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const sessions = auditStore.getUserSessions(user.userId);
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const rawBody = await req.json().catch(() => ({}));
    const data = rawBody && typeof rawBody === 'object' ? rawBody : {};

    const customTopic = typeof data.topic === 'string' ? data.topic.trim().slice(0, 150) : '';
    const requestedSessionId = typeof data.sessionId === 'string' && data.sessionId.trim() ? data.sessionId.trim() : null;
    const newSessionId = requestedSessionId || `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Strictly save session entity
    const saved = auditStore.saveSession({
      sessionId: newSessionId,
      userId: user.userId,
      topic: customTopic || 'General Process Audit',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interactionCount: 0,
      firstPrompt: customTopic || 'General Process Audit'
    });

    // Also persist directly to Cloud Firestore: users/{userId}/sessions/{sessionId}
    await saveSessionToFirestore(saved).catch(console.error);

    return NextResponse.json({
      success: true,
      session: saved,
      sessionId: saved.sessionId,
      topic: saved.topic,
      createdAt: saved.createdAt
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
