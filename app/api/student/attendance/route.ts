import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id') || 'stu-rahul';
  const subjectId = searchParams.get('subject_id') || undefined;
  const status = (searchParams.get('status') as AttendanceStatus) || undefined;
  const month = searchParams.get('month') || undefined;

  const records = db.getStudentAttendance(studentId, {
    subjectId,
    status,
    month,
  });

  return NextResponse.json({
    success: true,
    data: records,
  });
}
