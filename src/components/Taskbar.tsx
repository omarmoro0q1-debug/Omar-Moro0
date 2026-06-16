/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, LogOut, Terminal, Waves, Phone, Database, Settings, ShieldAlert, Sparkles, Volume2, VolumeX, Menu, Activity, LayoutGrid, FileText, Palette, Calendar } from 'lucide-react';
import { Window, UserSettings } from '../types';

interface TaskbarProps {
  windows: Window[];
  onToggleWindow: (id: string) => void;
  onOpenWindow: (id: string) => void;
  settings: UserSettings;
  onLogout: () => void;
  systemTheme: { accentColor: string; bgClass: string; borderClass: string; textClass: string };
  isCloudSynced: boolean;
}

export default function Taskbar({
  windows,
  onToggleWindow,
  onOpenWindow,
  settings,
  onLogout,
  systemTheme,
  isCloudSynced,
}: TaskbarProps) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Clock mechanism
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const systemApps = [
    { id: 'gemi-chat', name: 'جيمي الذكي AI Gemi', desc: 'نواة المساعد الذكي التفاعلي والنشط', icon: '🤖', component: Bot },
    { id: 'rotary-phone', name: 'الهاتف الدوار Rotary Phone', desc: 'قرص الاتصال الميكانيكي القديم المشفر', icon: '📞', component: Phone },
    { id: 'bio-fish', name: 'حوض الأسماك Fish Tank', desc: 'حوض أسماك عضوي تفاعلي بفيزياء النشا والتصادم', icon: '🐠', component: Waves },
    { id: 'terminal', name: 'الطرفية Terminal Console', desc: 'موجه الأوامر التشخيصي الآمن المدمج', icon: '💻', component: Terminal },
    { id: 'notepad', name: 'المفكرة Notepad++', desc: 'محرر النصوص السحابي المتزامن مع Firestore', icon: '📝', component: FileText },
    { id: 'paint', name: 'الرسام Paint Brush', desc: 'لوحة رسم وتصاميم مجهرية بالفرشاة', icon: '🎨', component: Palette },
    { id: 'calendar', name: 'تقويم المهام الذكي', desc: 'جدولة المواعيد وتذكير المهام الحية مع مزامنة سحابية', icon: '📅', component: Calendar },
    { id: 'settings', name: 'إعدادات النظام System settings', desc: 'مراقب السرعة وهاردوير النظام وتغيير المظهر', icon: '⚙️', component: Settings },
  ];

  const handleStartAppClick = (appId: string) => {
    onOpenWindow(appId);
    setStartMenuOpen(false);
  };

  return (
    <div className="absolute bottom-0 inset-x-0 h-12 bg-slate-950/90 border-t border-slate-800 backdrop-blur-md flex items-center justify-between px-4 z-40 select-none text-white font-sans">
      
      {/* Start Button & Search triggers */}
      <div className="flex items-center gap-3">
        {/* Start Button */}
        <button
          onClick={() => setStartMenuOpen(!startMenuOpen)}
          className={`h-9 px-3.5 rounded-lg cursor-pointer flex items-center gap-2 font-black transition-all shadow active:scale-95 text-xs ${
            startMenuOpen
              ? 'bg-indigo-600 text-white font-black scale-102 border-indigo-700'
              : 'bg-slate-900 hover:bg-slate-800 text-indigo-400 font-extrabold border border-slate-800'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>ابدأ | Start</span>
        </button>

        {/* Start Menu Popup */}
        {startMenuOpen && (
          <div className="absolute bottom-14 left-4 w-80 bg-slate-950/98 border border-indigo-950 shadow-2xl rounded-xl p-4 flex flex-col gap-4 z-50">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2.5 border-b border-indigo-950 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="font-bold text-indigo-300 truncate max-w-[150px]">أهلاً {settings.username}</span>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold">OPTIMUM OS</span>
            </div>

            {/* Apps directory listing */}
            <div className="flex-1 overflow-y-auto max-h-72 space-y-1.5 p-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">دليل أدوات ونواة جيميليث</span>
              {systemApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleStartAppClick(app.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer bg-slate-900/40 hover:bg-indigo-950/40 border border-transparent hover:border-indigo-900/30 text-right transition-all group"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-sm group-hover:scale-105 transition-transform shrink-0">
                    {app.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-[11px] text-slate-100 group-hover:text-indigo-300 truncate">{app.name}</h5>
                    <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Logout bottom */}
            <div className="flex gap-2 items-center border-t border-slate-900 pt-3 justify-between">
              <div className="text-[9px] text-slate-500 font-mono">
                {isCloudSynced ? 'CLOUD LIVE SYNCED' : 'OFFLINE STORAGE'}
              </div>
              
              <button
                onClick={() => {
                  setStartMenuOpen(false);
                  onLogout();
                }}
                className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>الخروج والتبديل</span>
              </button>
            </div>
          </div>
        )}

        {/* Taskbar App Launcher shortcuts for opened windows */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-3">
          {windows.filter(w => w.isOpen).map((win) => (
            <button
              key={win.id}
              onClick={() => onToggleWindow(win.id)}
              className={`h-9 px-3 rounded-lg border text-xs cursor-pointer select-none transition-all flex items-center gap-2 truncate max-w-[120px] ${
                !win.isMinimized && win.zIndex === Math.max(...windows.map(w => w.zIndex))
                  ? 'bg-indigo-600 border-indigo-700 text-white font-bold'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
              }`}
            >
              <span className="shrink-0">{win.icon}</span>
              <span className="truncate">{win.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Status / Clock widget panel */}
      <div className="flex items-center gap-3 text-xs">
        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-md text-[10px] text-slate-400">
          <Database className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="hidden sm:inline-block">قاعدة البيانات السحابية</span>
        </div>

        {/* Shell Sound indicator button */}
        <button className="p-1.5 hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors" title="الأصوات نشطة">
          {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Dynamic Display watch */}
        <div className="font-mono bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-md font-bold text-indigo-400 tracking-wider select-none cursor-default shadow-inner">
          {timeStr || '12:00'}
        </div>
      </div>

    </div>
  );
}
