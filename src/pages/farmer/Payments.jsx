import { api } from '../../api';
import { Async, PageHeader, Stat, StatusBadge, Table, fmt, useLoad } from '../../components/ui';

export default function FarmerPayments() {
  const state = useLoad(() => api.get('/api/farmer/payments'));
  return (
    <>
      <PageHeader title="Payments received" subtitle="What the platform has paid you for accepted deliveries." />
      <Async state={state}>
        {(list) => {
          const paid = list.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
          const pending = list.filter((p) => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
          return (
            <div className="stack">
              <div className="grid cols-2">
                <Stat label="Paid to you" value={fmt.money(paid)} />
                <Stat label="Awaiting payment" value={fmt.money(pending)} />
              </div>
              <div className="card">
                <Table
                  rows={list}
                  empty="No payments yet."
                  columns={[
                    { header: 'Purchase order', render: (p) => `#${p.purchaseOrder.id}` },
                    { header: 'Amount', render: (p) => fmt.money(p.amount) },
                    { header: 'Method', render: (p) => p.paymentMethod || '-' },
                    { header: 'Reference', render: (p) => p.reference || '-' },
                    { header: 'Date', render: (p) => fmt.date(p.paymentDate) },
                    { header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
                  ]}
                />
              </div>
            </div>
          );
        }}
      </Async>
    </>
  );
}
