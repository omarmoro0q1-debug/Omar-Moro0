/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Trash2, Undo, CircleDot, PlayCircle, Download } from 'lucide-react';

export default function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#6366f1'); // default indigo-500
  const [brushSize, setBrushSize] = useState(4);
  const [currentTool, setCurrentTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Resize canvas correctly
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    const resizeObserver = new ResizeObserver(() => {
      // Save content before resize
      const content = canvas.toDataURL();

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 300;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill canvas with white/slate-950 base
        ctx.fillStyle = '#0f172a'; // slate-900 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Restore content
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = content;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[historyIndex - 1];
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(historyIndex - 1);
    };
    img.src = previousState;
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get exact mouse/touch coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#0f172a' : color;

    setIsDrawing(true);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const exportDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `gemileith-drawing-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const colors = [
    '#ffffff', // white
    '#f43f5e', // rose-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#a855f7', // purple-500
    '#f97316', // orange-500
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white font-sans rounded-xl overflow-hidden p-4 gap-4">
      {/* Tool panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-950 border border-slate-800 rounded-lg">
        
        {/* Colors selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-bold mr-1 block">الألوان:</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setCurrentTool('brush');
              }}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                color === c && currentTool === 'brush'
                  ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500/50'
                  : 'border-transparent hover:scale-105'
              }`}
              title={c}
            />
          ))}
        </div>

        {/* Brush config & modifiers */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-bold">الحجم:</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold text-slate-300 w-5 text-center">{brushSize}px</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Tool switchers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentTool('brush')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                currentTool === 'brush' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="فرشاة الرسم"
            >
              <Palette className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                currentTool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="محاية"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white disabled:opacity-40 rounded cursor-pointer text-slate-400 border border-slate-700/60"
              title="تراجع"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={clearCanvas}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 rounded cursor-pointer text-slate-400 border border-slate-700/60"
              title="مسح لوحة الرسم"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={exportDrawing}
              className="p-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded cursor-pointer text-slate-400 border border-slate-700/60"
              title="تنزيل اللوحة كصورة"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Actual drawing canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDraw}
          onMouseUp={handleStopDrawing}
          onMouseLeave={handleStopDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDraw}
          onTouchEnd={handleStopDrawing}
          className="block w-full h-full cursor-cell touch-none"
        />
      </div>
    </div>
  );
}
