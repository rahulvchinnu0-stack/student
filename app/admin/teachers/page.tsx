'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Building2, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminTeachersPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newDeptId, setNewDeptId] = useState(db.departments[0].id);

  const teachers = db.teachers.map((t) => {
    const profile = db.profiles.find((p) => p.id === t.profile_id);
    const dept = db.departments.find((d) => d.id === t.department_id);
    const assignments = db.assignments.filter((a) => a.teacher_id === t.id && a.active);
    return {
      teacher: t,
      profile,
      department: dept,
      assignments,
    };
  });

  const filtered = teachers.filter(({ teacher, profile }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      profile?.full_name.toLowerCase().includes(term) ||
      teacher.teacher_id.toLowerCase().includes(term) ||
      profile?.email.toLowerCase().includes(term)
    );
  });

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const profId = `usr-${Date.now()}`;
    const tchId = `tch-${Date.now()}`;
    const teacherCode = newTeacherId.trim() || `TCH-${Math.floor(100 + Math.random() * 900)}`;

    const newProfile = {
      id: profId,
      role: 'TEACHER' as const, // Admin authorization assignment
      full_name: newFullName.trim(),
      email: newEmail.trim(),
      phone: '',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTeacher = {
      id: tchId,
      profile_id: profId,
      teacher_id: teacherCode,
      department_id: newDeptId,
      phone: '',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.profiles.push(newProfile);
    db.teachers.push(newTeacher);
    db.logAudit(user?.id || 'admin', 'CREATE_TEACHER', 'teachers', tchId, {
      name: newFullName,
      teacherCode,
    });
    db.notify();

    setNewFullName('');
    setNewEmail('');
    setNewTeacherId('');
    setIsModalOpen(false);
  };

  const handleToggleActive = (teacherId: string, currentActive: boolean) => {
    const tch = db.teachers.find((t) => t.id === teacherId);
    if (tch) {
      tch.active = !currentActive;
      const prof = db.profiles.find((p) => p.id === tch.profile_id);
      if (prof) prof.active = !currentActive;
      db.logAudit(user?.id || 'admin', 'UPDATE_TEACHER', 'teachers', teacherId, {
        active: !currentActive,
      });
      db.notify();
    }
  };

  return (
    <DashboardLayout
      title="Faculty Directory"
      subtitle="Instructor appointments, departmental designations, and active curriculum allocations"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty name or ID..."
              className="w-full text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Appoint Faculty Member</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(({ teacher, profile, department, assignments }) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {teacher.teacher_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{profile?.full_name}</span>
                      <span className="text-[10px] text-slate-400">{profile?.email}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {department?.name} ({department?.code})
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-700 font-medium">
                        {assignments.length} Course{assignments.length === 1 ? '' : 's'} Assigned
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          teacher.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {teacher.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(teacher.id, teacher.active)}
                        className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                          teacher.active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {teacher.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Appoint New Faculty Member"
        description="Provision TEACHER role credentials and assign academic department"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Gupta"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. ramesh.gupta@college.edu"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty ID</label>
              <input
                type="text"
                value={newTeacherId}
                onChange={(e) => setNewTeacherId(e.target.value)}
                placeholder="TCH-103"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                {db.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
