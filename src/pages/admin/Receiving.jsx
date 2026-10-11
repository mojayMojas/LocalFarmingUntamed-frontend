import { useState } from 'react';
import { api } from '../../api';
import { Async, Field, Modal, PageHeader, StatusBadge, Table, Tabs, fmt, useAction, useForm, useLoad } from '../../components/ui';

export default function Receiving() {
  const state = useLoad(async () => {
    const [batches, inspections] = await Promise.all([api.get('/api/admin/receiving-batches'), api.get('/api/admin/inspections')]);
    return { batches, inspections };
  });
  const [tab, setTab] = useState('batches');
  const [inspecting, setInspecting] = useState(null);

  return (
    <>
      <PageHeader title="Receiving & quality" subtitle="Inspect every delivery. Only accepted batches can be processed and paid for." />
      <div className="card">
        <Tabs tabs={[{ value: 'batches', label: 'Receiving batches' }, { value: 'inspections', label: 'Inspection history' }]} value={tab} onChange={setTab} />
        <Async state={state}>
          {({ batches, inspections }) =>
            tab === 'batches' ? (
              <>
                <Table
                  rows={batches}
                  empty="No deliveries received yet."
                  columns={[
                    { header: 'Batch', render: (b) => <strong>{b.batchNumber}</strong> },
                    { header: 'Purchase order', render: (b) => <>#{b.purchaseOrder.id}<div className="sub">{fmt.name(b.purchaseOrder.farmer.user)}</div></> },
                    { header: 'Received', render: (b) => fmt.date(b.receivedDate) },
                    { header: 'Quantity', render: (b) => `${fmt.num(b.quantity)} ${b.unit || ''}` },
                    { header: 'Quality', render: (b) => <StatusBadge status={b.qualityStatus} /> },
                    {
                      header: '',
                      className: 'right',
                      render: (b) => b.qualityStatus === 'PENDING' && <button className="btn small" onClick={() => setInspecting(b)}>Inspect</button>,
                    },
                  ]}
                />
                {inspecting && (
                  <InspectForm
                    batch={inspecting}
                    onClose={() => setInspecting(null)}
                    onSaved={() => {
                      setInspecting(null);
                      state.reload();
                    }}
                  />
                )}
              </>
            ) : (
              <Table
                rows={inspections}
                empty="No inspections yet."
                columns={[
                  { header: 'Batch', render: (i) => i.batch.batchNumber },
                  { header: 'Date', render: (i) => fmt.date(i.inspectionDate) },
                  { header: 'Inspector', render: (i) => fmt.name(i.inspectedBy) },
                  { header: 'Result', render: (i) => <StatusBadge status={i.result} /> },
                  { header: 'Notes', render: (i) => i.notes || '-' },
                ]}
              />
            )
          }
        </Async>
      </div>
    </>
  );
}

function InspectForm({ batch, onClose, onSaved }) {
  const { values, bind } = useForm({ result: 'PASSED', notes: '' });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(() => api.post(`/api/admin/receiving-batches/${batch.id}/inspect`, { result: values.result, notes: values.notes || null }), 'Inspection recorded');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={`Inspect ${batch.batchNumber}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Save result</button>
        </>
      }
    >
      <p className="muted">{fmt.num(batch.quantity)} {batch.unit} from {fmt.name(batch.purchaseOrder.farmer.user)}. The result cannot be changed afterwards.</p>
      <Field label="Result">
        <select {...bind('result')}>
          <option value="PASSED">Passed - accept the batch</option>
          <option value="FAILED">Failed - reject the batch</option>
        </select>
      </Field>
      <Field label="Notes" hint="Condition, grade, temperature, reason for rejection..."><textarea {...bind('notes')} /></Field>
    </Modal>
  );
}
