-- Supabase PostgreSQL Schema for Production Student Attendance Management System
-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.app_role as enum ('ADMIN', 'TEACHER', 'STUDENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('OPEN', 'CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.announcement_target_type as enum ('GLOBAL', 'CLASS');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('ATTENDANCE', 'LOW_ATTENDANCE', 'LEAVE', 'ANNOUNCEMENT', 'SYSTEM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_action as enum (
    'LOGIN',
    'CREATE_STUDENT',
    'UPDATE_STUDENT',
    'CREATE_TEACHER',
    'UPDATE_TEACHER',
    'ASSIGN_TEACHER',
    'ASSIGN_STUDENT',
    'CREATE_ATTENDANCE_SESSION',
    'OPEN_ATTENDANCE_SESSION',
    'CLOSE_ATTENDANCE_SESSION',
    'MARK_ATTENDANCE',
    'EDIT_ATTENDANCE',
    'GENERATE_QR',
    'SUBMIT_LEAVE',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CREATE_ANNOUNCEMENT',
    'UPDATE_SETTINGS'
  );
exception when duplicate_object then null; end $$;

-- 1. Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'STUDENT',
  full_name text not null default '',
  email text,
  phone text,
  avatar_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_code_unique unique (code)
);

-- 3. Academic Years
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_year_dates_check check (end_date > start_date),
  constraint academic_year_label_unique unique (label)
);

create unique index if not exists academic_years_single_current_idx
on public.academic_years (is_current)
where is_current = true;

-- 4. Semesters
create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  name text not null,
  semester_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint semesters_number_check check (semester_number > 0),
  constraint semesters_unique_number
    unique (academic_year_id, semester_number)
);

-- 5. Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text not null,
  department_id uuid not null references public.departments(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  semester_id uuid references public.semesters(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_name_section_year_unique
    unique (name, section, academic_year_id)
);

-- 6. Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null,
  subject_name text not null,
  department_id uuid references public.departments(id) on delete restrict,
  semester_id uuid references public.semesters(id) on delete restrict,
  credits numeric(4,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_code_unique unique (subject_code),
  constraint subjects_credits_check check (credits is null or credits >= 0)
);

-- 7. Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  student_id text not null unique,
  department_id uuid references public.departments(id) on delete restrict,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Teachers
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  teacher_id text not null unique,
  department_id uuid references public.departments(id) on delete restrict,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Student Enrollments
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  roll_number text not null,
  joined_at date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists student_active_enrollment_unique
on public.student_enrollments(student_id)
where active = true;

-- 10. Teacher Assignments
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  semester_id uuid references public.semesters(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_assignment_unique
    unique (teacher_id, class_id, subject_id, academic_year_id, semester_id)
);

-- 11. Timetable
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  room text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_day_check check (day_of_week between 1 and 7),
  constraint timetable_time_check check (end_time > start_time)
);

-- 12. Attendance Sessions
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  semester_id uuid references public.semesters(id) on delete restrict,
  session_date date not null,
  start_time time,
  end_time time,
  status public.session_status not null default 'OPEN',
  qr_token_hash text,
  qr_expires_at timestamptz,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- 13. Attendance Records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  status public.attendance_status not null,
  note text,
  marked_by uuid not null references public.profiles(id) on delete restrict,
  marked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_one_student_per_session unique (session_id, student_id)
);

-- 14. Attendance Audit
create table if not exists public.attendance_audit (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  old_status public.attendance_status,
  new_status public.attendance_status,
  reason text,
  created_at timestamptz not null default now()
);

-- 15. Leave Requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  reason text not null,
  document_path text,
  status public.leave_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id) on delete restrict,
  review_message text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint leave_dates_check check (end_date >= start_date)
);

-- 16. Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_type public.announcement_target_type not null default 'GLOBAL',
  target_class_id uuid references public.classes(id) on delete restrict,
  priority integer not null default 0,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcement_target_check check (
    (target_type = 'GLOBAL' and target_class_id is null)
    or
    (target_type = 'CLASS' and target_class_id is not null)
  )
);

-- 17. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 18. System Settings
create table if not exists public.system_settings (
  id boolean primary key default true,
  attendance_threshold numeric(5,2) not null default 75.00,
  qr_expiry_seconds integer not null default 120,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint settings_threshold_check check (attendance_threshold between 0 and 100),
  constraint settings_qr_check check (qr_expiry_seconds between 30 and 3600)
);

insert into public.system_settings(id)
values (true)
on conflict (id) do nothing;

-- 19. Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Updated_at Trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists departments_updated_at on public.departments;
create trigger departments_updated_at before update on public.departments for each row execute function public.set_updated_at();

drop trigger if exists academic_years_updated_at on public.academic_years;
create trigger academic_years_updated_at before update on public.academic_years for each row execute function public.set_updated_at();

drop trigger if exists semesters_updated_at on public.semesters;
create trigger semesters_updated_at before update on public.semesters for each row execute function public.set_updated_at();

drop trigger if exists classes_updated_at on public.classes;
create trigger classes_updated_at before update on public.classes for each row execute function public.set_updated_at();

drop trigger if exists subjects_updated_at on public.subjects;
create trigger subjects_updated_at before update on public.subjects for each row execute function public.set_updated_at();

drop trigger if exists students_updated_at on public.students;
create trigger students_updated_at before update on public.students for each row execute function public.set_updated_at();

drop trigger if exists teachers_updated_at on public.teachers;
create trigger teachers_updated_at before update on public.teachers for each row execute function public.set_updated_at();

drop trigger if exists enrollments_updated_at on public.student_enrollments;
create trigger enrollments_updated_at before update on public.student_enrollments for each row execute function public.set_updated_at();

drop trigger if exists assignments_updated_at on public.teacher_assignments;
create trigger assignments_updated_at before update on public.teacher_assignments for each row execute function public.set_updated_at();

drop trigger if exists timetable_updated_at on public.timetable;
create trigger timetable_updated_at before update on public.timetable for each row execute function public.set_updated_at();

drop trigger if exists attendance_records_updated_at on public.attendance_records;
create trigger attendance_records_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();

drop trigger if exists leave_requests_updated_at on public.leave_requests;
create trigger leave_requests_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();

drop trigger if exists announcements_updated_at on public.announcements;
create trigger announcements_updated_at before update on public.announcements for each row execute function public.set_updated_at();

-- Handle new user auth trigger
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    email
  )
  values (
    new.id,
    'STUDENT',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Role helper functions
create or replace function public.is_admin()
returns boolean
security definer
set search_path = public
stable
as $$
declare
  user_role public.app_role;
begin
  select role into user_role
  from public.profiles
  where id = auth.uid() and active = true;

  return user_role = 'ADMIN';
end;
$$;

create or replace function public.is_teacher()
returns boolean
security definer
set search_path = public
stable
as $$
declare
  user_role public.app_role;
begin
  select role into user_role
  from public.profiles
  where id = auth.uid() and active = true;

  return user_role = 'TEACHER';
end;
$$;

create or replace function public.is_student()
returns boolean
security definer
set search_path = public
stable
as $$
declare
  user_role public.app_role;
begin
  select role into user_role
  from public.profiles
  where id = auth.uid() and active = true;

  return user_role = 'STUDENT';
end;
$$;

-- Indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_students_profile on public.students(profile_id);
create index if not exists idx_teachers_profile on public.teachers(profile_id);
create index if not exists idx_enrollments_student on public.student_enrollments(student_id);
create index if not exists idx_enrollments_class on public.student_enrollments(class_id);
create index if not exists idx_assignments_teacher on public.teacher_assignments(teacher_id);
create index if not exists idx_assignments_class on public.teacher_assignments(class_id);
create index if not exists idx_assignments_subject on public.teacher_assignments(subject_id);
create index if not exists idx_timetable_class on public.timetable(class_id);
create index if not exists idx_timetable_teacher on public.timetable(teacher_id);
create index if not exists idx_attendance_sessions_date on public.attendance_sessions(session_date);
create index if not exists idx_attendance_sessions_teacher on public.attendance_sessions(teacher_id);
create index if not exists idx_attendance_sessions_class on public.attendance_sessions(class_id);
create index if not exists idx_attendance_sessions_subject on public.attendance_sessions(subject_id);
create index if not exists idx_attendance_records_student on public.attendance_records(student_id);
create index if not exists idx_attendance_records_session on public.attendance_records(session_id);
create index if not exists idx_attendance_records_status on public.attendance_records(status);
create index if not exists idx_leave_requests_student on public.leave_requests(student_id);
create index if not exists idx_leave_requests_status on public.leave_requests(status);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_notifications_unread on public.notifications(recipient_id, is_read);
create index if not exists idx_announcements_target_class on public.announcements(target_class_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- Attendance summary view
create or replace view public.student_attendance_summary
with (security_invoker = true)
as
select
  ar.student_id,
  s.id as session_id,
  s.class_id,
  s.subject_id,
  s.teacher_id,
  s.session_date,
  ar.status,
  case when ar.status in ('PRESENT', 'LATE') then 1 else 0 end as attended_count,
  case when ar.status in ('PRESENT', 'ABSENT', 'LATE') then 1 else 0 end as counted_count
from public.attendance_records ar
join public.attendance_sessions s on s.id = ar.session_id;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.timetable enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_audit enable row level security;
alter table public.leave_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Policies (safe creation)
do $$ begin
  create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy departments_select_authenticated on public.departments for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy academic_years_select_authenticated on public.academic_years for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy semesters_select_authenticated on public.semesters for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy classes_select_authenticated on public.classes for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy subjects_select_authenticated on public.subjects for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy students_select_own_or_admin on public.students for select to authenticated using (profile_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy teachers_select_own_or_admin on public.teachers for select to authenticated using (profile_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy enrollments_select_own_student_or_admin on public.student_enrollments for select to authenticated using (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid()) or public.is_admin()
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy assignments_select_authenticated on public.teacher_assignments for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy timetable_select_authenticated on public.timetable for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attendance_sessions_select_authenticated on public.attendance_sessions for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attendance_records_select_own_student on public.attendance_records for select to authenticated using (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid()) or public.is_admin()
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy leave_requests_student_select on public.leave_requests for select to authenticated using (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid()) or public.is_admin()
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy notifications_select_own on public.notifications for select to authenticated using (recipient_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy announcements_select_authenticated on public.announcements for select to authenticated using (
    target_type = 'GLOBAL'
    or public.is_admin()
    or target_class_id in (
      select se.class_id from public.student_enrollments se
      join public.students st on st.id = se.student_id
      where st.profile_id = auth.uid() and se.active = true
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy system_settings_select_authenticated on public.system_settings for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy admin_audit_logs_select on public.audit_logs for select to authenticated using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attendance_audit_select_admin on public.attendance_audit for select to authenticated using (public.is_admin());
exception when duplicate_object then null; end $$;

-- Enable Supabase Realtime
do $$ begin
  alter publication supabase_realtime add table public.attendance_sessions;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.attendance_records;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.leave_requests;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.announcements;
exception when others then null; end $$;
