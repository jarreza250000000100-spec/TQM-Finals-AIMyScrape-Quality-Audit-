import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    // Test Case 7: As user B, request user A's interactions by path or ID. Expected: permission denied.
    if (targetUserId && targetUserId !== user.userId && !user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Cannot inspect another user\'s private interview history.' },
        { status: 403 }
      );
    }

    const effectiveUserId = targetUserId && user.isSuperAdmin ? targetUserId : user.userId;
    const sessionId = searchParams.get('sessionId') || undefined;
    const interactions = auditStore.getUserInteractions(effectiveUserId, sessionId);
    const summaries = auditStore.getUserSummaries(effectiveUserId);
    const sessions = auditStore.getUserSessions(effectiveUserId);

    return NextResponse.json({
      success: true,
      interactions,
      summaries,
      sessions
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
