'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppRole, Profile, Student, Teacher } from './types';
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: AppRole;
  studentId?: string;
  teacherId?: string;
  phone?: string;
  inviteCode?: string;
}

interface AuthContextType {
  user: Profile | null;
  role: AppRole | null;
  student: Student | null;
  teacher: Teacher | null;
  isLoading: boolean;
  login: (
    email: string,
    password?: string,
    intendedRole?: AppRole
  ) => Promise<{ success: boolean; message?: string; role?: AppRole; redirectUrl?: string }>;
  signup: (
    payload: SignupPayload
  ) => Promise<{ success: boolean; message?: string; role?: AppRole; redirectUrl?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from real auth or stored authenticated user
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const profile =
              db.getProfileById(data.session.user.id) ||
              db.getProfileByEmail(data.session.user.email || '');
            if (profile) {
              setCurrentProfile(profile);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check local storage saved authenticated user ID
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('attendx_active_user_id') : null;
        if (savedId) {
          const profile = db.getProfileById(savedId);
          if (profile && profile.active) {
            setCurrentProfile(profile);
            setIsLoading(false);
            return;
          }
        }

        // No authenticated session found
        setUser(null);
        setRole(null);
        setStudent(null);
        setTeacher(null);
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  function setCurrentProfile(profile: Profile) {
    setUser(profile);
    setRole(profile.role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendx_active_user_id', profile.id);
    }

    if (profile.role === 'STUDENT') {
      const s = db.getStudentByProfileId(profile.id);
      setStudent(s || null);
      setTeacher(null);
    } else if (profile.role === 'TEACHER') {
      const t = db.getTeacherByProfileId(profile.id);
      setTeacher(t || null);
      setStudent(null);
    } else {
      setStudent(null);
      setTeacher(null);
    }
  }

  async function login(
    email: string,
    password?: string,
    intendedRole?: AppRole
  ): Promise<{ success: boolean; message?: string; role?: AppRole; redirectUrl?: string }> {
    setIsLoading(true);
    try {
      // Execute role-enforced authentication through backend API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, intendedRole }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          message: data.message || 'Authentication failed. Please check your credentials.',
          role: data.actualRole,
        };
      }

      if (data.profile) {
        setCurrentProfile(data.profile);
      }

      setIsLoading(false);
      return {
        success: true,
        role: data.role,
        redirectUrl: data.redirectUrl,
      };
    } catch {
      // Fallback to local DataStore validation if network/fetch fails
      const fallback = db.validateLogin(email, password, intendedRole);
      setIsLoading(false);
      if (fallback.success && fallback.profile) {
        setCurrentProfile(fallback.profile);
        const redir =
          fallback.profile.role === 'ADMIN'
            ? '/admin/dashboard'
            : fallback.profile.role === 'TEACHER'
            ? '/teacher/dashboard'
            : '/student/dashboard';
        return { success: true, role: fallback.profile.role, redirectUrl: redir };
      }
      return {
        success: false,
        message: fallback.message || 'Connection to authentication service failed.',
      };
    }
  }

  async function signup(
    payload: SignupPayload
  ): Promise<{ success: boolean; message?: string; role?: AppRole; redirectUrl?: string }> {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          message: data.message || 'Registration failed. Please check your details.',
        };
      }

      if (data.profile) {
        setCurrentProfile(data.profile);
      }

      setIsLoading(false);
      return {
        success: true,
        role: data.role,
        redirectUrl: data.redirectUrl,
      };
    } catch {
      const fallback = db.registerAccount(payload);
      setIsLoading(false);
      if (fallback.success && fallback.profile) {
        setCurrentProfile(fallback.profile);
        const redir = fallback.profile.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
        return { success: true, role: fallback.profile.role, redirectUrl: redir };
      }
      return {
        success: false,
        message: fallback.message || 'Unable to connect to registration service.',
      };
    }
  }

  async function logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase signOut error:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('attendx_active_user_id');
    }
    setUser(null);
    setRole(null);
    setStudent(null);
    setTeacher(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        student,
        teacher,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
