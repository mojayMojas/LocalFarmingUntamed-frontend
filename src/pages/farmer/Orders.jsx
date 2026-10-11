import { api } from '../../api';
import { Async, PageHeader, StatusBadge, Table, fmt, useAction, useLoad } from '../../components/ui';

export default function FarmerOrders() {
  const state = useLoad(() => api.get('/api/farmer/purchase-orders'));
  const { run, busy } = useAction();

  const respond = async (id, accept) => {
    const r = await run(() => api.post(`/api/farmer/purchase-orders/${id}/${accept ? 'confirm' : 'decline'}`), accept ? 'Supply confirmed' : 'Request declined');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="Supply requests" subtitle="Purchase orders from the platform. Confirm the ones you can deliver." />
      <Async state={state}>
        {(list) =>
          list.length === 0 ? (
            <div className="card empty">No supply requests yet.</div>
          ) : (
            list.map(({ purchaseOrder: po, items }) => (
              <div className="card" key={po.id} style={{ marginBottom: 16 }}>
                <div className="row spread">
                  <h2 style={{ marginBottom: 0 }}>Purchase order #{po.id}</h2>
                  <StatusBadge status={po.status} />
                </div>
                <p className="muted" style={{ margin: '4px 0 12px' }}>Ordered {fmt.date(po.orderDate)}</p>
                <Table
                  rows={items}
                  columns={[
                    { header: 'Product', render: (i) => i.product.productName },
                    { header: 'Quantity', render: (i) => `${fmt.num(i.quantity)} ${i.product.unit || ''}` },
                    { header: 'Price / unit', render: (i) => fmt.money(i.unitPrice) },
                    { header: 'Subtotal', className: 'right', render: (i) => fmt.money(i.subtotal) },
                  ]}
                />
                <div className="row spread" style={{ marginTop: 12 }}>
                  <strong>Total: {fmt.money(po.totalAmount)}</strong>
                  {po.status === 'PENDING' && (
                    <div className="row">
                      <button className="btn danger" disabled={busy} onClick={() => respond(po.id, false)}>Decline</button>
                      <button className="btn" disabled={busy} onClick={() => respond(po.id, true)}>Confirm supply</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        }
      </Async>
    </>
  );
}
