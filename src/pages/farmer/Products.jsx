import { useState } from 'react';
import { api } from '../../api';
import { Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, useAction, useForm, useLoad } from '../../components/ui';

export default function FarmerProducts() {
  const state = useLoad(async () => {
    const [mine, catalogue] = await Promise.all([api.get('/api/farmer/products'), api.get('/api/reference/products')]);
    return { mine, catalogue };
  });
  const { run, busy } = useAction();
  const [editing, setEditing] = useState(null); // null | 'new' | farmerProduct

  const remove = async (fp) => {
    if (!window.confirm(`Stop listing ${fp.product.productName}?`)) return;
    const r = await run(() => api.del(`/api/farmer/products/${fp.id}`), 'Removed');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader
        title="What I supply"
        subtitle="List the products you can supply, how much is available and the price you ask per unit."
        actions={<button className="btn" onClick={() => setEditing('new')}>Add product</button>}
      />
      <div className="card">
        <Async state={state}>
          {({ mine, catalogue }) => (
            <>
              <Table
                rows={mine}
                empty="You have not listed any products yet."
                columns={[
                  { header: 'Product', render: (fp) => <><strong>{fp.product.productName}</strong><div className="sub">{fp.product.category?.categoryName}</div></> },
                  { header: 'Available', render: (fp) => `${fmt.num(fp.availableQuantity)} ${fp.unit || ''}` },
                  { header: 'My price', render: (fp) => `${fmt.money(fp.price)} / ${fp.unit || 'unit'}` },
                  { header: 'Status', render: (fp) => <StatusBadge status={fp.availabilityStatus} /> },
                  {
                    header: '',
                    className: 'right nowrap',
                    render: (fp) => (
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn small secondary" onClick={() => setEditing(fp)}>Edit</button>
                        <button className="btn small danger" disabled={busy} onClick={() => remove(fp)}>Remove</button>
                      </div>
                    ),
                  },
                ]}
              />
              {editing && (
                <ProductForm
                  existing={editing === 'new' ? null : editing}
                  catalogue={catalogue}
                  listedIds={mine.map((m) => m.product.id)}
                  onClose={() => setEditing(null)}
                  onSaved={() => {
                    setEditing(null);
                    state.reload();
                  }}
                />
              )}
            </>
          )}
        </Async>
      </div>
    </>
  );
}

function ProductForm({ existing, catalogue, listedIds, onClose, onSaved }) {
  const available = catalogue.filter((p) => !listedIds.includes(p.id));
  const { values, bind, setValues } = useForm({
    productId: existing ? existing.product.id : available[0]?.id ?? '',
    availableQuantity: existing?.availableQuantity ?? '',
    unit: existing?.unit ?? '',
    price: existing?.price ?? '',
    availabilityStatus: existing?.availabilityStatus ?? 'AVAILABLE',
  });
  const { run, busy } = useAction();
  const chosen = catalogue.find((p) => String(p.id) === String(values.productId));

  const save = async () => {
    const body = {
      productId: Number(values.productId),
      availableQuantity: Number(values.availableQuantity),
      unit: values.unit || chosen?.unit || null,
      price: Number(values.price),
      availabilityStatus: values.availabilityStatus,
    };
    const r = await run(
      () => (existing ? api.put(`/api/farmer/products/${existing.id}`, body) : api.post('/api/farmer/products', body)),
      existing ? 'Product updated' : 'Product listed'
    );
    if (r.ok) onSaved();
  };

  return (
    <Modal
      title={existing ? `Edit ${existing.product.productName}` : 'List a product'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.productId || values.availableQuantity === '' || values.price === ''} onClick={save}>Save</button>
        </>
      }
    >
      {!existing && available.length === 0 ? (
        <p>You have already listed every product we buy. Ask the platform owner to add more products.</p>
      ) : (
        <div className="form-grid">
          <Field label="Product" full>
            {existing ? (
              <input value={existing.product.productName} disabled />
            ) : (
              <select value={values.productId} onChange={(e) => setValues((v) => ({ ...v, productId: e.target.value, unit: '' }))}>
                {available.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
              </select>
            )}
          </Field>
          <Field label="Quantity available"><input type="number" min="0" step="0.001" {...bind('availableQuantity')} /></Field>
          <Field label="Unit" hint={chosen?.unit ? `Default: ${chosen.unit}` : ''}><input placeholder={chosen?.unit || 'kg'} {...bind('unit')} /></Field>
          <Field label="My price per unit (ZAR)"><input type="number" min="0" step="0.01" {...bind('price')} /></Field>
          <Field label="Availability">
            <select {...bind('availabilityStatus')}>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </Field>
        </div>
      )}
    </Modal>
  );
}
