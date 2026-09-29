'use client';

import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { db } from '@/lib/db';

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // 1 = Monday

  const timetableEntries = db.timetable;
  const subjects = db.subjects;
  const teachers = db.teachers;
  const profiles = db.profiles;

  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
  ];

  // Enrich timetable items
  const enrichedEntries = timetableEntries.map((item) => {
    const subj = subjects.find((s) => s.id === item.subject_id);
    const teacher = teachers.find((t) => t.id === item.teacher_id);
    const teacherProfile = teacher ? profiles.find((p) => p.id === teacher.profile_id) : undefined;

    return {
      ...item,
      subject_name: subj?.subject_name || 'Class',
      subject_code: subj?.subject_code || '',
      teacher_name: teacherProfile?.full_name || 'Faculty',
    };
  });

  const daySchedule = enrichedEntries
    .filter((e) => e.day_of_week === selectedDay && e.active)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <DashboardLayout
      title="Weekly Timetable"
      subtitle="Class schedule, lecture timing, faculty instructors, and lab room allocations"
    >
      <div className="space-y-6">
        {/* Day of Week Selector */}
        <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between overflow-x-auto gap-2">
          {days.map((day) => {
            const isSelected = selectedDay === day.id;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {day.name}
              </button>
            );
          })}
        </div>

        {/* Schedule List for Selected Day */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">
              {days.find((d) => d.id === selectedDay)?.name}&apos;s Lectures
            </h3>
            <span className="text-[11px] text-slate-400">Class: BCA 5A</span>
          </div>

          <div className="divide-y divide-slate-100">
            {daySchedule.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No classes scheduled for this day.
              </div>
            ) : (
              daySchedule.map((period, idx) => (
                <div
                  key={period.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Time Slot Tag */}
                    <div className="w-24 shrink-0 text-left">
                      <span className="text-xs font-mono font-bold text-slate-900 tabular-nums block">
                        {period.start_time}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        to {period.end_time}
                      </span>
                    </div>

                    {/* Subject & Teacher Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-600 font-semibold">
                          {period.subject_code}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {period.subject_name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{period.teacher_name}</span>
                        </span>
                        {period.room && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{period.room}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 sm:text-right">
                    Period #{idx + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
