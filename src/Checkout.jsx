import { createRequestKey } from './requestKey';
import React, { useRef, useState } from 'react';

export default function Checkout() {
  const [items] = useState(() => { try { const value = JSON.parse(localStorage.getItem('creamy-cart')); return Array.isArray(value) ? value : []; } catch { return []; } });
  const key = useRef(createRequestKey());
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [order, setOrder] = useState(null);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(' /api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key.current }, body: JSON.stringify({ customer: { name: form.get('name'), phone: form.get('phone'), address: form.get('address'), city: 'Karachi' }, paymentMethod: form.get('paymentMethod'), notes: form.get('notes'), items: items.map(({ id, color, qty }) => ({ id, color, qty })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save order.');
      setOrder(data); localStorage.removeItem('creamy-cart');
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Could not confirm the save. Keep this page open and retry with the same details to avoid a duplicate order.' : err.message); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 650, margin: '40px auto', padding: 24 }}><a href="/">← Back to shop</a><h1 className="mt-4">Your handmade order</h1>
    {order ? <section role="status"><h2>Order request saved</h2><p style={{ overflowWrap: 'anywhere' }}>Order number: <strong>{order.orderNumber}</strong></p><p>Status: {order.status}</p><p>Estimated product subtotal: PKR {order.subtotal.toLocaleString('en-PK')}</p><p>Your request is saved in our system. Delivery charges, custom details and final acceptance are confirmed by the seller. No payment has been collected.</p><a className="button dark" target="_blank" rel="noopener noreferrer" href={`https://wa.me/923026981176?text=${encodeURIComponent(`Hello CreamyCrochets! Please confirm my saved order ${order.orderNumber}. Estimated product subtotal: PKR ${order.subtotal}. Please confirm delivery charges and payment arrangements.`)}`}>Follow up on WhatsApp ↗</a></section> : !items.length ? <p>Your bag is empty. <a href="/">Choose a product first.</a></p> : <>
      <ul>{items.map((p, i) => <li key={i}>{p.qty} × {p.name} — {p.color}</li>)}</ul>
      <p>Delivery within Karachi. Prices and availability are rechecked when you submit. Starting prices and custom details require seller confirmation.</p>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <form onSubmit={submit}><fieldset disabled={busy}>
        <label className="d-block mb-3">Your name<input name="name" className="form-control" required minLength={2} maxLength={100} autoComplete="name"/></label>
        <label className="d-block mb-3">Mobile number<input name="phone" className="form-control" type="tel" required maxLength={25} placeholder="03021234567" autoComplete="tel"/></label>
        <label className="d-block mb-3">Delivery address<textarea name="address" className="form-control" required minLength={10} maxLength={500} autoComplete="street-address"/></label>
        <label className="d-block mb-3">City<input className="form-control" value="Karachi" readOnly/></label>
        <label className="d-block mb-3">Preferred payment method<select name="paymentMethod" className="form-select"><option value="COD">Cash on delivery</option><option value="Card">Card — arrange with seller</option><option>JazzCash</option></select></label>
        <label className="d-block mb-3">Customisation notes (optional)<textarea name="notes" className="form-control" maxLength={1500} placeholder="Preferred colours, sizes or other details"/></label>
        <p>Submitting shares these details with CreamyCrochets to process your order. Delivery charges are additional. Card and JazzCash payments are arranged with the seller; do not enter card numbers here.</p>
        <button className="button dark" type="submit">{busy ? 'Saving order…' : 'Submit order request'}</button>
      </fieldset></form>
    </>}
  </main>;
}
