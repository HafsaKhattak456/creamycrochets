import React, { useEffect, useState } from 'react';
const API = '/api/admin/custom-requests';
const statuses = ['New', 'Discussing', 'Accepted', 'Completed', 'Declined'];
export default function CustomRequestsAdmin({ token }) {
  const [page, setPage] = useState(1), [data, setData] = useState({ requests: [], hasMore: false }), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function load(signal) {
    setBusy(true); setError(''); setMessage('');
    try { const response = await fetch(`${API}?page=${page}`, { headers: { Authorization: `Bearer ${token}` }, signal }); const result = await response.json(); if (!response.ok) throw new Error(result.message); setData(result); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message); } finally { if (!signal?.aborted) setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [page, token]);
  async function save(event, row) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget), price = form.get('quotedPrice');
    try {
      const response = await fetch(`${API}/${row._id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: form.get('status'), quotedPrice: price === '' ? null : Number(price) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setData(current => ({ ...current, requests: current.requests.map(r => r._id === row._id ? { ...r, ...result } : r) })); setMessage('Custom request updated. Discuss the quote and progress with the customer on WhatsApp.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="my-5"><h2>Custom Requests</h2><button className="button" disabled={busy} onClick={() => load()}>Refresh requests</button>{busy && <p role="status">Updating requests…</p>}{error && <p className="alert alert-danger" role="alert">{error}</p>}{message && <p role="status" className="alert alert-success">{message}</p>}{!busy && !error && !data.requests.length && <p>No custom requests yet.</p>}
    {data.requests.map(row => <article className="card p-3 my-3" key={row._id}><h3 style={{ fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{row.requestNumber}</h3><p>{new Date(row.createdAt).toLocaleString()}<br/><strong>{row.name}</strong> · {row.phone}</p><p>Requested piece: {row.piece}</p><p style={{ whiteSpace: 'pre-wrap' }}>{row.details}</p><p>Preferred date: {row.preferredDate || 'Flexible'}</p><p>Saved status: {row.status} · Quote: {row.quotedPrice === null ? 'Not quoted' : `PKR ${row.quotedPrice}`}</p><form key={`${row.status}-${row.quotedPrice}`} onSubmit={e => save(e, row)}><fieldset disabled={busy}><label className="d-block mb-2">Status<select name="status" className="form-select" defaultValue={row.status}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><label className="d-block mb-2">Quoted price (PKR, optional)<input className="form-control" name="quotedPrice" type="number" min="0.01" max="1000000" step="0.01" defaultValue={row.quotedPrice ?? ''}/></label><button className="button dark">Save request update</button></fieldset></form><p className="sample-note mt-2">Recording a quote or Accepted status does not collect payment or send a customer notification.</p></article>)}
    <button className="button me-2" disabled={busy || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} </span><button className="button" disabled={busy || !data.hasMore} onClick={() => setPage(p => p + 1)}>Next</button>
  </section>;
}
