'use client';

import React, { useState } from 'react';
import { UserSimSession } from './SidebarNav';
import { X, PlusCircle, Sparkles, AlertCircle, Layers, Check } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: UserSimSession;
  onSessionCreated: (sessionId: string, topic: string, initialAuditorMessage?: string) => void;
}

interface ProcessPreset {
  id: string;
  title: string;
  tag: string;
  description: string;
  auditorOpeningPrompt: string;
}

const PROCESS_PRESETS: ProcessPreset[] = [
  {
    id: 'scrapers',
    title: 'Scraper Maintenance & False-Zero Prevention (SOP-08)',
    tag: 'Scraper Development',
    description: 'Delaware & Texas SOS silent layout shifts, DOM changes, and catching false zeros before Monetaria sees empty results.',
    auditorOpeningPrompt:
      'Hello. Thank you for opening this audit session on Scraper Maintenance & False-Zero Prevention (SOP-08). When a Secretary of State registry rolls out an undocumented portal update, walk me through how your team detects it and what safeguards keep empty results from being misreported as no debtor records.'
  },
  {
    id: 'nyscef',
    title: 'NYSCEF Court E-Filing & Non-Reversible Fee Staging',
    tag: 'Court Filings',
    description: 'NYSCEF commercial collection filings, court fee card charges that cannot be undone, docket idempotency.',
    auditorOpeningPrompt:
      'Welcome to this audit session on NYSCEF Court E-Filing Operations. Because court docket submissions and debit fee commitments are irreversible once transmitted, could you detail your pre-flight validation workflow and where accidental submissions or staging gaps occur?'
  },
  {
    id: 'runners',
    title: 'Residential Runner Fleet & Captcha Solver Uptime',
    tag: 'Infrastructure',
    description: 'Local residential runner IP rotation, Cloudflare blocks, 99.4% uptime SLA, and captcha solver timeouts.',
    auditorOpeningPrompt:
      'Welcome to this infrastructure audit on our Residential Runner Fleet. Maintaining our 99.4% SLA against aggressive registry bot blocks is critical for Monetaria. How are runner health checks monitored, and what happens when an entire IP pool gets burned mid-campaign?'
  },
  {
    id: 'campaigns',
    title: 'Monetaria Bulk Debtor Campaigns & Queue Pacing',
    tag: 'Bulk Operations',
    description: 'Processing weekly batches of 2,500+ commercial debtors, 12 queries/sec rate limits, SCRA defense, and PACER bankruptcy flags.',
    auditorOpeningPrompt:
      'Welcome to the audit session on Monetaria Bulk Debtor Campaigns. Handling 2,500+ commercial debtor accounts while respecting strict 12 queries/second rate limits requires careful queue pacing. Where in this batch pipeline do bottlenecks or race conditions arise?'
  },
  {
    id: 'support',
    title: 'Customer Support & Monetaria SLA Escalation',
    tag: 'Support & Success',
    description: 'Handling high-priority Monetaria discrepancy tickets, emergency incident alerts, and inter-team resolution times.',
    auditorOpeningPrompt:
      'Welcome to this audit session on Customer Support and Incident Escalation. When Monetaria flags a critical missing record or an urgent debt collection deadline, how smoothly does communication move between support, engineering, and operations?'
  }
];

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSessionCreated
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('scrapers');
  const [customTopic, setCustomTopic] = useState('');
  const [startWithAuditorGreeting, setStartWithAuditorGreeting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedPreset = PROCESS_PRESETS.find((p) => p.id === selectedPresetId);
      const chosenTopic = selectedPresetId === 'custom'
        ? (customTopic.trim() || 'Custom Process Audit')
        : (selectedPreset?.title || 'General Quality Audit');

      const res = await fetch('/api/interview/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email,
          'x-user-id': currentPersona.userId,
          'x-user-name': currentPersona.displayName
        },
        body: JSON.stringify({ topic: chosenTopic })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create new session.');
      }

      const initialAuditorMsg = startWithAuditorGreeting && selectedPreset
        ? selectedPreset.auditorOpeningPrompt
        : undefined;

      onSessionCreated(data.sessionId, chosenTopic, initialAuditorMsg);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating audit session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Start New Audit Session
              </h3>
              <p className="text-xs text-slate-400">
                Initiate a fresh, isolated interview thread for {currentPersona.displayName}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-rose-950/80 border border-rose-800 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Audit Process Focus:
            </label>
            <div className="space-y-2.5">
              {PROCESS_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-white">{preset.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 ml-6 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                );
              })}

              {/* Custom Topic Option */}
              <div
                onClick={() => setSelectedPresetId('custom')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedPresetId === 'custom'
                    ? 'bg-amber-500/10 border-amber-400/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPresetId === 'custom'
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-600'
                    }`}
                  >
                    {selectedPresetId === 'custom' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-white">Custom Audit Process</span>
                </div>
                {selectedPresetId === 'custom' && (
                  <div className="mt-2.5 ml-6">
                    <input
                      type="text"
                      placeholder="e.g. Release testing, code reviews, SCRA defense certificates..."
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={startWithAuditorGreeting}
                onChange={(e) => setStartWithAuditorGreeting(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>
                Have Gemini auditor automatically introduce the session with a focused opening question
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Starting Session...' : 'Start New Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
