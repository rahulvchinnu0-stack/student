'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminAssignmentsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacherId, setTeacherId] = useState(db.teachers[0].id);
  const [classId, setClassId] = useState(db.classes[0].id);
  const [subjectId, setSubjectId] = useState(db.subjects[0].id);
  const [error, setError] = useState('');

  const assignments = db.assignments;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check duplicate assignment
    if (
      assignments.some(
        (a) => a.teacher_id === teacherId && a.class_id === classId && a.subject_id === subjectId && a.active
      )
    ) {
      setError('This faculty member is already assigned to this class and subject.');
      return;
    }

    const id = `asg-${Date.now()}`;
    db.assignments.push({
      id,
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId,
      academic_year_id: db.academicYears[0].id,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.logAudit(user?.id || 'admin', 'ASSIGN_TEACHER', 'teacher_assignments', id, {
      teacherId,
      classId,
      subjectId,
    });

    db.notify();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const idx = db.assignments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      db.assignments.splice(idx, 1);
      db.notify();
    }
  };

  return (
    <DashboardLayout
      title="Faculty Course Assignments"
      subtitle="Link teaching instructors to specific degree sections and subject modules"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Teaching Allocations</h2>
            <p className="text-xs text-slate-500 mt-0.5">Faculty members can only take attendance for assigned courses.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Course</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Class Section</th>
                <th className="py-3 px-4">Subject Course</th>
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assignments.map((asg) => {
                const tch = db.teachers.find((t) => t.id === asg.teacher_id);
                const prof = tch ? db.profiles.find((p) => p.id === tch.profile_id) : undefined;
                const cls = db.classes.find((c) => c.id === asg.class_id);
                const subj = db.subjects.find((s) => s.id === asg.subject_id);

                return (
                  <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {prof?.full_name} ({tch?.teacher_id})
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {cls?.name} {cls?.section}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{subj?.subject_name}</span>
                      <span className="text-slate-400 font-mono text-[10px] ml-1.5">{subj?.subject_code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">2026-27</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(asg.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Course to Instructor"
        description="Connect faculty credential to class section"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Instructor *</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.teachers.map((t) => {
                const p = db.profiles.find((pr) => pr.id === t.profile_id);
                return (
                  <option key={t.id} value={t.id}>
                    {p?.full_name} ({t.teacher_id})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section *</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Module *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name} ({s.subject_code})
                </option>
              ))}
            </select>
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
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
