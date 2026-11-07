'use client';

import React from 'react';
import { X, ShieldCheck, AlertTriangle, Lock, Eye, RefreshCw, Key, ShieldAlert } from 'lucide-react';
import { QUALITY_AUDIT_THREAT_TABLE } from '@/lib/threat-model';

interface ThreatModelModalProps {
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quality Audit Agentic Threat Model & OWASP Security Architecture
              </h2>
              <span className="text-xs text-slate-400">
                Threat Zone Analysis for AIMyScrape (SimpleCode AI) & Monetaria Group Audit System
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 5 Threat Zones Architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-xs font-bold text-cyan-300 block">1. Input Surfaces</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chat prompts (4k char cap), profile fields, company basis uploads (5MB max, .txt/.md/.pdf/.csv allowlist).
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-xs font-bold text-amber-300 block">2. Planning & Reasoning</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Indirect prompt injection defense. Uploaded SOPs and chat history treated strictly as plain delimited data.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-xs font-bold text-rose-300 block">3. Tool Execution</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Server-side Super Admin verification, prevention of privilege escalation, and zero client-side claims.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-xs font-bold text-purple-300 block">4. Memory & State</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Owner-bound path isolation (&apos;users/&#123;uid&#125;&apos;), create-only immutability on interview records.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-xs font-bold text-emerald-300 block">5. Inter-System</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Formula injection defense (`=+-@` escaping), Secret Manager credential storage, and Gemini fallback ladder.
              </p>
            </div>
          </div>

          {/* Threat Summary Table (Mandatory Execution Criteria) */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Threat Summary Table (Threat · Zone · Component · Countermeasure)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">OWASP Web & LLM Mitigations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Threat Scenario</th>
                    <th className="py-2.5 px-4 font-semibold">Threat Zone</th>
                    <th className="py-2.5 px-4 font-semibold">Affected Component</th>
                    <th className="py-2.5 px-4 font-semibold">Countermeasure & Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {QUALITY_AUDIT_THREAT_TABLE.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-medium text-slate-200 min-w-[200px]">
                        {row.threat}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-cyan-300">{row.zone}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {row.affectedComponent}
                      </td>
                      <td className="py-3 px-4 text-slate-300 min-w-[260px] leading-relaxed">
                        {row.countermeasure}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Zero Insecure Defaults: No client-side Super Admin decisions, credentials blocked at ingress.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            Close Threat Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
