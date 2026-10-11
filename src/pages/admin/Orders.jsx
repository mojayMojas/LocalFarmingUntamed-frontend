import { useState } from 'react';
import { api } from '../../api';
import { Async, Modal, PageHeader, StatusBadge, Table, Tabs, fmt, useLoad } from '../../components/ui';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { value: 'PAID', label: 'Paid - to schedule' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'OUT_FOR_DELIVERY', label: 'On the road' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Orders() {
  const state = useLoad(() => api.get('/api/admin/orders'));
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  return (
    <>
      <PageHeader title="Customer orders" subtitle="Orders move to Paid automatically once Ozow confirms the payment." />
      <div className="card">
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
        <Async state={state}>
          {(list) => (
            <Table
              rows={list.filter((x) => filter === 'ALL' || x.order.status === filter).map((x) => ({ ...x, id: x.order.id }))}
              empty="No orders in this view."
              columns={[
                { header: 'Order', render: (x) => <strong>#{x.order.id}</strong> },
                { header: 'Customer', render: (x) => x.order.customer.companyName },
                { header: 'Date', render: (x) => fmt.date(x.order.orderDate) },
                { header: 'Items', render: (x) => x.items.map((i) => `${fmt.num(i.quantity)} ${i.unit || ''} ${i.productName}`).join(', ') },
                { header: 'Total', render: (x) => fmt.money(x.order.totalAmount) },
                { header: 'Payment', render: (x) => <StatusBadge status={x.paymentStatus} /> },
                { header: 'Status', render: (x) => <StatusBadge status={x.order.status} /> },
                { header: '', className: 'right', render: (x) => <button className="btn small secondary" onClick={() => setSelected(x)}>View</button> },
              ]}
            />
          )}
        </Async>
      </div>
      {selected && (
        <Modal wide title={`Order #${selected.order.id}`} onClose={() => setSelected(null)} footer={<button className="btn secondary" onClick={() => setSelected(null)}>Close</button>}>
          <dl className="kv" style={{ marginBottom: 16 }}>
            <dt>Customer</dt><dd>{selected.order.customer.companyName}</dd>
            <dt>Contact</dt><dd>{fmt.name(selected.order.customer.user)}, {selected.order.customer.user.phone || 'no phone'}</dd>
            <dt>Address</dt><dd>{selected.order.customer.address || '-'}</dd>
            <dt>Status</dt><dd><StatusBadge status={selected.order.status} /></dd>
            <dt>Payment</dt><dd><StatusBadge status={selected.paymentStatus} /></dd>
          </dl>
          <Table
            rows={selected.items}
            columns={[
              { header: 'Product', render: (i) => i.productName },
              { header: 'Quantity', render: (i) => `${fmt.num(i.quantity)} ${i.unit || ''}` },
              { header: 'Price', render: (i) => fmt.money(i.unitPrice) },
              { header: 'Subtotal', className: 'right', render: (i) => fmt.money(i.subtotal) },
            ]}
          />
          <h2 className="right" style={{ marginTop: 12 }}>Total {fmt.money(selected.order.totalAmount)}</h2>
        </Modal>
      )}
    </>
  );
}
