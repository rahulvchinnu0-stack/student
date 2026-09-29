'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminDepartmentsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const departments = db.departments;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check duplicate code
    if (departments.some((d) => d.code.toUpperCase() === code.trim().toUpperCase())) {
      setError(`A department with code "${code.trim().toUpperCase()}" already exists.`);
      return;
    }

    const id = `dept-${Date.now()}`;
    db.departments.push({
      id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.notify();
    setName('');
    setCode('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout
      title="Academic Departments"
      subtitle="Establish institutional divisions, academic faculties, and degree branches"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Department Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Unique codes ensure campus-wide catalog consistency.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => {
            const classesInDept = db.classes.filter((c) => c.department_id === dept.id);
            const subjectsInDept = db.subjects.filter((s) => s.department_id === dept.id);

            return (
              <div
                key={dept.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {dept.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{dept.description || 'No description provided.'}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                  <span>{classesInDept.length} Class Sections</span>
                  <span>·</span>
                  <span>{subjectsInDept.length} Subjects Offered</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Academic Department"
        description="Establish a new department with a unique institutional code"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Department of Mechanical Engineering"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MECH"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional overview..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300"
            />
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
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
