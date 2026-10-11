import { useState } from 'react';
import { api } from '../../api';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, today, useAction, useForm, useLoad } from '../../components/ui';

export default function Deliveries() {
  const state = useLoad(async () => {
    const [orders, deliveries, drivers] = await Promise.all([api.get('/api/admin/orders'), api.get('/api/admin/deliveries'), api.get('/api/admin/drivers')]);
    return { orders, deliveries, drivers };
  });
  const [scheduling, setScheduling] = useState(null);

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Assign a driver to every paid order. Drivers update the status from their own login." />
      <Async state={state}>
        {({ orders, deliveries, drivers }) => {
          const toSchedule = orders.filter((x) => x.order.status === 'PAID');
          return (
            <div className="stack">
              <div className="card">
                <h2>Paid orders waiting for a driver</h2>
                <Table
                  rows={toSchedule.map((x) => ({ ...x, id: x.order.id }))}
                  empty="Nothing waiting to be scheduled."
                  columns={[
                    { header: 'Order', render: (x) => <strong>#{x.order.id}</strong> },
                    { header: 'Customer', render: (x) => x.order.customer.companyName },
                    { header: 'Address', render: (x) => x.order.customer.address || '-' },
                    { header: 'Items', render: (x) => x.items.map((i) => `${fmt.num(i.quantity)} ${i.unit || ''} ${i.productName}`).join(', ') },
                    { header: '', className: 'right', render: (x) => <button className="btn small" onClick={() => setScheduling(x)}>Schedule</button> },
                  ]}
                />
              </div>
              <div className="card">
                <h2>All deliveries</h2>
                <Table
                  rows={deliveries}
                  empty="No deliveries yet."
                  columns={[
                    { header: 'Order', render: (d) => `#${d.order.id}` },
                    { header: 'Customer', render: (d) => d.order.customer.companyName },
                    { header: 'Driver', render: (d) => `${d.driver.firstName} ${d.driver.lastName}` },
                    { header: 'Address', render: (d) => d.deliveryAddress },
                    { header: 'Scheduled', render: (d) => fmt.date(d.scheduledDate) },
                    { header: 'Delivered', render: (d) => fmt.date(d.deliveryDate) },
                    { header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
                  ]}
                />
              </div>
              {scheduling && (
                <ScheduleForm
                  entry={scheduling}
                  drivers={drivers.filter((d) => d.status === 'ACTIVE')}
                  onClose={() => setScheduling(null)}
                  onSaved={() => {
                    setScheduling(null);
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

function ScheduleForm({ entry, drivers, onClose, onSaved }) {
  const { values, bind } = useForm({ driverId: drivers[0]?.id ?? '', scheduledDate: today(), deliveryAddress: entry.order.customer.address || '' });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(
      () => api.post('/api/admin/deliveries', { orderId: entry.order.id, driverId: Number(values.driverId), scheduledDate: values.scheduledDate, deliveryAddress: values.deliveryAddress || null }),
      'Delivery scheduled'
    );
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={`Schedule delivery - order #${entry.order.id}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.driverId || !values.scheduledDate} onClick={save}>Schedule</button>
        </>
      }
    >
      {drivers.length === 0 ? (
        <Alert type="warn">There are no active drivers. Add one under Drivers first.</Alert>
      ) : (
        <div className="form-grid">
          <Field label="Driver" full>
            <select {...bind('driverId')}>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} - {d.vehicleType || 'vehicle'} {d.vehicleRegistration || ''}</option>)}
            </select>
          </Field>
          <Field label="Delivery date"><input type="date" min={today()} {...bind('scheduledDate')} /></Field>
          <Field label="Delivery address" full><input {...bind('deliveryAddress')} /></Field>
        </div>
      )}
    </Modal>
  );
}
