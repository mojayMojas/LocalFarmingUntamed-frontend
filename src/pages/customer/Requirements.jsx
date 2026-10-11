import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, today, useAction, useForm, useLoad } from '../../components/ui';

export default function Requirements() {
  const state = useLoad(async () => {
    const [mine, products] = await Promise.all([api.get('/api/customer/requirements'), api.get('/api/reference/products')]);
    return { mine, products };
  });
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="My requirements"
        subtitle="Tell us what you need and when. If we do not have enough stock, we source the shortfall."
        actions={<button className="btn" onClick={() => setOpen(true)}>New requirement</button>}
      />
      <div className="card">
        <Async state={state}>
          {({ mine, products }) => (
            <>
              <Table
                rows={mine}
                empty="No requirements submitted yet."
                columns={[
                  { header: 'Product', render: (r) => <strong>{r.product.productName}</strong> },
                  { header: 'Quantity', render: (r) => `${fmt.num(r.quantity)} ${r.unit || ''}` },
                  { header: 'Needed by', render: (r) => fmt.date(r.requiredDate) },
                  { header: 'Specifications', render: (r) => r.specifications || '-' },
                  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                ]}
              />
              {open && (
                <RequirementForm
                  products={products}
                  onClose={() => setOpen(false)}
                  onSaved={() => {
                    setOpen(false);
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

function RequirementForm({ products, onClose, onSaved }) {
  const { values, bind } = useForm({ productId: products[0]?.id ?? '', quantity: '', unit: '', requiredDate: '', specifications: '' });
  const { run, busy } = useAction();
  const [availability, setAvailability] = useState(null);
  const chosen = products.find((p) => String(p.id) === String(values.productId));

  // Live stock check so the customer sees immediately whether it can be fulfilled from inventory.
  useEffect(() => {
    setAvailability(null);
    if (!values.productId || !(Number(values.quantity) > 0)) return;
    const id = setTimeout(() => {
      api
        .get(`/api/customer/availability?productId=${values.productId}&quantity=${values.quantity}`)
        .then(setAvailability)
        .catch(() => {});
    }, 400);
    return () => clearTimeout(id);
  }, [values.productId, values.quantity]);

  const save = async () => {
    const r = await run(
      () =>
        api.post('/api/customer/requirements', {
          productId: Number(values.productId),
          quantity: Number(values.quantity),
          unit: values.unit || null,
          requiredDate: values.requiredDate || null,
          specifications: values.specifications || null,
        }),
      'Requirement submitted'
    );
    if (r.ok) onSaved();
  };

  return (
    <Modal
      title="New requirement"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.productId || !(Number(values.quantity) > 0)} onClick={save}>Submit</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Product" full>
          <select {...bind('productId')}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
          </select>
        </Field>
        <Field label="Quantity"><input type="number" min="0" step="0.001" {...bind('quantity')} /></Field>
        <Field label="Unit"><input placeholder={chosen?.unit || 'kg'} {...bind('unit')} /></Field>
        <Field label="Required by"><input type="date" min={today()} {...bind('requiredDate')} /></Field>
        <Field label="Specifications" full hint="Grade, size, packaging, etc."><textarea {...bind('specifications')} /></Field>
      </div>
      {availability && (
        availability.sufficient ? (
          <Alert type="success">We have enough in stock ({fmt.num(availability.available)} {availability.unit || ''}). You can order it straight from Shop products.</Alert>
        ) : (
          <Alert type="warn">
            We currently have {fmt.num(availability.available)} {availability.unit || ''} in stock. Submit this requirement and we will source the remaining {fmt.num(availability.shortfall)}.
          </Alert>
        )
      )}
    </Modal>
  );
}
