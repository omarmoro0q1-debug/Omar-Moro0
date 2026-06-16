/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Save, Plus, Trash2, CloudCheck, CloudLightning, Eye, FileEdit, Mic, MicOff } from 'lucide-react';
import { FileItem } from '../../types';

interface NotepadAppProps {
  files: FileItem[];
  currentFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, content: string, type: 'text') => void;
  onUpdateFile: (id: string, content: string) => void;
  onDeleteFile: (id: string) => void;
  isCloudSynced: boolean;
}

export default function NotepadApp({
  files,
  currentFileId,
  onSelectFile,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  isCloudSynced,
}: NotepadAppProps) {
  const currentFile = files.find((f) => f.id === currentFileId) || null;
  const [editorContent, setEditorContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Speech Recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [micLanguage, setMicLanguage] = useState<'ar-EG' | 'en-US'>('ar-EG');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsRecording(true);
        setRecordingError(null);
      };
      
      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setRecordingError('تم رفض الإذن بميكروفون');
        } else if (event.error === 'no-speech') {
          setRecordingError('لم يتم رصد صوت مكتوب');
        } else {
          setRecordingError(`خطأ: ${event.error}`);
        }
        setIsRecording(false);
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognition) {
      // Simulation/fallback for environments without actual native browser SpeechRecognition API support
      setRecordingError('محاكي الميكروفون: جاري تسجيل الصوت...');
      setIsRecording(true);
      setTimeout(() => {
        const textSeed = micLanguage === 'ar-EG' 
          ? 'المذكرة الصوتية الذكية: تفقد أداء النواة وتحسين المظهر والإنضمام لبوابة جيمي الذكي السحابي.'
          : 'Smart Voice Memo: Audited kernel processes, telemetry checks completed, and Gemi AI sync validated.';
        const label = micLanguage === 'ar-EG'
          ? `مذكرة صوتية ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}.txt`
          : `Audio Note ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}.txt`;
        onCreateFile(label, textSeed, 'text');
        setIsRecording(false);
        setRecordingError(null);
      }, 2500);
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.lang = micLanguage;
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript && transcript.trim()) {
          const timestampLabel = new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
          const label = micLanguage === 'ar-EG' 
            ? `مذكرة صوتية ${timestampLabel}.txt`
            : `Audio Note ${timestampLabel}.txt`;
          onCreateFile(label, transcript, 'text');
        }
      };
      try {
        recognition.start();
      } catch (err) {
        console.error('Recognition start err: ', err);
      }
    }
  };

  useEffect(() => {
    if (currentFile) {
      setEditorContent(currentFile.content);
    } else {
      setEditorContent('');
    }
  }, [currentFileId, currentFile]);

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    let name = newFileName.trim();
    if (!name.endsWith('.txt')) {
      name += '.txt';
    }

    onCreateFile(name, 'اكتب بعض الملاحظات هنا...', 'text');
    setNewFileName('');
  };

  const handleContentChange = (val: string) => {
    setEditorContent(val);
    if (currentFileId) {
      // Direct update
      onUpdateFile(currentFileId, val);
    }
  };

  const forceCloudSave = () => {
    if (!currentFileId) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  // Custom regex markdown parser to render high fidelity notes safely in React 19
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-slate-500 italic">مستند فارغ...</p>;
    
    // Split into paragraphs / lines
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h5 key={index} className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-1 mt-4 mb-2">{trimmed.substring(4)}</h5>;
      }
      if (trimmed.startsWith('## ')) {
        return <h4 key={index} className="text-base font-bold text-indigo-300 border-b border-slate-800 pb-1 mt-5 mb-2">{trimmed.substring(3)}</h4>;
      }
      if (trimmed.startsWith('# ')) {
        return <h3 key={index} className="text-lg font-bold text-white border-b border-slate-800 pb-1 mt-6 mb-3">{trimmed.substring(2)}</h3>;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <ul key={index} className="list-disc pl-5 text-slate-300 my-1 font-sans text-sm">
            <li>{trimmed.substring(2)}</li>
          </ul>
        );
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-indigo-500 bg-slate-900/40 p-2.5 my-2.5 rounded-r text-xs text-slate-400 italic">
            {trimmed.substring(2)}
          </blockquote>
        );
      }

      // Code blocks
      if (trimmed.startsWith('```')) {
        return null; // hide mock syntax
      }

      // Empty space
      if (!trimmed) {
        return <div key={index} className="h-2" />;
      }

      // Default paragraph
      return <p key={index} className="text-slate-300 leading-relaxed text-sm my-1.5 font-sans">{trimmed}</p>;
    });
  };

  return (
    <div className="flex h-full bg-slate-900 text-white font-sans rounded-xl overflow-hidden border border-slate-800">
      
      {/* File management sidebar */}
      <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800">
          <span className="text-[10px] tracking-widest uppercase text-slate-400 font-bold block mb-2">مستندات السحابة والملفات</span>
          
          <form onSubmit={handleCreateFile} className="flex gap-1.5 mb-2.5">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="مستند جديد..."
              className="text-xs bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white rounded px-2 py-1 outline-none flex-1 max-w-[130px]"
            />
            <button
              type="submit"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="إنشاء ملف جديدة"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Micro memo audio recorder tools */}
          <div className="pt-2 border-t border-slate-900 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-500">
              <span>تسجيل مذكرة صوتية</span>
              <select
                value={micLanguage}
                onChange={(e) => setMicLanguage(e.target.value as any)}
                className="bg-transparent border-none text-slate-400 outline-none cursor-pointer text-[8px]"
              >
                <option value="ar-EG">العربية (Ar)</option>
                <option value="en-US">English (En)</option>
              </select>
            </div>
            
            <button
              onClick={handleToggleMic}
              type="button"
              className={`w-full py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 border ${
                isRecording
                  ? 'bg-rose-600 border-rose-700 text-white animate-pulse'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/40 border-indigo-500/20 text-indigo-300 hover:text-indigo-100'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>{isRecording ? 'جاري الاستماع...' : 'مذكرة ميكروفون'}</span>
            </button>

            {recordingError && (
              <span className="text-[8px] text-rose-400 font-bold block text-center leading-tight">
                {recordingError}
              </span>
            )}
          </div>
        </div>

        {/* Files index */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.length === 0 ? (
            <div className="text-[10px] text-slate-500 p-3 italic text-center">لا توجد ملفات.</div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                  currentFileId === file.id
                    ? 'bg-indigo-900/30 text-white border border-indigo-700/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 rounded transition-opacity"
                  title="حذف الملف"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sync status footer component */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="truncate">خادم التخزين السحابي</span>
          <span className="flex items-center gap-1">
            {isCloudSynced ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">بث حي</span>
              </>
            ) : (
              <>
                <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">تخزين محلي</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Editor Main Canvas Body */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {currentFile ? (
          <>
            {/* Toolbar row */}
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/50 border-b border-slate-800 shrink-0 px-4">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs text-white truncate">{currentFile.name}</h4>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">آخر حفظ: {currentFile.modifiedAt}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Save button manually (auto-saves anyway) */}
                <button
                  onClick={forceCloudSave}
                  disabled={isSaving}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 border border-slate-700"
                >
                  <Save className={`w-3 h-3 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSaving ? 'جاري الحفظ لوحة...' : 'حفظ سحابي'}</span>
                </button>

                {/* Edit/Preview Toggle */}
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className={`px-2.5 py-1 text-[11px] rounded flex items-center gap-1 cursor-pointer font-bold transition-all border ${
                    isPreview
                      ? 'bg-indigo-600 border-indigo-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {isPreview ? (
                    <>
                      <FileEdit className="w-3 h-3" />
                      <span>تعديل المستند</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>معاينة Markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editing / Preview Arena */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isPreview ? (
                <div className="prose max-w-none text-slate-300 font-sans leading-relaxed break-words space-y-2">
                  {renderMarkdown(editorContent)}
                </div>
              ) : (
                <textarea
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="ابدأ في كتابة ملاحظاتك الذكية هنا بوضع Markdown..."
                  dir="auto"
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-slate-200 text-sm font-sans leading-relaxed focus:ring-0 placeholder:text-slate-600 block"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-950/50 border border-slate-800 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6 animate-pulse" />
            </div>
            <div className="max-w-xs">
              <h5 className="font-bold text-sm text-white mb-1">لم يتم تحديد مستند نشط</h5>
              <p className="text-xs text-slate-500">اختر مستنداً من اللوحة الجانبية، أو قم بإنشاء ملف نصي جديد لتفعيل التخزين والمزامنة السحابية.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
