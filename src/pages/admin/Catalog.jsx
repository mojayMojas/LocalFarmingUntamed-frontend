import { useState } from 'react';
import { api } from '../../api';
import { Async, Field, Modal, PageHeader, Table, Tabs, clean, useAction, useForm, useLoad } from '../../components/ui';

export default function Catalog() {
  const state = useLoad(async () => {
    const [categories, products] = await Promise.all([api.get('/api/admin/categories'), api.get('/api/admin/products')]);
    return { categories, products };
  });
  const { run, busy } = useAction();
  const [tab, setTab] = useState('products');
  const [editing, setEditing] = useState(null); // {kind, item|null}

  const remove = async (kind, item, label) => {
    if (!window.confirm(`Delete ${label}?`)) return;
    const r = await run(() => api.del(`/api/admin/${kind}/${item.id}`), 'Deleted');
    if (r.ok) state.reload();
  };
  const done = () => {
    setEditing(null);
    state.reload();
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The crop and animal products the platform buys and sells."
        actions={
          <button className="btn" onClick={() => setEditing({ kind: tab === 'products' ? 'products' : 'categories', item: null })}>
            {tab === 'products' ? 'Add product' : 'Add category'}
          </button>
        }
      />
      <div className="card">
        <Tabs tabs={[{ value: 'products', label: 'Products' }, { value: 'categories', label: 'Categories' }]} value={tab} onChange={setTab} />
        <Async state={state}>
          {({ categories, products }) => (
            <>
              {tab === 'products' ? (
                <Table
                  rows={products}
                  empty="No products yet."
                  columns={[
                    { header: 'Product', render: (p) => <strong>{p.productName}</strong> },
                    { header: 'Category', render: (p) => p.category?.categoryName },
                    { header: 'Type', render: (p) => p.productType || '-' },
                    { header: 'Unit', render: (p) => p.unit || '-' },
                    {
                      header: '',
                      className: 'right nowrap',
                      render: (p) => (
                        <div className="row" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn small secondary" onClick={() => setEditing({ kind: 'products', item: p })}>Edit</button>
                          <button className="btn small danger" disabled={busy} onClick={() => remove('products', p, p.productName)}>Delete</button>
                        </div>
                      ),
                    },
                  ]}
                />
              ) : (
                <Table
                  rows={categories}
                  empty="No categories yet."
                  columns={[
                    { header: 'Category', render: (c) => <strong>{c.categoryName}</strong> },
                    { header: 'Description', render: (c) => c.description || '-' },
                    {
                      header: '',
                      className: 'right nowrap',
                      render: (c) => (
                        <div className="row" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn small secondary" onClick={() => setEditing({ kind: 'categories', item: c })}>Edit</button>
                          <button className="btn small danger" disabled={busy} onClick={() => remove('categories', c, c.categoryName)}>Delete</button>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
              {editing?.kind === 'products' && <ProductForm item={editing.item} categories={categories} onClose={() => setEditing(null)} onSaved={done} />}
              {editing?.kind === 'categories' && <CategoryForm item={editing.item} onClose={() => setEditing(null)} onSaved={done} />}
            </>
          )}
        </Async>
      </div>
    </>
  );
}

function ProductForm({ item, categories, onClose, onSaved }) {
  const { values, bind } = useForm({
    categoryId: item?.category?.id ?? categories[0]?.id ?? '',
    productName: item?.productName ?? '',
    productType: item?.productType ?? 'CROP',
    unit: item?.unit ?? 'kg',
    description: item?.description ?? '',
  });
  const { run, busy } = useAction();
  const save = async () => {
    const body = clean({ ...values, categoryId: Number(values.categoryId) });
    const r = await run(() => (item ? api.put(`/api/admin/products/${item.id}`, body) : api.post('/api/admin/products', body)), 'Product saved');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={item ? 'Edit product' : 'Add product'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.productName || !values.categoryId} onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Product name" full><input {...bind('productName')} /></Field>
        <Field label="Category">
          <select {...bind('categoryId')}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select {...bind('productType')}>
            <option value="CROP">Crop</option>
            <option value="ANIMAL">Animal product</option>
          </select>
        </Field>
        <Field label="Unit of measure"><input placeholder="kg, litre, dozen" {...bind('unit')} /></Field>
        <Field label="Description" full><textarea {...bind('description')} /></Field>
      </div>
    </Modal>
  );
}

function CategoryForm({ item, onClose, onSaved }) {
  const { values, bind } = useForm({ categoryName: item?.categoryName ?? '', description: item?.description ?? '' });
  const { run, busy } = useAction();
  const save = async () => {
    const body = clean(values);
    const r = await run(() => (item ? api.put(`/api/admin/categories/${item.id}`, body) : api.post('/api/admin/categories', body)), 'Category saved');
    if (r.ok) onSaved();
  };
  return (
    <Modal
      title={item ? 'Edit category' : 'Add category'}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !values.categoryName} onClick={save}>Save</button>
        </>
      }
    >
      <Field label="Category name"><input {...bind('categoryName')} /></Field>
      <Field label="Description"><textarea {...bind('description')} /></Field>
    </Modal>
  );
}
