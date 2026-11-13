/**
 * FinFlow Telemetry & Debug Tracking Utility
 * Maintains an invisible DOM tag `<div id="debug-stats" style="display:none" ... />`
 * and exposes debug stats to Chrome DevTools console under window.__FINFLOW_DEBUG__
 */

declare global {
  interface Window {
    __FINFLOW_DEBUG__?: {
      getVisitCount: () => number;
      getPlatformState: () => Record<string, any>;
      resetVisits: () => void;
      incrementVisit: () => number;
      simulateWebhook: (eventType?: string) => void;
    };
  }
}

const STORAGE_KEY = 'finflow_visit_count';
const DEFAULT_INITIAL_VISITS = 1242;

export function initDebugTracker(onNewWebhookTrigger?: (event: any) => void) {
  let storedVisits = parseInt(localStorage.getItem(STORAGE_KEY) || `${DEFAULT_INITIAL_VISITS}`, 10);
  if (isNaN(storedVisits) || storedVisits < DEFAULT_INITIAL_VISITS) {
    storedVisits = DEFAULT_INITIAL_VISITS;
  }
  
  // Increment visit count for session
  storedVisits += 1;
  localStorage.setItem(STORAGE_KEY, storedVisits.toString());

  // Update or inject invisible DOM element
  updateDomDebugTag(storedVisits);

  // Expose to Chrome DevTools console
  window.__FINFLOW_DEBUG__ = {
    getVisitCount: () => storedVisits,
    getPlatformState: () => ({
      platform: 'FinFlow Developer-First Payments API',
      version: '1.4.0-enterprise',
      mode: 'sandbox/live-hybrid',
      visits: storedVisits,
      activeSdkCount: 1242,
      apiSuccessRate: '99.98%',
      caseStudyAuthor: 'Anup Raval',
      storageBackend: 'Supabase / Edge PostgreSQL (Simulated/Connectable)',
      llmService: 'Gemini 3.7 Flash & GPT-4o / Claude Bridge',
    }),
    resetVisits: () => {
      storedVisits = DEFAULT_INITIAL_VISITS;
      localStorage.setItem(STORAGE_KEY, `${DEFAULT_INITIAL_VISITS}`);
      updateDomDebugTag(DEFAULT_INITIAL_VISITS);
      console.log('🔄 FinFlow visits reset to default:', DEFAULT_INITIAL_VISITS);
    },
    incrementVisit: () => {
      storedVisits += 1;
      localStorage.setItem(STORAGE_KEY, storedVisits.toString());
      updateDomDebugTag(storedVisits);
      console.log('📈 FinFlow visit count updated:', storedVisits);
      return storedVisits;
    },
    simulateWebhook: (eventType = 'payment_intent.succeeded') => {
      console.log(`⚡ Dispatched simulated webhook event: [${eventType}]`);
      if (onNewWebhookTrigger) {
        onNewWebhookTrigger({
          id: `evt_debug_${Math.random().toString(36).substring(2, 8)}`,
          eventType,
          objectType: eventType.split('.')[0] || 'event',
          status: 'delivered',
          statusCode: 200,
          latencyMs: Math.floor(Math.random() * 80) + 20,
          timestamp: 'Just now',
          endpointUrl: 'https://api.merchant.com/webhooks/finflow',
          payload: {
            triggeredBy: 'Chrome DevTools Console',
            timestamp: new Date().toISOString(),
            amount: 25000,
            currency: 'usd',
            status: 'succeeded'
          }
        });
      }
    }
  };

  console.info(
    '%c⚡ FinFlow API Platform Debug Initialized%c\nRun %cwindow.__FINFLOW_DEBUG__.getPlatformState()%c or check element %c#debug-stats%c in Elements panel.',
    'background: #1E293B; color: #6366F1; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    '',
    'color: #6366F1; font-weight: bold;',
    '',
    'color: #10B981; font-weight: bold;',
    ''
  );

  return storedVisits;
}

function updateDomDebugTag(visits: number) {
  let element = document.getElementById('debug-stats');
  if (!element) {
    element = document.createElement('div');
    element.id = 'debug-stats';
    element.style.display = 'none';
    document.body.appendChild(element);
  }
  element.setAttribute('data-visits', visits.toString());
  element.setAttribute('data-platform', 'finflow_v1');
  element.setAttribute('data-auth-provider', 'OAuth 2.0 (Google/GitHub/FinFlow)');
  element.setAttribute('data-author', 'Anup Raval');
  element.setAttribute('data-timestamp', new Date().toISOString());
}
