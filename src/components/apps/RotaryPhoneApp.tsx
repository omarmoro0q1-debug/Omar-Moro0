/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Phone, RefreshCw, Volume2, ShieldAlert, KeyRound, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface RotaryPhoneAppProps {
  onUnlockEasterEgg: (codeType: string, value: string) => void;
}

export default function RotaryPhoneApp({ onUnlockEasterEgg }: RotaryPhoneAppProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('أدر القرص الدوار للاتصال بترميزات النظام...');

  const synthRef = useRef<AudioContext | null>(null);

  // Mechanical Click Sound Synthesizer via Web Audio API 
  const playClickSound = (freq = 80, dur = 0.05) => {
    try {
      if (!synthRef.current) {
        synthRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = synthRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + dur);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // AudioContext failed or blocked by iframe
    }
  };

  // Play Dial Tone Synthesis
  const playDialTone = (freq1 = 350, freq2 = 440, duration = 1.0) => {
    try {
      if (!synthRef.current) {
        synthRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = synthRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Dial specific numbers click handler
  const handleDigitDial = (digit: number) => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // Calculate mechanical swing animation angle based on the number
    // numbers 1-9 are distributed at increasing angles, 0 is the furthest
    const baseAngle = 30;
    const targetAngle = baseAngle * (digit === 0 ? 10 : digit);
    
    // Play clicking sound pulses during mechanical spin
    let currentStepAngle = 0;
    const steps = digit === 0 ? 10 : digit;
    const intervalTime = 80;

    const playSteps = (step: number) => {
      if (step <= steps) {
        playClickSound(110 + step * 10, 0.03);
        setRotationAngle((step / steps) * targetAngle);
        setTimeout(() => playSteps(step + 1), intervalTime);
      } else {
        // Returned spin animation
        setPhoneNumber((prev) => prev + digit);
        playClickSound(50, 0.1); // return click
        
        // Retract animation
        let retractSteps = 6;
        const retractInterval = 30;
        const doRetract = (rStep: number) => {
          if (rStep >= 0) {
            setRotationAngle((rStep / retractSteps) * targetAngle);
            setTimeout(() => doRetract(rStep - 1), retractInterval);
          } else {
            setRotationAngle(0);
            setIsSpinning(false);
          }
        };
        setTimeout(() => doRetract(retractSteps), 100);
      }
    };

    playSteps(1);
  };

  const handleClear = () => {
    setPhoneNumber('');
    setStatusMessage('أدر القرص الدوار للاتصال بترميزات النظام...');
    playClickSound(180, 0.1);
  };

  const handleCall = () => {
    if (!phoneNumber) return;
    setIsDialing(true);
    setStatusMessage('جاري محاولة الاتصال بالشبكة التناظرية...');
    playDialTone(440, 480, 1.2);

    setTimeout(() => {
      setIsDialing(false);
      // Process OS Specific Secret dialing codes!
      switch (phoneNumber) {
        case '*#9900#':
          setStatusMessage('تم فك التشفير: تشغيل لوحة الأداء والمراقب الهيكلي للموارد!');
          onUnlockEasterEgg('sys-monitor', 'on');
          playDialTone(880, 980, 0.6);
          break;
        case '*#1234#':
          setStatusMessage('تم فك التشفير: قنوات المطورين Ahmed Elleithy و Saif Elleithy!');
          onUnlockEasterEgg('creators', 'on');
          playDialTone(660, 770, 0.8);
          break;
        case '*#007#':
          setStatusMessage('تم فك التشفير: تم تنشيط النواة ومظهر المصفوفة (Matrix Theme Wallpaper)!');
          onUnlockEasterEgg('matrix', 'on');
          playDialTone(1200, 1500, 0.8);
          break;
        case '911':
          setStatusMessage('حالة طوارئ: جاري ربط اتصال ساخن مع مساعد الطوارئ جيمي...');
          onUnlockEasterEgg('emergency-chat', 'on');
          playDialTone(500, 1000, 1.5);
          break;
        default:
          setStatusMessage(`الرقم الطلبي (${phoneNumber}) غير مدرج في شفرات النواة. جرب: *#9900# لمراقب الأداء أو *#1234# لقائمة المطورين أو *#007# للتفعيل السري .`);
          playDialTone(200, 200, 0.8); // busy beep
          break;
      }
    }, 1500);
  };

  // Ring configurations
  const rotaryDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div id="rotary-phone-app" className="flex flex-col md:flex-row h-full bg-slate-900 border border-slate-800 text-white font-sans rounded-xl overflow-hidden p-6 gap-6 items-center justify-center">
      
      {/* Left Column: Mechanical Wheel */}
      <div className="relative flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-indigo-400 mb-4 font-bold flex items-center gap-1.5 animate-pulse">
          <Volume2 className="w-3.5 h-3.5" /> TURBO ROTARY SYS DIALER
        </span>

        {/* Rotary Dial wheel */}
        <div className="relative w-64 h-64 rounded-full bg-slate-950 border-4 border-slate-700/80 shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Metal Inner Ring Plate */}
          <div className="absolute w-48 h-48 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center z-0">
            <div className="flex flex-col items-center text-center px-4">
              <Phone className="w-8 h-8 text-indigo-500 animate-bounce mb-2" />
              <span className="text-[10px] text-slate-500 font-mono">GEMILEITH Co.</span>
            </div>
          </div>

          {/* Draggable Rotating Plate (SVG overlay) */}
          <motion.div
            style={{ rotate: rotationAngle }}
            className="absolute inset-0 w-full h-full z-15 flex items-center justify-center"
          >
            {/* Standard wheel casing with dialing holes */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
              {/* Outer circle of the plate */}
              <circle cx="50" cy="50" r="48" fill="rgba(30, 41, 59, 0.45)" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
              
              {/* Spinning dial handle dots */}
              {rotaryDigits.map((digit, i) => {
                // Project holes at correct angles
                const baseAngleRad = (30 * (digit === 0 ? 10 : digit) * Math.PI) / 180 - (Math.PI / 2);
                const cx = 50 + 34 * Math.cos(baseAngleRad);
                const cy = 50 + 34 * Math.sin(baseAngleRad);
                return (
                  <g key={digit} className="cursor-pointer group" onClick={() => handleDigitDial(digit)}>
                    <circle cx={cx} cy={cy} r="7.5" fill="#020617" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" className="group-hover:fill-indigo-950 transition-colors" />
                    <text x={cx} y={cy + 2} textAnchor="middle" fontSize="6.5" fill="#94a3b8" className="font-bold select-none group-hover:fill-white font-mono">{digit}</text>
                  </g>
                );
              })}

              {/* Mechanical limiter stopper (the finger stop) at the bottom right */}
              <g>
                {/* Finger stop positioned right below the '0' digit position */}
                <path d="M 78,74 L 84,70 L 80,66 Z" fill="#ef4444" stroke="#f43f5e" strokeWidth="0.5" />
                <circle cx="78" cy="74" r="1.5" fill="#ffffff" />
              </g>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Dial Display & Custom Controls */}
      <div className="flex-1 flex flex-col justify-between w-full h-full max-w-sm border-t md:border-t-0 md:border-r border-slate-800 pt-6 md:pt-0 md:pl-6 space-y-4">
        {/* Call screen display */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-indigo-400">
            <span>رقم لوحة النواة</span>
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" /> رموز النواة
            </span>
          </div>
          
          <div className="h-10 text-xl font-mono tracking-widest text-emerald-400 font-bold bg-slate-900 border border-slate-800 rounded px-2.5 flex items-center justify-center overflow-x-auto">
            {phoneNumber || 'الرجاء الإدخال...'}
          </div>

          <div className="text-[11px] text-slate-400 min-h-12 border-t border-slate-900 pt-2 flex items-start gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{statusMessage}</p>
          </div>
        </div>

        {/* Diagnostic triggers */}
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={isSpinning || !phoneNumber}
            className="flex-1 cursor-pointer hover:bg-slate-800 disabled:opacity-40 py-2.5 rounded-lg border border-slate-700 hover:border-white text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>مسح الشاشة</span>
          </button>
          
          <button
            onClick={handleCall}
            disabled={isSpinning || isDialing || !phoneNumber}
            className="flex-1 cursor-pointer bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-2.5 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Phone className="w-3.5 h-3.5 animate-bounce" />
            <span>طلب الشفرة</span>
          </button>
        </div>

        {/* Cheat Sheet */}
        <div className="bg-indigo-950/20 rounded-xl border border-indigo-900/50 p-3 text-[11px] text-slate-300">
          <span className="font-bold text-indigo-400 mb-1.5 block flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> دليل الرموز السريّة المدعومة:
          </span>
          <ul className="space-y-1.5 font-mono text-slate-400 leading-relaxed">
            <li><strong className="text-indigo-400">*#9900#</strong> - فتح مراقب الهاردوير والسرعة التشغيلية.</li>
            <li><strong className="text-indigo-400">*#1234#</strong> - عرض لوحة المطورين ومخرجي المشروع.</li>
            <li><strong className="text-indigo-400">*#007#</strong> - خلفية الـ Matrix المتفاعلة السفلية للشبكة.</li>
            <li><strong className="text-indigo-400">911</strong> - قنوات خط الطوارئ السريع لجيمي الشامل.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
