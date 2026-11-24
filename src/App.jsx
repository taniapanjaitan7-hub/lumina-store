import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

/* ==========================================
   LUMINA STORE - APP.JSX
   React E-Commerce
   Customer + Shopping + Admin Dashboard
   PDF Report + Order Status History
========================================== */

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

const KEY = {
  products: "lumina_products_v2",
  oldProducts: "lumina_products_v1",
  orders: "lumina_orders_v1",
  session: "lumina_session_v1",
  cart: "lumina_cart_v1",
  wishlist: "lumina_wishlist_v1",
  deleted: "lumina_deleted_local_v2",
};

const DEFAULT_FORM = {
  id: null,
  name: "",
  collection: "Pria",
  image: "",
  price: "",
  stock: "20",
  description: "",
  sizes: "S,M,L,XL,XXL",
  colors: "Sesuai foto",
};

const DEFAULT_CHECKOUT = {
  name: "",
  phone: "",
  address: "",
  shipping: "regular",
};

/* ==========================================
   HELPER
========================================== */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    return raw === null
      ? fallback
      : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
  }
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formattedDate(value) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitText(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStatus(status) {
  return STATUSES.includes(status)
    ? status
    : "Pesanan Baru";
}

function allowedStatusChange(current, next) {
  if (!STATUSES.includes(next)) return false;

  if (
    current === "Selesai" ||
    current === "Dibatalkan"
  ) {
    return false;
  }

  if (next === "Dibatalkan") {
    return true;
  }

  return (
    STATUSES.indexOf(next) ===
    STATUSES.indexOf(current) + 1
  );
}

function normalizeImagePath(value) {
  if (!value) return "";

  const path = String(value).trim().replace(/\\/g, "/");

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  const aliases = {
    pria: "baju pria",
    wanita: "baju wanita",
    aksesoris: "aksesoris wanita",
  };

  let result = path
    .replace(/^(?:\.\/)?public\//i, "")
    .replace(/^\/+/, "");

  result = result.replace(
    /(^|\/)images\/([^/]+)\//i,
    (full, prefix, folder) => {
      let decoded = folder;

      try {
        decoded = decodeURIComponent(folder);
      } catch {
        // Pertahankan nama asli jika decoding gagal.
      }

      const correctFolder =
        aliases[decoded.toLowerCase()] || decoded;

      return `${prefix}images/${correctFolder}/`;
    }
  );

  return "/" + result;
}
function photoUrl(src) {
  if (!src) return "";

  const raw = String(normalizeImagePath(src))
    .trim()
    .replace(/\\/g, "/");

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const base = import.meta.env.BASE_URL.replace(
    /\/$/,
    ""
  );

  const path = raw
    .replace(/^\/+/, "")
    .replace(/^(?:\.\/)?public\//i, "")
    .split("/")
    .map((part) => {
      try {
        return encodeURIComponent(
          decodeURIComponent(part)
        );
      } catch {
        return encodeURIComponent(part);
      }
    })
    .join("/");

  return `${base}/${path}`;
}

/* ==========================================
   DATA PRODUK
========================================== */

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages) ? productImages : [])
      .filter(
        (photo) =>
          photo?.url &&
          CATEGORIES.some(
            (category) =>
              category.folder ===
              normalize(photo.folder)
                .replace(/^pria$/, "baju pria")
                .replace(/^wanita$/, "baju wanita")
                .replace(/^aksesoris$/, "aksesoris wanita")
          )
      )
      .map((photo) => ({
        ...photo,
        url: normalizeImagePath(photo.url),
      }))
      .map((photo) => [photo.url, photo])
  ).values(),
];

const INITIAL_PRODUCTS = PHOTOS.map((photo) => {
  const category = CATEGORIES.find(
    (item) =>
      item.folder === normalize(photo.folder)
  );

  return {
    id: `local:${photo.url}`,
    name: `${category.label} — ${photo.name}`,
    collection: category.name,
    price: category.price,
    stock: 20,
    image: photo.url,
    sizes: [...category.sizes],
    colors: ["Sesuai foto"],
    description:
      `Koleksi ${category.label} dari LUMINA STORE.`,
  };
});

function loadProducts() {
  const existing =
    localStorage.getItem(KEY.products) !== null
      ? readArray(KEY.products)
      : readArray(KEY.oldProducts);

  const deleted = new Set(
    readArray(KEY.deleted).map(String)
  );

  const saved = existing
    .filter(
      (product) =>
        product &&
        product.id != null &&
        product.name &&
        !deleted.has(String(product.id))
    )
    .map((product) => {
      const category =
        CATEGORIES.find(
          (item) =>
            item.name === product.collection
        ) ||
        CATEGORIES.find(
          (item) =>
            PHOTOS.some(
              (photo) =>
                photo.url === product.image &&
                normalize(photo.folder) === item.folder
            )
        ) ||
        CATEGORIES[0];

      return {
        ...product,
        collection: category.name,
        price: Number(product.price) || 0,
        stock: Math.max(
          0,
          Number(product.stock) || 0
        ),
        sizes: Array.isArray(product.sizes)
          ? product.sizes
          : category.sizes,
        colors: Array.isArray(product.colors)
          ? product.colors
          : ["Sesuai foto"],
      };
    });

  const usedPhotos = new Set(
    saved.map((product) => product.image)
  );

  const additional = INITIAL_PRODUCTS.filter(
    (product) =>
      !usedPhotos.has(product.image) &&
      !deleted.has(String(product.id))
  );

  return [...saved, ...additional];
}

/* ==========================================
   GAMBAR PRODUK
========================================== */

function ProductImage({ src, alt, style }) {
  const [failed, setFailed] = useState("");

  if (!src || failed === src) {
    return (
      <div
        className="lum-photo-placeholder"
        style={style}
      >
        <span>▧</span>
        <small>Foto belum tersedia</small>
      </div>
    );
  }

  return (
    <img
      src={photoUrl(src)}
      alt={alt || "Produk Lumina"}
      loading="lazy"
      style={style}
      onError={() => setFailed(src)}
    />
  );
}

/* ==========================================
   KARTU PRODUK
========================================== */

function ProductCard({
  product,
  wishlist,
  onDetail,
  onWishlist,
  onCart,
}) {
  const available = Number(product.stock) > 0;

  return (
    <article className="product-card">
      <div className="product-picture">
        <button
          type="button"
          className="image-button"
          onClick={() => onDetail(product)}
        >
          <ProductImage
            src={product.image}
            alt={product.name}
          />
        </button>

        <span className="stock-label">
          {available
            ? "LUMINA COLLECTION"
            : "SOLD OUT"}
        </span>

        <button
          type="button"
          className="heart"
          onClick={() => onWishlist(product.id)}
        >
          {wishlist.includes(product.id)
            ? "♥"
            : "♡"}
        </button>
      </div>

      <div className="product-body">
        <small>{product.collection}</small>

        <h3>{product.name}</h3>

        <p className="price">
          {rupiah(product.price)}
        </p>

        <p className="muted">
          Stok tersedia: {product.stock}
        </p>

        <div className="product-actions">
          <button
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Lihat Detail
          </button>

          <button
            className="btn-dark"
            disabled={!available}
            onClick={() => onCart(product)}
          >
            {available ? "+ Keranjang" : "Habis"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  products,
  wishlist,
  onDetail,
  onWishlist,
  onCart,
}) {
  if (!products.length) {
    return (
      <div className="lum-empty">
        <h3>Produk tidak ditemukan</h3>
        <p>Coba pencarian lainnya.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlist={wishlist}
          onDetail={onDetail}
          onWishlist={onWishlist}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

/* ==========================================
   TABEL PESANAN ADMIN
========================================== */

function OrderTable({
  orders,
  editable = false,
  onStatus,
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
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = getStatus(
              order.status
            );

            const isFinal = [
              "Selesai",
              "Dibatalkan",
            ].includes(status);

            return (
              <tr key={order.id}>
                <td>{order.id}</td>

                <td>
                  {formattedDate(order.date)}
                </td>

                <td>
                  {order.customer || "-"}
                </td>

                <td>
                  {(order.items || [])
                    .map(
                      (item) =>
                        `${item.name} (${item.quantity})`
                    )
                    .join(", ") || "-"}
                </td>

                <td>{rupiah(order.total)}</td>

                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={isFinal}
                      onChange={(event) =>
                        onStatus(
                          order.id,
                          event.target.value
                        )
                      }
                    >
                      {STATUSES.map((item) => (
                        <option
                          key={item}
                          value={item}
                          disabled={
                            item !== status &&
                            !allowedStatusChange(
                              status,
                              item
                            )
                          }
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="lum-order-status">
                      {status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {orders.length === 0 && (
            <tr>
              <td colSpan={6}>
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ==========================================
   DASHBOARD ADMIN
========================================== */

function AdminDashboard({
  products,
  orders,
  form,
  setForm,
  onSave,
  onEdit,
  onDelete,
  onStatus,
  onBack,
}) {
  const [tab, setTab] =
    useState("overview");

  const [search, setSearch] =
    useState("");

  const [folder, setFolder] =
    useState("Semua");

  const [previewId, setPreviewId] =
    useState("");

  const finished = orders.filter(
    (order) =>
      getStatus(order.status) === "Selesai"
  );

  const revenue = finished.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) <= 5
  );

  const visibleProducts = products.filter(
    (product) =>
      normalize(
        `${product.name} ${product.collection}`
      ).includes(normalize(search))
  );

  const visibleOrders = orders.filter(
    (order) =>
      normalize(
        `${order.id} ${order.customer} ${order.status}`
      ).includes(normalize(search))
  );

  const previewOrder =
    visibleOrders.find(
      (order) =>
        String(order.id) === previewId
    ) ||
    visibleOrders[0] ||
    null;

  const visiblePhotos = PHOTOS.filter(
    (photo) =>
      (folder === "Semua" ||
        normalize(photo.folder) === folder) &&
      normalize(
        `${photo.name} ${photo.folder}`
      ).includes(normalize(search))
  );

  const statusStats = STATUSES.map(
    (status) => ({
      status,
      count: orders.filter(
        (order) =>
          getStatus(order.status) === status
      ).length,
    })
  );

  const maxStatus = Math.max(
    1,
    ...statusStats.map((item) => item.count)
  );

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* ==========================================
     EXPORT CSV
  ========================================== */

  function exportCSV() {
    const rows = [
      [
        "ID",
        "Tanggal",
        "Pelanggan",
        "Total",
        "Status",
      ],

      ...visibleOrders.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.total,
        getStatus(order.status),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let result = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(result)) {
              result = "'" + result;
            }

            return `"${result.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "laporan-lumina.csv";
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div className="lum-dash">
      {/* SIDEBAR */}

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
              className={
                tab === value ? "active" : ""
              }
              onClick={() => {
                setTab(value);
                setSearch("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="lum-dash-sidebar-bottom">
          <button
            className="lum-dash-back"
            onClick={onBack}
          >
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      {/* ADMIN MAIN CONTENT */}

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <p className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </p>

            <h1>
              {tab === "overview" &&
                "Dashboard Overview"}
              {tab === "products" &&
                "Product Management"}
              {tab === "orders" &&
                "Order Management"}
              {tab === "reports" &&
                "Sales Report"}
              {tab === "gallery" &&
                "Photo Gallery"}
            </h1>
          </div>

          <input
            placeholder="Cari produk atau pesanan..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </header>

        {/* =====================================
            OVERVIEW ADMIN
        ===================================== */}

        {tab === "overview" && (
          <>
            <div className="lum-dash-stats">
              {[
                [
                  "Pendapatan Selesai",
                  rupiah(revenue),
                ],
                ["Total Pesanan", orders.length],
                ["Total Produk", products.length],
                ["Total Stok", totalStock],
              ].map(([label, value]) => (
                <div
                  className="lum-dash-metric"
                  key={label}
                >
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <section className="lum-dash-card">
              <h2>Revenue Analytics</h2>

              <div className="lum-revenue-total">
                {rupiah(revenue)}
              </div>

              <p>
                Pendapatan dihitung dari
                pesanan berstatus Selesai.
              </p>
            </section>

            <section className="lum-dash-card">
              <h2>Order Analytics</h2>

              <div className="lum-analytics-list">
                {statusStats.map((item) => (
                  <div
                    className="lum-analytics-row"
                    key={item.status}
                  >
                    <span>{item.status}</span>

                    <div className="lum-analytics-track">
                      <div
                        className="lum-analytics-fill"
                        style={{
                          width: `${
                            (item.count / maxStatus) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <strong>
                      {item.count}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            {/* INVENTORY MONITORING */}

            <section className="lum-dash-card lum-stock-monitor">
              <div className="lum-stock-heading">
                <div>
                  <h2>
                    Inventory Monitoring
                  </h2>

                  <p>
                    Pantau ketersediaan stok
                    produk Lumina Store.
                  </p>
                </div>

                <span className="lum-stock-count">
                  {lowStock.length} Produk Perlu Perhatian
                </span>
              </div>

              {lowStock.length === 0 ? (
                <div className="lum-stock-empty">
                  ✓ Semua produk memiliki stok aman.
                </div>
              ) : (
                <div className="lum-stock-list">
                  {[...lowStock]
                    .sort(
                      (a, b) =>
                        Number(a.stock) -
                        Number(b.stock)
                    )
                    .map((product) => (
                      <div
                        className="lum-stock-row"
                        key={product.id}
                      >
                        <div className="lum-stock-info">
                          <strong>
                            {product.name}
                          </strong>

                          <small>
                            {product.collection}
                          </small>
                        </div>

                        <span
                          className={
                            Number(product.stock) === 0
                              ? "lum-stock-badge out"
                              : "lum-stock-badge low"
                          }
                        >
                          {Number(product.stock) === 0
                            ? "Stok Habis"
                            : `Sisa ${product.stock}`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* COLLECTION OVERVIEW */}

            <section className="lum-dash-card">
              <h2>
                Collection Overview
              </h2>

              <div className="lum-category-stats">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="btn-light"
                    onClick={() => {
                      setFolder(category.folder);
                      setSearch("");
                      setTab("gallery");
                    }}
                  >
                    <strong>
                      {
                        products.filter(
                          (product) =>
                            product.collection ===
                            category.name
                        ).length
                      }
                    </strong>

                    <span>
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* RECENT ORDERS */}

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>

              <OrderTable
                orders={orders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {/* =====================================
            PRODUCT MANAGEMENT
        ===================================== */}

        {tab === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-dash-product-form"
              onSubmit={onSave}
            >
              <h2>
                {form.id === null
                  ? "Tambah Produk"
                  : "Edit Produk"}
              </h2>

              <label>
                Nama Produk
              </label>

              <input
                required
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
              />

              <label>Kategori</label>

              <select
                value={form.collection}
                onChange={(event) => {
                  const selected = CATEGORIES.find(
                    (item) =>
                      item.name ===
                      event.target.value
                  );

                  if (!selected) return;

                  setForm((prev) => ({
                    ...prev,
                    collection: selected.name,
                    image: "",
                    sizes: selected.sizes.join(","),
                  }));
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

              <label>Harga</label>

              <input
                type="number"
                min="1"
                required
                value={form.price}
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value
                  )
                }
              />

              <label>Stok</label>

              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={(event) =>
                  updateField(
                    "stock",
                    event.target.value
                  )
                }
              />

              <label>
                Gambar Produk
              </label>

              <select
                value={form.image}
                onChange={(event) =>
                  updateField(
                    "image",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Pilih gambar
                </option>

                {PHOTOS.filter(
                  (photo) =>
                    normalize(photo.folder) ===
                    CATEGORIES.find(
                      (item) =>
                        item.name === form.collection
                    )?.folder
                ).map((photo) => (
                  <option
                    key={photo.url}
                    value={photo.url}
                  >
                    {photo.name}
                  </option>
                ))}
              </select>

              <div className="lum-admin-preview">
                <ProductImage
                  src={form.image}
                  alt="Preview Produk"
                />
              </div>

              <label>
                Deskripsi Produk
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
              />

              <label>Ukuran</label>

              <input
                value={form.sizes}
                onChange={(event) =>
                  updateField(
                    "sizes",
                    event.target.value
                  )
                }
              />

              <label>Warna</label>

              <input
                value={form.colors}
                onChange={(event) =>
                  updateField(
                    "colors",
                    event.target.value
                  )
                }
              />

              <button
                type="submit"
                className="btn-dark"
              >
                Simpan Produk
              </button>

              {form.id !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={() =>
                    setForm({ ...DEFAULT_FORM })
                  }
                >
                  Batal Edit
                </button>
              )}
            </form>

            {/* DAFTAR PRODUK */}

            <section className="lum-dash-card">
              <h2>
                Daftar Produk ({products.length})
              </h2>

              {visibleProducts.map((product) => (
                <div
                  className="lum-dash-product-row"
                  key={product.id}
                >
                  <div className="lum-admin-thumb">
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="lum-admin-product-info">
                    <strong>
                      {product.name}
                    </strong>

                    <p>
                      {rupiah(product.price)}
                    </p>

                    <small>
                      Stok: {product.stock}
                    </small>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() =>
                      onEdit(product)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      onDelete(product.id)
                    }
                  >
                    Hapus
                  </button>
                </div>
              ))}

              {!visibleProducts.length && (
                <p>
                  Produk tidak ditemukan.
                </p>
              )}
            </section>
          </div>
        )}

        {/* =====================================
            ORDER MANAGEMENT
        ===================================== */}

        {tab === "orders" && (
          <section className="lum-dash-card">
            <h2>Manajemen Pesanan</h2>

            <p className="muted">
              Kelola status pesanan secara
              berurutan. Setiap perubahan
              disimpan dalam riwayat.
            </p>

            {previewOrder ? (
              <>
                <div
                  style={{
                    marginTop: 24,
                  }}
                >
                  <label
                    htmlFor="lum-preview"
                    style={{
                      display: "block",
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Pilih Pesanan
                  </label>

                  <select
                    id="lum-preview"
                    value={String(previewOrder.id)}
                    onChange={(event) =>
                      setPreviewId(
                        event.target.value
                      )
                    }
                    style={{
                      padding: 12,
                      width: "100%",
                      maxWidth: 460,
                      borderRadius: 9,
                      border: "1px solid #ded4cb",
                      background: "#fff",
                      color: "#302720",
                    }}
                  >
                    {visibleOrders.map((order) => (
                      <option
                        key={order.id}
                        value={String(order.id)}
                      >
                        {order.id} — {order.customer}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ALUR STATUS */}

                <OrderStatusFlow
                  status={getStatus(
                    previewOrder.status
                  )}
                />

                {/* RIWAYAT STATUS */}

                <OrderHistory
                  order={previewOrder}
                />

                {/* INFORMASI PESANAN */}

                <div
                  className="panel"
                  style={{
                    marginBottom: 20,
                  }}
                >
                  <strong>
                    Informasi Pesanan
                  </strong>

                  <p>
                    Pelanggan: {previewOrder.customer}
                  </p>

                  <p>
                    Total: {rupiah(previewOrder.total)}
                  </p>

                  <p>
                    Status:{" "}
                    {getStatus(previewOrder.status)}
                  </p>
                </div>
              </>
            ) : (
              <p>
                Belum ada pesanan.
              </p>
            )}

            <h3>
              Daftar Pesanan
            </h3>

            <OrderTable
              orders={visibleOrders}
              editable
              onStatus={onStatus}
            />
          </section>
        )}

        {/* =====================================
            SALES REPORT
        ===================================== */}

        {tab === "reports" && (
          <section className="lum-dash-card">
            <h2>
              Laporan Transaksi Penjualan
            </h2>

            <p className="muted">
              Unduh laporan transaksi dalam
              format PDF atau CSV.
              Riwayat status yang tercatat
              juga disertakan dalam PDF.
            </p>

            <div className="lum-dash-stats">
              <div className="lum-dash-metric">
                <strong>
                  {orders.length}
                </strong>

                <span>
                  Total Pesanan
                </span>
              </div>

              <div className="lum-dash-metric">
                <strong>
                  {finished.length}
                </strong>

                <span>
                  Pesanan Selesai
                </span>
              </div>

              <div className="lum-dash-metric">
                <strong>
                  {rupiah(revenue)}
                </strong>

                <span>
                  Pendapatan Selesai
                </span>
              </div>
            </div>

            <h3>
              Daftar Transaksi ({visibleOrders.length})
            </h3>

            <OrderTable
              orders={visibleOrders}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 25,
              }}
            >
              <button
                type="button"
                className="btn-dark"
                disabled={!visibleOrders.length}
                onClick={() =>
                  downloadTransactionsPDF(
                    visibleOrders
                  )
                }
              >
                Download Laporan PDF
              </button>

              <button
                type="button"
                className="btn-light"
                disabled={!visibleOrders.length}
                onClick={exportCSV}
              >
                Download Laporan CSV
              </button>
            </div>
          </section>
        )}

        {/* =====================================
            PHOTO GALLERY
        ===================================== */}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>
              Galeri Foto Lokal
            </h2>

            <select
              value={folder}
              onChange={(event) =>
                setFolder(event.target.value)
              }
            >
              <option value="Semua">
                Semua
              </option>

              {CATEGORIES.map((category) => (
                <option
                  key={category.folder}
                  value={category.folder}
                >
                  {category.label}
                </option>
              ))}
            </select>

            <p>
              {visiblePhotos.length} foto tersedia
            </p>

            <div className="lum-gallery">
              {visiblePhotos.map((photo) => (
                <article key={photo.url}>
                  <ProductImage
                    src={photo.url}
                    alt={photo.name}
                  />

                  <p>
                    {photo.folder} / {photo.name}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* SIDEBAR KANAN ADMIN */}

      <aside className="lum-dash-right">
        <section>
          <h3>Store Summary</h3>

          <p>
            Total Produk: {products.length}
          </p>

          <p>
            Foto Lokal: {PHOTOS.length}
          </p>

          <p>
            Total Pesanan: {orders.length}
          </p>

          <p>
            Stok Menipis: {lowStock.length}
          </p>
        </section>
      </aside>
    </div>
  );
}

/* ==========================================
   MAIN APP
========================================== */

export default function App() {
  const [products, setProducts] =
    useState(loadProducts);

  const [orders, setOrders] =
    useState(() => readArray(KEY.orders));

  const [customer, setCustomer] =
    useState(() => read(KEY.session, null));

  const [cart, setCart] =
    useState(() => readArray(KEY.cart));

  const [wishlist, setWishlist] =
    useState(() => readArray(KEY.wishlist));

  const [page, setPage] = useState(
    () =>
      window.location.hash === "#admin"
        ? "admin"
        : "home"
  );

  const [authReturn, setAuthReturn] =
    useState("home");

  const [category, setCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("default");

  const [selectedId, setSelectedId] =
    useState(null);

  const [selectedSize, setSelectedSize] =
    useState("");

  const [selectedColor, setSelectedColor] =
    useState("");

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
  });

  const [checkout, setCheckout] = useState({
    ...DEFAULT_CHECKOUT,
  });

  const [message, setMessage] =
    useState("");

  const checkoutLock = useRef(false);
  const statusLocks = useRef(new Set());

  /* ==========================================
     LOCAL STORAGE
  ========================================== */

  useEffect(() => {
    save(KEY.products, products);
  }, [products]);

  useEffect(() => {
    save(KEY.orders, orders);
    statusLocks.current.clear();
  }, [orders]);

  useEffect(() => {
    save(KEY.cart, cart);
  }, [cart]);

  useEffect(() => {
    save(KEY.wishlist, wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (customer) {
      save(KEY.session, customer);
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

  /* ==========================================
     FILTER PRODUK
  ========================================== */

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        (category === "All" ||
          product.collection === category) &&
        normalize(
          `${product.name} ${product.collection} ${product.description}`
        ).includes(normalize(search))
    );

    return [...filtered].sort((a, b) => {
      if (sort === "low") {
        return Number(a.price) -
          Number(b.price);
      }

      if (sort === "high") {
        return Number(b.price) -
          Number(a.price);
      }

      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    });
  }, [products, category, search, sort]);

  const featured = products.filter(
    (product) => product.image
  );

  const heroPhoto =
    PHOTOS.find(
      (photo) =>
        normalize(photo.folder) === "baju wanita"
    )?.url || PHOTOS[0]?.url;

  const selected = products.find(
    (product) =>
      product.id === selectedId
  );

  /* ==========================================
     KERANJANG
  ========================================== */

  const validCart = cart
    .map((item) => {
      const product = products.find(
        (entry) =>
          entry.id === item.id
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
          Math.floor(
            Number(item.quantity) || 1
          )
        ),
      };
    })
    .filter(Boolean);

  const cartCount = validCart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const subtotal = validCart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        Number(item.quantity),
    0
  );

  const shippingFee =
    checkout.shipping === "express"
      ? 25000
      : 12000;

  const myOrders = customer
    ? orders.filter(
        (order) =>
          order.customerId === customer.id
      )
    : [];

  /* ==========================================
     NAVIGASI
  ========================================== */

  function navigate(nextPage) {
    if (
      ["home", "shop", "cart"].includes(nextPage)
    ) {
      checkoutLock.current = false;
    }

    setPage(nextPage);

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        (nextPage === "admin"
          ? "#admin"
          : "")
    );

    window.scrollTo(0, 0);
  }

  function selectCategory(value) {
    setCategory(value);
    setSearch("");
    navigate("shop");
  }

  function showProduct(product) {
    setSelectedId(product.id);

    setSelectedSize(
      product.sizes?.[0] || "All Size"
    );

    setSelectedColor(
      product.colors?.[0] || "Sesuai foto"
    );

    navigate("detail");
  }

  /* ==========================================
     LOGIN / REGISTER
  ========================================== */

  function openAuth(returnPage = "home") {
    setAuthReturn(returnPage);
    navigate("auth");
  }

  function loginSuccess(user) {
    setCustomer(user);

    setCheckout((prev) => ({
      ...prev,
      name: prev.name || user.name,
    }));

    navigate(authReturn);

    setMessage(
      `Selamat datang, ${user.name}!`
    );
  }

  function logout() {
    setCustomer(null);
    navigate("home");
    setMessage("Berhasil logout.");
  }

  /* ==========================================
     WISHLIST
  ========================================== */

  function toggleWishlist(id) {
    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  }

  /* ==========================================
     TAMBAH KE KERANJANG
  ========================================== */

  function addToCart(product, size, color) {
    const currentProduct = products.find(
      (item) =>
        item.id === product.id
    );

    if (!currentProduct) {
      setMessage("Produk tidak ditemukan.");
      return;
    }

    const chosenSize =
      size ||
      currentProduct.sizes?.[0] ||
      "All Size";

    const chosenColor =
      color ||
      currentProduct.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      currentProduct.id,
      chosenSize,
      chosenColor,
    ]);

    const used = cart
      .filter(
        (item) =>
          item.id === currentProduct.id
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.quantity),
        0
      );

    if (
      used >= Number(currentProduct.stock)
    ) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.key === key
      );

      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? {
                ...item,
                quantity:
                  Number(item.quantity) + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: currentProduct.id,
          key,
          size: chosenSize,
          color: chosenColor,
          quantity: 1,
        },
      ];
    });

    setMessage(
      "Produk ditambahkan ke keranjang."
    );
  }

  /* ==========================================
     UBAH JUMLAH KERANJANG
  ========================================== */

  function changeQuantity(key, amount) {
    const item = cart.find(
      (entry) =>
        entry.key === key
    );

    if (!item) return;

    const product = products.find(
      (entry) =>
        entry.id === item.id
    );

    const used = cart
      .filter(
        (entry) =>
          entry.id === item.id
      )
      .reduce(
        (sum, entry) =>
          sum + Number(entry.quantity),
        0
      );

    if (
      amount > 0 &&
      (!product ||
        used >= Number(product.stock))
    ) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((prev) =>
      prev
        .map((entry) =>
          entry.key === key
            ? {
                ...entry,
                quantity:
                  Number(entry.quantity) +
                  amount,
              }
            : entry
        )
        .filter(
          (entry) =>
            entry.quantity > 0
        )
    );
  }

  /* ==========================================
     CHECKOUT
  ========================================== */

  function checkoutOrder(event) {
    event.preventDefault();

    if (checkoutLock.current) {
      return;
    }

    if (!customer) {
      openAuth("checkout");
      return;
    }

    if (!validCart.length) {
      setMessage(
        "Keranjang masih kosong."
      );
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

    // Hitung jumlah produk
    const quantities = new Map();

    validCart.forEach((item) => {
      quantities.set(
        item.id,
        (quantities.get(item.id) || 0) +
          Number(item.quantity)
      );
    });

    // Validasi stok
    for (const [id, qty] of quantities) {
      const product = products.find(
        (item) =>
          item.id === id
      );

      if (
        !product ||
        Number(product.stock) < qty
      ) {
        setMessage(
          "Stok produk tidak mencukupi."
        );
        return;
      }
    }

    checkoutLock.current = true;

    const now = new Date().toISOString();
    const orderId = `LM-${Date.now()}`;

    // Data pesanan
    const order = {
      id: orderId,
      date: now,

      customer: checkout.name.trim(),
      customerId: customer.id,
      customerEmail: customer.email,

      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      shipping: checkout.shipping,

      items: validCart.map((item) => ({
        ...item,
      })),

      total: subtotal + shippingFee,

      status: "Pesanan Baru",
      stockRestored: false,

      // Catatan status pertama
      history: [
        {
          id: `${orderId}-created`,
          from: null,
          status: "Pesanan Baru",
          at: now,
          by: "Sistem",
          note:
            "Pesanan dibuat melalui checkout.",
        },
      ],
    };

    // Simpan transaksi
    setOrders((prev) => [
      order,
      ...prev,
    ]);

    // Kurangi stok
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,

        stock:
          Number(product.stock) -
          (quantities.get(product.id) || 0),
      }))
    );

    // Kosongkan keranjang
    setCart([]);

    // Reset form checkout
    setCheckout({
      ...DEFAULT_CHECKOUT,
    });

    navigate("success");

    setMessage(
      "Pesanan berhasil dibuat."
    );
  }

  /* ==========================================
     UPDATE STATUS + RIWAYAT
  ========================================== */

  function updateStatus(id, nextStatus) {
    const order = orders.find(
      (item) =>
        item.id === id
    );

    if (!order) {
      setMessage("Pesanan tidak ditemukan.");
      return;
    }

    if (
      statusLocks.current.has(id)
    ) {
      return;
    }

    const currentStatus = getStatus(
      order.status
    );

    if (
      !allowedStatusChange(
        currentStatus,
        nextStatus
      )
    ) {
      setMessage(
        "Status harus diubah berurutan. " +
        "Pesanan final tidak bisa diubah."
      );
      return;
    }

    statusLocks.current.add(id);

    const now = new Date().toISOString();

    // Data riwayat baru
    const historyEvent = {
      id: `${id}-${Date.now()}-${nextStatus}`,

      from: currentStatus,
      status: nextStatus,
      at: now,
      by: "Admin Demo",

      note:
        nextStatus === "Dibatalkan"
          ? "Pesanan dibatalkan melalui Admin Demo."
          : `Status diubah menjadi ${nextStatus}.`,
    };

    // Kembalikan stok jika dibatalkan
    if (
      nextStatus === "Dibatalkan" &&
      !order.stockRestored
    ) {
      const quantities = new Map();

      (order.items || []).forEach(
        (item) => {
          const qty = Math.max(
            0,
            Number(item.quantity) || 0
          );

          quantities.set(
            item.id,
            (quantities.get(item.id) || 0) +
              qty
          );
        }
      );

      setProducts((prev) =>
        prev.map((product) => ({
          ...product,

          stock:
            Number(product.stock) +
            (quantities.get(product.id) || 0),
        }))
      );
    }

    // Simpan status dan riwayat
    setOrders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              updatedAt: now,

              stockRestored:
                Boolean(item.stockRestored) ||
                nextStatus === "Dibatalkan",

              history: [
                ...(Array.isArray(item.history)
                  ? item.history
                  : []),

                historyEvent,
              ],
            }
          : item
      )
    );

    setMessage(
      `Status pesanan menjadi ${nextStatus}.`
    );
  }

  /* ==========================================
     CRUD PRODUK ADMIN
  ========================================== */

  function saveProduct(event) {
    event.preventDefault();

    const selectedCategory =
      CATEGORIES.find(
        (item) =>
          item.name === form.collection
      );

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !form.name.trim() ||
      !selectedCategory ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setMessage(
        "Periksa data produk."
      );
      return;
    }

    if (
      form.image &&
      !PHOTOS.some(
        (photo) =>
          photo.url === form.image &&
          normalize(photo.folder) ===
            selectedCategory.folder
      )
    ) {
      setMessage(
        "Foto tidak sesuai kategori."
      );
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.id !== form.id &&
        Boolean(form.image) &&
        product.image === form.image
    );

    if (duplicate) {
      setMessage(
        "Foto sudah digunakan produk lain."
      );
      return;
    }

    const sizes = splitText(
      form.sizes
    );

    const colors = splitText(
      form.colors
    );

    if (
      !sizes.length ||
      !colors.length
    ) {
      setMessage(
        "Ukuran dan warna wajib diisi."
      );
      return;
    }

    const product = {
      id:
        form.id ??
        `custom:${Date.now()}`,

      name: form.name.trim(),

      collection: selectedCategory.name,

      image: form.image,

      price,
      stock,

      description:
        form.description.trim(),

      sizes,
      colors,
    };

    if (form.id !== null) {
      const previous = products.find(
        (item) =>
          item.id === form.id
      );

      if (
        previous?.image &&
        previous.image !== product.image
      ) {
        const deleted = new Set(
          readArray(KEY.deleted).map(String)
        );

        deleted.add(
          `local:${previous.image}`
        );

        save(
          KEY.deleted,
          [...deleted]
        );
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.id === form.id
            ? product
            : item
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        product,
      ]);
    }

    setForm({
      ...DEFAULT_FORM,
    });

    setMessage(
      "Produk berhasil disimpan."
    );
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,

      collection:
        product.collection,

      image:
        product.image || "",

      price:
        String(product.price),

      stock:
        String(product.stock),

      description:
        product.description || "",

      sizes:
        (product.sizes || []).join(","),

      colors:
        (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const active = orders.some(
      (order) =>
        !["Selesai", "Dibatalkan"].includes(
          getStatus(order.status)
        ) &&
        order.items?.some(
          (item) =>
            item.id === id
        )
    );

    if (active) {
      setMessage(
        "Selesaikan pesanan aktif terlebih dahulu."
      );
      return;
    }

    if (
      !window.confirm(
        "Yakin ingin menghapus produk ini?"
      )
    ) {
      return;
    }

    const product = products.find(
      (item) =>
        item.id === id
    );

    const deleted = new Set(
      readArray(KEY.deleted).map(String)
    );

    deleted.add(String(id));

    if (product?.image) {
      deleted.add(
        `local:${product.image}`
      );
    }

    save(
      KEY.deleted,
      [...deleted]
    );

    setProducts((prev) =>
      prev.filter(
        (item) =>
          item.id !== id
      )
    );

    setCart((prev) =>
      prev.filter(
        (item) =>
          item.id !== id
      )
    );

    setWishlist((prev) =>
      prev.filter(
        (item) =>
          item !== id
      )
    );

    setForm({
      ...DEFAULT_FORM,
    });

    setMessage(
      "Produk berhasil dihapus."
    );
  }

  const gridProps = {
    wishlist,
    onDetail: showProduct,
    onWishlist: toggleWishlist,
    onCart: addToCart,
  };

  /* ==========================================
     TAMPILAN APLIKASI
  ========================================== */

  return (
    <div
      className={`lumina ${
        page === "admin" ? "admin-mode" : ""
      }`}
    >
      {/* CSS TAMBAHAN */}

      <style>{`
        .lumina .lum-new-shop {
          max-width: 1250px;
          margin: auto;
          padding: 52px 24px 90px;
          min-height: 75vh;
        }

        .lumina .lum-shop-heading {
          text-align: center;
          margin-bottom: 30px;
        }

        .lumina .lum-shop-heading small {
          font-size: 11px;
          letter-spacing: 2px;
          color: #a28b78;
        }

        .lumina .lum-shop-heading h1 {
          font-family: Georgia, serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 400;
          margin: 10px 0;
        }

        .lumina .lum-shop-heading p {
          color: #82766c;
          font-size: 13px;
        }

        .lumina .lum-shop-categories {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 26px;
        }

        .lumina .lum-shop-pill {
          background: white;
          border: 1px solid #e0d7ce;
          border-radius: 30px;
          padding: 10px 18px;
          cursor: pointer;
        }

        .lumina .lum-shop-pill.active {
          background: #302720;
          color: white;
        }

        .lumina .lum-shop-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 13px;
          margin-bottom: 22px;
        }

        .lumina .lum-shop-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e1d8d0;
          border-radius: 30px;
          padding: 0 18px;
          height: 50px;
        }

        .lumina .lum-shop-search input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
        }

        .lumina .lum-shop-search button {
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .lumina .lum-shop-sort {
          background: white;
          border: 1px solid #e1d8d0;
          border-radius: 30px;
          padding: 0 15px;
          height: 50px;
        }

        .lumina .lum-shop-count {
          display: flex;
          justify-content: space-between;
          color: #82766c;
          margin-bottom: 17px;
          font-size: 12px;
        }

        .lumina .lum-shop-grid .product-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .lumina .lum-shop-grid .product-card {
          border: 1px solid #ece4dc;
          border-radius: 16px;
          background: white;
          overflow: hidden;
        }

        .lumina .lum-shop-grid .product-picture {
          aspect-ratio: 4 / 5;
          position: relative;
          overflow: hidden;
          background: #f3eeea;
        }

        .lumina .lum-shop-grid .image-button {
          width: 100%;
          height: 100%;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }

        .lumina .lum-shop-grid .product-picture img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-shop-grid .product-body {
          padding: 20px;
        }

        .lumina .lum-shop-grid .product-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .lumina .lum-shop-grid .product-actions button {
          flex: 1;
          padding: 12px 8px;
          border-radius: 9px;
          font-size: 12px;
        }

        .lumina .lum-photo-placeholder {
          width: 100%;
          height: 100%;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          background: #efe8e1;
          color: #92745f;
        }

        .lumina .lum-empty {
          text-align: center;
          padding: 45px 20px;
        }

        .lumina .lum-admin-thumb {
          width: 60px;
          height: 75px;
          flex: 0 0 60px;
        }

        .lumina .lum-admin-thumb img,
        .lumina .lum-admin-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-admin-preview {
          height: 190px;
        }

        .lumina .lum-admin-product-info {
          flex: 1;
          min-width: 0;
        }

        .lumina .lum-gallery {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(145px, 1fr));
          gap: 15px;
        }

        .lumina .lum-gallery img {
          width: 100%;
          height: 190px;
          object-fit: contain;
        }

        .lumina .lum-gallery p {
          font-size: 11px;
          padding: 10px;
        }

        .lumina .lum-category-stats {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }

        .lumina .lum-category-stats button {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lumina .lum-revenue-total {
          font-size: 30px;
          font-weight: 700;
          padding: 20px 0;
        }

        .lumina .lum-analytics-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 0;
        }

        .lumina .lum-analytics-row {
          display: grid;
          grid-template-columns: 110px 1fr 35px;
          gap: 12px;
          align-items: center;
          font-size: 13px;
        }

        .lumina .lum-analytics-track {
          height: 11px;
          background: #eae2db;
          border-radius: 20px;
          overflow: hidden;
        }

        .lumina .lum-analytics-fill {
          height: 100%;
          background: #8f7059;
        }

        .lumina .lum-order-status {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 20px;
          background: #efe7df;
          font-size: 12px;
        }

        .lumina .lum-stock-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px;
          border-bottom: 1px solid #eee6df;
        }

        .lumina .lum-stock-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .lumina .lum-stock-badge {
          border-radius: 20px;
          padding: 8px 12px;
          white-space: nowrap;
          font-size: 11px;
        }

        .lumina .lum-stock-badge.low {
          background: #fff1d6;
          color: #a66b10;
        }

        .lumina .lum-stock-badge.out {
          background: #ffe4e4;
          color: #be3030;
        }

        @media (max-width: 700px) {
          .lumina .lum-new-shop {
            padding: 28px 14px 60px;
          }

          .lumina .lum-shop-categories {
            justify-content: flex-start;
            flex-wrap: nowrap;
            overflow-x: auto;
          }

          .lumina .lum-shop-toolbar {
            grid-template-columns: 1fr;
          }

          .lumina .lum-shop-grid .product-grid {
            gap: 11px;
          }

          .lumina .lum-shop-grid .product-body {
            padding: 12px;
          }

          .lumina .lum-shop-grid .product-actions {
            flex-direction: column;
          }

          .lumina .lum-analytics-row {
            grid-template-columns: 90px 1fr 25px;
          }
        }
      `}</style>

      {/* =====================================
          NAVBAR
      ===================================== */}

      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — PREMIUM FASHION & LIFESTYLE
          </div>

          <header className="navbar">
            <button
              className="logo"
              onClick={() => navigate("home")}
            >
              LUMINA<span>.</span>
            </button>

            <nav className="nav-menu">
              <button
                onClick={() =>
                  navigate("home")
                }
              >
                Home
              </button>

              <button
                onClick={() =>
                  selectCategory("All")
                }
              >
                Shop
              </button>

              <button
                onClick={() =>
                  selectCategory("Pria")
                }
              >
                Men
              </button>

              <button
                onClick={() =>
                  selectCategory("Wanita")
                }
              >
                Women
              </button>

              <button
                onClick={() =>
                  selectCategory("Batik Wanita")
                }
              >
                Batik
              </button>

              <button
                onClick={() =>
                  selectCategory("Tas Wanita")
                }
              >
                Bags
              </button>

              <button
                onClick={() =>
                  navigate("wishlist")
                }
              >
                ♡ Wishlist ({wishlist.length})
              </button>

              <button
                onClick={() =>
                  navigate("admin")
                }
              >
                Admin Demo
              </button>

              {customer ? (
                <>
                  <button
                    onClick={() =>
                      navigate("account")
                    }
                  >
                    Halo, {customer.name}
                  </button>

                  <button
                    onClick={logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    openAuth("home")
                  }
                >
                  Login / Register
                </button>
              )}
            </nav>

            <button
              className="cart-link"
              onClick={() =>
                navigate("cart")
              }
            >
              🛍 Cart ({cartCount})
            </button>
          </header>
        </>
      )}

      {/* =====================================
          HOMEPAGE
      ===================================== */}

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
                Temukan pakaian pria, wanita,
                batik, sepatu, tas, dan aksesori
                untuk gaya terbaikmu.
              </p>

              <button
                className="btn-dark"
                onClick={() =>
                  selectCategory("All")
                }
              >
                Explore Collection →
              </button>

              <p className="hero-bottom">
                MODERN • ELEGANT • TIMELESS
              </p>
            </div>

            <div className="hero-photo">
              <ProductImage
                src={heroPhoto}
                alt="LUMINA Fashion"
              />
            </div>
          </section>

          {/* KEUNGGULAN */}

          <section className="perks">
            <div>
              ✧ <strong>Premium Fashion</strong>
              <span>Modern & Elegant</span>
            </div>

            <div>
              ♡{" "}
              <strong>
                {PHOTOS.length} Foto Koleksi
              </strong>
              <span>Katalog Foto Lokal</span>
            </div>

            <div>
              ✦ <strong>Seven Collections</strong>
              <span>Fashion For Everyone</span>
            </div>
          </section>

          {/* KATEGORI */}

          <section className="container section">
            <p className="eyebrow center">
              SHOP BY CATEGORY
            </p>

            <h2 className="section-title">
              Explore Our Collections
            </h2>

            <div className="lum-home-categories">
              {CATEGORIES.map((category) => {
                const cover = products.find(
                  (product) =>
                    product.collection ===
                      category.name &&
                    product.image
                );

                return (
                  <button
                    key={category.name}
                    onClick={() =>
                      selectCategory(category.name)
                    }
                    style={{
                      position: "relative",
                      height: 280,
                      border: 0,
                      padding: 0,
                      borderRadius: 15,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "#e9ded3",
                    }}
                  >
                    <ProductImage
                      src={cover?.image}
                      alt={category.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: 20,
                        textAlign: "left",
                        background:
                          "linear-gradient(transparent,rgba(30,22,17,.85))",
                        color: "white",
                      }}
                    >
                      <small>
                        LUMINA COLLECTION
                      </small>

                      <strong>
                        {category.label}
                      </strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* FEATURED COLLECTION */}

          <section className="container section">
            <p className="eyebrow center">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Featured Collection
            </h2>

            <ProductGrid
              products={featured}
              {...gridProps}
            />

            <div className="center action-space">
              <button
                className="btn-dark"
                onClick={() =>
                  selectCategory("All")
                }
              >
                View All Products →
              </button>
            </div>
          </section>
        </>
      )}

      {/* =====================================
          SHOP / KATALOG
      ===================================== */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <small>
              DISCOVER YOUR STYLE
            </small>

            <h1>
              Shop Our Collection
            </h1>

            <p>
              Temukan gaya terbaik dari
              koleksi LUMINA.
            </p>
          </div>

          <div className="lum-shop-categories">
            {[
              {
                name: "All",
                label: "Semua",
              },
              ...CATEGORIES.map((category) => ({
                name: category.name,
                label: category.label,
              })),
            ].map((item) => (
              <button
                key={item.name}
                className={
                  category === item.name
                    ? "lum-shop-pill active"
                    : "lum-shop-pill"
                }
                onClick={() => {
                  setCategory(item.name);
                  setSearch("");
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
                placeholder="Cari produk favoritmu..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
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

          <div className="lum-shop-count">
            <span>
              {visibleProducts.length} produk ditemukan
            </span>

            <span>
              ▦ Grid View
            </span>
          </div>

          <div className="lum-shop-grid">
            <ProductGrid
              products={visibleProducts}
              {...gridProps}
            />
          </div>
        </main>
      )}

      {/* =====================================
          DETAIL PRODUK
      ===================================== */}

      {page === "detail" && selected && (
        <main className="container section">
          <button
            className="back"
            onClick={() =>
              navigate("shop")
            }
          >
            ← Kembali ke Shop
          </button>

          <div className="detail-layout">
            <div className="lum-detail-photo">
              <ProductImage
                src={selected.image}
                alt={selected.name}
              />
            </div>

            <div className="detail-copy">
              <p className="eyebrow">
                {selected.collection}
              </p>

              <h1>
                {selected.name}
              </h1>

              <h2 className="price">
                {rupiah(selected.price)}
              </h2>

              <p>
                {selected.description}
              </p>

              <p>
                Stok: {selected.stock}
              </p>

              <label>
                Pilih Ukuran
              </label>

              <div className="option-row">
                {(selected.sizes || []).map(
                  (size) => (
                    <button
                      key={size}
                      className={
                        selectedSize === size
                          ? "chosen"
                          : ""
                      }
                      onClick={() =>
                        setSelectedSize(size)
                      }
                    >
                      {size}
                    </button>
                  )
                )}
              </div>

              <label>
                Pilih Warna
              </label>

              <div className="option-row">
                {(selected.colors || []).map(
                  (color) => (
                    <button
                      key={color}
                      className={
                        selectedColor === color
                          ? "chosen"
                          : ""
                      }
                      onClick={() =>
                        setSelectedColor(color)
                      }
                    >
                      {color}
                    </button>
                  )
                )}
              </div>

              <button
                className="btn-dark wide"
                disabled={
                  Number(selected.stock) <= 0
                }
                onClick={() =>
                  addToCart(
                    selected,
                    selectedSize,
                    selectedColor
                  )
                }
              >
                + Tambahkan ke Keranjang
              </button>

              <button
                className="btn-light wide"
                onClick={() =>
                  toggleWishlist(selected.id)
                }
              >
                {wishlist.includes(selected.id)
                  ? "♥ Hapus Wishlist"
                  : "♡ Tambahkan Wishlist"}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =====================================
          WISHLIST
      ===================================== */}

      {page === "wishlist" && (
        <main className="container section">
          <h1 className="section-title">
            My Wishlist ♡
          </h1>

          <ProductGrid
            products={products.filter(
              (product) =>
                wishlist.includes(product.id)
            )}
            {...gridProps}
          />
        </main>
      )}

      {/* =====================================
          CART / KERANJANG
      ===================================== */}

      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {!validCart.length && (
                <p>
                  Keranjang masih kosong.
                </p>
              )}

              {validCart.map((item) => (
                <div
                  className="cart-row"
                  key={item.key}
                >
                  <div className="lum-cart-photo">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      {item.size} / {item.color}
                    </p>

                    <strong>
                      {rupiah(item.price)}
                    </strong>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQuantity(
                            item.key,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          changeQuantity(
                            item.key,
                            1
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter(
                              (entry) =>
                                entry.key !== item.key
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
              <h2>
                Ringkasan Belanja
              </h2>

              <div className="between">
                <span>Total Item</span>

                <strong>
                  {cartCount}
                </strong>
              </div>

              <div className="between">
                <span>Subtotal</span>

                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <button
                className="btn-dark wide"
                disabled={!validCart.length}
                onClick={() =>
                  customer
                    ? navigate("checkout")
                    : openAuth("checkout")
                }
              >
                Checkout →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =====================================
          LOGIN / REGISTER
      ===================================== */}

      {page === "auth" && (
        <AuthPage
          onSuccess={loginSuccess}
          onBack={() =>
            navigate("home")
          }
        />
      )}

      {/* =====================================
          CHECKOUT
      ===================================== */}

      {page === "checkout" && customer && (
        <main className="container section">
          <h1 className="section-title">
            Checkout
          </h1>

          <div className="two-column">
            <form
              className="panel form-stack"
              onSubmit={checkoutOrder}
            >
              <h2>
                Informasi Pembeli
              </h2>

              <label>
                Nama Lengkap
              </label>

              <input
                required
                value={checkout.name}
                onChange={(event) =>
                  setCheckout({
                    ...checkout,
                    name: event.target.value,
                  })
                }
              />

              <label>
                Nomor Telepon
              </label>

              <input
                required
                value={checkout.phone}
                onChange={(event) =>
                  setCheckout({
                    ...checkout,
                    phone: event.target.value,
                  })
                }
              />

              <label>
                Alamat Pengiriman
              </label>

              <textarea
                required
                rows={4}
                value={checkout.address}
                onChange={(event) =>
                  setCheckout({
                    ...checkout,
                    address: event.target.value,
                  })
                }
              />

              <label>
                Metode Pengiriman
              </label>

              <select
                value={checkout.shipping}
                onChange={(event) =>
                  setCheckout({
                    ...checkout,
                    shipping: event.target.value,
                  })
                }
              >
                <option value="regular">
                  Regular Rp12.000
                </option>

                <option value="express">
                  Express Rp25.000
                </option>
              </select>

              <p className="muted">
                Checkout simulasi,
                tanpa pembayaran nyata.
              </p>

              <button
                type="submit"
                className="btn-dark wide"
                disabled={!validCart.length}
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <div className="panel summary">
              <h2>
                Ringkasan Pesanan
              </h2>

              <div className="between">
                <span>Subtotal</span>

                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <div className="between">
                <span>Ongkir</span>

                <strong>
                  {rupiah(shippingFee)}
                </strong>
              </div>

              <div className="between grand-total">
                <span>Total</span>

                <strong>
                  {rupiah(
                    subtotal + shippingFee
                  )}
                </strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>
            Silakan Login Terlebih Dahulu
          </h2>

          <button
            className="btn-dark"
            onClick={() =>
              openAuth("checkout")
            }
          >
            Login
          </button>
        </main>
      )}

      {/* =====================================
          DASHBOARD PELANGGAN
      ===================================== */}

      {page === "account" && customer && (
        <CustomerDashboard
          customer={customer}
          orders={myOrders}
          onBack={() =>
            selectCategory("All")
          }
          onLogout={logout}
        />
      )}

      {/* =====================================
          PESANAN BERHASIL
      ===================================== */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h1>
              Pesanan Berhasil!
            </h1>

            <p>
              Pesanan simulasi berhasil dibuat.
              Pantau status dan riwayat pesanan
              di Dashboard Pelanggan.
            </p>

            <button
              className="btn-dark"
              onClick={() =>
                navigate("account")
              }
            >
              Lihat Pesanan Saya →
            </button>

            <button
              className="btn-light"
              onClick={() =>
                selectCategory("All")
              }
            >
              Lanjut Belanja
            </button>
          </div>
        </main>
      )}

      {/* =====================================
          DASHBOARD ADMIN
      ===================================== */}

      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          form={form}
          setForm={setForm}
          onSave={saveProduct}
          onEdit={editProduct}
          onDelete={deleteProduct}
          onStatus={updateStatus}
          onBack={() =>
            navigate("home")
          }
        />
      )}

      {/* =====================================
          FOOTER
      ===================================== */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>
              LUMINA.
            </h2>

            <p>
              Premium Fashion & Lifestyle
            </p>
          </div>

          <div>
            <p>
              Men • Women • Batik • Shoes • Bags
            </p>

            <p>
              React E-Commerce Portfolio
            </p>
          </div>

          <p>
            © {new Date().getFullYear()} LUMINA STORE
          </p>
        </footer>
      )}

      {/* =====================================
          NOTIFIKASI
      ===================================== */}

      {message && (
        <div
          className="toast"
          role="status"
        >
          <span>
            {message}
          </span>

          <button
            onClick={() =>
              setMessage("")
            }
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
