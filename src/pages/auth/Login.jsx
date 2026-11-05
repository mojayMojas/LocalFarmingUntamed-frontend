import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../../auth';
import { Alert, Field } from '../../components/ui';

export function AuthHero() {
  return (
    <div className="auth-hero">
      <div className="brand"><span className="brand-mark">F</span> FarmLink</div>
      <h1>From local farms to bulk buyers, quality-checked in between.</h1>
      <p>FarmLink sources produce from verified farmers, inspects and processes it, then supplies restaurants, retailers, schools and hotels in bulk.</p>
      <div className="flow">
        <div>1. Farmers list what they can supply</div>
        <div>2. We buy, inspect, process and pack it</div>
        <div>3. Businesses order in bulk and pay securely with Ozow</div>
      </div>
    </div>
  );
}

export function AuthFooter() {
  return (
    <footer className="auth-footer">
      <div className="auth-footer-inner">
        <div className="auth-footer-brand">
          <span className="brand-mark">F</span> FarmLink
          <p>Quality-checked produce, from local farms to bulk buyers.</p>
        </div>

        <ul className="auth-footer-contact">
          <li>
            <span>Email</span>
            <a href="mailto:mampholomojalefa04@gmail.com">mampholomojalefa04@gmail.com</a>
          </li>
          <li>
            <span>Phone</span>
            <a href="tel:+27664670894">+27 66 467 0894</a>
          </li>
          <li>
            <span>WhatsApp</span>
           <a href="tel:+27664670894">+27 66 467 0894</a>
          </li>
        </ul>
      </div>
      <p className="auth-footer-copy">&copy; {new Date().getFullYear()} FarmLink. All rights reserved.</p>
    </footer>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      navigate(HOME_BY_ROLE[u.role] || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="auth-wrap">
        <AuthHero />
        <div className="auth-panel">
          <form className="card auth-card" onSubmit={submit}>
            <h2>Welcome back</h2>
            <p className="sub">Log in to your FarmLink account.</p>
            {error && <Alert type="error">{error}</Alert>}
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <button className="btn full" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
            <div className="auth-links">
              <span>New supplier? <Link to="/register/farmer">Register as a farmer</Link></span>
              <span>Buying in bulk? <Link to="/register/customer">Register your business</Link></span>
            </div>
          </form>
        </div>
      </div>
      <AuthFooter />
    </>
  );
}