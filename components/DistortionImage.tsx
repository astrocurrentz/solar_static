import React, { useRef } from 'react';

interface DistortionImageProps {
  src: string;
  alt: string;
  className?: string;
}

const DistortionImage: React.FC<DistortionImageProps> = ({ src, alt, className = '' }) => {
  return (
    <div className={`relative group overflow-hidden ${className}`}>
      {/* Base Image */}
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105 group-hover:grayscale grayscale-0 filter"
        style={{ filter: 'url(#noise-displacement)' }}
      />
      
      {/* Chromatic Aberration Layers (Visible on Hover) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-50 mix-blend-screen transition-opacity duration-100 pointer-events-none"
        style={{ 
            backgroundImage: `url(${src})`,
            transform: 'translateX(-4px)',
            filter: 'hue-rotate(90deg)'
        }}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-50 mix-blend-multiply transition-opacity duration-100 pointer-events-none"
        style={{ 
            backgroundImage: `url(${src})`,
            transform: 'translateX(4px)',
            filter: 'hue-rotate(-90deg)'
        }}
      />

      {/* Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-20" />
    </div>
  );
};

export default DistortionImage;