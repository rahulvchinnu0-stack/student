export type AppRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type SessionStatus = 'OPEN' | 'CLOSED';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type AnnouncementTargetType = 'GLOBAL' | 'CLASS';

export type NotificationType = 'ATTENDANCE' | 'LOW_ATTENDANCE' | 'LEAVE' | 'ANNOUNCEMENT' | 'SYSTEM';

export type AuditAction =
  | 'LOGIN'
  | 'CREATE_STUDENT'
  | 'UPDATE_STUDENT'
  | 'CREATE_TEACHER'
  | 'UPDATE_TEACHER'
  | 'ASSIGN_TEACHER'
  | 'ASSIGN_STUDENT'
  | 'CREATE_ATTENDANCE_SESSION'
  | 'OPEN_ATTENDANCE_SESSION'
  | 'CLOSE_ATTENDANCE_SESSION'
  | 'MARK_ATTENDANCE'
  | 'EDIT_ATTENDANCE'
  | 'GENERATE_QR'
  | 'SUBMIT_LEAVE'
  | 'APPROVE_LEAVE'
  | 'REJECT_LEAVE'
  | 'CREATE_ANNOUNCEMENT'
  | 'UPDATE_SETTINGS';

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_path?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  name: string;
  semester_number: number;
  created_at: string;
  updated_at: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  section: string;
  department_id: string;
  academic_year_id: string;
  semester_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  department_id?: string;
  semester_id?: string;
  credits?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  student_id: string;
  department_id?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // expanded joined fields for display
  profile?: Profile;
  department?: Department;
  enrollment?: StudentEnrollment;
}

export interface Teacher {
  id: string;
  profile_id: string;
  teacher_id: string;
  department_id?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // expanded
  profile?: Profile;
  department?: Department;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  roll_number: string;
  joined_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  class_room?: ClassRoom;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  semester_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  class_room?: ClassRoom;
  subject?: Subject;
}

export interface TimetableEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number; // 1 = Monday ... 7 = Sunday
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;
  room?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  class_room?: ClassRoom;
  subject?: Subject;
  teacher?: Teacher;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  academic_year_id: string;
  semester_id?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  status: SessionStatus;
  qr_token_hash?: string;
  qr_expires_at?: string;
  created_at: string;
  closed_at?: string;
  class_room?: ClassRoom;
  subject?: Subject;
  teacher?: Teacher;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  note?: string;
  marked_by: string;
  marked_at: string;
  updated_at: string;
  student?: Student;
  session?: AttendanceSession;
}

export interface AttendanceAudit {
  id: string;
  attendance_record_id: string;
  actor_id: string;
  old_status?: AttendanceStatus;
  new_status?: AttendanceStatus;
  reason?: string;
  created_at: string;
  actor?: Profile;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  document_path?: string;
  status: LeaveStatus;
  reviewed_by?: string;
  review_message?: string;
  submitted_at: string;
  reviewed_at?: string;
  updated_at: string;
  student?: Student;
  reviewer?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_type: AnnouncementTargetType;
  target_class_id?: string;
  priority: number;
  published_at: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  target_class?: ClassRoom;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export type AlertIntervalMode = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY';

export interface EmailTemplateConfig {
  subject: string;
  body: string;
}

export interface SystemSettings {
  id: boolean;
  attendance_threshold: number; // e.g. 75.00
  qr_expiry_seconds: number; // e.g. 120
  alert_interval_mode?: AlertIntervalMode;
  alert_dispatch_time?: string; // e.g. "17:00"
  consecutive_absence_trigger?: number; // e.g. 3
  email_notifications_enabled?: boolean;
  send_advisor_copy?: boolean;
  email_templates?: {
    low_attendance: EmailTemplateConfig;
    consecutive_absence: EmailTemplateConfig;
    leave_decision: EmailTemplateConfig;
  };
  updated_by?: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}

// Attendance Calculation Helpers
export interface AttendanceStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendedCount: number; // PRESENT + LATE
  countedCount: number;  // PRESENT + ABSENT + LATE (EXCUSED is excluded from denominator)
  percentage: number;    // (attended / counted) * 100 rounded to 2 decimals
}

export function calculateAttendanceStats(records: Array<{ status: AttendanceStatus }>): AttendanceStats {
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  for (const r of records) {
    if (r.status === 'PRESENT') presentCount++;
    else if (r.status === 'ABSENT') absentCount++;
    else if (r.status === 'LATE') lateCount++;
    else if (r.status === 'EXCUSED') excusedCount++;
  }

  const attendedCount = presentCount + lateCount;
  const countedCount = presentCount + absentCount + lateCount;
  const percentage = countedCount > 0 ? Math.round((attendedCount / countedCount) * 10000) / 100 : 100.0;

  return {
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendedCount,
    countedCount,
    percentage,
  };
}

/**
 * Calculates the smallest non-negative integer N such that:
 * (attended + N) / (counted + N) >= targetPercentage / 100
 */
export function calculateRequiredClasses(
  attended: number,
  counted: number,
  targetPercentage: number
): { needed: number; achievable: boolean; message: string } {
  if (targetPercentage <= 0) {
    return { needed: 0, achievable: true, message: 'Target percentage is 0% or negative.' };
  }
  if (targetPercentage > 100) {
    return { needed: 0, achievable: false, message: 'Target percentage cannot exceed 100%.' };
  }

  if (counted === 0) {
    return { needed: 0, achievable: true, message: 'No classes have taken place yet.' };
  }

  const currentPercent = (attended / counted) * 100;
  if (currentPercent >= targetPercentage) {
    return {
      needed: 0,
      achievable: true,
      message: 'You are currently above the required attendance threshold.',
    };
  }

  const targetRatio = targetPercentage / 100;
  // Formula derivation:
  // (attended + N) / (counted + N) >= T
  // attended + N >= T * counted + T * N
  // N * (1 - T) >= T * counted - attended
  // N >= (T * counted - attended) / (1 - T)
  const numerator = targetRatio * counted - attended;
  const denominator = 1 - targetRatio;

  if (denominator <= 0) {
    // 100% target when already missed classes is impossible unless target == 100 and no absences
    return {
      needed: -1,
      achievable: false,
      message: '100% attendance is mathematically impossible because absences have already been recorded.',
    };
  }

  const N = Math.ceil(numerator / denominator);
  const needed = Math.max(0, N);

  return {
    needed,
    achievable: true,
    message: `You need to attend the next ${needed} consecutive class${needed === 1 ? '' : 'es'} to reach ${targetPercentage}%.`,
  };
}
