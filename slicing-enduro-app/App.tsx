
import { LogOut, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SessionAnalysisView } from './components/analysis/SessionAnalysisView';
import { WeekOverview } from './components/analysis/WeekOverview';
import { AthletesListView } from './components/athletes/AthletesListView';
import { TrainingCalendar } from './components/calendar/TrainingCalendar';
import { LandingPage } from './components/marketing/LandingPage';
import { PlansListView } from './components/plans/PlansListView';
import { ProgressView } from './components/progress/ProgressView';
import { SettingsView } from './components/settings/SettingsView';
import { ImpersonationBanner } from './components/ui/ImpersonationBanner';
import { getNavItemsForRole, NAV_ITEMS_ATHLETE } from './constants';
import { cn } from './lib/utils';
import type { Session, WeekData, User } from './types';

// Mock Users Database
const MOCK_USERS: User[] = [
  { id: 'admin-1', name: 'System Admin', email: 'admin@endure.so', role: 'admin', status: 'active', avatarInitials: 'SA' },
  { id: 'coach-1', name: 'Head Coach', email: 'coach@endure.so', role: 'coach', status: 'active', avatarInitials: 'HC', subscriptionTier: 'advanced' },
  { id: 'athlete-1', name: 'J. Doe', email: 'athlete@example.com', role: 'athlete', status: 'active', avatarInitials: 'JD', subscriptionTier: 'advanced' },
  { id: 'athlete-2', name: 'A. Smith', email: 'alex@example.com', role: 'athlete', status: 'active', avatarInitials: 'AS', subscriptionTier: 'core' },
  { id: 'athlete-3', name: 'M. Jones', email: 'mj@example.com', role: 'athlete', status: 'disabled', avatarInitials: 'MJ', subscriptionTier: 'free' },
];

type ViewState = 
  | { type: 'landing' }
  | { type: 'calendar' }
  | { type: 'analysis'; session: Session }
  | { type: 'week'; week: WeekData }
  | { type: 'progress' }
  | { type: 'plans' }
  | { type: 'athletes' }
  | { type: 'settings' }
  | { type: 'admin-overview' }
  | { type: 'admin-users' };

const App: React.FC = () => {
  // Authentication State
  // Defaulting to Admin for this prototype to showcase features
  const [realUser, setRealUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  // Derived effective user
  const currentUser = impersonatedUser || realUser;
  const isImpersonating = !!impersonatedUser;

  // View State
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'landing' });

  // Reset view when switching users to avoid invalid states (e.g. Admin on Calendar)
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setCurrentView({ type: 'admin-overview' });
      } else if (currentUser.role === 'coach') {
        setCurrentView({ type: 'athletes' });
      } else {
        setCurrentView({ type: 'calendar' });
      }
    }
  }, [currentUser?.id]); // Only run when the user ID changes

  const handleLogin = () => {
    // For prototype, log in as the first Admin user
    setRealUser(MOCK_USERS[0]);
  };

  const handleLogout = () => {
    setRealUser(null);
    setImpersonatedUser(null);
    setCurrentView({ type: 'landing' });
  };

  const handleImpersonate = (user: User) => {
    setImpersonatedUser(user);
  };

  const handleExitImpersonation = () => {
    setImpersonatedUser(null);
  };

  // Sidebar Component with Role-Based Navigation
  const Sidebar = () => {
    if (!currentUser) return null;

    const navItems = getNavItemsForRole(currentUser.role);
    const roleLabel = currentUser.role.charAt(0).toUpperCase();
    
    // Visual tweak for sidebar when impersonating
    const sidebarBg = isImpersonating ? 'bg-amber-950/20 border-amber-900/30' : 'bg-surface border-border';
    
    // Role Badge Color
    let roleColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    if (currentUser.role === 'admin' && !isImpersonating) roleColor = 'bg-amber-900/50 text-amber-500 border-amber-800';
    if (isImpersonating) roleColor = 'bg-amber-900/80 text-amber-100 border-amber-700';

    return (
      <aside className={cn("flex w-16 flex-col items-center border-r py-6 z-20 transition-colors", sidebarBg)}>
        <div 
          className="mb-8 font-mono text-xl font-bold tracking-tighter text-white cursor-pointer hover:text-zinc-300 transition-colors"
          onClick={() => {
            // Reset to default view for role
            if (currentUser.role === 'admin') setCurrentView({ type: 'admin-overview' });
            else if (currentUser.role === 'coach') setCurrentView({ type: 'athletes' });
            else setCurrentView({ type: 'calendar' });
          }}
        >
          E.
        </div>
        
        <nav className="flex flex-1 flex-col gap-6">
          {navItems.map((item) => {
            // Determine active state
            let isActive = false;
            
            // Standard User Views
            if (item.viewType === 'calendar' && ['calendar', 'week', 'analysis'].includes(currentView.type)) isActive = true;
            if (item.viewType === 'progress' && currentView.type === 'progress') isActive = true;
            if (item.viewType === 'plans' && currentView.type === 'plans') isActive = true;
            if (item.viewType === 'athletes' && currentView.type === 'athletes') isActive = true;
            if (item.viewType === 'settings' && currentView.type === 'settings') isActive = true;
            
            // Admin Views - Strict Matching
            if (item.viewType === 'admin-overview' && currentView.type === 'admin-overview') isActive = true;
            if (item.viewType === 'admin-users' && currentView.type === 'admin-users') isActive = true;

            return (
              <button
                key={item.label}
                onClick={() => {
                  // Type-safe transition (simplified for demo)
                  if (item.viewType === 'calendar') setCurrentView({ type: 'calendar' });
                  if (item.viewType === 'progress') setCurrentView({ type: 'progress' });
                  if (item.viewType === 'plans') setCurrentView({ type: 'plans' });
                  if (item.viewType === 'athletes') setCurrentView({ type: 'athletes' });
                  if (item.viewType === 'settings') setCurrentView({ type: 'settings' });
                  if (item.viewType === 'admin-overview') setCurrentView({ type: 'admin-overview' });
                  if (item.viewType === 'admin-users') setCurrentView({ type: 'admin-users' });
                }}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                  isActive
                    ? (isImpersonating ? "bg-amber-900/40 text-amber-100" : "bg-zinc-800 text-white") 
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                )}
                title={item.label}
              >
                {item.icon}
                {isActive && (
                  <span className={cn("absolute -right-1 top-1 h-2 w-2 rounded-full", isImpersonating ? "bg-amber-500" : "bg-accent")} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Indicator */}
        <div className="mt-auto mb-4 flex flex-col items-center gap-2">
             <div 
               className={cn("flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold border cursor-help", roleColor)} 
               title={`Current Role: ${currentUser.role}`}
             >
                {isImpersonating ? <Eye className="w-3 h-3" /> : roleLabel}
             </div>
             
             {!isImpersonating && (
               <button 
                className="text-zinc-600 hover:text-zinc-400"
                onClick={handleLogout}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
             )}
        </div>
      </aside>
    );
  };

  // 1. Landing Page
  if (!realUser && currentView.type === 'landing') {
    return (
      <LandingPage onEnterApp={handleLogin} />
    );
  }

  // 2. Main App Layout
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-zinc-100 font-sans">
      <Sidebar />
      <main className={cn(
        "flex-1 flex flex-col min-w-0 relative transition-all duration-300",
        // Global visual context shift when impersonating
        isImpersonating && "border-4 border-amber-900/30 m-2 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.05)]"
      )}>
        
        {/* Conditional Top Bar for Athlete Calendar View */}
        {currentView.type === 'calendar' && (
           <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6 shrink-0">
             <div>
               <h1 className="text-sm font-semibold text-white">Training Calendar</h1>
               <p className="text-xs text-zinc-500">Season 2024 • Build Phase 1</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-zinc-400">Garmin Sync Active</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium border border-zinc-700">
                  {currentUser?.avatarInitials}
                </div>
             </div>
          </header>
        )}

        <div className={cn(
          "flex-1 overflow-hidden relative",
          isImpersonating && "pb-12" // Make space for the banner
        )}>
          
          {/* Admin Views */}
          {(currentView.type === 'admin-overview' || currentView.type === 'admin-users') && (
            <AdminDashboard 
              users={MOCK_USERS} 
              onImpersonate={handleImpersonate}
              viewMode={currentView.type === 'admin-overview' ? 'overview' : 'users'}
            />
          )}

          {/* Athlete/Coach Views */}
          {currentView.type === 'calendar' && (
            <TrainingCalendar 
              onNavigateToAnalysis={(session) => setCurrentView({ type: 'analysis', session })}
              onNavigateToWeek={(week) => setCurrentView({ type: 'week', week })}
            />
          )}
          
          {currentView.type === 'analysis' && (
            <SessionAnalysisView 
              session={currentView.session} 
              onBack={() => setCurrentView({ type: 'calendar' })}
            />
          )}

          {currentView.type === 'week' && (
            <WeekOverview 
              week={currentView.week}
              onBack={() => setCurrentView({ type: 'calendar' })}
            />
          )}

          {currentView.type === 'progress' && (
            <ProgressView 
              onNavigateToWeek={(week) => setCurrentView({ type: 'week', week })}
            />
          )}

          {currentView.type === 'plans' && (
            <PlansListView userRole={currentUser!.role} />
          )}

          {currentView.type === 'athletes' && (
            <AthletesListView />
          )}

          {currentView.type === 'settings' && (
            <SettingsView userRole={currentUser!.role} />
          )}
        </div>

        {/* Persistent Banner if Impersonating */}
        {isImpersonating && impersonatedUser && (
          <ImpersonationBanner user={impersonatedUser} onExit={handleExitImpersonation} />
        )}

      </main>
    </div>
  );
};

export default App;
