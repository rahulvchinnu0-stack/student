'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import jsQR from 'jsqr';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/db';
import { AttendanceSession } from '@/lib/types';

export default function StudentQRScanPage() {
  const { student, user } = useAuth();
  const studentId = student?.id || 'stu-rahul';

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    session?: AttendanceSession;
    code?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Active open QR sessions available right now (for testing convenience)
  const openSessions = db.sessions.filter((s) => s.status === 'OPEN');

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    setScanResult(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser or use the manual code validator below.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No video camera device was detected on your system.');
      } else {
        setCameraError(`Unable to start camera: ${err.message || 'Unknown device error'}`);
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame scanner loop
  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleScanVerify(code.data);
            return; // stop scanning after successful reading
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tickScan);
  };

  // Backend verification handler
  const handleScanVerify = (rawToken: string) => {
    setIsVerifying(true);
    stopCamera();

    // Verify token strictly via backend business rules
    const result = db.verifyAndMarkQRAttendance(studentId, rawToken.trim());
    setIsVerifying(false);
    setScanResult(result);
  };

  return (
    <DashboardLayout
      title="QR Attendance Scanner"
      subtitle="Scan temporary classroom QR tokens to verify your present attendance status"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Scanner Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 py-1 px-3 rounded-full w-fit mx-auto border border-indigo-100">
            <ShieldCheck className="w-4 h-4" />
            <span>Server-Verified Check-in</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Classroom QR Verification
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scan the active QR code projected by your professor. QR codes rotate and expire every 120 seconds to guarantee physical classroom attendance.
          </p>

          {/* Camera Viewport */}
          <div className="relative w-full max-w-sm mx-auto aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-48 h-48 border-2 border-indigo-400 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white" />
                  <div className="w-full h-0.5 bg-indigo-400/80 animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400">Camera preview inactive</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scanner</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera Permission / Error Message */}
          {cameraError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Scan Result Feedback */}
          {isVerifying && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Validating cryptographic QR token with campus backend...</span>
            </div>
          )}

          {scanResult && (
            <div
              className={`p-4 rounded-xl text-left border ${
                scanResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {scanResult.success ? 'Attendance Verified' : 'Check-in Rejected'}
                  </h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{scanResult.message}</p>
                  {scanResult.code && (
                    <span className="inline-block mt-1 font-mono text-[10px] uppercase font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                      Error Code: {scanResult.code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Token Verification Fallback */}
          <div className="pt-4 border-t border-slate-100 text-left space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Manual Token / Direct Code Entry
              </label>
              <span className="text-[11px] text-slate-400">Desktop / Sandbox Fallback</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. ATTENDX-sess-1-salt or sess-1"
                className="flex-1 text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleScanVerify(manualToken)}
                disabled={!manualToken.trim() || isVerifying}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                Validate
              </button>
            </div>

            {/* Quick Demo Session Tokens */}
            {openSessions.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                  Currently Open Class Sessions (Click to test):
                </span>
                <div className="space-y-1">
                  {openSessions.map((s) => {
                    const subj = db.subjects.find((sub) => sub.id === s.subject_id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setManualToken(s.id);
                          handleScanVerify(s.id);
                        }}
                        className="w-full text-left p-1.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{subj?.subject_name}</span>
                        <span className="font-mono text-indigo-600 font-medium">Session #{s.id} (OPEN)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
