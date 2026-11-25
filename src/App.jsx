
import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

/* =========================================================
   LUMINA STORE — REACT E-COMMERCE
   TAHAP 5: FILTER PRODUK PREMIUM
   ========================================================= */

const CATEGORIES = [
  {
    folder: "baju pria",
    name: "Pria",
    label: "Baju Pria",
    price: 179000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "baju wanita",
    name: "Wanita",
    label: "Baju Wanita",
    price: 199000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "batik wanita",
    name: "Batik Wanita",
    label: "Batik",
    price: 235000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "sepatu pria",
    name: "Sepatu Pria",
    label: "Sepatu Pria",
    price: 295000,
    sizes: ["39", "40", "41", "42", "43", "44"],
  },
  {
    folder: "sepatu wanita",
    name: "Sepatu Wanita",
    label: "Sepatu Wanita",
    price: 245000,
    sizes: ["35", "36", "37", "38", "39", "40"],
  },
  {
    folder: "tas wanita",
    name: "Tas Wanita",
    label: "Tas",
    price: 249000,
    sizes: ["All Size"],
  },
  {
    folder: "aksesoris wanita",
    name: "Accessories",
    label: "Aksesori",
    price: 129000,
    sizes: ["All Size"],
  },
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

/* =========================================================
   PENYIMPANAN DAN HELPER
   ========================================================= */

function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function arr(key) {
  const data = read(key, []);
  return Array.isArray(data) ? data : [];
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    return false;
  }
}

function text(value) {
  return String(value ?? "").trim().toLowerCase();
}

function values(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
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

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("id-ID", {
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

function orderStatus(value) {
  return STATUSES.includes(value) ? value : "Pesanan Baru";
}

function paymentLabel(value) {
  return (
    METHODS.find((method) => method.value === value)?.label ||
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
  return Boolean(
    order &&
      ["cod", "transfer", "qris"].includes(order.paymentMethod) &&
      orderStatus(order.status) !== "Dibatalkan" &&
      payStatus(order) !== "Lunas" &&
      (order.paymentMethod !== "cod" ||
        orderStatus(order.status) === "Selesai")
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
    (voucher) =>
      voucher.code === String(code || "").trim().toUpperCase()
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
      message: `Minimal belanja ${rp(item.min)} untuk ${item.code}.`,
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
    message: `Voucher ${item.code} berhasil digunakan.`,
  };
}

/* =========================================================
   DATA GAMBAR PRODUK LOKAL
   ========================================================= */

function folder(value) {
  const name = text(value);

  return (
    {
      pria: "baju pria",
      wanita: "baju wanita",
      aksesoris: "aksesoris wanita",
    }[name] || name
  );
}

function imagePath(value) {
  if (!value) return "";

  const raw = String(value).trim().replace(/\\/g, "/");

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
    CATEGORIES.some((category) => category.folder === folder(parts[0]))
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
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

  return `${base}/${encoded}`;
}

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages) ? productImages : [])
      .filter((photo) => photo?.url)
      .map((photo) => {
        const url = imagePath(photo.url);
        const parts = url.replace(/^\/+/, "").split("/");
        const index = parts.indexOf("images");

        let dirname = index >= 0 ? parts[index + 1] : "";

        try {
          dirname = decodeURIComponent(dirname);
        } catch {
          // Gunakan nama folder asli.
        }

        return {
          ...photo,
          url,
          folder: folder(photo.folder || dirname),
          name: photo.name || parts.at(-1),
        };
      })
      .filter((photo) =>
        CATEGORIES.some((category) => category.folder === photo.folder)
      )
      .map((photo) => [photo.url, photo])
  ).values(),
];

const DEFAULT_PRODUCTS = PHOTOS.map((photo) => {
  const category = CATEGORIES.find(
    (item) => item.folder === photo.folder
  );

  return {
    id: `local:${photo.url}`,
    name: `${category.label} — ${photo.name}`,
    collection: category.name,
    image: photo.url,
    gallery: [],
    price: category.price,
    stock: 20,
    sizes: category.sizes,
    colors: ["Sesuai foto"],
    description: `Koleksi ${category.label} dari LUMINA STORE.`,
  };
});

function loadProducts() {
  const previous =
    localStorage.getItem(KEY.products) !== null
      ? arr(KEY.products)
      : arr(KEY.oldProducts);

  const deleted = new Set(arr(KEY.deleted).map(String));

  const saved = previous
    .filter(
      (product) =>
        product &&
        product.id != null &&
        product.name &&
        !deleted.has(String(product.id))
    )
    .map((product) => {
      const photo = imagePath(product.image);

      const category =
        CATEGORIES.find(
          (item) => item.name === product.collection
        ) ||
        CATEGORIES.find((item) =>
          PHOTOS.some(
            (photoItem) =>
              photoItem.url === photo &&
              photoItem.folder === item.folder
          )
        ) ||
        CATEGORIES[0];

      return {
        ...product,
        image: photo,
        collection: category.name,
        price: Number(product.price) || 0,
        stock: Math.max(0, Number(product.stock) || 0),
        sizes: Array.isArray(product.sizes)
          ? product.sizes
          : category.sizes,
        colors: Array.isArray(product.colors)
          ? product.colors
          : ["Sesuai foto"],
        gallery: Array.isArray(product.gallery)
          ? product.gallery.map(imagePath)
          : [],
      };
    });

  const seen = new Set(saved.map((product) => product.image));

  const fresh = DEFAULT_PRODUCTS.filter(
    (product) =>
      !seen.has(product.image) &&
      !deleted.has(String(product.id))
  );

  return [...saved, ...fresh];
}

/* =========================================================
   FOTO PRODUK
   ========================================================= */

function Photo({ src, alt, className = "", style }) {
  const [broken, setBroken] = useState("");
  const url = imageUrl(src);

  if (!url || broken === url) {
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
      src={url}
      alt={alt || "Produk LUMINA STORE"}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setBroken(url)}
    />
  );
}

/* =========================================================
   KARTU PRODUK PREMIUM
   ========================================================= */

function ProductCard({
  product,
  favorite,
  reviewList = [],
  onDetail,
  onFavorite,
  onCart,
}) {
  const stock = Math.max(0, Number(product.stock) || 0);

  const ratings = reviewList
    .map((review) => Number(review.rating))
    .filter((rating) => rating >= 1 && rating <= 5);

  const average = ratings.length
    ? (
        ratings.reduce((sum, rating) => sum + rating, 0) /
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
        >
          <Photo
            src={product.image}
            alt={prettyName(product.name)}
          />
        </button>

        <span
          className={`stock-label ${
            stock === 0 ? "is-empty" : stock <= 5 ? "is-low" : ""
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
          className={`heart ${favorite ? "is-saved" : ""}`}
          aria-label={
            favorite ? "Hapus dari wishlist" : "Tambahkan ke wishlist"
          }
          aria-pressed={favorite}
          onClick={() => onFavorite(product.id)}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <button
          type="button"
          className="lum-image-quickview"
          onClick={() => onDetail(product)}
        >
          Lihat Detail <span>↗</span>
        </button>
      </div>

      <div className="product-body">
        <div className="lum-product-topline">
          <small>{product.collection}</small>
          <span>
            {average
              ? `★ ${average} (${ratings.length})`
              : "New arrival"}
          </span>
        </div>

        <h3 title={product.name}>
          {prettyName(product.name)}
        </h3>

        <p className="price">{rp(product.price)}</p>

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
        <p>Coba ubah pilihan filter atau kata pencarian.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          favorite={favorites.includes(product.id)}
          reviewList={
            Array.isArray(reviews[String(product.id)])
              ? reviews[String(product.id)]
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

/* =========================================================
   DETAIL DAN ULASAN PRODUK
   ========================================================= */

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
        ...(Array.isArray(product.gallery) ? product.gallery : []),
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
    ? String(customer.id ?? customer.email ?? "")
    : "";

  const mine = list.find(
    (review) => String(review.userId) === userId
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
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / list.length
      ).toFixed(1)
    : null;

  function submitReview(event) {
    event.preventDefault();

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
      ? list.map((review) =>
          review.id === mine.id ? record : review
        )
      : [record, ...list];

    onReview(product.id, updated);
    setNotice("Ulasan berhasil disimpan di browser.");
  }

  return (
    <main className="container section lum-new-detail">
      <button type="button" className="back" onClick={onBack}>
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
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                className={active === url ? "active" : ""}
                onClick={() => setActive(url)}
              >
                <Photo
                  src={url}
                  alt={`Foto ${index + 1}`}
                />
              </button>
            ))}
          </div>

          <p className="muted">{images.length} foto produk</p>
        </div>

        <div className="lum-detail-data">
          <p className="eyebrow">{product.collection}</p>
          <h1>{prettyName(product.name)}</h1>

          <p className="lum-stars">
            {average
              ? `★ ${average} / 5 · ${list.length} ulasan`
              : "☆ Belum ada ulasan"}
          </p>

          <h2 className="price">{rp(product.price)}</h2>

          <p>
            {product.description ||
              "Fashion pilihan LUMINA STORE."}
          </p>

          <p>
            Stok: <strong>{product.stock}</strong>
          </p>

          <label>Ukuran</label>

          <div className="option-row">
            {(product.sizes || ["All Size"]).map((item) => (
              <button
                type="button"
                key={item}
                className={size === item ? "chosen" : ""}
                onClick={() => onSize(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label>Warna</label>

          <div className="option-row">
            {(product.colors || ["Sesuai foto"]).map((item) => (
              <button
                type="button"
                key={item}
                className={color === item ? "chosen" : ""}
                onClick={() => onColor(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-dark wide"
            disabled={Number(product.stock) <= 0}
            onClick={() => onCart(product, size, color)}
          >
            + Tambahkan ke Keranjang
          </button>

          <button
            type="button"
            className="btn-light wide"
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
              list.map((review) => (
                <article className="panel" key={review.id}>
                  <strong>{review.name}</strong>

                  <p className="lum-stars">
                    {"★".repeat(
                      Math.min(
                        5,
                        Math.max(0, Number(review.rating) || 0)
                      )
                    )}
                  </p>

                  <p>{review.comment}</p>
                  <small>{date(review.at)}</small>
                </article>
              ))
            ) : (
              <p className="muted">Belum ada ulasan.</p>
            )}
          </div>

          <form
            className="panel form-stack"
            onSubmit={submitReview}
          >
            <h3>{mine ? "Edit Ulasan" : "Tulis Ulasan"}</h3>

            <div className="lum-rating-buttons">
              {[1, 2, 3, 4, 5].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={item <= rating ? "active" : ""}
                  onClick={() => setRating(item)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Bagikan pengalamanmu..."
            />

            <button className="btn-dark">
              Simpan Ulasan
            </button>

            {notice && <p role="status">{notice}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   TRACKING PESANAN PELANGGAN
   ========================================================= */

function CustomerTracking({ orders }) {
  const stages = STATUSES.slice(0, 4);

  return (
    <section className="container section lum-customer-track">
      <h2 className="section-title">
        Tracking & Pembayaran Saya
      </h2>

      {!orders.length && (
        <p className="panel">Belum ada pesanan.</p>
      )}

      {orders.map((order) => {
        const current = orderStatus(order.status);
        const index = stages.indexOf(current);
        const paid = payStatus(order) === "Lunas";

        return (
          <article className="panel lum-track-card" key={order.id}>
            <div className="lum-between">
              <div>
                <strong>{order.id}</strong>
                <p className="muted">
                  {date(order.date)} · {rp(order.total)}
                </p>
              </div>

              <span className="lum-status-badge">
                {current}
              </span>
            </div>

            <p>
              Metode: <b>{paymentLabel(order.paymentMethod)}</b>
            </p>

            <p>
              Status bayar: <b>{payStatus(order)}</b>
            </p>

            {order.voucherCode && (
              <p className="muted">
                Voucher {order.voucherCode} · Hemat{" "}
                {rp(order.discount)}
              </p>
            )}

            {current === "Dibatalkan" ? (
              <p className="lum-cancel-note">
                Pesanan ini dibatalkan.
              </p>
            ) : (
              <div className="lum-track-steps">
                {stages.map((stage, position) => (
                  <div
                    key={stage}
                    className={
                      position <= index ? "complete" : ""
                    }
                  >
                    <span>
                      {position < index ? "✓" : position + 1}
                    </span>
                    <small>{stage}</small>
                  </div>
                ))}
              </div>
            )}

            {paid ? (
              <p className="lum-paid-note">
                ✓ Pembayaran dikonfirmasi Admin{" "}
                {order.paidAt && `pada ${date(order.paidAt)}`}
              </p>
            ) : (
              current !== "Dibatalkan" && (
                <p className="muted">
                  {order.paymentMethod === "cod"
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

/* =========================================================
   ANALISIS PENJUALAN ADMIN
   ========================================================= */

function AdminAnalytics({ orders, products }) {
  const done = orders.filter(
    (order) => orderStatus(order.status) === "Selesai"
  );

  const revenue = done.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const quantity = done
    .flatMap((order) => order.items || [])
    .reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

  const now = new Date();

  const months = Array.from({ length: 6 }, (_, index) => {
    const current = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    return {
      key:
        `${current.getFullYear()}-` +
        String(current.getMonth() + 1).padStart(2, "0"),
      label: current.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      }),
      total: 0,
    };
  });

  const sold = new Map();

  done.forEach((order) => {
    const finished = [...(order.history || [])]
      .reverse()
      .find((item) => item.status === "Selesai");

    const completedDate = new Date(
      finished?.at || order.updatedAt || order.date
    );

    const key =
      `${completedDate.getFullYear()}-` +
      String(completedDate.getMonth() + 1).padStart(2, "0");

    const month = months.find((item) => item.key === key);

    if (month) {
      month.total += Number(order.total || 0);
    }

    (order.items || []).forEach((item) => {
      const itemKey = String(item.id ?? item.name);
      const current = sold.get(itemKey) || {
        name: item.name,
        qty: 0,
      };

      current.qty += Number(item.quantity || 0);
      sold.set(itemKey, current);
    });
  });

  const maximum = Math.max(
    1,
    ...months.map((month) => month.total)
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
          ["Unit Terjual", quantity],
          [
            "Stok ≤ 5",
            products.filter(
              (product) => Number(product.stock) <= 5
            ).length,
          ],
        ].map(([label, value]) => (
          <article className="lum-dash-card" key={label}>
            <small>{label}</small>
            <h2>{value}</h2>
          </article>
        ))}
      </div>

      <div className="lum-analytics-panels">
        <article className="lum-dash-card">
          <h3>Pendapatan 6 Bulan</h3>

          <div className="lum-mini-chart">
            {months.map((month) => (
              <div
                key={month.key}
                title={`${month.label}: ${rp(month.total)}`}
              >
                <div className="lum-chart-track">
                  <div
                    style={{
                      height: `${
                        month.total
                          ? Math.max(
                              3,
                              (month.total / maximum) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <small>{month.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="lum-dash-card">
          <h3>Status Pesanan</h3>

          {STATUSES.map((statusItem) => (
            <p className="lum-between" key={statusItem}>
              <span>{statusItem}</span>
              <b>
                {
                  orders.filter(
                    (order) =>
                      orderStatus(order.status) === statusItem
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
          best.map((product, index) => (
            <p className="lum-between" key={index}>
              <span>
                {index + 1}. {prettyName(product.name)}
              </span>
              <b>{product.qty} unit</b>
            </p>
          ))
        ) : (
          <p>Belum ada transaksi selesai.</p>
        )}
      </article>
    </section>
  );
}

/* =========================================================
   TABEL PESANAN
   ========================================================= */

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
          {orders.map((order) => {
            const status = orderStatus(order.status);
            const paid = payStatus(order) === "Lunas";

            return (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{date(order.date)}</td>
                <td>{order.customer}</td>

                <td>
                  {(order.items || [])
                    .map(
                      (item) =>
                        `${prettyName(item.name)} (${item.quantity})`
                    )
                    .join(", ")}
                </td>

                <td>
                  {order.subtotal != null
                    ? rp(order.subtotal)
                    : "-"}
                </td>

                <td>{order.voucherCode || "-"}</td>

                <td>
                  {order.discount
                    ? `−${rp(order.discount)}`
                    : "-"}
                </td>

                <td>
                  <b>{rp(order.total)}</b>
                </td>

                <td>
                  {paymentLabel(order.paymentMethod)}
                </td>

                <td>{payStatus(order)}</td>

                <td>
                  {edit ? (
                    <select
                      value={status}
                      disabled={["Selesai", "Dibatalkan"].includes(
                        status
                      )}
                      onChange={(event) =>
                        onStatus(order.id, event.target.value)
                      }
                    >
                      {STATUSES.map((next) => (
                        <option
                          key={next}
                          value={next}
                          disabled={
                            next !== status &&
                            (!canMove(status, next) ||
                              (next !== "Dibatalkan" &&
                                ["transfer", "qris"].includes(
                                  order.paymentMethod
                                ) &&
                                !paid))
                          }
                        >
                          {next}
                        </option>
                      ))}
                    </select>
                  ) : (
                    status
                  )}
                </td>

                {edit && (
                  <td>
                    <button
                      type="button"
                      className="btn-dark"
                      disabled={!canPay(order)}
                      onClick={() => onPay(order.id)}
                    >
                      {paid
                        ? "✓ Lunas"
                        : order.paymentMethod === "cod"
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

/* =========================================================
   DASHBOARD ADMIN LUMINA STORE
   ========================================================= */

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
  const [folderFilter, setFolderFilter] = useState("Semua");
  const [chosenId, setChosenId] = useState("");

  const filteredProducts = products.filter((product) =>
    text(`${product.name} ${product.collection}`).includes(
      text(search)
    )
  );

  const filteredOrders = orders.filter((order) =>
    text(
      `${order.id} ${order.customer} ${order.status} ${
        order.voucherCode || ""
      }`
    ).includes(text(search))
  );

  const filteredPhotos = PHOTOS.filter(
    (photo) =>
      (folderFilter === "Semua" ||
        photo.folder === folderFilter) &&
      text(`${photo.name} ${photo.folder}`).includes(text(search))
  );

  const chosen =
    filteredOrders.find(
      (order) => String(order.id) === chosenId
    ) || filteredOrders[0];

  const done = orders.filter(
    (order) => orderStatus(order.status) === "Selesai"
  );

  const revenue = done.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const currentCategory = CATEGORIES.find(
    (item) => item.name === form.collection
  );

  function field(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

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
      ...filteredOrders.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.subtotal ?? "",
        order.shippingFee ?? "",
        order.voucherCode || "",
        order.discount || 0,
        order.total,
        paymentLabel(order.paymentMethod),
        payStatus(order),
        orderStatus(order.status),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let current = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(current)) {
              current = "'" + current;
            }

            return `"${current.replaceAll('"', '""')}"`;
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

    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          ].map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => {
                setTab(value);
                setSearch("");
              }}
            >
              {label}
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
              {
                {
                  overview: "Dashboard Overview",
                  products: "Product Management",
                  orders: "Order Management",
                  reports: "Sales Report",
                  gallery: "Photo Gallery",
                }[tab]
              }
            </h1>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
                (product) => Number(product.stock) <= 5
              ) ? (
                products
                  .filter(
                    (product) => Number(product.stock) <= 5
                  )
                  .map((product) => (
                    <p
                      className="lum-between"
                      key={product.id}
                    >
                      <span>{prettyName(product.name)}</span>
                      <b>Stok {product.stock}</b>
                    </p>
                  ))
              ) : (
                <p>✓ Semua stok aman.</p>
              )}
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>

              <div className="lum-category-stats">
                {CATEGORIES.map((category) => (
                  <button
                    className="btn-light"
                    key={category.name}
                    onClick={() => {
                      setFolderFilter(category.folder);
                      setTab("gallery");
                    }}
                  >
                    {category.label} (
                    {
                      products.filter(
                        (product) =>
                          product.collection === category.name
                      ).length
                    }
                    )
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>
              <OrderTable orders={orders.slice(0, 5)} />
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
                  onChange={(event) =>
                    field("name", event.target.value)
                  }
                />
              </label>

              <label>
                Kategori
                <select
                  value={form.collection}
                  onChange={(event) => {
                    const category = CATEGORIES.find(
                      (item) =>
                        item.name === event.target.value
                    );

                    if (category) {
                      setForm((previous) => ({
                        ...previous,
                        collection: category.name,
                        image: "",
                        gallery: "",
                        sizes: category.sizes.join(","),
                      }));
                    }
                  }}
                >
                  {CATEGORIES.map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.label}
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
                  onChange={(event) =>
                    field("price", event.target.value)
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
                  onChange={(event) =>
                    field("stock", event.target.value)
                  }
                />
              </label>

              <label>
                Foto Utama
                <select
                  value={form.image}
                  onChange={(event) =>
                    field("image", event.target.value)
                  }
                >
                  <option value="">Pilih gambar</option>

                  {PHOTOS.filter(
                    (photo) =>
                      photo.folder === currentCategory?.folder
                  ).map((photo) => (
                    <option
                      key={photo.url}
                      value={photo.url}
                    >
                      {photo.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lum-admin-preview">
                <Photo src={form.image} alt="Preview" />
              </div>

              <label>
                Foto Tambahan
                <select
                  value=""
                  onChange={(event) => {
                    if (!event.target.value) return;

                    setForm((previous) => ({
                      ...previous,
                      gallery: [
                        ...new Set([
                          ...values(previous.gallery),
                          event.target.value,
                        ]),
                      ]
                        .filter(
                          (url) => url !== previous.image
                        )
                        .join(","),
                    }));
                  }}
                >
                  <option value="">
                    + Pilih foto tambahan
                  </option>

                  {PHOTOS.filter(
                    (photo) =>
                      photo.folder === currentCategory?.folder &&
                      photo.url !== form.image &&
                      !values(form.gallery).includes(photo.url)
                  ).map((photo) => (
                    <option
                      key={photo.url}
                      value={photo.url}
                    >
                      {photo.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="lum-extra-gallery">
                {values(form.gallery).map((url) => (
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
                            .filter((item) => item !== url)
                            .join(",")
                        )
                      }
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <label>
                Deskripsi
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    field("description", event.target.value)
                  }
                />
              </label>

              <label>
                Ukuran (pisahkan dengan koma)
                <input
                  value={form.sizes}
                  onChange={(event) =>
                    field("sizes", event.target.value)
                  }
                />
              </label>

              <label>
                Warna (pisahkan dengan koma)
                <input
                  value={form.colors}
                  onChange={(event) =>
                    field("colors", event.target.value)
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
                    setForm({ ...EMPTY_PRODUCT })
                  }
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>Daftar Produk ({products.length})</h2>

              {filteredProducts.map((product) => (
                <div
                  className="lum-dash-product-row"
                  key={product.id}
                >
                  <div className="lum-admin-thumb">
                    <Photo
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="lum-admin-product-info">
                    <strong>
                      {prettyName(product.name)}
                    </strong>

                    <p>
                      {rp(product.price)} · Stok{" "}
                      {product.stock}
                    </p>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-light"
                    onClick={() => onDelete(product.id)}
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
            <h2>Manajemen Pesanan & Pembayaran</h2>

            <p className="muted">
              Transfer/QRIS wajib dikonfirmasi
              sebelum diproses. COD dikonfirmasi
              setelah pesanan selesai. Semua pembayaran
              hanya simulasi.
            </p>

            {chosen && (
              <>
                <label>
                  Pilih Pesanan
                  <select
                    value={String(chosen.id)}
                    onChange={(event) =>
                      setChosenId(event.target.value)
                    }
                  >
                    {filteredOrders.map((order) => (
                      <option
                        key={order.id}
                        value={String(order.id)}
                      >
                        {order.id} — {order.customer}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="lum-payment-detail">
                  <p>
                    <b>Metode:</b>{" "}
                    {paymentLabel(chosen.paymentMethod)}
                  </p>

                  <p>
                    <b>Status pembayaran:</b>{" "}
                    {payStatus(chosen)}
                  </p>

                  <p>
                    <b>Voucher:</b>{" "}
                    {chosen.voucherCode || "-"} ·{" "}
                    <b>Diskon:</b>{" "}
                    {rp(chosen.discount || 0)}
                  </p>

                  <p>
                    <b>Total:</b> {rp(chosen.total)}
                  </p>

                  {chosen.paidAt && (
                    <p>
                      Dikonfirmasi: {date(chosen.paidAt)}
                    </p>
                  )}

                  <button
                    className="btn-dark"
                    disabled={!canPay(chosen)}
                    onClick={() => onPay(chosen.id)}
                  >
                    {payStatus(chosen) === "Lunas"
                      ? "✓ Lunas"
                      : chosen.paymentMethod === "cod"
                        ? "Konfirmasi COD"
                        : "Tandai Lunas"}
                  </button>
                </div>

                <OrderStatusFlow
                  status={orderStatus(chosen.status)}
                />

                <OrderHistory order={chosen} />
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
              Total Pesanan: {orders.length} ·
              Selesai: {done.length} ·
              Pendapatan Selesai: {rp(revenue)}
            </p>

            <OrderTable orders={filteredOrders} />

            <div className="lum-report-actions">
              <button
                className="btn-dark"
                disabled={!filteredOrders.length}
                onClick={() =>
                  downloadTransactionsPDF(filteredOrders)
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
              PDF mengikuti format dari utils/reportPdf.js.
              CSV sudah mencantumkan voucher.
            </small>
          </section>
        )}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>Photo Gallery</h2>

            <select
              value={folderFilter}
              onChange={(event) =>
                setFolderFilter(event.target.value)
              }
            >
              <option value="Semua">Semua</option>

              {CATEGORIES.map((category) => (
                <option
                  key={category.folder}
                  value={category.folder}
                >
                  {category.label}
                </option>
              ))}
            </select>

            <p>{filteredPhotos.length} foto tersedia</p>

            <div className="lum-gallery">
              {filteredPhotos.map((photo) => (
                <article key={photo.url}>
                  <Photo
                    src={photo.url}
                    alt={photo.name}
                  />

                  <small>
                    {photo.folder} / {photo.name}
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
              (product) => Number(product.stock) <= 5
            ).length
          }
        </p>
      </aside>
    </div>
  );
}

/* =========================================================
   APP UTAMA
   ========================================================= */

export default function App() {
  const [products, setProducts] = useState(loadProducts);
  const [orders, setOrders] = useState(() => arr(KEY.orders));
  const [customer, setCustomer] = useState(
    () => read(KEY.session, null)
  );
  const [cart, setCart] = useState(() => arr(KEY.cart));
  const [wishlist, setWishlist] = useState(
    () => arr(KEY.wishlist)
  );
  const [reviews, setReviews] = useState(
    () => read(KEY.reviews, {})
  );

  const [page, setPage] = useState(
    () => window.location.hash === "#admin"
      ? "admin"
      : "home"
  );

  const [returnPage, setReturnPage] = useState("home");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  /* FILTER PRODUK PREMIUM */
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterColor, setFilterColor] = useState("all");
  const [onlyReady, setOnlyReady] = useState(false);

  const [shownCount, setShownCount] = useState(12);
  const [selectedId, setSelectedId] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [checkout, setCheckout] = useState({
    ...EMPTY_CHECKOUT,
  });

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [message, setMessage] = useState("");
  const [lastId, setLastId] = useState("");

  const checkoutLock = useRef(false);
  const statusLock = useRef(new Set());
  const paymentLock = useRef(new Set());

  /* SIMPAN DATA KE BROWSER */

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

    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  /* =======================================================
     TAHAP 5 — FILTER PRODUK PREMIUM AKTIF
     ======================================================= */

  const categoryProducts = useMemo(() => {
    return products.filter(
      (product) =>
        category === "All" ||
        product.collection === category
    );
  }, [products, category]);

  const availableSizes = useMemo(() => {
    const options = categoryProducts.flatMap((product) =>
      Array.isArray(product.sizes) ? product.sizes : []
    );

    return [...new Set(options)].sort((a, b) =>
      String(a).localeCompare(String(b), "id", {
        numeric: true,
      })
    );
  }, [categoryProducts]);

  const availableColors = useMemo(() => {
    const options = categoryProducts.flatMap((product) =>
      Array.isArray(product.colors) ? product.colors : []
    );

    return [...new Set(options)].sort((a, b) =>
      String(a).localeCompare(String(b), "id")
    );
  }, [categoryProducts]);

  useEffect(() => {
    setShownCount(12);
  }, [
    category,
    search,
    sort,
    filterPrice,
    filterSize,
    filterColor,
    onlyReady,
  ]);

  const visible = useMemo(() => {
    return categoryProducts
      .filter((product) => {
        const price = Number(product.price) || 0;

        const matchSearch = text(
          `${product.name} ${product.collection} ${
            product.description || ""
          }`
        ).includes(text(search));

        const matchPrice =
          filterPrice === "all" ||
          (filterPrice === "low" && price < 200000) ||
          (filterPrice === "mid" &&
            price >= 200000 &&
            price <= 300000) ||
          (filterPrice === "high" && price > 300000);

        const matchSize =
          filterSize === "all" ||
          (Array.isArray(product.sizes) &&
            product.sizes.includes(filterSize));

        const matchColor =
          filterColor === "all" ||
          (Array.isArray(product.colors) &&
            product.colors.includes(filterColor));

        const matchStock =
          !onlyReady || Number(product.stock) > 0;

        return (
          matchSearch &&
          matchPrice &&
          matchSize &&
          matchColor &&
          matchStock
        );
      })
      .sort((a, b) => {
        if (sort === "low") {
          return Number(a.price) - Number(b.price);
        }

        if (sort === "high") {
          return Number(b.price) - Number(a.price);
        }

        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
  }, [
    categoryProducts,
    search,
    sort,
    filterPrice,
    filterSize,
    filterColor,
    onlyReady,
  ]);

  function resetShopFilters() {
    setCategory("All");
    setSearch("");
    setSort("default");
    setFilterPrice("all");
    setFilterSize("all");
    setFilterColor("all");
    setOnlyReady(false);
    setShownCount(12);
  }

  /* DATA PRODUK DAN KERANJANG */

  const selected = products.find(
    (product) => product.id === selectedId
  );

  const validCart = cart
    .map((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.id
      );

      if (!product) return null;

      return {
        ...product,
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
          Math.floor(Number(item.quantity) || 1)
        ),
      };
    })
    .filter(Boolean);

  const count = validCart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = validCart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  const shipping =
    checkout.shipping === "express" ? 25000 : 12000;

  const applied = appliedVoucher
    ? voucherValue(appliedVoucher, subtotal)
    : null;

  const discount = applied?.ok ? applied.amount : 0;
  const total = subtotal - discount + shipping;

  const mine = customer
    ? orders.filter(
        (order) =>
          String(order.customerId) ===
          String(customer.id)
      )
    : [];

  const hero =
    PHOTOS.find(
      (photo) => photo.folder === "baju wanita"
    )?.url ||
    PHOTOS[0]?.url ||
    products.find((product) => product.image)?.image;

  const currentOrder =
    orders.find((order) => order.id === lastId) ||
    orders[0];

  /* NAVIGASI */

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
    setFilterSize("all");
    setFilterColor("all");
    go("shop");
  }

  function openProduct(product) {
    setSelectedId(product.id);
    setSize(product.sizes?.[0] || "All Size");
    setColor(product.colors?.[0] || "Sesuai foto");
    go("detail");
  }

  function auth(next = "home") {
    setReturnPage(next);
    go("auth");
  }

  function login(user) {
    setCustomer(user);

    setCheckout((previous) => ({
      ...previous,
      name: previous.name || user.name,
    }));

    go(returnPage);
    setMessage(`Selamat datang, ${user.name}!`);
  }

  function logout() {
    setCustomer(null);
    go("home");
    setMessage("Berhasil logout.");
  }

  function toggleFavorite(id) {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function reviewProduct(id, list) {
    setReviews((previous) => ({
      ...previous,
      [String(id)]: list,
    }));
  }

  /* KERANJANG */

  function addToCart(product, chosenSize, chosenColor) {
    const current = products.find(
      (item) => item.id === product.id
    );

    if (!current) return;

    const used = cart
      .filter((item) => item.id === current.id)
      .reduce(
        (sum, item) => sum + Number(item.quantity),
        0
      );

    if (used >= Number(current.stock)) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    const selectedSize =
      chosenSize || current.sizes?.[0] || "All Size";

    const selectedColor =
      chosenColor || current.colors?.[0] || "Sesuai foto";

    const key = JSON.stringify([
      current.id,
      selectedSize,
      selectedColor,
    ]);

    setCart((previous) => {
      const found = previous.find(
        (item) =>
          (item.key ||
            JSON.stringify([
              item.id,
              item.size,
              item.color,
            ])) === key
      );

      return found
        ? previous.map((item) =>
            (item.key ||
              JSON.stringify([
                item.id,
                item.size,
                item.color,
              ])) === key
              ? {
                  ...item,
                  key,
                  quantity: Number(item.quantity) + 1,
                }
              : item
          )
        : [
            ...previous,
            {
              id: current.id,
              key,
              size: selectedSize,
              color: selectedColor,
              quantity: 1,
            },
          ];
    });

    setMessage("Produk masuk ke keranjang.");
  }

  function changeQty(key, step) {
    const item = validCart.find(
      (product) => product.key === key
    );

    if (!item) return;

    const used = cart
      .filter((product) => product.id === item.id)
      .reduce(
        (sum, product) =>
          sum + Number(product.quantity),
        0
      );

    if (step > 0 && used >= Number(item.stock)) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((previous) =>
      previous
        .map((product) => {
          const currentKey =
            product.key ||
            JSON.stringify([
              product.id,
              product.size,
              product.color,
            ]);

          return currentKey === key
            ? {
                ...product,
                key,
                quantity: Number(product.quantity) + step,
              }
            : product;
        })
        .filter((product) => product.quantity > 0)
    );
  }

  /* VOUCHER */

  function applyVoucher() {
    const result = voucherValue(voucherInput, subtotal);

    setAppliedVoucher(result.ok ? result.code : "");
    setVoucherMessage(result.message);
  }

  function clearVoucher() {
    setVoucherInput("");
    setAppliedVoucher("");
    setVoucherMessage("");
  }

  /* CHECKOUT PESANAN */

  function placeOrder(event) {
    event.preventDefault();

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
      !/^[0-9+()\s-]{8,20}$/.test(checkout.phone.trim())
    ) {
      setMessage(
        "Periksa nama, nomor telepon, dan alamat."
      );
      return;
    }

    const quantityMap = new Map();

    validCart.forEach((item) => {
      quantityMap.set(
        item.id,
        (quantityMap.get(item.id) || 0) +
          item.quantity
      );
    });

    for (const [id, quantity] of quantityMap) {
      const product = products.find(
        (item) => item.id === id
      );

      if (!product || Number(product.stock) < quantity) {
        setMessage("Stok tidak mencukupi.");
        return;
      }
    }

    checkoutLock.current = true;

    const now = new Date().toISOString();
    const id = `LM-${Date.now()}`;

    const method = METHODS.some(
      (item) => item.value === checkout.payment
    )
      ? checkout.payment
      : "cod";

    const promo = appliedVoucher
      ? voucherValue(appliedVoucher, subtotal)
      : null;

    const cut = promo?.ok ? promo.amount : 0;

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
      items: validCart.map((item) => ({ ...item })),
      subtotal,
      voucherCode: promo?.ok ? promo.code : null,
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
            `Checkout ${paymentLabel(method)}; Voucher: ` +
            (promo?.ok ? promo.code : "Tidak ada"),
        },
      ],
    };

    setOrders((previous) => [order, ...previous]);

    setProducts((previous) =>
      previous.map((product) => ({
        ...product,
        stock:
          Number(product.stock) -
          (quantityMap.get(product.id) || 0),
      }))
    );

    setCart([]);
    setCheckout({ ...EMPTY_CHECKOUT });
    clearVoucher();

    setLastId(id);
    go("success");

    setMessage("Pesanan berhasil dibuat.");
  }

  /* ADMIN — KONFIRMASI PEMBAYARAN */

  function confirmPayment(id) {
    const order = orders.find((item) => item.id === id);

    if (!canPay(order) || paymentLock.current.has(id)) {
      return;
    }

    if (
      !window.confirm(
        `Tandai pembayaran pesanan ${id} sebagai LUNAS? (Simulasi)`
      )
    ) {
      return;
    }

    paymentLock.current.add(id);

    const now = new Date().toISOString();

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              paymentStatus: "Lunas",
              paidAt: now,
              paymentConfirmedBy: "Admin Demo",
              paymentHistory: [
                ...(Array.isArray(item.paymentHistory)
                  ? item.paymentHistory
                  : []),
                {
                  id: `${id}-paid-${Date.now()}`,
                  at: now,
                  status: "Lunas",
                  by: "Admin Demo",
                  note: "Pembayaran simulasi dikonfirmasi.",
                },
              ],
            }
          : item
      )
    );

    setMessage("Pembayaran ditandai Lunas.");
  }

  /* ADMIN — STATUS PESANAN */

  function changeStatus(id, next) {
    const order = orders.find((item) => item.id === id);

    if (!order || statusLock.current.has(id)) {
      return;
    }

    const current = orderStatus(order.status);

    if (!canMove(current, next)) {
      setMessage("Status harus berubah berurutan.");
      return;
    }

    if (
      next !== "Dibatalkan" &&
      ["transfer", "qris"].includes(order.paymentMethod) &&
      payStatus(order) !== "Lunas"
    ) {
      setMessage(
        "Konfirmasi pembayaran sebelum memproses pesanan."
      );
      return;
    }

    if (
      next === "Dibatalkan" &&
      !window.confirm(
        `Yakin membatalkan pesanan ${id}? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    statusLock.current.add(id);

    const now = new Date().toISOString();

    if (next === "Dibatalkan" && !order.stockRestored) {
      const quantityMap = new Map();

      (order.items || []).forEach((item) => {
        quantityMap.set(
          item.id,
          (quantityMap.get(item.id) || 0) +
            Number(item.quantity || 0)
        );
      });

      setProducts((previous) =>
        previous.map((product) => ({
          ...product,
          stock:
            Number(product.stock) +
            (quantityMap.get(product.id) || 0),
        }))
      );
    }

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: next,
              updatedAt: now,
              stockRestored:
                !!item.stockRestored ||
                next === "Dibatalkan",
              history: [
                ...(Array.isArray(item.history)
                  ? item.history
                  : []),
                {
                  id: `${id}-${Date.now()}-${next}`,
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
          : item
      )
    );

    setMessage(`Status pesanan: ${next}`);
  }

  /* ADMIN — CRUD PRODUK */

  function saveProduct(event) {
    event.preventDefault();

    const category = CATEGORIES.find(
      (item) => item.name === form.collection
    );

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !form.name.trim() ||
      !category ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setMessage("Periksa nama, harga, dan stok.");
      return;
    }

    if (
      form.image &&
      !PHOTOS.some(
        (photo) =>
          photo.url === form.image &&
          photo.folder === category.folder
      )
    ) {
      setMessage("Foto tidak sesuai kategori.");
      return;
    }

    if (
      form.image &&
      products.some(
        (product) =>
          product.id !== form.id &&
          product.image === form.image
      )
    ) {
      setMessage(
        "Foto utama sudah digunakan produk lain."
      );
      return;
    }

    const sizes = values(form.sizes);
    const colors = values(form.colors);

    if (!sizes.length || !colors.length) {
      setMessage("Ukuran dan warna wajib diisi.");
      return;
    }

    const gallery = [
      ...new Set(
        values(form.gallery).filter(
          (url) =>
            url !== form.image &&
            PHOTOS.some(
              (photo) =>
                photo.url === url &&
                photo.folder === category.folder
            )
        )
      ),
    ];

    const product = {
      id: form.id ?? `custom:${Date.now()}`,
      name: form.name.trim(),
      collection: category.name,
      image: form.image,
      gallery,
      price,
      stock,
      description: form.description.trim(),
      sizes,
      colors,
    };

    setProducts((previous) =>
      form.id === null
        ? [...previous, product]
        : previous.map((item) =>
            item.id === form.id ? product : item
          )
    );

    setForm({ ...EMPTY_PRODUCT });
    setMessage("Produk berhasil disimpan.");
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,
      collection: product.collection,
      image: product.image || "",
      gallery: (product.gallery || []).join(","),
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || "",
      sizes: (product.sizes || []).join(","),
      colors: (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const active = orders.some(
      (order) =>
        !["Selesai", "Dibatalkan"].includes(
          orderStatus(order.status)
        ) &&
        order.items?.some((item) => item.id === id)
    );

    if (active) {
      setMessage("Selesaikan pesanan aktif dahulu.");
      return;
    }

    if (!window.confirm("Hapus produk ini?")) {
      return;
    }

    const product = products.find((item) => item.id === id);

    const deleted = new Set(
      arr(KEY.deleted).map(String)
    );

    deleted.add(String(id));

    if (product?.image) {
      deleted.add(`local:${product.image}`);
    }

    store(KEY.deleted, [...deleted]);

    setProducts((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setCart((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setWishlist((previous) =>
      previous.filter((item) => item !== id)
    );

    setMessage("Produk dihapus.");
  }

  /* =======================================================
     TAMPILAN LUMINA STORE
     ======================================================= */

  return (
    <div
      className={`lumina ${
        page === "admin" ? "admin-mode" : ""
      }`}
    >
      {/* DESAIN FILTER PREMIUM — CSS DALAM APP.JSX */}

      <style>{`
        .lumina .lum-premium-filter-panel {
          margin: 24px 0 28px;
          padding: 26px;
          background: linear-gradient(135deg, #fff, #fbf5ef);
          border: 1px solid #e9dcd1;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(60,42,28,.06);
        }

        .lumina .lum-premium-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 23px;
        }

        .lumina .lum-filter-eyebrow {
          color: #a57d61;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .lumina .lum-premium-filter-header h3 {
          margin: 7px 0;
          color: #30251f;
          font-size: 21px;
        }

        .lumina .lum-premium-filter-header p {
          margin: 0;
          color: #8b7a6e;
          font-size: 12px;
        }

        .lumina .lum-premium-filter-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr)) minmax(150px, .9fr);
          gap: 14px;
          align-items: end;
        }

        .lumina .lum-premium-filter-grid > label {
          display: flex;
          flex-direction: column;
          gap: 9px;
          color: #58483d;
          font-size: 12px;
          font-weight: 700;
        }

        .lumina .lum-premium-filter-grid select {
          width: 100%;
          min-height: 47px;
          padding: 10px 13px;
          background: #fff;
          border: 1px solid #e5d7cc;
          border-radius: 9px;
          color: #30251f;
          cursor: pointer;
        }

        .lumina .lum-premium-filter-grid select:focus {
          outline: none;
          border-color: #a57d61;
          box-shadow: 0 0 0 3px rgba(165,125,97,.12);
        }

        .lumina .lum-premium-filter-grid .lum-filter-stock {
          flex-direction: row;
          align-items: center;
          justify-content: center;
          min-height: 47px;
          padding: 10px;
          background: #f4e8dd;
          border: 1px solid #e6d6c8;
          border-radius: 9px;
          cursor: pointer;
        }

        .lumina .lum-filter-stock input {
          width: 17px;
          height: 17px;
          accent-color: #8e6b55;
          cursor: pointer;
        }

        .lumina .lum-reset-filter {
          padding: 11px 17px;
          background: #fff;
          border: 1px solid #d9c3b1;
          border-radius: 9px;
          color: #845f45;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .lumina .lum-reset-filter:hover {
          background: #30251f;
          border-color: #30251f;
          color: #fff;
        }

        .lumina .lum-filter-result {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #eee3da;
          text-align: right;
          color: #8e6b55;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 950px) {
          .lumina .lum-premium-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .lumina .lum-premium-filter-panel {
            padding: 17px;
            border-radius: 14px;
          }

          .lumina .lum-premium-filter-grid {
            grid-template-columns: 1fr;
          }

          .lumina .lum-reset-filter {
            width: 100%;
          }
        }
      `}</style>

      {/* HEADER */}

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
                onClick={() => choose("Batik Wanita")}
              >
                Batik
              </button>

              <button
                onClick={() => choose("Tas Wanita")}
              >
                Bags
              </button>

              <button onClick={() => go("wishlist")}>
                ♡ Wishlist ({wishlist.length})
              </button>

              <button onClick={() => go("admin")}>
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
                batik, sepatu, tas, dan aksesori pilihan.
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
              {CATEGORIES.map((item) => {
                const cover = products.find(
                  (product) =>
                    product.collection === item.name &&
                    product.image
                );

                return (
                  <button
                    key={item.name}
                    onClick={() => choose(item.name)}
                  >
                    <Photo
                      src={cover?.image}
                      alt={item.label}
                    />
                    <span>{item.label}</span>
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
                .filter((product) => product.image)
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

      {/* SHOP — FILTER PRODUK PREMIUM */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <p className="eyebrow">
              DISCOVER YOUR STYLE
            </p>

            <h1>Shop Our Collection</h1>

            <p>
              Temukan produk terbaik dari LUMINA STORE.
            </p>
          </div>

          <div className="lum-shop-categories">
            {[
              { name: "All", label: "Semua" },
              ...CATEGORIES.map((item) => ({
                name: item.name,
                label: item.label,
              })),
            ].map((item) => (
              <button
                key={item.name}
                className={`lum-shop-pill ${
                  category === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setCategory(item.name);
                  setSearch("");
                  setFilterSize("all");
                  setFilterColor("all");
                }}
              >
                {item.label}
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="lum-shop-sort"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
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

          {/* FILTER PREMIUM BARU */}

          <section
            className="lum-premium-filter-panel"
            aria-label="Filter Produk Premium"
          >
            <div className="lum-premium-filter-header">
              <div>
                <span className="lum-filter-eyebrow">
                  LUMINA SMART FILTER
                </span>

                <h3>Filter Produk Premium</h3>

                <p>
                  Temukan fashion sesuai harga,
                  ukuran, warna, dan stok.
                </p>
              </div>

              <button
                type="button"
                className="lum-reset-filter"
                onClick={resetShopFilters}
              >
                ↻ Reset Filter
              </button>
            </div>

            <div className="lum-premium-filter-grid">
              <label htmlFor="lum-price-filter">
                Rentang Harga

                <select
                  id="lum-price-filter"
                  value={filterPrice}
                  onChange={(event) =>
                    setFilterPrice(event.target.value)
                  }
                >
                  <option value="all">
                    Semua Harga
                  </option>

                  <option value="low">
                    Di bawah Rp200.000
                  </option>

                  <option value="mid">
                    Rp200.000 – Rp300.000
                  </option>

                  <option value="high">
                    Di atas Rp300.000
                  </option>
                </select>
              </label>

              <label htmlFor="lum-size-filter">
                Ukuran

                <select
                  id="lum-size-filter"
                  value={filterSize}
                  onChange={(event) =>
                    setFilterSize(event.target.value)
                  }
                >
                  <option value="all">
                    Semua Ukuran
                  </option>

                  {availableSizes.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="lum-color-filter">
                Warna

                <select
                  id="lum-color-filter"
                  value={filterColor}
                  onChange={(event) =>
                    setFilterColor(event.target.value)
                  }
                >
                  <option value="all">
                    Semua Warna
                  </option>

                  {availableColors.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lum-filter-stock">
                <input
                  type="checkbox"
                  checked={onlyReady}
                  onChange={(event) =>
                    setOnlyReady(event.target.checked)
                  }
                />

                <span>Hanya stok tersedia</span>
              </label>
            </div>

            <div
              className="lum-filter-result"
              role="status"
            >
              ✓ {visible.length} produk sesuai filter
            </div>
          </section>

          <div className="lum-shop-count">
            <span>
              {visible.length} produk ditemukan
            </span>

            <span>
              Menampilkan{" "}
              {Math.min(shownCount, visible.length)}
            </span>
          </div>

          <ProductGrid
            products={visible.slice(0, shownCount)}
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
                  setShownCount((previous) => previous + 12)
                }
              >
                Tampilkan Lebih Banyak (
                {visible.length - shownCount} tersisa) ↓
              </button>
            </div>
          )}
        </main>
      )}

      {/* DETAIL PRODUK */}

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
          favorite={wishlist.includes(selected.id)}
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
              (product) => wishlist.includes(product.id)
            )}
            favorites={wishlist}
            reviews={reviews}
            onDetail={openProduct}
            onFavorite={toggleFavorite}
            onCart={addToCart}
          />
        </main>
      )}

      {/* KERANJANG */}

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

              {validCart.map((item) => (
                <div
                  className="cart-row"
                  key={item.key}
                >
                  <div className="lum-cart-photo">
                    <Photo
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>{prettyName(item.name)}</h3>

                    <p>
                      {item.size} / {item.color}
                    </p>

                    <strong>{rp(item.price)}</strong>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQty(item.key, -1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          changeQty(item.key, 1)
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          setCart((previous) =>
                            previous.filter(
                              (cartItem) =>
                                (cartItem.key ||
                                  JSON.stringify([
                                    cartItem.id,
                                    cartItem.size,
                                    cartItem.color,
                                  ])) !== item.key
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

      {/* LOGIN / REGISTER */}

      {page === "auth" && (
        <AuthPage
          onSuccess={login}
          onBack={() => go("home")}
        />
      )}

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
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Nomor Telepon
                <input
                  required
                  value={checkout.phone}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      phone: event.target.value,
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
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      address: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Pengiriman
                <select
                  value={checkout.shipping}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      shipping: event.target.value,
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
                  LUMINA10: 10% min. Rp100.000 ·
                  FASHION20: 20% min. Rp300.000 ·
                  WELCOME15: Rp15.000 min. Rp150.000.
                </p>

                <div className="lum-voucher-controls">
                  <input
                    value={voucherInput}
                    maxLength={24}
                    placeholder="Kode voucher"
                    onChange={(event) => {
                      setVoucherInput(
                        event.target.value.toUpperCase()
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
                  (applied && !applied.ok)) && (
                  <p
                    className={
                      applied?.ok
                        ? "lum-voucher-success"
                        : "lum-voucher-error"
                    }
                    role="status"
                  >
                    {applied && !applied.ok
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
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      payment: event.target.value,
                    }))
                  }
                >
                  {METHODS.map((method) => (
                    <option
                      key={method.value}
                      value={method.value}
                    >
                      {method.label}
                    </option>
                  ))}
                </select>

                <p className="muted">
                  Tidak ada perpindahan uang sungguhan.
                  Konfirmasi dilakukan di Admin Demo.
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
                  {paymentLabel(checkout.payment)}
                </b>
              </div>

              <hr />

              <div className="lum-between lum-grand-total">
                <b>Total Pembayaran</b>
                <strong>{rp(total)}</strong>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* DASHBOARD PELANGGAN */}

      {page === "account" && customer && (
        <>
          <CustomerTracking orders={mine} />

          <CustomerDashboard
            customer={customer}
            orders={mine}
            onBack={() => choose("All")}
            onLogout={logout}
          />
        </>
      )}

      {/* PESANAN BERHASIL */}

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
                  {paymentLabel(currentOrder.paymentMethod)}
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
                  Total: {rp(currentOrder.total)}
                </h2>
              </>
            )}

            <p>
              Pesanan simulasi dapat dilihat pada
              Dashboard Pelanggan.
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

      {/* DASHBOARD ADMIN */}

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

      {/* NOTIFIKASI */}

      {message && (
        <div className="toast" role="status">
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
