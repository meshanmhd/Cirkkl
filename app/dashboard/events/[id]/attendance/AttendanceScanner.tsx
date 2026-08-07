"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, X, AlertTriangle } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { processAttendanceScan, confirmAttendance } from "./actions";

export default function AttendanceScanner({ eventId, eventTitle, orgId }: { eventId: string; eventTitle: string; orgId: string }) {
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [modalState, setModalState] = useState<'none' | 'found' | 'success'>('none');
  const [alertState, setAlertState] = useState<'none' | 'not_found' | 'error' | 'success'>('none');

  // Completely hide the browser scrollbar while on the scanner page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleScan = async (detectedCodes: any[]) => {
    if (!scanning || processing || detectedCodes.length === 0) return;
    
    const code = detectedCodes[0].rawValue?.toLowerCase();
    if (!code) return;

    setScanning(false);
    setProcessing(true);
    
    try {
      const result = await processAttendanceScan(eventId, code, orgId);
      
      if (result.error) {
        setScanResult({ error: result.error, code });
        showAlert('not_found');
      } else if (result.registration.attended) {
        setScanResult({ error: "Participant has already checked in.", code });
        showAlert('error');
      } else {
        setScanResult(result);
        setModalState('found');
      }
    } catch (err) {
      setScanResult({ error: "System error processing scan", code });
      showAlert('not_found');
    } finally {
      setProcessing(false);
    }
  };

  const showAlert = (state: 'not_found' | 'error') => {
    setAlertState(state);
    setTimeout(() => {
      setAlertState('none');
      resetScanner();
    }, 3000); // Resume scanning after 3 seconds automatically
  };

  const markAttendance = async () => {
    if (!scanResult || !scanResult.registration) return;
    setProcessing(true);
    
    const res = await confirmAttendance(scanResult.registration.id);
    setProcessing(false);
    
    if (res.success) {
      resetScanner();
      setAlertState('success');
      setTimeout(() => setAlertState(prev => prev === 'success' ? 'none' : prev), 2500);
    } else {
      alert("Failed to mark attendance.");
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setModalState('none');
    setAlertState('none');
    setScanning(true);
  };

  return (
    <div className="fixed inset-0 top-[56px] md:left-[240px] z-20 bg-black overflow-hidden">
      
      {/* Scanner Background (Full Screen) */}
      <div className="absolute inset-0 z-0">
        <Scanner 
          onScan={handleScan}
          paused={!scanning || processing}
          components={{ audio: true, torch: true, zoom: true, finder: false, tracker: () => {} } as any}
          styles={{ container: { height: '100%', width: '100%' }, video: { objectFit: 'cover' } }}
        />
      </div>

      {/* Dark Overlay with Transparent Hole */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
        <div className="w-[75%] max-w-[340px] aspect-square rounded-[32px] shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] relative transition-all duration-300">
          {/* Green Corners with Rounded Ends via SVG */}
          <svg className="absolute -top-[16px] -left-[16px] w-24 h-24 text-[#cfe467]" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <path d="M 92 3.5 L 48 3.5 A 44.5 44.5 0 0 0 3.5 48 L 3.5 92" />
          </svg>
          <svg className="absolute -top-[16px] -right-[16px] w-24 h-24 text-[#cfe467] rotate-90" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <path d="M 92 3.5 L 48 3.5 A 44.5 44.5 0 0 0 3.5 48 L 3.5 92" />
          </svg>
          <svg className="absolute -bottom-[16px] -right-[16px] w-24 h-24 text-[#cfe467] rotate-180" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <path d="M 92 3.5 L 48 3.5 A 44.5 44.5 0 0 0 3.5 48 L 3.5 92" />
          </svg>
          <svg className="absolute -bottom-[16px] -left-[16px] w-24 h-24 text-[#cfe467] -rotate-90" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <path d="M 92 3.5 L 48 3.5 A 44.5 44.5 0 0 0 3.5 48 L 3.5 92" />
          </svg>
        </div>
      </div>

      {/* Top Bar - Modern Floating Design */}
      <div className="w-full absolute top-0 left-0 right-0 px-4 pt-4 pb-2 z-30">
        <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-full p-2 flex items-center justify-between text-[#111111]">
          <Link href={`/dashboard/events/${eventId}`} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-all text-[#111111] pointer-events-auto">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </Link>
          <p className="font-bold text-[14px] truncate px-4 flex-1 text-center tracking-tight">{eventTitle}</p>
          <div className="w-10 h-10 rounded-full bg-[#cfe467]/20 flex items-center justify-center text-[#9db430]">
            <div className="w-2.5 h-2.5 bg-[#cfe467] rounded-full animate-pulse shadow-[0_0_8px_#cfe467]"></div>
          </div>
        </div>
      </div>

      {/* Bottom Alert (Toast) for errors and success */}
      {alertState !== 'none' && (
        <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className={`shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[16px] px-5 py-4 w-full max-w-sm flex items-center gap-3 backdrop-blur-md ${
            alertState === 'success' ? 'bg-[#34C759]/90 border border-[#34C759] text-white' : 'bg-[#FF3B30]/90 border border-[#FF3B30] text-white'
          }`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white/20">
              {alertState === 'success' ? <CheckCircle2 size={16} strokeWidth={2.5} className="text-white" /> : <AlertTriangle size={16} strokeWidth={2.5} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">
                {alertState === 'success' ? "Attendance Marked!" : "Access Denied"}
              </p>
              <p className="text-[13px] opacity-90 leading-snug">
                {alertState === 'success' ? "User successfully checked in." :
                 alertState === 'not_found' ? "User is not registered for this event." : 
                 "QR Code could not be processed."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Success/Found */}
      {modalState !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[300px] rounded-[28px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            
            {modalState === 'found' && scanResult && (
              <>
                <button onClick={resetScanner} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E5E5EA] transition-all">
                  <X size={16} />
                </button>
                <div className="flex flex-col items-center text-center gap-2 mt-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F5F5F7] mb-2 shadow-sm border border-[#E5E5EA]">
                    {scanResult.user.avatar_url ? (
                      <img src={scanResult.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#cfe467] text-[#111111] font-bold text-xl">
                        {scanResult.user.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-[18px] font-bold text-[#111111] leading-tight">{scanResult.user.full_name}</h3>
                  <p className="text-[13px] text-[#6E6E73]">{scanResult.user.email}</p>
                  <div className="w-full h-px bg-[#F5F5F7] my-3"></div>
                  <div className="w-full flex items-center justify-between px-2 mb-4">
                    <span className="text-[12px] text-[#9E9EA7] uppercase tracking-wider font-semibold">Ticket</span>
                    <span className="text-[12px] font-mono font-medium text-[#111111] bg-[#F5F5F7] px-2.5 py-1 rounded-md">{scanResult.registration.ticket_code}</span>
                  </div>
                  <button 
                    onClick={markAttendance}
                    disabled={processing}
                    className="w-full py-3.5 rounded-[12px] font-semibold text-[14px] transition-all disabled:opacity-50 hover:opacity-90 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #cfe467 0%, #c0d955 100%)", color: "#111111" }}
                  >
                    {processing ? "Confirming..." : "Confirm Attendance"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
