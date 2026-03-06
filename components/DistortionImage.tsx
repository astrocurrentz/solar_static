import React from 'react';

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
        className="h-full w-full object-cover filter transition-transform duration-700 ease-in-out group-hover:scale-105"
        style={{ filter: 'url(#noise-displacement)' }}
      />
      
      {/* Chromatic Aberration Layers (Visible on Hover) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-50 mix-blend-screen transition-opacity duration-100 pointer-events-none"
        style={{ 
            backgroundImage: `url(${src})`,
            transform: 'translateX(-4px)',
            filter: 'sepia(1) hue-rotate(-18deg) saturate(1.35)'
        }}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-50 mix-blend-multiply transition-opacity duration-100 pointer-events-none"
        style={{ 
            backgroundImage: `url(${src})`,
            transform: 'translateX(4px)',
            filter: 'sepia(1) hue-rotate(10deg) saturate(0.9)'
        }}
      />

      {/* Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(40,33,25,0)_50%,rgba(40,33,25,0.18)_50%),linear-gradient(90deg,rgba(201,115,56,0.08),rgba(229,216,189,0.03),rgba(165,77,39,0.08))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-30" />
    </div>
  );
};

export default DistortionImage;
