import React from 'react';
import { NAV_ITEMS } from '../constants';

const Navigation: React.FC = () => {
  return (
    <nav className="fixed right-0 top-0 h-screen w-20 flex flex-col justify-between items-center py-10 z-40 mix-blend-difference text-[#f2f0ea] border-l border-white/10 hidden md:flex">
      <div className="vertical-text transform rotate-180 writing-mode-vertical-rl text-xs font-bold tracking-widest opacity-50">
        VER 2.0.4
      </div>
      
      <div className="flex flex-col gap-12">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="transform -rotate-90 text-sm font-bold tracking-widest hover:text-orange-500 transition-colors relative group"
          >
            {item.label}
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      <div className="w-[1px] h-20 bg-current opacity-20" />
    </nav>
  );
};

export default Navigation;