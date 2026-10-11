import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ---------- formatting ----------
const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const num = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 3 });

export const fmt = {
  money: (n) => (n === null || n === undefined || n === '' ? '-' : zar.format(Number(n))),
  num: (n) => (n === null || n === undefined || n === '' ? '-' : num.format(Number(n))),
  date: (d) => (d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'),
  // The backend stamps LocalDateTime in the server's own time zone without an offset, so show it as-is.
  dateTime: (d) => (d ? new Date(d).toLocaleString('en-ZA') : '-'),
  name: (u) => (u ? `${u.firstName} ${u.lastName}` : '-'),
  label: (s) => (s ? s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()) : '-'),
};

export const today = () => new Date().toISOString().slice(0, 10);

// ---------- data loading ----------
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ data, loading: false, error: '' }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

// ---------- toasts ----------
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Runs an async action, shows the error as a toast, and reports success with an optional message. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const result = await fn();
        if (successMessage) toast(successMessage);
        return { ok: true, result };
      } catch (e) {
        toast(e.message, 'error');
        return { ok: false };
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );
  return { run, busy };
}

// ---------- building blocks ----------
const STATUS_TONE = {
  good: ['COMPLETE', 'PAID', 'VERIFIED', 'ACCEPTED', 'DELIVERED', 'ACTIVE', 'AVAILABLE', 'PASSED', 'FULFILLED', 'CONFIRMED', 'READ'],
  warn: ['PENDING', 'PENDING_PAYMENT', 'OPEN', 'IN_PROGRESS', 'SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'RECEIVED', 'UNPAID', 'REVIEWED', 'SOURCING', 'UNREAD'],
  bad: ['REJECTED', 'FAILED', 'CANCELLED', 'DECLINED', 'SUSPENDED', 'OUT_OF_STOCK', 'INACTIVE', 'HIDDEN'],
};

export function StatusBadge({ status }) {
  if (!status) return <span className="muted">-</span>;
  const tone = Object.keys(STATUS_TONE).find((k) => STATUS_TONE[k].includes(status)) || '';
  return <span className={`badge ${tone}`}>{fmt.label(status)}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert ${type}`}>{children}</div>;
}

export function Loading({ text = 'Loading...' }) {
  return <div className="empty">{text}</div>;
}

/** Shows the loading / error state of a useLoad result, or renders children(data). */
export function Async({ state, children }) {
  if (state.loading && !state.data) return <Loading />;
  if (state.error) {
    return (
      <Alert type="error">
        {state.error} <button className="btn small secondary" onClick={state.reload}>Retry</button>
      </Alert>
    );
  }
  return children(state.data);
}

export function Table({ columns, rows, empty = 'Nothing here yet.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={c.className}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty">{empty}</td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={row.id ?? ri}>
                {columns.map((c, i) => (
                  <td key={i} className={c.className}>{c.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, full }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="card stat">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.value} className={`tab ${value === t.value ? 'active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Tiny controlled-form helper: const [f, set, setAll] = useForm({a: ''}) ; <input {...bind('a')} /> */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const bind = (name) => ({
    value: values[name] ?? '',
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  return { values, bind, setValues };
}

export const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]));
