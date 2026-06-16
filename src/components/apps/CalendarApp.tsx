/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, Plus, Trash2, Tag, Bell, AlertTriangle, Sparkles, Filter, CheckCircle2, Circle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { auth, db } from '../../firebase';
import { collection, query, getDocs, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: 'work' | 'personal' | 'urgent' | 'reminder';
  completed: boolean;
  createdAt: string;
}

// Error Handler conformant with system Firebase skill
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'guest',
      email: auth?.currentUser?.email || 'guest@domain.local',
    },
    operationType,
    path
  };
  console.error('Firestore OS Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CalendarAppProps {
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning') => void;
  soundEnabled: boolean;
}

export default function CalendarApp({ onAddNotification, soundEnabled }: CalendarAppProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Navigation & selection
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Input fields for new event
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'urgent' | 'reminder'>('work');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'pending' | 'completed'>('all');

  // Trigger sound effect auxiliary
  const playMechanicalSound = (freq = 400, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + duration);
    } catch (e) {}
  };

  // Sync / loading mechanism
  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (userId && db) {
      setLoading(true);
      const collPath = `users_calendar/${userId}/events`;
      
      // Set up real-time listener
      const qColl = query(collection(db, collPath));
      const unsubscribe = onSnapshot(qColl, (snapshot) => {
        const list: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            date: data.date || '',
            time: data.time || '12:00',
            category: data.category || 'work',
            completed: !!data.completed,
            createdAt: data.createdAt || '',
          });
        });
        
        // Sort by date then time
        list.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        setEvents(list);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, collPath);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      // Guest local storage fallback
      const local = localStorage.getItem('gemileith_os_calendar_events');
      if (local) {
        try {
          const parsed = JSON.parse(local) as CalendarEvent[];
          parsed.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
          setEvents(parsed);
        } catch (e) {
          setEvents([]);
        }
      } else {
        // Sample events
        const samples: CalendarEvent[] = [
          {
            id: 'sample-1',
            title: 'إيجاد حلول لمشروعات Gemileith OS',
            description: 'تفقد النواة وأجهزة التحكم السحابة',
            date: new Date().toISOString().split('T')[0],
            time: '18:30',
            category: 'urgent',
            completed: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'sample-2',
            title: 'إطعام أسماك الحوض',
            description: 'مشاهدتها تكبر ودراسة فيزياء المياه والمقذوفات',
            date: new Date().toISOString().split('T')[0],
            time: '11:00',
            category: 'personal',
            completed: true,
            createdAt: new Date().toISOString()
          }
        ];
        setEvents(samples);
        localStorage.setItem('gemileith_os_calendar_events', JSON.stringify(samples));
      }
    }
  }, []);

  // Check for periodic alerts/reminders
  // Compare system time vs task times and send desktop notifications
  useEffect(() => {
    let triggeredIds = new Set<string>();
    
    const monitorInterval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      events.forEach((evt) => {
        if (!evt.completed && evt.date === todayStr && evt.time === currentTimeStr && !triggeredIds.has(evt.id)) {
          triggeredIds.add(evt.id);
          onAddNotification(
            `تذكير بمهمة: ${evt.title}`,
            `حان موعد المهمة المجدولة (${evt.time}) - تفاصيل: ${evt.description || 'لا يوجد'}`,
            evt.category === 'urgent' ? 'warning' : 'info'
          );
          playMechanicalSound(880, 'triangle', 0.5);
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(monitorInterval);
  }, [events]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playMechanicalSound(600, 'sine', 0.1);

    const eventId = `event-${Date.now()}`;
    const newEvent: CalendarEvent = {
      id: eventId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: selectedDateStr,
      time: newTime,
      category: newCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const nextEvents = [...events, newEvent];
    nextEvents.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    const userId = auth?.currentUser?.uid;
    if (userId && db) {
      const collPath = `users_calendar/${userId}/events`;
      try {
        await setDoc(doc(db, collPath, eventId), newEvent);
        onAddNotification('تمت الإضافة', `تم حفظ المهمة [${newTitle}] بنجاح في السحابة.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, collPath);
      }
    } else {
      // Local
      setEvents(nextEvents);
      localStorage.setItem('gemileith_os_calendar_events', JSON.stringify(nextEvents));
      onAddNotification('تمت إضافة المهمة للضيف', `تم حفظ [${newTitle}] في ذاكرة المتصفح للضيف.`, 'success');
    }

    // Reset inputs
    setNewTitle('');
    setNewDesc('');
  };

  const handleToggleComplete = async (evt: CalendarEvent) => {
    playMechanicalSound(450, 'sine', 0.08);
    const updatedEvent: CalendarEvent = {
      ...evt,
      completed: !evt.completed,
    };

    const nextEvents = events.map((e) => (e.id === evt.id ? updatedEvent : e));
    setEvents(nextEvents);

    const userId = auth?.currentUser?.uid;
    if (userId && db) {
      const collPath = `users_calendar/${userId}/events`;
      try {
        await setDoc(doc(db, collPath, evt.id), updatedEvent);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, collPath);
      }
    } else {
      localStorage.setItem('gemileith_os_calendar_events', JSON.stringify(nextEvents));
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    playMechanicalSound(300, 'sawtooth', 0.12);
    const nextEvents = events.filter((e) => e.id !== id);
    setEvents(nextEvents);

    const userId = auth?.currentUser?.uid;
    if (userId && db) {
      const collPath = `users_calendar/${userId}/events`;
      try {
        await deleteDoc(doc(db, collPath, id));
        onAddNotification('تم الحذف', `تم إزالة المهمة [${name}] نهائياً من قاعدة بيانات Firestore.`, 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collPath);
      }
    } else {
      localStorage.setItem('gemileith_os_calendar_events', JSON.stringify(nextEvents));
      onAddNotification('تم حذف المهمة للضيف', `تم حذف [${name}] من ذاكرة المتصفح.`, 'info');
    }
  };

  // Month rendering details
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNamesArabic = [
    'يناير / January', 'فبراير / February', 'مارس / March', 'أبريل / April',
    'مايو / May', 'يونيو / June', 'يوليو / July', 'أغسطس / August',
    'سبتمبر / September', 'أكتوبر / October', 'نوفمبر / November', 'ديسمبر / December'
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    playMechanicalSound(500, 'sine', 0.05);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    playMechanicalSound(520, 'sine', 0.05);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate grid days
  const daysGrid: (number | null)[] = [];
  // Fill leading empty cells
  for (let i = 0; i < firstDay; i++) {
    daysGrid.push(null);
  }
  // Fill month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(i);
  }

  // Helper to determine active tasks on a day
  const getTasksForDate = (d: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return events.filter(e => e.date === formattedDate);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'urgent': return 'from-rose-500/20 to-rose-600/10 border-rose-500/40 text-rose-400';
      case 'personal': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-400';
      case 'reminder': return 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-400';
      default: return 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 text-cyan-400';
    }
  };

  const getCategoryThemeText = (cat: string) => {
    switch (cat) {
      case 'urgent': return 'عاجل';
      case 'personal': return 'شخصي';
      case 'reminder': return 'تذكير';
      default: return 'عمل';
    }
  };

  // Filter & Search events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || evt.category === filterCategory;
    const matchesCompleted = filterCompleted === 'all' || 
                             (filterCompleted === 'completed' && evt.completed) || 
                             (filterCompleted === 'pending' && !evt.completed);
    return matchesSearch && matchesCategory && matchesCompleted;
  });

  return (
    <div className="flex flex-col h-full bg-[#050608]/95 text-white font-sans rounded-xl overflow-hidden text-right border border-cyan-500/10 select-none">
      
      {/* Top action and header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-cyan-950/15 border-b border-cyan-500/25 gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-400 font-extrabold text-[10px]">OS SYNCED ENGINE</span>
          </div>
          <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>تقويم المواعيد والمهام الذكي</span>
          </h2>
        </div>

        {/* Search bar inside application */}
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المواعيد..."
            className="w-full bg-slate-900/60 border border-cyan-950/80 focus:border-cyan-500/50 rounded-lg py-1 pr-8 pl-3 text-xs text-white outline-none transition-all placeholder:text-slate-500 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2.5" />
        </div>
      </div>

      {/* Main app body panels split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* RIGHT PANEL: The calendar grid & Controls */}
        <div className="w-full lg:w-[50%] p-4 border-b lg:border-b-0 lg:border-l border-cyan-955/20 flex flex-col overflow-y-auto">
          
          {/* Calendar Month Header Selector */}
          <div className="flex items-center justify-between mb-4 bg-cyan-950/10 p-2 rounded border border-cyan-500/10">
            <button
              onClick={prevMonth}
              className="p-1 rounded cursor-pointer hover:bg-cyan-500/20 text-cyan-400 border border-transparent hover:border-cyan-500/20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono text-cyan-400 select-all uppercase">
              {monthNamesArabic[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded cursor-pointer hover:bg-cyan-500/20 text-cyan-400 border border-transparent hover:border-cyan-500/20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* SMTWThFS Arabic labels row */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-cyan-600 mb-2 font-mono">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-10 rounded-md bg-transparent" />;
              }
              
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dayStr;
              const isToday = new Date().toISOString().split('T')[0] === dayStr;
              const dateTasks = getTasksForDate(day);
              const pendingTasks = dateTasks.filter(t => !t.completed);
              
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => {
                    playMechanicalSound(700, 'sine', 0.05);
                    setSelectedDateStr(dayStr);
                  }}
                  className={`h-11 rounded-md cursor-pointer flex flex-col justify-between p-1 text-[11px] font-mono border transition-all text-right relative group ${
                    isSelected
                      ? 'bg-cyan-800/40 border-cyan-400 text-white font-extrabold shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      : isToday
                      ? 'bg-cyan-950/20 border-cyan-600 text-cyan-400 font-black'
                      : 'bg-slate-950/40 border-slate-900 hover:border-cyan-950 text-slate-300'
                  }`}
                >
                  <span className="self-end block">{day}</span>
                  {dateTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-auto self-start">
                      {pendingTasks.length > 0 ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${pendingTasks[0].category === 'urgent' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'}`} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {dateTasks.length > 1 && (
                        <span className="text-[7px] text-slate-500 leading-none shrink-0">+{dateTasks.length - 1}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick-add task drawer inline form for the selected day */}
          <form onSubmit={handleAddEvent} className="bg-slate-950/70 p-3 rounded-lg border border-cyan-955/20 space-y-3 mt-auto">
            <h4 className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 border-b border-cyan-955/20 pb-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حدث ليوم: {selectedDateStr}</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500">عنوان التذكير / المهمة</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: حوار جيمي الذكي السحابي"
                  className="w-full bg-[#050608] border border-cyan-955/35 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500">الوقت (24 ساعة)</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-[#050608] border border-cyan-955/35 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[9px] text-slate-500">الوصف والتفاصيل</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="برمجة كوانتم، تحسين خادم الروابط..."
                className="w-full bg-[#050608] border border-cyan-955/35 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-xs pt-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[9px] text-slate-500 block">التصنيف:</label>
                <div className="flex gap-1.5">
                  {(['work', 'personal', 'urgent', 'reminder'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        playMechanicalSound(650, 'sine', 0.05);
                        setNewCategory(cat);
                      }}
                      className={`text-[9px] px-2 py-0.5 border rounded cursor-pointer transition-all ${
                        newCategory === cat
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-400 font-bold'
                          : 'bg-slate-900/60 border-slate-900 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {getCategoryThemeText(cat)}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[10px] px-4 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1 shadow-md active:scale-95 border border-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>حفظ الحدث</span>
              </button>
            </div>
          </form>

        </div>

        {/* LEFT PANEL: The Tasks and Events Hub scheduler list */}
        <div className="w-full lg:w-[50%] p-4 flex flex-col overflow-hidden">
          
          {/* Header filter options row */}
          <div className="flex flex-col gap-2 mb-3 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">لوحة المهام والمواعيد النشطة</span>
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              
              {/* Category selector */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-cyan-955/20 text-slate-400">
                <Tag className="w-3 h-3 text-cyan-500" />
                <span>الفئة:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent border-none text-slate-200 outline-none pr-1.5 text-[10px]"
                >
                  <option value="all">الكل</option>
                  <option value="work">عمل</option>
                  <option value="personal">شخصي</option>
                  <option value="urgent">عاجل</option>
                  <option value="reminder">تذكير</option>
                </select>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-cyan-955/20 text-slate-400 block">
                <Filter className="w-3 h-3 text-cyan-500" />
                <span>برمجة الإنجاز:</span>
                <select
                  value={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.value as any)}
                  className="bg-transparent border-none text-slate-200 outline-none pr-1.5 text-[10px]"
                >
                  <option value="all">الكل</option>
                  <option value="pending">غير منجز</option>
                  <option value="completed">مكتمل</option>
                </select>
              </div>

              <span className="text-[9px] text-cyan-500 mr-auto font-mono">{filteredEvents.length} تذكيرات نشطة</span>
            </div>
          </div>

          {/* List layout of filtered events */}
          <div className="flex-1 overflow-y-auto space-y-2 p-0.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">جاري المزامنة مع Firestore...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border border-slate-900 rounded-lg text-center gap-2">
                <AlertTriangle className="w-6 h-6 text-slate-600" />
                <div>
                  <h5 className="text-xs font-bold text-slate-400">لا توجد مواعيد أو مهام نشطة</h5>
                  <p className="text-[10px] text-slate-600 mt-0.5">غيّر الفلاتر أو حدد يوماً آخر لتدوين المواعيد.</p>
                </div>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const eventTheme = getCategoryColor(evt.category);
                
                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-lg border bg-gradient-to-l flex items-start gap-3 transition-all ${eventTheme} ${
                      evt.completed ? 'opacity-55' : 'shadow-[0_0_12px_rgba(6,182,212,0.03)]'
                    }`}
                  >
                    {/* Circle check toggler checkbox */}
                    <button
                      onClick={() => handleToggleComplete(evt)}
                      className="cursor-pointer text-cyan-400 hover:scale-108 transition-transform mt-0.5 shrink-0"
                    >
                      {evt.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-cyan-400 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`font-black text-xs text-slate-100 truncate ${evt.completed ? 'line-through text-slate-500' : ''}`}>
                          {evt.title}
                        </h4>
                        <span className="text-[8px] bg-cyan-950/40 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold uppercase font-mono mr-1.5">
                          {getCategoryThemeText(evt.category)}
                        </span>
                      </div>
                      
                      <p className={`text-[10px] text-slate-400 font-sans mt-1 leading-normal ${evt.completed ? 'text-slate-500 line-through' : ''}`}>
                        {evt.description || 'لا توجد تفاصيل إضافية لهذا الحدث.'}
                      </p>

                      <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-600" />
                          <span>{evt.time}</span>
                        </span>
                        <span>•</span>
                        <span>{evt.date}</span>
                      </div>
                    </div>

                    {/* Delete event red button */}
                    <button
                      onClick={() => handleDeleteEvent(evt.id, evt.title)}
                      className="p-1.5 bg-slate-900/40 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-900/30 rounded cursor-pointer transition-all self-center"
                      title="حذف الحدث"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
