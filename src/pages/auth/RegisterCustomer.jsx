import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Alert, Field, clean, useForm } from '../../components/ui';
import { AuthHero, AuthHeader, AuthFooter } from './Login';
import './authTheme.css';

export const CUSTOMER_TYPES = ['Restaurant', 'Retailer', 'Wholesaler', 'Supermarket', 'School', 'Hotel', 'Caterer', 'Food manufacturer', 'Other'];

export default function RegisterCustomer() {
  const { registerWith } = useAuth();
  const navigate = useNavigate();
  const { values, bind } = useForm({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    companyName: '', customerType: 'Restaurant', businessRegistration: '', address: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await registerWith('/api/auth/register/customer', clean(values));
      navigate('/customer', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="auth-wrap">
        <AuthHero />
        <div className="auth-panel">
          <form className="card auth-card" onSubmit={submit}>
            <h2>Register your business</h2>
            <p className="sub">Create a bulk-buyer account to order processed farm produce.</p>
            {error && <Alert type="error">{error}</Alert>}
            <div className="form-grid">
              <Field label="Company name" full><input {...bind('companyName')} required /></Field>
              <Field label="Business type">
                <select {...bind('customerType')}>
                  {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Registration number"><input {...bind('businessRegistration')} /></Field>
              <Field label="Delivery address" full hint="Deliveries go here by default"><input {...bind('address')} required /></Field>
              <Field label="Contact first name"><input {...bind('firstName')} required /></Field>
              <Field label="Contact last name"><input {...bind('lastName')} required /></Field>
              <Field label="Email" full><input type="email" {...bind('email')} required /></Field>
              <Field label="Phone"><input {...bind('phone')} /></Field>
              <Field label="Password" hint="At least 8 characters"><input type="password" {...bind('password')} minLength={8} required /></Field>
            </div>
            <button className="btn full" disabled={busy}>{busy ? 'Creating account...' : 'Create business account'}</button>
            <div className="auth-links"><span>Already registered? <Link to="/login">Log in</Link></span></div>
          </form>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}
