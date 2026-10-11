import { useState } from 'react';
import { api } from '../../api';
import { Async, Modal, PageHeader, StatusBadge, Table, fmt, useAction, useLoad } from '../../components/ui';
import { startPayment } from './Cart';

export default function Orders() {
  const state = useLoad(() => api.get('/api/customer/orders'));
  const { run, busy } = useAction();
  const [selected, setSelected] = useState(null);

  const pay = async (id) => {
    await run(() => startPayment(id));
  };
  const cancel = async (id) => {
    if (!window.confirm('Cancel this unpaid order? The stock will be released.')) return;
    const r = await run(() => api.post(`/api/customer/orders/${id}/cancel`), 'Order cancelled');
    if (r.ok) {
      setSelected(null);
      state.reload();
    }
  };

  return (
    <>
      <PageHeader title="My orders" subtitle="Track payment and delivery for each order." />
      <div className="card">
        <Async state={state}>
          {(orders) => (
            <>
              <Table
                rows={orders}
                empty="You have not placed any orders yet."
                columns={[
                  { header: 'Order', render: (o) => <strong>#{o.id}</strong> },
                  { header: 'Date', render: (o) => fmt.date(o.orderDate) },
                  { header: 'Items', render: (o) => o.items.map((i) => i.productName).join(', ') },
                  { header: 'Total', render: (o) => fmt.money(o.totalAmount) },
                  { header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
                  {
                    header: '',
                    className: 'right nowrap',
                    render: (o) => (
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn small secondary" onClick={() => setSelected(o)}>Details</button>
                        {o.status === 'PENDING_PAYMENT' && <button className="btn small" disabled={busy} onClick={() => pay(o.id)}>Pay now</button>}
                      </div>
                    ),
                  },
                ]}
              />
              {selected && (
                <OrderDetail
                  order={orders.find((o) => o.id === selected.id) || selected}
                  busy={busy}
                  onPay={() => pay(selected.id)}
                  onCancel={() => cancel(selected.id)}
                  onClose={() => setSelected(null)}
                />
              )}
            </>
          )}
        </Async>
      </div>
    </>
  );
}

function OrderDetail({ order, busy, onPay, onCancel, onClose }) {
  const d = order.delivery;
  return (
    <Modal
      wide
      title={`Order #${order.id}`}
      onClose={onClose}
      footer={
        order.status === 'PENDING_PAYMENT' ? (
          <>
            <button className="btn danger" disabled={busy} onClick={onCancel}>Cancel order</button>
            <button className="btn" disabled={busy} onClick={onPay}>Pay with Ozow</button>
          </>
        ) : (
          <button className="btn secondary" onClick={onClose}>Close</button>
        )
      }
    >
      <dl className="kv" style={{ marginBottom: 16 }}>
        <dt>Status</dt><dd><StatusBadge status={order.status} /></dd>
        <dt>Payment</dt><dd><StatusBadge status={order.paymentStatus} /></dd>
        <dt>Invoice</dt><dd>{order.invoiceNumber ? <>{order.invoiceNumber} <StatusBadge status={order.invoiceStatus} /></> : '-'}</dd>
        {d && (
          <>
            <dt>Delivery</dt>
            <dd>
              <StatusBadge status={d.status} /> scheduled {fmt.date(d.scheduledDate)}
              {d.deliveryDate && <>, delivered {fmt.date(d.deliveryDate)}</>}
              <div className="muted">To: {d.deliveryAddress}</div>
              <div className="muted">Driver: {d.driverName}{d.driverPhone ? `, ${d.driverPhone}` : ''}{d.vehicleType ? ` (${d.vehicleType} ${d.vehicleRegistration || ''})` : ''}</div>
            </dd>
          </>
        )}
      </dl>
      <Table
        rows={order.items}
        columns={[
          { header: 'Product', render: (i) => i.productName },
          { header: 'Quantity', render: (i) => `${fmt.num(i.quantity)} ${i.unit || ''}` },
          { header: 'Price', render: (i) => fmt.money(i.unitPrice) },
          { header: 'Subtotal', className: 'right', render: (i) => fmt.money(i.subtotal) },
        ]}
      />
      <h2 className="right" style={{ marginTop: 12 }}>Total {fmt.money(order.totalAmount)}</h2>
    </Modal>
  );
}
