import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <>
      {/* Main Dot */}
      <div 
        className="fixed top-0 left-0 w-3 h-3 bg-orange-600 rounded-full pointer-events-none z-50 mix-blend-difference transition-transform duration-100 ease-out will-change-transform"
        style={{ 
          transform: `translate(${position.x - 6}px, ${position.y - 6}px) scale(${isPointer ? 2.5 : 1})` 
        }}
      />
      
      {/* Trailing Ring */}
      <div 
        className={`fixed top-0 left-0 w-8 h-8 border border-stone-800 rounded-full pointer-events-none z-40 transition-all duration-300 ease-out will-change-transform ${isHoveringText ? 'scale-150 border-dashed border-orange-400 opacity-50' : 'opacity-100'}`}
        style={{ 
          transform: `translate(${position.x - 16}px, ${position.y - 16}px)` 
        }}
      />
      
      {/* Crosshair lines on click/hover */}
      {isPointer && (
        <>
           <div 
            className="fixed top-0 left-0 w-full h-[1px] bg-orange-600/20 pointer-events-none z-30"
            style={{ top: position.y }}
           />
           <div 
            className="fixed top-0 left-0 h-full w-[1px] bg-orange-600/20 pointer-events-none z-30"
            style={{ left: position.x }}
           />
        </>
      )}
    </>
  );
};

export default CustomCursor;