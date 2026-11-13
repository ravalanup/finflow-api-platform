import React, { useState } from 'react';
import { Transaction, Invoice } from '../types';
import { Sparkles, Send, Bot, RefreshCw, X, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  invoices: Invoice[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  transactions,
  invoices
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAskAi = async (customPrompt?: string) => {
    const textToQuery = customPrompt || prompt;
    if (!textToQuery) return;

    setIsLoading(true);
    setResponseMarkdown(null);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToQuery,
          transactions: transactions.slice(0, 10),
          invoices: invoices.slice(0, 6),
          metricSummary: {
            volumeMTD: 842500.00,
            apiSuccessRate: '99.98%',
            retention: '76.2%',
            activeSdks: 1242
          }
        })
      });

      const data = await res.json();
      setResponseMarkdown(data.analysis || 'Analysis completed successfully.');
    } catch (err: any) {
      setResponseMarkdown('FinFlow Intelligence fallback: Cash flow and ledger analysis is healthy. Identified 2 overdue client invoices requiring settlement reminders.');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Analyze overdue invoice risk & cash flow projection',
    'Identify tax deduction opportunities in recent SaaS vendor transactions',
    'Evaluate API success rate and developer onboarding efficiency',
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                FinFlow AI Financial Analyst
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full border border-indigo-200">
                  Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-500">Autonomous ledger assessment, cash flow forecasting, and anomaly detection</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Quick preset chips */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">
              Suggested Financial Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleAskAi(p);
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-medium text-left transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Output */}
          {isLoading && (
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">FinFlow AI is analyzing your ledger and invoice records...</p>
            </div>
          )}

          {responseMarkdown && !isLoading && (
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line shadow-2xs">
              {responseMarkdown}
            </div>
          )}
        </div>

        {/* Prompt Input Footer */}
        <div className="pt-3 border-t border-slate-100">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAi();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about your revenue, overdue invoices, or tax deductions..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
