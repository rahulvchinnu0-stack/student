'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Calculator,
  Clock,
  FileText,
  QrCode,
  Bell,
  User,
  LogOut,
  Users,
  CheckSquare,
  FileSpreadsheet,
  Megaphone,
  Settings,
  History,
  GraduationCap,
  Building2,
  Layers,
  Menu,
  X,
  BookOpen,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, role, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(db.notifications);

  // Subscribe to real-time notification updates
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setNotifications([...db.notifications]);
    });
    return unsub;
  }, []);

  // Strict route protection and unauthorized access blocking
  useEffect(() => {
    if (isLoading) return;

    if (!user || !role) {
      router.replace('/login');
      return;
    }

    // Role boundary enforcement
    if (role === 'STUDENT' && (pathname.startsWith('/teacher') || pathname.startsWith('/admin'))) {
      router.replace('/student/dashboard');
    } else if (role === 'TEACHER' && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
      router.replace('/teacher/dashboard');
    } else if (role === 'ADMIN' && (pathname.startsWith('/student') || pathname.startsWith('/teacher'))) {
      router.replace('/admin/dashboard');
    }
  }, [user, role, isLoading, pathname, router]);

  const userNotifs = notifications.filter(
    (n) => n.recipient_id === user?.id || (user?.role === 'ADMIN' && true)
  );
  const unreadCount = userNotifs.filter((n) => !n.is_read).length;

  // Strict role-specific navigation menus
  const studentNavItems = [
    { label: 'Student Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Attendance', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Attendance Calendar', href: '/student/calendar', icon: Calendar },
    { label: 'Target Calculator', href: '/student/calculator', icon: Calculator },
    { label: 'Timetable', href: '/student/timetable', icon: Clock },
    { label: 'Leave Requests', href: '/student/leave', icon: FileText },
    { label: 'QR Scanner', href: '/student/scan', icon: QrCode },
    { label: 'Profile', href: '/student/profile', icon: User },
  ];

  const teacherNavItems = [
    { label: 'Teacher Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', href: '/teacher/classes', icon: Users },
    { label: 'Mark Attendance', href: '/teacher/attendance', icon: CheckSquare },
    { label: 'Attendance Sessions', href: '/teacher/sessions', icon: QrCode },
    { label: 'QR Attendance', href: '/teacher/sessions', icon: QrCode },
    { label: 'Attendance Reports', href: '/teacher/reports', icon: FileSpreadsheet },
    { label: 'Leave Requests', href: '/teacher/leave', icon: FileText },
    { label: 'Announcements', href: '/teacher/announcements', icon: Megaphone },
    { label: 'Profile', href: '/teacher/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
    { label: 'Departments', href: '/admin/departments', icon: Building2 },
    { label: 'Academic Years', href: '/admin/academic-years', icon: Calendar },
    { label: 'Classes', href: '/admin/classes', icon: Layers },
    { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { label: 'Teacher Assignments', href: '/admin/assignments', icon: CheckSquare },
    { label: 'Timetable Manager', href: '/admin/timetable', icon: Clock },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  let currentNavItems = studentNavItems;
  if (role === 'TEACHER') currentNavItems = teacherNavItems;
  if (role === 'ADMIN') currentNavItems = adminNavItems;

  const roleBadgeStyle = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    TEACHER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[role || 'STUDENT'];

  const markAllRead = () => {
    userNotifs.forEach((n) => {
      n.is_read = true;
    });
    setNotifications([...db.notifications]);
  };

  // If loading or unauthorized
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white animate-pulse">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Verifying database authorization...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 text-center">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            You must be signed in with an authorized account to access this portal.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold justify-center items-center gap-2 hover:bg-slate-800"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">AttendX</span>
            <span className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Attendance System</span>
          </div>
        </div>

        {/* User Card - Displays strictly authenticated account information */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${roleBadgeStyle}`}>
                {role}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Role-Protected Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Action */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h1 className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
                {title || 'Dashboard'}
              </h1>
              {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {userNotifs.length === 0 ? (
                      <p className="p-4 text-xs text-center text-slate-400">No notifications.</p>
                    ) : (
                      userNotifs.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${n.is_read ? 'bg-white' : 'bg-indigo-50/40'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 truncate pr-2">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Info Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-slate-900 leading-tight truncate max-w-[130px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
            <div className="p-2 mb-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-800">{user.full_name}</span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${roleBadgeStyle}`}>
                {role}
              </span>
            </div>

            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 mt-2 border-t border-slate-100 pt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
