import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useCart } from '../../cart';
import { Async, PageHeader, Table, fmt, useLoad } from '../../components/ui';

export default function Shop() {
  const state = useLoad(() => api.get('/api/customer/catalog'));
  const cart = useCart();
  const [search, setSearch] = useState('');

  return (
    <>
      <PageHeader title="Shop products" subtitle="Processed, quality-checked produce available for bulk order." />
      <div className="card">
        <Async state={state}>
          {(items) => <Catalog items={items} cart={cart} search={search} setSearch={setSearch} />}
        </Async>
      </div>
      {cart.count > 0 && (
        <div className="cart-bar">
          <span>{cart.count} item{cart.count > 1 ? 's' : ''} in cart - {fmt.money(cart.total)}</span>
          <Link to="/customer/cart" className="btn">Review cart</Link>
        </div>
      )}
    </>
  );
}

function Catalog({ items, cart, search, setSearch }) {
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => `${i.productName} ${i.category}`.toLowerCase().includes(q)) : items;
  }, [items, search]);
  const inCart = (id) => cart.lines.find((l) => l.inventoryId === id)?.quantity ?? '';

  return (
    <>
      <div className="field" style={{ maxWidth: 320 }}>
        <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table
        rows={shown.map((i) => ({ ...i, id: i.inventoryId }))}
        empty={items.length === 0 ? 'No stock is available right now. Submit a requirement and we will source it for you.' : 'No products match your search.'}
        columns={[
          { header: 'Product', render: (i) => <><strong>{i.productName}</strong><div className="sub">{i.category}</div></> },
          { header: 'Price', render: (i) => `${fmt.money(i.sellingPrice)} / ${i.unit || 'unit'}` },
          { header: 'In stock', render: (i) => `${fmt.num(i.availableQuantity)} ${i.unit || ''}` },
          {
            header: 'Order quantity',
            render: (i) => (
              <input
                className="qty-input"
                type="number"
                min="0"
                max={i.availableQuantity}
                step="0.001"
                value={inCart(i.inventoryId)}
                placeholder="0"
                onChange={(e) => cart.setQuantity(i, e.target.value)}
              />
            ),
          },
        ]}
      />
    </>
  );
}
