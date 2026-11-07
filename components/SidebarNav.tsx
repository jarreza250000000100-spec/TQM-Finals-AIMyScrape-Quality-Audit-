'use client';

import React from 'react';
import {
  MessageSquare,
  FileText,
  BarChart3,
  ShieldCheck,
  ListChecks,
  UserCheck,
  LogOut,
  RefreshCw,
  Building2,
  Lock,
  Sparkles,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export interface UserSimSession {
  userId: string;
  email: string;
  displayName: string;
  roleInCompany: string;
  isSuperAdmin: boolean;
}

export const SIMULATION_PERSONAS: UserSimSession[] = [
  {
    userId: 'usr_super_admin',
    email: 'jarreza_250000000100@uic.edu.ph',
    displayName: 'Elena Vance (Super Admin)',
    roleInCompany: 'Management',
    isSuperAdmin: true
  },
  {
    userId: 'usr_eng_danilo',
    email: 'danilo@aimyscrape.com',
    displayName: 'Danilo Reyes',
    roleInCompany: 'Software Engineer',
    isSuperAdmin: false
  },
  {
    userId: 'usr_qa_maya',
    email: 'maya@aimyscrape.com',
    displayName: 'Maya Lin',
    roleInCompany: 'QA / Quality Auditor',
    isSuperAdmin: false
  },
  {
    userId: 'usr_ops_leo',
    email: 'leo@aimyscrape.com',
    displayName: 'Leo Martinez',
    roleInCompany: 'Operations / Runner Operator',
    isSuperAdmin: false
  }
];

interface SidebarNavProps {
  currentPersona: UserSimSession;
  onPersonaChange: (persona: UserSimSession) => void;
  activeView: 'interview' | 'history' | 'admin' | 'profile';
  onViewChange: (view: 'interview' | 'history' | 'admin' | 'profile') => void;
  onOpenThreatModel: () => void;
  onOpenTestRunner: () => void;
  onResetSeed: () => void;
  onSignOut: () => void;
  onStartNewSession?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentPersona,
  onPersonaChange,
  activeView,
  onViewChange,
  onOpenThreatModel,
  onOpenTestRunner,
  onResetSeed,
  onSignOut,
  onStartNewSession
}) => {
  const navItems: Array<{
    id: 'interview' | 'history' | 'admin';
    label: string;
    icon: any;
    description: string;
    badge?: string;
  }> = [
    {
      id: 'interview',
      label: 'Audit Interview',
      icon: MessageSquare,
      description: 'Multi-turn Gemini interview'
    },
    {
      id: 'history',
      label: 'My Sessions & Summaries',
      icon: FileText,
      description: 'Private past audit logs'
    },
    {
      id: 'admin',
      label: 'Super Admin Dashboard',
      icon: BarChart3,
      badge: currentPersona.isSuperAdmin ? 'Admin' : 'Restricted',
      description: 'Benchmark docs & reports'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Top Brand Section */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm tracking-wider shrink-0">
            QA
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate">
              Quality Audit
            </h1>
            <span className="text-[11px] text-slate-400 block truncate">
              AIMyScrape (SimpleCode AI)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Audited Client:</span>
          <span className="text-amber-400/90 font-medium">Monetaria Group</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="p-4 space-y-6 flex-1">
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Audit Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : item.badge === 'Admin'
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => {
              onViewChange('interview');
              if (onStartNewSession) onStartNewSession();
            }}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>+ New Session</span>
          </button>
        </div>

        {/* Security & Verification Section */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Security & Compliance
          </div>

          <button
            onClick={onOpenThreatModel}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Threat Model (5 Zones)</span>
          </button>

          <button
            onClick={onOpenTestRunner}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
          >
            <ListChecks className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">20 Test Cases Suite</span>
          </button>

          <button
            onClick={() => onViewChange('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeView === 'profile'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Edit Employee Profile</span>
          </button>
        </div>

        {/* Firebase Live Cloud Status Card */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firebase Cloud DB</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Connected
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            gen-lang-client-0468264273
          </div>
          <a
            href="https://console.firebase.google.com/project/gen-lang-client-0468264273/firestore/databases/ai-studio-qualityauditaimy-a803ac91-64da-4311-b5be-87c99ade1b10/data"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Firestore Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Persona Quick Switcher (For Evaluation & Testing) */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Switch Test Persona:
          </span>
          <select
            value={currentPersona.userId}
            onChange={(e) => {
              const found = SIMULATION_PERSONAS.find((p) => p.userId === e.target.value);
              if (found) onPersonaChange(found);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            {SIMULATION_PERSONAS.map((p) => (
              <option key={p.userId} value={p.userId} className="bg-slate-900 text-slate-100">
                {p.displayName} {p.isSuperAdmin ? '[Admin]' : `[${p.roleInCompany}]`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom User Card with Sign Out Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
            {currentPersona.displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {currentPersona.displayName}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">
              {currentPersona.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-slate-300 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
            title="Sign out of current Google session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {/* Quick Reseed */}
          <button
            onClick={onResetSeed}
            title="Reset Store to Initial Seed State"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
