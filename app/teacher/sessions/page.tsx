'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Play,
  Square,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { AttendanceSession } from '@/lib/types';
import { StatusBadge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

export default function TeacherSessionsPage() {
  const { teacher, user } = useAuth();
  const teacherId = teacher?.id || 'tch-sharma';

  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const assignments = db.assignments.filter((a) => a.teacher_id === teacherId && a.active);
  const teacherSessions = db.sessions.filter((s) => s.teacher_id === teacherId);

  // Active QR Session being projected
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    teacherSessions.find((s) => s.status === 'OPEN') || null
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  // New session modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassId, setNewClassId] = useState(assignments[0]?.class_id || db.classes[0].id);
  const [newSubjectId, setNewSubjectId] = useState(assignments[0]?.subject_id || db.subjects[0].id);
  const [newDate, setNewDate] = useState('2026-09-29');

  // Regenerate QR data URL whenever active session changes or token updates
  useEffect(() => {
    async function renderQR() {
      if (activeSession && activeSession.status === 'OPEN') {
        const token = activeSession.qr_token_hash || `ATTENDX-${activeSession.id}-init`;
        try {
          const url = await QRCode.toDataURL(token, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrDataUrl(url);
        } catch (err) {
          console.error('Failed to generate QR code data URL:', err);
        }
      } else {
        setQrDataUrl('');
      }
    }
    renderQR();
  }, [activeSession, version]);

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'OPEN') return;

    const interval = setInterval(() => {
      if (activeSession.qr_expires_at) {
        const expiryTime = new Date(activeSession.qr_expires_at).getTime();
        const diff = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
        setSecondsRemaining(diff);

        // Auto-refresh token if expired
        if (diff <= 0) {
          db.generateSessionQR(activeSession.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const created = db.createAttendanceSession({
      class_id: newClassId,
      subject_id: newSubjectId,
      teacher_id: teacherId,
      session_date: newDate,
      start_time: '09:00',
      end_time: '10:00',
    });
    // Generate initial QR
    db.generateSessionQR(created.id);
    setActiveSession(created);
    setIsCreateModalOpen(false);
  };

  const handleRefreshQR = (sessionId: string) => {
    db.generateSessionQR(sessionId);
    const updated = db.sessions.find((s) => s.id === sessionId);
    if (updated) setActiveSession({ ...updated });
  };

  const handleCloseSession = (sessionId: string) => {
    db.closeAttendanceSession(sessionId);
    const updated = db.sessions.find((s) => s.id === sessionId);
    if (updated) setActiveSession({ ...updated });
  };

  // Live Check-in Roster for Active Session
  const checkedInRecords = activeSession
    ? db.records.filter((r) => r.session_id === activeSession.id)
    : [];

  return (
    <DashboardLayout
      title="Live QR Attendance Sessions"
      subtitle="Broadcast temporary rotating QR tokens for real-time classroom check-ins"
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">QR Code Classroom Projection</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Project the QR code on the lecture screen. Students scan via their mobile portal to verify presence.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Attendance Session</span>
          </button>
        </div>

        {/* Live Projector Screen Section */}
        {activeSession && activeSession.status === 'OPEN' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Big QR Projection Card */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center space-y-5">
              <div className="flex items-center justify-between w-full pb-4 border-b border-slate-100 text-left">
                <div>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase">
                    Session #{activeSession.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {db.subjects.find((s) => s.id === activeSession.subject_id)?.subject_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Class: {db.classes.find((c) => c.id === activeSession.class_id)?.name}{' '}
                    {db.classes.find((c) => c.id === activeSession.class_id)?.section} · Date: {activeSession.session_date}
                  </p>
                </div>
                <StatusBadge status={activeSession.status} />
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Active Attendance QR Code"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}

                {/* Expiry Countdown */}
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span>
                    Refreshes in <strong className="tabular-nums text-indigo-600">{secondsRemaining}s</strong>
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRefreshQR(activeSession.id)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Force Refresh QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCloseSession(activeSession.id)}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Close Session & End Attendance</span>
                </button>
              </div>
            </div>

            {/* Right: Live Checked-in Students Feed */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Live Check-in Feed</h4>
                  <p className="text-[11px] text-slate-400">Real-time database updates</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 tabular-nums">
                  {checkedInRecords.length} Verified
                </span>
              </div>

              <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[460px]">
                {checkedInRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Awaiting students to scan the QR code...
                  </div>
                ) : (
                  checkedInRecords.map((r) => {
                    const stu = db.students.find((s) => s.id === r.student_id);
                    const prof = stu ? db.profiles.find((p) => p.id === stu.profile_id) : undefined;
                    const enr = stu ? db.getStudentEnrollment(stu.id) : undefined;

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors animate-in fade-in"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {prof?.full_name || 'Enrolled Student'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Roll: {enr?.roll_number} ({stu?.student_id})
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                          {new Date(r.marked_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 shadow-xs text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Active Attendance Session</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Launch a live attendance session to display an encrypted classroom QR token with automatic rotational expiry.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Launch Session Now</span>
            </button>
          </div>
        )}

        {/* Historical Sessions Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Previous Sessions History</h3>
            <span className="text-[11px] text-slate-400">Total: {teacherSessions.length} sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Attendance Count</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teacherSessions.map((s) => {
                  const subj = db.subjects.find((sub) => sub.id === s.subject_id);
                  const cls = db.classes.find((c) => c.id === s.class_id);
                  const count = db.records.filter((r) => r.session_id === s.id).length;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 tabular-nums">
                        {s.session_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{subj?.subject_name}</td>
                      <td className="py-3 px-4">
                        {cls?.name} {cls?.section}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums font-semibold text-slate-900">
                        {count} Students
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status === 'OPEN' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSession(s);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Project QR
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start Attendance Session"
        description="Configure class and subject to generate a live QR attendance broadcast"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <select
              value={newSubjectId}
              onChange={(e) => setNewSubjectId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
            >
              {db.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name} ({s.subject_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
              Start & Project QR
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
