
import { Search, Eye, MoreHorizontal, Shield, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import type { User } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { StatusBadge } from '../ui/StatusBadge';
import { Heading, Label, DataValue } from '../ui/Typography';

interface AdminDashboardProps {
  users: User[];
  onImpersonate: (user: User) => void;
  viewMode?: 'overview' | 'users';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onImpersonate, viewMode = 'overview' }) => {
  
  // Calculated Metrics
  const totalUsers = users.length;
  const activeAthletes = users.filter(u => u.role === 'athlete' && u.status === 'active').length;
  const activeCoaches = users.filter(u => u.role === 'coach' && u.status === 'active').length;
  const mrr = users.filter(u => u.subscriptionTier === 'advanced').length * 12;

  const isOverview = viewMode === 'overview';

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-border bg-background p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
             <Shield className="h-4 w-4 text-zinc-500" />
             <Label>{isOverview ? 'Platform Overview' : 'User Management'}</Label>
           </div>
           <Heading level={1}>{isOverview ? 'Admin Console' : 'Directory'}</Heading>
        </div>
        
        {/* Mock Global Search */}
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Search users or logs..." 
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                disabled
            />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 space-y-8">
            
            {/* Platform Metrics - Only visible in Overview */}
            {isOverview && (
              <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard 
                      label="Total Users" 
                      value={totalUsers} 
                      className="bg-surface/50"
                  />
                   <MetricCard 
                      label="Active Athletes" 
                      value={activeAthletes} 
                      className="bg-surface/50"
                  />
                   <MetricCard 
                      label="Active Coaches" 
                      value={activeCoaches} 
                      className="bg-surface/50"
                  />
                   <MetricCard 
                      label="Est. MRR" 
                      value={`€${mrr}`} 
                      subValue="Monthly"
                      className="bg-zinc-900/30 border-dashed"
                  />
              </section>
            )}

            {/* User Management List - Visible in Users mode OR Overview (as preview) */}
            {(viewMode === 'users' || isOverview) && (
              <section className="rounded-xl border border-border bg-surface overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border p-4">
                      <Heading level={3} className="text-zinc-300">
                        {isOverview ? 'Recent Signups' : 'All Users'}
                      </Heading>
                      <div className="flex gap-2">
                          <button className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">Filter</button>
                          <button className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">Sort</button>
                      </div>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 border-b border-border bg-zinc-900/50 px-6 py-2">
                      <Label>User</Label>
                      <Label>Role</Label>
                      <Label>Status</Label>
                      <Label>Plan</Label>
                      <Label className="text-right">Access</Label>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border">
                      {users.map((user) => (
                          <div key={user.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 items-center px-6 py-3 transition-colors hover:bg-zinc-800/30 group">
                              
                              {/* User Name & Email */}
                              <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 border border-zinc-700">
                                      {user.avatarInitials}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium text-zinc-200 truncate">{user.name}</span>
                                      <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                                  </div>
                              </div>

                              {/* Role */}
                              <div className="flex items-center gap-2">
                                  {user.role === 'admin' && <Shield className="h-3 w-3 text-zinc-500" />}
                                  {user.role === 'coach' && <UsersIcon className="h-3 w-3 text-zinc-500" />}
                                  {user.role === 'athlete' && <UserIcon className="h-3 w-3 text-zinc-500" />}
                                  <span className="text-xs capitalize text-zinc-400">{user.role}</span>
                              </div>

                              {/* Status */}
                              <div>
                                  <span className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                      user.status === 'active' ? "bg-emerald-950/30 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                  )}>
                                      {user.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                      {user.status}
                                  </span>
                              </div>

                              {/* Subscription Plan */}
                              <div>
                                  <span className={cn(
                                      "text-xs font-mono",
                                      user.subscriptionTier === 'advanced' ? "text-amber-400" : "text-zinc-500"
                                  )}>
                                      {user.subscriptionTier ? user.subscriptionTier.toUpperCase() : '-'}
                                  </span>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end gap-2">
                                  {user.role !== 'admin' ? (
                                      <button 
                                          onClick={() => onImpersonate(user)}
                                          className="group flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                                          title={`Impersonate ${user.name}`}
                                      >
                                          <Eye className="h-3 w-3 text-zinc-500 group-hover:text-white transition-colors" />
                                          <span>Impersonate</span>
                                      </button>
                                  ) : (
                                      <span className="text-[10px] text-zinc-600 italic py-1.5">Current</span>
                                  )}
                              </div>

                          </div>
                      ))}
                  </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
};
