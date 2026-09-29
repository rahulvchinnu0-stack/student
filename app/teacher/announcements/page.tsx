'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Bell, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function TeacherAnnouncementsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const announcements = db.announcements;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'GLOBAL' | 'CLASS'>('CLASS');
  const [targetClassId, setTargetClassId] = useState(db.classes[0].id);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    db.createAnnouncement({
      title: title.trim(),
      message: message.trim(),
      target_type: targetType,
      target_class_id: targetType === 'CLASS' ? targetClassId : undefined,
      creator_profile_id: user?.id || 'usr-teacher-1',
    });

    setTitle('');
    setMessage('');
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout
      title="Class Announcements"
      subtitle="Publish academic bulletins, lab submission deadlines, and campus notices"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Broadcast Notice</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Notices appear on students&apos; portals and trigger notifications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => {
            const cls = ann.target_class_id
              ? db.classes.find((c) => c.id === ann.target_class_id)
              : undefined;

            return (
              <div
                key={ann.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      ann.target_type === 'GLOBAL'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {ann.target_type === 'GLOBAL'
                      ? 'Campus-Wide Bulletin'
                      : `Class ${cls?.name} ${cls?.section}`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.published_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post New Announcement"
        description="Share class announcements or notices directly to student devices"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              <option value="CLASS">Specific Class Section</option>
              <option value="GLOBAL">Campus-Wide (All Students)</option>
            </select>
          </div>

          {targetType === 'CLASS' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab Assignment 3 Submission Schedule"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Content</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter full announcement details..."
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
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
