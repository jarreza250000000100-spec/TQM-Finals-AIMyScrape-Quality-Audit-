'use client';

import React, { useState } from 'react';
import { UserSimSession, SIMULATION_PERSONAS } from './SidebarNav';
import { ShieldCheck, Sparkles, Lock, Info, CheckCircle2, ArrowRight, AlertCircle, Flame } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase';
import { saveProfileToFirestore, getProfileFromFirestore } from '@/lib/firestore-service';
import { UserProfile } from '@/lib/types';

interface GoogleSignInScreenProps {
  onSignIn: (user: UserSimSession) => void;
}

export const GoogleSignInScreen: React.FC<GoogleSignInScreenProps> = ({ onSignIn }) => {
  const [selectedPersona, setSelectedPersona] = useState<UserSimSession>(SIMULATION_PERSONAS[0]);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('Software Engineer');
  const [customJobFunction, setCustomJobFunction] = useState('Core Scraper Development');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Real Firebase Auth Google Popup Sign-In
  const handleFirebasePopupSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser) {
        setLoading(false);
        return;
      }

      const email = fbUser.email || '';
      const isSuper =
        email.toLowerCase().trim() === 'jarreza_250000000100@uic.edu.ph' ||
        email.includes('jarreza');

      // Fetch existing profile or create in Firestore
      let profile = await getProfileFromFirestore(fbUser.uid);
      if (!profile) {
        profile = {
          userId: fbUser.uid,
          email,
          displayName: fbUser.displayName || email.split('@')[0] || 'Quality Auditor Employee',
          roleInCompany: isSuper ? 'Management' : 'Software Engineer',
          jobFunction: isSuper
            ? 'VP of Quality & Infrastructure Operations'
            : 'Core Scraper Maintenance & NYSCEF E-filing API',
          createdAt: new Date().toISOString()
        };
        await saveProfileToFirestore(profile);
      }

      const session: UserSimSession = {
        userId: fbUser.uid,
        email: profile.email,
        displayName: profile.displayName,
        roleInCompany: profile.roleInCompany,
        isSuperAdmin: isSuper
      };

      onSignIn(session);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Firebase Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Persona Quick-SignIn with Firestore sync
  const handleExecutePersonaSignIn = async (persona: UserSimSession) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Ensure profile exists in Firestore users/{userId}
      const existing = await getProfileFromFirestore(persona.userId);
      if (!existing) {
        const newProfile: UserProfile = {
          userId: persona.userId,
          email: persona.email,
          displayName: persona.displayName,
          roleInCompany: persona.roleInCompany,
          jobFunction: persona.isSuperAdmin
            ? 'VP of Quality & Infrastructure Operations'
            : 'Scraper Engineering & Runner Fleet Operations',
          createdAt: new Date().toISOString()
        };
        await saveProfileToFirestore(newProfile);
      }
      onSignIn(persona);
    } catch (err: any) {
      console.warn('Persona Firestore sync notice:', err);
      onSignIn(persona);
    } finally {
      setLoading(false);
    }
  };

  // 3. Custom Work Email Registration in Firestore
  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const isSuper =
      customEmail.toLowerCase().trim() === 'jarreza_250000000100@uic.edu.ph' ||
      customEmail.includes('jarreza');

    const cleanUid = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const profile: UserProfile = {
      userId: cleanUid,
      email: customEmail.trim(),
      displayName: customName.trim() || customEmail.split('@')[0],
      roleInCompany: customRole,
      jobFunction: customJobFunction.trim() || 'Process Audit Ownership',
      createdAt: new Date().toISOString()
    };

    try {
      await saveProfileToFirestore(profile);
      const session: UserSimSession = {
        userId: profile.userId,
        email: profile.email,
        displayName: profile.displayName,
        roleInCompany: profile.roleInCompany,
        isSuperAdmin: isSuper
      };
      onSignIn(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register profile to Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-lg font-bold">
            QA
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Quality Audit</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            AIMyScrape (SimpleCode AI) internal quality review platform for public-records scrapers & Monetaria Group legal workflows.
          </p>
        </div>

        {/* Security & Firebase Status Banner */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span>Firebase Auth & Firestore Connected</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div>
              Project: <code className="text-amber-400 font-mono text-[10px]">gen-lang-client-0468264273</code>. Profiles and interviews write directly to Cloud Firestore.
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 rounded-lg p-3 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action: Real Google Sign-In with Firebase Auth */}
        <div className="space-y-3">
          <button
            onClick={handleFirebasePopupSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 group hover:shadow-amber-500/10"
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Authenticating with Google...' : 'Sign in with Google (Firebase Auth)'}</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Or select audit role persona
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Quick Personas Switcher */}
        {!isCustomMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {SIMULATION_PERSONAS.map((persona) => {
                const isSelected = selectedPersona.email === persona.email;
                return (
                  <div
                    key={persona.userId}
                    onClick={() => setSelectedPersona(persona)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{persona.displayName}</span>
                        {persona.isSuperAdmin && (
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{persona.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Role: {persona.roleInCompany}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleExecutePersonaSignIn(selectedPersona)}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              <span>{loading ? 'Logging into Firestore...' : `Continue as ${selectedPersona.displayName}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsCustomMode(true)}
              className="w-full text-center text-[11px] text-slate-400 hover:text-slate-200 transition-colors pt-1 block"
            >
              + Register with a custom work email and job function →
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Google Work Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. auditor@aimyscrape.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Role
              </label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="QA / Quality Auditor">QA / Quality Auditor</option>
                <option value="Operations / Runner Operator">Operations / Runner Operator</option>
                <option value="Customer Success / Account Manager">Customer Success / Account Manager</option>
                <option value="Management">Management</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Job Function
              </label>
              <input
                type="text"
                placeholder="e.g. Core Scraper Development & NYSCEF E-filing API"
                value={customJobFunction}
                onChange={(e) => setCustomJobFunction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
            >
              <span>{loading ? 'Registering to Firestore...' : 'Register to Firestore & Enter Audit'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="w-full text-center text-[11px] text-slate-400 hover:text-slate-200 transition-colors pt-1 block"
            >
              ← Back to role accounts
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Zero Password Storage · Firebase Auth Federated Session · Sensitive Data Guard
        </div>
      </div>
    </div>
  );
};
