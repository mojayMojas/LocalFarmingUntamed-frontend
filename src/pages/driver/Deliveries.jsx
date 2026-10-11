import { api } from '../../api';
import { Async, PageHeader, StatusBadge, Table, fmt, useAction, useLoad } from '../../components/ui';

const NEXT = {
  SCHEDULED: [{ status: 'IN_TRANSIT', label: 'Start delivery' }, { status: 'FAILED', label: 'Report problem', danger: true }],
  IN_TRANSIT: [{ status: 'DELIVERED', label: 'Confirm delivered' }, { status: 'FAILED', label: 'Report problem', danger: true }],
};

export default function DriverDeliveries() {
  const state = useLoad(() => api.get('/api/driver/deliveries'));
  const { run, busy } = useAction();

  const update = async (id, status) => {
    if (status === 'FAILED' && !window.confirm('Mark this delivery as failed? The platform owner will be told to reschedule.')) return;
    const r = await run(() => api.post(`/api/driver/deliveries/${id}/status`, { status }), 'Delivery updated');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="My deliveries" subtitle="Deliveries assigned to you." />
      <Async state={state}>
        {(list) =>
          list.length === 0 ? (
            <div className="card empty">No deliveries assigned yet.</div>
          ) : (
            list.map((d) => (
              <div className="card" key={d.id} style={{ marginBottom: 16 }}>
                <div className="row spread">
                  <h2 style={{ margin: 0 }}>Order #{d.orderId}</h2>
                  <StatusBadge status={d.status} />
                </div>
                <dl className="kv" style={{ margin: '12px 0' }}>
                  <dt>Deliver to</dt><dd>{d.customerCompany}<div>{d.deliveryAddress}</div></dd>
                  <dt>Contact</dt><dd>{d.contactName}{d.contactPhone ? `, ${d.contactPhone}` : ''}</dd>
                  <dt>Scheduled</dt><dd>{fmt.date(d.scheduledDate)}</dd>
                  {d.deliveryDate && (<><dt>Delivered</dt><dd>{fmt.date(d.deliveryDate)}</dd></>)}
                </dl>
                <Table
                  rows={d.items}
                  columns={[
                    { header: 'Product', render: (i) => i.productName },
                    { header: 'Quantity', render: (i) => `${fmt.num(i.quantity)} ${i.unit || ''}` },
                  ]}
                />
                {NEXT[d.status] && (
                  <div className="row" style={{ marginTop: 14 }}>
                    {NEXT[d.status].map((a) => (
                      <button key={a.status} className={`btn ${a.danger ? 'danger' : ''}`} disabled={busy} onClick={() => update(d.id, a.status)}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        }
      </Async>
    </>
  );
}
