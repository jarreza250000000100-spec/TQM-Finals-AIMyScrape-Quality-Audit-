'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserSimSession } from './SidebarNav';
import { Interaction, AuditSummary } from '@/lib/types';
import {
  Send,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  RefreshCw,
  Info,
  Clock,
  PlusCircle,
  ChevronDown,
  Layers,
  Check
} from 'lucide-react';
import { inspectSensitiveData } from '@/lib/sensitive-data-guard';
import { NewSessionModal } from './NewSessionModal';

interface SessionMeta {
  sessionId: string;
  topic?: string;
  status?: 'active' | 'completed';
  interactionCount: number;
  lastActivity: string;
  firstPrompt: string;
  summary?: AuditSummary;
}

interface AuditInterviewChatProps {
  currentPersona: UserSimSession;
  onSummaryGenerated: (summary: AuditSummary) => void;
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

const TOPIC_CHIPS = [
  'Delaware & Texas SOS silent DOM shifts & false zeros',
  'NYSCEF court e-filing staging & irreversible debit fees',
  'Residential runner IP blocks & captcha solver timeouts',
  'Bulk debtor campaign queue pacing & rate limits',
  'SCRA active-duty defense checks & PACER bankruptcy'
];

export const AuditInterviewChat: React.FC<AuditInterviewChatProps> = ({
  currentPersona,
  onSummaryGenerated,
  selectedSessionId,
  onSessionSelect
}) => {
  const [internalSessionId, setInternalSessionId] = useState<string>('sess-active-session');
  const sessionId = selectedSessionId || internalSessionId;
  const [sessionsList, setSessionsList] = useState<SessionMeta[]>([]);
  const [messages, setMessages] = useState<Interaction[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [liveGuardAlert, setLiveGuardAlert] = useState<{ isSecret: boolean; isPii: boolean; text: string } | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history for current persona & session
  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      try {
        const res = await fetch(`/api/interview/history?userId=${currentPersona.userId}&sessionId=${sessionId}`, {
          headers: {
            'x-user-email': currentPersona.email,
            'x-user-id': currentPersona.userId,
            'x-user-name': currentPersona.displayName
          }
        });
        const data = await res.json();
        if (!ignore && data.success) {
          const userInteractions = data.interactions || [];
          setMessages(userInteractions);
          if (Array.isArray(data.sessions)) {
            setSessionsList(data.sessions);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [currentPersona.userId, currentPersona.email, currentPersona.displayName, sessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Live sensitive data check as user types
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setLiveGuardAlert(null);
      return;
    }
    const check = inspectSensitiveData(text);
    if (check.hasSecret) {
      setLiveGuardAlert({
        isSecret: true,
        isPii: false,
        text: check.secretReason || 'Secret detected'
      });
    } else if (check.hasPersonalData) {
      setLiveGuardAlert({
        isSecret: false,
        isPii: true,
        text: check.personalDataReason || 'Personal data detected'
      });
    } else {
      setLiveGuardAlert(null);
    }
  };

  // Switch session
  const handleSelectSession = (newSessId: string) => {
    setInternalSessionId(newSessId);
    setShowSessionDropdown(false);
    if (onSessionSelect) onSessionSelect(newSessId);
  };

  // Called after NewSessionModal creates session
  const handleSessionCreated = async (newSessId: string, topic: string, initialAuditorMessage?: string) => {
    setInternalSessionId(newSessId);
    setMessages([]);
    setInputText('');
    setErrorMessage(null);
    setWarningMessage(null);
    if (onSessionSelect) onSessionSelect(newSessId);

    // Refresh sessions list
    setSessionsList((prev) => [
      {
        sessionId: newSessId,
        interactionCount: initialAuditorMessage ? 1 : 0,
        lastActivity: new Date().toISOString(),
        firstPrompt: topic
      },
      ...prev
    ]);

    // If an initial auditor inquiry was requested, send initial trigger to Gemini API
    if (initialAuditorMessage) {
      setLoading(true);
      try {
        const promptText = `I am initiating an audit session on: ${topic}. Please present your focused inquiry for this process area.`;
        const res = await fetch('/api/interview/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentPersona.email,
            'x-user-id': currentPersona.userId,
            'x-user-name': currentPersona.displayName
          },
          body: JSON.stringify({
            message: promptText,
            sessionId: newSessId
          })
        });
        const data = await res.json();
        if (data.success && data.interaction) {
          setMessages([data.interaction]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Send message to Gemini
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading) return;

    // Check sensitive data guard
    const check = inspectSensitiveData(textToSend);
    if (check.hasSecret) {
      setErrorMessage(check.secretReason || 'Blocked: Input contains credentials.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setWarningMessage(check.hasPersonalData ? check.personalDataReason || null : null);

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email,
          'x-user-id': currentPersona.userId,
          'x-user-name': currentPersona.displayName
        },
        body: JSON.stringify({
          message: textToSend,
          sessionId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to generate auditor reply.');
        if (data.interaction) {
          // If interaction was saved even though model failed (Test Case 18)
          setMessages((prev) => [...prev, data.interaction]);
        }
      } else {
        setMessages((prev) => [...prev, data.interaction]);
        if (data.warning) {
          setWarningMessage(data.warning);
        }
        if (!customText) {
          setInputText('');
          setLiveGuardAlert(null);
        }

        // Update current session meta
        setSessionsList((prev) => {
          const idx = prev.findIndex((s) => s.sessionId === sessionId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              interactionCount: updated[idx].interactionCount + 1,
              lastActivity: new Date().toISOString()
            };
            return updated;
          }
          return [
            {
              sessionId,
              interactionCount: 1,
              lastActivity: new Date().toISOString(),
              firstPrompt: textToSend
            },
            ...prev
          ];
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Synthesize structured summary
  const handleSynthesizeSummary = async () => {
    if (messages.length === 0) {
      setErrorMessage('Hold an interview exchange before generating a structured summary.');
      return;
    }

    setSummarizing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/interview/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email,
          'x-user-id': currentPersona.userId,
          'x-user-name': currentPersona.displayName
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Summary generation failed.');
      } else {
        onSummaryGenerated(data.summary);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating summary.');
    } finally {
      setSummarizing(false);
    }
  };

  const activeSessionMeta = sessionsList.find((s) => s.sessionId === sessionId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[750px] shadow-2xl">
      {/* Session Controls & Actions Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowSessionDropdown((prev) => !prev)}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-amber-400/90">{sessionId}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                {messages.length} {messages.length === 1 ? 'exchange' : 'exchanges'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {showSessionDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-850 flex items-center justify-between">
                  <span>Your Audit Sessions</span>
                  <span>{sessionsList.length}</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-850/60">
                  {sessionsList.map((s) => {
                    const isSelected = s.sessionId === sessionId;
                    return (
                      <button
                        key={s.sessionId}
                        onClick={() => handleSelectSession(s.sessionId)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-amber-500/10 text-white font-medium' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-amber-400 truncate">{s.sessionId}</span>
                            {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {s.firstPrompt || s.topic || 'General session'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-mono text-slate-500">
                            {s.interactionCount} turns
                          </span>
                          <span
                            className={`text-[9px] font-mono ${
                              s.summary || s.status === 'completed' ? 'text-emerald-400' : 'text-amber-400/80'
                            }`}
                          >
                            {s.summary || s.status === 'completed' ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {sessionsList.length === 0 && (
                    <div className="px-3 py-3 text-center text-xs text-slate-500">
                      No past sessions recorded.
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-850 bg-slate-900/60">
                  <button
                    onClick={() => {
                      setShowSessionDropdown(false);
                      setShowNewSessionModal(true);
                    }}
                    className="w-full py-1.5 px-2.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Start New Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persisted session status badges */}
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Saved to Store
          </span>

          {activeSessionMeta?.summary ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-3 h-3" /> Summarized
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Active Session
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>+ New Session</span>
          </button>

          <button
            onClick={handleSynthesizeSummary}
            disabled={summarizing || messages.length === 0}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{summarizing ? 'Synthesizing...' : 'Summarize Session'}</span>
          </button>
        </div>
      </div>

      {/* Transparency & Notice Header Banner (Directive 2) */}
      <div className="bg-slate-950 px-6 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px]">
            <strong>Transparency Notice:</strong> Super Admin reviews audit transcripts to improve AIMyScrape & Monetaria workflows. Describe issues as process friction, not personal blame.
          </span>
        </div>
      </div>

      {/* Warning/Error alerts */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {warningMessage && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-amber-400 hover:text-white underline text-xs">
            Acknowledge
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                AIMyScrape Internal Quality Audit
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Welcome, {currentPersona.displayName}. As our {currentPersona.roleInCompany}, your candid insights help identify scraping false zeros, runner downtime, and court filing risks.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Select a topic to start this session:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {TOPIC_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, `I would like to discuss: ${chip}`)}
                    className="px-2.5 py-1 text-xs text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.interactionId} className="space-y-3">
              {/* User Prompt */}
              <div className="flex justify-end">
                <div className="max-w-2xl bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tr-sm px-4 py-3 text-xs text-slate-100">
                  <div className="text-[10px] text-amber-400/80 mb-1 font-medium flex items-center justify-between gap-4">
                    <span>{currentPersona.displayName} ({currentPersona.roleInCompany})</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.userPrompt}</p>
                </div>
              </div>

              {/* Auditor Response */}
              <div className="flex justify-start">
                <div className="max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-200 space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Sparkles className="w-3 h-3" /> Quality Auditor
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Model: {msg.modelUsed}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-100">{msg.geminiResponse}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Auditor analyzing process steps & consulting company basis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Sensitive Data Guard Indicator */}
      {liveGuardAlert && (
        <div
          className={`px-6 py-2 border-t text-xs flex items-center gap-2 ${
            liveGuardAlert.isSecret
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-amber-950/90 border-amber-800 text-amber-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium">{liveGuardAlert.text}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={(e) => handleSendMessage(e)} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
        <input
          type="text"
          placeholder="Describe how your process works, where it breaks, false zeros, or complaints..."
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
      </form>

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        currentPersona={currentPersona}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
};
