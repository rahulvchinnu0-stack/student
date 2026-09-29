'use client';

import React from 'react';
import { AttendanceStatus, LeaveStatus, SessionStatus } from '@/lib/types';

interface BadgeProps {
  status: AttendanceStatus | LeaveStatus | SessionStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: BadgeProps) {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let symbol = '•';

  switch (status) {
    case 'PRESENT':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      symbol = '✓';
      break;
    case 'ABSENT':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      symbol = '×';
      break;
    case 'LATE':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      symbol = '!';
      break;
    case 'EXCUSED':
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      symbol = 'E';
      break;
    case 'OPEN':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      symbol = '●';
      break;
    case 'CLOSED':
      bg = 'bg-slate-100 text-slate-600 border-slate-200';
      symbol = '○';
      break;
    case 'APPROVED':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      symbol = '✓';
      break;
    case 'PENDING':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      symbol = '◷';
      break;
    case 'REJECTED':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      symbol = '×';
      break;
    case 'CANCELLED':
      bg = 'bg-slate-100 text-slate-500 border-slate-200';
      symbol = '⊘';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${bg} ${className}`}
    >
      <span className="font-bold text-[11px]" aria-hidden="true">
        {symbol}
      </span>
      <span>{status}</span>
    </span>
  );
}
