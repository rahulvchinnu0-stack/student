'use client';

import React from 'react';
import { User, Mail, Phone, Building2, Layers, Hash, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';

export default function StudentProfilePage() {
  const { student, user } = useAuth();
  const studentId = student?.id || 'stu-rahul';

  const enrollment = db.getStudentEnrollment(studentId);
  const classRoom = enrollment ? db.classes.find((c) => c.id === enrollment.class_id) : db.classes[0];
  const department = db.departments[0];
  const academicYear = db.academicYears[0];

  return (
    <DashboardLayout
      title="Student Profile"
      subtitle="Institutional student credential, academic department enrollment, and contact records"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Header with Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user?.full_name ? user.full_name.charAt(0) : 'R'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Student</span>
                </span>
              </div>
            </div>
          </div>

          {/* Academic Records Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Academic Enrollment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Student ID Number</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {student?.student_id || 'STU-202601'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Hash className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Class Roll Number</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {enrollment?.roll_number || '24BCA01'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Layers className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Class & Section</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {classRoom?.name} {classRoom?.section} (Semester 5)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {department?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Contact & Institutional Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Email Address</span>
                  <span className="text-xs font-medium text-slate-900">{user?.email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Contact Phone</span>
                  <span className="text-xs font-medium text-slate-900">
                    {student?.phone || user?.phone || '+1 (555) 987-6543'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Immutability Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Role Security Protocol:</strong> Students cannot alter their academic roll number, class assignment, or historical attendance logs. Corrections require formal petition to the academic department office.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
