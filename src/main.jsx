import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import './products.css';
import Admin from './Admin.jsx';


const categories = ['All pieces', 'Keychains', 'Crochet Toys', 'Custom Clothing', 'Matching Accessories'];
const money = (number) => `PKR ${number.toLocaleString('en-PK')}`;
const priceText = (product) => `${product.starting ? 'From ' : ''}${money(product.price)}`;
const whatsappUrl = (message) => `https://wa.me/923026981176?text=${encodeURIComponent(message)}`;

function ProductPhoto({ product, className = '' }) {
  return <img className={`product-photo ${className}`} src={product.image?.startsWith('/uploads/') ? `http://localhost:5000${product.image}` : product.image} alt={product.name} />;
}

function App() {
  const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  const controller = new AbortController();

  async function loadProducts() {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Could not load products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Unable to load products. Check that the backend is running.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  loadProducts();

  return () => controller.abort();
}, []);

  const [category, setCategory] = useState('All pieces');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [color, setColor] = useState('');
  const [cart, setStoredCart] = useState(() => { try { return JSON.parse(localStorage.getItem('creamy-cart')) || []; } catch { return []; } });
  const [drawer, setDrawer] = useState(false);
  const [notice, setNotice] = useState('');
  const [request, setRequest] = useState(false);
  const [summary, setSummary] = useState('');
  const [checking, setChecking] = useState(false);
  const [orderError, setOrderError] = useState('');
  async function prepareOrder() {
    setSummary(''); setOrderError(''); setChecking(true);
    try {
      const response = await fetch('http://localhost:5000/api/products/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.map(({ id, color, qty }) => ({ id, color, qty })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not check your bag.');
      setCart(data.items);
      setSummary(`ORDER REQUEST — creamycrochets\n${data.items.map(item => `${item.qty} × ${item.name} (${item.color}) — ${money(item.price * item.qty)}${item.starting ? ' [starting price]' : ''}`).join('\n')}\nEstimated subtotal: ${money(data.items.reduce((sum, item) => sum + item.price * item.qty, 0))}\nDelivery: Karachi. Payment: COD, card or JazzCash.\nPlease confirm final prices, delivery charges, availability and custom details.`);
    } catch (err) { setOrderError(err.message === 'Failed to fetch' ? 'Cannot check availability. Please try again when the backend is running.' : err.message); }
    finally { setChecking(false); }
  }
  const setCart = value => { setSummary(''); setOrderError(''); setStoredCart(value); };

  useEffect(() => localStorage.setItem('creamy-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const close = (event) => { if (event.key === 'Escape') { setActive(null); setDrawer(false); setRequest(false); } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);

  const openProduct = (product) => { setActive(product); setColor(product.colors[0]); };
  const addToCart = () => {
    if (active.available === false) { setNotice('This product is currently unavailable.'); return; }
    setCart((current) => {
      const match = current.find((item) => item.id === active.id && item.color === color);
      return match ? current.map((item) => item === match ? { ...item, qty: item.qty + 1 } : item) : [...current, { ...active, color, qty: 1 }];
    });
    setActive(null);
    setNotice('A handmade lovely was added to your bag.');
  };
  const createCustomDraft = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    setSummary(`CUSTOM REQUEST — creamycrochets\nName: ${data.get('name')}\nContact: ${data.get('contact')}\nPiece: ${data.get('piece')}\nColours / size / idea: ${data.get('details')}\nPreferred date: ${data.get('date') || 'Flexible'}\nFinal price and timeline to be confirmed by the maker.`);
  };
  const filtered = products.filter((product) => (category === 'All pieces' || product.category === category) && `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div className="announcement">A little yarn. A lot of love. <span>Handmade & customisable</span></div>
    <header>
      <a className="brand" href="#top"><img src="/logo.png" alt="Creamy Crochets logo"/><span>creamycrochets<small>HANDMADE LITTLE HAPPINESS</small></span></a>
      <nav aria-label="Main navigation"><a href="#shop">Shop the collection</a><a href="#custom">Made for you</a><a href="#story">Our story</a></nav>
      <button className="bag" onClick={() => { setSummary(''); setDrawer(true); }}>Bag <span>{cart.reduce((total, item) => total + item.qty, 0)}</span></button>
    </header>
    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">ONE STITCH AT A TIME</div><h1>Little things.<br/>Big <em>feelings.</em></h1><p>Thoughtful crochet pieces for everyday smiles, tiny wardrobes, and gifts that feel a little more personal.</p><a href="#shop" className="button dark">Shop real creations <span>↗</span></a><a className="text-link" href="#custom">Have something in mind? Let’s make it.</a><div className="hero-foot"><span>✳ Handmade with care</span><span>♡ Your colours, your way</span></div></div>
        <div className="hero-real"><div className="orbit">made slowly,<br/><em>loved always.</em></div><img className="hero-main-photo" src="/products/crochet-panda.png" alt="Handmade crochet panda"/><img className="hero-small-photo" src="/products/rose-keychain.png" alt="Handmade crochet rose keychain"/><div className="handwritten">real pieces, handmade with care ↗</div></div>
      </section>
      <div className="ribbon"><span>KEYCHAINS</span>✳<span>CROCHET TOYS</span>✳<span>CUSTOM CLOTHING</span>✳<span>MATCHING ACCESSORIES</span>✳<span>CUSTOM CREATIONS</span></div>
      <section className="collection" id="shop">
        <div className="section-top"><div><div className="eyebrow">REAL CREAMYCROCHETS CREATIONS</div><h2>Find a piece of happy.</h2></div><p>Small details. Soft textures.<br/>Something that feels like you.</p></div>
        <div className="shop-tools"><div className="filters" aria-label="Product categories">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><input aria-label="Search products" placeholder="Search the collection…" value={search} onChange={(event) => setSearch(event.target.value)}/></div>
        <p className="sample-note">Every item is handmade. Custom colours and sizes are confirmed with the maker before ordering. Accessory prices marked “From” are provisional.</p>
        {loading && <p role="status">Loading handmade lovelies…</p>}
{error && <p role="alert">{error}</p>}
        <div className="product-grid">{filtered.map((product) => <article key={product.id} className="product"><button className="product-image" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}><span className="product-tag">{product.available === false ? 'Unavailable' : product.starting ? 'Starting price' : 'Customisable'}</span><ProductPhoto product={product}/><span className="quick">View details ↗</span></button><div className="product-info"><div><small>{product.category}</small><h3><button onClick={() => openProduct(product)}>{product.name}</button></h3></div><span>{priceText(product)}</span></div></article>)}</div>
        {!loading && !error && filtered.length === 0 && (
  <p>No pieces found. Try another search or category.</p>
)}
      </section>
      <section className="custom-section" id="custom"><div className="custom-mark">✳<span>uniquely<br/><em>yours.</em></span></div><div><div className="eyebrow">YOU DREAM IT. WE STITCH IT.</div><h2>A colour. An idea.<br/>A piece just for you.</h2><p>A favourite character, a matching outfit, or something entirely your own. Tell us what you have in mind and we’ll start with a conversation.</p><button className="button dark" onClick={() => { setSummary(''); setRequest(true); }}>Create a custom request <span>↗</span></button><small>Design, price, measurements, and making time are confirmed before ordering.</small></div></section>
      <section className="story" id="story"><div className="story-logo"><img src="/logo.png" alt="Creamy Crochets yarn wreath logo"/></div><div><div className="eyebrow">MEET CREAMYCROCHETS</div><h2>From her hands,<br/>to your happy place.</h2><p>creamycrochets is a small business run by a maker who turns yarn into personal little pieces. From keychains and characters to coordinated children’s clothing and accessories, each creation begins with an idea and a crochet hook.</p><p>Already creating for customers through Instagram, now taking the next stitch toward a little online home.</p></div></section>
      <section className="faq"><div><div className="eyebrow">A FEW HELPFUL THREADS</div><h2>Before we start stitching.</h2></div><div><details><summary>Can I choose my own colours and size?</summary><p>Yes. Every listed item can be requested in custom colours. Clothing and accessories are made to measurements, subject to yarn and design availability.</p></details><details><summary>Are the prices final?</summary><p>Keychain, toy, and shown frock prices are listed. The cap, headband, and shoes currently show provisional starting prices; the maker confirms the final amount for custom sizes and details.</p></details><details><summary>How do I place an order?</summary><p>Add pieces to your bag, prepare your order, and open WhatsApp to send it to us. We confirm custom details, delivery charges, payment, and availability in chat.</p></details></div></section>
    </main>
    <section className="faq" id="contact"><div><div className="eyebrow">LET’S TALK CROCHET</div><h2>Handmade happiness,<br/>across Karachi.</h2><p><a href={whatsappUrl('Hello CreamyCrochets! I would like to ask about your products.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp ↗</a><br/><a href="tel:+923026981176">0302 6981176</a></p><p><a href="https://www.instagram.com/creamycrochets/" target="_blank" rel="noopener noreferrer">Instagram ↗</a> · <a href="https://www.youtube.com/@creamycrochets" target="_blank" rel="noopener noreferrer">YouTube ↗</a></p></div><div><h3>Delivery</h3><p>Delivery available all over Karachi. Delivery charges are confirmed with your order.</p><h3>Payment options</h3><p>Cash on delivery (COD), card, and JazzCash. Confirm payment arrangements with the seller on WhatsApp.</p><h3>Returns</h3><p>Returns are accepted within the first 14 days of purchase. Contact us on WhatsApp to arrange your return.</p></div></section>
    <footer><a className="footer-name" href="#top">creamycrochets<span>Little things, lovingly handmade.</span></a><div><a href="#shop">Explore the collection</a><a href="#custom">Make it personal</a><a href="#contact">Contact & delivery</a></div><small>© {new Date().getFullYear()} creamycrochets<br/>Orders confirmed through WhatsApp</small></footer>
    {notice && <div className="toast-message" role="status">{notice}</div>}
    {(active || drawer || request) && <div className="overlay" onClick={() => { setActive(null); setDrawer(false); setRequest(false); }}><section className={`dialog ${drawer ? 'drawer' : ''}`} role="dialog" aria-modal="true" aria-label={active ? active.name : request ? 'Custom request' : 'Shopping bag'} onClick={(event) => event.stopPropagation()}><button className="close-button" aria-label="Close dialog" autoFocus onClick={() => { setActive(null); setDrawer(false); setRequest(false); }}>×</button>
      {active ? <><div className="dialog-photo"><ProductPhoto product={active}/></div><div className="eyebrow mt-3">{active.category} · REAL PRODUCT</div><h2>{active.name}</h2><p className="dialog-price">{priceText(active)}</p><p>{active.description}</p><p><strong>Size:</strong> {active.size}</p><label className="form-label" htmlFor="colour">Colour option</label><select id="colour" className="form-select mb-4" value={color} onChange={(event) => setColor(event.target.value)}>{active.colors.map((item) => <option key={item}>{item}</option>)}</select><p className="sample-note">Final colour, measurements, availability, and preparation time are confirmed by the maker.</p><button className="button dark w-100" disabled={active.available === false} onClick={addToCart}>{active.available === false ? 'Unavailable' : 'Add to bag'} <span>+</span></button></>
      : request ? <><div className="eyebrow">MADE FOR YOU</div><h2>Your idea, in yarn.</h2><p>Tell us your idea, then open WhatsApp to send your request to the maker.</p><form onSubmit={createCustomDraft}><label>Your name<input className="form-control" name="name" required maxLength="100"/></label><label>Email or phone<input className="form-control" name="contact" required maxLength="120"/></label><label>What would you like?<select className="form-select" name="piece">{['Keychain', 'Crochet toy', 'Frock / clothing', 'Cap / headband / shoes', 'Matching set', 'Something else'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Colours, size & your idea<textarea className="form-control" name="details" required rows="3" maxLength="2000"/></label><label>Preferred date (optional)<input className="form-control" name="date" type="date" min={new Date().toLocaleDateString('en-CA')}/></label><button className="button dark w-100">Prepare WhatsApp request ↗</button></form></>
      : <><div className="eyebrow">YOUR LITTLE LOVELIES</div><h2>The happy bag.</h2>{!cart.length ? <p>Your bag is waiting for a little handmade happiness. <a href="#shop" onClick={() => setDrawer(false)}>Explore the collection</a></p> : <>{cart.map((item, index) => <div className="cart-row" key={`${item.id}-${item.color}`}><div className="mini-art"><ProductPhoto product={item}/></div><div><strong>{item.name}</strong><small>{item.color} · {priceText(item)}</small><div className="quantity"><button disabled={checking} aria-label={`Decrease ${item.name}`} onClick={() => setCart((current) => current.flatMap((row, rowIndex) => rowIndex !== index ? [row] : row.qty > 1 ? [{ ...row, qty: row.qty - 1 }] : []))}>−</button><span>{item.qty}</span><button disabled={checking} aria-label={`Increase ${item.name}`} onClick={() => setCart((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, qty: row.qty + 1 } : row))}>+</button></div></div></div>)}<div className="total"><span>Estimated subtotal</span><strong>{money(cart.reduce((total, item) => total + item.price * item.qty, 0))}</strong></div><p className="sample-note">Delivery excluded. Starting prices, measurements, availability, and timing require maker confirmation. No payment is collected.</p><button className="button dark w-100" disabled={checking} onClick={prepareOrder}>{checking ? 'Checking availability…' : 'Prepare WhatsApp order ↗'}</button></>}</>}
      {orderError && <p role="alert" className="alert alert-danger">{orderError} Remove unavailable items using the minus button, or refresh the shop to choose current options.</p>}
      {summary && <div className="draft"><label htmlFor="draft-text">Your message — ready to send</label><textarea id="draft-text" className="form-control" rows="8" readOnly value={summary}/><a className="button dark mt-2" href={whatsappUrl(summary)} target="_blank" rel="noopener noreferrer">Send via WhatsApp ↗</a><p className="sample-note">WhatsApp opens with this message. Press send in WhatsApp to submit it. Your order is confirmed by the seller.</p><button className="button mt-2" onClick={async () => { try { await navigator.clipboard.writeText(summary); setNotice('Draft copied. It has not been sent.'); } catch { setNotice('Select the draft text and copy it manually.'); } }}>Copy draft</button></div>}
    </section></div>}
  </>;
}

createRoot(document.getElementById('root')).render(window.location.pathname.replace(/\/$/, '') === '/admin' ? <Admin/> : <App/>);
