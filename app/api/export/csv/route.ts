import { NextRequest, NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';
import { getSessionUser } from '@/lib/server/auth';
import { sanitizeSpreadsheetCell } from '@/lib/threat-model';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    const summaries = user.isSuperAdmin
      ? auditStore.getAllSummaries(user.email)
      : auditStore.getUserSummaries(user.userId);

    const headers = [
      'Summary ID',
      'Process Area',
      'Reported By Role',
      'Pain Point Description',
      'Impact',
      'Severity',
      'Frequency',
      'Date Recorded'
    ];

    const rows: string[][] = [];

    summaries.forEach((s) => {
      s.painPoints.forEach((p) => {
        rows.push([
          sanitizeSpreadsheetCell(s.summaryId),
          sanitizeSpreadsheetCell(s.processArea),
          sanitizeSpreadsheetCell(s.userRole),
          sanitizeSpreadsheetCell(p.description),
          sanitizeSpreadsheetCell(p.impact),
          sanitizeSpreadsheetCell(p.severity),
          sanitizeSpreadsheetCell(p.frequency),
          sanitizeSpreadsheetCell(s.createdAt)
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r
          .map((c) => {
            const escaped = String(c).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
    ].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="aimyscrape_audit_painpoints_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
