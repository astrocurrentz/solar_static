import React from 'react';
import { NAV_ITEMS } from '../constants';

const Navigation: React.FC = () => {
  return (
    <nav className="fixed right-0 top-0 z-40 hidden h-screen w-20 flex-col justify-between items-center border-l border-[var(--border-soft)] py-10 text-[var(--bg-light)] mix-blend-difference md:flex">
      <div className="vertical-text transform rotate-180 writing-mode-vertical-rl text-xs font-bold tracking-widest opacity-50">
        VER 2.0.4
      </div>
      
      <div className="flex flex-col gap-12">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="relative transform -rotate-90 text-sm font-bold tracking-widest transition-colors hover:text-[var(--accent-secondary)] group"
          >
            {item.label}
            <span className="absolute -bottom-4 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent-secondary)] opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>

      <div className="w-[1px] h-20 bg-current opacity-20" />
    </nav>
  );
};

export default Navigation;
