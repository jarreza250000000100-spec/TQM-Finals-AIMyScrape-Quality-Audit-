import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);

    // Test Case 8: Admin Denied to Users -> 403
    if (!user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Super Admin credentials required.' },
        { status: 403 }
      );
    }

    const summaries = auditStore.getAllSummaries(user.email);
    const interactions = auditStore.getAllInteractionsForAdmin(user.email);

    return NextResponse.json({
      success: true,
      summaries,
      interactions
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Test Case 16: Admin Read-Only -> try to edit or delete user interaction -> DENIED
export async function DELETE(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Immutability violation: Super Admin has read-only access to employee interactions and cannot edit or delete audit logs.'
    },
    { status: 403 }
  );
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Immutability violation: Interactions are append-only. Mutation of recorded employee interviews is strictly forbidden.'
    },
    { status: 403 }
  );
}
