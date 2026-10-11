import { useState } from 'react';
import { api } from '../../api';
import { Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, today, useAction, useForm, useLoad } from '../../components/ui';

export default function FarmerPayments() {
  const state = useLoad(async () => {
    const [payments, pos] = await Promise.all([api.get('/api/admin/farmer-payments'), api.get('/api/admin/purchase-orders')]);
    return { payments, pos };
  });
  const { run, busy } = useAction();
  const [paying, setPaying] = useState(null);
    const payOnline = async (p) => {
    try {
      const res = await api.post(`/api/admin/farmer-payments/${p.id}/pay-online`, {});
      window.location.href = res.redirectUrl;
    } catch (e) {
      alert(e.message);
    }
  };

  const create = async (poId) => {
    const r = await run(() => api.post('/api/admin/farmer-payments', { purchaseOrderId: poId }), 'Payment created');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="Farmer payments" subtitle="Pay the farmer after they confirm a purchase order, then record the delivery. Farmer bank details are never shown to customers." />
      <Async state={state}>
        {({ payments, pos }) => {
          const paidPoIds = new Set(payments.map((p) => p.purchaseOrder.id));
          const payable = pos.filter((x) => ['CONFIRMED', 'RECEIVED', 'ACCEPTED'].includes(x.purchaseOrder.status) && !paidPoIds.has(x.purchaseOrder.id));
          return (
            <div className="stack">
              <div className="card">
                <h2>Ready to pay</h2>
                <Table
                  rows={payable.map((x) => ({ ...x, id: x.purchaseOrder.id }))}
                  empty="No purchase orders are waiting for a payment."
                  columns={[
                    { header: 'Purchase order', render: (x) => `#${x.purchaseOrder.id}` },
                    { header: 'Farmer', render: (x) => fmt.name(x.purchaseOrder.farmer.user) },
                    { header: 'Amount', render: (x) => fmt.money(x.purchaseOrder.totalAmount) },
                    { header: '', className: 'right', render: (x) => <button className="btn small" disabled={busy} onClick={() => create(x.purchaseOrder.id)}>Create payment</button> },
                  ]}
                />
              </div>
              <div className="card">
                <h2>All farmer payments</h2>
                <Table
                  rows={payments}
                  empty="No farmer payments yet."
                  columns={[
                    { header: 'Farmer', render: (p) => fmt.name(p.farmer.user) },
                    { header: 'PO', render: (p) => `#${p.purchaseOrder.id}` },
                    { header: 'Amount', render: (p) => fmt.money(p.amount) },
                    { header: 'Method / ref', render: (p) => (p.paymentMethod ? `${p.paymentMethod}${p.reference ? ` - ${p.reference}` : ''}` : '-') },
                    { header: 'Paid on', render: (p) => fmt.date(p.paymentDate) },
                    { header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
                    { header: '', className: 'right', render: (p) => p.status === 'PENDING' && (<><button className="btn small" onClick={() => payOnline(p)}>Pay with PayFast</button> <button className="btn small secondary" onClick={() => setPaying(p)}>Mark as paid</button></>) },                  ]}
                />
              </div>
              {paying && (
                <PaidForm
                  payment={paying}
                  onClose={() => setPaying(null)}
                  onSaved={() => {
                    setPaying(null);
                    state.reload();
                  }}
                />
              )}
            </div>
          );
        }}
      </Async>
    </>
  );
}

function PaidForm({ payment, onClose, onSaved }) {
  const { values, bind } = useForm({ paymentMethod: 'EFT', reference: '', paymentDate: today() });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(() => api.post(`/api/admin/farmer-payments/${payment.id}/paid`, { paymentMethod: values.paymentMethod, reference: values.reference || null, paymentDate: values.paymentDate }), 'Marked as paid');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={`Pay ${fmt.name(payment.farmer.user)} ${fmt.money(payment.amount)}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Confirm payment made</button>
        </>
      }
    >
      <p className="muted">Make the transfer from your bank first, then record it here. The farmer is notified.</p>
      <div className="form-grid">
        <Field label="Method">
          <select {...bind('paymentMethod')}>
            <option>EFT</option>
            <option>CASH</option>
            <option>OTHER</option>
          </select>
        </Field>
        <Field label="Paid on"><input type="date" max={today()} {...bind('paymentDate')} /></Field>
        <Field label="Bank reference" full><input {...bind('reference')} /></Field>
      </div>
    </Modal>
  );
}
