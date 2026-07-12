'use client';

import { useEffect, useState } from 'react';

import { motionMediaQuery } from './presets';

export const useInteractiveText = () => {
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia(motionMediaQuery);
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const update = () => {
      setIsInteractive(pointerQuery.matches && !reducedMotionQuery.matches);
    };

    update();
    pointerQuery.addEventListener('change', update);
    reducedMotionQuery.addEventListener('change', update);

    return () => {
      pointerQuery.removeEventListener('change', update);
      reducedMotionQuery.removeEventListener('change', update);
    };
  }, []);

  return isInteractive;
};
