import React, { useEffect, useRef, useState } from 'react';
import GlitchText from './GlitchText';

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
      ctx.strokeStyle = isPlaying ? '#ea580c' : '#57534e'; // Orange when playing, Stone when paused
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
    <div className="border border-stone-300 p-8 relative overflow-hidden group">
      <div className="absolute top-2 left-2 text-[10px] text-orange-600 font-bold tracking-widest uppercase">
        Audio Processor Unit
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-[300px] cursor-pointer"
        onClick={() => setIsPlaying(!isPlaying)}
      />

      <div className="mt-4 flex justify-between items-end border-t border-stone-300 pt-4">
        <div>
           <h3 className="text-xl font-bold font-display uppercase">
             {isPlaying ? <GlitchText text="SYSTEM_ACTIVE" /> : "SYSTEM_IDLE"}
           </h3>
           <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
             Click visualizations to toggle audio simulation processing.
           </p>
        </div>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-2 bg-stone-900 text-[#f2f0ea] hover:bg-orange-600 transition-colors uppercase text-sm font-bold tracking-wider"
        >
          {isPlaying ? 'PAUSE' : 'INITIATE'}
        </button>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-600" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-600" />
    </div>
  );
};

export default AudioVisualizer;