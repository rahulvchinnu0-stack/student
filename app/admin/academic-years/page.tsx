'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminAcademicYearsPage() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  const academicYears = db.academicYears;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !startDate || !endDate) return;

    if (isCurrent) {
      academicYears.forEach((ay) => {
        ay.is_current = false;
      });
    }

    const id = `ay-${Date.now()}`;
    db.academicYears.push({
      id,
      label: label.trim(),
      start_date: startDate,
      end_date: endDate,
      is_current: isCurrent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.notify();
    setLabel('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setIsModalOpen(false);
  };

  const handleSetCurrent = (yearId: string) => {
    academicYears.forEach((ay) => {
      ay.is_current = ay.id === yearId;
    });
    db.notify();
  };

  return (
    <DashboardLayout
      title="Academic Years"
      subtitle="Institutional academic terms and active current session governance"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Academic Years & Terms</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only one academic term may be designated as the active current year.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Academic Year</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Academic Year Label</th>
                <th className="py-3 px-4">Commencement Date</th>
                <th className="py-3 px-4">Conclusion Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {academicYears.map((ay) => (
                <tr key={ay.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ay.label}</td>
                  <td className="py-3 px-4 font-mono">{ay.start_date}</td>
                  <td className="py-3 px-4 font-mono">{ay.end_date}</td>
                  <td className="py-3 px-4 text-center">
                    {ay.is_current ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>CURRENT</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Archived / Future</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!ay.is_current && (
                      <button
                        type="button"
                        onClick={() => handleSetCurrent(ay.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Set as Current
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Academic Year"
        description="Specify calendar boundaries for degree sessions"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Label *</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2026-27"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-current-checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is-current-checkbox" className="text-xs text-slate-700 font-medium">
              Make this the active current academic year
            </label>
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
              Save Year
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
