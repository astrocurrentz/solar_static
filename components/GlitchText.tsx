import React, { useState, useEffect, useRef } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', tag: Tag = 'span' }) => {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<number | null>(null);

  const startScramble = () => {
    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      
      iteration += 1 / 3;
    }, 30);
  };

  const handleMouseEnter = () => startScramble();

  // Initial scramble on mount
  useEffect(() => {
    startScramble();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tag 
      className={`${className} cursor-default inline-block`}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </Tag>
  );
};

export default GlitchText;