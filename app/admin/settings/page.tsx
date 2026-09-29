'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Database,
  Mail,
  Clock,
  Send,
  RotateCcw,
  Eye,
  AlertTriangle,
  Bell,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertIntervalMode, EmailTemplateConfig } from '@/lib/types';

type TemplateKey = 'low_attendance' | 'consecutive_absence' | 'leave_decision';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  // Policy Thresholds
  const [threshold, setThreshold] = useState<number>(db.settings.attendance_threshold || 75);
  const [qrExpiry, setQrExpiry] = useState<number>(db.settings.qr_expiry_seconds || 120);

  // Automated Alert Interval & Trigger Settings
  const [alertIntervalMode, setAlertIntervalMode] = useState<AlertIntervalMode>(
    db.settings.alert_interval_mode || 'DAILY'
  );
  const [alertDispatchTime, setAlertDispatchTime] = useState<string>(
    db.settings.alert_dispatch_time || '17:00'
  );
  const [consecutiveTrigger, setConsecutiveTrigger] = useState<number>(
    db.settings.consecutive_absence_trigger || 3
  );
  const [emailEnabled, setEmailEnabled] = useState<boolean>(
    db.settings.email_notifications_enabled ?? true
  );
  const [sendAdvisorCopy, setSendAdvisorCopy] = useState<boolean>(
    db.settings.send_advisor_copy ?? true
  );

  // Email Templates
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateKey>('low_attendance');
  const [templates, setTemplates] = useState<{
    low_attendance: EmailTemplateConfig;
    consecutive_absence: EmailTemplateConfig;
    leave_decision: EmailTemplateConfig;
  }>(() => {
    return {
      low_attendance: {
        subject:
          db.settings.email_templates?.low_attendance?.subject ||
          '[Academic Notice] Low Attendance Warning for {{student_name}} - {{subject_name}} ({{current_percentage}}%)',
        body:
          db.settings.email_templates?.low_attendance?.body ||
          `Dear {{student_name}},\n\nThis official notification serves to advise you that your overall attendance in {{subject_name}} ({{subject_code}}) has reached {{current_percentage}}%, which is below the institution's mandatory threshold of {{threshold_percentage}}%.\n\nAttendance Record Summary:\n• Attended Sessions: {{attended_classes}}\n• Total Counted Sessions: {{total_classes}}\n• Required Consecutive Attendances to Recover: {{needed_classes}} sessions\n\nFailure to maintain satisfactory attendance may lead to examination debarment pursuant to Academic Regulations.\n\nPlease consult with your Faculty Advisor ({{teacher_name}}) or Department Head at {{department_name}} as soon as possible.\n\nSincerely,\nOffice of Academic Affairs\nAttendX Campus Attendance System`,
      },
      consecutive_absence: {
        subject:
          db.settings.email_templates?.consecutive_absence?.subject ||
          '[Urgent Alert] Multiple Consecutive Absences Detected - {{student_name}}',
        body:
          db.settings.email_templates?.consecutive_absence?.body ||
          `Dear {{student_name}},\n\nOur attendance records indicate that you have accumulated {{consecutive_days}} consecutive unexcused absences in {{class_name}}.\n\nConsecutive unexplained absences affect both your academic standing and exam eligibility. If your absence is due to health issues or emergency circumstances, please submit a formal Leave Request accompanied by medical/official documentation through the AttendX portal immediately.\n\nDepartment: {{department_name}}\nInstitutional Contact: attendance-office@college.edu\n\nRegards,\nDepartment of {{department_name}}`,
      },
      leave_decision: {
        subject:
          db.settings.email_templates?.leave_decision?.subject ||
          '[AttendX Update] Leave Request {{status}}: {{start_date}} to {{end_date}}',
        body:
          db.settings.email_templates?.leave_decision?.body ||
          `Dear {{student_name}},\n\nYour student leave request submitted for the period from {{start_date}} to {{end_date}} has been reviewed.\n\nStatus: {{status}}\nReviewer: {{reviewer_name}}\nReview Comments: {{review_message}}\n\nYour attendance audit log and official record have been adjusted accordingly in the AttendX system.\n\nAcademic Support Team\nAttendX Attendance Portal`,
      },
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);

  const availableVariables: Record<TemplateKey, string[]> = {
    low_attendance: [
      '{{student_name}}',
      '{{subject_name}}',
      '{{subject_code}}',
      '{{current_percentage}}',
      '{{threshold_percentage}}',
      '{{attended_classes}}',
      '{{total_classes}}',
      '{{needed_classes}}',
      '{{department_name}}',
      '{{teacher_name}}',
    ],
    consecutive_absence: [
      '{{student_name}}',
      '{{consecutive_days}}',
      '{{class_name}}',
      '{{department_name}}',
    ],
    leave_decision: [
      '{{student_name}}',
      '{{start_date}}',
      '{{end_date}}',
      '{{status}}',
      '{{reviewer_name}}',
      '{{review_message}}',
    ],
  };

  const sampleRenderVars: Record<string, string> = {
    '{{student_name}}': 'Rahul Varma',
    '{{subject_name}}': 'Java Programming',
    '{{subject_code}}': 'CS501',
    '{{current_percentage}}': '68.18',
    '{{threshold_percentage}}': String(threshold),
    '{{attended_classes}}': '15',
    '{{total_classes}}': '22',
    '{{needed_classes}}': '6',
    '{{consecutive_days}}': String(consecutiveTrigger),
    '{{class_name}}': 'BCA 5A',
    '{{department_name}}': 'Computer Applications & Engineering',
    '{{teacher_name}}': 'Prof. Rajesh Sharma',
    '{{status}}': 'APPROVED',
    '{{reviewer_name}}': 'Prof. Rajesh Sharma',
    '{{start_date}}': '2026-10-05',
    '{{end_date}}': '2026-10-06',
    '{{review_message}}': 'Approved for inter-university hackathon participation.',
  };

  function getRenderedPreview(template: EmailTemplateConfig) {
    let sub = template.subject;
    let bdy = template.body;
    Object.entries(sampleRenderVars).forEach(([tag, val]) => {
      sub = sub.replaceAll(tag, val);
      bdy = bdy.replaceAll(tag, val);
    });
    return { subject: sub, body: bdy };
  }

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings({
      attendance_threshold: Number(threshold),
      qr_expiry_seconds: Number(qrExpiry),
      alert_interval_mode: alertIntervalMode,
      alert_dispatch_time: alertDispatchTime,
      consecutive_absence_trigger: Number(consecutiveTrigger),
      email_notifications_enabled: emailEnabled,
      send_advisor_copy: sendAdvisorCopy,
      email_templates: templates,
      updated_by: user?.id,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleInsertVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);

    // Also append to body
    setTemplates((prev) => ({
      ...prev,
      [activeTemplateTab]: {
        ...prev[activeTemplateTab],
        body: prev[activeTemplateTab].body + ' ' + variable,
      },
    }));
  };

  const handleSendTestEmail = () => {
    if (!user) return;
    const res = db.sendTestAlertEmail(activeTemplateTab, user.email, user.id);
    setTestEmailResult(res.message);
    setTimeout(() => setTestEmailResult(null), 4500);
  };

  const handleResetCurrentTemplate = () => {
    if (activeTemplateTab === 'low_attendance') {
      setTemplates((prev) => ({
        ...prev,
        low_attendance: {
          subject: '[Academic Notice] Low Attendance Warning for {{student_name}} - {{subject_name}} ({{current_percentage}}%)',
          body: `Dear {{student_name}},\n\nThis official notification serves to advise you that your overall attendance in {{subject_name}} ({{subject_code}}) has reached {{current_percentage}}%, which is below the institution's mandatory threshold of {{threshold_percentage}}%.\n\nAttendance Record Summary:\n• Attended Sessions: {{attended_classes}}\n• Total Counted Sessions: {{total_classes}}\n• Required Consecutive Attendances to Recover: {{needed_classes}} sessions\n\nFailure to maintain satisfactory attendance may lead to examination debarment pursuant to Academic Regulations.\n\nPlease consult with your Faculty Advisor ({{teacher_name}}) or Department Head at {{department_name}} as soon as possible.\n\nSincerely,\nOffice of Academic Affairs\nAttendX Campus Attendance System`,
        },
      }));
    } else if (activeTemplateTab === 'consecutive_absence') {
      setTemplates((prev) => ({
        ...prev,
        consecutive_absence: {
          subject: '[Urgent Alert] Multiple Consecutive Absences Detected - {{student_name}}',
          body: `Dear {{student_name}},\n\nOur attendance records indicate that you have accumulated {{consecutive_days}} consecutive unexcused absences in {{class_name}}.\n\nConsecutive unexplained absences affect both your academic standing and exam eligibility. If your absence is due to health issues or emergency circumstances, please submit a formal Leave Request accompanied by medical/official documentation through the AttendX portal immediately.\n\nDepartment: {{department_name}}\nInstitutional Contact: attendance-office@college.edu\n\nRegards,\nDepartment of {{department_name}}`,
        },
      }));
    } else {
      setTemplates((prev) => ({
        ...prev,
        leave_decision: {
          subject: '[AttendX Update] Leave Request {{status}}: {{start_date}} to {{end_date}}',
          body: `Dear {{student_name}},\n\nYour student leave request submitted for the period from {{start_date}} to {{end_date}} has been reviewed.\n\nStatus: {{status}}\nReviewer: {{reviewer_name}}\nReview Comments: {{review_message}}\n\nYour attendance audit log and official record have been adjusted accordingly in the AttendX system.\n\nAcademic Support Team\nAttendX Attendance Portal`,
        },
      }));
    }
  };

  const currentTemplate = templates[activeTemplateTab];
  const rendered = getRenderedPreview(currentTemplate);

  return (
    <DashboardLayout
      title="System Policies & Automated Alerts"
      subtitle="Configure academic thresholds, automated attendance alert intervals, and official email templates"
    >
      <form onSubmit={handleSaveAll} className="max-w-5xl mx-auto space-y-8">
        {/* Global Save Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Institution Attendance Configuration</h2>
            <p className="text-xs text-slate-500">All adjustments are logged to the regulatory audit trail</p>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors self-end sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration Changes</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              System policies, automated alert intervals, and email templates were successfully updated and saved to the database!
            </span>
          </div>
        )}

        {testEmailResult && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="font-medium">{testEmailResult}</span>
          </div>
        )}

        {/* 1. NEW SECTION: Automated Attendance Alert Intervals & Triggers */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Automated Attendance Alert Intervals</h2>
                <p className="text-xs text-slate-500">
                  Control dispatch frequency and trigger rules for low attendance notices
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 cursor-pointer">
                Automated Alerts
              </label>
              <button
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={emailEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interval Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Automated Dispatch Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'DAILY',
                    title: 'Daily Batch',
                    desc: 'End of academic day summary',
                  },
                  {
                    id: 'WEEKLY',
                    title: 'Weekly Digest',
                    desc: 'Every Friday academic review',
                  },
                  {
                    id: 'BIWEEKLY',
                    title: 'Bi-Weekly',
                    desc: 'Fortnightly compliance audit',
                  },
                  {
                    id: 'INSTANT',
                    title: 'Real-Time Instant',
                    desc: 'Immediately on session close',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAlertIntervalMode(item.id as AlertIntervalMode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      alertIntervalMode === item.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      {alertIntervalMode === item.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Schedule & Trigger Threshold */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Batch Dispatch Time (Local Campus Time)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={alertDispatchTime}
                    onChange={(e) => setAlertDispatchTime(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automated background cron evaluates all student records and delivers email notices at this hour.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Consecutive Unexcused Absences Trigger
                  </label>
                  <span className="text-xs font-bold text-rose-600 tabular-nums">
                    {consecutiveTrigger} Missed Classes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={consecutiveTrigger}
                  onChange={(e) => setConsecutiveTrigger(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Immediately flags students and generates urgent alerts if missed consecutive sessions meet or exceed this number.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    CC Faculty Advisor on Alerts
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Sends duplicate copy to the student&apos;s assigned mentor/teacher
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sendAdvisorCopy}
                  onChange={(e) => setSendAdvisorCopy(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. NEW SECTION: Institutional Email Templates */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Configurable Email Templates</h2>
                <p className="text-xs text-slate-500">
                  Customize institutional messaging with dynamic variable substitution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{showLivePreview ? 'Hide Preview' : 'Show Live Preview'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestEmail}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                title="Send a sample email with current variables to active admin account"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>Send Test Alert</span>
              </button>
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200/70 pb-3">
            {[
              {
                id: 'low_attendance',
                label: 'Low Attendance Warning',
                icon: AlertTriangle,
                color: 'text-amber-600',
              },
              {
                id: 'consecutive_absence',
                label: 'Consecutive Absences Alert',
                icon: Bell,
                color: 'text-rose-600',
              },
              {
                id: 'leave_decision',
                label: 'Leave Request Decision',
                icon: Calendar,
                color: 'text-indigo-600',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTemplateTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateTab(tab.id as TemplateKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleResetCurrentTemplate}
              className="ml-auto px-2.5 py-1.5 text-slate-400 hover:text-slate-700 text-xs font-medium flex items-center gap-1.5"
              title="Reset current template to system default wording"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>
          </div>

          {/* Variable Chips */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Available Dynamic Variables (Click chip to insert):
              </span>
              {copiedVar && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3" /> Inserted {copiedVar}!
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables[activeTemplateTab].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-indigo-600 font-mono text-[11px] font-semibold hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors shadow-2xs"
                  title="Click to insert into template"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Editor & Live Preview Grid */}
          <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* Editor Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={currentTemplate.subject}
                  onChange={(e) =>
                    setTemplates((prev) => ({
                      ...prev,
                      [activeTemplateTab]: {
                        ...prev[activeTemplateTab],
                        subject: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Body Template (Plain Text with Dynamic Tags)
                </label>
                <textarea
                  rows={14}
                  required
                  value={currentTemplate.body}
                  onChange={(e) =>
                    setTemplates((prev) => ({
                      ...prev,
                      [activeTemplateTab]: {
                        ...prev[activeTemplateTab],
                        body: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 font-mono leading-relaxed focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Live Rendered Preview Column */}
            {showLivePreview && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">Recipient Preview</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Simulated for Rahul Varma</span>
                </div>

                <div className="p-4 bg-white flex-1 space-y-3 text-xs">
                  {/* Email Header */}
                  <div className="pb-3 border-b border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 w-12">From:</span>
                      <span>AttendX Academic Administration &lt;alerts@college.edu&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 w-12">To:</span>
                      <span>rahul.student@college.edu</span>
                    </div>
                    {sendAdvisorCopy && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 w-12">CC:</span>
                        <span>prof.sharma@college.edu (Faculty Advisor)</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 pt-1">
                      <span className="font-bold text-slate-900 w-12 text-xs">Subject:</span>
                      <span className="font-semibold text-slate-900 text-xs flex-1">
                        {rendered.subject}
                      </span>
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {rendered.body}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. CORE POLICIES: Minimum Attendance & QR Expiry */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Policies & Thresholds</h2>
              <p className="text-xs text-slate-500">Global academic compliance rules and session security</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Minimum Required Attendance Threshold (%)
                </label>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">{threshold}%</span>
              </div>
              <input
                type="number"
                min="50"
                max="95"
                step="1"
                required
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Students dropping below this percentage receive immediate dashboard warnings and targeted intervention alerts.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  QR Token Validity Duration (Seconds)
                </label>
                <span className="text-xs font-bold text-indigo-600 tabular-nums">{qrExpiry} seconds</span>
              </div>
              <input
                type="number"
                min="30"
                max="600"
                step="10"
                required
                value={qrExpiry}
                onChange={(e) => setQrExpiry(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Cryptographic QR codes rotate and expire within this duration to prevent proxy sharing outside the classroom.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Infrastructure & Database State */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Connection</h2>
              <p className="text-xs text-slate-500">PostgreSQL database, Row Level Security, and Realtime publications</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Supabase Service State:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {isSupabaseConfigured ? 'LIVE POSTGRESQL LINKED' : 'FULL DUAL-STORE ACTIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Database Schema:</span>
              <span className="font-mono text-slate-700">database/schema.sql (19 Tables + RLS)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Audit Trail Persistence:</span>
              <span className="font-mono text-slate-700">Active (Automatic trigger on policy edits)</span>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
