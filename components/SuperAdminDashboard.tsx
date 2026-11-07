'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserSimSession } from './SidebarNav';
import { AuditSummary, CompanyBasisDoc, ConsolidatedReport } from '@/lib/types';
import {
  Upload,
  FileText,
  AlertTriangle,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Building
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentPersona: UserSimSession;
  onOpenTestRunner: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentPersona,
  onOpenTestRunner
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'basis' | 'transcripts'>('insights');
  const [summaries, setSummaries] = useState<AuditSummary[]>([]);
  const [basisDocs, setBasisDocs] = useState<CompanyBasisDoc[]>([]);
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const sumRes = await fetch('/api/superadmin/users', {
        headers: {
          'x-user-email': currentPersona.email,
          'x-user-id': currentPersona.userId
        }
      });
      const sumData = await sumRes.json();
      if (!sumRes.ok || !sumData.success) {
        setErrorMessage(sumData.error || 'Access denied: Super Admin credentials required.');
      } else {
        setSummaries(sumData.summaries || []);
      }

      const basisRes = await fetch('/api/superadmin/basis', {
        headers: { 'x-user-email': currentPersona.email }
      });
      const basisData = await basisRes.json();
      if (basisData.success) {
        setBasisDocs(basisData.docs || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [currentPersona.email, currentPersona.userId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const sumRes = await fetch('/api/superadmin/users', {
          headers: {
            'x-user-email': currentPersona.email,
            'x-user-id': currentPersona.userId
          }
        });
        const sumData = await sumRes.json();
        if (!ignore) {
          if (!sumRes.ok || !sumData.success) {
            setErrorMessage(sumData.error || 'Access denied: Super Admin credentials required.');
          } else {
            setSummaries(sumData.summaries || []);
          }
        }

        const basisRes = await fetch('/api/superadmin/basis', {
          headers: { 'x-user-email': currentPersona.email }
        });
        const basisData = await basisRes.json();
        if (!ignore && basisData.success) {
          setBasisDocs(basisData.docs || []);
        }
      } catch (err: any) {
        if (!ignore) setErrorMessage(err.message || 'Error loading dashboard data.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [currentPersona.email, currentPersona.userId]);

  // Handle Document Upload
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim() || !uploadTitle.trim()) {
      setErrorMessage('Title and document text are required.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/superadmin/basis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email
        },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          fileName: uploadFileName || `${uploadTitle.replace(/\s+/g, '_')}.txt`,
          extractedText: uploadText.trim(),
          fileSize: uploadText.length
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Upload failed.');
      } else {
        setSuccessMessage(`Document '${data.doc.title}' uploaded and added as Gemini audit benchmark.`);
        setUploadTitle('');
        setUploadText('');
        setUploadFileName('');
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/basis?docId=${docId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentPersona.email }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Document removed from basis benchmark.');
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Consolidated Report
  const handleGenerateReport = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/superadmin/consolidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentPersona.email
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Report generation failed.');
      } else {
        setReport(data.report);
        setSuccessMessage('Consolidated audit report generated with Gemini.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Report generation error.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentPersona.isSuperAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">403 Forbidden: Super Admin Restricted</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The consolidated audit dashboard, cross-user interviews, and benchmark basis uploads are strictly restricted to the designated Super Admin ({currentPersona.email}).
        </p>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400">
          To inspect this dashboard, switch your persona in the top navigation to Elena Vance (Super Admin).
        </div>
      </div>
    );
  }

  // Aggregate pain points across all summaries
  const totalPainPoints = summaries.reduce((acc, s) => acc + s.painPoints.length, 0);
  const highSeverityCount = summaries.reduce(
    (acc, s) => acc + s.painPoints.filter((p) => p.severity === 'high').length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">Total Completed Audits</div>
          <div className="text-2xl font-bold text-white tabular-nums">{summaries.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across Engineering & Ops teams</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">Total Reported Pain Points</div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">{totalPainPoints}</div>
          <div className="text-[11px] text-slate-400 mt-1">{highSeverityCount} High Severity</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">Company Basis Benchmarks</div>
          <div className="text-2xl font-bold text-white tabular-nums">{basisDocs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Grounding Gemini interviews</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400">Executive Report</div>
          <button
            onClick={handleGenerateReport}
            disabled={loading || summaries.length === 0}
            className="w-full py-1.5 px-3 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Consolidation</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-800 p-3 rounded-lg text-xs text-rose-200 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Consolidated Insights ({totalPainPoints} Pain Points)
            </button>
            <button
              onClick={() => setActiveTab('basis')}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'basis'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Company Basis Benchmarks ({basisDocs.length})
            </button>
            <button
              onClick={() => setActiveTab('transcripts')}
              className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'transcripts'
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              All Employee Audits (Read-Only)
            </button>
          </div>

          <a
            href="/api/export/csv"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV (OWASP Escaped)</span>
          </a>
        </div>

        <div className="p-6">
          {/* TAB 1: CONSOLIDATED INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Executive Gemini Narrative if generated */}
              {report && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      {report.title}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Model: {report.modelUsed}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {report.executiveNarrative}
                  </div>
                </div>
              )}

              {/* Grouped Pain Points Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Recurring Process Bottlenecks Grouped by Process Area
                </h3>

                {summaries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No employee summaries recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summaries.map((sum) => (
                      <div key={sum.summaryId} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                          <div>
                            <span className="font-semibold text-white">{sum.processArea}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Reported by {sum.userRole} · ID: <code className="font-mono text-amber-400">{sum.summaryId}</code>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{new Date(sum.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Process steps */}
                        {sum.processSteps.length > 0 && (
                          <div className="text-[11px] text-slate-400">
                            <span className="text-slate-300 font-medium">Steps: </span>
                            {sum.processSteps.join(' → ')}
                          </div>
                        )}

                        {/* Pain points */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-300 block">
                            Key Pain Points:
                          </span>
                          {sum.painPoints.map((p, idx) => (
                            <div key={idx} className="bg-slate-900/80 border border-slate-800 p-2 rounded text-xs">
                              <div className="flex items-center justify-between text-[11px] mb-0.5">
                                <span className="font-medium text-slate-200">{p.description}</span>
                                <span
                                  className={`text-[10px] uppercase font-semibold ${
                                    p.severity === 'high'
                                      ? 'text-rose-400'
                                      : p.severity === 'medium'
                                      ? 'text-amber-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {p.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">Impact: {p.impact}</p>
                            </div>
                          ))}
                        </div>

                        {/* Suggestions */}
                        {sum.suggestions.length > 0 && (
                          <div className="pt-1 text-[11px] text-emerald-400">
                            <span className="font-semibold text-slate-300">Suggestion: </span>
                            {sum.suggestions.join('; ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMPANY BASIS BENCHMARKS */}
          {activeTab === 'basis' && (
            <div className="space-y-6">
              {/* Upload Document Form */}
              <form onSubmit={handleUploadDoc} className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Upload Company Basis Benchmark Document</h3>
                  <p className="text-xs text-slate-400">
                    SOPs, Monetaria contracts, or API specs that ground Gemini&apos;s interview questions. Allowed formats: .txt, .md, .pdf, .csv, .docx (Max 5MB).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Document Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Scraper Architecture & False-Zero Standard"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">File Name with Extension *</label>
                    <input
                      type="text"
                      placeholder="e.g. SOP_08_Scrapers.txt"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Extracted Policy Text *</label>
                  <textarea
                    rows={4}
                    placeholder="Paste operating standards, rules, and SLA requirements to be injected as grounded data..."
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    OWASP Injection Protection: Text is strictly delimited inside [COMPANY_BASIS] tags.
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors"
                  >
                    Upload Benchmark Document
                  </button>
                </div>
              </form>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Active Grounding Documents</h3>
                {basisDocs.map((doc) => (
                  <div key={doc.docId} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">{doc.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({doc.fileSize} bytes)</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-3 font-mono bg-slate-900/50 p-2 rounded">
                        {doc.extractedText}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDoc(doc.docId)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors shrink-0"
                      title="Remove Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: READ-ONLY TRANSCRIPTS */}
          {activeTab === 'transcripts' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 flex items-center justify-between">
                <span>
                  <strong>Read-Only Guarantee (Directive 3 & Test Case 16):</strong> Super Admin can read every employee interview, but interactions cannot be edited or deleted.
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">Audit Immutability Enforced</span>
              </div>

              {summaries.map((s) => (
                <div key={s.summaryId} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-semibold text-white">{s.userName}</span>
                      <span className="text-slate-400 ml-2">({s.userRole})</span>
                    </div>
                    <span className="font-mono text-xs text-amber-400">{s.summaryId}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Process Area & Steps:</span>
                      <div className="text-slate-200">{s.processArea}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{s.processSteps.join(' → ')}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Candid Complaints & Friction:</span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                        {s.complaints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
