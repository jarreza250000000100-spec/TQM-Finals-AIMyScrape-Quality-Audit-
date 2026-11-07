import { NextResponse } from 'next/server';
import { auditStore } from '@/lib/server/store';

export async function POST() {
  auditStore.resetToSeed();
  return NextResponse.json({
    success: true,
    message: 'Quality Audit store reset to initial seed state.'
  });
}
