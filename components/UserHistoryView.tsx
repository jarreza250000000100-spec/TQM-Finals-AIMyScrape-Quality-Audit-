'use client';

import React, { useState, useEffect } from 'react';
import { UserSimSession } from './SidebarNav';
import { Interaction, AuditSummary } from '@/lib/types';
import {
  History,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SessionMeta {
  sessionId: string;
  interactionCount: number;
  lastActivity: string;
  firstPrompt: string;
  summary?: AuditSummary;
}

interface UserHistoryViewProps {
  currentPersona: UserSimSession;
  onOpenInterview: (sessionId?: string) => void;
  onStartNewSession?: () => void;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  currentPersona,
  onOpenInterview,
  onStartNewSession
}) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [summaries, setSummaries] = useState<AuditSummary[]>([]);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/interview/history?userId=${currentPersona.userId}`, {
          headers: {
            'x-user-email': currentPersona.email,
            'x-user-id': currentPersona.userId,
            'x-user-name': currentPersona.displayName
          }
        });
        const data = await res.json();
        if (!ignore && data.success) {
          setInteractions(data.interactions || []);
          setSummaries(data.summaries || []);
          if (Array.isArray(data.sessions)) {
            setSessions(data.sessions);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [currentPersona.userId, currentPersona.email, currentPersona.displayName]);

  const filteredInteractions = selectedSessionFilter === 'all'
    ? interactions
    : interactions.filter((i) => i.sessionId === selectedSessionFilter);

  const filteredSummaries = selectedSessionFilter === 'all'
    ? summaries
    : summaries.filter((s) => s.sessionId === selectedSessionFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>My Audit Sessions & Completed Summaries</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Owner-bound private audit logs for {currentPersona.displayName} ({currentPersona.roleInCompany}).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onStartNewSession ? onStartNewSession() : onOpenInterview()}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Start New Session</span>
          </button>
        </div>
      </div>

      {/* Session Filter Pills */}
      {sessions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">Filter Session:</span>
          </div>
          <button
            onClick={() => setSelectedSessionFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
              selectedSessionFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          {sessions.map((sess) => {
            const isSelected = selectedSessionFilter === sess.sessionId;
            return (
              <button
                key={sess.sessionId}
                onClick={() => setSelectedSessionFilter(sess.sessionId)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{sess.sessionId}</span>
                <span className="opacity-75">({sess.interactionCount})</span>
                {sess.summary && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading your audit records...</div>
      ) : (
        <div className="space-y-6">
          {/* Active / Picked Session Banner if filtered */}
          {selectedSessionFilter !== 'all' ? (
            <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-semibold">
                  Selected Filtered Session
                </span>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {selectedSessionFilter}
                </div>
              </div>
              <button
                onClick={() => onOpenInterview(selectedSessionFilter)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1"
              >
                <span>Resume in Interview</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Saved Sessions Cards Grid */
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Saved Sessions In Store ({sessions.length})</span>
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Persisted
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.sessionId}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-750 rounded-lg p-3.5 flex flex-col justify-between space-y-2.5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-amber-400 font-semibold truncate">
                          {sess.sessionId}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            sess.summary
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sess.summary ? 'Completed' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 mt-1.5 line-clamp-2">
                        {sess.firstPrompt || 'General Quality Audit Session'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sess.interactionCount} turns</span>
                      <button
                        onClick={() => onOpenInterview(sess.sessionId)}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Resume</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summaries Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Structured Audit Summaries ({filteredSummaries.length})</span>
              </div>

              {filteredSummaries.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500">
                  No summaries synthesized for this session. Hold an interview and click &quot;Summarize Session&quot;.
                </div>
              ) : (
                filteredSummaries.map((s) => (
                  <div key={s.summaryId} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="font-semibold text-white">{s.processArea}</span>
                      <span className="text-[11px] font-mono text-amber-400">{s.summaryId}</span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Steps: </span>
                      {s.processSteps.join(' → ')}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Reported Pain Points:</span>
                      {s.painPoints.map((p, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded text-xs border border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-200">{p.description}</span>
                            <span
                              className={`text-[10px] uppercase font-bold ${
                                p.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              {p.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Impact: {p.impact}</p>
                        </div>
                      ))}
                    </div>

                    {s.suggestions.length > 0 && (
                      <div className="text-[11px] text-emerald-400">
                        <span className="font-semibold text-slate-300">Suggestion: </span>
                        {s.suggestions.join('; ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Interactions Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Interview Exchanges ({filteredInteractions.length})</span>
              </div>

              {filteredInteractions.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500">
                  No recorded dialogue in this filter. Start an interview to begin.
                </div>
              ) : (
                filteredInteractions.map((i) => (
                  <div key={i.interactionId} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-850">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400/90">{i.interactionId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">[{i.sessionId}]</span>
                      </div>
                      <span>{new Date(i.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-slate-200">
                      <span className="font-semibold text-amber-400">Prompt: </span>
                      {i.userPrompt}
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-850 whitespace-pre-wrap">
                      <span className="font-semibold text-slate-400 block mb-0.5">Auditor Response:</span>
                      {i.geminiResponse}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
