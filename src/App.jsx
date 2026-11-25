
import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

// LUMINA STORE — Tahap 5 Filter Premium + Tahap 7 Detail Produk Premium.
// Tetap menggunakan data localStorage dan komponen proyek sebelumnya.
const CATEGORIES = [
  { folder: "baju pria", name: "Pria", label: "Baju Pria", price: 179000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "baju wanita", name: "Wanita", label: "Baju Wanita", price: 199000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "batik wanita", name: "Batik Wanita", label: "Batik", price: 235000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "sepatu pria", name: "Sepatu Pria", label: "Sepatu Pria", price: 295000, sizes: ["39", "40", "41", "42", "43", "44"] },
  { folder: "sepatu wanita", name: "Sepatu Wanita", label: "Sepatu Wanita", price: 245000, sizes: ["35", "36", "37", "38", "39", "40"] },
  { folder: "tas wanita", name: "Tas Wanita", label: "Tas", price: 249000, sizes: ["All Size"] },
  { folder: "aksesoris wanita", name: "Accessories", label: "Aksesori", price: 129000, sizes: ["All Size"] },
];
const STATUSES = ["Pesanan Baru", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const METHODS = [
  { value: "cod", label: "COD — Bayar di Tempat" },
  { value: "transfer", label: "Transfer Bank (Simulasi)" },
  { value: "qris", label: "QRIS (Simulasi)" },
];
const VOUCHERS = [
  { code: "LUMINA10", min: 100000, percent: 10 },
  { code: "FASHION20", min: 300000, percent: 20 },
  { code: "WELCOME15", min: 150000, amount: 15000 },
];
const KEY = {
  products: "lumina_products_v2", oldProducts: "lumina_products_v1",
  orders: "lumina_orders_v1", session: "lumina_session_v1",
  cart: "lumina_cart_v1", wishlist: "lumina_wishlist_v1",
  deleted: "lumina_deleted_local_v2", reviews: "lumina_product_reviews_v1",
};
const EMPTY_PRODUCT = {
  id: null, name: "", collection: "Pria", image: "", gallery: "",
  price: "", stock: "20", description: "", sizes: "S,M,L,XL,XXL", colors: "Sesuai foto",
};
const EMPTY_CHECKOUT = {
  name: "", phone: "", address: "", shipping: "regular", payment: "cod",
};

// ====================== UTILITAS ======================
function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch { return fallback; }
}
function arr(key) { const value = read(key, []); return Array.isArray(value) ? value : []; }
function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { console.error("Penyimpanan gagal:", error); return false; }
}
function text(value) { return String(value ?? "").trim().toLowerCase(); }
function values(value) { return String(value || "").split(",").map(v => v.trim()).filter(Boolean); }
function rp(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}
function date(value) {
  const d = new Date(value || "");
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
function prettyName(value) { return String(value || "").replace(/\bgambar\s*(\d+)\b/gi, "Koleksi $1"); }
function status(value) { return STATUSES.includes(value) ? value : "Pesanan Baru"; }
function paymentLabel(value) { return METHODS.find(m => m.value === value)?.label || "Belum tercatat"; }
function payStatus(order) {
  return order.paymentStatus || (order.paymentMethod === "cod" ? "Bayar di Tempat" : "Menunggu Pembayaran");
}
function canPay(order) {
  return !!order && ["cod", "transfer", "qris"].includes(order.paymentMethod) &&
    status(order.status) !== "Dibatalkan" && payStatus(order) !== "Lunas" &&
    (order.paymentMethod !== "cod" || status(order.status) === "Selesai");
}
function canMove(from, to) {
  return STATUSES.includes(to) && !["Selesai", "Dibatalkan"].includes(from) &&
    (to === "Dibatalkan" || STATUSES.indexOf(to) === STATUSES.indexOf(from) + 1);
}
function voucherValue(code, subtotal) {
  const v = VOUCHERS.find(x => x.code === String(code || "").trim().toUpperCase());
  if (!v) return { ok: false, amount: 0, message: "Voucher tidak ditemukan." };
  if (subtotal < v.min) return { ok: false, amount: 0, message: `Minimal pembelian ${rp(v.min)}.` };
  return {
    ok: true, code: v.code,
    amount: Math.min(subtotal, v.percent ? Math.round(subtotal * v.percent / 100) : v.amount),
    message: `Voucher ${v.code} berhasil digunakan.`,
  };
}
function folder(value) {
  const name = text(value);
  return ({ pria: "baju pria", wanita: "baju wanita", aksesoris: "aksesoris wanita" })[name] || name;
}
function imagePath(value) {
  if (!value) return "";
  const raw = String(value).trim().replace(/\\/g, "/");
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const parts = raw.replace(/^(\.\/)?public\//i, "").replace(/^\/+/, "").split("/").filter(Boolean);
  if (text(parts[0]) === "images" && parts[1]) {
    try { parts[1] = folder(decodeURIComponent(parts[1])); } catch { parts[1] = folder(parts[1]); }
  } else if (CATEGORIES.some(c => c.folder === folder(parts[0]))) {
    parts[0] = folder(parts[0]); parts.unshift("images");
  }
  return "/" + parts.join("/");
}
function imageUrl(value) {
  const path = imagePath(value);
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const encoded = path.replace(/^\/+/, "").split("/").map(s => {
    try { return encodeURIComponent(decodeURIComponent(s)); }
    catch { return encodeURIComponent(s); }
  }).join("/");
  return `${base}/${encoded}`;
}
const PHOTOS = [
  ...new Map((Array.isArray(productImages) ? productImages : [])
    .filter(p => p?.url)
    .map(p => {
      const url = imagePath(p.url);
      const parts = url.replace(/^\/+/, "").split("/");
      const pos = parts.indexOf("images");
      let dirname = pos >= 0 ? parts[pos + 1] : "";
      try { dirname = decodeURIComponent(dirname); } catch { /* nama asli */ }
      return { ...p, url, folder: folder(p.folder || dirname), name: p.name || parts.at(-1) };
    })
    .filter(p => CATEGORIES.some(c => c.folder === p.folder))
    .map(p => [p.url, p])).values(),
];
const DEFAULT_PRODUCTS = PHOTOS.map(p => {
  const c = CATEGORIES.find(x => x.folder === p.folder);
  return {
    id: `local:${p.url}`, name: `${c.label} — ${p.name}`, collection: c.name,
    image: p.url, gallery: [], price: c.price, stock: 20,
    sizes: c.sizes, colors: ["Sesuai foto"], description: `Koleksi ${c.label} dari LUMINA STORE.`,
  };
});
function loadProducts() {
  const old = localStorage.getItem(KEY.products) !== null ? arr(KEY.products) : arr(KEY.oldProducts);
  const deleted = new Set(arr(KEY.deleted).map(String));
  const saved = old.filter(p => p && p.id != null && p.name && !deleted.has(String(p.id)))
    .map(p => {
      const photo = imagePath(p.image);
      const c = CATEGORIES.find(x => x.name === p.collection) ||
        CATEGORIES.find(x => PHOTOS.some(a => a.url === photo && a.folder === x.folder)) || CATEGORIES[0];
      return { ...p, image: photo, collection: c.name,
        price: Number(p.price) || 0, stock: Math.max(0, Number(p.stock) || 0),
        sizes: Array.isArray(p.sizes) ? p.sizes : c.sizes,
        colors: Array.isArray(p.colors) ? p.colors : ["Sesuai foto"],
        gallery: Array.isArray(p.gallery) ? p.gallery.map(imagePath) : [],
      };
    });
  const seen = new Set(saved.map(p => p.image));
  return [...saved, ...DEFAULT_PRODUCTS.filter(p => !seen.has(p.image) && !deleted.has(String(p.id)))];
}
function Photo({ src, alt, className = "", style }) {
  const [broken, setBroken] = useState("");
  const url = imageUrl(src);
  if (!url || broken === url) return <div className={`lum-photo-placeholder ${className}`} style={style}>Foto belum tersedia</div>;
  return <img className={className} src={url} alt={alt || "Produk LUMINA"} style={style} loading="lazy" onError={() => setBroken(url)} />;
}

// ====================== KATALOG ======================
function ProductCard({ product, favorite, reviewList = [], onDetail, onFavorite, onCart }) {
  const stock = Math.max(0, Number(product.stock) || 0);
  const ratings = reviewList.map(r => Number(r.rating)).filter(n => n >= 1 && n <= 5);
  const average = ratings.length ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1) : null;
  return (
    <article className="product-card lum-premium-card">
      <div className="product-picture">
        <button type="button" className="image-button" onClick={() => onDetail(product)} aria-label={`Lihat ${product.name}`}>
          <Photo src={product.image} alt={prettyName(product.name)} />
        </button>
        <span className={`stock-label ${stock === 0 ? "is-empty" : stock <= 5 ? "is-low" : ""}`}>
          {stock === 0 ? "STOK HABIS" : stock <= 5 ? `TERSISA ${stock}` : "LUMINA EDITION"}
        </span>
        <button className={`heart ${favorite ? "is-saved" : ""}`} aria-label="Wishlist" aria-pressed={favorite}
          type="button" onClick={() => onFavorite(product.id)}>{favorite ? "♥" : "♡"}</button>
        <button type="button" className="lum-image-quickview" onClick={() => onDetail(product)}>Lihat Detail ↗</button>
      </div>
      <div className="product-body">
        <div className="lum-product-topline">
          <small>{product.collection}</small><span>{average ? `★ ${average} (${ratings.length})` : "New arrival"}</span>
        </div>
        <h3>{prettyName(product.name)}</h3><p className="price">{rp(product.price)}</p>
        <p className="muted lum-availability">{stock ? `✓ Ready stock · ${stock} tersedia` : "Sedang tidak tersedia"}</p>
        <div className="product-actions">
          <button className="btn-light" type="button" onClick={() => onDetail(product)}>Detail</button>
          <button className="btn-dark" type="button" disabled={!stock} onClick={() => onCart(product)}>
            {stock ? "+ Keranjang" : "Habis"}
          </button>
        </div>
      </div>
    </article>
  );
}
function ProductGrid({ products, favorites, reviews, onDetail, onFavorite, onCart }) {
  if (!products.length) return <div className="panel lum-empty"><h3>Produk tidak ditemukan</h3><p>Coba ubah kategori atau filter.</p></div>;
  return <div className="product-grid">{products.map(p => (
    <ProductCard key={p.id} product={p} favorite={favorites.includes(p.id)}
      reviewList={Array.isArray(reviews[String(p.id)]) ? reviews[String(p.id)] : []}
      onDetail={onDetail} onFavorite={onFavorite} onCart={onCart} />
  ))}</div>;
}

// ====================== DETAIL PREMIUM 2.0 ======================
function ProductDetail({ product, customer, size, color, onSize, onColor,
  onCart, onFavorite, favorite, reviews, onReview, onBack }) {
  const images = [...new Set([product.image, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter(Boolean))];
  const [active, setActive] = useState(product.image);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const list = Array.isArray(reviews[String(product.id)]) ? reviews[String(product.id)] : [];
  const userId = customer ? String(customer.id ?? customer.email ?? "") : "";
  const mine = list.find(r => String(r.userId) === userId);
  const average = list.length ? (list.reduce((sum,r) => sum + Number(r.rating || 0), 0) / list.length).toFixed(1) : null;
  useEffect(() => { setActive(product.image); }, [product.id, product.image]);
  useEffect(() => { setRating(mine?.rating || 5); setComment(mine?.comment || ""); }, [product.id, userId]);
  function submit(event) {
    event.preventDefault();
    if (!userId) { setNotice("Login untuk memberikan ulasan."); return; }
    if (comment.trim().length < 5) { setNotice("Ulasan minimal 5 karakter."); return; }
    const record = {
      id: mine?.id || `review-${Date.now()}`, userId,
      name: customer.name || "Pelanggan", rating,
      comment: comment.trim().slice(0, 500), at: new Date().toISOString(),
    };
    onReview(product.id, mine ? list.map(r => r.id === mine.id ? record : r) : [record, ...list]);
    setNotice("Ulasan berhasil disimpan.");
  }
  return (
    <main className="container section lum-new-detail">
      <button className="back" type="button" onClick={onBack}>← Kembali ke Shop</button>
      <div className="lum-detail-grid">
        <div>
          <div className="lum-detail-main"><Photo src={active} alt={product.name} /></div>
          <div className="lum-detail-thumbs">{images.map((url,i) => (
            <button type="button" key={url} className={active === url ? "active" : ""} onClick={() => setActive(url)}>
              <Photo src={url} alt={`Foto ${i+1}`} />
            </button>
          ))}</div>
          <p className="muted">{images.length} foto produk</p>
        </div>
        <div className="lum-detail-data">
          <p className="eyebrow">{product.collection}</p>
          <h1>{prettyName(product.name)}</h1>
          <p className="lum-stars" aria-label="Rating produk">{average ? `★ ${average}/5 · ${list.length} ulasan pembeli` : "☆ Belum ada ulasan"}</p>
          <h2 className="price">{rp(product.price)}</h2>
          <p>{product.description || "Fashion pilihan LUMINA STORE."}</p>
          <p>Stok: <strong>{product.stock}</strong></p>
          <label>Ukuran</label>
          <div className="option-row">{(product.sizes || ["All Size"]).map(v => (
            <button type="button" key={v} className={size === v ? "chosen" : ""} onClick={() => onSize(v)}>{v}</button>
          ))}</div>
          <label>Warna</label>
          <div className="option-row">{(product.colors || ["Sesuai foto"]).map(v => (
            <button type="button" key={v} className={color === v ? "chosen" : ""} onClick={() => onColor(v)}>{v}</button>
          ))}</div>
          <button className="btn-dark wide" type="button" disabled={Number(product.stock) <= 0}
            onClick={() => onCart(product, size, color)}>+ Tambahkan ke Keranjang</button>
          <button className="btn-light wide" type="button" onClick={() => onFavorite(product.id)}>
            {favorite ? "♥ Hapus dari Wishlist" : "♡ Tambahkan ke Wishlist"}
          </button>
        </div>
      </div>
      <section className="lum-review-box">
        <h2>Ulasan Pelanggan</h2>
        <div className="lum-review-grid">
          <div>{list.length ? list.map(r => (
            <article className="panel" key={r.id}>
              <strong>{r.name}</strong>
              <p className="lum-stars">{"★".repeat(Math.min(5,Math.max(0,Number(r.rating)||0)))}</p>
              <p>{r.comment}</p><small>{date(r.at)}</small>
            </article>
          )) : <p className="muted">Belum ada ulasan.</p>}</div>
          <form className="panel form-stack" onSubmit={submit}>
            <h3>{mine ? "Edit Ulasan" : "Tulis Ulasan"}</h3>
            <div className="lum-rating-buttons">{[1,2,3,4,5].map(n => (
              <button key={n} type="button" className={n <= rating ? "active" : ""} onClick={() => setRating(n)}>★</button>
            ))}</div>
            <textarea rows={4} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} placeholder="Bagikan pengalamanmu..." />
            <button className="btn-dark">Simpan Ulasan</button>
            {notice && <p role="status">{notice}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
function RelatedProducts({ product, products, favorites, reviews, onDetail, onFavorite, onCart }) {
  const related = useMemo(() => products
    .filter(p => p.id !== product.id && p.collection === product.collection)
    .sort((a,b) => Math.abs(Number(a.price)-Number(product.price)) - Math.abs(Number(b.price)-Number(product.price)))
    .slice(0,4), [product.id, product.collection, product.price, products]);
  if (!related.length) return null;
  return <section className="container section lum-related-products">
    <p className="eyebrow center">DISCOVER MORE</p><h2 className="section-title">You May Also Like</h2>
    <p className="section-description">Rekomendasi produk dari kategori yang sama.</p>
    <ProductGrid products={related} favorites={favorites} reviews={reviews}
      onDetail={onDetail} onFavorite={onFavorite} onCart={onCart} />
  </section>;
}

// ====================== PELACAKAN PESANAN ======================
function CustomerTracking({ orders }) {
  const stages = STATUSES.slice(0, 4);
  return <section className="container section lum-customer-track">
    <h2 className="section-title">Tracking & Pembayaran Saya</h2>
    {!orders.length && <p className="panel">Belum ada pesanan.</p>}
    {orders.map(o => {
      const current = status(o.status), index = stages.indexOf(current);
      return <article className="panel lum-track-card" key={o.id}>
        <div className="lum-between"><div><strong>{o.id}</strong><p>{date(o.date)} · {rp(o.total)}</p></div><span>{current}</span></div>
        <p>Metode: <b>{paymentLabel(o.paymentMethod)}</b></p>
        <p>Status pembayaran: <b>{payStatus(o)}</b></p>
        {o.voucherCode && <p>Voucher {o.voucherCode} · Hemat {rp(o.discount)}</p>}
        {current === "Dibatalkan" ? <p className="lum-cancel-note">Pesanan dibatalkan.</p> :
          <div className="lum-track-steps">{stages.map((s,i) => (
            <div key={s} className={i <= index ? "complete" : ""}><span>{i < index ? "✓" : i+1}</span><small>{s}</small></div>
          ))}</div>}
        {payStatus(o) === "Lunas" ? <p className="lum-paid-note">✓ Pembayaran dikonfirmasi {o.paidAt && date(o.paidAt)}</p> :
          current !== "Dibatalkan" && <p className="muted">{o.paymentMethod === "cod" ? "COD dibayar saat paket diterima." : "Menunggu konfirmasi pembayaran simulasi Admin."}</p>}
      </article>;
    })}
  </section>;
}

// ====================== DASHBOARD ADMIN ======================
function AdminAnalytics({ orders, products }) {
  const done = orders.filter(o => status(o.status) === "Selesai");
  const revenue = done.reduce((sum,o) => sum + Number(o.total || 0),0);
  const qty = done.flatMap(o => o.items || []).reduce((sum,i) => sum + Number(i.quantity || 0),0);
  const now = new Date();
  const months = Array.from({ length:6 },(_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i,1);
    return { key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
      label:d.toLocaleDateString("id-ID",{month:"short",year:"2-digit"}), total:0 };
  });
  const sold = new Map();
  done.forEach(o => {
    const end = [...(o.history||[])].reverse().find(h => h.status === "Selesai");
    const d = new Date(end?.at || o.updatedAt || o.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const month = months.find(m => m.key === key);
    if (month) month.total += Number(o.total||0);
    (o.items||[]).forEach(i => {
      const k = String(i.id ?? i.name), current = sold.get(k) || { name:i.name, qty:0 };
      current.qty += Number(i.quantity||0); sold.set(k,current);
    });
  });
  const max = Math.max(1,...months.map(m => m.total));
  const best = [...sold.values()].sort((a,b) => b.qty-a.qty).slice(0,5);
  return <section className="lum-analytics">
    <h2>Advanced Sales Analytics</h2><p className="muted">Berdasarkan transaksi simulasi di browser.</p>
    <div className="lum-analytics-cards">{[
      ["Pendapatan Selesai",rp(revenue)], ["Pesanan Selesai",done.length],
      ["Unit Terjual",qty], ["Stok ≤ 5",products.filter(p => Number(p.stock)<=5).length],
    ].map(([label,value]) => <article className="lum-dash-card" key={label}><small>{label}</small><h2>{value}</h2></article>)}</div>
    <div className="lum-analytics-panels">
      <article className="lum-dash-card"><h3>Pendapatan 6 Bulan</h3><div className="lum-mini-chart">{months.map(m => (
        <div key={m.key} title={`${m.label}: ${rp(m.total)}`}><div className="lum-chart-track">
          <div style={{height:`${m.total ? Math.max(3,m.total/max*100) : 0}%`}} />
        </div><small>{m.label}</small></div>
      ))}</div></article>
      <article className="lum-dash-card"><h3>Status Pesanan</h3>{STATUSES.map(s => (
        <p className="lum-between" key={s}><span>{s}</span><b>{orders.filter(o => status(o.status)===s).length}</b></p>
      ))}</article>
    </div>
    <article className="lum-dash-card"><h3>5 Produk Terlaris</h3>{best.length ? best.map((p,i) => (
      <p className="lum-between" key={i}><span>{i+1}. {prettyName(p.name)}</span><b>{p.qty} unit</b></p>
    )) : <p>Belum ada transaksi selesai.</p>}</article>
  </section>;
}
function OrderTable({ orders, edit=false, onStatus, onPay }) {
  return <div className="lum-dash-table-wrap"><table className="lum-dash-table">
    <thead><tr>{["ID Pesanan","Tanggal","Pelanggan","Produk","Subtotal","Voucher","Diskon","Total","Metode Bayar","Status Bayar","Status Pesanan"].map(h => <th key={h}>{h}</th>)}{edit && <th>Aksi</th>}</tr></thead>
    <tbody>{orders.map(o => {
      const s = status(o.status), paid = payStatus(o)==="Lunas";
      return <tr key={o.id}>
        <td>{o.id}</td><td>{date(o.date)}</td><td>{o.customer}</td>
        <td>{(o.items||[]).map(i => `${prettyName(i.name)} (${i.quantity})`).join(", ")}</td>
        <td>{o.subtotal != null ? rp(o.subtotal) : "-"}</td><td>{o.voucherCode || "-"}</td>
        <td>{o.discount ? `−${rp(o.discount)}` : "-"}</td><td><b>{rp(o.total)}</b></td>
        <td>{paymentLabel(o.paymentMethod)}</td><td>{payStatus(o)}</td>
        <td>{edit ? <select value={s} disabled={["Selesai","Dibatalkan"].includes(s)} onChange={e => onStatus(o.id,e.target.value)}>
          {STATUSES.map(next => <option key={next} value={next} disabled={next!==s && (!canMove(s,next) || (next!=="Dibatalkan" && ["transfer","qris"].includes(o.paymentMethod) && !paid))}>{next}</option>)}
        </select> : s}</td>
        {edit && <td><button className="btn-dark" type="button" disabled={!canPay(o)} onClick={() => onPay(o.id)}>
          {paid ? "✓ Lunas" : o.paymentMethod==="cod" ? "Konfirmasi COD" : "Tandai Lunas"}
        </button></td>}
      </tr>;
    })}
    {!orders.length && <tr><td colSpan={edit?12:11}>Belum ada pesanan.</td></tr>}</tbody>
  </table></div>;
}
function AdminDashboard({ products, orders, form, setForm, onSave, onEdit, onDelete, onStatus, onPay, onBack }) {
  const [tab,setTab] = useState("overview");
  const [search,setSearch] = useState("");
  const [folderFilter,setFolderFilter] = useState("Semua");
  const [chosenId,setChosenId] = useState("");
  const matches = p => text(`${p.name} ${p.collection}`).includes(text(search));
  const productList = products.filter(matches);
  const orderList = orders.filter(o => text(`${o.id} ${o.customer} ${o.status} ${o.voucherCode||""}`).includes(text(search)));
  const photoList = PHOTOS.filter(p => (folderFilter==="Semua" || p.folder===folderFilter) && text(`${p.name} ${p.folder}`).includes(text(search)));
  const chosen = orderList.find(o => String(o.id)===chosenId) || orderList[0];
  const done = orders.filter(o => status(o.status)==="Selesai");
  const revenue = done.reduce((sum,o) => sum + Number(o.total||0),0);
  const currentCat = CATEGORIES.find(c => c.name===form.collection);
  const field = (key,value) => setForm(prev => ({...prev,[key]:value}));
  function exportCSV() {
    const rows = [["ID","Tanggal","Pelanggan","Subtotal","Ongkir","Voucher","Diskon","Total","Metode","Status Bayar","Status Pesanan"],
      ...orderList.map(o => [o.id,o.date,o.customer,o.subtotal??"",o.shippingFee??"",o.voucherCode||"",o.discount||0,o.total,paymentLabel(o.paymentMethod),payStatus(o),status(o.status)])];
    const csv = rows.map(row => row.map(value => {
      let s = String(value??""); if (/^[=+\-@\t\r]/.test(s)) s = "'"+s;
      return `"${s.replaceAll('"','""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a");a.href=url;a.download="laporan-lumina.csv";a.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  return <div className="lum-dash">
    <aside className="lum-dash-sidebar">
      <div className="lum-dash-logo">LUMINA<span>.</span></div><p>MANAGEMENT SYSTEM</p>
      <nav className="lum-dash-menu">{[
        ["overview","Overview"],["products","Products"],["orders","Orders"],["reports","Sales Report"],["gallery","Photo Gallery"],
      ].map(([value,label]) => <button key={value} className={tab===value?"active":""} onClick={() => {setTab(value);setSearch("");}}>{label}</button>)}</nav>
      <button className="lum-dash-back" onClick={onBack}>← Kembali ke Toko</button>
    </aside>
    <main className="lum-dash-main">
      <header className="lum-dash-topbar"><div>
        <small className="lum-dash-eyebrow">LUMINA BUSINESS CENTER</small>
        <h1>{({overview:"Dashboard Overview",products:"Product Management",orders:"Order Management",reports:"Sales Report",gallery:"Photo Gallery"})[tab]}</h1>
      </div><input value={search} placeholder="Cari produk atau pesanan..." onChange={e=>setSearch(e.target.value)}/></header>
      {tab==="overview" && <>
        <AdminAnalytics orders={orders} products={products}/>
        <section className="lum-dash-card"><h2>Inventory Monitoring</h2>
          {products.some(p => Number(p.stock)<=5) ? products.filter(p=>Number(p.stock)<=5).map(p=><p className="lum-between" key={p.id}><span>{prettyName(p.name)}</span><b>Stok {p.stock}</b></p>) : <p>✓ Semua stok aman.</p>}
        </section>
        <section className="lum-dash-card"><h2>Collection Overview</h2><div className="lum-category-stats">
          {CATEGORIES.map(c=><button className="btn-light" key={c.name} onClick={()=>{setFolderFilter(c.folder);setTab("gallery");}}>{c.label} ({products.filter(p=>p.collection===c.name).length})</button>)}
        </div></section>
        <section className="lum-dash-card"><h2>Recent Orders</h2><OrderTable orders={orders.slice(0,5)}/></section>
      </>}
      {tab==="products" && <div className="lum-dash-products">
        <form className="lum-dash-card lum-product-form" onSubmit={onSave}>
          <h2>{form.id===null?"Tambah Produk":"Edit Produk"}</h2>
          <label>Nama Produk<input required value={form.name} onChange={e=>field("name",e.target.value)}/></label>
          <label>Kategori<select value={form.collection} onChange={e=>{
            const c=CATEGORIES.find(x=>x.name===e.target.value);
            if(c) setForm(prev=>({...prev,collection:c.name,image:"",gallery:"",sizes:c.sizes.join(",")}));
          }}>{CATEGORIES.map(c=><option value={c.name} key={c.name}>{c.label}</option>)}</select></label>
          <label>Harga<input type="number" required min="1" value={form.price} onChange={e=>field("price",e.target.value)}/></label>
          <label>Stok<input type="number" required min="0" step="1" value={form.stock} onChange={e=>field("stock",e.target.value)}/></label>
          <label>Foto Utama<select value={form.image} onChange={e=>field("image",e.target.value)}>
            <option value="">Pilih gambar</option>{PHOTOS.filter(p=>p.folder===currentCat?.folder).map(p=><option key={p.url} value={p.url}>{p.name}</option>)}
          </select></label>
          <div className="lum-admin-preview"><Photo src={form.image} alt="Preview"/></div>
          <label>Foto Tambahan<select value="" onChange={e=>{
            if(e.target.value) setForm(prev=>({...prev,gallery:[...new Set([...values(prev.gallery),e.target.value])].filter(x=>x!==prev.image).join(",")}));
          }}><option value="">+ Pilih foto tambahan</option>
            {PHOTOS.filter(p=>p.folder===currentCat?.folder && p.url!==form.image && !values(form.gallery).includes(p.url)).map(p=><option key={p.url} value={p.url}>{p.name}</option>)}
          </select></label>
          <div className="lum-extra-gallery">{values(form.gallery).map(url=><div key={url}>
            <div className="lum-admin-thumb"><Photo src={url} alt="Tambahan"/></div>
            <button type="button" className="btn-light" onClick={()=>field("gallery",values(form.gallery).filter(x=>x!==url).join(","))}>Hapus</button>
          </div>)}</div>
          <label>Deskripsi<textarea rows={3} value={form.description} onChange={e=>field("description",e.target.value)}/></label>
          <label>Ukuran (pisahkan dengan koma)<input value={form.sizes} onChange={e=>field("sizes",e.target.value)}/></label>
          <label>Warna (pisahkan dengan koma)<input value={form.colors} onChange={e=>field("colors",e.target.value)}/></label>
          <button type="submit" className="btn-dark">Simpan Produk</button>
          {form.id!==null && <button type="button" className="btn-light" onClick={()=>setForm({...EMPTY_PRODUCT})}>Batal Edit</button>}
        </form>
        <section className="lum-dash-card"><h2>Daftar Produk ({products.length})</h2>
          {productList.map(p=><div className="lum-dash-product-row" key={p.id}>
            <div className="lum-admin-thumb"><Photo src={p.image} alt={p.name}/></div>
            <div className="lum-admin-product-info"><strong>{prettyName(p.name)}</strong><p>{rp(p.price)} · Stok {p.stock}</p></div>
            <button className="btn-light" onClick={()=>onEdit(p)}>Edit</button>
            <button className="btn-light" onClick={()=>onDelete(p.id)}>Hapus</button>
          </div>)}
        </section>
      </div>}
      {tab==="orders" && <section className="lum-dash-card">
        <h2>Manajemen Pesanan & Pembayaran</h2>
        <p className="muted">Transfer/QRIS harus dikonfirmasi sebelum diproses. COD setelah Selesai. Semua pembayaran hanya simulasi.</p>
        {chosen && <>
          <label>Pilih Pesanan<select value={String(chosen.id)} onChange={e=>setChosenId(e.target.value)}>
            {orderList.map(o=><option key={o.id} value={String(o.id)}>{o.id} — {o.customer}</option>)}
          </select></label>
          <div className="lum-payment-detail">
            <p><b>Metode:</b> {paymentLabel(chosen.paymentMethod)}</p>
            <p><b>Status pembayaran:</b> {payStatus(chosen)}</p>
            <p><b>Voucher:</b> {chosen.voucherCode||"-"} · <b>Diskon:</b> {rp(chosen.discount||0)}</p>
            <p><b>Total:</b> {rp(chosen.total)}</p>
            {chosen.paidAt && <p>Dikonfirmasi: {date(chosen.paidAt)}</p>}
            <button className="btn-dark" disabled={!canPay(chosen)} onClick={()=>onPay(chosen.id)}>
              {payStatus(chosen)==="Lunas" ? "✓ Lunas" : chosen.paymentMethod==="cod" ? "Konfirmasi COD" : "Tandai Lunas"}
            </button>
          </div>
          <OrderStatusFlow status={status(chosen.status)}/><OrderHistory order={chosen}/>
        </>}
        <h3>Daftar Pesanan</h3><OrderTable orders={orderList} edit onStatus={onStatus} onPay={onPay}/>
      </section>}
      {tab==="reports" && <section className="lum-dash-card">
        <h2>Sales Report</h2>
        <p>Total Pesanan: {orders.length} · Selesai: {done.length} · Pendapatan Selesai: {rp(revenue)}</p>
        <OrderTable orders={orderList}/>
        <div className="lum-report-actions">
          <button className="btn-dark" disabled={!orderList.length} onClick={()=>downloadTransactionsPDF(orderList)}>Download PDF</button>
          <button className="btn-light" disabled={!orderList.length} onClick={exportCSV}>Download CSV</button>
        </div>
        <small className="muted">Format PDF mengikuti utils/reportPdf.js.</small>
      </section>}
      {tab==="gallery" && <section className="lum-dash-card">
        <h2>Photo Gallery</h2>
        <select value={folderFilter} onChange={e=>setFolderFilter(e.target.value)}>
          <option value="Semua">Semua</option>{CATEGORIES.map(c=><option key={c.folder} value={c.folder}>{c.label}</option>)}
        </select>
        <p>{photoList.length} foto tersedia</p>
        <div className="lum-gallery">{photoList.map(p=><article key={p.url}>
          <Photo src={p.url} alt={p.name}/><small>{p.folder} / {p.name}</small>
        </article>)}</div>
      </section>}
    </main>
    <aside className="lum-dash-right">
      <h3>Store Summary</h3><p>Total Produk: {products.length}</p><p>Foto Lokal: {PHOTOS.length}</p>
      <p>Total Pesanan: {orders.length}</p><p>Stok Menipis: {products.filter(p=>Number(p.stock)<=5).length}</p>
    </aside>
  </div>;
}

// ====================== APLIKASI UTAMA ======================
export default function App() {
  const [products,setProducts] = useState(loadProducts);
  const [orders,setOrders] = useState(() => arr(KEY.orders));
  const [customer,setCustomer] = useState(() => read(KEY.session,null));
  const [cart,setCart] = useState(() => arr(KEY.cart));
  const [wishlist,setWishlist] = useState(() => arr(KEY.wishlist));
  const [reviews,setReviews] = useState(() => read(KEY.reviews,{}));
  const [page,setPage] = useState(() => window.location.hash==="#admin"?"admin":"home");
  const [returnPage,setReturnPage] = useState("home");
  const [category,setCategory] = useState("All");
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState("default");
  const [shownCount,setShownCount] = useState(12);
  const [filterPrice,setFilterPrice] = useState("all");
  const [filterSize,setFilterSize] = useState("all");
  const [filterColor,setFilterColor] = useState("all");
  const [onlyReady,setOnlyReady] = useState(false);
  const [selectedId,setSelectedId] = useState(null);
  const [size,setSize] = useState("");
  const [color,setColor] = useState("");
  const [form,setForm] = useState({...EMPTY_PRODUCT});
  const [checkout,setCheckout] = useState({...EMPTY_CHECKOUT});
  const [voucherInput,setVoucherInput] = useState("");
  const [appliedVoucher,setAppliedVoucher] = useState("");
  const [voucherMessage,setVoucherMessage] = useState("");
  const [message,setMessage] = useState("");
  const [lastId,setLastId] = useState("");
  const checkoutLock = useRef(false);
  const statusLock = useRef(new Set());
  const paymentLock = useRef(new Set());

  // Penyimpanan tetap menggunakan key lama agar data demo tidak hilang.
  useEffect(() => { store(KEY.products,products); },[products]);
  useEffect(() => { store(KEY.orders,orders); statusLock.current.clear(); paymentLock.current.clear(); },[orders]);
  useEffect(() => { store(KEY.cart,cart); },[cart]);
  useEffect(() => { store(KEY.wishlist,wishlist); },[wishlist]);
  useEffect(() => { store(KEY.reviews,reviews); },[reviews]);
  useEffect(() => {
    if(customer) store(KEY.session,customer); else localStorage.removeItem(KEY.session);
  },[customer]);
  useEffect(() => {
    if(!message) return;
    const timer=setTimeout(()=>setMessage(""),3500);
    return ()=>clearTimeout(timer);
  },[message]);

  // Tahap 5 — Filter Produk Premium.
  const categoryProducts = useMemo(() => products.filter(p => category==="All" || p.collection===category),[products,category]);
  const availableSizes = useMemo(() => [...new Set(categoryProducts.flatMap(p=>Array.isArray(p.sizes)?p.sizes:[]))]
    .sort((a,b)=>String(a).localeCompare(String(b),"id",{numeric:true})),[categoryProducts]);
  const availableColors = useMemo(() => [...new Set(categoryProducts.flatMap(p=>Array.isArray(p.colors)?p.colors:[]))]
    .sort((a,b)=>String(a).localeCompare(String(b),"id")),[categoryProducts]);
  useEffect(() => { setShownCount(12); },[category,search,sort,filterPrice,filterSize,filterColor,onlyReady]);
  const visible = useMemo(() => categoryProducts.filter(p => {
    const price = Number(p.price)||0;
    return text(`${p.name} ${p.collection} ${p.description||""}`).includes(text(search)) &&
      (filterPrice==="all" || (filterPrice==="low" && price<200000) ||
       (filterPrice==="mid" && price>=200000 && price<=300000) ||
       (filterPrice==="high" && price>300000)) &&
      (filterSize==="all" || (Array.isArray(p.sizes) && p.sizes.includes(filterSize))) &&
      (filterColor==="all" || (Array.isArray(p.colors) && p.colors.includes(filterColor))) &&
      (!onlyReady || Number(p.stock)>0);
  }).sort((a,b) => {
    if(sort==="low") return Number(a.price)-Number(b.price);
    if(sort==="high") return Number(b.price)-Number(a.price);
    if(sort==="name") return a.name.localeCompare(b.name);
    return 0;
  }),[categoryProducts,search,sort,filterPrice,filterSize,filterColor,onlyReady]);
  function resetShopFilters() {
    setCategory("All");setSearch("");setSort("default");
    setFilterPrice("all");setFilterSize("all");setFilterColor("all");
    setOnlyReady(false);setShownCount(12);
  }

  const selected = products.find(p=>p.id===selectedId);
  const validCart = cart.map(item => {
    const p=products.find(x=>x.id===item.id);
    if(!p) return null;
    return {...p,key:item.key||JSON.stringify([item.id,item.size,item.color]),size:item.size,color:item.color,
      quantity:Math.max(1,Math.floor(Number(item.quantity)||1))};
  }).filter(Boolean);
  const count=validCart.reduce((sum,i)=>sum+i.quantity,0);
  const subtotal=validCart.reduce((sum,i)=>sum+Number(i.price)*i.quantity,0);
  const shipping=checkout.shipping==="express"?25000:12000;
  const applied=appliedVoucher?voucherValue(appliedVoucher,subtotal):null;
  const discount=applied?.ok?applied.amount:0;
  const total=subtotal-discount+shipping;
  const mine=customer?orders.filter(o=>String(o.customerId)===String(customer.id)):[];
  const hero=PHOTOS.find(p=>p.folder==="baju wanita")?.url||PHOTOS[0]?.url||products.find(p=>p.image)?.image;
  const currentOrder=orders.find(o=>o.id===lastId)||orders[0];

  function go(next) {
    if(["home","shop","cart"].includes(next)) checkoutLock.current=false;
    setPage(next);
    window.history.replaceState(null,"",window.location.pathname+window.location.search+(next==="admin"?"#admin":""));
    window.scrollTo(0,0);
  }
  function choose(next) {
    setCategory(next);setSearch("");setFilterSize("all");setFilterColor("all");go("shop");
  }
  function openProduct(p) {
    setSelectedId(p.id);setSize(p.sizes?.[0]||"All Size");setColor(p.colors?.[0]||"Sesuai foto");go("detail");
  }
  function auth(next="home") { setReturnPage(next);go("auth"); }
  function login(user) {
    setCustomer(user);setCheckout(p=>({...p,name:p.name||user.name}));go(returnPage);setMessage(`Selamat datang, ${user.name}!`);
  }
  function logout() {setCustomer(null);go("home");setMessage("Berhasil logout.");}
  function toggleFavorite(id) {setWishlist(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id]);}
  function reviewProduct(id,list) {setReviews(prev=>({...prev,[String(id)]:list}));}
  function addToCart(product,chosenSize,chosenColor) {
    const p=products.find(v=>v.id===product.id);if(!p)return;
    const used=cart.filter(v=>v.id===p.id).reduce((sum,v)=>sum+Number(v.quantity),0);
    if(used>=Number(p.stock)) {setMessage("Stok tidak mencukupi.");return;}
    const selectedSize=chosenSize||p.sizes?.[0]||"All Size";
    const selectedColor=chosenColor||p.colors?.[0]||"Sesuai foto";
    const key=JSON.stringify([p.id,selectedSize,selectedColor]);
    setCart(prev=>{
      const found=prev.find(v=>(v.key||JSON.stringify([v.id,v.size,v.color]))===key);
      return found?prev.map(v=>(v.key||JSON.stringify([v.id,v.size,v.color]))===key?
        {...v,key,quantity:Number(v.quantity)+1}:v):
        [...prev,{id:p.id,key,size:selectedSize,color:selectedColor,quantity:1}];
    });
    setMessage("Produk masuk keranjang.");
  }
  function changeQty(key,step) {
    const item=validCart.find(i=>i.key===key);if(!item)return;
    const used=cart.filter(v=>v.id===item.id).reduce((sum,v)=>sum+Number(v.quantity),0);
    if(step>0 && used>=Number(item.stock)){setMessage("Stok tidak mencukupi.");return;}
    setCart(prev=>prev.map(v=>{
      const k=v.key||JSON.stringify([v.id,v.size,v.color]);
      return k===key?{...v,key,quantity:Number(v.quantity)+step}:v;
    }).filter(v=>v.quantity>0));
  }
  function applyVoucher() {
    const result=voucherValue(voucherInput,subtotal);
    setAppliedVoucher(result.ok?result.code:"");setVoucherMessage(result.message);
  }
  function clearVoucher() {setVoucherInput("");setAppliedVoucher("");setVoucherMessage("");}
  function placeOrder(event) {
    event.preventDefault();
    if(checkoutLock.current)return;
    if(!customer){auth("checkout");return;}
    if(!validCart.length){setMessage("Keranjang kosong.");return;}
    if(!checkout.name.trim()||!checkout.address.trim()||!/^[0-9+()\s-]{8,20}$/.test(checkout.phone.trim())){
      setMessage("Periksa nama, telepon, dan alamat.");return;
    }
    const quantities=new Map();
    validCart.forEach(i=>quantities.set(i.id,(quantities.get(i.id)||0)+i.quantity));
    for(const [id,qty] of quantities){
      const p=products.find(v=>v.id===id);
      if(!p||Number(p.stock)<qty){setMessage("Stok tidak mencukupi.");return;}
    }
    checkoutLock.current=true;
    const now=new Date().toISOString(),id=`LM-${Date.now()}`;
    const method=METHODS.some(m=>m.value===checkout.payment)?checkout.payment:"cod";
    const promo=appliedVoucher?voucherValue(appliedVoucher,subtotal):null;
    const cut=promo?.ok?promo.amount:0;
    const order={
      id,date:now,customer:checkout.name.trim(),customerId:customer.id,customerEmail:customer.email,
      phone:checkout.phone.trim(),address:checkout.address.trim(),shipping:checkout.shipping,
      shippingFee:shipping,paymentMethod:method,
      paymentStatus:method==="cod"?"Bayar di Tempat":"Menunggu Pembayaran",paidAt:null,paymentHistory:[],
      items:validCart.map(i=>({...i})),subtotal,voucherCode:promo?.ok?promo.code:null,
      discount:cut,total:subtotal-cut+shipping,status:"Pesanan Baru",stockRestored:false,
      history:[{id:`${id}-created`,from:null,status:"Pesanan Baru",at:now,by:"Sistem",note:`Checkout ${paymentLabel(method)}`}],
    };
    setOrders(prev=>[order,...prev]);
    setProducts(prev=>prev.map(p=>({...p,stock:Number(p.stock)-(quantities.get(p.id)||0)})));
    setCart([]);setCheckout({...EMPTY_CHECKOUT});clearVoucher();setLastId(id);go("success");setMessage("Pesanan berhasil dibuat.");
  }
  function confirmPayment(id) {
    const order=orders.find(o=>o.id===id);
    if(!canPay(order)||paymentLock.current.has(id))return;
    if(!window.confirm(`Tandai pembayaran ${id} sebagai LUNAS? (Simulasi)`))return;
    paymentLock.current.add(id);const now=new Date().toISOString();
    setOrders(prev=>prev.map(o=>o.id===id?{
      ...o,paymentStatus:"Lunas",paidAt:now,paymentConfirmedBy:"Admin Demo",
      paymentHistory:[...(Array.isArray(o.paymentHistory)?o.paymentHistory:[]),
        {id:`${id}-paid-${Date.now()}`,at:now,status:"Lunas",by:"Admin Demo",note:"Pembayaran simulasi dikonfirmasi."}],
    }:o));
    setMessage("Pembayaran Lunas.");
  }
  function changeStatus(id,next) {
    const order=orders.find(o=>o.id===id);
    if(!order||statusLock.current.has(id))return;
    const current=status(order.status);
    if(!canMove(current,next)){setMessage("Status harus berurutan.");return;}
    if(next!=="Dibatalkan"&&["transfer","qris"].includes(order.paymentMethod)&&payStatus(order)!=="Lunas"){
      setMessage("Konfirmasi pembayaran dahulu.");return;
    }
    if(next==="Dibatalkan"&&!window.confirm(`Yakin membatalkan pesanan ${id}?`))return;
    statusLock.current.add(id);const now=new Date().toISOString();
    if(next==="Dibatalkan"&&!order.stockRestored){
      const quantities=new Map();(order.items||[]).forEach(i=>quantities.set(i.id,(quantities.get(i.id)||0)+Number(i.quantity||0)));
      setProducts(prev=>prev.map(p=>({...p,stock:Number(p.stock)+(quantities.get(p.id)||0)})));
    }
    setOrders(prev=>prev.map(o=>o.id===id?{
      ...o,status:next,updatedAt:now,stockRestored:!!o.stockRestored||next==="Dibatalkan",
      history:[...(Array.isArray(o.history)?o.history:[]),
        {id:`${id}-${Date.now()}-${next}`,from:current,status:next,at:now,by:"Admin Demo",note:`Status menjadi ${next}`}],
    }:o));
    setMessage(`Status: ${next}`);
  }
  function saveProduct(event) {
    event.preventDefault();const c=CATEGORIES.find(x=>x.name===form.collection);
    const price=Number(form.price),stock=Number(form.stock);
    if(!form.name.trim()||!c||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0){
      setMessage("Periksa nama, harga, dan stok.");return;
    }
    if(form.image&&!PHOTOS.some(p=>p.url===form.image&&p.folder===c.folder)){
      setMessage("Foto tidak sesuai kategori.");return;
    }
    if(form.image&&products.some(p=>p.id!==form.id&&p.image===form.image)){
      setMessage("Foto telah digunakan produk lain.");return;
    }
    const sizes=values(form.sizes),colors=values(form.colors);
    if(!sizes.length||!colors.length){setMessage("Ukuran dan warna wajib diisi.");return;}
    const gallery=[...new Set(values(form.gallery).filter(url=>url!==form.image&&PHOTOS.some(p=>p.url===url&&p.folder===c.folder)))];
    const product={id:form.id??`custom:${Date.now()}`,name:form.name.trim(),collection:c.name,image:form.image,
      gallery,price,stock,description:form.description.trim(),sizes,colors};
    setProducts(prev=>form.id===null?[...prev,product]:prev.map(p=>p.id===form.id?product:p));
    setForm({...EMPTY_PRODUCT});setMessage("Produk berhasil disimpan.");
  }
  function editProduct(p) {
    setForm({id:p.id,name:p.name,collection:p.collection,image:p.image||"",gallery:(p.gallery||[]).join(","),
      price:String(p.price),stock:String(p.stock),description:p.description||"",sizes:(p.sizes||[]).join(","),colors:(p.colors||[]).join(",")});
    window.scrollTo(0,0);
  }
  function deleteProduct(id) {
    if(orders.some(o=>!["Selesai","Dibatalkan"].includes(status(o.status))&&o.items?.some(i=>i.id===id))){
      setMessage("Selesaikan pesanan aktif dahulu.");return;
    }
    if(!window.confirm("Hapus produk ini?"))return;
    const p=products.find(v=>v.id===id),deleted=new Set(arr(KEY.deleted).map(String));
    deleted.add(String(id));if(p?.image)deleted.add(`local:${p.image}`);
    store(KEY.deleted,[...deleted]);setProducts(prev=>prev.filter(v=>v.id!==id));
    setCart(prev=>prev.filter(v=>v.id!==id));setWishlist(prev=>prev.filter(v=>v!==id));
    setMessage("Produk dihapus.");
  }

  return <div className={`lumina ${page==="admin"?"admin-mode":""}`}>
    {/* Satu file App.jsx; styling tambahan tidak membutuhkan App.css baru. */}
    <style>{`
      .lumina .lum-premium-filter-panel{margin:24px 0;padding:24px;border:1px solid #e7d8c9;border-radius:18px;background:#fbf7f2}
      .lumina .lum-premium-filter-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:20px}
      .lumina .lum-filter-eyebrow{font-size:11px;letter-spacing:1.5px;font-weight:700;color:#997253}
      .lumina .lum-premium-filter-header h3{margin:5px 0;color:#34261d}
      .lumina .lum-premium-filter-header p{margin:0;color:#84776d}
      .lumina .lum-premium-filter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:end}
      .lumina .lum-premium-filter-grid>label{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:600;color:#4b382a}
      .lumina .lum-premium-filter-grid select{min-height:44px;width:100%;padding:10px;border-radius:9px;border:1px solid #dbc8b8;background:white}
      .lumina .lum-premium-filter-grid .lum-filter-stock{flex-direction:row;align-items:center;min-height:44px;padding:10px;background:#f1e7dc;border-radius:9px}
      .lumina .lum-filter-stock input{accent-color:#876247;width:16px;height:16px}
      .lumina .lum-reset-filter{background:white;color:#76543e;border:1px solid #d5bda5;border-radius:9px;padding:10px 16px;cursor:pointer}
      .lumina .lum-reset-filter:hover{background:#35271f;color:white}
      .lumina .lum-filter-result{margin:18px 0 0;padding-top:14px;text-align:right;border-top:1px solid #e9dcd0;color:#76543e;font-size:13px}
      .lumina .lum-related-products{padding-top:0;padding-bottom:65px}
      .lumina .lum-related-products .product-grid{margin-top:22px}
      @media(max-width:950px){.lumina .lum-premium-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.lumina .lum-premium-filter-panel{padding:16px}.lumina .lum-premium-filter-grid{grid-template-columns:1fr}.lumina .lum-reset-filter{width:100%}}
    `}</style>

    {page!=="admin" && <>
      <div className="announcement">✦ LUMINA STORE — PREMIUM FASHION & LIFESTYLE</div>
      <header className="navbar">
        <button className="logo" onClick={()=>go("home")}>LUMINA<span>.</span></button>
        <nav className="nav-menu">
          <button onClick={()=>go("home")}>Home</button>
          <button onClick={()=>choose("All")}>Shop</button>
          <button onClick={()=>choose("Pria")}>Men</button>
          <button onClick={()=>choose("Wanita")}>Women</button>
          <button onClick={()=>choose("Batik Wanita")}>Batik</button>
          <button onClick={()=>choose("Tas Wanita")}>Bags</button>
          <button onClick={()=>go("wishlist")}>♡ Wishlist ({wishlist.length})</button>
          <button onClick={()=>go("admin")}>Admin Demo</button>
          {customer ? <><button onClick={()=>go("account")}>Halo, {customer.name}</button><button onClick={logout}>Logout</button></> :
            <button onClick={()=>auth("home")}>Login / Register</button>}
        </nav>
        <button className="cart-link" onClick={()=>go("cart")}>🛍 Cart ({count})</button>
      </header>
    </>}

    {/* HOME */}
    {page==="home" && <>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">THE NEW LUMINA COLLECTION</p>
          <h1>Elevate Your<br/><em>Everyday Style.</em></h1>
          <p>Temukan fashion pria, wanita, batik, sepatu, tas, dan aksesori pilihan.</p>
          <button className="btn-dark" onClick={()=>choose("All")}>Explore Collection →</button>
          <p className="hero-bottom">MODERN • ELEGANT • TIMELESS</p>
        </div>
        <div className="hero-photo"><Photo src={hero} alt="LUMINA fashion collection"/></div>
      </section>
      <section className="perks">
        <div>✧ <strong>Premium Fashion</strong><span>Modern & Elegant</span></div>
        <div>♡ <strong>{PHOTOS.length} Foto Koleksi</strong><span>Katalog gambar lokal</span></div>
        <div>✦ <strong>Seven Collections</strong><span>Fashion For Everyone</span></div>
      </section>
      <section className="container section">
        <p className="eyebrow center">SHOP BY CATEGORY</p><h2 className="section-title">Explore Our Collections</h2>
        <div className="lum-home-categories">{CATEGORIES.map(c=>{
          const cover=products.find(p=>p.collection===c.name&&p.image);
          return <button key={c.name} onClick={()=>choose(c.name)}><Photo src={cover?.image} alt={c.label}/><span>{c.label}</span></button>;
        })}</div>
      </section>
      <section className="container section">
        <p className="eyebrow center">CURATED FOR YOU</p><h2 className="section-title">Featured Collection</h2>
        <p className="section-description">Fashion pilihan untuk gaya sehari-hari.</p>
        <ProductGrid products={products.filter(p=>p.image).slice(0,8)} favorites={wishlist} reviews={reviews}
          onDetail={openProduct} onFavorite={toggleFavorite} onCart={addToCart}/>
        <div className="center action-space"><button className="btn-dark" onClick={()=>choose("All")}>Lihat Semua Produk →</button></div>
      </section>
    </>}

    {/* SHOP DAN FILTER PREMIUM */}
    {page==="shop" && <main className="lum-new-shop">
      <div className="lum-shop-heading"><p className="eyebrow">DISCOVER YOUR STYLE</p>
        <h1>Shop Our Collection</h1><p>Temukan produk terbaik dari LUMINA STORE.</p>
      </div>
      <div className="lum-shop-categories">{[
        {name:"All",label:"Semua"},...CATEGORIES.map(c=>({name:c.name,label:c.label})),
      ].map(c=><button key={c.name} className={`lum-shop-pill ${category===c.name?"active":""}`}
        onClick={()=>{setCategory(c.name);setSearch("");setFilterSize("all");setFilterColor("all");}}>{c.label}</button>)}</div>
      <div className="lum-shop-toolbar">
        <div className="lum-shop-search"><span>⌕</span><input type="search" value={search} placeholder="Cari produk..." onChange={e=>setSearch(e.target.value)}/>
          {search && <button type="button" onClick={()=>setSearch("")}>×</button>}
        </div>
        <select className="lum-shop-sort" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="default">Urutan Default</option><option value="low">Harga Termurah</option>
          <option value="high">Harga Termahal</option><option value="name">Nama A–Z</option>
        </select>
      </div>
      <section className="lum-premium-filter-panel" aria-label="Filter Produk Premium">
        <div className="lum-premium-filter-header"><div>
          <span className="lum-filter-eyebrow">LUMINA SMART FILTER</span>
          <h3>Filter Produk Premium</h3><p>Temukan produk berdasarkan harga, ukuran, warna, dan stok.</p>
        </div><button type="button" className="lum-reset-filter" onClick={resetShopFilters}>↻ Reset Filter</button></div>
        <div className="lum-premium-filter-grid">
          <label>Rentang Harga<select value={filterPrice} onChange={e=>setFilterPrice(e.target.value)}>
            <option value="all">Semua Harga</option><option value="low">Di bawah Rp200.000</option>
            <option value="mid">Rp200.000–Rp300.000</option><option value="high">Di atas Rp300.000</option>
          </select></label>
          <label>Ukuran<select value={filterSize} onChange={e=>setFilterSize(e.target.value)}>
            <option value="all">Semua Ukuran</option>{availableSizes.map(v=><option key={v} value={v}>{v}</option>)}
          </select></label>
          <label>Warna<select value={filterColor} onChange={e=>setFilterColor(e.target.value)}>
            <option value="all">Semua Warna</option>{availableColors.map(v=><option key={v} value={v}>{v}</option>)}
          </select></label>
          <label className="lum-filter-stock"><input type="checkbox" checked={onlyReady} onChange={e=>setOnlyReady(e.target.checked)}/>
            Hanya stok tersedia
          </label>
        </div>
        <p className="lum-filter-result" role="status">✓ {visible.length} produk sesuai filter</p>
      </section>
      <div className="lum-shop-count"><span>{visible.length} produk ditemukan</span>
        <span>Menampilkan {Math.min(shownCount,visible.length)}</span></div>
      <ProductGrid products={visible.slice(0,shownCount)} favorites={wishlist} reviews={reviews}
        onDetail={openProduct} onFavorite={toggleFavorite} onCart={addToCart}/>
      {shownCount<visible.length && <div className="center action-space"><button className="btn-light"
        onClick={()=>setShownCount(n=>n+12)}>Tampilkan Lebih Banyak ({visible.length-shownCount} tersisa) ↓</button></div>}
    </main>}

    {/* DETAIL PREMIUM + YOU MAY ALSO LIKE */}
    {page==="detail" && selected && <>
      <ProductDetail key={selected.id} product={selected} customer={customer} size={size} color={color}
        onSize={setSize} onColor={setColor} onCart={addToCart} onFavorite={toggleFavorite}
        favorite={wishlist.includes(selected.id)} reviews={reviews} onReview={reviewProduct} onBack={()=>go("shop")}/>
      <RelatedProducts product={selected} products={products} favorites={wishlist} reviews={reviews}
        onDetail={openProduct} onFavorite={toggleFavorite} onCart={addToCart}/>
    </>}

    {/* WISHLIST */}
    {page==="wishlist" && <main className="container section">
      <h1 className="section-title">My Wishlist ♡</h1>
      <ProductGrid products={products.filter(p=>wishlist.includes(p.id))} favorites={wishlist} reviews={reviews}
        onDetail={openProduct} onFavorite={toggleFavorite} onCart={addToCart}/>
    </main>}

    {/* KERANJANG */}
    {page==="cart" && <main className="container section">
      <h1 className="section-title">Shopping Cart</h1><div className="two-column">
        <div className="panel">
          {!validCart.length && <p>Keranjang masih kosong.</p>}
          {validCart.map(i=><div className="cart-row" key={i.key}>
            <div className="lum-cart-photo"><Photo src={i.image} alt={i.name}/></div>
            <div className="grow"><h3>{prettyName(i.name)}</h3><p>{i.size} / {i.color}</p><strong>{rp(i.price)}</strong>
              <div className="quantity">
                <button onClick={()=>changeQty(i.key,-1)}>−</button><span>{i.quantity}</span>
                <button onClick={()=>changeQty(i.key,1)}>+</button>
                <button onClick={()=>setCart(prev=>prev.filter(v=>(v.key||JSON.stringify([v.id,v.size,v.color]))!==i.key))}>Hapus</button>
              </div>
            </div>
          </div>)}
        </div>
        <div className="panel summary"><h2>Ringkasan Belanja</h2>
          <div className="lum-between"><span>Jumlah Produk</span><b>{count}</b></div>
          <div className="lum-between"><span>Subtotal</span><b>{rp(subtotal)}</b></div>
          <button className="btn-dark wide" disabled={!validCart.length}
            onClick={()=>customer?go("checkout"):auth("checkout")}>Checkout →</button>
        </div>
      </div>
    </main>}

    {/* LOGIN DAN CHECKOUT */}
    {page==="auth" && <AuthPage onSuccess={login} onBack={()=>go("home")}/>}
    {page==="checkout" && !customer && <main className="container section center">
      <h2>Login untuk Checkout</h2><button className="btn-dark" onClick={()=>auth("checkout")}>Login</button>
    </main>}
    {page==="checkout" && customer && <main className="container section">
      <h1 className="section-title">Checkout</h1><div className="two-column">
        <form className="panel form-stack" onSubmit={placeOrder}>
          <h2>Informasi Pembeli</h2>
          <label>Nama Lengkap<input required value={checkout.name} onChange={e=>setCheckout(p=>({...p,name:e.target.value}))}/></label>
          <label>Nomor Telepon<input required value={checkout.phone} onChange={e=>setCheckout(p=>({...p,phone:e.target.value}))}/></label>
          <label>Alamat Pengiriman<textarea rows={4} required value={checkout.address} onChange={e=>setCheckout(p=>({...p,address:e.target.value}))}/></label>
          <label>Pengiriman<select value={checkout.shipping} onChange={e=>setCheckout(p=>({...p,shipping:e.target.value}))}>
            <option value="regular">Regular Rp12.000</option><option value="express">Express Rp25.000</option>
          </select></label>
          <div className="lum-payment-box"><h3>Voucher & Diskon</h3>
            <p className="muted">LUMINA10: 10% min. Rp100.000 · FASHION20: 20% min. Rp300.000 · WELCOME15: Rp15.000 min. Rp150.000.</p>
            <div className="lum-voucher-controls"><input value={voucherInput} maxLength={24} placeholder="Kode voucher"
              onChange={e=>{setVoucherInput(e.target.value.toUpperCase());setAppliedVoucher("");setVoucherMessage("");}}/>
              <button type="button" className="btn-dark" disabled={!voucherInput.trim()} onClick={applyVoucher}>Gunakan</button>
            </div>
            {applied?.ok && <button type="button" className="btn-light" onClick={clearVoucher}>Hapus Voucher</button>}
            {(voucherMessage||(applied&&!applied.ok)) && <p className={applied?.ok?"lum-voucher-success":"lum-voucher-error"} role="status">
              {applied&&!applied.ok?applied.message:voucherMessage}</p>}
          </div>
          <div className="lum-payment-box"><h3>Metode Pembayaran (Simulasi)</h3>
            <select value={checkout.payment} onChange={e=>setCheckout(p=>({...p,payment:e.target.value}))}>
              {METHODS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <p className="muted">Tidak ada perpindahan uang sungguhan. Konfirmasi dilakukan di Admin Demo.</p>
          </div>
          <button className="btn-dark wide" type="submit" disabled={!validCart.length}>Konfirmasi Pesanan</button>
        </form>
        <aside className="panel summary"><h2>Ringkasan Pesanan</h2>
          <div className="lum-between"><span>Subtotal</span><b>{rp(subtotal)}</b></div>
          <div className="lum-between"><span>Voucher</span><b>{applied?.ok?applied.code:"Tidak digunakan"}</b></div>
          <div className="lum-between"><span>Diskon</span><b className="lum-voucher-success">−{rp(discount)}</b></div>
          <div className="lum-between"><span>Ongkir</span><b>{rp(shipping)}</b></div>
          <div className="lum-between"><span>Pembayaran</span><b>{paymentLabel(checkout.payment)}</b></div><hr/>
          <div className="lum-between lum-grand-total"><b>Total Pembayaran</b><strong>{rp(total)}</strong></div>
        </aside>
      </div>
    </main>}

    {/* DASHBOARD PELANGGAN */}
    {page==="account" && customer && <>
      <CustomerTracking orders={mine}/>
      <CustomerDashboard customer={customer} orders={mine} onBack={()=>choose("All")} onLogout={logout}/>
    </>}

    {/* SUKSES */}
    {page==="success" && <main className="container section center"><div className="panel success-panel">
      <h1>✓ Pesanan Berhasil!</h1>
      {currentOrder && <>
        <p>Nomor Pesanan: <b>{currentOrder.id}</b></p>
        <p>Metode: {paymentLabel(currentOrder.paymentMethod)}</p>
        <p>Status Bayar: {payStatus(currentOrder)}</p>
        <p>Voucher: {currentOrder.voucherCode||"Tidak digunakan"}</p>
        <p>Diskon: −{rp(currentOrder.discount||0)}</p>
        <h2>Total: {rp(currentOrder.total)}</h2>
      </>}
      <p>Pesanan simulasi dapat dilihat pada Dashboard Pelanggan.</p>
      <button className="btn-dark" onClick={()=>go("account")}>Lihat Pesanan Saya →</button>
      <button className="btn-light" onClick={()=>choose("All")}>Lanjut Belanja</button>
    </div></main>}

    {/* ADMIN */}
    {page==="admin" && <AdminDashboard products={products} orders={orders} form={form} setForm={setForm}
      onSave={saveProduct} onEdit={editProduct} onDelete={deleteProduct}
      onStatus={changeStatus} onPay={confirmPayment} onBack={()=>go("home")}/>}

    {/* FOOTER DAN TOAST */}
    {page!=="admin" && <footer className="footer">
      <div><h2>LUMINA.</h2><p>Premium Fashion & Lifestyle</p></div>
      <p>Men • Women • Batik • Shoes • Bags</p>
      <p>© {new Date().getFullYear()} LUMINA STORE</p>
    </footer>
    {message && <div className="toast" role="status"><span>{message}</span>
      <button type="button" onClick={()=>setMessage("")}>×</button></div>}
  </div>;
}
