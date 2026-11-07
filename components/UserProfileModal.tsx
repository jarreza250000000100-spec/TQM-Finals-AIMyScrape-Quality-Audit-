'use client';

import React, { useState, useEffect } from 'react';
import { UserSimSession } from './SidebarNav';
import { CompanyRole } from '@/lib/types';
import { X, UserCheck, ShieldCheck } from 'lucide-react';

interface UserProfileModalProps {
  currentPersona: UserSimSession;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const COMPANY_ROLES: CompanyRole[] = [
  'Software Engineer',
  'QA / Quality Auditor',
  'Operations / Runner Operator',
  'Customer Success / Account Manager',
  'Management',
  'Other'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentPersona,
  onClose,
  onProfileUpdated
}) => {
  const [displayName, setDisplayName] = useState(currentPersona.displayName);
  const [roleInCompany, setRoleInCompany] = useState<string>(currentPersona.roleInCompany);
  const [jobFunction, setJobFunction] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile', {
          headers: {
            'x-user-email': currentPersona.email,
            'x-user-id': currentPersona.userId,
            'x-user-name': currentPersona.displayName
          }
        });
        const data = await res.json();
        if (!ignore && data.success && data.profile) {
          setDisplayName(data.profile.displayName || currentPersona.displayName);
          setRoleInCompany(data.profile.roleInCompany || currentPersona.roleInCompany);
          setJobFunction(data.profile.jobFunction || '');
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [currentPersona.email, currentPersona.userId, currentPersona.displayName, currentPersona.roleInCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);

    // Validation caps (Directive 2)
    if (!displayName.trim() || displayName.length > 100) {
      setErrorMessage('Display Name is required (Max 100 characters).');
      setLoading(false);
      return;
    }
    if (!jobFunction.trim() || jobFunction.length > 300) {
      setErrorMessage('Job Function is required (Max 300 characters).');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email,
          'x-user-id': currentPersona.userId
        },
        body: JSON.stringify({
          displayName,
          roleInCompany,
          jobFunction
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to save profile.');
      } else {
        setMessage('Profile successfully saved.');
        onProfileUpdated();
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Employee Audit Profile
              </h2>
              <span className="text-xs text-slate-400">
                Gounds Gemini&apos;s quality audit questions to your specific responsibilities
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 p-3 text-xs text-rose-200">
            {errorMessage}
          </div>
        )}
        {message && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 p-3 text-xs text-emerald-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Google Account Email
            </label>
            <input
              type="text"
              disabled
              value={currentPersona.email}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-400 cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Role in Company *
            </label>
            <select
              value={roleInCompany}
              onChange={(e) => setRoleInCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {COMPANY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Job Function Description * (Max 300 chars)
            </label>
            <textarea
              rows={3}
              value={jobFunction}
              onChange={(e) => setJobFunction(e.target.value)}
              maxLength={300}
              placeholder="e.g. Scraper maintenance for 50-state SOS registries and NYSCEF court filing operations..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-500 block text-right mt-0.5">
              {jobFunction.length}/300 characters
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
