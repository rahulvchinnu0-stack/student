'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, CheckCircle2, AlertCircle, Info, Sparkles, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { calculateRequiredClasses } from '@/lib/types';

export default function StudentCalculatorPage() {
  const { student } = useAuth();
  const studentId = student?.id || 'stu-rahul';

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('OVERALL');
  const [targetPercent, setTargetPercent] = useState<number>(75);

  const subjects = db.subjects;
  const overallStats = db.getStudentOverallStats(studentId);
  const subjectStatsList = db.getStudentSubjectStats(studentId);

  // Compute active stats for selection
  const activeStats = useMemo(() => {
    if (selectedSubjectId === 'OVERALL') {
      return {
        name: 'Overall Academic Attendance',
        code: 'ALL',
        attended: overallStats.attendedCount,
        counted: overallStats.countedCount,
        percentage: overallStats.percentage,
      };
    }
    const subjData = subjectStatsList.find((s) => s.subject.id === selectedSubjectId);
    if (subjData) {
      return {
        name: subjData.subject.subject_name,
        code: subjData.subject.subject_code,
        attended: subjData.stats.attendedCount,
        counted: subjData.stats.countedCount,
        percentage: subjData.stats.percentage,
      };
    }
    return {
      name: 'Overall Attendance',
      code: 'ALL',
      attended: overallStats.attendedCount,
      counted: overallStats.countedCount,
      percentage: overallStats.percentage,
    };
  }, [selectedSubjectId, overallStats, subjectStatsList]);

  const calculation = useMemo(() => {
    return calculateRequiredClasses(activeStats.attended, activeStats.counted, targetPercent);
  }, [activeStats, targetPercent]);

  return (
    <DashboardLayout
      title="Attendance Target Calculator"
      subtitle="Calculate exact consecutive classes required to reach or maintain your attendance goals"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main Calculator Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Target Simulator</h2>
              <p className="text-xs text-slate-500">
                Grounded formula: <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">(attended + N) / (counted + N) ≥ Target</code>
              </p>
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Scope
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-medium py-2.5 px-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="OVERALL">Overall Attendance (All Subjects Combined)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subject_name} ({sub.subject_code})
                </option>
              ))}
            </select>
          </div>

          {/* Current Metrics Display */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Current Attendance</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {activeStats.percentage}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Attended Classes</span>
              <span className="text-2xl font-bold text-emerald-600 tabular-nums">
                {activeStats.attended}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Counted Classes</span>
              <span className="text-2xl font-bold text-slate-700 tabular-nums">
                {activeStats.counted}
              </span>
            </div>
          </div>

          {/* Target Percentage Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Desired Target Attendance
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                  className="w-16 text-center text-xs font-bold py-1 px-2 border border-slate-300 rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>

            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={targetPercent}
              onChange={(e) => setTargetPercent(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            {/* Quick preset buttons */}
            <div className="flex gap-2">
              {[75, 80, 85, 90].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetPercent(preset)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                    targetPercent === preset
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Output Card */}
          <div
            className={`p-5 rounded-xl border ${
              activeStats.percentage >= targetPercent
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : !calculation.achievable
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {activeStats.percentage >= targetPercent ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Above Required Target</h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    You are currently above the {targetPercent}% attendance target with{' '}
                    <strong className="tabular-nums">{activeStats.percentage}%</strong>. Keep attending
                    scheduled classes to retain your safe standing.
                  </p>
                </div>
              </div>
            ) : !calculation.achievable ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">Mathematically Impossible</h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    {calculation.message} Because unexcused absences have already been logged, reaching{' '}
                    {targetPercent}% is unreachable unless excused or compensated by approved faculty leave.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Action Plan</h4>
                  <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                    To raise your attendance from{' '}
                    <strong className="tabular-nums">{activeStats.percentage}%</strong> to{' '}
                    <strong className="tabular-nums">{targetPercent}%</strong>, you need to attend the next{' '}
                    <span className="text-sm font-extrabold text-indigo-950 tabular-nums">
                      {calculation.needed} consecutive classes
                    </span>{' '}
                    without any unexcused absences.
                  </p>
                  <div className="mt-2 text-[11px] text-indigo-700/80 font-mono">
                    Projected: ({activeStats.attended} + {calculation.needed}) / ({activeStats.counted} + {calculation.needed}) ={' '}
                    {(
                      ((activeStats.attended + calculation.needed) /
                        (activeStats.counted + calculation.needed)) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
