import { api } from '../../api';
import { Async, PageHeader, StatusBadge, Table, fmt, useAction, useLoad } from '../../components/ui';

const STATUSES = ['OPEN', 'REVIEWED', 'SOURCING', 'FULFILLED', 'CLOSED'];

export default function Requirements() {
  const state = useLoad(() => api.get('/api/admin/requirements'));
  const { run, busy } = useAction();

  const setStatus = async (id, status) => {
    const r = await run(() => api.put(`/api/admin/requirements/${id}/status`, { status }), 'Status updated');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="Customer requirements" subtitle="What customers asked for, compared with the stock you hold. A shortfall means you need to source more from farmers." />
      <div className="card">
        <Async state={state}>
          {(list) => (
            <Table
              rows={list.map((x) => ({ ...x, id: x.requirement.id }))}
              empty="No requirements submitted yet."
              columns={[
                { header: 'Customer', render: (x) => <><strong>{x.requirement.customer.companyName}</strong><div className="sub">{fmt.date(x.requirement.createdAt)}</div></> },
                { header: 'Product', render: (x) => x.requirement.product.productName },
                { header: 'Needs', render: (x) => `${fmt.num(x.requirement.quantity)} ${x.requirement.unit || ''}` },
                { header: 'By', render: (x) => fmt.date(x.requirement.requiredDate) },
                { header: 'Specifications', render: (x) => x.requirement.specifications || '-' },
                { header: 'In stock', render: (x) => fmt.num(x.availableStock) },
                {
                  header: 'Shortfall',
                  render: (x) => (Number(x.shortfall) > 0 ? <span className="badge bad">{fmt.num(x.shortfall)} short</span> : <span className="badge good">Covered</span>),
                },
                {
                  header: 'Status',
                  render: (x) => (
                    <select value={x.requirement.status} disabled={busy} onChange={(e) => setStatus(x.requirement.id, e.target.value)} style={{ width: 'auto' }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{fmt.label(s)}</option>)}
                    </select>
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
