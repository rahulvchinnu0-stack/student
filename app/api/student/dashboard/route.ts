import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id') || 'stu-rahul';

  const overall = db.getStudentOverallStats(studentId);
  const subjects = db.getStudentSubjectStats(studentId);
  const settings = db.settings;
  const recentRecords = db.getStudentAttendance(studentId).slice(0, 5);

  return NextResponse.json({
    success: true,
    data: {
      overall,
      subjects,
      threshold: settings.attendance_threshold,
      recentRecords,
    },
  });
}
