'use client';

import React, { useState } from 'react';
import { Users, Mail, Phone, Hash, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';

export default function TeacherClassesPage() {
  const { teacher } = useAuth();
  const teacherId = teacher?.id || 'tch-sharma';

  const assignments = db.assignments.filter((a) => a.teacher_id === teacherId && a.active);
  const [selectedClassId, setSelectedClassId] = useState(assignments[0]?.class_id || db.classes[0].id);

  const currentClass = db.classes.find((c) => c.id === selectedClassId);
  const classEnrollments = db.enrollments.filter((e) => e.class_id === selectedClassId && e.active);

  const students = classEnrollments
    .map((enr) => {
      const stu = db.students.find((s) => s.id === enr.student_id);
      const prof = stu ? db.profiles.find((p) => p.id === stu.profile_id) : undefined;
      const stats = stu ? db.getStudentOverallStats(stu.id) : undefined;
      return {
        enrollment: enr,
        student: stu,
        profile: prof,
        stats,
      };
    })
    .filter((i) => i.student && i.profile);

  return (
    <DashboardLayout
      title="Assigned Classes & Students"
      subtitle="View student rosters, contact details, and cumulative performance for assigned sections"
    >
      <div className="space-y-6">
        {/* Class Selector Tabs */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
          {assignments.map((asg) => {
            const cls = db.classes.find((c) => c.id === asg.class_id);
            const subj = db.subjects.find((s) => s.id === asg.subject_id);
            const isSelected = selectedClassId === asg.class_id;

            return (
              <button
                key={asg.id}
                type="button"
                onClick={() => setSelectedClassId(asg.class_id)}
                className={`py-2 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>
                  {cls?.name} {cls?.section}
                </span>
                <span className="text-[10px] opacity-75 font-normal">({subj?.subject_code})</span>
              </button>
            );
          })}
        </div>

        {/* Student Roster Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Class {currentClass?.name} {currentClass?.section} Roster
              </h3>
              <p className="text-[11px] text-slate-400">Total Enrolled: {students.length} students</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 text-center">Overall Attendance</th>
                  <th className="py-3 px-4 text-center">Classes Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map(({ enrollment, student, profile, stats }) => (
                  <tr key={student!.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {enrollment.roll_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{profile!.full_name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{profile!.email}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {student!.phone || profile!.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold tabular-nums px-2 py-0.5 rounded border text-xs ${
                          (stats?.percentage || 0) < 75
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {stats?.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px] tabular-nums">
                      {stats?.attendedCount} / {stats?.countedCount}
                    </td>
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
