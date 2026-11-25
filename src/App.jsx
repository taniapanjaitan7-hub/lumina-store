
import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

// LUMINA STORE — Product Card Premium
// Data localStorage dan fitur transaksi lama dipertahankan.

const CATEGORIES = [
  { folder: "baju pria", name: "Pria", label: "Baju Pria", price: 179000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "baju wanita", name: "Wanita", label: "Baju Wanita", price: 199000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "batik wanita", name: "Batik Wanita", label: "Batik", price: 235000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "sepatu pria", name: "Sepatu Pria", label: "Sepatu Pria", price: 295000, sizes: ["39", "40", "41", "42", "43", "44"] },
  { folder: "sepatu wanita", name: "Sepatu Wanita", label: "Sepatu Wanita", price: 245000, sizes: ["35", "36", "37", "38", "39", "40"] },
  { folder: "tas wanita", name: "Tas Wanita", label: "Tas", price: 249000, sizes: ["All Size"] },
  { folder: "aksesoris wanita", name: "Accessories", label: "Aksesori", price: 129000, sizes: ["All Size"] },
];

const STATUSES = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

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
  products: "lumina_products_v2",
  oldProducts: "lumina_products_v1",
  orders: "lumina_orders_v1",
  session: "lumina_session_v1",
  cart: "lumina_cart_v1",
  wishlist: "lumina_wishlist_v1",
  deleted: "lumina_deleted_local_v2",
  reviews: "lumina_product_reviews_v1",
};

const EMPTY_PRODUCT = {
  id: null,
  name: "",
  collection: "Pria",
  image: "",
  gallery: "",
  price: "",
  stock: "20",
  description: "",
  sizes: "S,M,L,XL,XXL",
  colors: "Sesuai foto",
};

const EMPTY_CHECKOUT = {
  name: "",
  phone: "",
  address: "",
  shipping: "regular",
  payment: "cod",
};

/* =====================================
   HELPER
===================================== */

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function arr(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Penyimpanan gagal", error);
    return false;
  }
}

function text(value) {
  return String(value ?? "").trim().toLowerCase();
}

function values(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function rp(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function date(value) {
  const d = new Date(value || "");
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function prettyName(value) {
  return String(value || "").replace(
    /\bgambar\s*(\d+)\b/gi,
    "Koleksi $1"
  );
}

function status(value) {
  return STATUSES.includes(value) ? value : "Pesanan Baru";
}

function paymentLabel(value) {
  return (
    METHODS.find((m) => m.value === value)?.label ||
    "Belum tercatat"
  );
}

function payStatus(order) {
  return (
    order.paymentStatus ||
    (order.paymentMethod === "cod"
      ? "Bayar di Tempat"
      : ["transfer", "qris"].includes(order.paymentMethod)
        ? "Menunggu Pembayaran"
        : "Belum tercatat")
  );
}

function canPay(order) {
  return (
    order &&
    ["cod", "transfer", "qris"].includes(
      order.paymentMethod
    ) &&
    status(order.status) !== "Dibatalkan" &&
    payStatus(order) !== "Lunas" &&
    (order.paymentMethod !== "cod" ||
      status(order.status) === "Selesai")
  );
}

function canMove(from, to) {
  return (
    STATUSES.includes(to) &&
    !["Selesai", "Dibatalkan"].includes(from) &&
    (to === "Dibatalkan" ||
      STATUSES.indexOf(to) === STATUSES.indexOf(from) + 1)
  );
}

function voucherValue(code, subtotal) {
  const item = VOUCHERS.find(
    (v) =>
      v.code === String(code || "").trim().toUpperCase()
  );

  if (!item) {
    return {
      ok: false,
      amount: 0,
      message: "Kode voucher tidak ditemukan.",
    };
  }

  if (subtotal < item.min) {
    return {
      ok: false,
      amount: 0,
      message:
        `Minimal belanja ${rp(item.min)} ` +
        `untuk voucher ${item.code}.`,
    };
  }

  return {
    ok: true,
    code: item.code,
    amount: Math.min(
      subtotal,
      item.percent
        ? Math.round((subtotal * item.percent) / 100)
        : item.amount
    ),
    message: `Voucher ${item.code} berhasil dipakai.`,
  };
}

/* =====================================
   GAMBAR PRODUK
===================================== */

function folder(value) {
  const f = text(value);

  return (
    {
      pria: "baju pria",
      wanita: "baju wanita",
      aksesoris: "aksesoris wanita",
    }[f] || f
  );
}

function imagePath(value) {
  if (!value) return "";

  const raw = String(value)
    .trim()
    .replace(/\\/g, "/");

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const parts = raw
    .replace(/^(\.\/)?public\//i, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);

  if (text(parts[0]) === "images" && parts[1]) {
    try {
      parts[1] = folder(decodeURIComponent(parts[1]));
    } catch {
      parts[1] = folder(parts[1]);
    }
  } else if (
    CATEGORIES.some(
      (c) => c.folder === folder(parts[0])
    )
  ) {
    parts[0] = folder(parts[0]);
    parts.unshift("images");
  }

  return "/" + parts.join("/");
}

function imageUrl(value) {
  const path = imagePath(value);

  if (!path || /^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const encoded = path
    .replace(/^\/+/, "")
    .split("/")
    .map((s) => {
      try {
        return encodeURIComponent(decodeURIComponent(s));
      } catch {
        return encodeURIComponent(s);
      }
    })
    .join("/");

  return base + "/" + encoded;
}

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages) ? productImages : [])
      .filter((p) => p?.url)
      .map((p) => {
        const url = imagePath(p.url);
        const parts = url.replace(/^\/+/, "").split("/");
        const pos = parts.indexOf("images");

        let dirname = pos >= 0 ? parts[pos + 1] : "";

        try {
          dirname = decodeURIComponent(dirname);
        } catch {
          // Nama folder tetap digunakan.
        }

        return {
          ...p,
          url,
          folder: folder(p.folder || dirname),
          name: p.name || parts.at(-1),
        };
      })
      .filter((p) =>
        CATEGORIES.some((c) => c.folder === p.folder)
      )
      .map((p) => [p.url, p])
  ).values(),
];

const DEFAULT_PRODUCTS = PHOTOS.map((p) => {
  const c = CATEGORIES.find(
    (v) => v.folder === p.folder
  );

  return {
    id: `local:${p.url}`,
    name: `${c.label} — ${p.name}`,
    collection: c.name,
    image: p.url,
    gallery: [],
    price: c.price,
    stock: 20,
    sizes: c.sizes,
    colors: ["Sesuai foto"],
    description: `Koleksi ${c.label} dari LUMINA STORE.`,
  };
});

function loadProducts() {
  const old =
    localStorage.getItem(KEY.products) !== null
      ? arr(KEY.products)
      : arr(KEY.oldProducts);

  const deleted = new Set(
    arr(KEY.deleted).map(String)
  );

  const saved = old
    .filter(
      (p) =>
        p &&
        p.id != null &&
        p.name &&
        !deleted.has(String(p.id))
    )
    .map((p) => {
      const photo = imagePath(p.image);

      const c =
        CATEGORIES.find(
          (x) => x.name === p.collection
        ) ||
        CATEGORIES.find((x) =>
          PHOTOS.some(
            (a) =>
              a.url === photo &&
              a.folder === x.folder
          )
        ) ||
        CATEGORIES[0];

      return {
        ...p,
        image: photo,
        collection: c.name,
        price: Number(p.price) || 0,
        stock: Math.max(0, Number(p.stock) || 0),
        sizes: Array.isArray(p.sizes) ? p.sizes : c.sizes,
        colors: Array.isArray(p.colors)
          ? p.colors
          : ["Sesuai foto"],
        gallery: Array.isArray(p.gallery)
          ? p.gallery.map(imagePath)
          : [],
      };
    });

  const seen = new Set(saved.map((p) => p.image));

  const fresh = DEFAULT_PRODUCTS.filter(
    (p) =>
      !seen.has(p.image) &&
      !deleted.has(String(p.id))
  );

  return [...saved, ...fresh];
}

function Photo({ src, alt, className = "", style }) {
  const [bad, setBad] = useState("");
  const url = imageUrl(src);

  if (!url || bad === url) {
    return (
      <div
        className={`lum-photo-placeholder ${className}`}
        style={style}
      >
        Foto belum tersedia
      </div>
    );
  }

  return (
    <img
      className={className}
      src={url}
      alt={alt || "Produk LUMINA"}
      style={style}
      loading="lazy"
      onError={() => setBad(url)}
    />
  );
}

/* =====================================
   PRODUCT CARD PREMIUM
===================================== */

function ProductCard({
  product,
  favorite,
  reviewList = [],
  onDetail,
  onFavorite,
  onCart,
}) {
  const stock = Math.max(
    0,
    Number(product.stock) || 0
  );

  const ratings = reviewList
    .map((v) => Number(v.rating))
    .filter((v) => v >= 1 && v <= 5);

  const avg = ratings.length
    ? (
        ratings.reduce((a, b) => a + b, 0) /
        ratings.length
      ).toFixed(1)
    : null;

  return (
    <article className="product-card lum-premium-card">
      <div className="product-picture">
        <button
          type="button"
          className="image-button"
          onClick={() => onDetail(product)}
          aria-label={`Lihat detail ${prettyName(product.name)}`}
        >
          <Photo
            src={product.image}
            alt={prettyName(product.name)}
          />
        </button>

        <span
          className={`stock-label ${
            stock === 0
              ? "is-empty"
              : stock <= 5
                ? "is-low"
                : ""
          }`}
        >
          {stock === 0
            ? "STOK HABIS"
            : stock <= 5
              ? `TERSISA ${stock}`
              : "LUMINA EDITION"}
        </span>

        <button
          type="button"
          className={`heart ${
            favorite ? "is-saved" : ""
          }`}
          aria-label={
            favorite
              ? "Hapus dari wishlist"
              : "Tambahkan ke wishlist"
          }
          aria-pressed={favorite}
          title={
            favorite
              ? "Hapus wishlist"
              : "Simpan wishlist"
          }
          onClick={() => onFavorite(product.id)}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <button
          type="button"
          className="lum-image-quickview"
          onClick={() => onDetail(product)}
        >
          Lihat Detail
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="product-body">
        <div className="lum-product-topline">
          <small>{product.collection}</small>

          <span>
            {avg
              ? `★ ${avg} (${ratings.length})`
              : "New arrival"}
          </span>
        </div>

        <h3 title={product.name}>
          {prettyName(product.name)}
        </h3>

        <p className="price">
          {rp(product.price)}
        </p>

        <p className="muted lum-availability">
          {stock > 5
            ? `✓ Ready stock · ${stock} tersedia`
            : stock > 0
              ? `Stok terbatas: ${stock}`
              : "Sedang tidak tersedia"}
        </p>

        <div className="product-actions">
          <button
            type="button"
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Detail
          </button>

          <button
            type="button"
            className="btn-dark"
            disabled={!stock}
            onClick={() => onCart(product)}
          >
            {stock ? "+ Keranjang" : "Habis"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  products,
  favorites,
  reviews,
  onDetail,
  onFavorite,
  onCart,
}) {
  if (!products.length) {
    return (
      <div className="panel lum-empty">
        <h3>Produk tidak ditemukan</h3>
        <p>Coba kategori atau kata kunci lainnya.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          favorite={favorites.includes(p.id)}
          reviewList={
            Array.isArray(reviews[String(p.id)])
              ? reviews[String(p.id)]
              : []
          }
          onDetail={onDetail}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

/* =====================================
   DETAIL PRODUK
===================================== */

function ProductDetail({
  product,
  customer,
  size,
  color,
  onSize,
  onColor,
  onCart,
  onFavorite,
  favorite,
  reviews,
  onReview,
  onBack,
}) {
  const images = [
    ...new Set(
      [
        product.image,
        ...(Array.isArray(product.gallery)
          ? product.gallery
          : []),
      ].filter(Boolean)
    ),
  ];

  const [active, setActive] = useState(product.image);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  const list = Array.isArray(reviews[String(product.id)])
    ? reviews[String(product.id)]
    : [];

  const userId = customer
    ? String(
        customer.id ??
        customer.email ??
        ""
      )
    : "";

  const mine = list.find(
    (r) => String(r.userId) === userId
  );

  useEffect(() => {
    setActive(product.image);
  }, [product.id, product.image]);

  useEffect(() => {
    setRating(mine?.rating || 5);
    setComment(mine?.comment || "");
  }, [product.id, userId]);

  const average = list.length
    ? (
        list.reduce(
          (s, r) =>
            s + Number(r.rating || 0),
          0
        ) / list.length
      ).toFixed(1)
    : null;

  function submit(e) {
    e.preventDefault();

    if (!userId) {
      setNotice("Login untuk memberikan ulasan.");
      return;
    }

    if (comment.trim().length < 5) {
      setNotice("Ulasan minimal 5 karakter.");
      return;
    }

    const record = {
      id: mine?.id || `review-${Date.now()}`,
      userId,
      name: customer.name || "Pelanggan",
      rating,
      comment: comment.trim().slice(0, 500),
      at: new Date().toISOString(),
    };

    const updated = mine
      ? list.map((v) =>
          v.id === mine.id ? record : v
        )
      : [record, ...list];

    onReview(product.id, updated);

    setNotice(
      "Ulasan tersimpan di browser ini."
    );
  }

  return (
    <main className="container section lum-new-detail">
      <button
        type="button"
        className="back"
        onClick={onBack}
      >
        ← Kembali ke Shop
      </button>

      <div className="lum-detail-grid">
        <div>
          <div className="lum-detail-main">
            <Photo
              src={active}
              alt={prettyName(product.name)}
            />
          </div>

          <div className="lum-detail-thumbs">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                className={
                  active === url ? "active" : ""
                }
                onClick={() => setActive(url)}
              >
                <Photo
                  src={url}
                  alt={`Foto ${i + 1}`}
                />
              </button>
            ))}
          </div>

          <p className="muted">
            {images.length} foto produk
          </p>
        </div>

        <div className="lum-detail-data">
          <p className="eyebrow">
            {product.collection}
          </p>

          <h1>
            {prettyName(product.name)}
          </h1>

          <p className="lum-stars">
            {average
              ? `★ ${average} / 5 · ${list.length} ulasan`
              : "☆ Belum ada ulasan"}
          </p>

          <h2 className="price">
            {rp(product.price)}
          </h2>

          <p>
            {product.description ||
              "Fashion pilihan LUMINA STORE."}
          </p>

          <p>
            Stok: <strong>{product.stock}</strong>
          </p>

          <label>Ukuran</label>

          <div className="option-row">
            {(product.sizes || ["All Size"]).map(
              (v) => (
                <button
                  type="button"
                  key={v}
                  className={
                    size === v ? "chosen" : ""
                  }
                  onClick={() => onSize(v)}
                >
                  {v}
                </button>
              )
            )}
          </div>

          <label>Warna</label>

          <div className="option-row">
            {(product.colors || [
              "Sesuai foto",
            ]).map((v) => (
              <button
                type="button"
                key={v}
                className={
                  color === v ? "chosen" : ""
                }
                onClick={() => onColor(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            className="btn-dark wide"
            type="button"
            disabled={Number(product.stock) <= 0}
            onClick={() =>
              onCart(product, size, color)
            }
          >
            + Tambahkan ke Keranjang
          </button>

          <button
            className="btn-light wide"
            type="button"
            onClick={() => onFavorite(product.id)}
          >
            {favorite
              ? "♥ Hapus dari Wishlist"
              : "♡ Tambahkan ke Wishlist"}
          </button>
        </div>
      </div>

      <section className="lum-review-box">
        <h2>Ulasan Pelanggan</h2>

        <div className="lum-review-grid">
          <div>
            {list.length ? (
              list.map((r) => (
                <article
                  key={r.id}
                  className="panel"
                >
                  <strong>{r.name}</strong>

                  <p className="lum-stars">
                    {"★".repeat(
                      Math.min(
                        5,
                        Math.max(
                          0,
                          Number(r.rating) || 0
                        )
                      )
                    )}
                  </p>

                  <p>{r.comment}</p>
                  <small>{date(r.at)}</small>
                </article>
              ))
            ) : (
              <p className="muted">
                Belum ada ulasan.
              </p>
            )}
          </div>

          <form
            className="panel form-stack"
            onSubmit={submit}
          >
            <h3>
              {mine
                ? "Edit Ulasan"
                : "Tulis Ulasan"}
            </h3>

            <div className="lum-rating-buttons">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={
                    n <= rating ? "active" : ""
                  }
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              placeholder="Bagikan pengalamanmu..."
            />

            <button className="btn-dark">
              Simpan Ulasan
            </button>

            {notice && (
              <p role="status">{notice}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

/* =====================================
   CUSTOMER TRACKING
===================================== */

function CustomerTracking({ orders }) {
  const stages = STATUSES.slice(0, 4);

  return (
    <section className="container section lum-customer-track">
      <h2 className="section-title">
        Tracking & Pembayaran Saya
      </h2>

      {!orders.length && (
        <p className="panel">
          Belum ada pesanan.
        </p>
      )}

      {orders.map((o) => {
        const current = status(o.status);
        const index = stages.indexOf(current);
        const paid = payStatus(o) === "Lunas";

        return (
          <article
            className="panel lum-track-card"
            key={o.id}
          >
            <div className="lum-between">
              <div>
                <strong>{o.id}</strong>

                <p className="muted">
                  {date(o.date)} · {rp(o.total)}
                </p>
              </div>

              <span className="lum-status-badge">
                {current}
              </span>
            </div>

            <p>
              Metode:{" "}
              <b>{paymentLabel(o.paymentMethod)}</b>
            </p>

            <p>
              Status bayar:{" "}
              <b>{payStatus(o)}</b>
            </p>

            {o.voucherCode && (
              <p className="muted">
                Voucher {o.voucherCode} · Hemat{" "}
                {rp(o.discount)}
              </p>
            )}

            {current === "Dibatalkan" ? (
              <p className="lum-cancel-note">
                Pesanan ini dibatalkan.
              </p>
            ) : (
              <div className="lum-track-steps">
                {stages.map((s, i) => (
                  <div
                    key={s}
                    className={
                      i <= index ? "complete" : ""
                    }
                  >
                    <span>
                      {i < index ? "✓" : i + 1}
                    </span>

                    <small>{s}</small>
                  </div>
                ))}
              </div>
            )}

            {paid ? (
              <p className="lum-paid-note">
                ✓ Pembayaran dikonfirmasi Admin{" "}
                {o.paidAt &&
                  `pada ${date(o.paidAt)}`}
              </p>
            ) : (
              current !== "Dibatalkan" && (
                <p className="muted">
                  {o.paymentMethod === "cod"
                    ? "COD dibayar saat paket diterima."
                    : "Menunggu konfirmasi pembayaran simulasi Admin."}
                </p>
              )
            )}
          </article>
        );
      })}
    </section>
  );
}

/* =====================================
   ADMIN ANALYTICS
===================================== */

function AdminAnalytics({ orders, products }) {
  const done = orders.filter(
    (o) => status(o.status) === "Selesai"
  );

  const revenue = done.reduce(
    (n, o) => n + Number(o.total || 0),
    0
  );

  const qty = done
    .flatMap((o) => o.items || [])
    .reduce(
      (n, i) => n + Number(i.quantity || 0),
      0
    );

  const now = new Date();

  const months = Array.from(
    { length: 6 },
    (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + i,
        1
      );

      return {
        key:
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`,
        label: d.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        }),
        total: 0,
      };
    }
  );

  const sold = new Map();

  done.forEach((o) => {
    const entry = [...(o.history || [])]
      .reverse()
      .find((h) => h.status === "Selesai");

    const d = new Date(
      entry?.at ||
      o.updatedAt ||
      o.date ||
      ""
    );

    const key =
      `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

    const month = months.find(
      (m) => m.key === key
    );

    if (month) {
      month.total += Number(o.total || 0);
    }

    (o.items || []).forEach((i) => {
      const k = String(i.id ?? i.name);
      const current = sold.get(k) || {
        name: i.name,
        qty: 0,
      };

      current.qty += Number(i.quantity || 0);
      sold.set(k, current);
    });
  });

  const max = Math.max(
    1,
    ...months.map((m) => m.total)
  );

  const best = [...sold.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <section className="lum-analytics">
      <h2>Advanced Sales Analytics</h2>

      <p className="muted">
        Berdasarkan transaksi simulasi di browser.
      </p>

      <div className="lum-analytics-cards">
        {[
          ["Pendapatan Selesai", rp(revenue)],
          ["Pesanan Selesai", done.length],
          ["Unit Terjual", qty],
          [
            "Stok ≤ 5",
            products.filter(
              (p) => Number(p.stock) <= 5
            ).length,
          ],
        ].map(([label, value]) => (
          <article
            className="lum-dash-card"
            key={label}
          >
            <small>{label}</small>
            <h2>{value}</h2>
          </article>
        ))}
      </div>

      <div className="lum-analytics-panels">
        <article className="lum-dash-card">
          <h3>Pendapatan 6 Bulan</h3>

          <div className="lum-mini-chart">
            {months.map((m) => (
              <div
                key={m.key}
                title={`${m.label}: ${rp(m.total)}`}
              >
                <div className="lum-chart-track">
                  <div
                    style={{
                      height: `${
                        m.total
                          ? Math.max(
                              3,
                              (m.total / max) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <small>{m.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="lum-dash-card">
          <h3>Status Pesanan</h3>

          {STATUSES.map((s) => (
            <p
              className="lum-between"
              key={s}
            >
              <span>{s}</span>
              <b>
                {
                  orders.filter(
                    (o) => status(o.status) === s
                  ).length
                }
              </b>
            </p>
          ))}
        </article>
      </div>

      <article className="lum-dash-card">
        <h3>5 Produk Terlaris</h3>

        {best.length ? (
          best.map((p, i) => (
            <p
              className="lum-between"
              key={i}
            >
              <span>
                {i + 1}. {prettyName(p.name)}
              </span>
              <b>{p.qty} unit</b>
            </p>
          ))
        ) : (
          <p>Belum ada transaksi selesai.</p>
        )}
      </article>
    </section>
  );
}

/* =====================================
   ORDER TABLE
===================================== */

function OrderTable({
  orders,
  edit = false,
  onStatus,
  onPay,
}) {
  return (
    <div className="lum-dash-table-wrap">
      <table className="lum-dash-table">
        <thead>
          <tr>
            <th>ID Pesanan</th>
            <th>Tanggal</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Subtotal</th>
            <th>Voucher</th>
            <th>Diskon</th>
            <th>Total</th>
            <th>Metode Bayar</th>
            <th>Status Bayar</th>
            <th>Status Pesanan</th>
            {edit && <th>Aksi</th>}
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => {
            const s = status(o.status);
            const paid =
              payStatus(o) === "Lunas";

            return (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{date(o.date)}</td>
                <td>{o.customer}</td>

                <td>
                  {(o.items || [])
                    .map(
                      (i) =>
                        `${prettyName(i.name)} (${i.quantity})`
                    )
                    .join(", ")}
                </td>

                <td>
                  {o.subtotal != null
                    ? rp(o.subtotal)
                    : "-"}
                </td>

                <td>
                  {o.voucherCode || "-"}
                </td>

                <td>
                  {o.discount
                    ? `−${rp(o.discount)}`
                    : "-"}
                </td>

                <td>
                  <b>{rp(o.total)}</b>
                </td>

                <td>
                  {paymentLabel(o.paymentMethod)}
                </td>

                <td>{payStatus(o)}</td>

                <td>
                  {edit ? (
                    <select
                      value={s}
                      disabled={[
                        "Selesai",
                        "Dibatalkan",
                      ].includes(s)}
                      onChange={(e) =>
                        onStatus(
                          o.id,
                          e.target.value
                        )
                      }
                    >
                      {STATUSES.map((next) => (
                        <option
                          key={next}
                          value={next}
                          disabled={
                            next !== s &&
                            (!canMove(s, next) ||
                              (next !== "Dibatalkan" &&
                                ["transfer", "qris"].includes(
                                  o.paymentMethod
                                ) &&
                                !paid))
                          }
                        >
                          {next}
                        </option>
                      ))}
                    </select>
                  ) : (
                    s
                  )}
                </td>

                {edit && (
                  <td>
                    <button
                      type="button"
                      className="btn-dark"
                      disabled={!canPay(o)}
                      onClick={() => onPay(o.id)}
                    >
                      {paid
                        ? "✓ Lunas"
                        : o.paymentMethod === "cod"
                          ? "Konfirmasi COD"
                          : "Tandai Lunas"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}

          {!orders.length && (
            <tr>
              <td colSpan={edit ? 12 : 11}>
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================
   DASHBOARD ADMIN
===================================== */

function AdminDashboard({
  products,
  orders,
  form,
  setForm,
  onSave,
  onEdit,
  onDelete,
  onStatus,
  onPay,
  onBack,
}) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] =
    useState("Semua");
  const [chosenId, setChosenId] = useState("");

  const filteredProducts = products.filter((p) =>
    text(`${p.name} ${p.collection}`).includes(
      text(search)
    )
  );

  const filteredOrders = orders.filter((o) =>
    text(
      `${o.id} ${o.customer} ${o.status} ${o.voucherCode || ""}`
    ).includes(text(search))
  );

  const filteredPhotos = PHOTOS.filter(
    (p) =>
      (folderFilter === "Semua" ||
        p.folder === folderFilter) &&
      text(`${p.name} ${p.folder}`).includes(
        text(search)
      )
  );

  const chosen =
    filteredOrders.find(
      (o) => String(o.id) === chosenId
    ) || filteredOrders[0];

  const done = orders.filter(
    (o) => status(o.status) === "Selesai"
  );

  const revenue = done.reduce(
    (n, o) => n + Number(o.total || 0),
    0
  );

  const currentCat = CATEGORIES.find(
    (c) => c.name === form.collection
  );

  const field = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  function exportCSV() {
    const rows = [
      [
        "ID",
        "Tanggal",
        "Pelanggan",
        "Subtotal",
        "Ongkir",
        "Voucher",
        "Diskon",
        "Total",
        "Metode",
        "Status Bayar",
        "Status Pesanan",
      ],
      ...filteredOrders.map((o) => [
        o.id,
        o.date,
        o.customer,
        o.subtotal ?? "",
        o.shippingFee ?? "",
        o.voucherCode || "",
        o.discount || 0,
        o.total,
        paymentLabel(o.paymentMethod),
        payStatus(o),
        status(o.status),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let s = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(s)) {
              s = "'" + s;
            }

            return `"${s.replaceAll(
              '"',
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "laporan-lumina.csv";
    link.click();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  }

  return (
    <div className="lum-dash">
      <aside className="lum-dash-sidebar">
        <div className="lum-dash-logo">
          LUMINA<span>.</span>
        </div>

        <p>MANAGEMENT SYSTEM</p>

        <nav className="lum-dash-menu">
          {[
            ["overview", "Overview"],
            ["products", "Products"],
            ["orders", "Orders"],
            ["reports", "Sales Report"],
            ["gallery", "Photo Gallery"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={
                tab === v ? "active" : ""
              }
              onClick={() => {
                setTab(v);
                setSearch("");
              }}
            >
              {l}
            </button>
          ))}
        </nav>

        <button
          className="lum-dash-back"
          onClick={onBack}
        >
          ← Kembali ke Toko
        </button>
      </aside>

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <small className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </small>

            <h1>
              {{
                overview: "Dashboard Overview",
                products: "Product Management",
                orders: "Order Management",
                reports: "Sales Report",
                gallery: "Photo Gallery",
              }[tab]}
            </h1>
          </div>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Cari produk atau pesanan..."
          />
        </header>

        {tab === "overview" && (
          <>
            <AdminAnalytics
              orders={orders}
              products={products}
            />

            <section className="lum-dash-card">
              <h2>Inventory Monitoring</h2>

              {products.some(
                (p) => Number(p.stock) <= 5
              ) ? (
                products
                  .filter(
                    (p) => Number(p.stock) <= 5
                  )
                  .map((p) => (
                    <p
                      className="lum-between"
                      key={p.id}
                    >
                      <span>
                        {prettyName(p.name)}
                      </span>
                      <b>Stok {p.stock}</b>
                    </p>
                  ))
              ) : (
                <p>✓ Semua stok aman.</p>
              )}
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>

              <div className="lum-category-stats">
                {CATEGORIES.map((c) => (
                  <button
                    className="btn-light"
                    key={c.name}
                    onClick={() => {
                      setFolderFilter(c.folder);
                      setTab("gallery");
                    }}
                  >
                    {c.label} (
                    {
                      products.filter(
                        (p) =>
                          p.collection === c.name
                      ).length
                    }
                    )
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>

              <OrderTable
                orders={orders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {tab === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-product-form"
              onSubmit={onSave}
            >
              <h2>
                {form.id === null
                  ? "Tambah Produk"
                  : "Edit Produk"}
              </h2>

              <label>
                Nama Produk
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    field("name", e.target.value)
                  }
                />
              </label>

              <label>
                Kategori
                <select
                  value={form.collection}
                  onChange={(e) => {
                    const cat = CATEGORIES.find(
                      (c) =>
                        c.name === e.target.value
                    );

                    if (cat) {
                      setForm((p) => ({
                        ...p,
                        collection: cat.name,
                        image: "",
                        gallery: "",
                        sizes: cat.sizes.join(","),
                      }));
                    }
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option
                      key={c.name}
                      value={c.name}
                    >
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Harga
                <input
                  type="number"
                  min="1"
                  required
                  value={form.price}
                  onChange={(e) =>
                    field("price", e.target.value)
                  }
                />
              </label>

              <label>
                Stok
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.stock}
                  onChange={(e) =>
                    field("stock", e.target.value)
                  }
                />
              </label>

              <label>
                Foto Utama
                <select
                  value={form.image}
                  onChange={(e) =>
                    field("image", e.target.value)
                  }
                >
                  <option value="">
                    Pilih gambar
                  </option>

                  {PHOTOS.filter(
                    (p) =>
                      p.folder ===
                      currentCat?.folder
                  ).map((p) => (
                    <option
                      key={p.url}
                      value={p.url}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lum-admin-preview">
                <Photo
                  src={form.image}
                  alt="Preview"
                />
              </div>

              <label>
                Foto Tambahan
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm((p) => ({
                        ...p,
                        gallery: [
                          ...new Set([
                            ...values(p.gallery),
                            e.target.value,
                          ]),
                        ]
                          .filter(
                            (x) => x !== p.image
                          )
                          .join(","),
                      }));
                    }
                  }}
                >
                  <option value="">
                    + Pilih foto tambahan
                  </option>

                  {PHOTOS.filter(
                    (p) =>
                      p.folder ===
                        currentCat?.folder &&
                      p.url !== form.image &&
                      !values(form.gallery).includes(
                        p.url
                      )
                  ).map((p) => (
                    <option
                      key={p.url}
                      value={p.url}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lum-extra-gallery">
                {values(form.gallery).map(
                  (url) => (
                    <div key={url}>
                      <div className="lum-admin-thumb">
                        <Photo
                          src={url}
                          alt="Foto tambahan"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-light"
                        onClick={() =>
                          field(
                            "gallery",
                            values(form.gallery)
                              .filter(
                                (x) => x !== url
                              )
                              .join(",")
                          )
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  )
                )}
              </div>

              <label>
                Deskripsi
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    field(
                      "description",
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Ukuran (pisahkan dengan koma)
                <input
                  value={form.sizes}
                  onChange={(e) =>
                    field("sizes", e.target.value)
                  }
                />
              </label>

              <label>
                Warna (pisahkan dengan koma)
                <input
                  value={form.colors}
                  onChange={(e) =>
                    field("colors", e.target.value)
                  }
                />
              </label>

              <button
                className="btn-dark"
                type="submit"
              >
                Simpan Produk
              </button>

              {form.id !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={() =>
                    setForm({
                      ...EMPTY_PRODUCT,
                    })
                  }
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>
                Daftar Produk ({products.length})
              </h2>

              {filteredProducts.map((p) => (
                <div
                  className="lum-dash-product-row"
                  key={p.id}
                >
                  <div className="lum-admin-thumb">
                    <Photo
                      src={p.image}
                      alt={p.name}
                    />
                  </div>

                  <div className="lum-admin-product-info">
                    <strong>
                      {prettyName(p.name)}
                    </strong>

                    <p>
                      {rp(p.price)} · Stok{" "}
                      {p.stock}
                    </p>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() => onEdit(p)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-light"
                    onClick={() =>
                      onDelete(p.id)
                    }
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </section>
          </div>
        )}

        {tab === "orders" && (
          <section className="lum-dash-card">
            <h2>
              Manajemen Pesanan & Pembayaran
            </h2>

            <p className="muted">
              Transfer/QRIS wajib dikonfirmasi
              sebelum diproses; COD dikonfirmasi
              setelah Selesai. Semua pembayaran
              hanya simulasi.
            </p>

            {chosen && (
              <>
                <label>
                  Pilih Pesanan
                  <select
                    value={String(chosen.id)}
                    onChange={(e) =>
                      setChosenId(
                        e.target.value
                      )
                    }
                  >
                    {filteredOrders.map((o) => (
                      <option
                        key={o.id}
                        value={String(o.id)}
                      >
                        {o.id} — {o.customer}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="lum-payment-detail">
                  <p>
                    <b>Metode:</b>{" "}
                    {paymentLabel(
                      chosen.paymentMethod
                    )}
                  </p>

                  <p>
                    <b>Status pembayaran:</b>{" "}
                    {payStatus(chosen)}
                  </p>

                  <p>
                    <b>Voucher:</b>{" "}
                    {chosen.voucherCode || "-"}
                    {" · "}
                    <b>Diskon:</b>{" "}
                    {rp(chosen.discount || 0)}
                  </p>

                  <p>
                    <b>Total:</b>{" "}
                    {rp(chosen.total)}
                  </p>

                  {chosen.paidAt && (
                    <p>
                      Dikonfirmasi:{" "}
                      {date(chosen.paidAt)}
                    </p>
                  )}

                  <button
                    className="btn-dark"
                    disabled={!canPay(chosen)}
                    onClick={() =>
                      onPay(chosen.id)
                    }
                  >
                    {payStatus(chosen) === "Lunas"
                      ? "✓ Lunas"
                      : chosen.paymentMethod ===
                          "cod"
                        ? "Konfirmasi COD"
                        : "Tandai Lunas"}
                  </button>
                </div>

                <OrderStatusFlow
                  status={status(
                    chosen.status
                  )}
                />

                <OrderHistory
                  order={chosen}
                />
              </>
            )}

            <h3>Daftar Pesanan</h3>

            <OrderTable
              orders={filteredOrders}
              edit
              onStatus={onStatus}
              onPay={onPay}
            />
          </section>
        )}

        {tab === "reports" && (
          <section className="lum-dash-card">
            <h2>Sales Report</h2>

            <p>
              Total Pesanan: {orders.length}
              {" · "}
              Selesai: {done.length}
              {" · "}
              Pendapatan Selesai: {rp(revenue)}
            </p>

            <OrderTable
              orders={filteredOrders}
            />

            <div className="lum-report-actions">
              <button
                className="btn-dark"
                disabled={!filteredOrders.length}
                onClick={() =>
                  downloadTransactionsPDF(
                    filteredOrders
                  )
                }
              >
                Download PDF
              </button>

              <button
                className="btn-light"
                disabled={!filteredOrders.length}
                onClick={exportCSV}
              >
                Download CSV
              </button>
            </div>

            <small className="muted">
              Kolom voucher pada PDF mengikuti
              format di utils/reportPdf.js;
              CSV sudah memuat voucher.
            </small>
          </section>
        )}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>Photo Gallery</h2>

            <select
              value={folderFilter}
              onChange={(e) =>
                setFolderFilter(
                  e.target.value
                )
              }
            >
              <option value="Semua">
                Semua
              </option>

              {CATEGORIES.map((c) => (
                <option
                  key={c.folder}
                  value={c.folder}
                >
                  {c.label}
                </option>
              ))}
            </select>

            <p>
              {filteredPhotos.length} foto tersedia
            </p>

            <div className="lum-gallery">
              {filteredPhotos.map((p) => (
                <article key={p.url}>
                  <Photo
                    src={p.url}
                    alt={p.name}
                  />

                  <small>
                    {p.folder} / {p.name}
                  </small>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="lum-dash-right">
        <h3>Store Summary</h3>
        <p>Total Produk: {products.length}</p>
        <p>Foto Lokal: {PHOTOS.length}</p>
        <p>Total Pesanan: {orders.length}</p>
        <p>
          Stok Menipis:{" "}
          {
            products.filter(
              (p) => Number(p.stock) <= 5
            ).length
          }
        </p>
      </aside>
    </div>
  );
}

/* =====================================
   MAIN APP
===================================== */

export default function App() {
  const [products, setProducts] = useState(loadProducts);

  const [orders, setOrders] = useState(
    () => arr(KEY.orders)
  );

  const [customer, setCustomer] = useState(
    () => read(KEY.session, null)
  );

  const [cart, setCart] = useState(
    () => arr(KEY.cart)
  );

  const [wishlist, setWishlist] = useState(
    () => arr(KEY.wishlist)
  );

  const [reviews, setReviews] = useState(
    () => read(KEY.reviews, {})
  );

  const [page, setPage] = useState(
    () =>
      location.hash === "#admin"
        ? "admin"
        : "home"
  );

  const [returnPage, setReturnPage] =
    useState("home");

  const [category, setCategory] =
    useState("All");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const [shownCount, setShownCount] =
    useState(12);

  const [selectedId, setSelectedId] =
    useState(null);

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  const [form, setForm] = useState({
    ...EMPTY_PRODUCT,
  });

  const [checkout, setCheckout] = useState({
    ...EMPTY_CHECKOUT,
  });

  const [voucherInput, setVoucherInput] =
    useState("");

  const [appliedVoucher, setAppliedVoucher] =
    useState("");

  const [voucherMessage, setVoucherMessage] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [lastId, setLastId] =
    useState("");

  const checkoutLock = useRef(false);
  const statusLock = useRef(new Set());
  const paymentLock = useRef(new Set());

  useEffect(() => {
    store(KEY.products, products);
  }, [products]);

  useEffect(() => {
    store(KEY.orders, orders);
    statusLock.current.clear();
    paymentLock.current.clear();
  }, [orders]);

  useEffect(() => {
    store(KEY.cart, cart);
  }, [cart]);

  useEffect(() => {
    store(KEY.wishlist, wishlist);
  }, [wishlist]);

  useEffect(() => {
    store(KEY.reviews, reviews);
  }, [reviews]);

  useEffect(() => {
    if (customer) {
      store(KEY.session, customer);
    } else {
      localStorage.removeItem(KEY.session);
    }
  }, [customer]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(
      () => setMessage(""),
      3500
    );

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    setShownCount(12);
  }, [category, search, sort]);

  const visible = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (category === "All" ||
              p.collection === category) &&
            text(
              `${p.name} ${p.collection} ${p.description}`
            ).includes(text(search))
        )
        .sort((a, b) => {
          if (sort === "low") {
            return (
              Number(a.price) -
              Number(b.price)
            );
          }

          if (sort === "high") {
            return (
              Number(b.price) -
              Number(a.price)
            );
          }

          if (sort === "name") {
            return a.name.localeCompare(
              b.name
            );
          }

          return 0;
        }),
    [products, category, search, sort]
  );

  const selected = products.find(
    (p) => p.id === selectedId
  );

  const validCart = cart
    .map((item) => {
      const p = products.find(
        (x) => x.id === item.id
      );

      if (!p) return null;

      return {
        ...p,
        key:
          item.key ||
          JSON.stringify([
            item.id,
            item.size,
            item.color,
          ]),
        size: item.size,
        color: item.color,
        quantity: Math.max(
          1,
          Math.floor(
            Number(item.quantity) || 1
          )
        ),
      };
    })
    .filter(Boolean);

  const count = validCart.reduce(
    (n, i) => n + i.quantity,
    0
  );

  const subtotal = validCart.reduce(
    (n, i) =>
      n + Number(i.price) * i.quantity,
    0
  );

  const shipping =
    checkout.shipping === "express"
      ? 25000
      : 12000;

  const applied = appliedVoucher
    ? voucherValue(appliedVoucher, subtotal)
    : null;

  const discount = applied?.ok
    ? applied.amount
    : 0;

  const total =
    subtotal - discount + shipping;

  const mine = customer
    ? orders.filter(
        (o) =>
          String(o.customerId) ===
          String(customer.id)
      )
    : [];

  const hero =
    PHOTOS.find(
      (p) => p.folder === "baju wanita"
    )?.url ||
    PHOTOS[0]?.url ||
    products.find((p) => p.image)?.image;

  const currentOrder =
    orders.find((o) => o.id === lastId) ||
    orders[0];

  const gridProps = {
    favorites: wishlist,
    reviews,
    onDetail: openProduct,
    onFavorite: toggleFavorite,
    onCart: addToCart,
  };

  function go(next) {
    if (["home", "shop", "cart"].includes(next)) {
      checkoutLock.current = false;
    }

    setPage(next);

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        (next === "admin" ? "#admin" : "")
    );

    window.scrollTo(0, 0);
  }

  function choose(next) {
    setCategory(next);
    setSearch("");
    go("shop");
  }

  function openProduct(p) {
    setSelectedId(p.id);
    setSize(p.sizes?.[0] || "All Size");
    setColor(
      p.colors?.[0] || "Sesuai foto"
    );
    go("detail");
  }

  function auth(next = "home") {
    setReturnPage(next);
    go("auth");
  }

  function login(user) {
    setCustomer(user);

    setCheckout((p) => ({
      ...p,
      name: p.name || user.name,
    }));

    go(returnPage);

    setMessage(
      `Selamat datang, ${user.name}!`
    );
  }

  function logout() {
    setCustomer(null);
    go("home");
    setMessage("Berhasil logout.");
  }

  function toggleFavorite(id) {
    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id]
    );
  }

  function reviewProduct(id, list) {
    setReviews((prev) => ({
      ...prev,
      [String(id)]: list,
    }));
  }

  /* KERANJANG */

  function addToCart(
    product,
    chosenSize,
    chosenColor
  ) {
    const p = products.find(
      (v) => v.id === product.id
    );

    if (!p) return;

    const used = cart
      .filter((v) => v.id === p.id)
      .reduce(
        (n, v) =>
          n + Number(v.quantity),
        0
      );

    if (used >= Number(p.stock)) {
      setMessage(
        "Stok tidak mencukupi."
      );
      return;
    }

    const s =
      chosenSize ||
      p.sizes?.[0] ||
      "All Size";

    const c =
      chosenColor ||
      p.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      p.id,
      s,
      c,
    ]);

    setCart((prev) => {
      const old = prev.find(
        (v) =>
          (v.key ||
            JSON.stringify([
              v.id,
              v.size,
              v.color,
            ])) === key
      );

      return old
        ? prev.map((v) =>
            (v.key ||
              JSON.stringify([
                v.id,
                v.size,
                v.color,
              ])) === key
              ? {
                  ...v,
                  key,
                  quantity:
                    Number(v.quantity) + 1,
                }
              : v
          )
        : [
            ...prev,
            {
              id: p.id,
              key,
              size: s,
              color: c,
              quantity: 1,
            },
          ];
    });

    setMessage(
      "Produk masuk ke keranjang."
    );
  }

  function changeQty(key, step) {
    const item = validCart.find(
      (v) => v.key === key
    );

    if (!item) return;

    const used = cart
      .filter((v) => v.id === item.id)
      .reduce(
        (n, v) =>
          n + Number(v.quantity),
        0
      );

    if (
      step > 0 &&
      used >= Number(item.stock)
    ) {
      setMessage(
        "Stok tidak mencukupi."
      );
      return;
    }

    setCart((prev) =>
      prev
        .map((v) => {
          const k =
            v.key ||
            JSON.stringify([
              v.id,
              v.size,
              v.color,
            ]);

          return k === key
            ? {
                ...v,
                key,
                quantity:
                  Number(v.quantity) + step,
              }
            : v;
        })
        .filter((v) => v.quantity > 0)
    );
  }

  /* VOUCHER */

  function applyVoucher() {
    const result = voucherValue(
      voucherInput,
      subtotal
    );

    setAppliedVoucher(
      result.ok ? result.code : ""
    );

    setVoucherMessage(result.message);
  }

  function clearVoucher() {
    setVoucherInput("");
    setAppliedVoucher("");
    setVoucherMessage("");
  }

  /* CHECKOUT */

  function placeOrder(e) {
    e.preventDefault();

    if (checkoutLock.current) return;

    if (!customer) {
      auth("checkout");
      return;
    }

    if (!validCart.length) {
      setMessage("Keranjang kosong.");
      return;
    }

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(
        checkout.phone.trim()
      )
    ) {
      setMessage(
        "Periksa nama, nomor telepon, dan alamat."
      );
      return;
    }

    const qty = new Map();

    validCart.forEach((i) =>
      qty.set(
        i.id,
        (qty.get(i.id) || 0) +
          i.quantity
      )
    );

    for (const [id, n] of qty) {
      const p = products.find(
        (v) => v.id === id
      );

      if (!p || Number(p.stock) < n) {
        setMessage(
          "Stok tidak mencukupi."
        );
        return;
      }
    }

    checkoutLock.current = true;

    const now = new Date().toISOString();
    const id = `LM-${Date.now()}`;

    const method = METHODS.some(
      (m) => m.value === checkout.payment
    )
      ? checkout.payment
      : "cod";

    const promo = appliedVoucher
      ? voucherValue(
          appliedVoucher,
          subtotal
        )
      : null;

    const cut = promo?.ok
      ? promo.amount
      : 0;

    const order = {
      id,
      date: now,
      customer: checkout.name.trim(),
      customerId: customer.id,
      customerEmail: customer.email,
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      shipping: checkout.shipping,
      shippingFee: shipping,
      paymentMethod: method,
      paymentStatus:
        method === "cod"
          ? "Bayar di Tempat"
          : "Menunggu Pembayaran",
      paidAt: null,
      paymentHistory: [],
      items: validCart.map((i) => ({
        ...i,
      })),
      subtotal,
      voucherCode:
        promo?.ok
          ? promo.code
          : null,
      discount: cut,
      total: subtotal - cut + shipping,
      status: "Pesanan Baru",
      stockRestored: false,
      history: [
        {
          id: `${id}-created`,
          from: null,
          status: "Pesanan Baru",
          at: now,
          by: "Sistem",
          note:
            `Checkout ${paymentLabel(method)}; ` +
            `Voucher: ${
              promo?.ok
                ? promo.code
                : "Tidak ada"
            }.`,
        },
      ],
    };

    setOrders((prev) => [
      order,
      ...prev,
    ]);

    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        stock:
          Number(p.stock) -
          (qty.get(p.id) || 0),
      }))
    );

    setCart([]);
    setCheckout({ ...EMPTY_CHECKOUT });
    clearVoucher();

    setLastId(id);
    go("success");

    setMessage(
      "Pesanan berhasil dibuat."
    );
  }

  /* PEMBAYARAN ADMIN */

  function confirmPayment(id) {
    const order = orders.find(
      (o) => o.id === id
    );

    if (
      !canPay(order) ||
      paymentLock.current.has(id)
    ) {
      return;
    }

    if (
      !window.confirm(
        `Tandai pembayaran pesanan ${id} ` +
        `sebagai LUNAS? (Simulasi)`
      )
    ) {
      return;
    }

    paymentLock.current.add(id);

    const now = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              paymentStatus: "Lunas",
              paidAt: now,
              paymentConfirmedBy: "Admin Demo",
              paymentHistory: [
                ...(Array.isArray(
                  o.paymentHistory
                )
                  ? o.paymentHistory
                  : []),
                {
                  id:
                    `${id}-paid-${Date.now()}`,
                  at: now,
                  status: "Lunas",
                  by: "Admin Demo",
                  note:
                    "Pembayaran simulasi dikonfirmasi.",
                },
              ],
            }
          : o
      )
    );

    setMessage(
      "Pembayaran ditandai Lunas."
    );
  }

  /* STATUS PESANAN */

  function changeStatus(id, next) {
    const order = orders.find(
      (o) => o.id === id
    );

    if (
      !order ||
      statusLock.current.has(id)
    ) {
      return;
    }

    const current = status(
      order.status
    );

    if (!canMove(current, next)) {
      setMessage(
        "Status harus berubah berurutan."
      );
      return;
    }

    if (
      next !== "Dibatalkan" &&
      ["transfer", "qris"].includes(
        order.paymentMethod
      ) &&
      payStatus(order) !== "Lunas"
    ) {
      setMessage(
        "Konfirmasi pembayaran sebelum memproses pesanan."
      );
      return;
    }

    // Pengaman agar pesanan tidak terbatalkan
    // karena salah klik dropdown.
    if (
      next === "Dibatalkan" &&
      !window.confirm(
        `Yakin ingin MEMBATALKAN pesanan ${id}? ` +
        "Status ini tidak bisa dikembalikan."
      )
    ) {
      return;
    }

    statusLock.current.add(id);

    const now = new Date().toISOString();

    if (
      next === "Dibatalkan" &&
      !order.stockRestored
    ) {
      const qty = new Map();

      (order.items || []).forEach((i) =>
        qty.set(
          i.id,
          (qty.get(i.id) || 0) +
            Number(i.quantity || 0)
        )
      );

      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          stock:
            Number(p.stock) +
            (qty.get(p.id) || 0),
        }))
      );
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: next,
              updatedAt: now,
              stockRestored:
                !!o.stockRestored ||
                next === "Dibatalkan",
              history: [
                ...(Array.isArray(
                  o.history
                )
                  ? o.history
                  : []),
                {
                  id:
                    `${id}-${Date.now()}-${next}`,
                  from: current,
                  status: next,
                  at: now,
                  by: "Admin Demo",
                  note:
                    next === "Dibatalkan"
                      ? "Pesanan dibatalkan."
                      : `Status menjadi ${next}.`,
                },
              ],
            }
          : o
      )
    );

    setMessage(
      `Status pesanan: ${next}`
    );
  }

  /* CRUD PRODUK */

  function saveProduct(e) {
    e.preventDefault();

    const c = CATEGORIES.find(
      (x) => x.name === form.collection
    );

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !form.name.trim() ||
      !c ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setMessage(
        "Periksa nama, harga, dan stok."
      );
      return;
    }

    if (
      form.image &&
      !PHOTOS.some(
        (p) =>
          p.url === form.image &&
          p.folder === c.folder
      )
    ) {
      setMessage(
        "Foto tidak sesuai kategori."
      );
      return;
    }

    if (
      form.image &&
      products.some(
        (p) =>
          p.id !== form.id &&
          p.image === form.image
      )
    ) {
      setMessage(
        "Foto utama sudah digunakan produk lain."
      );
      return;
    }

    const sizes = values(form.sizes);
    const colors = values(form.colors);

    if (
      !sizes.length ||
      !colors.length
    ) {
      setMessage(
        "Ukuran dan warna wajib diisi."
      );
      return;
    }

    const gallery = [
      ...new Set(
        values(form.gallery).filter(
          (url) =>
            url !== form.image &&
            PHOTOS.some(
              (p) =>
                p.url === url &&
                p.folder === c.folder
            )
        )
      ),
    ];

    const product = {
      id:
        form.id ??
        `custom:${Date.now()}`,
      name: form.name.trim(),
      collection: c.name,
      image: form.image,
      gallery,
      price,
      stock,
      description: form.description.trim(),
      sizes,
      colors,
    };

    setProducts((prev) =>
      form.id === null
        ? [...prev, product]
        : prev.map((p) =>
            p.id === form.id
              ? product
              : p
          )
    );

    setForm({ ...EMPTY_PRODUCT });

    setMessage(
      "Produk berhasil disimpan."
    );
  }

  function editProduct(p) {
    setForm({
      id: p.id,
      name: p.name,
      collection: p.collection,
      image: p.image || "",
      gallery:
        (p.gallery || []).join(","),
      price: String(p.price),
      stock: String(p.stock),
      description: p.description || "",
      sizes:
        (p.sizes || []).join(","),
      colors:
        (p.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const active = orders.some(
      (o) =>
        !["Selesai", "Dibatalkan"].includes(
          status(o.status)
        ) &&
        o.items?.some(
          (i) => i.id === id
        )
    );

    if (active) {
      setMessage(
        "Selesaikan pesanan aktif dahulu."
      );
      return;
    }

    if (
      !window.confirm(
        "Hapus produk ini?"
      )
    ) {
      return;
    }

    const p = products.find(
      (v) => v.id === id
    );

    const deleted = new Set(
      arr(KEY.deleted).map(String)
    );

    deleted.add(String(id));

    if (p?.image) {
      deleted.add(`local:${p.image}`);
    }

    store(KEY.deleted, [...deleted]);

    setProducts((prev) =>
      prev.filter((v) => v.id !== id)
    );

    setCart((prev) =>
      prev.filter((v) => v.id !== id)
    );

    setWishlist((prev) =>
      prev.filter((v) => v !== id)
    );

    setMessage("Produk dihapus.");
  }

  /* TAMPILAN */

  return (
    <div
      className={`lumina ${
        page === "admin" ? "admin-mode" : ""
      }`}
    >
      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — PREMIUM FASHION & LIFESTYLE
          </div>

          <header className="navbar">
            <button
              className="logo"
              onClick={() => go("home")}
            >
              LUMINA<span>.</span>
            </button>

            <nav className="nav-menu">
              <button onClick={() => go("home")}>
                Home
              </button>

              <button onClick={() => choose("All")}>
                Shop
              </button>

              <button onClick={() => choose("Pria")}>
                Men
              </button>

              <button onClick={() => choose("Wanita")}>
                Women
              </button>

              <button
                onClick={() =>
                  choose("Batik Wanita")
                }
              >
                Batik
              </button>

              <button
                onClick={() =>
                  choose("Tas Wanita")
                }
              >
                Bags
              </button>

              <button
                onClick={() => go("wishlist")}
              >
                ♡ Wishlist ({wishlist.length})
              </button>

              <button
                onClick={() => go("admin")}
              >
                Admin Demo
              </button>

              {customer ? (
                <>
                  <button
                    onClick={() => go("account")}
                  >
                    Halo, {customer.name}
                  </button>

                  <button onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => auth("home")}
                >
                  Login / Register
                </button>
              )}
            </nav>

            <button
              className="cart-link"
              onClick={() => go("cart")}
            >
              🛍 Cart ({count})
            </button>
          </header>
        </>
      )}

      {/* HOME */}

      {page === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                THE NEW LUMINA COLLECTION
              </p>

              <h1>
                Elevate Your
                <br />
                <em>Everyday Style.</em>
              </h1>

              <p>
                Temukan fashion pria, wanita,
                batik, sepatu, tas, dan aksesori
                pilihan.
              </p>

              <button
                className="btn-dark"
                onClick={() => choose("All")}
              >
                Explore Collection →
              </button>

              <p className="hero-bottom">
                MODERN • ELEGANT • TIMELESS
              </p>
            </div>

            <div className="hero-photo">
              <Photo
                src={hero}
                alt="LUMINA fashion collection"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧
              <strong>Premium Fashion</strong>
              <span>Modern & Elegant</span>
            </div>

            <div>
              ♡
              <strong>
                {PHOTOS.length} Foto Koleksi
              </strong>
              <span>Katalog gambar lokal</span>
            </div>

            <div>
              ✦
              <strong>Seven Collections</strong>
              <span>Fashion For Everyone</span>
            </div>
          </section>

          <section className="container section">
            <p className="eyebrow center">
              SHOP BY CATEGORY
            </p>

            <h2 className="section-title">
              Explore Our Collections
            </h2>

            <div className="lum-home-categories">
              {CATEGORIES.map((c) => {
                const cover = products.find(
                  (p) =>
                    p.collection === c.name &&
                    p.image
                );

                return (
                  <button
                    key={c.name}
                    onClick={() =>
                      choose(c.name)
                    }
                  >
                    <Photo
                      src={cover?.image}
                      alt={c.label}
                    />

                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="container section">
            <p className="eyebrow center">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Featured Collection
            </h2>

            <p className="section-description">
              Pilihan fashion untuk menyempurnakan
              gaya sehari-hari.
            </p>

            <ProductGrid
              products={products
                .filter((p) => p.image)
                .slice(0, 8)}
              favorites={wishlist}
              reviews={reviews}
              onDetail={openProduct}
              onFavorite={toggleFavorite}
              onCart={addToCart}
            />

            <div className="center action-space">
              <button
                className="btn-dark"
                onClick={() => choose("All")}
              >
                Lihat Semua Produk →
              </button>
            </div>
          </section>
        </>
      )}

      {/* SHOP */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <p className="eyebrow">
              DISCOVER YOUR STYLE
            </p>

            <h1>Shop Our Collection</h1>

            <p>
              Temukan produk terbaik dari
              LUMINA STORE.
            </p>
          </div>

          <div className="lum-shop-categories">
            {[
              {
                name: "All",
                label: "Semua",
              },
              ...CATEGORIES.map((c) => ({
                name: c.name,
                label: c.label,
              })),
            ].map((c) => (
              <button
                key={c.name}
                className={`lum-shop-pill ${
                  category === c.name
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setCategory(c.name);
                  setSearch("");
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="lum-shop-toolbar">
            <div className="lum-shop-search">
              <span>⌕</span>

              <input
                type="search"
                value={search}
                placeholder="Cari produk..."
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="lum-shop-sort"
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
            >
              <option value="default">
                Urutan Default
              </option>

              <option value="low">
                Harga Termurah
              </option>

              <option value="high">
                Harga Termahal
              </option>

              <option value="name">
                Nama A–Z
              </option>
            </select>
          </div>

          <div className="lum-shop-count">
            <span>
              {visible.length} produk ditemukan
            </span>

            <span>
              Menampilkan{" "}
              {Math.min(
                shownCount,
                visible.length
              )}
            </span>
          </div>

          <ProductGrid
            products={visible.slice(
              0,
              shownCount
            )}
            favorites={wishlist}
            reviews={reviews}
            onDetail={openProduct}
            onFavorite={toggleFavorite}
            onCart={addToCart}
          />

          {shownCount < visible.length && (
            <div className="center action-space">
              <button
                className="btn-light"
                onClick={() =>
                  setShownCount(
                    (n) => n + 12
                  )
                }
              >
                Tampilkan Lebih Banyak (
                {visible.length - shownCount} tersisa) ↓
              </button>
            </div>
          )}
        </main>
      )}

      {/* DETAIL */}

      {page === "detail" && selected && (
        <ProductDetail
          key={selected.id}
          product={selected}
          customer={customer}
          size={size}
          color={color}
          onSize={setSize}
          onColor={setColor}
          onCart={addToCart}
          onFavorite={toggleFavorite}
          favorite={wishlist.includes(
            selected.id
          )}
          reviews={reviews}
          onReview={reviewProduct}
          onBack={() => go("shop")}
        />
      )}

      {/* WISHLIST */}

      {page === "wishlist" && (
        <main className="container section">
          <h1 className="section-title">
            My Wishlist ♡
          </h1>

          <ProductGrid
            products={products.filter(
              (p) => wishlist.includes(p.id)
            )}
            favorites={wishlist}
            reviews={reviews}
            onDetail={openProduct}
            onFavorite={toggleFavorite}
            onCart={addToCart}
          />
        </main>
      )}

      {/* CART */}

      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {!validCart.length && (
                <p>Keranjang masih kosong.</p>
              )}

              {validCart.map((i) => (
                <div
                  className="cart-row"
                  key={i.key}
                >
                  <div className="lum-cart-photo">
                    <Photo
                      src={i.image}
                      alt={i.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>
                      {prettyName(i.name)}
                    </h3>

                    <p>
                      {i.size} / {i.color}
                    </p>

                    <strong>
                      {rp(i.price)}
                    </strong>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQty(i.key, -1)
                        }
                      >
                        −
                      </button>

                      <span>{i.quantity}</span>

                      <button
                        onClick={() =>
                          changeQty(i.key, 1)
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter(
                              (v) =>
                                (v.key ||
                                  JSON.stringify([
                                    v.id,
                                    v.size,
                                    v.color,
                                  ])) !== i.key
                            )
                          )
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel summary">
              <h2>Ringkasan Belanja</h2>

              <div className="lum-between">
                <span>Jumlah Produk</span>
                <b>{count}</b>
              </div>

              <div className="lum-between">
                <span>Subtotal</span>
                <b>{rp(subtotal)}</b>
              </div>

              <button
                className="btn-dark wide"
                disabled={!validCart.length}
                onClick={() =>
                  customer
                    ? go("checkout")
                    : auth("checkout")
                }
              >
                Checkout →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* LOGIN */}

      {page === "auth" && (
        <AuthPage
          onSuccess={login}
          onBack={() => go("home")}
        />
      )}

      {/* CHECKOUT TANPA LOGIN */}

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>Login untuk Checkout</h2>

          <button
            className="btn-dark"
            onClick={() => auth("checkout")}
          >
            Login
          </button>
        </main>
      )}

      {/* CHECKOUT */}

      {page === "checkout" && customer && (
        <main className="container section">
          <h1 className="section-title">
            Checkout
          </h1>

          <div className="two-column">
            <form
              className="panel form-stack"
              onSubmit={placeOrder}
            >
              <h2>Informasi Pembeli</h2>

              <label>
                Nama Lengkap
                <input
                  required
                  value={checkout.name}
                  onChange={(e) =>
                    setCheckout((p) => ({
                      ...p,
                      name: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Nomor Telepon
                <input
                  required
                  value={checkout.phone}
                  onChange={(e) =>
                    setCheckout((p) => ({
                      ...p,
                      phone: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Alamat Pengiriman
                <textarea
                  rows={4}
                  required
                  value={checkout.address}
                  onChange={(e) =>
                    setCheckout((p) => ({
                      ...p,
                      address: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Pengiriman
                <select
                  value={checkout.shipping}
                  onChange={(e) =>
                    setCheckout((p) => ({
                      ...p,
                      shipping: e.target.value,
                    }))
                  }
                >
                  <option value="regular">
                    Regular Rp12.000
                  </option>

                  <option value="express">
                    Express Rp25.000
                  </option>
                </select>
              </label>

              <div className="lum-payment-box">
                <h3>Voucher & Diskon</h3>

                <p className="muted">
                  LUMINA10: 10% min. Rp100.000
                  {" · "}
                  FASHION20: 20% min. Rp300.000
                  {" · "}
                  WELCOME15: Rp15.000 min.
                  Rp150.000.
                </p>

                <div className="lum-voucher-controls">
                  <input
                    value={voucherInput}
                    maxLength={24}
                    placeholder="Kode voucher"
                    onChange={(e) => {
                      setVoucherInput(
                        e.target.value.toUpperCase()
                      );

                      setAppliedVoucher("");
                      setVoucherMessage("");
                    }}
                  />

                  <button
                    type="button"
                    className="btn-dark"
                    disabled={!voucherInput.trim()}
                    onClick={applyVoucher}
                  >
                    Gunakan
                  </button>
                </div>

                {applied?.ok && (
                  <button
                    type="button"
                    className="btn-light"
                    onClick={clearVoucher}
                  >
                    Hapus Voucher
                  </button>
                )}

                {(voucherMessage ||
                  (applied &&
                    !applied.ok)) && (
                  <p
                    className={
                      applied?.ok
                        ? "lum-voucher-success"
                        : "lum-voucher-error"
                    }
                    role="status"
                  >
                    {applied &&
                    !applied.ok
                      ? applied.message
                      : voucherMessage}
                  </p>
                )}
              </div>

              <div className="lum-payment-box">
                <h3>
                  Metode Pembayaran (Simulasi)
                </h3>

                <select
                  value={checkout.payment}
                  onChange={(e) =>
                    setCheckout((p) => ({
                      ...p,
                      payment: e.target.value,
                    }))
                  }
                >
                  {METHODS.map((m) => (
                    <option
                      value={m.value}
                      key={m.value}
                    >
                      {m.label}
                    </option>
                  ))}
                </select>

                <p className="muted">
                  Tidak ada perpindahan uang
                  sungguhan. Konfirmasi dilakukan
                  di Admin Demo.
                </p>
              </div>

              <button
                type="submit"
                className="btn-dark wide"
                disabled={!validCart.length}
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <aside className="panel summary">
              <h2>Ringkasan Pesanan</h2>

              <div className="lum-between">
                <span>Subtotal</span>
                <b>{rp(subtotal)}</b>
              </div>

              <div className="lum-between">
                <span>Voucher</span>
                <b>
                  {applied?.ok
                    ? applied.code
                    : "Tidak digunakan"}
                </b>
              </div>

              <div className="lum-between">
                <span>Diskon</span>
                <b className="lum-voucher-success">
                  −{rp(discount)}
                </b>
              </div>

              <div className="lum-between">
                <span>Ongkir</span>
                <b>{rp(shipping)}</b>
              </div>

              <div className="lum-between">
                <span>Pembayaran</span>
                <b>
                  {paymentLabel(
                    checkout.payment
                  )}
                </b>
              </div>

              <hr />

              <div className="lum-between lum-grand-total">
                <b>Total Pembayaran</b>

                <strong>
                  {rp(total)}
                </strong>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* DASHBOARD PELANGGAN */}

      {page === "account" && customer && (
        <>
          <CustomerTracking
            orders={mine}
          />

          <CustomerDashboard
            customer={customer}
            orders={mine}
            onBack={() => choose("All")}
            onLogout={logout}
          />
        </>
      )}

      {/* SUKSES */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <h1>✓ Pesanan Berhasil!</h1>

            {currentOrder && (
              <>
                <p>
                  Nomor Pesanan:{" "}
                  <b>{currentOrder.id}</b>
                </p>

                <p>
                  Metode:{" "}
                  {paymentLabel(
                    currentOrder.paymentMethod
                  )}
                </p>

                <p>
                  Status Bayar:{" "}
                  {payStatus(currentOrder)}
                </p>

                <p>
                  Voucher:{" "}
                  {currentOrder.voucherCode ||
                    "Tidak digunakan"}
                </p>

                <p>
                  Diskon: −
                  {rp(currentOrder.discount || 0)}
                </p>

                <h2>
                  Total:{" "}
                  {rp(currentOrder.total)}
                </h2>
              </>
            )}

            <p>
              Pesanan simulasi bisa dilihat
              pada Dashboard Pelanggan.
            </p>

            <button
              className="btn-dark"
              onClick={() => go("account")}
            >
              Lihat Pesanan Saya →
            </button>

            <button
              className="btn-light"
              onClick={() => choose("All")}
            >
              Lanjut Belanja
            </button>
          </div>
        </main>
      )}

      {/* ADMIN */}

      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          form={form}
          setForm={setForm}
          onSave={saveProduct}
          onEdit={editProduct}
          onDelete={deleteProduct}
          onStatus={changeStatus}
          onPay={confirmPayment}
          onBack={() => go("home")}
        />
      )}

      {/* FOOTER */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>
            <p>Premium Fashion & Lifestyle</p>
          </div>

          <p>
            Men • Women • Batik • Shoes • Bags
          </p>

          <p>
            © {new Date().getFullYear()} LUMINA STORE
          </p>
        </footer>
      )}

      {message && (
        <div
          className="toast"
          role="status"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
