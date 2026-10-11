import { useState } from 'react';
import { api } from '../../api';
import { Async, Field, Modal, PageHeader, StatusBadge, Table, clean, useAction, useForm, useLoad } from '../../components/ui';

export default function Drivers() {
  const state = useLoad(() => api.get('/api/admin/drivers'));
  const { run, busy } = useAction();
  const [adding, setAdding] = useState(false);

  const toggle = async (d) => {
    const status = d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const r = await run(() => api.put(`/api/admin/drivers/${d.id}`, { status }), `Driver ${status.toLowerCase()}`);
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Each driver gets a login to see their deliveries and confirm them."
        actions={<button className="btn" onClick={() => setAdding(true)}>Add driver</button>}
      />
      <div className="card">
        <Async state={state}>
          {(list) => (
            <Table
              rows={list}
              empty="No drivers yet."
              columns={[
                { header: 'Driver', render: (d) => <><strong>{d.firstName} {d.lastName}</strong><div className="sub">{d.user?.email}</div></> },
                { header: 'Phone', render: (d) => d.phone || '-' },
                { header: 'Vehicle', render: (d) => `${d.vehicleType || '-'} ${d.vehicleRegistration || ''}` },
                { header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
                {
                  header: '',
                  className: 'right',
                  render: (d) => (
                    <button className={`btn small ${d.status === 'ACTIVE' ? 'danger' : ''}`} disabled={busy} onClick={() => toggle(d)}>
                      {d.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  ),
                },
              ]}
            />
          )}
        </Async>
      </div>
      {adding && (
        <DriverForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            state.reload();
          }}
        />
      )}
    </>
  );
}

function DriverForm({ onClose, onSaved }) {
  const { values, bind } = useForm({ firstName: '', lastName: '', email: '', phone: '', password: '', vehicleType: '', vehicleRegistration: '' });
  const { run, busy } = useAction();
  const ready = values.firstName && values.lastName && values.email && values.password.length >= 8;
  const save = async () => {
    const r = await run(() => api.post('/api/admin/drivers', clean(values)), 'Driver created');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title="Add driver"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !ready} onClick={save}>Create driver</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="First name"><input {...bind('firstName')} /></Field>
        <Field label="Last name"><input {...bind('lastName')} /></Field>
        <Field label="Email (login)" full><input type="email" {...bind('email')} /></Field>
        <Field label="Phone"><input {...bind('phone')} /></Field>
        <Field label="Temporary password" hint="At least 8 characters"><input type="text" {...bind('password')} /></Field>
        <Field label="Vehicle type"><input placeholder="Bakkie, 4-ton truck..." {...bind('vehicleType')} /></Field>
        <Field label="Vehicle registration"><input {...bind('vehicleRegistration')} /></Field>
      </div>
    </Modal>
  );
}
