/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Phone, Waves, Terminal, FileText, Palette, Settings, CloudCheck, Network, Sparkles, LogOut, ArrowRightLeft } from 'lucide-react';
import { UserSettings, Window, FileItem } from './types';
import WindowFrame from './components/WindowFrame';
import LockScreen from './components/LockScreen';
import Taskbar from './components/Taskbar';

// Apps Imports
import GemiChatApp from './components/apps/GemiChatApp';
import RotaryPhoneApp from './components/apps/RotaryPhoneApp';
import BioFishTankApp from './components/apps/BioFishTankApp';
import TerminalApp from './components/apps/TerminalApp';
import NotepadApp from './components/apps/NotepadApp';
import PaintApp from './components/apps/PaintApp';
import SystemSettingsApp from './components/apps/SystemSettingsApp';
import CalendarApp from './components/apps/CalendarApp';
import ClickParticles from './components/ClickParticles';
import WeatherWidget from './components/WeatherWidget';

// Firebase Imports
import { auth, db, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onAuthStateChanged, signOut } from './firebase';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // System Configurations
  const [settings, setSettings] = useState<UserSettings>({
    wallpaper: 'radial-gradient(circle at center, #0B1F3F 0%, #050608 100%)',
    wallpaperType: 'cosmic',
    accentColor: 'cyan',
    textScale: 'base',
    soundEnabled: true,
    username: 'Guest OS',
    isLoggedIn: false,
  });

  // Windows Coordinates 
  const [windows, setWindows] = useState<Window[]>([
    { id: 'gemi-chat', title: 'مساعد جيمي الذكي (Gemi Core AI)', icon: '🤖', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 80, y: 80, width: 620, height: 460 },
    { id: 'rotary-phone', title: 'الهاتف الدوار التناظري (Turbo Rotary)', icon: '📞', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 120, y: 100, width: 550, height: 420 },
    { id: 'bio-fish', title: 'حوض الأسماك العضوي (Organic Fishstick Area)', icon: '🐠', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 140, y: 120, width: 600, height: 430 },
    { id: 'terminal', title: 'موجه الأوامر والأداة البرمجية (System Shell)', icon: '💻', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 160, y: 140, width: 580, height: 410 },
    { id: 'notepad', title: 'مفكرة المستندات (Notepad++ Workspace)', icon: '📝', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 180, y: 160, width: 620, height: 450 },
    { id: 'paint', title: 'الرسام الفضائي لوحة (Paint Master)', icon: '🎨', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 200, y: 180, width: 560, height: 430 },
    { id: 'settings', title: 'إداريات النظم والأداء (Settings Engine)', icon: '⚙️', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 220, y: 200, width: 580, height: 440 },
    { id: 'calendar', title: 'تقويم المهام والمواعيد (Task Calendar Core)', icon: '📅', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, x: 240, y: 150, width: 640, height: 500 },
  ]);

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // OS Notification & Alert engine states
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: string }[]>([]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 5));
    // Auto-dismiss after 6s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 6000);
  };

  // Filesystem Workspace Stores
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  // Matrix Background Canvas
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch authentication status observer
  useEffect(() => {
    if (!auth) {
      // Local fallback
      loadLocalState();
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsCloudSynced(true);
        setIsUnlocked(true);
        setSettings((prev) => ({ ...prev, username: user.email?.split('@')[0] || 'المطور رفيعه', isLoggedIn: true }));
        
        // Fetch files & settings directly from Firestore!
        await fetchUserFiles(user.uid);
        await fetchUserSettings(user.uid);
      } else {
        setCurrentUser(null);
        setIsCloudSynced(false);
        loadLocalState();
      }
    });

    return () => unsub();
  }, []);

  const loadLocalState = () => {
    // Filesystem Local Recovery
    const localFiles = localStorage.getItem('gemileith_os_files');
    if (localFiles) {
      setFiles(JSON.parse(localFiles));
    } else {
      // Create seed file
      const initialSeed: FileItem[] = [
        {
          id: 'welcome-notes',
          name: 'دليل المستندات.txt',
          content: `# نظام تشغيل جيميليث السحابي المطور
مرحباً بك في الاصدارة الأسرع والأبهى طيلة الوقت!

## نقاط دمج النواة:
- **نواة Gemi AI**: تصفح ذكي فائق يدعم التفكير العميق والبحث Grounding.
- **فيزياء الأسماك العضوية**: مستوحى من (organic-fishstick). انقر لتغذية الأسماك ورؤيتها تكبر!
- **الهاتف الدوار الميكانيكي**: مستوحى من (turbo-rotary-phone)؛ اطلب الرموز السرية لفك تشفير لوحة التحكم.

أنت الأن تستخدم تخزين سحابي فوري وموثوق!`,
          type: 'text',
          modifiedAt: new Date().toLocaleTimeString('ar-EG'),
        }
      ];
      setFiles(initialSeed);
      localStorage.setItem('gemileith_os_files', JSON.stringify(initialSeed));
    }

    const localSettings = localStorage.getItem('gemileith_os_settings');
    if (localSettings) {
      setSettings(JSON.parse(localSettings));
    }
  };

  // Firestore Files operations
  const fetchUserFiles = async (userId: string) => {
    if (!db) return;
    try {
      const qColl = query(collection(db, 'users_files', userId, 'documents'));
      const querySnapshot = await getDocs(qColl);
      const fs: FileItem[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const item = docSnapshot.data();
        fs.push({
          id: docSnapshot.id,
          name: item.name,
          content: item.content,
          type: item.type || 'text',
          modifiedAt: item.modifiedAt,
        });
      });
      setFiles(fs);
      if (fs.length > 0 && !currentFileId) {
        setCurrentFileId(fs[0].id);
      }
    } catch (e) {
      console.error('Error fetching files:', e);
    }
  };

  const fetchUserSettings = async (userId: string) => {
    if (!db) return;
    try {
      const qColl = query(collection(db, 'users_settings'));
      const querySnapshot = await getDocs(qColl);
      // find match
      let userSettings: any = null;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === userId) {
          userSettings = docSnap.data();
        }
      });
      if (userSettings) {
        setSettings((prev) => ({ ...prev, ...userSettings }));
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const lastDarkModeRef = useRef<boolean | undefined>(undefined);

  // Dynamic CSS variables injector supporting the high-contrast dark theme vs Immersive-UI theme switch
  useEffect(() => {
    const isDarkGlobal = !!settings.darkMode;
    const root = document.documentElement;
    if (isDarkGlobal) {
      // High-contrast dark mode values
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-window', '#060709');
      root.style.setProperty('--bg-header', '#0e0f12');
      root.style.setProperty('--bg-inner', '#000000');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#ffffff');
      root.style.setProperty('--border-primary', '#ffffff');
      root.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.45)');
      root.style.setProperty('--shadow-primary', 'none');
      root.style.setProperty('--glow-cyan', '#ffffff');
    } else {
      // Deluxe Immersive UI theme default values
      root.style.setProperty('--bg-primary', '#050608');
      root.style.setProperty('--bg-window', '#050608');
      root.style.setProperty('--bg-header', '#0c0f17');
      root.style.setProperty('--bg-inner', '#0f172a'); // slate-900
      root.style.setProperty('--text-primary', '#e2e8f0'); // slate-200
      root.style.setProperty('--text-secondary', '#94a3b8'); // slate-400
      root.style.setProperty('--border-primary', 'rgba(6, 182, 212, 0.2)'); // cyan-500/20
      root.style.setProperty('--border-secondary', 'rgba(6, 182, 212, 0.15)');
      root.style.setProperty('--shadow-primary', '0 0 20px rgba(6, 182, 212, 0.12)');
      root.style.setProperty('--glow-cyan', 'rgba(6, 182, 212, 0.4)');
    }

    if (lastDarkModeRef.current !== undefined && lastDarkModeRef.current !== isDarkGlobal) {
      if (isDarkGlobal) {
        addNotification("تمكين النمط التبايني", "تم تحويل واجهات النظام للظلام الفائق عالي التباين للحماية البصرية وإراحة العين.", "success");
      } else {
        addNotification("تمكين المظهر الغامر", "تم تفعيل واجهة المظهر الغامرة والزجاج السائل ثلاثي الأبعاد لـ Gemileith OS.", "info");
      }
    }
    lastDarkModeRef.current = isDarkGlobal;
  }, [settings.darkMode]);

  // Save changes helper
  const handleUpdateSettings = async (newConf: Partial<UserSettings>) => {
    const updated = { ...settings, ...newConf };
    setSettings(updated);
    
    // Save locally
    localStorage.setItem('gemileith_os_settings', JSON.stringify(updated));

    // Save cloud
    if (currentUser && db) {
      try {
        await setDoc(doc(db, 'users_settings', currentUser.uid), {
          wallpaper: updated.wallpaper,
          wallpaperType: updated.wallpaperType,
          accentColor: updated.accentColor,
          soundEnabled: updated.soundEnabled,
          username: updated.username,
          darkMode: !!updated.darkMode,
        });
      } catch (e) {
        console.error('Error saving settings to cloud:', e);
      }
    }
  };

  // Files additions / modifications
  const handleCreateFile = async (name: string, content: string, type: 'text') => {
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name,
      content,
      type,
      modifiedAt: new Date().toLocaleTimeString('ar-EG'),
    };

    const nextFiles = [newFile, ...files];
    setFiles(nextFiles);
    localStorage.setItem('gemileith_os_files', JSON.stringify(nextFiles));
    setCurrentFileId(newFile.id);

    if (currentUser && db) {
      try {
        await setDoc(doc(db, 'users_files', currentUser.uid, 'documents', newFile.id), {
          name,
          content,
          type,
          modifiedAt: newFile.modifiedAt,
        });
      } catch (e) {
        console.error('Error creating cloud file:', e);
      }
    }
  };

  const handleUpdateFile = async (id: string, nextContent: string) => {
    const nextFiles = files.map((f) => {
      if (f.id === id) {
        return { ...f, content: nextContent, modifiedAt: new Date().toLocaleTimeString('ar-EG') };
      }
      return f;
    });

    setFiles(nextFiles);
    localStorage.setItem('gemileith_os_files', JSON.stringify(nextFiles));

    if (currentUser && db) {
      try {
        const matched = nextFiles.find(f => f.id === id);
        if (matched) {
          await setDoc(doc(db, 'users_files', currentUser.uid, 'documents', id), {
            name: matched.name,
            content: matched.content,
            type: matched.type,
            modifiedAt: matched.modifiedAt,
          });
        }
      } catch (e) {
        console.error('Error updating cloud file:', e);
      }
    }
  };

  const handleDeleteFile = async (id: string) => {
    const nextFiles = files.filter((f) => f.id !== id);
    setFiles(nextFiles);
    localStorage.setItem('gemileith_os_files', JSON.stringify(nextFiles));
    if (currentFileId === id) {
      setCurrentFileId(nextFiles.length > 0 ? nextFiles[0].id : null);
    }

    if (currentUser && db) {
      try {
        await deleteDoc(doc(db, 'users_files', currentUser.uid, 'documents', id));
      } catch (e) {
        console.error('Error deleting cloud file:', e);
      }
    }
  };

  // Windows positioning & controls
  const handleFocusWindow = (id: string) => {
    setActiveWindowId(id);
    const maxZ = Math.max(...windows.map((w) => w.zIndex), 10);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w))
    );
  };

  const handleOpenWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, isMinimized: false } : w))
    );
    handleFocusWindow(id);
  };

  const handleToggleWindow = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    if (win.isMinimized) {
      handleFocusWindow(id);
    } else if (activeWindowId === id) {
      // Minimize
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    } else {
      handleFocusWindow(id);
    }
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  };

  const handleMaximizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)));
  };

  const handleCloseWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w)));
  };

  const handleMoveWindow = (id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  };

  // Matrix Background falling code animation
  useEffect(() => {
    if (settings.wallpaperType !== 'matrix') return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@*&%';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    const rainDrops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#10b981'; // emerald green matrix
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [settings.wallpaperType]);

  // Audio system chime synthesis
  const playStartupChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
    } catch (e) {}
  };

  // Sign out
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsUnlocked(false);
  };

  const handleUnlockAndAwake = (uname: string, status: boolean) => {
    setSettings((prev) => ({ ...prev, username: uname, isLoggedIn: status }));
    setIsUnlocked(true);
    if (settings.soundEnabled) {
      playStartupChime();
    }
  };

  // Secret codes handlers forwarded from the Rotary phone!
  const handleUnlockEasterEgg = (codeType: string, value: string) => {
    if (codeType === 'sys-monitor') {
      handleOpenWindow('settings');
    } else if (codeType === 'creators') {
      alert('نظام تشغيل جيميليث الأمثل v3.2 - مخرجي المشروع والمهندسين الكبار: Ahmed Elleithy & Saif Elleithy');
    } else if (codeType === 'matrix') {
      handleUpdateSettings({ wallpaperType: 'matrix', wallpaper: 'matrix' });
    } else if (codeType === 'emergency-chat') {
      handleOpenWindow('gemi-chat');
    }
  };

  // Styled colors based on selected accent
  const accentsThemeMap = {
    cyan: { accentColor: '#22d3ee', bgClass: 'bg-cyan-600', borderClass: 'border-cyan-500/30', textClass: 'text-cyan-400' },
    indigo: { accentColor: '#6366f1', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-600', textClass: 'text-indigo-400' },
    emerald: { accentColor: '#10b981', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-600', textClass: 'text-emerald-400' },
    rose: { accentColor: '#f43f5e', bgClass: 'bg-rose-600', borderClass: 'border-rose-600', textClass: 'text-rose-400' },
    amber: { accentColor: '#f59e0b', bgClass: 'bg-amber-600', borderClass: 'border-amber-600', textClass: 'text-amber-400' },
  };

  const currentTheme = accentsThemeMap[settings.accentColor as keyof typeof accentsThemeMap] || accentsThemeMap.indigo;

  // Desktop launcher items
  const deskApps = [
    { id: 'gemi-chat', name: 'جيمي الذكي AI Gemi', icon: '🤖', color: 'text-indigo-400' },
    { id: 'rotary-phone', name: 'الهاتف التناظري', icon: '📞', color: 'text-emerald-400' },
    { id: 'bio-fish', name: 'البيولوجيا العضوية', icon: '🐠', color: 'text-cyan-400' },
    { id: 'terminal', name: 'موجه الأوامر Shell', icon: '💻', color: 'text-rose-400' },
    { id: 'notepad', name: 'محرر الملفات', icon: '📝', color: 'text-amber-400' },
    { id: 'paint', name: 'الرسام الفضائي', icon: '🎨', color: 'text-purple-400' },
    { id: 'calendar', name: 'تقويم المهام', icon: '📅', color: 'text-cyan-400' },
    { id: 'settings', name: 'إعدادات النظام', icon: '⚙️', color: 'text-slate-400' },
  ];

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlockAndAwake} />;
  }

  // Active styles for backgrounds
  const desktopBgStyle: React.CSSProperties = settings.wallpaperType === 'matrix'
    ? { backgroundColor: '#000000' }
    : settings.wallpaper.startsWith('linear-gradient')
    ? { backgroundImage: settings.wallpaper }
    : { backgroundColor: settings.wallpaper };

  return (
    <div
      style={desktopBgStyle}
      className="absolute inset-0 overflow-hidden select-none flex flex-col justify-between font-sans text-white bg-cover bg-center"
    >
      {/* Dynamic interactive click particle canvas system overlay */}
      <ClickParticles accentColor={currentTheme.accentColor} />

      {/* Toast floating notifications alert stack */}
      <div className="absolute top-16 right-6 z-55 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg transition-all flex flex-col gap-1 text-right select-text ${
              n.type === 'success'
                ? 'bg-[#050608]/92 border-emerald-500/35 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                : n.type === 'warning'
                ? 'bg-[#050608]/92 border-rose-500/35 text-slate-100 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                : 'bg-[#050608]/92 border-cyan-500/35 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1 gap-4">
              <span className="text-[9px] text-slate-500 font-mono">{n.timestamp}</span>
              <h5 className={`font-black text-xs flex items-center gap-1.5 ${
                n.type === 'success' ? 'text-emerald-400' : n.type === 'warning' ? 'text-rose-400' : 'text-cyan-400'
              }`}>
                <span>{n.title}</span>
                <span className="text-[10px]">{n.type === 'success' ? '✓' : n.type === 'warning' ? '⚠' : '✦'}</span>
              </h5>
            </div>
            <p className="text-[10.5px] text-slate-300 leading-normal font-sans">{n.message}</p>
          </div>
        ))}
      </div>
      {/* Matrix Falling Code canvas overlay */}
      {settings.wallpaperType === 'matrix' && (
        <canvas ref={matrixCanvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none z-0" />
      )}

      {/* Top Shell Panel Indicators row */}
      <div className="absolute top-0 inset-x-0 h-14 bg-[#050608]/90 border-b border-cyan-955/40 backdrop-blur-md flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-tighter">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <h1 className="text-base font-bold select-none md:text-lg">GEMILEITH-OS <span className="text-white font-light">// ULTIMATE SYNTHESIS</span></h1>
            </div>
            <p className="hidden md:block text-[9px] text-cyan-700 uppercase tracking-widest font-mono select-none">Architect: Great Intelligence & Master Developer</p>
          </div>
        </div>

        {/* User Badge Info & Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden lg:flex gap-3">
            <div className="px-3 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-mono">
              KERNEL: V9.4.0-STABLE
            </div>
            <div className="px-3 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-mono">
              STATUS: OPTIMIZED
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 border-l border-cyan-950 pl-3">
            <span className="text-[10px] text-slate-500 font-bold block">مستخدم نشط:</span>
            <span className="font-bold text-slate-200">{settings.username}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded border border-rose-500/20 cursor-pointer text-[10px] font-bold transition-all"
            title="تبديل المستخدم"
          >
            خروج
          </button>
        </div>
      </div>

      {/* Main Desktop icons align grid area */}
      <div className="flex-1 relative mt-14 mb-12 p-6 z-10 overflow-hidden">
        
        {/* Live Weather Widget desktop overlay (absolute right-side anchor) */}
        <div className="absolute right-6 top-6 hidden lg:block z-0 pointer-events-auto">
          <WeatherWidget soundEnabled={settings.soundEnabled} accentColor={currentTheme.accentColor} />
        </div>

        {/* Grid layout for files on the desktop */}
        <div className="grid grid-flow-row grid-cols-3 sm:grid-cols-1 gap-4 max-h-[70%] max-w-[280px] select-none">
          {deskApps.map((d) => (
            <button
              key={d.id}
              onClick={() => handleOpenWindow(d.id)}
              className="flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer hover:bg-white/10 active:bg-white/20 hover:scale-103 transition-all border border-transparent hover:border-white/5 space-y-1.5 select-none text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-center text-2xl shadow-md">
                {d.icon}
              </div>
              <span className="text-[11px] font-semibold text-slate-200 select-none block max-w-[90px] truncate leading-snug font-sans">{d.name}</span>
            </button>
          ))}
        </div>

        {/* Floating draggable window frame components */}
        {windows.map((win) => (
          <WindowFrame
            key={win.id}
            windowState={win}
            onFocus={() => handleFocusWindow(win.id)}
            onMinimize={() => handleMinimizeWindow(win.id)}
            onMaximize={() => handleMaximizeWindow(win.id)}
            onClose={() => handleCloseWindow(win.id)}
            onMove={(x, y) => handleMoveWindow(win.id, x, y)}
          >
            {/* Conditional App router inside window content */}
            {win.id === 'gemi-chat' && <GemiChatApp systemTheme={currentTheme} />}
            {win.id === 'rotary-phone' && <RotaryPhoneApp onUnlockEasterEgg={handleUnlockEasterEgg} />}
            {win.id === 'bio-fish' && <BioFishTankApp />}
            {win.id === 'terminal' && (
              <TerminalApp
                files={files}
                onCreateFile={handleCreateFile}
                systemTheme={currentTheme}
              />
            )}
            {win.id === 'notepad' && (
              <NotepadApp
                files={files}
                currentFileId={currentFileId}
                onSelectFile={setCurrentFileId}
                onCreateFile={handleCreateFile}
                onUpdateFile={handleUpdateFile}
                onDeleteFile={handleDeleteFile}
                isCloudSynced={isCloudSynced}
              />
            )}
            {win.id === 'paint' && <PaintApp />}
            {win.id === 'calendar' && (
              <CalendarApp
                onAddNotification={addNotification}
                soundEnabled={settings.soundEnabled}
              />
            )}
            {win.id === 'settings' && (
              <SystemSettingsApp
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                isCloudSynced={isCloudSynced}
              />
            )}
          </WindowFrame>
        ))}

      </div>

      {/* Bottom Taskbar */}
      <Taskbar
        windows={windows}
        onToggleWindow={handleToggleWindow}
        onOpenWindow={handleOpenWindow}
        settings={settings}
        onLogout={handleLogout}
        systemTheme={{
          ...currentTheme,
          bgClass: currentTheme.bgClass,
          borderClass: currentTheme.borderClass,
          textClass: currentTheme.textClass,
        }}
        isCloudSynced={isCloudSynced}
      />
    </div>
  );
}
