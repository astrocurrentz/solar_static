import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);

  useEffect(() => {
    const coarsePointerMedia = window.matchMedia('(pointer: coarse)');
    const updateCursorMode = () => {
      setIsEnabled(!coarsePointerMedia.matches);
    };

    updateCursorMode();

    if (coarsePointerMedia.addEventListener) {
      coarsePointerMedia.addEventListener('change', updateCursorMode);
    } else {
      coarsePointerMedia.addListener(updateCursorMode);
    }

    return () => {
      if (coarsePointerMedia.removeEventListener) {
        coarsePointerMedia.removeEventListener('change', updateCursorMode);
      } else {
        coarsePointerMedia.removeListener(updateCursorMode);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const computedStyle = window.getComputedStyle(target);
      
      setIsPointer(
        computedStyle.cursor === 'pointer' || 
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a'
      );

      setIsHoveringText(
        ['p', 'h1', 'h2', 'h3', 'span'].includes(target.tagName.toLowerCase())
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Main Dot */}
      <div 
        className="fixed top-0 left-0 z-50 h-3 w-3 rounded-full bg-[var(--accent-secondary)] pointer-events-none mix-blend-difference transition-transform duration-100 ease-out will-change-transform"
        style={{ 
          transform: `translate(${position.x - 6}px, ${position.y - 6}px) scale(${isPointer ? 2.5 : 1})` 
        }}
      />
      
      {/* Trailing Ring */}
      <div 
        className={`fixed top-0 left-0 z-40 h-8 w-8 rounded-full border border-[var(--bg-light)] pointer-events-none mix-blend-difference transition-all duration-300 ease-out will-change-transform ${isHoveringText ? 'scale-150 border-dashed border-[var(--accent-secondary)] opacity-60' : 'opacity-100'}`}
        style={{ 
          transform: `translate(${position.x - 16}px, ${position.y - 16}px)` 
        }}
      />
      
      {/* Crosshair lines on click/hover */}
      {isPointer && (
        <>
           <div 
            className="fixed top-0 left-0 z-30 h-[1px] w-full bg-[var(--glow-accent)] pointer-events-none"
            style={{ top: position.y }}
           />
           <div 
            className="fixed top-0 left-0 z-30 h-full w-[1px] bg-[var(--glow-accent)] pointer-events-none"
            style={{ left: position.x }}
           />
        </>
      )}
    </>
  );
};

export default CustomCursor;
