import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Async, PageHeader, Stat, fmt, useLoad } from '../../components/ui';

export default function Dashboard() {
  const state = useLoad(() => api.get('/api/admin/reports/summary'));
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where the business stands today." />
      <Async state={state}>
        {(s) => {
          const farmers = s.farmersByStatus || {};
          const orders = s.ordersByStatus || {};
          const totalFarmers = Object.values(farmers).reduce((a, b) => a + b, 0);
          return (
            <div className="stack">
              <div className="grid cols-4">
                <Stat label="Revenue received" value={fmt.money(s.revenueReceived)} sub="Confirmed Ozow payments" />
                <Stat label="Paid to farmers" value={fmt.money(s.farmerPaymentsMade)} sub={`${s.farmerPaymentsPending} payment(s) pending`} />
                <Stat label="Stock value" value={fmt.money(s.stockValueAtSellingPrice)} sub={`${s.inventoryLines} stock line(s) at selling price`} />
                <Stat label="Customers" value={s.customerCount} />
              </div>

              <div className="card">
                <h2>Needs your attention</h2>
                <div className="grid cols-4">
                  <Todo to="/admin/farmers" n={farmers.PENDING || 0} label="farmers to verify" />
                  <Todo to="/admin/deliveries" n={s.ordersAwaitingDelivery} label="paid orders to schedule" />
                  <Todo to="/admin/requirements" n={s.openRequirements} label="open customer requirements" />
                  <Todo to="/admin/purchase-orders" n={s.purchaseOrdersAwaitingFarmer} label="purchase orders awaiting a farmer" />
                </div>
              </div>

              <div className="grid cols-2">
                <div className="card">
                  <h2>Farmers ({totalFarmers})</h2>
                  <Breakdown data={farmers} />
                </div>
                <div className="card">
                  <h2>Customer orders</h2>
                  <Breakdown data={orders} />
                </div>
              </div>
            </div>
          );
        }}
      </Async>
    </>
  );
}

function Todo({ to, n, label }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="stat">
        <span className="value" style={{ color: n > 0 ? 'var(--earth-500)' : 'var(--green-700)' }}>{n}</span>
        <span className="label">{label}</span>
      </div>
    </Link>
  );
}

function Breakdown({ data }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div className="muted">Nothing yet.</div>;
  return (
    <dl className="kv" style={{ gridTemplateColumns: '1fr auto' }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{fmt.label(k)}</dt>
          <dd><strong>{v}</strong></dd>
        </div>
      ))}
    </dl>
  );
}
