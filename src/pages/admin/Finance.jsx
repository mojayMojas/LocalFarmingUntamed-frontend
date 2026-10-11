import { useState } from 'react';
import { api } from '../../api';
import { Async, PageHeader, StatusBadge, Table, Tabs, fmt, useLoad } from '../../components/ui';

export default function Finance() {
  const state = useLoad(async () => {
    const [payments, invoices] = await Promise.all([api.get('/api/admin/payments'), api.get('/api/admin/invoices')]);
    return { payments, invoices };
  });
  const [tab, setTab] = useState('payments');

  return (
    <>
      <PageHeader title="Payments & invoices" subtitle="Customer payments made through Ozow, and the invoices issued." />
      <div className="card">
        <Tabs tabs={[{ value: 'payments', label: 'Ozow payments' }, { value: 'invoices', label: 'Invoices' }]} value={tab} onChange={setTab} />
        <Async state={state}>
          {({ payments, invoices }) =>
            tab === 'payments' ? (
              <Table
                rows={payments}
                empty="No payments yet."
                columns={[
                  { header: 'Reference', render: (p) => <><strong>{p.ozowReference}</strong><div className="sub">{p.ozowTransactionId ? `Ozow ID ${p.ozowTransactionId}` : ''}</div></> },
                  { header: 'Order', render: (p) => `#${p.order.id}` },
                  { header: 'Customer', render: (p) => p.order.customer.companyName },
                  { header: 'Amount', render: (p) => fmt.money(p.amount) },
                  { header: 'Mode', render: (p) => (p.paymentMethod === 'OZOW_MOCK' ? <span className="badge warn">Test</span> : <span className="badge info">Ozow</span>) },
                  { header: 'Paid at', render: (p) => fmt.dateTime(p.paidAt) },
                  { header: 'Status', render: (p) => <StatusBadge status={p.paymentStatus} /> },
                ]}
              />
            ) : (
              <Table
                rows={invoices}
                empty="No invoices yet."
                columns={[
                  { header: 'Invoice', render: (i) => <strong>{i.invoiceNumber}</strong> },
                  { header: 'Order', render: (i) => `#${i.order.id}` },
                  { header: 'Customer', render: (i) => i.order.customer.companyName },
                  { header: 'Issued', render: (i) => fmt.date(i.issueDate) },
                  { header: 'Due', render: (i) => fmt.date(i.dueDate) },
                  { header: 'Amount', render: (i) => fmt.money(i.amount) },
                  { header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
                ]}
              />
            )
          }
        </Async>
      </div>
    </>
  );
}
