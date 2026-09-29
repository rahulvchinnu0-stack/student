import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, qr_token } = body;

    if (!student_id || !qr_token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Both student_id and qr_token are strictly required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const verification = db.verifyAndMarkQRAttendance(student_id, qr_token);

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          message: verification.message,
          code: verification.code || 'VERIFICATION_FAILED',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: verification.session?.id,
        status: 'PRESENT',
        message: verification.message,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while processing QR validation.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
