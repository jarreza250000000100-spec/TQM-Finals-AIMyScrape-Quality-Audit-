'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav, UserSimSession, SIMULATION_PERSONAS } from '@/components/SidebarNav';
import { GoogleSignInScreen } from '@/components/GoogleSignInScreen';
import { AuditInterviewChat } from '@/components/AuditInterviewChat';
import { UserHistoryView } from '@/components/UserHistoryView';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ThreatModelModal } from '@/components/ThreatModelModal';
import { TestRunnerModal } from '@/components/TestRunnerModal';
import { NewSessionModal } from '@/components/NewSessionModal';
import { AuditSummary } from '@/lib/types';
import { ShieldCheck, Info, Sparkles, Building2, LogOut, User, Menu } from 'lucide-react';

import {
  testFirestoreConnection,
  seedInitialDataToFirestore,
  getProfileFromFirestore,
  saveProfileToFirestore,
  saveSessionToFirestore
} from '@/lib/firestore-service';
import { auth, signOutUser } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AUTH_STORAGE_KEY = 'quality_audit_auth_session';

export default function QualityAuditHome() {
  const [currentUser, setCurrentUser] = useState<UserSimSession | null>(() => {
    if (typeof window === 'undefined') return SIMULATION_PERSONAS[0];
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return SIMULATION_PERSONAS[0];
  });

  // Test Firestore connection & auto-populate collections on Google authentication
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const email = fbUser.email || '';
          const isSuper =
            email.toLowerCase().trim() === 'jarreza_250000000100@uic.edu.ph' ||
            email.includes('jarreza');

          let profile = await getProfileFromFirestore(fbUser.uid);
          if (!profile) {
            profile = {
              userId: fbUser.uid,
              email,
              displayName: fbUser.displayName || email.split('@')[0] || 'Elena Vance (Super Admin)',
              roleInCompany: isSuper ? 'Management' : 'Software Engineer',
              jobFunction: isSuper
                ? 'VP of Quality & Infrastructure Operations'
                : 'Core Scraper Maintenance & NYSCEF E-filing API',
              createdAt: new Date().toISOString()
            };
            await saveProfileToFirestore(profile);
          }

          // Auto-seed company basis benchmarks to Firestore
          await seedInitialDataToFirestore();

          // Auto-seed starter session to Firestore
          await saveSessionToFirestore({
            sessionId: 'sess-active-session',
            userId: fbUser.uid,
            topic: 'AIMyScrape Core Process & False-Zero Audit (SOP-08)',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            interactionCount: 0,
            firstPrompt: 'AIMyScrape Core Process & False-Zero Audit (SOP-08)'
          });

          setCurrentUser({
            userId: fbUser.uid,
            email,
            displayName: profile.displayName,
            roleInCompany: profile.roleInCompany,
            isSuperAdmin: isSuper
          });
        } catch (e) {
          console.error('Error initializing Firestore collections on auth change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const [activeView, setActiveView] = useState<'interview' | 'history' | 'admin' | 'profile'>('interview');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('sess-active-session');

  // Modals
  const [showThreatModel, setShowThreatModel] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [, setLatestSummary] = useState<AuditSummary | null>(null);

  const handleSignIn = (user: UserSimSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSeed = async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Unauthenticated State (Test Case 1 & Sign In Screen)
  if (!currentUser) {
    return <GoogleSignInScreen onSignIn={handleSignIn} />;
  }

  // 2. Authenticated State with Side Navigation Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Side Navigation (260px Fixed Sidebar) */}
      <SidebarNav
        currentPersona={currentUser}
        onPersonaChange={(persona) => {
          handleSignIn(persona);
          setLatestSummary(null);
        }}
        activeView={activeView}
        onViewChange={(view) => {
          if (view === 'profile') {
            setShowProfileModal(true);
          } else {
            setActiveView(view);
          }
        }}
        onOpenThreatModel={() => setShowThreatModel(true)}
        onOpenTestRunner={() => setShowTestRunner(true)}
        onResetSeed={handleResetSeed}
        onSignOut={handleSignOut}
        onStartNewSession={() => setShowNewSessionModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Contextual Top Header Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Quality Audit</span>
                <span>/</span>
                <span className="text-slate-200 capitalize">{activeView}</span>
              </div>
              <h2 className="text-sm font-bold text-white capitalize mt-0.5">
                {activeView === 'interview' && 'Live Quality Audit Interview'}
                {activeView === 'history' && 'Employee Audit History & Summaries'}
                {activeView === 'admin' && 'Super Admin Executive Dashboard'}
                {activeView === 'profile' && 'Employee Profile & Responsibilities'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User session status badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">{currentUser.displayName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400/90 text-[11px] font-mono">
                {currentUser.isSuperAdmin ? 'Super Admin' : currentUser.roleInCompany}
              </span>
            </div>

            {/* Prominent Header Sign Out */}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-6">
          {activeView === 'interview' && (
            <AuditInterviewChat
              currentPersona={currentUser}
              selectedSessionId={selectedSessionId}
              onSessionSelect={(sessId) => setSelectedSessionId(sessId)}
              onSummaryGenerated={(summary) => {
                setLatestSummary(summary);
                setActiveView('history');
              }}
            />
          )}

          {activeView === 'history' && (
            <UserHistoryView
              currentPersona={currentUser}
              onOpenInterview={(sessId) => {
                if (sessId) setSelectedSessionId(sessId);
                setActiveView('interview');
              }}
              onStartNewSession={() => setShowNewSessionModal(true)}
            />
          )}

          {activeView === 'admin' && (
            <SuperAdminDashboard
              currentPersona={currentUser}
              onOpenTestRunner={() => setShowTestRunner(true)}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 px-8 py-3 text-center text-[11px] text-slate-500">
          Quality Audit · AIMyScrape (SimpleCode AI) Public-Records Scraping & Monetaria Collections System
        </footer>
      </div>

      {/* Modals */}
      {showThreatModel && (
        <ThreatModelModal onClose={() => setShowThreatModel(false)} />
      )}

      {showTestRunner && (
        <TestRunnerModal
          onClose={() => setShowTestRunner(false)}
          onRefreshData={() => {}}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          currentPersona={currentUser}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={() => {}}
        />
      )}

      {showNewSessionModal && (
        <NewSessionModal
          isOpen={showNewSessionModal}
          onClose={() => setShowNewSessionModal(false)}
          currentPersona={currentUser}
          onSessionCreated={(newSessId) => {
            setSelectedSessionId(newSessId);
            setActiveView('interview');
          }}
        />
      )}
    </div>
  );
}
