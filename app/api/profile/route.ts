import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { saveProfileToFirestore, getProfileFromFirestore } from '@/lib/firestore-service';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    let profile = auditStore.getProfile(user.userId) || auditStore.getProfileByEmail(user.email);
    if (!profile) {
      profile = await getProfileFromFirestore(user.userId).catch(() => null);
      if (profile) {
        auditStore.saveProfile(profile);
      }
    }
    return NextResponse.json({ success: true, profile, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const rawBody = await req.json().catch(() => ({}));
    const data = rawBody && typeof rawBody === 'object' ? rawBody : {};

    // Input Validation (OWASP A03 / Directive 2)
    const displayName = (data.displayName || '').trim().slice(0, 100);
    const roleInCompany = (data.roleInCompany || '').trim().slice(0, 100);
    const jobFunction = (data.jobFunction || '').trim().slice(0, 300);

    if (!displayName) {
      return NextResponse.json(
        { success: false, error: 'Display Name is required.' },
        { status: 400 }
      );
    }

    if (!roleInCompany) {
      return NextResponse.json(
        { success: false, error: 'Role in Company is required.' },
        { status: 400 }
      );
    }

    if (!jobFunction) {
      return NextResponse.json(
        { success: false, error: 'Job Function description is required.' },
        { status: 400 }
      );
    }

    const saved = auditStore.saveProfile({
      userId: user.userId,
      email: user.email,
      displayName,
      roleInCompany,
      jobFunction,
      createdAt: new Date().toISOString()
    });

    // Also persist directly to Firestore: users/{userId}
    await saveProfileToFirestore(saved).catch(console.error);

    return NextResponse.json({ success: true, profile: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
