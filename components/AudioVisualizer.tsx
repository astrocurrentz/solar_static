import React, { useEffect, useRef, useState } from 'react';
import GlitchText from './GlitchText';

const ACTIVE_WAVE = '#C97338';
const IDLE_WAVE = 'rgba(229, 216, 189, 0.32)';

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      // Resize
      canvas.width = canvas.parentElement?.offsetWidth || 300;
      canvas.height = 300;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      
      // Styling
      ctx.strokeStyle = isPlaying ? ACTIVE_WAVE : IDLE_WAVE;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const frequency = 0.05;
      const amplitude = isPlaying ? 50 : 5; // Low amplitude when paused

      for (let x = 0; x < width; x+=5) {
        // Create a chaotic waveform
        const y = centerY + 
          Math.sin(x * frequency + time) * amplitude * Math.sin(time * 2) +
          (isPlaying ? (Math.random() - 0.5) * 20 : 0); // Add noise when playing
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      time += 0.1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div
      className="group relative overflow-hidden border border-[var(--border-soft)] bg-[var(--surface-tint)] p-8"
      style={{ boxShadow: '0 20px 40px var(--shadow-deep)' }}
    >
      <div className="absolute top-2 left-2 text-[10px] font-bold tracking-widest uppercase text-[var(--accent-secondary)]">
        Audio Processor Unit
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-[300px] cursor-pointer"
        onClick={() => setIsPlaying(!isPlaying)}
      />

      <div className="mt-4 flex items-end justify-between border-t border-[var(--border-soft)] pt-4">
        <div>
           <h3 className="text-xl font-bold font-display uppercase text-[var(--text-primary)]">
             {isPlaying ? <GlitchText text="SYSTEM_ACTIVE" /> : "SYSTEM_IDLE"}
           </h3>
           <p className="mt-1 max-w-[200px] text-xs text-[var(--text-secondary)]">
             Click visualizations to toggle audio simulation processing.
           </p>
        </div>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-[var(--accent-primary)] px-6 py-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-secondary)]"
        >
          {isPlaying ? 'PAUSE' : 'INITIATE'}
        </button>
      </div>

      {/* Decorative corners */}
      <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[var(--accent-secondary)]" />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[var(--accent-secondary)]" />
    </div>
  );
};

export default AudioVisualizer;
