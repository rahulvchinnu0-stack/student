'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  Users,
  Calendar,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@/lib/types';

function TeacherAttendanceMarkingContent() {
  const { teacher, user } = useAuth();
  const searchParams = useSearchParams();
  const teacherId = teacher?.id || 'tch-sharma';

  const assignments = db.assignments.filter((a) => a.teacher_id === teacherId && a.active);
  const classes = db.classes;
  const subjects = db.subjects;

  const [selectedClassId, setSelectedClassId] = useState(
    searchParams?.get('classId') || assignments[0]?.class_id || classes[0].id
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    searchParams?.get('subjectId') || assignments[0]?.subject_id || subjects[0].id
  );
  const [sessionDate, setSessionDate] = useState('2026-09-29');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Enrolled students for selected class
  const classStudents = useMemo(() => {
    const enrollments = db.enrollments.filter(
      (e) => e.class_id === selectedClassId && e.active
    );
    return enrollments
      .map((enr) => {
        const studentObj = db.students.find((s) => s.id === enr.student_id);
        const profileObj = studentObj
          ? db.profiles.find((p) => p.id === studentObj.profile_id)
          : undefined;
        return {
          enrollment: enr,
          student: studentObj,
          profile: profileObj,
        };
      })
      .filter((item) => item.student && item.profile)
      .sort((a, b) => a.enrollment.roll_number.localeCompare(b.enrollment.roll_number));
  }, [selectedClassId]);

  // Existing session records if already present
  const existingSession = useMemo(() => {
    return db.sessions.find(
      (s) =>
        s.class_id === selectedClassId &&
        s.subject_id === selectedSubjectId &&
        s.session_date === sessionDate
    );
  }, [selectedClassId, selectedSubjectId, sessionDate]);

  // Attendance user overrides map: student_id -> { status, note }
  const [overrides, setOverrides] = useState<
    Record<string, { status?: AttendanceStatus; note?: string }>
  >({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const getStudentValues = (studentId: string) => {
    const ov = overrides[studentId];
    if (ov?.status !== undefined) {
      return { status: ov.status, note: ov.note ?? '' };
    }
    if (existingSession) {
      const rec = db.records.find((r) => r.session_id === existingSession.id && r.student_id === studentId);
      if (rec) {
        return { status: rec.status, note: ov?.note ?? rec.note ?? '' };
      }
    }
    return { status: 'PRESENT' as AttendanceStatus, note: ov?.note ?? '' };
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach(({ student }) => {
      if (!student) return;
      const cur = getStudentValues(student.id);
      updated[student.id] = {
        status,
        note: cur.note,
      };
    });
    setOverrides(updated);
  };

  const handleReset = () => {
    setOverrides({});
  };

  const handleSaveAttendance = () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Find or create session
      let session = db.sessions.find(
        (s) =>
          s.class_id === selectedClassId &&
          s.subject_id === selectedSubjectId &&
          s.session_date === sessionDate
      );

      if (!session) {
        session = db.createAttendanceSession({
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          teacher_id: teacherId,
          session_date: sessionDate,
          start_time: startTime,
          end_time: endTime,
        });
      }

      // Convert to records array
      const recordItems = classStudents
        .filter((item) => item.student)
        .map(({ student }) => {
          const val = getStudentValues(student!.id);
          return {
            student_id: student!.id,
            status: val.status,
            note: val.note,
          };
        });

      db.markSessionAttendance(session.id, user?.id || 'teacher', recordItems);

      setIsSaving(false);
      setSaveMessage({
        type: 'success',
        text: `Attendance saved successfully for ${recordItems.length} students! Database synchronized.`,
      });
    } catch {
      setIsSaving(false);
      setSaveMessage({
        type: 'error',
        text: 'Failed to record attendance session. Please check your inputs.',
      });
    }
  };

  return (
    <DashboardLayout
      title="Mark Class Attendance"
      subtitle="Take manual class roll-call, edit live statuses, and commit attendance records"
    >
      <div className="space-y-6">
        {/* Controls Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Class */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name} ({s.subject_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Action Bar (Mark All, Reset, Save) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Batch Actions:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAttendance}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Committing...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Enrolled Students Roster</h3>
            <span className="text-[11px] text-slate-400">Total: {classStudents.length} Students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-28">Roll No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 w-72 text-center">Status</th>
                  <th className="py-3 px-4">Optional Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {classStudents.map(({ enrollment, student, profile }) => {
                  if (!student || !profile) return null;
                  const { status: currentStatus, note: currentNote } = getStudentValues(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {enrollment.roll_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{profile.full_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{student.student_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => {
                            const isSelected = currentStatus === st;
                            let activeClass = 'bg-slate-900 text-white';
                            if (st === 'PRESENT') activeClass = 'bg-emerald-600 text-white';
                            if (st === 'ABSENT') activeClass = 'bg-rose-600 text-white';
                            if (st === 'LATE') activeClass = 'bg-amber-600 text-white';
                            if (st === 'EXCUSED') activeClass = 'bg-purple-600 text-white';

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(student.id, st)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all ${
                                  isSelected
                                    ? `${activeClass} shadow-xs scale-102`
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st === 'PRESENT' && 'P'}
                                {st === 'ABSENT' && 'A'}
                                {st === 'LATE' && 'L'}
                                {st === 'EXCUSED' && 'E'}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="Add remark..."
                          className="w-full text-xs py-1 px-2.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function TeacherAttendanceMarkingPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Mark Class Attendance">
          <div className="p-8 text-center text-xs text-slate-400">Loading class roster...</div>
        </DashboardLayout>
      }
    >
      <TeacherAttendanceMarkingContent />
    </Suspense>
  );
}

