import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Alert, Async, Field, Modal, PageHeader, StatusBadge, Table, clean, fmt, useAction, useForm, useLoad } from '../../components/ui';

export default function FarmerProfile() {
  const state = useLoad(() => api.get('/api/farmer/profile'));
  const { refresh } = useAuth();
  const { run, busy } = useAction();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const removeLocation = async (id) => {
    if (!window.confirm('Remove this farm location?')) return;
    const r = await run(() => api.del(`/api/farmer/locations/${id}`), 'Location removed');
    if (r.ok) state.reload();
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your details and the farms you supply from." />
      <Async state={state}>
        {(p) => (
          <div className="stack">
            {p.verificationStatus === 'PENDING' && (
              <Alert type="warn">Your account is waiting for verification. You can list your products now, but we can only send supply requests once you are verified.</Alert>
            )}
            {['REJECTED', 'SUSPENDED'].includes(p.verificationStatus) && (
              <Alert type="error">Your account is {fmt.label(p.verificationStatus).toLowerCase()}. Please contact the platform owner.</Alert>
            )}
            <div className="card">
              <div className="row spread">
                <h2>Personal details</h2>
                <button className="btn small secondary" onClick={() => setEditing(true)}>Edit</button>
              </div>
              <dl className="kv">
                <dt>Name</dt><dd>{fmt.name(p.user)}</dd>
                <dt>Email</dt><dd>{p.user.email}</dd>
                <dt>Phone</dt><dd>{p.user.phone || '-'}</dd>
                <dt>Status</dt><dd><StatusBadge status={p.verificationStatus} /></dd>
                <dt>Registered</dt><dd>{fmt.date(p.registrationDate)}</dd>
              </dl>
            </div>

            <div className="card">
              <div className="row spread">
                <h2>Farm locations</h2>
                <button className="btn small" onClick={() => setAdding(true)}>Add location</button>
              </div>
              <Table
                rows={p.locations}
                empty="No locations yet."
                columns={[
                  { header: 'Province', render: (l) => l.province || '-' },
                  { header: 'Municipality', render: (l) => l.municipality || '-' },
                  { header: 'Town', render: (l) => l.town || '-' },
                  { header: 'Address', render: (l) => l.address || '-' },
                  { header: '', className: 'right', render: (l) => <button className="btn small danger" disabled={busy} onClick={() => removeLocation(l.id)}>Remove</button> },
                ]}
              />
            </div>

            {editing && (
              <EditProfile
                user={p.user}
                onClose={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  refresh();
                  state.reload();
                }}
              />
            )}
            {adding && (
              <AddLocation
                onClose={() => setAdding(false)}
                onSaved={() => {
                  setAdding(false);
                  state.reload();
                }}
              />
            )}
          </div>
        )}
      </Async>
    </>
  );
}

function EditProfile({ user, onClose, onSaved }) {
  const { values, bind } = useForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(() => api.put('/api/farmer/profile', values), 'Profile updated');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title="Edit details"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="First name"><input {...bind('firstName')} /></Field>
        <Field label="Last name"><input {...bind('lastName')} /></Field>
        <Field label="Phone" full><input {...bind('phone')} /></Field>
      </div>
    </Modal>
  );
}

function AddLocation({ onClose, onSaved }) {
  const { values, bind } = useForm({ province: '', municipality: '', town: '', address: '' });
  const { run, busy } = useAction();
  const save = async () => {
    const r = await run(() => api.post('/api/farmer/locations', clean(values)), 'Location added');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title="Add farm location"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={save}>Add</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Province"><input {...bind('province')} /></Field>
        <Field label="Municipality"><input {...bind('municipality')} /></Field>
        <Field label="Town"><input {...bind('town')} /></Field>
        <Field label="Address"><input {...bind('address')} /></Field>
      </div>
    </Modal>
  );
}
