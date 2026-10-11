import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { Alert, useAction } from '../../components/ui';

/** Stand-in for the Ozow bank page while no Ozow credentials are configured. Remove once Ozow is live. */
export default function MockPayment() {
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const navigate = useNavigate();
  const { run, busy } = useAction();

  const finish = async (success) => {
    const r = await run(() => api.post(`/api/customer/payments/mock/${encodeURIComponent(reference)}/complete?success=${success}`));
    if (r.ok) navigate(`/payment/result?status=${success ? 'success' : 'cancelled'}&reference=${encodeURIComponent(reference)}`, { replace: true });
  };

  return (
    <div className="card center-card">
      <h2>Ozow test payment</h2>
      <Alert type="warn">
        Ozow is not configured yet, so this is a simulated payment page. No real money moves. Add your Ozow keys on the server to switch to the real Ozow bank-selection page.
      </Alert>
      <p className="muted">Reference: {reference}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn danger" disabled={busy} onClick={() => finish(false)}>Cancel payment</button>
        <button className="btn" disabled={busy} onClick={() => finish(true)}>Simulate successful payment</button>
      </div>
    </div>
  );
}
