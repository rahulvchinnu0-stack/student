'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  QrCode,
  Users,
  FileText,
  AlertTriangle,
  ArrowRight,
  Clock,
  Plus,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/UI/Badge';

export default function TeacherDashboardPage() {
  const { teacher, user } = useAuth();
  const teacherId = teacher?.id || 'tch-sharma';

  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const assignments = db.assignments.filter((a) => a.teacher_id === teacherId && a.active);
  const teacherSessions = db.sessions.filter((s) => s.teacher_id === teacherId);
  const activeSessions = teacherSessions.filter((s) => s.status === 'OPEN');
  const pendingLeaves = db.leaveRequests.filter((l) => l.status === 'PENDING');

  // Find students in teacher's assigned classes with attendance < 75%
  const lowAttendanceStudents: Array<{
    student: (typeof db.students)[0];
    subject: (typeof db.subjects)[0];
    pct: number;
  }> = [];

  assignments.forEach((asg) => {
    const enrollments = db.enrollments.filter((e) => e.class_id === asg.class_id && e.active);
    enrollments.forEach((enr) => {
      const stu = db.students.find((s) => s.id === enr.student_id);
      if (!stu) return;

      const stuSubjectStats = db.getStudentSubjectStats(stu.id);
      const targetSubj = stuSubjectStats.find((ss) => ss.subject.id === asg.subject_id);

      if (targetSubj && targetSubj.isBelowThreshold) {
        if (!lowAttendanceStudents.some((item) => item.student.id === stu.id && item.subject.id === asg.subject_id)) {
          lowAttendanceStudents.push({
            student: stu,
            subject: targetSubj.subject,
            pct: targetSubj.stats.percentage,
          });
        }
      }
    });
  });

  return (
    <DashboardLayout
      title={`Faculty Dashboard — ${user?.full_name || 'Faculty Member'}`}
      subtitle="Class attendance management, QR sessions, student rosters, and academic reports"
    >
      <div className="space-y-6">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Assigned Courses</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {assignments.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Active curriculum subjects</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Enrolled Students</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {db.enrollments.filter((e) => e.active).length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Across BCA 5A & 5B</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Active QR Sessions</span>
              <QrCode className="w-4 h-4 text-amber-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-amber-600 tabular-nums">
                {activeSessions.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Currently open for scanning</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Pending Leaves</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-purple-600 tabular-nums">
                {pendingLeaves.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Awaiting faculty review</span>
          </div>
        </div>

        {/* Quick Action Navigation Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/teacher/attendance"
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Mark Class Attendance</h4>
              <p className="text-[11px] text-indigo-100 truncate mt-0.5">Roll call & batch entry</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/teacher/sessions"
            className="flex items-center gap-3 p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Live QR Sessions</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Project QR with auto-refresh</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/teacher/reports"
            className="flex items-center gap-3 p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 shadow-xs transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-tight">Export Reports</h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Generate CSV, Excel, PDF</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Low Attendance Student Alerts */}
        {lowAttendanceStudents.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Students Falling Below 75% Threshold
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                {lowAttendanceStudents.length} Students At Risk
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {lowAttendanceStudents.map(({ student, subject, pct }) => {
                const stuProfile = db.profiles.find((p) => p.id === student.profile_id);
                const enr = db.getStudentEnrollment(student.id);

                return (
                  <div
                    key={`${student.id}-${subject.id}`}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {stuProfile?.full_name || 'Student'}
                      </span>
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">
                        Roll: {enr?.roll_number} ({student.student_id})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">{subject.subject_name}</span>
                      <span className="font-bold text-rose-600 tabular-nums bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Classes & Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Classes */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900">Assigned Classes & Subjects</h3>
              <Link href="/teacher/classes" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.map((asg) => {
                const classRoom = db.classes.find((c) => c.id === asg.class_id);
                const subj = db.subjects.find((s) => s.id === asg.subject_id);
                const enrolledCount = db.enrollments.filter(
                  (e) => e.class_id === asg.class_id && e.active
                ).length;

                return (
                  <div
                    key={asg.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        {subj?.subject_name} ({subj?.subject_code})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Class {classRoom?.name} {classRoom?.section} · {enrolledCount} Students Enrolled
                      </span>
                    </div>

                    <Link
                      href={`/teacher/attendance?classId=${asg.class_id}&subjectId=${asg.subject_id}`}
                      className="px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                    >
                      Mark Attendance
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Attendance Sessions */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900">Recent Attendance Sessions</h3>
              <Link href="/teacher/sessions" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Manage Sessions
              </Link>
            </div>

            <div className="space-y-3">
              {teacherSessions.slice(0, 4).map((sess) => {
                const subj = db.subjects.find((s) => s.id === sess.subject_id);
                const classRoom = db.classes.find((c) => c.id === sess.class_id);
                const recordsInSess = db.records.filter((r) => r.session_id === sess.id);

                return (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{subj?.subject_name}</span>
                        <StatusBadge status={sess.status} />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                        {sess.session_date} ({sess.start_time} - {sess.end_time}) · {recordsInSess.length} logged
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-400">#{sess.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
