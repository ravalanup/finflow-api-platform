import React, { useState } from 'react';
import { WebhookEvent } from '../types';
import { 
  ScrollText, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  Search,
  Code,
  Sparkles
} from 'lucide-react';

interface EventLogsViewProps {
  events: WebhookEvent[];
  onRetryEvent: (id: string) => void;
  onDispatchSimulatedEvent: (eventType: string) => void;
}

export const EventLogsView: React.FC<EventLogsViewProps> = ({
  events,
  onRetryEvent,
  onDispatchSimulatedEvent
}) => {
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(events[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  const filteredEvents = events.filter(evt => 
    evt.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evt.endpointUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyPayload = () => {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Event Stream & Webhook Logs</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              Real-time Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed event dispatcher with automatic exponential backoff retry policies
          </p>
        </div>

        {/* Quick event injectors */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase text-[10px]">Simulate Event:</span>
          <button
            onClick={() => onDispatchSimulatedEvent('payment_intent.succeeded')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
          >
            Payment Succeeded
          </button>
          <button
            onClick={() => onDispatchSimulatedEvent('invoice.payment_overdue')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md font-medium shadow-2xs"
          >
            Invoice Overdue
          </button>
        </div>
      </div>

      {/* Main 2-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Event List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Event items list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-bold text-slate-900 font-mono">{evt.eventType}</code>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {evt.statusCode} OK
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{evt.id}</span>
                    <span>{evt.timestamp} • {evt.latencyMs}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Event Payload & Retry Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {selectedEvent ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div>
                  <h3 className="font-mono text-xs font-bold text-slate-900">{selectedEvent.eventType}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedEvent.endpointUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRetryEvent(selectedEvent.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Redeliver Webhook</span>
                  </button>
                  <button
                    onClick={handleCopyPayload}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                    title="Copy payload JSON"
                  >
                    {copiedPayload ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* JSON Payload viewer */}
              <div className="p-4 flex-1 flex flex-col bg-slate-950 overflow-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Event Data Payload (Signed HMAC-SHA256)
                </span>
                <pre className="font-mono text-xs text-indigo-300 overflow-auto">
                  <code>{JSON.stringify(selectedEvent.payload, null, 2)}</code>
                </pre>
              </div>

              {/* Security & Delivery metadata */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                <div><span className="text-slate-400">Webhook Signature:</span> t=17882892,v1=98a1f...</div>
                <div><span className="text-slate-400">Response Latency:</span> {selectedEvent.latencyMs}ms</div>
                <div><span className="text-slate-400">Retry Attempt:</span> 1 of 5</div>
                <div><span className="text-slate-400">Status:</span> 200 OK (Delivered)</div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8">
              Select an event to inspect its cryptographic webhook payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
