import { useState } from 'react';
import { api } from '../../api';
import { Async, Modal, PageHeader, StatusBadge, Table, fmt, useLoad } from '../../components/ui';

export default function Invoices() {
  const state = useLoad(() => api.get('/api/customer/invoices'));
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <PageHeader title="Invoices" subtitle="One invoice is issued for every order." />
      <div className="card">
        <Async state={state}>
          {(list) => (
            <Table
              rows={list}
              empty="No invoices yet."
              columns={[
                { header: 'Invoice', render: (i) => <strong>{i.invoiceNumber}</strong> },
                { header: 'Order', render: (i) => `#${i.order.id}` },
                { header: 'Issued', render: (i) => fmt.date(i.issueDate) },
                { header: 'Due', render: (i) => fmt.date(i.dueDate) },
                { header: 'Amount', render: (i) => fmt.money(i.amount) },
                { header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
                { header: '', className: 'right', render: (i) => <button className="btn small secondary" onClick={() => setOpenId(i.id)}>View</button> },
              ]}
            />
          )}
        </Async>
      </div>
      {openId && <InvoiceView id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function InvoiceView({ id, onClose }) {
  const state = useLoad(() => api.get(`/api/customer/invoices/${id}`), [id]);
  return (
    <Modal
      wide
      title="Invoice"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Close</button>
          <button className="btn" onClick={() => window.print()}>Print / save as PDF</button>
        </>
      }
    >
      <Async state={state}>
        {({ invoice, order, billTo }) => (
          <div className="invoice">
            <div className="row spread">
              <h1>INVOICE</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="grid cols-2" style={{ margin: '16px 0' }}>
              <div>
                <strong>Bill to</strong>
                <div>{billTo.companyName}</div>
                <div className="muted">{billTo.address}</div>
                {billTo.businessRegistration && <div className="muted">Reg: {billTo.businessRegistration}</div>}
              </div>
              <dl className="kv" style={{ gridTemplateColumns: '110px 1fr' }}>
                <dt>Invoice no.</dt><dd>{invoice.invoiceNumber}</dd>
                <dt>Order</dt><dd>#{order.id}</dd>
                <dt>Issued</dt><dd>{fmt.date(invoice.issueDate)}</dd>
                <dt>Due</dt><dd>{fmt.date(invoice.dueDate)}</dd>
              </dl>
            </div>
            <Table
              rows={order.items}
              columns={[
                { header: 'Description', render: (i) => i.productName },
                { header: 'Quantity', render: (i) => `${fmt.num(i.quantity)} ${i.unit || ''}` },
                { header: 'Unit price', render: (i) => fmt.money(i.unitPrice) },
                { header: 'Amount', className: 'right', render: (i) => fmt.money(i.subtotal) },
              ]}
            />
            <h2 className="right" style={{ marginTop: 14 }}>Total {fmt.money(invoice.amount)}</h2>
          </div>
        )}
      </Async>
    </Modal>
  );
}
