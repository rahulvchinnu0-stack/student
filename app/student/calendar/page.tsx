'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

export default function StudentCalendarPage() {
  const { student } = useAuth();
  const studentId = student?.id || 'stu-rahul';

  // Current calendar viewing month
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const studentRecords = db.getStudentAttendance(studentId);

  // Map of records by date
  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof studentRecords>();
    studentRecords.forEach((rec) => {
      const existing = map.get(rec.session_date) || [];
      existing.push(rec);
      map.set(rec.session_date, existing);
    });
    return map;
  }, [studentRecords]);

  // Calendar dates generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthRecords = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return studentRecords.filter((r) => r.session_date.startsWith(prefix));
  }, [studentRecords, currentYear, currentMonth]);

  let monthP = 0, monthA = 0, monthL = 0, monthE = 0;
  monthRecords.forEach((r) => {
    if (r.status === 'PRESENT') monthP++;
    else if (r.status === 'ABSENT') monthA++;
    else if (r.status === 'LATE') monthL++;
    else if (r.status === 'EXCUSED') monthE++;
  });
  const monthAttended = monthP + monthL;
  const monthCounted = monthP + monthA + monthL;
  const monthPercentage = monthCounted > 0 ? Math.round((monthAttended / monthCounted) * 10000) / 100 : 100;

  const selectedDateRecords = selectedDate ? recordsByDate.get(selectedDate) || [] : [];

  return (
    <DashboardLayout
      title="Attendance Calendar"
      subtitle="Interactive monthly breakdown of daily lectures and attendance statuses"
    >
      <div className="space-y-5">
        {/* Month Navigation & Statistics Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          {/* Month Totals */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">
              Total Lectures: <strong className="text-slate-900 tabular-nums">{monthRecords.length}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700">
              P: <strong className="tabular-nums">{monthP}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-rose-700">
              A: <strong className="tabular-nums">{monthA}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-700">
              L: <strong className="tabular-nums">{monthL}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-purple-700">
              E: <strong className="tabular-nums">{monthE}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-slate-900">
              Rate:{' '}
              <strong className={`tabular-nums ${monthPercentage < 75 ? 'text-rose-600' : 'text-slate-900'}`}>
                {monthPercentage}%
              </strong>
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center py-2.5 text-xs font-semibold text-slate-500">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[460px]">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;
              const dayRecords = recordsByDate.get(dateString) || [];
              const isToday = dateString === '2026-09-29';

              return (
                <div
                  key={dateString}
                  onClick={() => dayRecords.length > 0 && setSelectedDate(dateString)}
                  className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors ${
                    dayRecords.length > 0 ? 'cursor-pointer hover:bg-slate-50/90' : 'bg-white'
                  } ${isToday ? 'ring-2 ring-indigo-600 ring-inset bg-indigo-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayRecords.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dayRecords.length} cl.
                      </span>
                    )}
                  </div>

                  {/* Badges for day records */}
                  <div className="mt-1 space-y-1">
                    {dayRecords.map((r) => {
                      let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      let code = 'P';
                      if (r.status === 'ABSENT') {
                        color = 'bg-rose-50 text-rose-700 border-rose-200';
                        code = 'A';
                      } else if (r.status === 'LATE') {
                        color = 'bg-amber-50 text-amber-700 border-amber-200';
                        code = 'L';
                      } else if (r.status === 'EXCUSED') {
                        color = 'bg-purple-50 text-purple-700 border-purple-200';
                        code = 'E';
                      }

                      return (
                        <div
                          key={r.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${color} truncate font-medium flex items-center justify-between`}
                        >
                          <span className="truncate">{r.subject_name.split(' ')[0]}</span>
                          <span className="font-bold ml-1">{code}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>P = Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>A = Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>L = Late (Attended)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>E = Excused</span>
          </div>
        </div>
      </div>

      {/* Date Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        title={`Attendance Records: ${selectedDate}`}
        description="Detailed log of all lecture sessions marked on this date"
      >
        <div className="space-y-3">
          {selectedDateRecords.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No records for this date.</p>
          ) : (
            selectedDateRecords.map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900">{rec.subject_name}</span>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Faculty: {rec.teacher_name}</span>
                  <span className="font-mono tabular-nums">{rec.start_time} - {rec.end_time}</span>
                </div>
                {rec.note && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
                    Note: {rec.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
