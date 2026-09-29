-- Development Seed SQL for AttendX Student Attendance Management System
-- Use this in your Supabase SQL Editor for testing and development

-- 1. Insert Department
insert into public.departments (id, name, code, description, active)
values
  ('11111111-1111-1111-1111-111111111111', 'Computer Applications & Engineering', 'CAE', 'Department of Computer Applications and Software Engineering', true)
on conflict (code) do update set name = excluded.name;

-- 2. Insert Academic Year
insert into public.academic_years (id, label, start_date, end_date, is_current)
values
  ('22222222-2222-2222-2222-222222222222', '2026-27', '2026-08-01', '2027-05-31', true)
on conflict (label) do update set is_current = excluded.is_current;

-- 3. Insert Semester
insert into public.semesters (id, academic_year_id, name, semester_number)
values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Semester 5', 5)
on conflict (academic_year_id, semester_number) do nothing;

-- 4. Insert Classes
insert into public.classes (id, name, section, department_id, academic_year_id, semester_id, active)
values
  ('44444444-4444-4444-4444-444444444441', 'BCA', '5A', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', true),
  ('44444444-4444-4444-4444-444444444442', 'BCA', '5B', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', true)
on conflict (name, section, academic_year_id) do nothing;

-- 5. Insert Subjects
insert into public.subjects (id, subject_code, subject_name, department_id, semester_id, credits, active)
values
  ('55555555-5555-5555-5555-555555555501', 'CS501', 'Java Programming', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 4.0, true),
  ('55555555-5555-5555-5555-555555555502', 'CS502', 'Database Management Systems', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 4.0, true),
  ('55555555-5555-5555-5555-555555555503', 'CS503', 'Computer Networks', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3.5, true),
  ('55555555-5555-5555-5555-555555555504', 'MA504', 'Discrete Mathematics', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3.0, true)
on conflict (subject_code) do nothing;

-- 6. Insert System Settings
insert into public.system_settings (id, attendance_threshold, qr_expiry_seconds)
values (true, 75.00, 120)
on conflict (id) do update set attendance_threshold = 75.00, qr_expiry_seconds = 120;
