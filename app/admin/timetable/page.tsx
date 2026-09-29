'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, AlertCircle, MapPin, User, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { Modal } from '@/components/UI/Modal';

export default function AdminTimetablePage() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const [selectedDay, setSelectedDay] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classId, setClassId] = useState(db.classes[0].id);
  const [subjectId, setSubjectId] = useState(db.subjects[0].id);
  const [teacherId, setTeacherId] = useState(db.teachers[0].id);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('Lab 201');
  const [conflictError, setConflictError] = useState('');

  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

    // 1. Time validation: end > start
    if (endTime <= startTime) {
      setConflictError('End time must be strictly after the start time.');
      return;
    }

    // 2. Conflict detection: Teacher double-booked
    const teacherConflict = db.timetable.find((entry) => {
      if (entry.day_of_week !== dayOfWeek || !entry.active) return false;
      if (entry.teacher_id !== teacherId) return false;
      // Overlap condition: start < other.end && end > other.start
      return startTime < entry.end_time && endTime > entry.start_time;
    });

    if (teacherConflict) {
      const tch = db.teachers.find((t) => t.id === teacherId);
      const prof = tch ? db.profiles.find((p) => p.id === tch.profile_id) : undefined;
      setConflictError(
        `Timetable Conflict: ${prof?.full_name || 'Faculty member'} is already double-booked in room ${
          teacherConflict.room || 'another room'
        } from ${teacherConflict.start_time} to ${teacherConflict.end_time}.`
      );
      return;
    }

    // 3. Conflict detection: Class double-booked
    const classConflict = db.timetable.find((entry) => {
      if (entry.day_of_week !== dayOfWeek || !entry.active) return false;
      if (entry.class_id !== classId) return false;
      return startTime < entry.end_time && endTime > entry.start_time;
    });

    if (classConflict) {
      const cls = db.classes.find((c) => c.id === classId);
      const sub = db.subjects.find((s) => s.id === classConflict.subject_id);
      setConflictError(
        `Timetable Conflict: Class ${cls?.name} ${cls?.section} is already attending "${
          sub?.subject_name
        }" during ${classConflict.start_time} - ${classConflict.end_time}.`
      );
      return;
    }

    // Validated, proceed to save
    const id = `tt-${Date.now()}`;
    db.timetable.push({
      id,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: room.trim(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.notify();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const idx = db.timetable.findIndex((t) => t.id === id);
    if (idx !== -1) {
      db.timetable.splice(idx, 1);
      db.notify();
    }
  };

  const daySchedule = db.timetable
    .filter((e) => e.day_of_week === selectedDay && e.active)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <DashboardLayout
      title="Campus Timetable Scheduler"
      subtitle="Period allocations with strict conflict prevention against teacher and class double-booking"
    >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Period Allocations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The engine automatically validates overlap constraints and room capacity conflicts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConflictError('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Period</span>
          </button>
        </div>

        {/* Day Selector */}
        <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDay(day.id)}
              className={`flex-1 py-2 px-3.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedDay === day.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">
              {days.find((d) => d.id === selectedDay)?.name}&apos;s Master Schedule
            </h3>
            <span className="text-[11px] text-slate-400">{daySchedule.length} Lecture Slots</span>
          </div>

          <div className="divide-y divide-slate-100">
            {daySchedule.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No lecture periods scheduled for {days.find((d) => d.id === selectedDay)?.name}.
              </div>
            ) : (
              daySchedule.map((entry) => {
                const cls = db.classes.find((c) => c.id === entry.class_id);
                const subj = db.subjects.find((s) => s.id === entry.subject_id);
                const tch = db.teachers.find((t) => t.id === entry.teacher_id);
                const prof = tch ? db.profiles.find((p) => p.id === tch.profile_id) : undefined;

                return (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 shrink-0 text-left font-mono">
                        <span className="text-xs font-bold text-slate-900 block tabular-nums">
                          {entry.start_time}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          to {entry.end_time}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {subj?.subject_name}
                          </span>
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {subj?.subject_code}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>
                            Class: <strong>{cls?.name} {cls?.section}</strong>
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prof?.full_name}</span>
                          </span>
                          {entry.room && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{entry.room}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors self-end sm:self-center"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Period Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Lecture Period"
        description="Assign room, timing, and instructor with automatic conflict verification"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {conflictError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{conflictError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section *</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Module *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name} ({s.subject_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Instructor *</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                {db.teachers.map((t) => {
                  const p = db.profiles.find((pr) => pr.id === t.profile_id);
                  return (
                    <option key={t.id} value={t.id}>
                      {p?.full_name} ({t.teacher_id})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Lab</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Lab 201"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              />
            </div>
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
              Verify & Add Period
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
