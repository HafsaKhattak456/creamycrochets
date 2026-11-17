import React, { useState } from 'react';
const API = 'http://localhost:5000/api/admin';
export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const categories = ['Keychains', 'Crochet Toys', 'Custom Clothing', 'Matching Accessories'];
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const body = { name: form.get('name'), category: form.get('category'), price: Number(form.get('price')), description: form.get('description'), size: form.get('size'), colors: form.get('colors').split('\n').map(c => c.trim()).filter(Boolean), starting: form.has('starting') };
    try {
      const response = await fetch(`${API}/products/${editing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.status === 401) { setSession(null); setEditing(null); throw new Error('Session expired. Please sign in again.'); }
      if (!response.ok) throw new Error(data.message || 'Could not save product.');
      setProducts(current => current.map(p => p._id === data._id ? data : p)); setEditing(null); setMessage('Product saved. Refresh the shop to see the update.');
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
      setProducts(await catalog.json()); setSession(data);
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'Cannot reach the backend. Start it on port 5000.' : err.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await fetch(`${API}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } }); }
    finally { setSession(null); setProducts([]); setEditing(null); setMessage(''); }
  }
  const editor = editing && session && <section className="card p-4 my-4" aria-label="Edit product"><h2>Edit {editing.name}</h2><form key={editing._id} onSubmit={save}><fieldset disabled={busy}>
    <label className="d-block mb-3">Product name<input name="name" className="form-control" defaultValue={editing.name} required maxLength={150}/></label>
    <label className="d-block mb-3">Category<select name="category" className="form-select" defaultValue={editing.category}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="d-block mb-3">Price (PKR)<input name="price" className="form-control" type="number" min="0.01" max="1000000" step="0.01" defaultValue={editing.price} required/></label>
    <label className="d-block mb-3">Size<input name="size" className="form-control" defaultValue={editing.size} required maxLength={200}/></label>
    <label className="d-block mb-3">Colour options (one per line)<textarea name="colors" className="form-control" rows={3} defaultValue={editing.colors.join('\n')} required maxLength={1620}/></label>
    <label className="d-block mb-3">Description<textarea name="description" className="form-control" rows={4} defaultValue={editing.description} required maxLength={3000}/></label>
    <label className="d-block mb-3"><input name="starting" type="checkbox" defaultChecked={!!editing.starting}/> Show as a starting price (“From”)</label>
    <button className="button dark me-2" type="submit">{busy ? 'Saving…' : 'Save changes'}</button><button className="button" type="button" onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
  </fieldset></form></section>;
  return <main style={{ maxWidth: 950, margin: '40px auto', padding: 24 }}><a href="/">← Back to shop</a><h1 className="mt-4">CreamyCrochets admin</h1>{message && <p role="status" className="alert alert-success">{message}</p>}{error && <p role="alert" className="alert alert-danger">{error}</p>}{!session ? <form onSubmit={login} style={{ maxWidth: 420 }}><p>Sign in with the account created using the backend setup command.</p><label className="d-block mb-3">Email<input className="form-control" name="email" type="email" autoComplete="username" required maxLength={254}/></label><label className="d-block mb-3">Password<input className="form-control" name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button className="button dark" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form> : <><p>Signed in as {session.email}</p><button className="button" onClick={logout}>Log out</button>{editor}<h2 className="mt-4">Products ({products.length})</h2><p>Edit product details below. Photo uploads and adding new products are the next stage.</p><div className="table-responsive"><table className="table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Action</th></tr></thead><tbody>{products.map(p => <tr key={p._id || p.id}><td>{p.name}</td><td>{p.category}</td><td>{p.starting ? 'From ' : ''}PKR {p.price}</td><td><button className="button" disabled={busy} onClick={() => { setEditing(p); setError(""); setMessage(""); }}>Edit</button></td></tr>)}</tbody></table></div></>}</main>;
}
