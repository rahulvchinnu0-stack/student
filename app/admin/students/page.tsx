'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newClassId, setNewClassId] = useState(db.classes[0]?.id || '');
  const [newRollNumber, setNewRollNumber] = useState('');

  const students = db.students.map((stu) => {
    const profile = db.profiles.find((p) => p.id === stu.profile_id);
    const enrollment = db.getStudentEnrollment(stu.id);
    const cls = enrollment ? db.classes.find((c) => c.id === enrollment.class_id) : undefined;
    const stats = db.getStudentOverallStats(stu.id);
    return {
      student: stu,
      profile,
      enrollment,
      classRoom: cls,
      stats,
    };
  });

  const filteredStudents = students.filter(({ student, profile, enrollment }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      profile?.full_name.toLowerCase().includes(term) ||
      student.student_id.toLowerCase().includes(term) ||
      enrollment?.roll_number.toLowerCase().includes(term) ||
      profile?.email.toLowerCase().includes(term)
    );
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const { student } = db.createStudentAccount(newEmail.trim(), newFullName.trim(), newStudentId.trim() || undefined);

    // If custom roll number/class
    if (newRollNumber && newClassId) {
      const existingEnr = db.enrollments.find((en) => en.student_id === student.id && en.active);
      if (existingEnr) {
        existingEnr.class_id = newClassId;
        existingEnr.roll_number = newRollNumber;
      }
    }

    setNewFullName('');
    setNewEmail('');
    setNewStudentId('');
    setNewRollNumber('');
    setIsCreateModalOpen(false);
  };

  const handleToggleActive = (studentId: string, currentActive: boolean) => {
    const stu = db.students.find((s) => s.id === studentId);
    if (stu) {
      // Soft deactivation (does not destroy attendance history!)
      stu.active = !currentActive;
      const prof = db.profiles.find((p) => p.id === stu.profile_id);
      if (prof) prof.active = !currentActive;
      db.logAudit(
        user?.id || 'admin',
        'UPDATE_STUDENT',
        'students',
        studentId,
        { active: !currentActive }
      );
      db.notify();
    }
  };

  return (
    <DashboardLayout
      title="Student Management"
      subtitle="Institutional student enrollment directory, roll number assignments, and academic status"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll, student ID..."
              className="w-full text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map(({ student, profile, enrollment, classRoom, stats }) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {student.student_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {enrollment?.roll_number || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{profile?.full_name}</span>
                      <span className="text-[10px] text-slate-400">{profile?.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {classRoom ? `${classRoom.name} ${classRoom.section}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums">
                      <span
                        className={
                          (stats?.percentage || 0) < 75 ? 'text-rose-600' : 'text-slate-900'
                        }
                      >
                        {stats?.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          student.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {student.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(student.id, student.active)}
                        className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                          student.active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {student.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Enroll New Student"
        description="Create institutional student profile and assign class enrollment"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Aditi Sharma"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. aditi.s@student.college.edu"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
              <input
                type="text"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                placeholder="STU-202606"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Roll Number</label>
              <input
                type="text"
                value={newRollNumber}
                onChange={(e) => setNewRollNumber(e.target.value)}
                placeholder="24BCA06"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section</label>
            <select
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
