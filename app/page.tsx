'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  CheckSquare,
  ShieldCheck,
  QrCode,
  GraduationCap,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === 'STUDENT') router.push('/student/dashboard');
      else if (role === 'TEACHER') router.push('/teacher/dashboard');
      else if (role === 'ADMIN') router.push('/admin/dashboard');
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200/80 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">AttendX</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#security" className="hover:text-slate-900">Security</a>
          <a href="#roles" className="hover:text-slate-900">Role Portals</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            Student Signup
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready Student Attendance Management System</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl leading-tight">
          Reliable campus attendance with real-time accuracy.
        </h1>

        <p className="mt-4 text-sm md:text-base text-slate-500 max-w-xl leading-relaxed">
          Comprehensive, auditable attendance tracking powered by Supabase PostgreSQL, QR sessions,
          consecutive class calculators, leave workflows, and role-based portals for Students, Teachers, and Admins.
        </p>

        {/* Portals Quick Launcher */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <Link
            href={user ? (role === 'STUDENT' ? '/student/dashboard' : '/login') : '/login'}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 flex items-center justify-between">
              <span>Student Portal</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live statistics, low attendance alert, QR scanner, calendar, leave requests.
            </p>
          </Link>

          <Link
            href={user ? (role === 'TEACHER' ? '/teacher/dashboard' : '/login') : '/login'}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center justify-between">
              <span>Teacher Portal</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Session management, QR generation, roll-based attendance, reports export.
            </p>
          </Link>

          <Link
            href={user ? (role === 'ADMIN' ? '/admin/dashboard' : '/login') : '/login'}
            className="p-5 rounded-xl border border-slate-200 bg-white hover:border-rose-500 hover:shadow-md transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 flex items-center justify-between">
              <span>Admin Console</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Campus departments, classes, subjects, teacher assignments, timetable & audit logs.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>© 2026 AttendX. Built with Next.js, React, Supabase PostgreSQL, and Spring Boot architecture.</p>
      </footer>
    </div>
  );
}
