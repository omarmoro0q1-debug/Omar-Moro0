/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Minus, Square, X, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Window } from '../types';

interface WindowFrameProps {
  key?: string;
  windowState: Window;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onMove: (x: number, y: number) => void;
  children: React.ReactNode;
}

export default function WindowFrame({
  windowState,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  onMove,
  children,
}: WindowFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, windowX: 0, windowY: 0 });

  if (!windowState.isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header bar, or specific buttons
    const target = e.target as HTMLElement;
    if (target.closest('.no-drag')) return;

    onFocus();
    setIsDragging(true);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      windowX: windowState.x,
      windowY: windowState.y,
    };

    const handleMouseMove = (mouseEvent: MouseEvent) => {
      const dx = mouseEvent.clientX - dragStartRef.current.x;
      const dy = mouseEvent.clientY - dragStartRef.current.y;
      
      let newX = dragStartRef.current.windowX + dx;
      let newY = dragStartRef.current.windowY + dy;

      // Restrict Y so titlebar stays reachable below top bar (e.g. Y > 45)
      if (newY < 45) newY = 45;

      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Absolute placement styling
  const style: React.CSSProperties = windowState.isMaximized
    ? {
        position: 'absolute',
        top: '48px', // below top status bar
        left: '0px',
        right: '0px',
        bottom: '48px', // above taskbar
        zIndex: windowState.zIndex,
      }
    : {
        position: 'absolute',
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
        zIndex: windowState.zIndex,
      };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: windowState.isMinimized ? 0.9 : 1, opacity: windowState.isMinimized ? 0 : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        ...style,
        display: windowState.isMinimized ? 'none' : 'flex',
        backgroundColor: 'var(--bg-window, #050608)',
        border: '1px solid var(--border-primary, rgba(6, 182, 212, 0.2))',
        boxShadow: 'var(--shadow-primary, 0 0 20px rgba(6, 182, 212, 0.12))',
      }}
      className="flex-col rounded-lg overflow-hidden transition-all duration-300"
      onClick={onFocus}
    >
      {/* Title/Header Drag Bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: 'var(--bg-header, #0c0f17)',
          borderBottom: '1px solid var(--border-secondary, rgba(6, 185, 212, 0.15))',
          color: 'var(--text-primary, #22d3ee)',
        }}
        className="h-10 shrink-0 select-none flex items-center justify-between px-3.5 cursor-move transition-all duration-300 text-cyan-400"
      >
        {/* Title & Icon */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans">{windowState.icon}</span>
          <span className="text-[11.5px] font-bold tracking-wide select-none truncate max-w-[200px]" style={{ color: 'var(--text-primary, #22d3ee)' }}>{windowState.title}</span>
        </div>

        {/* Action Window Controls (minimize, maximize, close) */}
        <div className="flex items-center gap-1.5 no-drag select-none pr-3">
          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="w-5 h-5 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="تصغير"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>

          {/* Maximize toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="w-5 h-5 rounded-full bg-slate-800/60 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title={windowState.isMaximized ? 'استعادة الحجم' : 'تكبير'}
          >
            <Square className="w-2 h-2" />
          </button>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-5 h-5 rounded-full bg-rose-500/20 hover:bg-rose-600 flex items-center justify-center text-rose-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="إغلاق"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Frame body placeholder */}
      <div 
        style={{ backgroundColor: 'var(--bg-inner, #0f172a)' }}
        className="flex-1 overflow-hidden relative transition-all duration-300"
      >
        {children}
      </div>
    </motion.div>
  );
}
