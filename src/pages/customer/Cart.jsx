import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useCart } from '../../cart';
import { Alert, PageHeader, Table, fmt, useToast } from '../../components/ui';

export default function Cart() {
  const cart = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const checkout = async (payNow) => {
    setBusy(true);
    setError('');
    try {
      const order = await api.post('/api/customer/orders', {
        items: cart.lines.map((l) => ({ inventoryId: l.inventoryId, quantity: l.quantity })),
      });
      cart.clear();
      if (!payNow) {
        toast(`Order #${order.id} placed. Pay from My orders to confirm it.`);
        navigate('/customer/orders');
        return;
      }
      await startPayment(order.id);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (cart.lines.length === 0) {
    return (
      <>
        <PageHeader title="Cart" />
        <div className="card empty">Your cart is empty. <Link to="/customer">Browse products</Link></div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Cart" subtitle="Check your order, then pay securely with Ozow instant EFT." />
      {error && <Alert type="error">{error}</Alert>}
      <div className="card">
        <Table
          rows={cart.lines.map((l) => ({ ...l, id: l.inventoryId }))}
          columns={[
            { header: 'Product', render: (l) => <strong>{l.productName}</strong> },
            { header: 'Price', render: (l) => `${fmt.money(l.unitPrice)} / ${l.unit || 'unit'}` },
            {
              header: 'Quantity',
              render: (l) => (
                <input
                  className="qty-input"
                  type="number"
                  min="0"
                  max={l.maxQuantity}
                  step="0.001"
                  value={l.quantity}
                  onChange={(e) => cart.setQuantity({ inventoryId: l.inventoryId, productName: l.productName, unit: l.unit, sellingPrice: l.unitPrice, availableQuantity: l.maxQuantity }, e.target.value)}
                />
              ),
            },
            { header: 'Subtotal', className: 'right', render: (l) => fmt.money(l.quantity * l.unitPrice) },
            { header: '', className: 'right', render: (l) => <button className="btn small danger" onClick={() => cart.remove(l.inventoryId)}>Remove</button> },
          ]}
        />
        <div className="row spread" style={{ marginTop: 16 }}>
          <h2 style={{ margin: 0 }}>Total: {fmt.money(cart.total)}</h2>
          <div className="row">
            <button className="btn secondary" disabled={busy} onClick={() => checkout(false)}>Place order, pay later</button>
            <button className="btn" disabled={busy} onClick={() => checkout(true)}>{busy ? 'Please wait...' : 'Place order & pay with Ozow'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Creates the Ozow payment for an order and sends the browser to the Ozow page (or the mock page in development). */
export async function startPayment(orderId) {
  const res = await api.post(`/api/customer/orders/${orderId}/pay`);
  window.location.href = res.redirectUrl;
}
