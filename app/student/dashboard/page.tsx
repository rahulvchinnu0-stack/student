'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  AlertTriangle,
  QrCode,
  FileText,
  Calculator,
  ArrowRight,
  TrendingUp,
  Clock,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { calculateRequiredClasses } from '@/lib/types';
import { StatusBadge } from '@/components/UI/Badge';

export default function StudentDashboardPage() {
  const { student, user } = useAuth();
  const studentId = student?.id || 'stu-rahul';
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const overallStats = db.getStudentOverallStats(studentId);
  const subjectStats = db.getStudentSubjectStats(studentId);
  const settings = db.settings;
  const recentRecords = db.getStudentAttendance(studentId).slice(0, 5);

  const lowAttendanceSubjects = subjectStats.filter((s) => s.isBelowThreshold);

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Student'}`}
      subtitle="Overview of your academic attendance records and requirements"
    >
      <div className="space-y-6">
        {/* Low Attendance Warning Alert if below threshold */}
        {lowAttendanceSubjects.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Low Attendance Warning
                </h4>
                <div className="text-xs text-amber-800 mt-0.5 space-y-0.5">
                  {lowAttendanceSubjects.map(({ subject, stats }) => {
                    const calc = calculateRequiredClasses(
                      stats.attendedCount,
                      stats.countedCount,
                      settings.attendance_threshold
                    );
                    return (
                      <p key={subject.id}>
                        Your <strong>{subject.subject_name}</strong> attendance is{' '}
                        <span className="font-bold tabular-nums text-rose-700">{stats.percentage}%</span>.
                        Required threshold is <span className="tabular-nums">{settings.attendance_threshold}%</span>. {calc.message}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link
              href="/student/calculator"
              className="px-3.5 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculator</span>
            </Link>
          </div>
        )}

        {/* Top Summary Metrics Card */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Main Percentage Metric */}
          <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Attendance
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {overallStats.percentage}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Threshold:</span>
              <span className="font-semibold text-slate-700 tabular-nums">{settings.attendance_threshold}%</span>
            </div>
          </div>

          {/* Present Count */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Present
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tabular-nums">
                {overallStats.presentCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Regular classes attended</span>
          </div>

          {/* Absent Count */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Absent
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold text-rose-600 tabular-nums">
                {overallStats.absentCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Recorded unexcused misses</span>
          </div>

          {/* Late Count */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Late
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums">
                {overallStats.lateCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Counted as attended</span>
          </div>

          {/* Excused Count */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Excused
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold text-purple-600 tabular-nums">
                {overallStats.excusedCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Excluded from denominator</span>
          </div>
        </div>

        {/* Quick Action Navigation Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/student/scan"
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Scan Attendance QR</h4>
              <p className="text-[11px] text-indigo-100 truncate mt-0.5">Use camera for live check-in</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/student/leave"
            className="flex items-center gap-3 p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Submit Leave Request</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Medical or academic leave</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/student/timetable"
            className="flex items-center gap-3 p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Weekly Timetable</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">View today&apos;s lecture schedule</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Subject-Wise Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Subject-Wise Breakdown</h3>
            <span className="text-xs text-slate-400">Total Counted: {overallStats.countedCount} sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectStats.map(({ subject, stats, isBelowThreshold }) => (
              <div
                key={subject.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                  isBelowThreshold ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block">{subject.subject_code}</span>
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{subject.subject_name}</h4>
                  </div>
                  {isBelowThreshold && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      Low
                    </span>
                  )}
                </div>

                <div className="my-3 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      isBelowThreshold ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {stats.percentage}%
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {stats.attendedCount} / {stats.countedCount} classes
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${
                      isBelowThreshold ? 'bg-rose-500' : stats.percentage >= 85 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
                  />
                </div>

                {/* Detail Counts Breakdown */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-4 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block">P</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{stats.presentCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">A</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{stats.absentCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">L</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{stats.lateCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">E</span>
                    <span className="font-semibold text-slate-700 tabular-nums">{stats.excusedCount}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                  <Link
                    href={`/student/attendance?subject=${subject.id}`}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                  >
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance Log Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Recent Attendance History</h3>
              <p className="text-[11px] text-slate-400">Latest class sessions recorded for your enrollment</p>
            </div>
            <Link
              href="/student/attendance"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Faculty</th>
                  <th className="py-2.5 px-4">Timing</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums text-slate-900">{r.session_date}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{r.subject_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.teacher_name}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {r.start_time} - {r.end_time}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-400 italic">{r.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
