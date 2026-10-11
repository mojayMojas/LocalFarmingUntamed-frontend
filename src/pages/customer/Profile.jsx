import { useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Async, Field, PageHeader, StatusBadge, useAction, useForm, useLoad } from '../../components/ui';
import { CUSTOMER_TYPES } from '../auth/RegisterCustomer';

export default function CustomerProfile() {
  const state = useLoad(() => api.get('/api/customer/profile'));
  return (
    <>
      <PageHeader title="Company profile" subtitle="Your business details and default delivery address." />
      <Async state={state}>{(p) => <ProfileForm profile={p} onSaved={state.reload} />}</Async>
    </>
  );
}

function ProfileForm({ profile, onSaved }) {
  const { refresh } = useAuth();
  const { values, bind, setValues } = useForm({});
  const { run, busy } = useAction();

  useEffect(() => {
    setValues({
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      phone: profile.user.phone || '',
      companyName: profile.companyName,
      customerType: profile.customerType || 'Other',
      businessRegistration: profile.businessRegistration || '',
      address: profile.address || '',
    });
  }, [profile, setValues]);

  const save = async (e) => {
    e.preventDefault();
    const r = await run(() => api.put('/api/customer/profile', values), 'Profile saved');
    if (r.ok) {
      refresh();
      onSaved();
    }
  };

  return (
    <form className="card" style={{ maxWidth: 720 }} onSubmit={save}>
      <div className="row spread" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{profile.companyName}</h2>
        <StatusBadge status={profile.status} />
      </div>
      <div className="form-grid">
        <Field label="Company name" full><input {...bind('companyName')} required /></Field>
        <Field label="Business type">
          <select {...bind('customerType')}>
            {[...new Set([values.customerType, ...CUSTOMER_TYPES].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Registration number"><input {...bind('businessRegistration')} /></Field>
        <Field label="Delivery address" full><input {...bind('address')} required /></Field>
        <Field label="Contact first name"><input {...bind('firstName')} /></Field>
        <Field label="Contact last name"><input {...bind('lastName')} /></Field>
        <Field label="Phone"><input {...bind('phone')} /></Field>
        <Field label="Email"><input value={profile.user.email} disabled /></Field>
      </div>
      <button className="btn" disabled={busy}>Save changes</button>
    </form>
  );
}
