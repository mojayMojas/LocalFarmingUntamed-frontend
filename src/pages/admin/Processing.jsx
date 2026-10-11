import { useState } from 'react';
import { api } from '../../api';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, fmt, useAction, useForm, useLoad } from '../../components/ui';

const TYPES = ['Cleaning & sorting', 'Grading', 'Cutting / portioning', 'Slaughter & dressing', 'Pasteurising', 'Packaging', 'Other'];

export default function Processing() {
  const state = useLoad(async () => {
    const [runs, batches, products] = await Promise.all([
      api.get('/api/admin/processing'),
      api.get('/api/admin/receiving-batches'),
      api.get('/api/admin/products'),
    ]);
    return { runs, batches, products };
  });
  const { run, busy } = useAction();
  const [creating, setCreating] = useState(false);

  const complete = async (p) => {
    const r = await run(() => api.post(`/api/admin/processing/${p.id}/complete`, {}), 'Processing completed - add the output to inventory');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader
        title="Processing"
        subtitle="Turn accepted raw batches into customer-ready products."
        actions={<button className="btn" onClick={() => setCreating(true)}>Start processing</button>}
      />
      <div className="card">
        <Async state={state}>
          {({ runs, batches, products }) => (
            <>
              <Table
                rows={runs}
                empty="No processing runs yet."
                columns={[
                  { header: 'Run', render: (p) => <strong>#{p.id}</strong> },
                  { header: 'Input batch', render: (p) => p.inputBatch.batchNumber },
                  { header: 'Process', render: (p) => p.processingType },
                  { header: 'Output product', render: (p) => p.product.productName },
                  { header: 'In', render: (p) => fmt.num(p.quantityIn) },
                  { header: 'Out', render: (p) => fmt.num(p.quantityOut) },
                  { header: 'Yield', render: (p) => (Number(p.quantityIn) ? `${Math.round((Number(p.quantityOut) / Number(p.quantityIn)) * 100)}%` : '-') },
                  { header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
                  { header: '', className: 'right', render: (p) => p.status === 'IN_PROGRESS' && <button className="btn small" disabled={busy} onClick={() => complete(p)}>Mark complete</button> },
                ]}
              />
              {creating && (
                <StartForm
                  batches={batches.filter((b) => b.qualityStatus === 'ACCEPTED')}
                  products={products}
                  onClose={() => setCreating(false)}
                  onSaved={() => {
                    setCreating(false);
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

function StartForm({ batches, products, onClose, onSaved }) {
  const { values, bind, setValues } = useForm({
    inputBatchId: batches[0]?.id ?? '',
    productId: products[0]?.id ?? '',
    processingType: TYPES[0],
    quantityIn: batches[0]?.quantity ?? '',
    quantityOut: '',
  });
  const { run, busy } = useAction();
  const batch = batches.find((b) => String(b.id) === String(values.inputBatchId));

  const save = async () => {
    const r = await run(
      () =>
        api.post('/api/admin/processing', {
          inputBatchId: Number(values.inputBatchId),
          productId: Number(values.productId),
          processingType: values.processingType,
          quantityIn: Number(values.quantityIn),
          quantityOut: Number(values.quantityOut),
        }),
      'Processing started'
    );
    if (r.ok) onSaved();
  };

  return (
    <Modal
      title="Start processing"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.inputBatchId || !(Number(values.quantityIn) > 0) || !(Number(values.quantityOut) > 0)} onClick={save}>Start</button>
        </>
      }
    >
      {batches.length === 0 ? (
        <Alert type="warn">There are no accepted batches to process. Record a delivery and pass its quality inspection first.</Alert>
      ) : (
        <div className="form-grid">
          <Field label="Input batch (accepted)" full>
            <select value={values.inputBatchId} onChange={(e) => {
              const b = batches.find((x) => String(x.id) === e.target.value);
              setValues((v) => ({ ...v, inputBatchId: e.target.value, quantityIn: b?.quantity ?? '' }));
            }}>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.batchNumber} - {fmt.num(b.quantity)} {b.unit}</option>)}
            </select>
          </Field>
          <Field label="Finished product" full hint="What this run produces, e.g. 'Graded tomatoes 5kg crate'">
            <select {...bind('productId')}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.productName}</option>)}
            </select>
          </Field>
          <Field label="Process" full>
            <select {...bind('processingType')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label={`Quantity in (${batch?.unit || ''})`}><input type="number" min="0" step="0.001" {...bind('quantityIn')} /></Field>
          <Field label="Expected output" hint="After waste and trimming"><input type="number" min="0" step="0.001" {...bind('quantityOut')} /></Field>
        </div>
      )}
    </Modal>
  );
}
