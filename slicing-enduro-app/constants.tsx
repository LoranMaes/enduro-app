
import React from 'react';
import { Activity, Droplets, Bike, Footprints, Dumbbell, Calendar, LayoutDashboard, Settings, User, BookOpen, Users, Shield } from 'lucide-react';
import { SportType, UserRole } from './types';

export const SPORT_ICONS: Record<string, React.ReactNode> = {
  swim: <Droplets className="w-3 h-3" />,
  bike: <Bike className="w-3 h-3" />,
  run: <Footprints className="w-3 h-3" />,
  gym: <Dumbbell className="w-3 h-3" />,
  rest: <Activity className="w-3 h-3 text-zinc-600" />,
  triathlon: <Activity className="w-3 h-3" />, // Composite
};

export const SPORT_COLORS: Record<string, string> = {
  swim: 'text-sky-400',
  bike: 'text-violet-400',
  run: 'text-rose-400',
  gym: 'text-amber-400',
  rest: 'text-zinc-500',
  triathlon: 'text-zinc-100', // White/Neutral for composite
};

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  viewType: string;
}

export const NAV_ITEMS_ATHLETE: NavItem[] = [
  { icon: <Calendar className="w-5 h-5" />, label: 'Calendar', viewType: 'calendar' },
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Analysis', viewType: 'progress' }, // Mapping 'Analysis' label to progress view for now
  { icon: <BookOpen className="w-5 h-5" />, label: 'Plans', viewType: 'plans' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', viewType: 'settings' },
];

export const NAV_ITEMS_COACH: NavItem[] = [
  { icon: <Users className="w-5 h-5" />, label: 'Athletes', viewType: 'athletes' },
  { icon: <BookOpen className="w-5 h-5" />, label: 'Plans', viewType: 'plans' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', viewType: 'settings' },
];

export const NAV_ITEMS_ADMIN: NavItem[] = [
  { icon: <Shield className="w-5 h-5" />, label: 'Admin', viewType: 'admin-overview' },
  { icon: <Users className="w-5 h-5" />, label: 'Users', viewType: 'admin-users' },
];

export const getNavItemsForRole = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'admin': return NAV_ITEMS_ADMIN;
    case 'coach': return NAV_ITEMS_COACH;
    case 'athlete': return NAV_ITEMS_ATHLETE;
    default: return NAV_ITEMS_ATHLETE;
  }
};
