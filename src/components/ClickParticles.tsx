/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay: number;
  type: 'circle' | 'sparkle';
  rotation?: number;
  rotSpeed?: number;
}

interface ClickParticlesProps {
  accentColor: string; // The hexadecimal color or similar code
}

export default function ClickParticles({ accentColor }: ClickParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle full-screen resizing of the canvas overlay
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dynamic animation loop
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // Small gravity factor
        p.alpha -= p.decay;

        if (p.rotation !== undefined && p.rotSpeed !== undefined) {
          p.rotation += p.rotSpeed;
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.type === 'sparkle' ? 8 : 4;
        ctx.shadowColor = p.color;

        if (p.type === 'sparkle') {
          // Draw a star/cross sparkle
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.moveTo(0, -p.size);
          ctx.lineTo(0, p.size);
          ctx.stroke();
        } else {
          // Draw a smooth glowing radial particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    // Global click listener to spawn burst constellation
    const handleMouseDown = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const count = 12 + Math.floor(Math.random() * 8);
      const colorPalette = [
        accentColor,
        '#ffffff', // Mix with white sparkles for brilliance
        accentColor === '#22d3ee' ? '#06b6d4' : '#818cf8', // Adjacent neon shade
      ];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.8;
        const type: 'circle' | 'sparkle' = Math.random() > 0.4 ? 'circle' : 'sparkle';
        
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0, // Initial upward push vector
          size: type === 'sparkle' ? 3 + Math.random() * 5 : 1.5 + Math.random() * 2.5,
          alpha: 1.0,
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
          decay: 0.015 + Math.random() * 0.02,
          type,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animId);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-[100]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
