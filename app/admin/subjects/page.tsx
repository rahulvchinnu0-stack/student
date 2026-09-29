'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminSubjectsPage() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('4.0');
  const [departmentId, setDepartmentId] = useState(db.departments[0].id);
  const [error, setError] = useState('');

  const subjects = db.subjects;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (subjects.some((s) => s.subject_code.toUpperCase() === code.trim().toUpperCase())) {
      setError(`A course with code "${code.trim().toUpperCase()}" already exists.`);
      return;
    }

    const id = `subj-${Date.now()}`;
    db.subjects.push({
      id,
      subject_code: code.trim().toUpperCase(),
      subject_name: name.trim(),
      department_id: departmentId,
      credits: parseFloat(credits) || 3.0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.notify();
    setCode('');
    setName('');
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout
      title="Curriculum Courses & Subjects"
      subtitle="Course catalog directory, credit weighting, and department ownership"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Curriculum Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define credit values and course subject codes.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Academic Credits</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subjects.map((sub) => {
                const dept = db.departments.find((d) => d.id === sub.department_id);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{sub.subject_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject_name}</td>
                    <td className="py-3 px-4 text-slate-600">{dept?.name}</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">{sub.credits || '3.0'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
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
        title="Add Subject to Curriculum"
        description="Provide course title and unique identification code"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS505"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Credits *</label>
              <input
                type="number"
                step="0.5"
                required
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cloud Computing & Distributed Architecture"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
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
              Add Course
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
