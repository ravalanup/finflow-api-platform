import React, { useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  Code, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  FileCode,
  Sliders
} from 'lucide-react';

interface ApiSandboxViewProps {
  onTransactionCreated?: (newTx: any) => void;
  isSandbox: boolean;
}

export const ApiSandboxView: React.FC<ApiSandboxViewProps> = ({
  onTransactionCreated,
  isSandbox
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'payments' | 'refunds' | 'subscriptions' | 'customers'>('payments');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'node' | 'python' | 'go'>('curl');
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    amount: 450.00,
    currency: "USD",
    customer_id: "cus_apex_logistics_99",
    payment_method: "pm_card_visa_4242",
    description: "API Subscription Tier 3 - Q3 Invoice",
    metadata: {
      order_id: "ord_2026_881",
      platform: "finflow_api_v1"
    }
  }, null, 2));

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(200);
  const [responseStatusText, setResponseStatusText] = useState<string>('200 OK');
  const [latencyMs, setLatencyMs] = useState<number>(42);
  const [responsePayload, setResponsePayload] = useState<string>(JSON.stringify({
    id: "pi_3M2K9182390aZ",
    object: "payment_intent",
    amount: 450.00,
    currency: "USD",
    status: "succeeded",
    customer: "cus_apex_logistics_99",
    payment_method: "pm_card_visa_4242",
    created: 1788289200,
    livemode: false,
    metadata: {
      order_id: "ord_2026_881",
      platform: "finflow_api_v1"
    }
  }, null, 2));

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Preset switchers
  const loadPreset = (type: 'standard' | 'decline' | 'subscription' | 'refund') => {
    if (type === 'standard') {
      setSelectedEndpoint('payments');
      setRequestBody(JSON.stringify({
        amount: 450.00,
        currency: "USD",
        customer_id: "cus_apex_logistics_99",
        payment_method: "pm_card_visa_4242",
        description: "Standard Developer API Charge",
        metadata: { tier: "pro_monthly" }
      }, null, 2));
    } else if (type === 'decline') {
      setSelectedEndpoint('payments');
      setRequestBody(JSON.stringify({
        amount: 99.00, // triggers 402 card declined in server fixture
        currency: "USD",
        customer_id: "cus_declined_card_1",
        payment_method: "pm_card_insufficient_funds",
        description: "Test 402 Card Declined Simulation"
      }, null, 2));
    } else if (type === 'subscription') {
      setSelectedEndpoint('subscriptions');
      setRequestBody(JSON.stringify({
        customer_id: "cus_fintech_hub",
        plan_id: "plan_enterprise_api_1200",
        billing_cycle: "monthly",
        currency: "USD",
        amount: 1200.00
      }, null, 2));
    } else if (type === 'refund') {
      setSelectedEndpoint('refunds');
      setRequestBody(JSON.stringify({
        payment_id: "pi_3M2K9182390aZ",
        amount: 12.50,
        reason: "requested_by_customer"
      }, null, 2));
    }
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (e) {
        alert('Invalid JSON in request payload.');
        setIsLoading(false);
        return;
      }

      let endpointUrl = '/api/v1/payments';
      if (selectedEndpoint === 'refunds') endpointUrl = '/api/v1/refunds';

      const apiKeyHeader = isSandbox ? 'Bearer ff_test_99aK8812Nvb44991OpqLk28zQp1' : 'Bearer ff_live_51M2KhJ891Lka09sD7721Nzp9xAz2';

      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKeyHeader
        },
        body: JSON.stringify(parsedBody)
      });

      const totalTime = Math.round(performance.now() - startTime);
      setLatencyMs(totalTime);
      setResponseStatus(res.status);
      setResponseStatusText(res.ok ? `${res.status} OK` : `${res.status} ${res.statusText || 'Error'}`);

      const data = await res.json();
      setResponsePayload(JSON.stringify(data, null, 2));

      if (onTransactionCreated && res.ok && data.id) {
        onTransactionCreated({
          id: data.id,
          endpoint: `POST /v1/${selectedEndpoint}`,
          method: 'POST',
          status: data.status || 'succeeded',
          statusCode: res.status,
          latencyMs: totalTime,
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          customer: data.customer || 'cus_sandbox_tester',
          description: 'Sandbox API Request Executed',
          timestamp: 'Just now',
          livemode: !isSandbox,
          type: selectedEndpoint === 'refunds' ? 'refund' : 'payment',
          fee: 0.30 + ((data.amount || 0) * 0.029)
        });
      }
    } catch (err: any) {
      const totalTime = Math.round(performance.now() - startTime);
      setLatencyMs(totalTime);
      setResponseStatus(500);
      setResponseStatusText('500 Internal Error');
      setResponsePayload(JSON.stringify({
        error: {
          code: 'network_error',
          message: err.message || 'Failed to reach API gateway.'
        }
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const getCodeSnippet = () => {
    const key = isSandbox ? 'ff_test_99aK...8zQp1' : 'ff_live_51M2K...9xAz2';
    
    if (selectedLanguage === 'curl') {
      return `curl -X POST https://api.finflow.io/v1/${selectedEndpoint} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.replace(/\n\s*/g, ' ')}'`;
    }

    if (selectedLanguage === 'node') {
      return `import { FinFlow } from '@finflow/node-sdk';

const finflow = new FinFlow('${key}');

const paymentIntent = await finflow.payments.create(${requestBody});

console.log('Charge ID:', paymentIntent.id);`;
    }

    if (selectedLanguage === 'python') {
      return `import finflow

finflow.api_key = "${key}"

intent = finflow.PaymentIntent.create(
${requestBody.split('\n').map(l => '    ' + l).join('\n')}
)
print(f"Charge ID: {intent.id}")`;
    }

    if (selectedLanguage === 'go') {
      return `package main

import (
  "fmt"
  "github.com/finflow/finflow-go"
)

func main() {
  client := finflow.NewClient("${key}")
  params := &finflow.PaymentIntentParams{
    Amount:   450.00,
    Currency: "USD",
  }
  intent, _ := client.PaymentIntents.New(params)
  fmt.Printf("Created: %s\\n", intent.ID)
}`;
    }

    return '';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(responsePayload);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Developer API Sandbox</h1>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full border border-indigo-200 font-bold">
              Time-to-first-call: ↓ 60%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test and execute payment intents, subscriptions, refunds, and webhook simulation payloads in real-time
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-semibold uppercase text-[10px]">Test Fixtures:</span>
          <button
            onClick={() => loadPreset('standard')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
          >
            200 OK Payment
          </button>
          <button
            onClick={() => loadPreset('decline')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 border border-rose-200 text-rose-700 rounded-md font-medium shadow-2xs"
          >
            402 Declined Card
          </button>
          <button
            onClick={() => loadPreset('subscription')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
          >
            Recurring Subscription
          </button>
          <button
            onClick={() => loadPreset('refund')}
            className="px-2.5 py-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 shadow-2xs"
          >
            Refund Trigger
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid (Left: Request & Code Generator, Right: Live Response) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Column: Request Builder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Endpoint Selector Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono text-xs font-bold rounded">
                POST
              </span>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value as any)}
                className="bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="payments">/v1/payments (Create Payment Intent)</option>
                <option value="refunds">/v1/refunds (Issue Refund)</option>
                <option value="subscriptions">/v1/subscriptions (Create Subscription)</option>
                <option value="customers">/v1/customers (Fetch Customers)</option>
              </select>
            </div>

            <button
              id="send-api-request-btn"
              onClick={handleSendRequest}
              disabled={isLoading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute API Call</span>
                </>
              )}
            </button>
          </div>

          {/* JSON Payload Editor */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Request Body (JSON)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">application/json</span>
            </div>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="flex-1 w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[200px]"
              spellCheck={false}
            />
          </div>

          {/* Multi-language SDK Snippet Tabs */}
          <div className="border-t border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                {(['curl', 'node', 'python', 'go'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-medium font-mono uppercase transition-colors ${
                      selectedLanguage === lang
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'node' ? 'Node (TS)' : lang}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopyCode}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy SDK Code'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-xs rounded-lg overflow-x-auto max-h-40 border border-slate-800">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>
        </div>

        {/* Right Column: Live Response & Headers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Response Status Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                responseStatus && responseStatus < 300
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {responseStatusText}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{latencyMs}ms</span>
              </div>
              <button
                onClick={handleCopyResponse}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {copiedResponse ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy JSON</span>
              </button>
            </div>
          </div>

          {/* Response Body Output */}
          <div className="p-4 flex-1 flex flex-col">
            <pre className="flex-1 w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 rounded-lg border border-slate-900 overflow-auto min-h-[300px]">
              <code>{responsePayload}</code>
            </pre>
          </div>

          {/* Response Headers Table */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Gateway Response Headers
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
              <div>
                <span className="text-slate-400">x-finflow-request-id:</span> req_{Math.random().toString(36).substring(2, 9)}
              </div>
              <div>
                <span className="text-slate-400">x-idempotency-key:</span> valid
              </div>
              <div>
                <span className="text-slate-400">x-ledger-lock-latency:</span> 1.2ms
              </div>
              <div>
                <span className="text-slate-400">content-type:</span> application/json; charset=utf-8
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
