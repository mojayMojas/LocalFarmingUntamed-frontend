import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';

const NAV = {
  ADMIN: [
    { group: 'Overview' },
    { to: '/admin', label: 'Dashboard', end: true },
    { group: 'People' },
    { to: '/admin/farmers', label: 'Farmers' },
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin/drivers', label: 'Drivers' },
    { group: 'Sourcing' },
    { to: '/admin/catalog', label: 'Products' },
    { to: '/admin/purchase-orders', label: 'Purchase orders' },
    { to: '/admin/receiving', label: 'Receiving & quality' },
    { to: '/admin/farmer-payments', label: 'Farmer payments' },
    { group: 'Processing' },
    { to: '/admin/processing', label: 'Processing' },
    { to: '/admin/inventory', label: 'Inventory & pricing' },
    { group: 'Sales' },
    { to: '/admin/requirements', label: 'Customer requirements' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/deliveries', label: 'Deliveries' },
    { to: '/admin/finance', label: 'Payments & invoices' },
  ],
  FARMER: [
    { to: '/farmer', label: 'My profile', end: true },
    { to: '/farmer/products', label: 'What I supply' },
    { to: '/farmer/orders', label: 'Supply requests' },
    { to: '/farmer/payments', label: 'Payments received' },
  ],
  CUSTOMER: [
    { to: '/customer', label: 'Shop products', end: true },
    { to: '/customer/cart', label: 'Cart', cart: true },
    { to: '/customer/orders', label: 'My orders' },
    { to: '/customer/requirements', label: 'My requirements' },
    { to: '/customer/invoices', label: 'Invoices' },
    { to: '/customer/profile', label: 'Company profile' },
  ],
  DRIVER: [{ to: '/driver', label: 'My deliveries', end: true }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get('/api/notifications/unread-count')
        .then((r) => alive && setUnread(r.count))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const items = NAV[user.role] || [];
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">F</span> FarmLink
        </div>
        {items.map((item, i) =>
          item.group ? (
            <div key={i} className="nav-group">{item.group}</div>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
              {item.cart && cart.count > 0 && <span className="nav-count">{cart.count}</span>}
            </NavLink>
          )
        )}
        <div className="sidebar-footer">
          <div className="who">{user.firstName} {user.lastName}</div>
          <div>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</div>
          <button className="btn small secondary" style={{ marginTop: 10 }} onClick={logout}>Log out</button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <Link to="/notifications" className="bell">
            Notifications
            {unread > 0 && <span className="dot">{unread}</span>}
          </Link>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
