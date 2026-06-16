/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Sparkles, LogIn, UserCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';

interface LockScreenProps {
  onUnlock: (username: string, isLoggedIn: boolean) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic validation
    if (!email || !password) {
      setErrorMsg('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      if (auth) {
        if (isRegister) {
          // Signup
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const uName = username.trim() || user.email?.split('@')[0] || 'مطور سحابي';
          onUnlock(uName, true);
        } else {
          // Signin
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const uName = user.email?.split('@')[0] || 'مسترجع النواة';
          onUnlock(uName, true);
        }
      } else {
        // Fallback if Firebase fails to load
        onUnlock(username.trim() || 'Guest User', false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setErrorMsg('المستخدم غير موجود. انقر على إنشاء حساب جديد.');
      } else if (err.code === 'auth/wrong-password') {
        setErrorMsg('كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('البريد الإلكتروني مستخدم بالفعل.');
      } else {
        setErrorMsg(err.message || 'فشل الاتصال بقاعدة البيانات. جرب الدخول للضيف.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onUnlock('Guest User', false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#050608] flex flex-col justify-between p-8 text-white font-sans overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at center, #0B1F3F 0%, #050608 100%)' }}>
      
      {/* Wave/Light particle ambient effect */}
      <div className="absolute inset-0 opacity-15 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500 fill-current">
          <circle cx="20" cy="20" r="15" className="animate-pulse" style={{ animationDuration: '6s' }} />
          <circle cx="80" cy="80" r="25" className="animate-pulse" style={{ animationDuration: '8s' }} />
        </svg>
      </div>

      {/* Top section: System specs */}
      <div className="z-10 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-cyan-400 uppercase">GEMILEITH-OS <span className="text-white/60 font-light">// ULTIMATE SYNTHESIS</span></h1>
            <span className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest block">Architect: Great Intelligence & Master Developer</span>
          </div>
        </div>
        
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
          KERNEL: V9.4.0-STABLE
        </span>
      </div>

      {/* Mid Section: Date, Time & Auth layout */}
      <div className="z-10 flex flex-col md:flex-row items-center justify-between gap-12 max-w-5xl mx-auto w-full my-auto">
        
        {/* Date and Time displays */}
        <div className="text-right space-y-3 shrink-0 flex flex-col items-center md:items-start text-center md:text-right">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight font-sans text-cyan-400 select-none cursor-default drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            {timeStr || '12:00:00'}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm font-bold text-slate-400 select-none mr-2 uppercase tracking-widest font-mono"
          >
            {dateStr}
          </motion.div>
        </div>

        {/* Auth Inputs Card */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#050608]/85 backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.1)] w-full max-w-sm space-y-4"
        >
          <div className="flex justify-between items-center pb-2 border-b border-cyan-955/30">
            <h4 className="font-bold text-sm text-cyan-400 flex items-center gap-1.5 font-sans">
              <KeyRound className="w-4 h-4 text-cyan-450" />
              <span>{isRegister ? 'تسجيل حساب نواة جديد' : 'الدخول للنظام السحابي'}</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">FIRESTORE SYNC</span>
          </div>

          <form onSubmit={handleAuthentication} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">اسم العرض</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: أحمد الليثي"
                  className="w-full bg-[#050608]/90 border border-cyan-955/40 hover:border-cyan-800/45 focus:border-cyan-450 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1 font-mono">البريد الإلكتروني / EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@gemileith.com"
                className="w-full bg-[#050608]/90 border border-cyan-955/40 hover:border-cyan-800/45 focus:border-cyan-450 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1 font-mono">كلمة المرور / PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#050608]/90 border border-cyan-955/40 hover:border-cyan-800/45 focus:border-cyan-455 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
              />
            </div>

            {errorMsg && (
              <span className="text-[10px] text-rose-400 font-semibold block leading-snug">{errorMsg}</span>
            )}

            {/* Auth Actions buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 cursor-pointer bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-lg py-2 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/20 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isRegister ? 'إنشاء حساب' : 'تسجيل دخول'}</span>
              </button>
            </div>
          </form>

          {/* Toggle register mode */}
          <div className="text-center pt-2 border-t border-cyan-955/30">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-all"
            >
              {isRegister ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'ليس لديك حساب مسبق؟ أنشئ حساب سحابي'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-600 block mb-2">أو تخطى الاتصال بقواعد البيانات وقدرات الدعم</span>
            <button
              onClick={handleGuestLogin}
              className="w-full cursor-pointer bg-[#050608]/50 hover:bg-[#050608] py-2 rounded-lg text-xs font-bold text-slate-350 flex items-center justify-center gap-1.5 transition-all border border-cyan-955/30 hover:border-cyan-800/40 active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>الدخول السريع للضيف (Guest User)</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* Bottom Footer Credits block */}
      <div className="z-10 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 border-t border-cyan-955/30 pt-3 flex-wrap gap-2 text-center select-none font-sans">
        <span>© 2026 GEMILEITH Co. All rights reserved.</span>
        <span className="flex items-center gap-1 text-cyan-400">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>تم الدمج والمزامنة مع ذكاء جيمي السحابي المتفوق</span>
        </span>
        <span>بأيدى ومجهود المهندسين الكبار Ahmed Elleithy & Saif Elleithy</span>
      </div>

    </div>
  );
}
