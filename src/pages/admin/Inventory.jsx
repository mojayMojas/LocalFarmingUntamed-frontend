import { useState } from 'react';
import { api } from '../../api';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, useAction, useForm, useLoad } from '../../components/ui';

export default function Inventory() {
  const state = useLoad(async () => {
    const [stock, runs] = await Promise.all([api.get('/api/admin/inventory'), api.get('/api/admin/processing')]);
    return { stock, runs };
  });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader
        title="Inventory & pricing"
        subtitle="Finished stock customers can order. The selling price is set per stock line."
        actions={<button className="btn" onClick={() => setAdding(true)}>Add processed stock</button>}
      />
      <div className="card">
        <Async state={state}>
          {({ stock, runs }) => {
            const stocked = new Set(stock.map((s) => s.processingBatch.id));
            const ready = runs.filter((r) => r.status === 'COMPLETED' && !stocked.has(r.id));
            return (
              <>
                <Table
                  rows={stock}
                  empty="No stock yet. Complete a processing run, then add its output here."
                  columns={[
                    { header: 'Product', render: (s) => <strong>{s.product.productName}</strong> },
                    { header: 'From run', render: (s) => `#${s.processingBatch.id}` },
                    { header: 'Quantity', render: (s) => `${fmt.num(s.quantity)} ${s.unit || ''}` },
                    { header: 'Selling price', render: (s) => `${fmt.money(s.sellingPrice)} / ${s.unit || 'unit'}` },
                    { header: 'Location', render: (s) => s.storageLocation || '-' },
                    { header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
                    { header: '', className: 'right', render: (s) => <button className="btn small secondary" onClick={() => setEditing(s)}>Edit</button> },
                  ]}
                />
                {adding && (
                  <AddForm
                    runs={ready}
                    onClose={() => setAdding(false)}
                    onSaved={() => {
                      setAdding(false);
                      state.reload();
                    }}
                  />
                )}
                {editing && (
                  <EditForm
                    item={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                      setEditing(null);
                      state.reload();
                    }}
                  />
                )}
              </>
            );
          }}
        </Async>
      </div>
    </>
  );
}

function AddForm({ runs, onClose, onSaved }) {
  const { values, bind, setValues } = useForm({ processingId: runs[0]?.id ?? '', quantity: runs[0]?.quantityOut ?? '', unit: runs[0]?.inputBatch.unit ?? '', storageLocation: '', sellingPrice: '' });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(
      () =>
        api.post('/api/admin/inventory', {
          processingId: Number(values.processingId),
          quantity: Number(values.quantity),
          unit: values.unit || null,
          storageLocation: values.storageLocation || null,
          sellingPrice: Number(values.sellingPrice),
        }),
      'Added to inventory - customers can now order it'
    );
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title="Add processed stock"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.processingId || !(Number(values.quantity) > 0) || !(Number(values.sellingPrice) > 0)} onClick={save}>Add to inventory</button>
        </>
      }
    >
      {runs.length === 0 ? (
        <Alert type="warn">No completed processing runs are waiting to be stocked.</Alert>
      ) : (
        <div className="form-grid">
          <Field label="Completed processing run" full>
            <select value={values.processingId} onChange={(e) => {
              const r = runs.find((x) => String(x.id) === e.target.value);
              setValues((v) => ({ ...v, processingId: e.target.value, quantity: r?.quantityOut ?? '', unit: r?.inputBatch.unit ?? '' }));
            }}>
              {runs.map((r) => <option key={r.id} value={r.id}>#{r.id} - {r.product.productName} ({fmt.num(r.quantityOut)} out)</option>)}
            </select>
          </Field>
          <Field label="Quantity to stock"><input type="number" min="0" step="0.001" {...bind('quantity')} /></Field>
          <Field label="Unit"><input {...bind('unit')} /></Field>
          <Field label="Selling price per unit (ZAR)" hint="What customers pay"><input type="number" min="0" step="0.01" {...bind('sellingPrice')} /></Field>
          <Field label="Storage location"><input placeholder="Cold room 2, shelf B" {...bind('storageLocation')} /></Field>
        </div>
      )}
    </Modal>
  );
}

function EditForm({ item, onClose, onSaved }) {
  const { values, bind } = useForm({ quantity: item.quantity, sellingPrice: item.sellingPrice, storageLocation: item.storageLocation ?? '', status: item.status });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(
      () =>
        api.put(`/api/admin/inventory/${item.id}`, {
          quantity: Number(values.quantity),
          sellingPrice: Number(values.sellingPrice),
          storageLocation: values.storageLocation,
          status: values.status,
        }),
      'Stock updated'
    );
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={`Edit ${item.product.productName}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label={`Quantity (${item.unit || ''})`} hint="Use this to correct stock after a count"><input type="number" min="0" step="0.001" {...bind('quantity')} /></Field>
        <Field label="Selling price (ZAR)"><input type="number" min="0.01" step="0.01" {...bind('sellingPrice')} /></Field>
        <Field label="Storage location"><input {...bind('storageLocation')} /></Field>
        <Field label="Visibility">
          <select {...bind('status')}>
            <option value="AVAILABLE">Available to customers</option>
            <option value="HIDDEN">Hidden</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
