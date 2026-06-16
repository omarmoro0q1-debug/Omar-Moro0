/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, RefreshCw, Sparkles, Waves } from 'lucide-react';

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  tailPhase: number;
  tailSpeed: number;
  targetFoodId: string | null;
}

interface Food {
  id: string;
  x: number;
  y: number;
  size: number;
}

interface Bubble {
  x: number;
  y: number;
  size: number;
  vy: number;
}

export default function BioFishTankApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fishCount, setFishCount] = useState(5);
  const [sandboxMode, setSandboxMode] = useState<'normal' | 'magnet' | 'scare'>('normal');
  const [glassRipple, setGlassRipple] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const fishList = useRef<Fish[]>([]);
  const foodList = useRef<Food[]>([]);
  const bubbleList = useRef<Bubble[]>([]);
  const lastTime = useRef<number>(0);
  const animationId = useRef<number | null>(null);

  // Sound Synth for Water Drop
  const playDropSound = (freq = 400, dur = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + dur);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  // Populate initial fish
  const initAquarium = (count: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const colors = [
      '#f97316', // orange clownfish
      '#eab308', // gold yellow tang
      '#06b6d4', // cyan damselfish
      '#ec4899', // pink anthias
      '#a855f7', // purple royal gramma
    ];

    const list: Fish[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.0,
        size: 15 + Math.random() * 15,
        color: colors[i % colors.length],
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.15 + Math.random() * 0.1,
        targetFoodId: null,
      });
    }

    // Bubbles
    const bList: Bubble[] = [];
    for (let i = 0; i < 20; i++) {
      bList.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + 50,
        size: 1 + Math.random() * 4,
        vy: 0.5 + Math.random() * 1.0,
      });
    }

    fishList.current = list;
    bubbleList.current = bList;
    foodList.current = [];
  };

  // Handle Resize correctly via ResizeObserver
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    const updateSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 300;
      initAquarium(fishCount);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fishCount]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAngle = 0;

    const render = () => {
      localAngle += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Under-water ambient gradient light rays
      const grad = ctx.createLinearGradient(canvas.width / 2, 0, canvas.width / 2, canvas.height);
      grad.addColorStop(0, '#001e3d'); // bright blue top
      grad.addColorStop(1, '#000814'); // deep dark blackish blue bottom
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Light shafts filtering in from top left
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width * 0.2, 0);
      ctx.lineTo(canvas.width * 0.4, canvas.height);
      ctx.lineTo(canvas.width * 0.15, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, 0);
      ctx.lineTo(canvas.width * 0.6, 0);
      ctx.lineTo(canvas.width * 0.8, canvas.height);
      ctx.lineTo(canvas.width * 0.55, canvas.height);
      ctx.closePath();
      ctx.fill();

      // 2. Draw Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 0.5;

      bubbleList.current.forEach((bub) => {
        bub.y -= bub.vy;
        bub.x += Math.sin(localAngle + bub.y * 0.05) * 0.2; // wobble

        // Reset bubble on reaching top
        if (bub.y < -10) {
          bub.y = canvas.height + 10;
          bub.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(bub.x, bub.y, bub.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 3. Draw Seaweed on bottom swaying
      ctx.fillStyle = '#065f46';
      for (let i = 0; i < canvas.width; i += 40) {
        const height = 40 + Math.sin(localAngle + i) * 15 + (i % 3) * 15;
        ctx.beginPath();
        ctx.moveTo(i, canvas.height);
        // Bezier curves mimicking grass
        ctx.quadraticCurveTo(
          i + Math.sin(localAngle + i * 0.1) * 10,
          canvas.height - height / 2,
          i + Math.sin(localAngle + i * 0.2) * 15,
          canvas.height - height
        );
        ctx.quadraticCurveTo(
          i + 8 + Math.sin(localAngle + i * 0.1) * 8,
          canvas.height - height / 2,
          i + 15,
          canvas.height
        );
        ctx.closePath();
        ctx.fill();
      }

      // 4. Draw Food particles
      ctx.fillStyle = '#f59e0b';
      foodList.current.forEach((food) => {
        // Fall down slowly
        food.y += 0.8;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Filter out food that hits bottom
      foodList.current = foodList.current.filter((food) => food.y < canvas.height - 5);

      // 5. Update and Draw Fish
      fishList.current.forEach((fish) => {
        // Increment tail animation
        fish.tailPhase += fish.tailSpeed;

        // Behaviors based on foods or modes
        let targetX = null;
        let targetY = null;

        if (foodList.current.length > 0) {
          // Find closest food
          let closestDist = Infinity;
          let closest: Food | null = null;
          foodList.current.forEach((food) => {
            const dx = food.x - fish.x;
            const dy = food.y - fish.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
              closestDist = dist;
              closest = food;
            }
          });

          if (closest) {
            targetX = (closest as Food).x;
            targetY = (closest as Food).y;

            // If close enough, eat it!
            if (closestDist < fish.size + 2) {
              const fId = (closest as Food).id;
              foodList.current = foodList.current.filter((f) => f.id !== fId);
              fish.size = Math.min(fish.size + 1.2, 45); // grow
              playDropSound(600, 0.08);
            }
          }
        }

        // Steer toward target
        if (targetX !== null && targetY !== null) {
          const dx = targetX - fish.x;
          const dy = targetY - fish.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            fish.vx += (dx / len) * 0.08;
            fish.vy += (dy / len) * 0.08;
          }
        } else {
          // Natural schooling or cruising drift behavior
          fish.vx += (Math.random() - 0.5) * 0.08;
          fish.vy += (Math.random() - 0.5) * 0.04;
        }

        // Limit speeds
        const maxSpeed = targetX !== null ? 2.5 : 1.2;
        const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        if (speed > maxSpeed) {
          fish.vx = (fish.vx / speed) * maxSpeed;
          fish.vy = (fish.vy / speed) * maxSpeed;
        }

        // Move fish
        fish.x += fish.vx;
        fish.y += fish.vy;

        // Contain in aquarium bounds with soft bounced
        if (fish.x < -20) fish.x = canvas.width + 20;
        if (fish.x > canvas.width + 20) fish.x = -20;
        if (fish.y < 10) {
          fish.y = 10;
          fish.vy *= -0.5;
        }
        if (fish.y > canvas.height - 20) {
          fish.y = canvas.height - 20;
          fish.vy *= -0.5;
        }

        // 6. Draw individual fish vector graphics
        const angle = Math.atan2(fish.vy, fish.vx);
        const swimDirectionRight = fish.vx > 0;

        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(angle);

        // Fish Body colors
        ctx.fillStyle = fish.color;

        // Tail sway calculation
        const tailSway = Math.sin(fish.tailPhase) * 6;

        // 1. Draw Tail Fin
        ctx.beginPath();
        ctx.moveTo(-fish.size, 0);
        ctx.lineTo(-fish.size - 10, -tailSway - fish.size / 2);
        ctx.lineTo(-fish.size - 6, -tailSway);
        ctx.lineTo(-fish.size - 10, -tailSway + fish.size / 2);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Body (ellipse shape)
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.size, fish.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Dorsal/Side Fins with nice shading
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(-fish.size * 0.3, -fish.size * 0.4, fish.size * 0.3, fish.size * 0.15, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // 4. Draw eyes based on direction
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fish.size * 0.5, -fish.size * 0.15, fish.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000814';
        ctx.beginPath();
        ctx.arc(fish.size * 0.52, -fish.size * 0.15, fish.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 7. Draw Glass tap ripple ripples
      if (glassRipple.active) {
        ctx.strokeStyle = `rgba(147, 197, 253, ${Math.max(0, 1 - localAngle % 1.5)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(glassRipple.x, glassRipple.y, (localAngle % 1.5) * 60, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, []);

  // Click on Canvas to add food / tap glass
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (sandboxMode === 'normal') {
      // Create Food Particle
      const newFood: Food = {
        id: `food-${Date.now()}-${Math.random()}`,
        x,
        y,
        size: 3 + Math.random() * 2,
      };
      foodList.current.push(newFood);
      playDropSound(450, 0.08);
    } else {
      // Scare/Tap mode: push fish away
      setGlassRipple({ x, y, active: true });
      playDropSound(120, 0.2);

      // Force push vectors
      fishList.current.forEach((fish) => {
        const dx = fish.x - x;
        const dy = fish.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const power = (150 - dist) / 150;
          fish.vx += (dx / dist) * power * 8;
          fish.vy += (dy / dist) * power * 8;
        }
      });

      // Turn off glass ripple showing timeout
      setTimeout(() => setGlassRipple((prev) => ({ ...prev, active: false })), 500);
    }
  };

  const handleClearAquarium = () => {
    foodList.current = [];
    initAquarium(fishCount);
    playDropSound(220, 0.15);
  };

  const handleSpawnFish = () => {
    if (fishList.current.length < 25) {
      const colors = ['#f97316', '#eab308', '#06b6d4', '#ec4899', '#a855f7'];
      const canvas = canvasRef.current;
      if (!canvas) return;

      fishList.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.0,
        size: 15 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        tailPhase: Math.random() * Math.PI * 2,
        tailSpeed: 0.15 + Math.random() * 0.1,
        targetFoodId: null,
      });
      setFishCount(fishList.current.length);
      playDropSound(520, 0.06);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 text-white font-sans rounded-xl overflow-hidden p-4 gap-4">
      {/* Bio Fish Tank Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="font-semibold text-sm">حوض الأسماك التفاعلي العضوي (Organic Fishstick)</h3>
        </div>

        {/* Sandbox Modes */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setSandboxMode('normal')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              sandboxMode === 'normal' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            نثر الطعام
          </button>
          
          <button
            onClick={() => setSandboxMode('scare')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              sandboxMode === 'scare' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            النقر على الزجاج / إرجاف الأسماك
          </button>

          <button
            onClick={handleSpawnFish}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>إضافة سمكة ({fishList.current.length})</span>
          </button>

          <button
            onClick={handleClearAquarium}
            className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
            title="تحديث الحوض"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container with solid sizes */}
      <div ref={containerRef} className="flex-1 relative bg-gradient-to-b from-slate-950 to-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-cyan-800/40 transition-colors">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full cursor-crosshair block"
        />

        {/* Water Level Overlay */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-400/50 shadow-inner blur-[0.5px]" />
      </div>

      {/* Interactive Tips */}
      <div className="flex items-start gap-1 pb-1 text-[11px] text-slate-400 leading-snug">
        <HelpCircle className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
        <p>هذا المحاكي العضوي يندمج مع تطلبات (organic-fishstick). انقر لتسقيط طعام الأسماك (النشا الذهبي)، وسوف تسبح الأسماك بسرعة بالغة لالتهام النشا لكي تنمو وتكبر حجماً بشكل حقيقي!</p>
      </div>
    </div>
  );
}
