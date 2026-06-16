/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Cpu, HardDrive, Volume2, User, RefreshCw, Palette, HelpCircle, Code, Shield, Sun, Moon } from 'lucide-react';
import { UserSettings, WallpaperType } from '../../types';

interface SystemSettingsAppProps {
  settings: UserSettings;
  onUpdateSettings: (s: Partial<UserSettings>) => void;
  isCloudSynced: boolean;
}

export default function SystemSettingsApp({ settings, onUpdateSettings, isCloudSynced }: SystemSettingsAppProps) {
  // Mock live metrics state for CPU & RAM graph
  const [metrics, setMetrics] = useState<{ cpu: number[]; ram: number[] }>({
    cpu: [20, 25, 30, 24, 28, 35, 42, 38, 30, 32, 28, 35],
    ram: [55, 55, 56, 56, 57, 57, 58, 59, 58, 58, 58, 59]
  });

  const [activeTab, setActiveTab] = useState<'settings' | 'performance' | 'about'>('settings');

  // Update hardware metrics in a loop simulating actual processes
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => {
        // CPU varies wildly, RAM stays relatively premium stable
        const nextCpu = Math.max(10, Math.min(95, Math.floor(prev.cpu[prev.cpu.length - 1] + (Math.random() - 0.5) * 15)));
        const nextRam = Math.max(40, Math.min(90, Math.floor(prev.ram[prev.ram.length - 1] + (Math.random() - 0.5) * 4)));

        return {
          cpu: [...prev.cpu.slice(1), nextCpu],
          ram: [...prev.ram.slice(1), nextRam]
        };
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const wallpapers: { id: string; name: string; type: WallpaperType; color: string }[] = [
    { id: 'radial-gradient(circle at center, #0B1F3F 0%, #050608 100%)', name: 'المظهر الغامر (Immersive UI)', type: 'cosmic', color: 'bg-[#050608] border border-cyan-500/30' },
    { id: '#020617', name: 'الظلام الفضائي العميق', type: 'cosmic', color: 'bg-slate-950' },
    { id: '#0f172a', name: 'قماش سليت المصقول', type: 'solid', color: 'bg-slate-900' },
    { id: 'matrix', name: 'شفرة المصفوفة الخضراء', type: 'matrix', color: 'bg-black border border-emerald-900/40 text-emerald-500' },
    { id: 'linear-gradient(135deg, #311042 0%, #0c021f 100%)', name: 'نفق بنفسجي غامض', type: 'glass', color: 'bg-gradient-to-br from-purple-950 to-indigo-950' },
    { id: 'linear-gradient(135deg, #0f1c3f 0%, #0a0a14 100%)', name: 'لوحة نيفس الكونية', type: 'abstract', color: 'bg-gradient-to-br from-indigo-950 to-stone-950' },
  ];

  const accents = [
    { id: 'cyan', name: 'أزرق طيفي سايبر (Immersive)', color: 'bg-cyan-500', text: 'text-cyan-400' },
    { id: 'indigo', name: 'بنفسجي ملكي', color: 'bg-indigo-600', text: 'text-indigo-400' },
    { id: 'emerald', name: 'أخضر ياقوتي', color: 'bg-emerald-600', text: 'text-emerald-400' },
    { id: 'rose', name: 'وردي سايبر', color: 'bg-rose-600', text: 'text-rose-400' },
    { id: 'amber', name: 'ذهبي مارد', color: 'bg-amber-600', text: 'text-amber-400' },
  ];

  const accentTextClass = settings.accentColor === 'cyan' ? 'text-cyan-400' :
                          settings.accentColor === 'emerald' ? 'text-emerald-400' :
                          settings.accentColor === 'rose' ? 'text-rose-400' :
                          settings.accentColor === 'amber' ? 'text-amber-400' : 'text-indigo-400';

  const accentBorderClass = settings.accentColor === 'cyan' ? 'border-cyan-500' :
                            settings.accentColor === 'emerald' ? 'border-emerald-500' :
                            settings.accentColor === 'rose' ? 'border-rose-500' :
                            settings.accentColor === 'amber' ? 'border-amber-500' : 'border-indigo-500';

  const accentBgClass = settings.accentColor === 'cyan' ? 'bg-cyan-600' :
                        settings.accentColor === 'emerald' ? 'bg-emerald-600' :
                        settings.accentColor === 'rose' ? 'bg-rose-600' :
                        settings.accentColor === 'amber' ? 'bg-amber-600' : 'bg-indigo-600';

  const accentFocusBorderClass = settings.accentColor === 'cyan' ? 'focus:border-cyan-500' :
                                 settings.accentColor === 'emerald' ? 'focus:border-emerald-500' :
                                 settings.accentColor === 'rose' ? 'focus:border-rose-500' :
                                 settings.accentColor === 'amber' ? 'focus:border-amber-500' : 'focus:border-indigo-500';

  const accentTabBorderClass = settings.accentColor === 'cyan' ? 'border-cyan-400 text-cyan-400' :
                               settings.accentColor === 'emerald' ? 'border-emerald-400 text-emerald-400' :
                               settings.accentColor === 'rose' ? 'border-rose-400 text-rose-400' :
                               settings.accentColor === 'amber' ? 'border-amber-400 text-amber-400' : 'border-indigo-550 text-indigo-400';

  const currentCpu = metrics.cpu[metrics.cpu.length - 1];
  const currentRam = metrics.ram[metrics.ram.length - 1];

  // Helper to render custom animated SVG graph for high-performance visual visualizers
  const renderSvgGraph = (data: number[], color: string, fill: string) => {
    const width = 340;
    const height = 90;
    const padding = 5;
    const maxVal = 100;

    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        {/* Grids */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1="0"
            y1={height * ratio}
            x2={width}
            y2={height * ratio}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="4 4"
          />
        ))}
        {/* Filled Area */}
        <polygon points={fillPoints} fill={fill} opacity="0.15" />
        {/* Line Path */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Live pulses circle on latest point */}
        {data.length > 0 && (
          <circle
            cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
            cy={height - padding - (data[data.length - 1] / maxVal) * (height - padding * 2)}
            r="4"
            fill={color}
            className="animate-ping"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white font-sans rounded-xl overflow-hidden">
      {/* Settings Navigation Tabs */}
      <div className="flex bg-slate-950 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'settings'
              ? `${accentTabBorderClass} bg-slate-900/40`
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تخصيص النظام والمظهر</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-5 py-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'performance'
              ? `${accentTabBorderClass} bg-slate-900/40`
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>مراقب الأداء والهاردوير</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-5 py-3 text-xs font-bold cursor-pointer transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'about'
              ? `${accentTabBorderClass} bg-slate-900/40`
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>عن نظام التشغيل والمطورين</span>
        </button>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-lg">
            
            {/* User credentials */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-slate-900 ${accentTextClass} border border-slate-800 flex items-center justify-center`}>
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-bold">مستخدم النظام:</span>
                  <span className="text-[10px] bg-slate-800 font-mono text-slate-400 px-1.5 py-0.5 rounded">GUEST_KERNEL</span>
                </div>
                <input
                  type="text"
                  value={settings.username}
                  onChange={(e) => onUpdateSettings({ username: e.target.value })}
                  placeholder="اسم المستخدم..."
                  className={`bg-transparent text-sm font-bold border-b border-slate-800 hover:border-slate-600 ${accentFocusBorderClass} py-0.5 outline-none text-white w-full`}
                />
              </div>
            </div>

            {/* Accent Theme Selectors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
                <Palette className={`w-4 h-4 ${accentTextClass}`} /> لون واجهة المستخدم الأساسي (System Accent)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {accents.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onUpdateSettings({ accentColor: acc.id })}
                    className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer text-right transition-colors ${
                      settings.accentColor === acc.id
                        ? `bg-slate-950 ${accentBorderClass} text-white font-bold`
                        : 'bg-slate-800/40 border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${acc.color} shrink-0`} />
                    <span className="truncate">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper picker */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
                <Palette className={`w-4 h-4 ${accentTextClass}`} /> خلفية سطح المكتب السحابية (Cloud OS Wallpapers)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {wallpapers.map((wall) => (
                  <button
                    key={wall.id}
                    onClick={() => onUpdateSettings({ wallpaper: wall.id, wallpaperType: wall.type })}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs text-right cursor-pointer transition-all ${
                      settings.wallpaper === wall.id
                        ? `bg-slate-100/5 ${accentBorderClass} text-white font-bold`
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded border border-slate-700/50 shrink-0 ${wall.color}`} />
                    <span className="truncate">{wall.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System sounds */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className={`w-5 h-5 ${accentTextClass}`} />
                <div>
                  <h5 className="text-xs font-bold text-white">الأصوات والمؤثرات الميكانيكية</h5>
                  <p className="text-[10px] text-slate-500">تمكين الأصوات والمؤثرات داخل البرامج مثل الهاتف الدوار وحوض الأسماك.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className={`w-10 h-5 bg-slate-800 rounded-full cursor-pointer appearance-none inline-block relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all checked:after:left-[22px]`}
                style={{ backgroundColor: settings.soundEnabled ? (settings.accentColor === 'cyan' ? '#22d3ee' : settings.accentColor === 'rose' ? '#f43f5e' : settings.accentColor === 'emerald' ? '#10b981' : settings.accentColor === 'amber' ? '#f59e0b' : '#6366f1') : '#1e293b' }}
              />
            </div>

            {/* Global Dark Mode High-Contrast Toggle */}
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {settings.darkMode ? (
                  <Moon className="w-5 h-5 text-indigo-400 animate-pulse" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400 rotate-12" />
                )}
                <div>
                  <h5 className="text-xs font-bold text-white">الظلام التبايني الفائق (High Contrast Dark Mode)</h5>
                  <p className="text-[10px] text-slate-500">التحويل الفوري بين مظهر النظام الغامر (Immersive Glass UI) واللون الأسود التبايني الموفر للطاقة.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!settings.darkMode}
                onChange={(e) => onUpdateSettings({ darkMode: e.target.checked })}
                className={`w-10 h-5 bg-slate-800 rounded-full cursor-pointer appearance-none inline-block relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all checked:after:left-[22px]`}
                style={{ backgroundColor: settings.darkMode ? '#10b981' : '#1e293b' }}
              />
            </div>

          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            
            {/* Live widgets overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">مراقب المعالج CPU</span>
                  <Cpu className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-rose-400">{currentCpu}%</div>
                <div className="text-[9px] text-slate-500">التردد النشط: 2.80 GHz</div>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500" style={{ width: `${currentCpu}%`, transition: 'width 1.2s ease-in-out' }} />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">مراقب الرام RAM Allocation</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-cyan-400">{currentRam}%</div>
                <div className="text-[9px] text-slate-500">المستخدم: {(4.2 * currentRam / 100).toFixed(2)} GB / 4.20 GB</div>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-500" style={{ width: `${currentRam}%`, transition: 'width 1.2s ease-in-out' }} />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">تخزين السحابة Cloud Firestore</span>
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">بث حي</div>
                <div className="text-[9px] text-slate-500">مزامنة سحابية نشطة مع Firestore</div>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500 w-full" />
              </div>
            </div>

            {/* Live Chart Visualizers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> مخطط بيضاوي للمنحنى المعالج CPU
                </span>
                {renderSvgGraph(metrics.cpu, '#f43f5e', '#f43f5e')}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /> مخطط بيضاوي لمراقبة الرام RAM Alloc
                </span>
                {renderSvgGraph(metrics.ram, '#06b6d4', '#06b6d4')}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6 max-w-lg">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Gemileith OS Optimum v3.2</h4>
                <p className="text-xs text-slate-500">النظام المتكامل المدمج مع الذكاء وقنوات الهاتف والبيولوجيا العضوية</p>
              </div>

              <p className="text-xs text-slate-300 text-right leading-relaxed border-t border-slate-900 pt-3.5">
                تأسس مشروع **Gemileith OS** كمحاكاة رائدة لنظم التشغيل السحابية الهجينة. هذا الإصدار المطور **Optimum** هو حصيلة اندماج عبقري وخارق لخمسة من أرقى مشاريع النواة لتوفير أداء فائق السرعة، ومزامنة بيانات لحظية مع قواعد بيانات Firestore، ومحاكاة ميكانيكية عتيقة ممثلة بالهاتف الدوار الممتع والبيئات العضوية التفاعلية للأسماك.
              </p>

              {/* Creators list */}
              <div className="border-t border-slate-900 pt-3.5 flex flex-col space-y-2 text-right">
                <span className="text-[10px] font-bold text-slate-500">أعضاء مجلس المطورين والمهندسين الكبار:</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                    <span className="font-bold text-indigo-400 block">Ahmed Elleithy</span>
                    <span className="text-[9px] text-slate-500">كبير مهندسي المظهر والنواة الأولوية</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                    <span className="font-bold text-indigo-400 block">Saif Elleithy</span>
                    <span className="text-[9px] text-slate-500">رئيس مخرجي وباحثي خوارزميات الذكاء المستقر</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
