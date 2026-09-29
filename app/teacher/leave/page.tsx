'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, Paperclip, AlertCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

export default function TeacherLeavePage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const leaveRequests = db.leaveRequests;
  const [selectedLeave, setSelectedLeave] = useState<(typeof leaveRequests)[0] | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    db.reviewLeaveRequest(
      selectedLeave.id,
      user?.id || 'usr-teacher-1',
      reviewAction,
      reviewNote.trim()
    );

    setSelectedLeave(null);
    setReviewNote('');
  };

  return (
    <DashboardLayout
      title="Student Leave Reviews"
      subtitle="Examine medical or academic leaves submitted by enrolled students and adjudicate status"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Submitted Leave Requests</h3>
            <span className="text-[11px] text-slate-400">Total: {leaveRequests.length}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No leave requests found.
              </div>
            ) : (
              leaveRequests.map((req) => {
                const student = db.students.find((s) => s.id === req.student_id);
                const prof = student ? db.profiles.find((p) => p.id === student.profile_id) : undefined;
                const enr = student ? db.getStudentEnrollment(student.id) : undefined;

                return (
                  <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {prof?.full_name || 'Student'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Roll: {enr?.roll_number} ({student?.student_id})
                        </span>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="text-xs font-mono text-slate-500">
                        Leave Duration: <strong>{req.start_date}</strong> to <strong>{req.end_date}</strong>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">&ldquo;{req.reason}&rdquo;</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Submitted: {new Date(req.submitted_at).toLocaleDateString()}</span>
                        {req.document_path && (
                          <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            <Paperclip className="w-3 h-3" />
                            <span>{req.document_path}</span>
                          </span>
                        )}
                        {req.review_message && (
                          <span className="italic text-slate-500">
                            Faculty Note: &ldquo;{req.review_message}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeave(req);
                            setReviewAction('APPROVED');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeave(req);
                            setReviewAction('REJECTED');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(selectedLeave)}
        onClose={() => setSelectedLeave(null)}
        title={`Confirm Decision: ${reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Leave`}
        description="Enter feedback remarks and confirm status"
      >
        <form onSubmit={handleReview} className="space-y-4">
          <p className="text-xs text-slate-600">
            You are about to mark this leave request as{' '}
            <strong className={reviewAction === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>
              {reviewAction}
            </strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Faculty Feedback Note (Optional)
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="e.g. Approved. Please ensure makeup laboratory assignments are submitted..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedLeave(null)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-xs ${
                reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {reviewAction}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
