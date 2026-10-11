import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { Alert } from '../../components/ui';

/**
 * Where Ozow sends the customer back to. The redirect alone is NOT proof of payment: the real result arrives
 * server-to-server on the notify URL, so this page asks the backend for the confirmed payment status.
 */
export default function PaymentResult() {
  const [params] = useSearchParams();
  const hint = params.get('status'); // success | cancelled | error, from our own redirect URLs
  const reference = params.get('TransactionReference') || params.get('reference');
  const [result, setResult] = useState(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!reference) return;
    let alive = true;
    api
      .get(`/api/customer/payments/status?reference=${encodeURIComponent(reference)}`)
      .then((r) => {
        if (!alive) return;
        setResult(r);
        // Ozow's notification can arrive a few seconds after the redirect, so keep checking while it is pending.
        if (r.paymentStatus === 'PENDING' && hint === 'success' && tries < 10) {
          setTimeout(() => alive && setTries((t) => t + 1), 3000);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reference, hint, tries]);

  const status = result?.paymentStatus;
  const waiting = hint === 'success' && (!result || status === 'PENDING') && tries < 10;

  return (
    <div className="card center-card">
      {status === 'COMPLETE' ? (
        <>
          <h2>Payment received</h2>
          <p>Thank you. Order #{result.orderId} is paid and will be scheduled for delivery.</p>
        </>
      ) : waiting ? (
        <>
          <div className="spinner" />
          <h2>Confirming your payment</h2>
          <p className="muted">Waiting for confirmation from Ozow. This usually takes a few seconds.</p>
        </>
      ) : hint === 'cancelled' || status === 'CANCELLED' ? (
        <>
          <h2>Payment cancelled</h2>
          <p>No money was taken. Your order is still waiting for payment and you can try again from My orders.</p>
        </>
      ) : hint === 'error' || status === 'FAILED' ? (
        <>
          <h2>Payment failed</h2>
          <Alert type="error">Something went wrong with the payment. You can try again from My orders.</Alert>
        </>
      ) : (
        <>
          <h2>Payment not confirmed yet</h2>
          <p>We have not received confirmation from Ozow yet. If your bank shows the payment as made, check My orders again shortly; the order updates automatically once confirmed.</p>
        </>
      )}
      <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
        <Link className="btn" to="/customer/orders">Go to my orders</Link>
      </div>
    </div>
  );
}
