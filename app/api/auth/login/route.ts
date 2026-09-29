import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase';
import { AppRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, intendedRole } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid institutional email address.' },
        { status: 400 }
      );
    }

    if (!intendedRole || !['STUDENT', 'TEACHER', 'ADMIN'].includes(intendedRole)) {
      return NextResponse.json(
        { success: false, message: 'Please select your intended login role (Student, Teacher, or Admin).' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. First, validate credentials and role comparison against the authoritative database profile
    const result = db.validateLogin(normalizedEmail, password, intendedRole as AppRole);

    if (!result.success) {
      // 403 Forbidden for role mismatch or account deactivated
      const status = result.actualRole ? 403 : 401;
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          actualRole: result.actualRole,
        },
        { status }
      );
    }

    // 2. If Supabase is configured, synchronize / sign in with Supabase Auth in the background
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabase();
        if (supabase && password) {
          const { error: supaErr } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          // If user does not exist in Supabase Auth yet, auto-provision them
          if (supaErr && (supaErr.message?.toLowerCase().includes('invalid login credentials') || supaErr.message?.toLowerCase().includes('user not found'))) {
            await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  role: result.profile!.role,
                  full_name: result.profile!.full_name,
                },
              },
            });
          }
        }
      } catch (supaEx) {
        // Non-fatal error; proceed with authenticated profile session
        console.warn('Supabase Auth synchronization notice:', supaEx);
      }
    }

    const role = result.profile!.role;
    let redirectUrl = '/student/dashboard';
    if (role === 'TEACHER') redirectUrl = '/teacher/dashboard';
    if (role === 'ADMIN') redirectUrl = '/admin/dashboard';

    return NextResponse.json({
      success: true,
      profile: result.profile,
      student: result.student,
      teacher: result.teacher,
      role,
      redirectUrl,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Authentication service error';
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
