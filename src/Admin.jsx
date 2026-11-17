import React, { useState } from 'react';
import Orders from './Orders.jsx';
import CustomRequestsAdmin from './CustomRequestsAdmin.jsx';
import './admin.css';
const API = '/api/admin';
export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState(null);
  const [tab, setTab] = useState('products');
  const [visited, setVisited] = useState({ products: true });
  const imageUrl = path => path;
  function selectTab(next) { setTab(next); setVisited(current => ({ ...current, [next]: true })); }
  const categories = ['Keychains', 'Crochet Toys', 'Custom Clothing', 'Matching Accessories'];
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const body = { name: form.get('name'), category: form.get('category'), price: Number(form.get('price')), description: form.get('description'), size: form.get('size'), colors: form.get('colors').split('\n').map(c => c.trim()).filter(Boolean), starting: form.has('starting'), available: form.has('available') };
    try {
      const upload = new FormData();
      if (photo) upload.append('photo', photo);
      if (!editing._id) upload.append('product', JSON.stringify(body));
      const response = await fetch(editing._id ? `${API}/products/${editing._id}` : `${API}/products`, { method: editing._id ? 'PUT' : 'POST', headers: { ...(editing._id ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${session.token}` }, body: editing._id ? JSON.stringify(body) : upload });
      const data = await response.json();
      if (response.status === 401) { setSession(null); setEditing(null); throw new Error('Session expired. Please sign in again.'); }
      if (!response.ok) throw new Error(data.message || 'Could not save product.');
      setProducts(current => editing._id ? current.map(p => p._id === data._id ? data : p) : [...current, data]);
      if (editing._id && photo) {
        const replacement = await fetch(`${API}/products/${editing._id}/photo`, { method: 'PUT', headers: { Authorization: `Bearer ${session.token}` }, body: upload });
        const updated = await replacement.json();
        if (!replacement.ok) throw new Error(`Details saved, but photo replacement failed: ${updated.message}. Please retry or cancel.`);
        setProducts(current => current.map(p => p._id === updated._id ? updated : p));
      }
      setEditing(null); setPhoto(null); setMessage('Product saved. Refresh the shop to see the update.');
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Cannot reach the backend. Your changes have not been confirmed saved; check the connection and retry.' : err.message); }
    finally { setBusy(false); }
  }
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      const catalog = await fetch(`${API}/products`, { headers: { Authorization: `Bearer ${data.token}` } });
      if (!catalog.ok) throw new Error('Could not load the admin catalog.');
      setProducts(await catalog.json()); setSession(data); setTab('products'); setVisited({ products: true });
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Cannot reach the backend. Start it on port 5000.' : err.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await fetch(`${API}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } }); }
    finally { setSession(null); setProducts([]); setEditing(null); setMessage(''); }
  }
  const editor = editing && session && <section className="card p-4 my-4" aria-label="Product form"><h2>{editing._id ? `Edit ${editing.name}` : 'Add product'}</h2><form key={editing._id || 'new'} onSubmit={save}><fieldset disabled={busy}>
    <label className="d-block mb-3">Product name<input name="name" className="form-control" defaultValue={editing.name} required maxLength={150}/></label>
    <label className="d-block mb-3">Category<select name="category" className="form-select" defaultValue={editing.category}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="d-block mb-3">Price (PKR)<input name="price" className="form-control" type="number" min="0.01" max="1000000" step="0.01" defaultValue={editing.price} required/></label>
    <label className="d-block mb-3">Size<input name="size" className="form-control" defaultValue={editing.size} required maxLength={200}/></label>
    <label className="d-block mb-3">Colour options (one per line)<textarea name="colors" className="form-control" rows={3} defaultValue={editing.colors.join('\n')} required maxLength={1620}/></label>
    <label className="d-block mb-3">Description<textarea name="description" className="form-control" rows={4} defaultValue={editing.description} required maxLength={3000}/></label>
    <label className="d-block mb-3"><input name="starting" type="checkbox" defaultChecked={!!editing.starting}/> Show as a starting price (“From”)</label>
    <label className="d-block mb-3"><input name="available" type="checkbox" defaultChecked={editing.available !== false}/> Available for orders</label>
    {editing.image && <img src={imageUrl(editing.image)} alt="Current product" style={{ width: 150, height: 150, objectFit: 'contain' }}/>}
    <label className="d-block mb-3">{editing._id ? 'Replace photo (optional)' : 'Product photo (required)'}<input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" required={!editing._id} onChange={e => { const file = e.target.files[0]; if (file && file.size > 5 * 1024 * 1024) { e.target.value = ''; setPhoto(null); setError('Photo must be at most 5 MB.'); } else { setPhoto(file || null); setError(''); } }}/></label><p>JPG, PNG or WebP, up to 5 MB and 25 megapixels.</p>
    <button className="button dark me-2" type="submit">{busy ? 'Saving…' : 'Save changes'}</button><button className="button" type="button" onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
  </fieldset></form></section>;
  return <main className="admin-shell">
    <div className="admin-top"><a className="admin-brand" href="/"><img src="/logo.png" alt="CreamyCrochets"/><span>creamycrochets<small>MAKER’S STUDIO</small></span></a><a className="admin-shop" href="/">View shop ↗</a></div>
    <div className="admin-heading"><div><p className="admin-eyebrow">A LITTLE CARE, BEHIND EVERY CREATION</p><h1>{session ? 'Your maker’s studio.' : 'Welcome back, maker.'}</h1><p>{session ? 'Manage your creations and the people waiting for them.' : 'Sign in to care for your shop, one lovely detail at a time.'}</p></div>{session && <div className="admin-account"><span>{session.email}</span><button className="button" disabled={busy} onClick={logout}>Log out</button></div>}</div>
    {message && <p role="status" className="alert alert-success">{message}</p>}{error && <p role="alert" className="alert alert-danger">{error}</p>}
    {!session ? <section className="admin-login"><div className="admin-login-art"><span>✳</span><h2>Made by hand.<br/>Managed with love.</h2><p>A calm little space for your growing business.</p></div><form onSubmit={login}><h2>Admin sign in</h2><p>Use your existing maker account.</p><label className="d-block mb-3">Email<input className="form-control" name="email" type="email" autoComplete="username" required maxLength={254}/></label><label className="d-block mb-4">Password<input className="form-control" name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button className="button dark w-100" disabled={busy}>{busy ? 'Signing in…' : 'Sign in ↗'}</button></form></section> : <>
      <nav className="admin-tabs" aria-label="Dashboard sections">{[['products', 'Products', 'Your handmade collection'], ['orders', 'Orders', 'Customer purchases'], ['requests', 'Custom Requests', 'Ideas made personal']].map(([id, label, detail]) => <button key={id} type="button" aria-pressed={tab === id} aria-controls={`admin-panel-${id}`} onClick={() => selectTab(id)}><strong>{label}{id === 'products' && <span className="admin-count">{products.length}</span>}</strong><small>{detail}</small></button>)}</nav>
      <section id="admin-panel-products" hidden={tab !== 'products'} aria-label="Products" className="admin-panel"><div className="admin-section-top"><div><h2>Your creations</h2><p>Add a new lovely or give an existing piece a little update.</p></div><button className="button dark" disabled={busy || !!editing} onClick={() => { setPhoto(null); setError(''); setMessage(''); setEditing({ name: '', category: categories[0], price: '', size: '', colors: ['Custom colours'], description: '' }); }}>Add product +</button></div>{editor}
      {!products.length && <p className="admin-empty">Your collection is ready for its first creation. Add a product to get started.</p>}
      {!!products.length && <div className="table-responsive"><table className="table admin-product-table"><thead><tr><th>Creation</th><th>Category</th><th>Price</th><th>Availability</th><th>Action</th></tr></thead><tbody>{products.map(p => <tr key={p._id || p.id}><td data-label="Creation"><div className="admin-product-name"><img src={imageUrl(p.image)} alt=""/><strong>{p.name}</strong></div></td><td data-label="Category">{p.category}</td><td data-label="Price">{p.starting ? 'From ' : ''}PKR {p.price.toLocaleString('en-PK')}</td><td data-label="Availability"><span className={`admin-badge ${p.available === false ? 'is-unavailable' : ''}`}>{p.available === false ? 'Unavailable' : 'Available'}</span></td><td data-label="Action"><button className="button" disabled={busy || !!editing} onClick={() => { setPhoto(null); setEditing(p); setError(''); setMessage(''); }}>Edit</button></td></tr>)}</tbody></table></div>}</section>
      <section id="admin-panel-orders" hidden={tab !== 'orders'} aria-label="Orders" className="admin-panel">{visited.orders && <Orders token={session.token}/>}</section>
      <section id="admin-panel-requests" hidden={tab !== 'requests'} aria-label="Custom Requests" className="admin-panel">{visited.requests && <CustomRequestsAdmin token={session.token}/>}</section>
    </>}
    <p className="admin-footer">CreamyCrochets · A little yarn. A lot of love.</p>
  </main>;
}
