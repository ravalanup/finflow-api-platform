import { Transaction, Invoice } from '../types';

export function exportTransactionsToCsv(transactions: Transaction[], filename = 'finflow_transactions.csv') {
  const headers = ['Transaction ID', 'Endpoint', 'Method', 'Status', 'Status Code', 'Latency (ms)', 'Amount', 'Currency', 'Customer', 'Customer Email', 'Description', 'Timestamp', 'Live Mode', 'Fee'];
  
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.endpoint}"`,
    `"${t.method}"`,
    `"${t.status}"`,
    t.statusCode,
    t.latencyMs,
    t.amount.toFixed(2),
    `"${t.currency}"`,
    `"${t.customer}"`,
    `"${t.customerEmail || ''}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.timestamp}"`,
    t.livemode ? 'Live' : 'Test',
    t.fee.toFixed(2)
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportInvoicesToCsv(invoices: Invoice[], filename = 'finflow_invoices.csv') {
  const headers = ['Invoice ID', 'Invoice #', 'Client Name', 'Client Email', 'Amount', 'Currency', 'Status', 'Issue Date', 'Due Date', 'Days Overdue', 'Notes'];
  
  const rows = invoices.map(inv => [
    `"${inv.id}"`,
    `"${inv.invoiceNumber}"`,
    `"${inv.clientName}"`,
    `"${inv.clientEmail}"`,
    inv.amount.toFixed(2),
    `"${inv.currency}"`,
    `"${inv.status}"`,
    `"${inv.issueDate}"`,
    `"${inv.dueDate}"`,
    inv.daysOverdue || 0,
    `"${(inv.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerPrintStatement() {
  window.print();
}
