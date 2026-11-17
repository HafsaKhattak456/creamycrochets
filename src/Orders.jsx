import React, { useEffect, useState } from 'react';
const API = 'http://localhost:5000/api/admin/orders';
const statuses = ['Pending', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'];
export default function Orders({ token }) {
  const [data, setData] = useState({ orders: [], hasMore: false }), [page, setPage] = useState(1), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function load(signal) {
    setBusy(true); setError('');
    try { const response = await fetch(`${API}?page=${page}`, { headers: { Authorization: `Bearer ${token}` }, signal }); const result = await response.json(); if (!response.ok) throw new Error(result.message); setData(result); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message === 'Failed to fetch' ? 'Cannot reach backend.' : err.message); }
    finally { if (!signal?.aborted) setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [page, token]);
  async function update(id, status) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setData(current => ({ ...current, orders: current.orders.map(o => o._id === id ? { ...o, status: result.status } : o) }));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="my-5"><h2>Orders</h2><button className="button mb-3" disabled={busy} onClick={() => load()}>Refresh orders</button>{busy && <p role="status">Updating orders…</p>}{error && <p role="alert" className="alert alert-danger">{error}</p>}{!busy && !data.orders.length && !error && <p>No orders yet.</p>}
    {data.orders.map(order => <article className="card p-3 mb-3" key={order._id}><h3 style={{ fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{order.orderNumber}</h3><p>{new Date(order.createdAt).toLocaleString()}</p><p><strong>{order.customer.name}</strong> · {order.customer.phone}<br/>{order.customer.address}, {order.customer.city}</p><ul>{order.items.map((p, i) => <li key={i}>{p.qty} × {p.name} ({p.color}) — PKR {p.unitPrice}{p.starting ? ' (starting price)' : ''} each</li>)}</ul><p>Product subtotal: PKR {order.subtotal.toLocaleString('en-PK')}<br/>Delivery charge: to be confirmed<br/>Payment preference: {order.paymentMethod} · {order.paymentStatus}</p>{order.notes && <p>Notes: {order.notes}</p>}<label>Status<select className="form-select" value={order.status} disabled={busy} onChange={e => update(order._id, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label></article>)}
    <button className="button me-2" disabled={busy || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} </span><button className="button" disabled={busy || !data.hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
  </section>;
}
