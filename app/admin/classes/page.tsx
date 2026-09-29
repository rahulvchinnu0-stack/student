'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminClassesPage() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [departmentId, setDepartmentId] = useState(db.departments[0].id);

  const classes = db.classes;
  const departments = db.departments;
  const academicYears = db.academicYears;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !section.trim()) return;

    const id = `class-${Date.now()}`;
    db.classes.push({
      id,
      name: name.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      department_id: departmentId,
      academic_year_id: academicYears[0].id,
      semester_id: db.semesters[0].id,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.notify();
    setName('');
    setSection('');
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout
      title="Classes & Sections"
      subtitle="Class cohort configurations, section rosters, and departmental linkages"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Active Cohort Classes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Classes bind students, semesters, and timetables together.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Class</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const dept = departments.find((d) => d.id === cls.department_id);
            const enrolled = db.enrollments.filter((e) => e.class_id === cls.id && e.active).length;
            const courses = db.assignments.filter((a) => a.class_id === cls.id && a.active).length;

            return (
              <div
                key={cls.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded border border-slate-200">
                    {cls.name} {cls.section}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Department:</span> {dept?.name}
                  </div>
                  <div>
                    <span className="text-slate-400">Academic Year:</span> 2026-27 (Sem 5)
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{enrolled}</strong> Students
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{courses}</strong> Subjects
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Class Cohort"
        description="Establish a class section and link to degree department"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Course *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BCA or B.Tech"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. 5A or 5B"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {departments.map((d) => (
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
              Create Class
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
