import { api } from '../../api';
import { Async, PageHeader, StatusBadge, Table, fmt, useAction, useLoad } from '../../components/ui';

export default function Customers() {
  const state = useLoad(() => api.get('/api/admin/customers'));
  const { run, busy } = useAction();

  const setStatus = async (id, status) => {
    const r = await run(() => api.put(`/api/admin/customers/${id}/status`, { status }), 'Customer updated');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="Bulk buyers registered on the platform." />
      <div className="card">
        <Async state={state}>
          {(list) => (
            <Table
              rows={list}
              empty="No customers yet."
              columns={[
                { header: 'Company', render: (c) => <><strong>{c.companyName}</strong><div className="sub">{c.customerType}</div></> },
                { header: 'Contact', render: (c) => <>{fmt.name(c.user)}<div className="sub">{c.user.email}{c.user.phone ? `, ${c.user.phone}` : ''}</div></> },
                { header: 'Registration', render: (c) => c.businessRegistration || '-' },
                { header: 'Address', render: (c) => c.address || '-' },
                { header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
                {
                  header: '',
                  className: 'right',
                  render: (c) =>
                    c.status === 'ACTIVE' ? (
                      <button className="btn small danger" disabled={busy} onClick={() => setStatus(c.id, 'SUSPENDED')}>Suspend</button>
                    ) : (
                      <button className="btn small" disabled={busy} onClick={() => setStatus(c.id, 'ACTIVE')}>Reactivate</button>
                    ),
                },
              ]}
            />
          )}
        </Async>
      </div>
    </>
  );
}
