import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Alert, Field, clean, useForm } from '../../components/ui';
import { AuthHero, AuthHeader, AuthFooter } from './Login';
import './authTheme.css';

export default function RegisterFarmer() {
  const { registerWith } = useAuth();
  const navigate = useNavigate();
  const { values, bind } = useForm({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    province: '', municipality: '', town: '', address: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await registerWith('/api/auth/register/farmer', clean(values));
      navigate('/farmer', { replace: true });
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
            <h2>Register as a farmer</h2>
            <p className="sub">Tell us who you are and where you farm. We verify every farmer before buying.</p>
            {error && <Alert type="error">{error}</Alert>}
            <div className="form-grid">
              <Field label="First name"><input {...bind('firstName')} required /></Field>
              <Field label="Last name"><input {...bind('lastName')} required /></Field>
              <Field label="Email" full><input type="email" {...bind('email')} required /></Field>
              <Field label="Phone"><input {...bind('phone')} /></Field>
              <Field label="Password" hint="At least 8 characters"><input type="password" {...bind('password')} minLength={8} required /></Field>
              <Field label="Province"><input {...bind('province')} /></Field>
              <Field label="Municipality"><input {...bind('municipality')} /></Field>
              <Field label="Town"><input {...bind('town')} /></Field>
              <Field label="Farm address"><input {...bind('address')} /></Field>
            </div>
            <button className="btn full" disabled={busy}>{busy ? 'Creating account...' : 'Create farmer account'}</button>
            <div className="auth-links"><span>Already registered? <Link to="/login">Log in</Link></span></div>
          </form>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}
