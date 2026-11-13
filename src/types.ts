export type AppTab = 
  | 'dashboard' 
  | 'payments' 
  | 'invoices' 
  | 'sandbox' 
  | 'apikeys' 
  | 'eventlogs' 
  | 'analytics' 
  | 'settings';

export interface Transaction {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  statusCode: number;
  latencyMs: number;
  amount: number;
  currency: string;
  customer: string;
  customerEmail?: string;
  description: string;
  timestamp: string;
  livemode: boolean;
  type: 'payment' | 'refund' | 'subscription' | 'invoice_payout' | 'deposit';
  fee: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  daysOverdue?: number;
  notes?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  fullKey: string;
  mode: 'live' | 'test';
  createdAt: string;
  lastUsed: string;
  usageCount: number;
  monthlyLimit: number;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  objectType: string;
  status: 'delivered' | 'failed' | 'retrying';
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  endpointUrl: string;
  payload: Record<string, any>;
}

export interface AlertNotification {
  id: string;
  type: 'overdue_invoice' | 'low_balance' | 'api_anomaly' | 'security';
  severity: 'high' | 'medium' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionType: 'remind_invoice' | 'add_funds' | 'view_logs' | 'dismiss';
  relatedId?: string;
  resolved: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  organization: string;
  project: string;
  provider: 'google' | 'github' | 'finflow_demo';
  accountBalance: number;
  lowBalanceThreshold: number;
  isSandbox: boolean;
}

export interface RetentionDay {
  dayIndex: number;
  label: string;
  percentage: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7; // for color intensity
}

export interface DauMetric {
  date: string;
  dau: number;
  apiCalls: number;
  successRate: number;
}
