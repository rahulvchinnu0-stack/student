# AttendX — Production Student Attendance Management System

A production-grade, full-stack Student Attendance Management System built with **React**, **Next.js**, **Java Spring Boot**, and **Supabase PostgreSQL**.

---

## 1. Architecture Overview

- **Frontend & Client Dashboard**: Next.js App Router, Tailwind CSS, Lucide Icons, QR camera decoder (`jsQR`), dynamic canvas QR generation (`qrcode`), and client-side multi-format export engines (`xlsx`, `jspdf`).
- **Backend Application**: Java 17, Spring Boot 3.3.4, Spring Security, Spring Data JPA, JWT validation for Supabase bearer tokens, and audit logging.
- **Database & Storage**: Supabase PostgreSQL 15+ with Row Level Security (RLS) policies, Realtime publications for attendance events, and encrypted private storage for student medical/official leave documents.

---

## 2. Role-Based Features

### Student Portal (`/student/*`)
- **Overall Attendance**: Present, Absent, Late, Excused breakdown with mathematically verified percentage.
- **Attendance Records (`/student/attendance`)**: Complete log with Subject, Faculty, Timing, and Status filters.
- **Attendance Calendar (`/student/calendar`)**: Interactive monthly view with `P`, `A`, `L`, `E` status indicators and date inspection.
- **Target Calculator (`/student/calculator`)**: Computes smallest integer $N$ consecutive future classes needed to satisfy target percentage: $\frac{\text{attended} + N}{\text{counted} + N} \ge \text{Target}$.
- **Class Timetable (`/student/timetable`)**: Day-wise lectures, room numbers, and faculty assignments.
- **Leave Requests (`/student/leave`)**: Medical and academic leave application with PDF/PNG/JPG file upload up to 10MB.
- **Camera QR Scanner (`/student/scan`)**: Real-time camera scanner with permissions handling, live token verification, duplicate prevention, and offline/desktop code entry fallback.

### Faculty / Teacher Portal (`/teacher/*`)
- **Teacher Dashboard (`/teacher/dashboard`)**: Assigned courses, active attendance sessions, pending leave requests, and students below the 75% attendance threshold.
- **Mark Class Attendance (`/teacher/attendance`)**: Quick batch actions (*Mark All Present*, *Mark All Absent*, *Reset*), individual roll status toggles, and notes.
- **Live QR Projection (`/teacher/sessions`)**: Generates rotating cryptographically hashed QR tokens with configurable countdown timer (default 120s) and real-time student check-in feed.
- **Leave Reviews (`/teacher/leave`)**: Review leave petitions, examine medical certificates, and approve/reject with remarks.
- **Reports & Exports (`/teacher/reports`)**: Filter by class, subject, date, status, and generate real CSV, XLSX, and PDF transcripts.
- **Announcements (`/teacher/announcements`)**: Publish class-targeted or campus-wide bulletins.

### Dean / Admin Console (`/admin/*`)
- **Campus Metrics (`/admin/dashboard`)**: Student totals, faculty counts, department summaries, and at-risk students.
- **Student Enrollment (`/admin/students`)**: Enroll students, assign class sections, roll numbers, and soft-deactivate accounts.
- **Faculty Directory (`/admin/teachers`)**: Appoint teachers and manage departmental assignments.
- **Timetable Scheduler (`/admin/timetable`)**: Conflict-checked scheduler preventing faculty double-booking and room collisions.
- **Audit Logs (`/admin/audit-logs`)**: Immutable logging of administrative and attendance operations.
- **System Settings (`/admin/settings`)**: Configurable attendance threshold and QR expiry window.

---

## 3. Database Schema & Supabase Setup

The schema is defined in `database/schema.sql`.

### Installation Steps in Supabase:
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Copy and execute `database/schema.sql`.
3. Optionally execute `database/seed.sql` to populate sample departments, BCA classes, curriculum subjects, and past records.
4. Go to **Storage** -> Create a private bucket named `leave-documents`.

---

## 4. Environment Variables

### Frontend / Web App (`.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### Spring Boot Backend (`backend/src/main/resources/application.yml`):
```env
SUPABASE_DB_URL=jdbc:postgresql://db.your-project.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
FRONTEND_URL=http://localhost:3000
```

---

## 5. Running the Application

### Running the Web Application (Port 3000):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Spring Boot Backend (Port 8080):
```bash
cd backend
mvn clean spring-boot:run
```

### Building for Production:
```bash
# Frontend
npm run build

# Backend Docker
cd backend
docker build -t attendx-backend:1.0 .
docker run -p 8080:8080 attendx-backend:1.0
```

---

## 6. Attendance Calculation Rules

- **PRESENT**: Counted as attended ($+1$).
- **LATE**: Counted as attended ($+1$).
- **ABSENT**: Counted as not attended ($0$).
- **EXCUSED**: Excluded from both numerator and denominator.

$$\text{Attendance \%} = \left(\frac{\text{PRESENT} + \text{LATE}}{\text{PRESENT} + \text{ABSENT} + \text{LATE}}\right) \times 100$$
