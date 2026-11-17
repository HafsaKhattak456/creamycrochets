import React, { useRef, useState } from 'react';
export default function CustomRequest() {
  const key = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(null);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('http://localhost:5000/api/custom-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key.current }, body: JSON.stringify(Object.fromEntries(form)) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not save request.'); setSaved(data);
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Could not confirm the save. Keep this form open and retry with identical details to avoid duplicates.' : err.message); }
    finally { setBusy(false); }
  }
  return <><div className="eyebrow">MADE FOR YOU</div><h2>Your idea, in yarn.</h2>{saved ? <section role="status"><h3>Request saved</h3><p style={{ overflowWrap: 'anywhere' }}><strong>{saved.requestNumber}</strong></p><p>Status: {saved.status}. The maker will discuss the design, price and timing with you. No order or payment is confirmed yet.</p><a className="button dark" target="_blank" rel="noopener noreferrer" href={`https://wa.me/923026981176?text=${encodeURIComponent(`Hello CreamyCrochets! I would like to discuss my saved custom request ${saved.requestNumber}. Please confirm design options, a quote and timing.`)}`}>Discuss on WhatsApp ↗</a></section> : <><p>Tell us your idea. We’ll save your request so the maker can review it.</p>{error && <p role="alert" className="alert alert-danger">{error}</p>}<form onSubmit={submit}><fieldset disabled={busy}>
    <label>Your name<input name="name" className="form-control" required minLength={2} maxLength={100} autoComplete="name"/></label>
    <label>Mobile number<input name="phone" className="form-control" type="tel" required maxLength={25} placeholder="03021234567" autoComplete="tel"/></label>
    <label>What would you like?<select name="piece" className="form-select">{['Keychain', 'Crochet toy', 'Frock / clothing', 'Cap / headband / shoes', 'Matching set', 'Something else'].map(p => <option key={p}>{p}</option>)}</select></label>
    <label>Colours, size and design notes<textarea name="details" className="form-control" rows={4} required minLength={5} maxLength={2000}/></label>
    <label>Preferred date (optional)<input name="preferredDate" className="form-control" type="date"/></label><p className="sample-note">Delivery is available within Karachi. A preferred date is a request, subject to maker confirmation. Your contact details will be shared with CreamyCrochets to discuss this request.</p>
    <button className="button dark w-100">{busy ? 'Saving request…' : 'Submit custom request'}</button>
  </fieldset></form></>}</>;
}
