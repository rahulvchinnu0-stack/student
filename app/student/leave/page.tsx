'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Paperclip,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

export default function StudentLeavePage() {
  const { student, user } = useAuth();
  const studentId = student?.id || 'stu-rahul';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const leaveRequests = db.leaveRequests.filter((l) => l.student_id === studentId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setFileError('Allowed formats are PDF, PNG, JPG, JPEG only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size exceeds the 10 MB maximum limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!startDate || !endDate || !reason.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError('End date cannot precede the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      db.submitLeaveRequest({
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        document_path: selectedFile ? selectedFile.name : undefined,
      });

      setIsSubmitting(false);
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setSelectedFile(null);
    } catch {
      setIsSubmitting(false);
      setSubmitError('Failed to record leave application.');
    }
  };

  return (
    <DashboardLayout
      title="Leave Applications"
      subtitle="Submit formal leave requests with supporting medical or official documentation"
    >
      <div className="space-y-6">
        {/* Header CTA banner */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Need academic or medical leave?</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved leaves exclude class sessions from attendance denominators or mark them as excused.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">Your Leave History</h3>
            <span className="text-[11px] text-slate-400">Total: {leaveRequests.length} requests</span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You have not submitted any leave applications yet.
              </div>
            ) : (
              leaveRequests.map((req) => (
                <div key={req.id} className="p-4 sm:p-5 space-y-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {req.start_date} to {req.end_date}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Applied:{' '}
                      {new Date(req.submitted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{req.reason}</p>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100/80 gap-2 text-xs">
                    {req.document_path ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded border border-indigo-100">
                        <Paperclip className="w-3 h-3" />
                        <span>{req.document_path}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No document attached</span>
                    )}

                    {req.reviewed_by && (
                      <div className="text-[11px] text-slate-500">
                        Reviewed by faculty: {req.review_message ? `"${req.review_message}"` : 'Decided'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Leave Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
        description="Submit leave request for approval by your course instructor and department head."
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Absence *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear reasons (e.g. medical illness, family emergency, academic competition)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supporting Document (PDF, PNG, JPG - max 10MB)
            </label>
            <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
              <input
                type="file"
                id="leave-file-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="leave-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  {selectedFile ? selectedFile.name : 'Choose certificate or document'}
                </span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
              </label>
            </div>
            {fileError && <p className="text-[11px] text-rose-600 mt-1">{fileError}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
