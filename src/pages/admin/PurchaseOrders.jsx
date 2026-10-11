import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, today, useAction, useForm, useLoad } from '../../components/ui';

export default function PurchaseOrders() {
  const state = useLoad(() => api.get('/api/admin/purchase-orders'));
  const { run, busy } = useAction();
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState(null);

  const cancel = async (id) => {
    if (!window.confirm(`Cancel purchase order #${id}?`)) return;
    const r = await run(() => api.post(`/api/admin/purchase-orders/${id}/cancel`), 'Purchase order cancelled');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader
        title="Purchase orders"
        subtitle="Buy produce from verified farmers. The farmer confirms, then you record the delivery."
        actions={<button className="btn" onClick={() => setCreating(true)}>New purchase order</button>}
      />
      <div className="card">
        <Async state={state}>
          {(list) => (
            <Table
              rows={list.map((x) => ({ ...x, id: x.purchaseOrder.id }))}
              empty="No purchase orders yet."
              columns={[
                { header: 'PO', render: (x) => <strong>#{x.purchaseOrder.id}</strong> },
                { header: 'Farmer', render: (x) => fmt.name(x.purchaseOrder.farmer.user) },
                { header: 'Items', render: (x) => x.items.map((i) => `${fmt.num(i.quantity)} ${i.product.unit || ''} ${i.product.productName}`).join(', ') },
                { header: 'Total', render: (x) => fmt.money(x.purchaseOrder.totalAmount) },
                { header: 'Date', render: (x) => fmt.date(x.purchaseOrder.orderDate) },
                { header: 'Status', render: (x) => <StatusBadge status={x.purchaseOrder.status} /> },
                {
                  header: '',
                  className: 'right nowrap',
                  render: (x) => (
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      {['CONFIRMED', 'RECEIVED'].includes(x.purchaseOrder.status) && (
                        <button className="btn small" onClick={() => setReceiving(x)}>Record delivery</button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(x.purchaseOrder.status) && (
                        <button className="btn small danger" disabled={busy} onClick={() => cancel(x.purchaseOrder.id)}>Cancel</button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Async>
      </div>
      {creating && (
        <CreateForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            state.reload();
          }}
        />
      )}
      {receiving && (
        <ReceiveForm
          po={receiving}
          onClose={() => setReceiving(null)}
          onSaved={() => {
            setReceiving(null);
            state.reload();
          }}
        />
      )}
    </>
  );
}

function CreateForm({ onClose, onSaved }) {
  const farmersState = useLoad(() => api.get('/api/admin/farmers'));
  const [farmerId, setFarmerId] = useState('');
  const [offers, setOffers] = useState([]);
  const [lines, setLines] = useState([]);
  const { run, busy } = useAction();

  const verified = (farmersState.data || []).filter((f) => f.verificationStatus === 'VERIFIED');

  useEffect(() => {
    setLines([]);
    setOffers([]);
    if (!farmerId) return;
    api.get(`/api/admin/farmer-products?farmerId=${farmerId}`).then(setOffers).catch(() => {});
  }, [farmerId]);

  const addLine = (offer) =>
    setLines((l) =>
      l.some((x) => x.productId === offer.product.id)
        ? l
        : [...l, { productId: offer.product.id, name: offer.product.productName, unit: offer.unit || offer.product.unit, max: offer.availableQuantity, quantity: '', unitPrice: offer.price }]
    );
  const setLine = (productId, patch) => setLines((l) => l.map((x) => (x.productId === productId ? { ...x, ...patch } : x)));
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const valid = farmerId && lines.length > 0 && lines.every((l) => Number(l.quantity) > 0 && Number(l.unitPrice) >= 0);

  const save = async () => {
    const r = await run(
      () =>
        api.post('/api/admin/purchase-orders', {
          farmerId: Number(farmerId),
          items: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
        }),
      'Purchase order sent to farmer'
    );
    if (r.ok) onSaved();
  };

  return (
    <Modal
      wide
      title="New purchase order"
      onClose={onClose}
      footer={
        <>
          <span style={{ marginRight: 'auto' }}><strong>Total {fmt.money(total)}</strong></span>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !valid} onClick={save}>Send to farmer</button>
        </>
      }
    >
      <Field label="Farmer" hint="Only verified farmers can be ordered from">
        <select value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
          <option value="">Select a farmer...</option>
          {verified.map((f) => <option key={f.id} value={f.id}>{fmt.name(f.user)}</option>)}
        </select>
      </Field>
      {farmerId && offers.length === 0 && <Alert type="info">This farmer has not listed any products yet.</Alert>}
      {offers.length > 0 && (
        <Field label="Products this farmer offers (click to add)">
          <div className="row">
            {offers.map((o) => (
              <button
                key={o.id}
                type="button"
                className="btn small secondary"
                disabled={lines.some((l) => l.productId === o.product.id)}
                onClick={() => addLine(o)}
              >
                + {o.product.productName} ({fmt.num(o.availableQuantity)} {o.unit || ''} @ {fmt.money(o.price)})
              </button>
            ))}
          </div>
        </Field>
      )}
      {lines.length > 0 && (
        <Table
          rows={lines.map((l) => ({ ...l, id: l.productId }))}
          columns={[
            { header: 'Product', render: (l) => <strong>{l.name}</strong> },
            {
              header: `Quantity`,
              render: (l) => (
                <input className="qty-input" type="number" min="0" step="0.001" value={l.quantity} onChange={(e) => setLine(l.productId, { quantity: e.target.value })} placeholder={`max ${fmt.num(l.max)}`} />
              ),
            },
            { header: 'Unit', render: (l) => l.unit || '-' },
            {
              header: 'Price / unit',
              render: (l) => (
                <input className="qty-input" type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => setLine(l.productId, { unitPrice: e.target.value })} />
              ),
            },
            { header: 'Subtotal', className: 'right', render: (l) => fmt.money((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)) },
            { header: '', render: (l) => <button className="btn small danger" onClick={() => setLines((x) => x.filter((y) => y.productId !== l.productId))}>x</button> },
          ]}
        />
      )}
    </Modal>
  );
}

function ReceiveForm({ po, onClose, onSaved }) {
  const first = po.items[0];
  const expected = po.items.reduce((s, i) => s + Number(i.quantity), 0);
  const { values, bind } = useForm({ quantity: expected, unit: first?.product.unit || '', receivedDate: today() });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(
      () => api.post(`/api/admin/purchase-orders/${po.purchaseOrder.id}/receive`, { quantity: Number(values.quantity), unit: values.unit || null, receivedDate: values.receivedDate || null }),
      'Delivery recorded - ready for quality inspection'
    );
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={`Record delivery for PO #${po.purchaseOrder.id}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !(Number(values.quantity) > 0)} onClick={save}>Record delivery</button>
        </>
      }
    >
      <p className="muted">Ordered: {po.items.map((i) => `${fmt.num(i.quantity)} ${i.product.unit || ''} ${i.product.productName}`).join(', ')}</p>
      <div className="form-grid">
        <Field label="Quantity actually received"><input type="number" min="0" step="0.001" {...bind('quantity')} /></Field>
        <Field label="Unit"><input {...bind('unit')} /></Field>
        <Field label="Received on"><input type="date" max={today()} {...bind('receivedDate')} /></Field>
      </div>
    </Modal>
  );
}
