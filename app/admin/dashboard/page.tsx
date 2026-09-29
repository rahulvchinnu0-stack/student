'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Building2,
  Layers,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Settings,
  History,
  Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const totalStudents = db.students.filter((s) => s.active).length;
  const totalTeachers = db.teachers.filter((t) => t.active).length;
  const totalDepartments = db.departments.filter((d) => d.active).length;
  const totalClasses = db.classes.filter((c) => c.active).length;
  const totalSubjects = db.subjects.filter((s) => s.active).length;
  const todaySessions = db.sessions.filter((s) => s.session_date === '2026-09-29').length;
  const pendingLeaves = db.leaveRequests.filter((l) => l.status === 'PENDING').length;

  // Calculate Campus Average Attendance
  let totalAttended = 0;
  let totalCounted = 0;
  db.records.forEach((r) => {
    if (r.status === 'PRESENT' || r.status === 'LATE') totalAttended++;
    if (r.status === 'PRESENT' || r.status === 'ABSENT' || r.status === 'LATE') totalCounted++;
  });
  const campusAverage = totalCounted > 0 ? Math.round((totalAttended / totalCounted) * 10000) / 100 : 82.5;

  // Count students below threshold
  const threshold = db.settings.attendance_threshold;
  const lowAttendanceCount = db.students.filter((st) => {
    const stats = db.getStudentOverallStats(st.id);
    return stats.percentage < threshold;
  }).length;

  const recentAudit = db.auditLogs.slice(0, 5);

  return (
    <DashboardLayout
      title="Dean & Administrator Console"
      subtitle="Institutional governance, department management, academic audits, and campus attendance metrics"
    >
      <div className="space-y-6">
        {/* Core Campus Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Active Students</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {totalStudents}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Total enrolled across departments</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Faculty Members</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {totalTeachers}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Instructors & department chairs</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Campus Attendance</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-blue-600 tabular-nums">
                {campusAverage}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Minimum threshold: {threshold}%</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>At-Risk Students</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-rose-600 tabular-nums">
                {lowAttendanceCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Below {threshold}% requirement</span>
          </div>
        </div>

        {/* Secondary Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs text-xs">
          <div className="border-r border-slate-100 pr-3">
            <span className="text-slate-400 block text-[11px]">Academic Departments</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{totalDepartments}</span>
          </div>
          <div className="border-r border-slate-100 pr-3">
            <span className="text-slate-400 block text-[11px]">Active Class Sections</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{totalClasses}</span>
          </div>
          <div className="border-r border-slate-100 pr-3">
            <span className="text-slate-400 block text-[11px]">Courses & Subjects</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{totalSubjects}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pending Leave Inquiries</span>
            <span className="text-lg font-bold text-purple-700 tabular-nums">{pendingLeaves}</span>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/students"
            className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Manage Students</h4>
                <p className="text-[11px] text-slate-500">Enrollment & roll numbers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/timetable"
            className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Timetable Scheduler</h4>
                <p className="text-[11px] text-slate-500">Conflict-checked allocations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">System Policies</h4>
                <p className="text-[11px] text-slate-500">Threshold & QR expiry</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Audit Log Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-900">Recent System Audit Trail</h3>
            </div>
            <Link href="/admin/audit-logs" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View All Logs
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentAudit.map((log) => {
              const actor = db.profiles.find((p) => p.id === log.actor_id);
              return (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="font-mono font-bold text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mr-2">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {actor?.full_name || 'System / Service'}
                    </span>
                    <span className="text-slate-400 ml-2">
                      on {log.entity_type} {log.entity_id ? `(#${log.entity_id.substring(0, 8)})` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
