import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { AppRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      confirmPassword,
      role = 'STUDENT',
      studentId,
      teacherId,
      phone,
      inviteCode,
    } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please provide your full legal name.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters in length.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // Role Security Rules:
    // 1. ADMIN signup is STRICTLY prohibited publicly
    if (role === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Direct administrator registration is prohibited. Admin accounts must be provisioned by existing administrators.',
        },
        { status: 403 }
      );
    }

    // 2. TEACHER requires authorized faculty code
    if (role === 'TEACHER') {
      const validFacultyCodes = ['FACULTY-2026', 'TEACHER-INVITE-2026', 'DEPT-CAE-TEACHER', 'ATTENDX-FACULTY'];
      const code = (inviteCode || '').trim().toUpperCase();
      if (!code || !validFacultyCodes.includes(code)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Teacher registration requires a valid Faculty Authorization Code. Contact your Department Head or Academic Administrator.',
          },
          { status: 403 }
        );
      }
    }

    // If Supabase Auth is configured, register user in Supabase Auth
    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        const { error: supaErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
              phone: phone || '',
            },
          },
        });

        if (supaErr) {
          return NextResponse.json(
            { success: false, message: supaErr.message },
            { status: 400 }
          );
        }
      }
    }

    // Create database profile and linked role record
    const result = db.registerAccount({
      fullName,
      email,
      password,
      confirmPassword,
      role: role as AppRole,
      studentId,
      teacherId,
      phone,
      inviteCode,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const assignedRole = result.profile!.role;
    const redirectUrl = assignedRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';

    return NextResponse.json({
      success: true,
      profile: result.profile,
      student: result.student,
      teacher: result.teacher,
      role: assignedRole,
      redirectUrl,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
