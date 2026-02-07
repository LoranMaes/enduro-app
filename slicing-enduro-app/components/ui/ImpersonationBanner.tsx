
import React from 'react';
import { User } from '../../types';
import { Eye, X, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImpersonationBannerProps {
  user: User;
  onExit: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ user, onExit }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-t border-amber-900/30 bg-amber-950/90 px-6 backdrop-blur-md transition-transform duration-300 ease-out animate-in slide-in-from-bottom-full">
      
      {/* Context Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded bg-amber-900/50 px-2 py-1 text-amber-200">
           <ShieldAlert className="h-4 w-4" />
           <span className="text-[10px] font-bold uppercase tracking-wide">Admin Mode</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-amber-100/80">
          <span>Viewing as</span>
          <div className="flex items-center gap-2 rounded-full bg-amber-900/30 px-2 py-0.5 border border-amber-900/50">
            {user.avatarInitials && (
               <span className="text-[10px] font-bold">{user.avatarInitials}</span>
            )}
            <span className="font-medium text-amber-100">{user.name}</span>
          </div>
          <span className="text-xs opacity-60">({user.role})</span>
        </div>
      </div>

      {/* Exit Action */}
      <button 
        onClick={onExit}
        className="group flex items-center gap-2 rounded-md bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900 hover:text-white transition-all border border-transparent hover:border-amber-800"
        title="Return to Admin Dashboard"
      >
        <span>Exit View</span>
        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-amber-900/50 group-hover:bg-amber-800">
           <X className="h-3 w-3" />
        </div>
      </button>
    </div>
  );
};
