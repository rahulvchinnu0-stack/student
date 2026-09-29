import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  // In a production setup, user UUID is extracted from the Authorization: Bearer <supabase-access-token> header
  const authHeader = req.headers.get('authorization');
  const userId = req.headers.get('x-user-id') || 'usr-student-1';

  const profile = db.getProfileById(userId);
  if (!profile) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const student = profile.role === 'STUDENT' ? db.getStudentByProfileId(profile.id) : null;
  const teacher = profile.role === 'TEACHER' ? db.getTeacherByProfileId(profile.id) : null;

  return NextResponse.json({
    success: true,
    data: {
      profile,
      student,
      teacher,
    },
  });
}
