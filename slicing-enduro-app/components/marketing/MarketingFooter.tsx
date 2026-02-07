
import React from 'react';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="border-t border-border px-6 py-12 text-center md:text-left">
       <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
             <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">Endure</div>
             <div className="text-[10px] text-zinc-600">© 2024 Performance Systems.</div>
          </div>
          <div className="text-[10px] text-zinc-700 font-mono">
            v1.0.0-beta
          </div>
       </div>
    </footer>
  );
};
