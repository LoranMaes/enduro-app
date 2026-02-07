
import { User, Activity, Link2, CreditCard, Shield, Sliders } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import type { UserRole } from '../../types';
import { Heading, Label } from '../ui/Typography';

interface SettingsViewProps {
  userRole: UserRole;
}

type SettingsTabId = 'profile' | 'training' | 'integrations' | 'billing' | 'system';

interface SettingsTabDef {
  id: SettingsTabId;
  label: string;
  icon: React.ElementType;
  allowedRoles: UserRole[];
}

const SETTINGS_TABS: SettingsTabDef[] = [
    { id: 'profile', label: 'Profile', icon: User, allowedRoles: ['athlete', 'coach', 'admin'] },
    { id: 'training', label: 'Training Preferences', icon: Activity, allowedRoles: ['athlete'] },
    { id: 'integrations', label: 'Integrations', icon: Link2, allowedRoles: ['athlete'] },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard, allowedRoles: ['athlete', 'coach'] },
    { id: 'system', label: 'System', icon: Shield, allowedRoles: ['admin'] },
];

const ReadOnlyField: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-zinc-500">{label}</Label>
    <div className="w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 font-mono select-none cursor-default transition-colors hover:border-zinc-700">
      {value}
    </div>
  </div>
);

const SettingsPanel: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="rounded-xl border border-border bg-surface p-6 md:p-8 animate-in fade-in duration-300 shadow-sm">
        <div className="mb-8 border-b border-border pb-6">
            <Heading level={2} className="text-zinc-200">{title}</Heading>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <div className="space-y-6 max-w-2xl">
            {children}
        </div>
    </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  // Filter tabs based on role
  const allowedTabs = SETTINGS_TABS.filter(tab => tab.allowedRoles.includes(userRole));
  
  const [activeTab, setActiveTab] = useState<SettingsTabId>(allowedTabs[0]?.id || 'profile');

  // Ensure active tab is valid if role changes
  useEffect(() => {
    if (!allowedTabs.find(t => t.id === activeTab)) {
        setActiveTab(allowedTabs[0]?.id || 'profile');
    }
  }, [userRole, activeTab, allowedTabs]);

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      
      {/* Mobile Header */}
      <div className="md:hidden border-b border-border bg-background p-4">
        <Heading level={2}>Settings</Heading>
      </div>

      <div className="flex-1 overflow-hidden">
         <div className="mx-auto flex h-full max-w-7xl flex-col md:flex-row">
            
            {/* Sidebar Navigation */}
            <aside className="w-full border-b border-border bg-background p-4 md:w-64 md:border-b-0 md:border-r md:py-8 md:pl-8 md:pr-6">
               <div className="mb-8 hidden md:block">
                  <Heading level={1} className="text-xl">Settings</Heading>
                  <div className="mt-2 inline-flex items-center rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400 border border-zinc-700">
                    {userRole} Account
                  </div>
               </div>
               
               <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                  {allowedTabs.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as SettingsTabId)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
                                isActive 
                                    ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/5" 
                                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-zinc-500")} />
                            {item.label}
                          </button>
                      );
                  })}
               </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 md:pl-12">
               
               {activeTab === 'profile' && (
                   <SettingsPanel title="Profile" description="Manage your personal information and account details.">
                       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                           <ReadOnlyField label="Full Name" value="J. Doe" />
                           <ReadOnlyField label="Email Address" value="user@endure.so" />
                           <ReadOnlyField label="Timezone" value="America/New_York (UTC-5)" />
                           <ReadOnlyField label="Unit System" value="Metric (km, kg)" />
                       </div>
                   </SettingsPanel>
               )}

               {activeTab === 'training' && (
                   <SettingsPanel title="Training Preferences" description="Configure your default training parameters and zones.">
                       <ReadOnlyField label="Primary Sport" value="Triathlon" />
                       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                           <ReadOnlyField label="Weekly Training Days" value="6 Days" />
                           <ReadOnlyField label="Preferred Rest Day" value="Monday" />
                       </div>
                       <ReadOnlyField label="Intensity Distribution" value="Polarized (80/20)" />
                       
                       <div className="rounded-lg border border-dashed border-zinc-700 p-4">
                           <div className="flex items-center gap-2 text-zinc-400 mb-2">
                               <Sliders className="w-4 h-4" />
                               <span className="text-xs font-medium uppercase">Zone Configuration</span>
                           </div>
                           <p className="text-sm text-zinc-500">
                               FTP and Heart Rate zones are managed automatically based on your performance data. Manual overrides are disabled in this version.
                           </p>
                       </div>
                   </SettingsPanel>
               )}

               {activeTab === 'integrations' && (
                   <SettingsPanel title="Integrations" description="Manage connections to external devices and platforms.">
                       <div className="space-y-4">
                           <div className="flex items-center justify-between rounded-lg border border-border bg-zinc-900/30 p-4">
                               <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 border border-zinc-700">G</div>
                                   <div>
                                       <h4 className="text-sm font-medium text-white">Garmin Connect</h4>
                                       <p className="text-xs text-zinc-500">Syncs activities, weight, and sleep data.</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-2">
                                   <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                   <span className="text-xs font-medium text-emerald-500">Connected</span>
                               </div>
                           </div>
                       </div>
                   </SettingsPanel>
               )}

               {activeTab === 'billing' && (
                   <SettingsPanel title="Billing & Plans" description="Manage your subscription and payment methods.">
                       <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 p-6">
                           <div className="flex items-start justify-between">
                               <div>
                                   <h4 className="text-base font-medium text-emerald-400">
                                     {userRole === 'coach' ? 'Pro Coach Tier' : 'Advanced Athlete'}
                                   </h4>
                                   <p className="mt-1 text-sm text-zinc-400">Billed monthly • Next billing date: Oct 24, 2024</p>
                               </div>
                               <span className="text-xl font-mono text-white">
                                 {userRole === 'coach' ? '€49/mo' : '€12/mo'}
                               </span>
                           </div>
                       </div>
                       
                       <div className="pt-4">
                            <h5 className="text-sm font-medium text-zinc-300 mb-4">Payment Method</h5>
                            <div className="flex items-center gap-3 p-3 rounded border border-border bg-zinc-900/30">
                                <CreditCard className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm font-mono text-zinc-400">•••• •••• •••• 4242</span>
                                <span className="text-xs text-zinc-600 ml-auto">Expires 12/25</span>
                            </div>
                       </div>
                   </SettingsPanel>
               )}

               {activeTab === 'system' && (
                   <SettingsPanel title="System" description="Application preferences and data management.">
                       <div className="rounded-lg border border-yellow-900/20 bg-yellow-900/10 p-4 mb-6">
                          <Label className="text-yellow-500 mb-1">Admin Mode Active</Label>
                          <p className="text-xs text-zinc-400">System changes here affect the global platform configuration.</p>
                       </div>
                       <ReadOnlyField label="Theme" value="Dark Mode (System Enforced)" />
                   </SettingsPanel>
               )}
            </main>
         </div>
      </div>
    </div>
  );
};
