'use client';

import React from 'react';
import { User, Mail, Phone, Building2, BookOpen, GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';

export default function TeacherProfilePage() {
  const { teacher, user } = useAuth();
  const teacherId = teacher?.id || 'tch-sharma';

  const department = db.departments[0];
  const assignments = db.assignments.filter((a) => a.teacher_id === teacherId && a.active);

  return (
    <DashboardLayout
      title="Faculty Profile"
      subtitle="Institutional faculty credentials, assigned curriculum subjects, and department allocation"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user?.full_name ? user.full_name.charAt(0) : 'P'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Faculty Member</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Institutional Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Faculty Identification Code</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {teacher?.teacher_id || 'TCH-101'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Academic Department</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {department?.name} ({department?.code})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Assigned Courses & Classes
            </h3>
            <div className="space-y-2">
              {assignments.map((asg) => {
                const sub = db.subjects.find((s) => s.id === asg.subject_id);
                const cls = db.classes.find((c) => c.id === asg.class_id);

                return (
                  <div
                    key={asg.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{sub?.subject_name}</span>
                      <span className="text-slate-400 font-mono text-[11px] ml-2">
                        {sub?.subject_code}
                      </span>
                    </div>
                    <span className="text-slate-600 font-medium">
                      Class {cls?.name} {cls?.section}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Administrative Security:</strong> Course assignments, timetable schedules, and faculty department allocations are administered strictly by the College Registrar and Academic Administration.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
