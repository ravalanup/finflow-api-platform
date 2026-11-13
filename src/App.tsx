import React, { useState, useEffect } from 'react';
import { AppTab, Transaction, Invoice, AlertNotification, ApiKey, WebhookEvent, UserProfile } from './types';
import { 
  initialTransactions, 
  initialInvoices, 
  initialAlerts, 
  initialApiKeys, 
  initialWebhookEvents, 
  initialUserProfile 
} from './data/mockData';
import { initDebugTracker } from './lib/debugTracker';

// Layout Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// View Components
import { DashboardView } from './components/DashboardView';
import { PaymentsView } from './components/PaymentsView';
import { InvoicesView } from './components/InvoicesView';
import { ApiSandboxView } from './components/ApiSandboxView';
import { ApiKeysView } from './components/ApiKeysView';
import { EventLogsView } from './components/EventLogsView';
import { AnalyticsView } from './components/AnalyticsView';

// Modals
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuthModal } from './components/AuthModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { PrintStatementModal } from './components/PrintStatementModal';
import { NewPaymentModal } from './components/NewPaymentModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUserProfile);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Core Data States
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [alerts, setAlerts] = useState<AlertNotification[]>(initialAlerts);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [events, setEvents] = useState<WebhookEvent[]>(initialWebhookEvents);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals & Drawers
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Invisible Debug Visit Counter
  const [visitCount, setVisitCount] = useState<number>(() => {
    return initDebugTracker();
  });

  // Handlers for transactions
  const handleAddTransaction = (newTx: Partial<Transaction>) => {
    const tx: Transaction = {
      id: newTx.id || `pi_3M2K${Math.random().toString(36).substring(2, 8)}`,
      endpoint: newTx.endpoint || 'POST /v1/payments',
      method: 'POST',
      status: newTx.status || 'succeeded',
      statusCode: newTx.statusCode || 200,
      latencyMs: newTx.latencyMs || Math.floor(20 + Math.random() * 40),
      amount: newTx.amount || 100,
      currency: 'USD',
      customer: newTx.customer || 'Developer Sandbox',
      description: newTx.description || 'API Payment Transaction',
      timestamp: 'Just now',
      livemode: !isSandbox,
      type: newTx.type || 'payment',
      fee: newTx.fee || (0.30 + (newTx.amount || 100) * 0.029)
    };

    setTransactions(prev => [tx, ...prev]);

    // Dispatch a matching webhook event
    const newEvent: WebhookEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      eventType: tx.type === 'refund' ? 'charge.refunded' : 'payment_intent.succeeded',
      objectType: tx.type === 'refund' ? 'refund' : 'payment_intent',
      status: 'delivered',
      statusCode: 200,
      timestamp: 'Just now',
      latencyMs: tx.latencyMs,
      endpointUrl: 'https://api.merchant.com/webhooks/finflow',
      payload: {
        id: tx.id,
        object: 'event',
        data: { object: tx }
      }
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleTriggerRefund = (txId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'refunded',
          statusCode: 200,
          description: `${t.description} (Refunded)`
        };
      }
      return t;
    }));

    // Add a refund transaction record
    const targetTx = transactions.find(t => t.id === txId);
    if (targetTx) {
      handleAddTransaction({
        id: `re_${Math.random().toString(36).substring(2, 8)}`,
        endpoint: 'POST /v1/refunds',
        method: 'POST',
        status: 'succeeded',
        statusCode: 200,
        amount: targetTx.amount,
        customer: targetTx.customer,
        description: `Full Refund for ${targetTx.id}`,
        type: 'refund',
        fee: 0
      });
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  // Handlers for invoices
  const handleMarkInvoicePaid = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { ...inv, status: 'paid' };
      }
      return inv;
    }));
  };

  const handleSendInvoiceReminder = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    // Inject webhook reminder log
    const newEvent: WebhookEvent = {
      id: `evt_remind_${Math.random().toString(36).substring(2, 8)}`,
      eventType: 'invoice.payment_reminder_sent',
      objectType: 'invoice',
      status: 'delivered',
      statusCode: 200,
      timestamp: 'Just now',
      latencyMs: 14,
      endpointUrl: 'https://api.merchant.com/webhooks/finflow',
      payload: {
        invoice_id: inv.id,
        invoice_number: inv.invoiceNumber,
        client_email: inv.clientEmail,
        amount_due: inv.amount,
        action: 'dunning_reminder_dispatched'
      }
    };
    setEvents(prev => [newEvent, ...prev]);

    alert(`Payment reminder dispatched to ${inv.clientEmail} for ${inv.invoiceNumber} ($${inv.amount.toFixed(2)})`);
  };

  const handleCreateInvoice = (newInv: Omit<Invoice, 'id'>) => {
    const created: Invoice = {
      ...newInv,
      id: `inv_${Date.now()}`
    };
    setInvoices(prev => [created, ...prev]);
  };

  // Handlers for API keys
  const handleRotateKey = (id: string) => {
    const rand = Math.random().toString(36).substring(2, 12);
    setApiKeys(prev => prev.map(k => {
      if (k.id === id) {
        const isLive = k.mode === 'live';
        const prefix = isLive ? 'ff_live_' : 'ff_test_';
        const full = `${prefix}${rand}99xAz2`;
        return {
          ...k,
          fullKey: full,
          keyPrefix: `${prefix}${rand.substring(0, 5)}...`,
          maskedKey: `${prefix}${rand.substring(0, 5)}...${rand.substring(rand.length - 4)}`,
          lastUsed: 'Just now'
        };
      }
      return k;
    }));
  };

  const handleCreateKey = (name: string, mode: 'live' | 'test') => {
    const rand = Math.random().toString(36).substring(2, 12);
    const prefix = mode === 'live' ? 'ff_live_' : 'ff_test_';
    const full = `${prefix}${rand}882aQ1`;
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name,
      keyPrefix: `${prefix}${rand.substring(0, 5)}...`,
      maskedKey: `${prefix}${rand.substring(0, 5)}...aQ1`,
      fullKey: full,
      mode,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      usageCount: 0,
      monthlyLimit: mode === 'live' ? 100000 : 10000
    };
    setApiKeys(prev => [newKey, ...prev]);
  };

  // Handlers for Webhook Events
  const handleRetryEvent = (id: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === id) {
        return {
          ...evt,
          statusCode: 200,
          timestamp: 'Just now',
          latencyMs: Math.floor(10 + Math.random() * 20)
        };
      }
      return evt;
    }));
  };

  const handleDispatchSimulatedEvent = (eventType: string) => {
    const newEvt: WebhookEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      eventType,
      objectType: eventType.split('.')[0] || 'event',
      status: 'delivered',
      statusCode: 200,
      timestamp: 'Just now',
      latencyMs: Math.floor(15 + Math.random() * 30),
      endpointUrl: 'https://api.merchant.com/webhooks/finflow',
      payload: {
        event_id: `sim_${Date.now()}`,
        type: eventType,
        created: Math.floor(Date.now() / 1000),
        data: { simulated: true, livemode: !isSandbox }
      }
    };
    setEvents(prev => [newEvt, ...prev]);
  };

  // Alert Handlers
  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const handleResolveAlert = (alert: AlertNotification) => {
    handleDismissAlert(alert.id);
    if (alert.type === 'overdue_invoice') {
      setCurrentTab('invoices');
    } else if (alert.type === 'low_balance') {
      setCurrentUser(prev => ({ ...prev, accountBalance: prev.accountBalance + 5000 }));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isSandbox={isSandbox}
        setIsSandbox={setIsSandbox}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        overdueCount={invoices.filter(i => i.status === 'overdue').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          user={currentUser}
          alerts={alerts}
          isSandbox={isSandbox}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenAuthModal={() => setIsAuthOpen(true)}
          onOpenAiAssistant={() => setIsAiOpen(true)}
          onOpenQuickPayment={() => setIsNewPaymentOpen(true)}
          onToggleMobileNav={() => setIsOpenMobile(!isOpenMobile)}
          isSyncing={isSyncing}
          onTriggerSync={handleManualSync}
        />

        {/* Dynamic Tab Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            invoices={invoices}
            alerts={alerts}
            setCurrentTab={setCurrentTab}
            onOpenPrintStatement={() => setIsPrintOpen(true)}
            onOpenQuickPayment={() => setIsNewPaymentOpen(true)}
            onOpenAiAssistant={() => setIsAiOpen(true)}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
            isSandbox={isSandbox}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
            onOpenQuickPayment={() => setIsNewPaymentOpen(true)}
            onOpenPrintStatement={() => setIsPrintOpen(true)}
            onTriggerRefund={handleTriggerRefund}
            isSyncing={isSyncing}
            onTriggerSync={handleManualSync}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            onMarkInvoicePaid={handleMarkInvoicePaid}
            onSendInvoiceReminder={handleSendInvoiceReminder}
            onCreateInvoice={handleCreateInvoice}
            onOpenPrintStatement={() => setIsPrintOpen(true)}
          />
        )}

        {currentTab === 'sandbox' && (
          <ApiSandboxView
            onTransactionCreated={handleAddTransaction}
            isSandbox={isSandbox}
          />
        )}

        {currentTab === 'apikeys' && (
          <ApiKeysView
            apiKeys={apiKeys}
            onRotateKey={handleRotateKey}
            onCreateKey={handleCreateKey}
          />
        )}

        {currentTab === 'eventlogs' && (
          <EventLogsView
            events={events}
            onRetryEvent={handleRetryEvent}
            onDispatchSimulatedEvent={handleDispatchSimulatedEvent}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView visitCount={visitCount} />
        )}

        {currentTab === 'settings' && (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Merchant & Platform Configuration</h2>
              <p className="text-xs text-slate-500 mb-6">Manage settlement bank routing, automated webhooks, and sandbox defaults.</p>
              
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">Chase NA Direct Rail Bridge</span>
                  <span className="text-slate-500 font-mono">Status: Connected (ACH Routing #021000021)</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">OAuth 2.0 Identity Provider</span>
                  <span className="text-slate-500 font-mono">Current: {currentUser.provider.toUpperCase()} ({currentUser.email})</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">Invisible Telemetry Tracker</span>
                  <span className="text-slate-500 font-mono">Total Recorded Sessions: {visitCount} visits (Debug Tag Active)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals & Drawers */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        transactions={transactions}
        invoices={invoices}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSelectUser={(u) => setCurrentUser(u)}
      />

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onDismissAlert={handleDismissAlert}
        onResolveAlert={handleResolveAlert}
        setCurrentTab={setCurrentTab}
      />

      <PrintStatementModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        transactions={transactions}
        invoices={invoices}
        user={currentUser}
      />

      <NewPaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        onSubmitPayment={handleAddTransaction}
        isSandbox={isSandbox}
      />

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onTriggerRefund={handleTriggerRefund}
      />
    </div>
  );
}
