import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { saveCompanyBasisToFirestore } from '@/lib/firestore-service';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.csv', '.docx'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function GET(req: NextRequest) {
  try {
    const docs = auditStore.getCompanyBasisDocs();
    return NextResponse.json({ success: true, docs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    if (!user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only Super Admin can upload company basis documents.' },
        { status: 403 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const data = rawBody && typeof rawBody === 'object' ? rawBody : {};

    const fileName = (data.fileName || '').trim();
    const extractedText = (data.extractedText || data.content || '').trim();
    const fileSize = Number(data.fileSize) || extractedText.length;

    // Test Case 10: Disallowed file type or oversized file
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload rejected: File extension '${ext || 'unknown'}' is not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.`
        },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload rejected: File size exceeds the maximum allowed limit of 5MB (Received: ${(fileSize / (1024 * 1024)).toFixed(2)}MB).`
        },
        { status: 400 }
      );
    }

    if (!extractedText) {
      return NextResponse.json(
        { success: false, error: 'Document content cannot be empty.' },
        { status: 400 }
      );
    }

    const doc = auditStore.addCompanyBasisDoc(user.email, {
      title: (data.title || fileName || 'Uploaded Document').trim().slice(0, 150),
      extractedText,
      fileSize
    });

    // Also persist directly to Firestore: companyBasis/{docId}
    await saveCompanyBasisToFirestore(doc).catch(console.error);

    return NextResponse.json({ success: true, doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    if (!user.isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId');
    if (!docId) {
      return NextResponse.json({ success: false, error: 'Missing docId' }, { status: 400 });
    }

    const deleted = auditStore.deleteCompanyBasisDoc(user.email, docId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
