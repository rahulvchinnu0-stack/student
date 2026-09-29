'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  Download,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@/lib/types';
import { StatusBadge } from '@/components/UI/Badge';
import { exportToCSV, exportToXLSX, exportToPDF } from '@/lib/exportUtils';

function StudentAttendanceContent() {
  const { student, user } = useAuth();
  const searchParams = useSearchParams();
  const studentId = student?.id || 'stu-rahul';

  const [selectedSubject, setSelectedSubject] = useState(searchParams?.get('subject') || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const subjects = db.subjects;

  const rawRecords = useMemo(() => {
    return db.getStudentAttendance(studentId, {
      subjectId: selectedSubject,
      status: selectedStatus === 'ALL' ? undefined : (selectedStatus as AttendanceStatus),
      month: selectedMonth === 'ALL' ? undefined : selectedMonth,
    });
  }, [studentId, selectedSubject, selectedStatus, selectedMonth]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return rawRecords;
    const term = searchTerm.toLowerCase();
    return rawRecords.filter(
      (r) =>
        r.subject_name.toLowerCase().includes(term) ||
        r.teacher_name.toLowerCase().includes(term) ||
        r.session_date.includes(term) ||
        (r.note && r.note.toLowerCase().includes(term))
    );
  }, [rawRecords, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Filtered stats
  const filteredStats = useMemo(() => {
    let p = 0,
      a = 0,
      l = 0,
      e = 0;
    filteredRecords.forEach((r) => {
      if (r.status === 'PRESENT') p++;
      else if (r.status === 'ABSENT') a++;
      else if (r.status === 'LATE') l++;
      else if (r.status === 'EXCUSED') e++;
    });
    const attended = p + l;
    const counted = p + a + l;
    const pct = counted > 0 ? Math.round((attended / counted) * 10000) / 100 : 100;
    return { p, a, l, e, attended, counted, pct };
  }, [filteredRecords]);

  // Export Data Handler
  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const exportRows = filteredRecords.map((r) => ({
      studentId: student?.student_id || 'STU-202601',
      studentName: user?.full_name || 'Rahul Varma',
      className: 'BCA 5A',
      subjectName: r.subject_name,
      date: r.session_date,
      status: r.status,
      teacherName: r.teacher_name,
      note: r.note,
    }));

    if (format === 'csv') exportToCSV(exportRows, 'my_attendance_records.csv');
    else if (format === 'xlsx') exportToXLSX(exportRows, 'my_attendance_records.xlsx');
    else
      exportToPDF(
        exportRows,
        {
          title: 'Student Attendance Transcript',
          classInfo: 'BCA 5A - Semester 5',
          generatedBy: user?.full_name,
          threshold: '75.00%',
        },
        'my_attendance_records.pdf'
      );
  };

  return (
    <DashboardLayout
      title="Attendance Records"
      subtitle="View, filter and export your complete historical class attendance data"
    >
      <div className="space-y-5">
        {/* Filters Header Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Subject Select */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name} ({s.subject_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Status Filter
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
                <option value="LATE">Late Only</option>
                <option value="EXCUSED">Excused Only</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Months</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Date, faculty, notes..."
                  className="w-full text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Quick Stats of Filtered Selection & Export */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-600">
              <span>
                Matching: <strong className="text-slate-900 tabular-nums">{filteredRecords.length}</strong> classes
              </span>
              <span>·</span>
              <span>
                Attended: <strong className="text-emerald-700 tabular-nums">{filteredStats.attended}</strong>
              </span>
              <span>·</span>
              <span>
                Missed: <strong className="text-rose-700 tabular-nums">{filteredStats.a}</strong>
              </span>
              <span>·</span>
              <span>
                Percentage:{' '}
                <strong
                  className={`tabular-nums ${
                    filteredStats.pct < 75 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {filteredStats.pct}%
                </strong>
              </span>
            </div>

            {/* Export Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Export:</span>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors"
              >
                XLSX
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-900 font-medium">
                        {r.session_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{r.subject_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{r.subject_code}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.teacher_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {r.start_time} - {r.end_time}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">{r.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page <strong className="text-slate-900 tabular-nums">{currentPage}</strong> of{' '}
                <strong className="text-slate-900 tabular-nums">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function StudentAttendancePage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Attendance Records">
          <div className="p-8 text-center text-xs text-slate-400">Loading attendance data...</div>
        </DashboardLayout>
      }
    >
      <StudentAttendanceContent />
    </Suspense>
  );
}

