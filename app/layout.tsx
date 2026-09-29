import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/authContext';

export const metadata: Metadata = {
  title: 'AttendX - Student Attendance Management System',
  description: 'Production-grade Student Attendance Management System with QR attendance, timetable, leave workflows, analytics, and role-based access for Students, Teachers, and Admins.',
  openGraph: {
    title: 'AttendX - Student Attendance Management System',
    description: 'Production-grade Student Attendance Management System with QR attendance, timetable, leave workflows, analytics, and role-based access for Students, Teachers, and Admins.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AttendX - Student Attendance Management System',
    description: 'Production-grade Student Attendance Management System with QR attendance, timetable, leave workflows, analytics, and role-based access for Students, Teachers, and Admins.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

