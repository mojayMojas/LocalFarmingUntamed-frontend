import { api } from '../api';
import { Async, PageHeader, fmt, useAction, useLoad } from '../components/ui';

export default function Notifications() {
  const state = useLoad(() => api.get('/api/notifications'));
  const { run } = useAction();

  const markRead = async (n) => {
    if (n.status === 'READ') return;
    await run(() => api.post(`/api/notifications/${n.id}/read`));
    state.reload();
  };
  const markAll = async () => {
    await run(() => api.post('/api/notifications/read-all'), 'All marked as read');
    state.reload();
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Updates about your orders, supplies and payments."
        actions={<button className="btn secondary" onClick={markAll}>Mark all as read</button>}
      />
      <div className="card">
        <Async state={state}>
          {(list) =>
            list.length === 0 ? (
              <div className="empty">No notifications yet.</div>
            ) : (
              list.map((n) => (
                <div key={n.id} className={`notif ${n.status === 'UNREAD' ? 'unread' : 'read'}`} onClick={() => markRead(n)} style={{ cursor: 'pointer' }}>
                  <span className="dot" />
                  <div>
                    <div className="title">{n.title}</div>
                    <div>{n.message}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{fmt.dateTime(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )
          }
        </Async>
      </div>
    </>
  );
}
