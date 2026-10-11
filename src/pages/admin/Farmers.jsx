import { useState } from 'react';
import { api } from '../../api';
import { Async, Modal, PageHeader, StatusBadge, Table, Tabs, fmt, useAction, useLoad } from '../../components/ui';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'To verify' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function Farmers() {
  const state = useLoad(() => api.get('/api/admin/farmers'));
  const { run, busy } = useAction();
  const [filter, setFilter] = useState('ALL');
  const [viewId, setViewId] = useState(null);

  const setStatus = async (id, status) => {
    const r = await run(() => api.put(`/api/admin/farmers/${id}/status`, { status }), `Farmer ${fmt.label(status).toLowerCase()}`);
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="Farmers" subtitle="Verify farmers before buying from them." />
      <div className="card">
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
        <Async state={state}>
          {(list) => (
            <Table
              rows={list.filter((f) => filter === 'ALL' || f.verificationStatus === filter)}
              empty="No farmers in this view."
              columns={[
                { header: 'Farmer', render: (f) => <><strong>{fmt.name(f.user)}</strong><div className="sub">{f.user.email}</div></> },
                { header: 'Phone', render: (f) => f.user.phone || '-' },
                { header: 'Registered', render: (f) => fmt.date(f.registrationDate) },
                { header: 'Status', render: (f) => <StatusBadge status={f.verificationStatus} /> },
                {
                  header: '',
                  className: 'right nowrap',
                  render: (f) => (
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn small secondary" onClick={() => setViewId(f.id)}>View</button>
                      {f.verificationStatus !== 'VERIFIED' && <button className="btn small" disabled={busy} onClick={() => setStatus(f.id, 'VERIFIED')}>Verify</button>}
                      {f.verificationStatus === 'PENDING' && <button className="btn small danger" disabled={busy} onClick={() => setStatus(f.id, 'REJECTED')}>Reject</button>}
                      {f.verificationStatus === 'VERIFIED' && <button className="btn small danger" disabled={busy} onClick={() => setStatus(f.id, 'SUSPENDED')}>Suspend</button>}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Async>
      </div>
      {viewId && <FarmerDetail id={viewId} onClose={() => setViewId(null)} />}
    </>
  );
}

function FarmerDetail({ id, onClose }) {
  const state = useLoad(() => api.get(`/api/admin/farmers/${id}`), [id]);
  return (
    <Modal wide title="Farmer details" onClose={onClose} footer={<button className="btn secondary" onClick={onClose}>Close</button>}>
      <Async state={state}>
        {({ farmer, locations, products }) => (
          <div className="stack">
            <dl className="kv">
              <dt>Name</dt><dd>{fmt.name(farmer.user)}</dd>
              <dt>Email</dt><dd>{farmer.user.email}</dd>
              <dt>Phone</dt><dd>{farmer.user.phone || '-'}</dd>
              <dt>Status</dt><dd><StatusBadge status={farmer.verificationStatus} /></dd>
            </dl>
            <div>
              <h2>Locations</h2>
              <Table
                rows={locations}
                empty="No locations."
                columns={[
                  { header: 'Province', render: (l) => l.province || '-' },
                  { header: 'Municipality', render: (l) => l.municipality || '-' },
                  { header: 'Town', render: (l) => l.town || '-' },
                  { header: 'Address', render: (l) => l.address || '-' },
                ]}
              />
            </div>
            <div>
              <h2>Products supplied</h2>
              <Table
                rows={products}
                empty="No products listed."
                columns={[
                  { header: 'Product', render: (p) => p.product.productName },
                  { header: 'Available', render: (p) => `${fmt.num(p.availableQuantity)} ${p.unit || ''}` },
                  { header: 'Asking price', render: (p) => fmt.money(p.price) },
                  { header: 'Status', render: (p) => <StatusBadge status={p.availabilityStatus} /> },
                ]}
              />
            </div>
          </div>
        )}
      </Async>
    </Modal>
  );
}
