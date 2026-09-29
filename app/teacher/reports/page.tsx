'use client';

import React, { useState, useMemo } from 'react';
import { Download, Filter, Search, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@/lib/types';
import { StatusBadge } from '@/components/UI/Badge';
import { exportToCSV, exportToXLSX, exportToPDF } from '@/lib/exportUtils';

export default function TeacherReportsPage() {
  const { user } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const classes = db.classes;
  const subjects = db.subjects;

  const rawData = useMemo(() => {
    return db.records.map((r) => {
      const sess = db.sessions.find((s) => s.id === r.session_id);
      const student = db.students.find((st) => st.id === r.student_id);
      const profile = student ? db.profiles.find((p) => p.id === student.profile_id) : undefined;
      const enr = student ? db.getStudentEnrollment(student.id) : undefined;
      const subj = sess ? db.subjects.find((sb) => sb.id === sess.subject_id) : undefined;
      const cls = sess ? db.classes.find((c) => c.id === sess.class_id) : undefined;
      const teacher = sess ? db.teachers.find((t) => t.id === sess.teacher_id) : undefined;
      const teacherProf = teacher ? db.profiles.find((p) => p.id === teacher.profile_id) : undefined;

      return {
        id: r.id,
        sessionId: r.session_id,
        studentId: student?.student_id || 'STU',
        studentName: profile?.full_name || 'Student',
        rollNumber: enr?.roll_number || '00',
        classId: sess?.class_id || '',
        className: cls ? `${cls.name} ${cls.section}` : 'Class',
        subjectId: sess?.subject_id || '',
        subjectName: subj?.subject_name || 'Subject',
        date: sess?.session_date || '',
        status: r.status,
        teacherName: teacherProf?.full_name || 'Faculty',
        note: r.note || '',
      };
    });
  }, []);

  const filteredRecords = useMemo(() => {
    return rawData.filter((r) => {
      if (selectedClassId !== 'ALL' && r.classId !== selectedClassId) return false;
      if (selectedSubjectId !== 'ALL' && r.subjectId !== selectedSubjectId) return false;
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      if (selectedMonth !== 'ALL' && !r.date.startsWith(selectedMonth)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !r.studentName.toLowerCase().includes(term) &&
          !r.rollNumber.toLowerCase().includes(term) &&
          !r.subjectName.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawData, selectedClassId, selectedSubjectId, selectedStatus, selectedMonth, searchTerm]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let p = 0, a = 0, l = 0, e = 0;
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

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const exportRows = filteredRecords.map((r) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      className: r.className,
      subjectName: r.subjectName,
      date: r.date,
      status: r.status,
      teacherName: r.teacherName,
      note: r.note,
    }));

    if (format === 'csv') exportToCSV(exportRows, 'academic_attendance_report.csv');
    else if (format === 'xlsx') exportToXLSX(exportRows, 'academic_attendance_report.xlsx');
    else
      exportToPDF(
        exportRows,
        {
          title: 'Official Academic Attendance Report',
          classInfo: selectedClassId !== 'ALL' ? `Class ID ${selectedClassId}` : 'All Sections',
          generatedBy: user?.full_name || 'Faculty Member',
          threshold: `${db.settings.attendance_threshold}%`,
        },
        'academic_attendance_report.pdf'
      );
  };

  return (
    <DashboardLayout
      title="Attendance Reports"
      subtitle="Audit, analyze and export verified attendance records to CSV, Excel, or PDF format"
    >
      <div className="space-y-6">
        {/* Filters Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">All Months</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Search Student
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or roll..."
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Export Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <span>
                Found: <strong className="text-slate-900 tabular-nums">{filteredRecords.length}</strong> logs
              </span>
              <span>·</span>
              <span>
                P: <strong className="text-emerald-700 tabular-nums">{stats.p}</strong>
              </span>
              <span>·</span>
              <span>
                A: <strong className="text-rose-700 tabular-nums">{stats.a}</strong>
              </span>
              <span>·</span>
              <span>
                L: <strong className="text-amber-700 tabular-nums">{stats.l}</strong>
              </span>
              <span>·</span>
              <span>
                E: <strong className="text-purple-700 tabular-nums">{stats.e}</strong>
              </span>
              <span>·</span>
              <span>
                Average:{' '}
                <strong className={`tabular-nums ${stats.pct < 75 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {stats.pct}%
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Export Format:</span>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
              >
                XLSX
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-900">{r.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.rollNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.className}</td>
                    <td className="py-3 px-4 text-slate-600">{r.subjectName}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.teacherName}</td>
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
