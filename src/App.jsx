
import { useEffect, useMemo, useState } from "react";
import AuthPage from "./Auth.jsx";
import productImages from "./product-images.json";
import "./App.css";

/* ============================================
   LUMINA STORE
   HOME • SHOP • LOGIN • REGISTER
   WISHLIST • CART • CHECKOUT • ACCOUNT • ADMIN
============================================ */

const CATEGORIES = [
  { folder: "pria", name: "Pria", label: "Baju Pria", price: 179000, sizes: ["S", "M", "L", "XL", "XXL"], category: "Fashion" },
  { folder: "wanita", name: "Wanita", label: "Baju Wanita", price: 199000, sizes: ["S", "M", "L", "XL", "XXL"], category: "Fashion" },
  { folder: "batik wanita", name: "Batik Wanita", label: "Batik Wanita", price: 235000, sizes: ["S", "M", "L", "XL", "XXL"], category: "Fashion" },
  { folder: "sepatu pria", name: "Sepatu Pria", label: "Sepatu Pria", price: 295000, sizes: ["39", "40", "41", "42", "43", "44"], category: "Shoes" },
  { folder: "sepatu wanita", name: "Sepatu Wanita", label: "Sepatu Wanita", price: 245000, sizes: ["35", "36", "37", "38", "39", "40"], category: "Shoes" },
  { folder: "tas wanita", name: "Tas Wanita", label: "Tas Wanita", price: 249000, sizes: ["All Size"], category: "Accessories" },
  { folder: "aksesoris", name: "Accessories", label: "Aksesori", price: 129000, sizes: ["All Size"], category: "Accessories" },
];

const STATUSES = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const PRODUCT_KEY = "lumina_products_v2";
const ORDER_KEY = "lumina_orders_v1";
const SESSION_KEY = "lumina_session_v1";
const CART_KEY = "lumina_cart_v1";
const WISHLIST_KEY = "lumina_wishlist_v1";
const DELETED_KEY = "lumina_deleted_local_v2";

const EMPTY_FORM = {
  id: null,
  name: "",
  collection: "Pria",
  price: "",
  stock: "20",
  image: "",
  description: "",
  sizes: "S,M,L,XL,XXL",
  colors: "Sesuai foto",
};

const EMPTY_CHECKOUT = {
  name: "",
  phone: "",
  address: "",
  shipping: "regular",
};

/* ============================================
   HELPER
============================================ */

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readList(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
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

function getCategory(collection) {
  return CATEGORIES.find(
    (item) => item.name === collection
  );
}

function splitValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusOf(value) {
  return STATUSES.includes(value)
    ? value
    : "Pesanan Baru";
}

function getImageUrl(value) {
  if (!value) return "";

  if (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const path = String(value).replace(/\\/g, "/");

  return (
    base +
    (path.startsWith("/") ? "" : "/") +
    path
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
      .join("/")
  );
}

/* ============================================
   FOTO DARI TUJUH FOLDER
============================================ */

const PHOTO_LIST = (
  Array.isArray(productImages) ? productImages : []
)
  .filter((photo) => {
    if (!photo?.url || !photo?.folder) return false;

    return CATEGORIES.some(
      (category) =>
        category.folder === normalize(photo.folder)
    );
  })
  .map((photo) => ({
    ...photo,
    url: String(photo.url).replace(/\\/g, "/"),
  }))
  .sort((a, b) =>
    a.url.localeCompare(b.url, "id", {
      numeric: true,
    })
  );

const UNIQUE_PHOTOS = [
  ...new Map(
    PHOTO_LIST.map((photo) => [
      photo.url,
      photo,
    ])
  ).values(),
];

const INITIAL_PRODUCTS = UNIQUE_PHOTOS.map((photo) => {
  const category = CATEGORIES.find(
    (item) =>
      item.folder === normalize(photo.folder)
  );

  return {
    id: `local:${photo.url}`,
    name: `${category.label} — ${photo.name}`,
    collection: category.name,
    category: category.category,
    image: photo.url,
    price: category.price,
    stock: 20,
    sizes: [...category.sizes],
    colors: ["Sesuai foto"],
    description:
      `Koleksi ${category.label} LUMINA STORE. ` +
      "Harga dan stok awal merupakan data demo.",
  };
});

function loadProducts() {
  const savedV2 = readList(PRODUCT_KEY);
  const savedV1 = readList("lumina_products_v1");

  // Prioritaskan katalog baru. Katalog lama hanya
  // digunakan untuk mengambil perubahan produk
  // yang memiliki foto lokal yang valid.
  const saved = localStorage.getItem(PRODUCT_KEY)
    ? savedV2
    : savedV1;

  const deleted = new Set(
    readList(DELETED_KEY).map(String)
  );

  const photoPaths = new Set(
    UNIQUE_PHOTOS.map((photo) => photo.url)
  );

  const preserved = saved
    .filter(
      (product) =>
        product &&
        photoPaths.has(product.image) &&
        !deleted.has(String(product.id))
    )
    .map((product) => {
      const photo = UNIQUE_PHOTOS.find(
        (item) => item.url === product.image
      );

      const category = CATEGORIES.find(
        (item) =>
          item.folder === normalize(photo.folder)
      );

      return {
        ...product,
        collection: category.name,
        category: category.category,
        sizes:
          Array.isArray(product.sizes) &&
          product.sizes.length
            ? product.sizes
            : [...category.sizes],
        colors:
          Array.isArray(product.colors) &&
          product.colors.length
            ? product.colors
            : ["Sesuai foto"],
      };
    });

  const usedPhotos = new Set(
    preserved.map((product) => product.image)
  );

  return [
    ...preserved,
    ...INITIAL_PRODUCTS.filter(
      (product) =>
        !usedPhotos.has(product.image) &&
        !deleted.has(String(product.id))
    ),
  ];
}

/* ============================================
   GAMBAR PRODUK
============================================ */

function ProductImage({
  src,
  alt,
  style = {},
}) {
  const [failed, setFailed] = useState("");

  if (!src || failed === src) {
    return (
      <div
        className="lum-photo-missing"
        style={{
          width: "100%",
          height: "100%",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "#efe8e1",
          color: "#92745f",
          textAlign: "center",
          fontSize: 12,
          ...style,
        }}
      >
        <span style={{ fontSize: 25 }}>▧</span>
        Foto belum tersedia
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
        ...style,
      }}
    />
  );
}

/* ============================================
   KARTU PRODUK
============================================ */

function ProductCard({
  product,
  isFavorite,
  onDetail,
  onFavorite,
  onCart,
}) {
  return (
    <article className="product-card">
      <div className="product-picture">
        <button
          type="button"
          className="image-button"
          onClick={() => onDetail(product)}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            padding: 0,
            border: 0,
            background: "#f4f0ec",
          }}
        >
          <ProductImage
            src={product.image}
            alt={product.name}
          />
        </button>

        <button
          className="heart"
          aria-label="Wishlist"
          onClick={() => onFavorite(product.id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>

        <span className="stock-label">
          {product.stock > 0
            ? "LUMINA COLLECTION"
            : "SOLD OUT"}
        </span>
      </div>

      <div className="product-body">
        <small>{product.collection}</small>
        <h3>{product.name}</h3>

        <p className="price">
          {rupiah(product.price)}
        </p>

        <p className="muted">
          Stok {product.stock}
        </p>

        <div className="product-actions">
          <button
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Detail
          </button>

          <button
            className="btn-dark"
            disabled={product.stock <= 0}
            onClick={() => onCart(product)}
          >
            + Keranjang
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
  onFavorite,
  onCart,
}) {
  if (!products.length) {
    return (
      <div className="empty">
        Belum ada produk pada kategori ini.
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={wishlist.includes(product.id)}
          onDetail={onDetail}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

/* ============================================
   TABEL PESANAN
============================================ */

function OrderTable({
  orders,
  editable = false,
  onStatus,
}) {
  return (
    <div
      className="lum-dash-table-wrap"
      style={{ overflowX: "auto" }}
    >
      <table className="lum-dash-table">
        <thead>
          <tr>
            <th>ID Pesanan</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = statusOf(order.status);

            return (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>

                <td>
                  {order.items?.[0]?.name || "Produk"}
                </td>

                <td>{rupiah(order.total)}</td>

                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={
                        status === "Selesai" ||
                        status === "Dibatalkan"
                      }
                      onChange={(e) =>
                        onStatus(
                          order.id,
                          e.target.value
                        )
                      }
                    >
                      {STATUSES.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="lum-dash-status">
                      {status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {!orders.length && (
            <tr>
              <td colSpan={5}>
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================
   DASHBOARD ADMIN
============================================ */

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
  onCancel,
}) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("Semua");
  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const finished = orders.filter(
    (o) => statusOf(o.status) === "Selesai"
  );

  const revenue = finished.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );

  const lowStock = products.filter(
    (p) => Number(p.stock) <= 5
  );

  const months = Array.from(
    { length: 12 },
    (_, month) => ({
      label: new Date(
        year,
        month,
        1
      ).toLocaleString("id-ID", {
        month: "short",
      }),

      total: finished
        .filter((o) => {
          const date = new Date(o.date);

          return (
            date.getFullYear() === year &&
            date.getMonth() === month
          );
        })
        .reduce(
          (sum, o) =>
            sum + Number(o.total || 0),
          0
        ),
    })
  );

  const maximum = Math.max(
    1,
    ...months.map((m) => m.total)
  );

  const visibleProducts = products.filter(
    (p) =>
      normalize(
        `${p.name} ${p.collection}`
      ).includes(normalize(search))
  );

  const visibleOrders = [...orders]
    .filter((o) =>
      normalize(
        `${o.id} ${o.customer}`
      ).includes(normalize(search))
    )
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

  const visiblePhotos = UNIQUE_PHOTOS.filter(
    (photo) =>
      (
        folder === "Semua" ||
        normalize(photo.folder) === folder
      ) &&
      normalize(
        `${photo.folder} ${photo.name}`
      ).includes(normalize(search))
  );

  function field(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const titles = {
    overview: "Dashboard Overview",
    products: "Product Management",
    orders: "Order Management",
    reports: "Sales Report",
    gallery: "Photo Gallery",
  };

  return (
    <div className="lum-dash">
      <aside className="lum-dash-sidebar">
        <div className="lum-dash-logo">
          LUMINA<span>.</span>
        </div>

        <p style={{ color: "#dbc6b4" }}>
          MANAGEMENT SYSTEM
        </p>

        <div className="lum-dash-menu-label">
          WORKSPACE
        </div>

        <nav className="lum-dash-menu">
          {[
            ["overview", "▦", "Overview"],
            ["products", "◈", "Products"],
            ["orders", "▣", "Orders"],
            ["reports", "▤", "Sales Report"],
            ["gallery", "▧", "Photo Gallery"],
          ].map(([key, symbol, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setSearch("");
              }}
            >
              <span>{symbol}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="lum-dash-sidebar-bottom">
          <strong>LUMINA STORE</strong>
          <p>Fashion Management Demo</p>

          <button
            className="lum-dash-back"
            onClick={onBack}
          >
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <span className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </span>

            <h1>{titles[tab]}</h1>
          </div>

          <div className="lum-dash-search">
            <input
              placeholder="Cari produk atau pesanan..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </header>

        {(tab === "overview" ||
          tab === "reports") && (
          <div className="lum-dash-stats">
            {[
              ["Pendapatan Selesai", rupiah(revenue)],
              ["Total Pesanan", orders.length],
              ["Total Produk", products.length],
              ["Total Stok", totalStock],
            ].map(([label, value], index) => (
              <div
                className="lum-dash-metric"
                key={label}
                style={{
                  background:
                    index === 0
                      ? "#49392d"
                      : "white",
                  color:
                    index === 0
                      ? "white"
                      : "#302720",
                  borderRadius: 14,
                }}
              >
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "overview" && (
          <>
            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <h2>Revenue Analytics</h2>

                <select
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                >
                  {[
                    ...new Set([
                      new Date().getFullYear(),
                      ...orders
                        .map((o) =>
                          new Date(o.date).getFullYear()
                        )
                        .filter(Number.isFinite),
                    ]),
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lum-dash-chart-total">
                {rupiah(
                  months.reduce(
                    (sum, m) => sum + m.total,
                    0
                  )
                )}
              </div>

              <div className="lum-dash-chart">
                {months.map((month, index) => (
                  <div
                    className="lum-dash-bar-col"
                    key={index}
                  >
                    <span>
                      {month.total
                        ? Math.round(
                            month.total / 1000
                          ) + "rb"
                        : ""}
                    </span>

                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        style={{
                          height:
                            `${
                              (month.total / maximum) *
                              100
                            }%`,
                        }}
                      />
                    </div>

                    <small>{month.label}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(125px,1fr))",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="btn-light"
                    style={{ padding: 20 }}
                    onClick={() => {
                      setFolder(category.folder);
                      setTab("gallery");
                    }}
                  >
                    <strong>
                      {
                        products.filter(
                          (p) =>
                            p.collection === category.name
                        ).length
                      }
                    </strong>

                    <p>{category.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>

              <OrderTable
                orders={visibleOrders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {tab === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-dash-product-form"
              onSubmit={onSave}
            >
              <h2>
                {form.id !== null
                  ? "Edit Produk"
                  : "Tambah Produk"}
              </h2>

              <label>Nama Produk</label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  field("name", e.target.value)
                }
              />

              <label>Kategori Produk</label>
              <select
                value={form.collection}
                onChange={(e) => {
                  const category = getCategory(
                    e.target.value
                  );

                  setForm((prev) => ({
                    ...prev,
                    collection: category.name,
                    image: "",
                    sizes: category.sizes.join(","),
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

              <label>Harga (Rp)</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  field("price", e.target.value)
                }
              />

              <label>Stok</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  field("stock", e.target.value)
                }
              />

              <label>Pilih Foto</label>
              <select
                value={form.image}
                onChange={(e) =>
                  field("image", e.target.value)
                }
              >
                <option value="">
                  Pilih gambar dari folder
                </option>

                {UNIQUE_PHOTOS.filter(
                  (photo) =>
                    normalize(photo.folder) ===
                    getCategory(form.collection)?.folder
                ).map((photo) => (
                  <option
                    key={photo.url}
                    value={photo.url}
                  >
                    {photo.name}
                  </option>
                ))}
              </select>

              <div style={{ height: 200 }}>
                <ProductImage
                  src={form.image}
                  alt="Preview"
                />
              </div>

              <label>Deskripsi</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  field("description", e.target.value)
                }
              />

              <label>Ukuran</label>
              <input
                required
                value={form.sizes}
                onChange={(e) =>
                  field("sizes", e.target.value)
                }
              />

              <label>Warna</label>
              <input
                required
                value={form.colors}
                onChange={(e) =>
                  field("colors", e.target.value)
                }
              />

              <button
                className="btn-dark"
                type="submit"
              >
                {form.id !== null
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
              </button>

              {form.id !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={onCancel}
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>
                Daftar Produk ({products.length})
              </h2>

              {visibleProducts.map((p) => (
                <div
                  key={p.id}
                  className="lum-dash-product-row"
                >
                  <div
                    style={{
                      width: 55,
                      minWidth: 55,
                      height: 65,
                    }}
                  >
                    <ProductImage
                      src={p.image}
                      alt={p.name}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{p.name}</strong>
                    <p>{rupiah(p.price)}</p>
                    <small>Stok {p.stock}</small>
                  </div>

                  <button
                    className="btn-light"
                    type="button"
                    onClick={() => onEdit(p)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => onDelete(p.id)}
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
            <h2>Manajemen Pesanan</h2>

            <OrderTable
              orders={visibleOrders}
              editable
              onStatus={onStatus}
            />
          </section>
        )}

        {tab === "reports" && (
          <section className="lum-dash-card">
            <h2>Laporan Penjualan</h2>

            <p>
              Pendapatan dihitung dari pesanan
              berstatus Selesai.
            </p>

            <OrderTable
              orders={visibleOrders}
            />

            <button
              className="btn-dark"
              style={{ marginTop: 20 }}
              onClick={() => {
                const headers = [
                  "ID",
                  "Tanggal",
                  "Pelanggan",
                  "Total",
                  "Status",
                ];

                const rows = orders.map((o) => [
                  o.id,
                  o.date,
                  o.customer,
                  o.total,
                  statusOf(o.status),
                ]);

                const csv = [
                  headers,
                  ...rows,
                ]
                  .map((row) =>
                    row
                      .map((value) =>
                        `"${String(value ?? "").replaceAll('"', '""')}"`
                      )
                      .join(",")
                  )
                  .join("\r\n");

                const blob = new Blob(
                  ["\uFEFF" + csv],
                  {
                    type:
                      "text/csv;charset=utf-8",
                  }
                );

                const url = URL.createObjectURL(blob);
                const link =
                  document.createElement("a");

                link.href = url;
                link.download =
                  "laporan-lumina.csv";
                link.click();

                URL.revokeObjectURL(url);
              }}
            >
              Unduh Laporan CSV
            </button>
          </section>
        )}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <h2>Galeri Foto Lokal</h2>

              <select
                value={folder}
                onChange={(e) =>
                  setFolder(e.target.value)
                }
              >
                <option value="Semua">
                  Semua Foto
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
            </div>

            <p>
              {visiblePhotos.length} foto tersedia.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(140px,1fr))",
                gap: 15,
              }}
            >
              {visiblePhotos.map((photo) => (
                <article
                  key={photo.url}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ aspectRatio: "3/4" }}>
                    <ProductImage
                      src={photo.url}
                      alt={photo.name}
                    />
                  </div>

                  <p style={{ padding: 10 }}>
                    {photo.folder} / {photo.name}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="lum-dash-right">
        <section>
          <h3>Store Summary</h3>

          {[
            ["Kategori", CATEGORIES.length],
            ["Foto Lokal", UNIQUE_PHOTOS.length],
            ["Total Produk", products.length],
            ["Pesanan", orders.length],
            ["Stok Menipis", lowStock.length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="lum-dash-stock"
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section>
          <h3>Stock Alert</h3>

          {lowStock.length === 0 && (
            <p>Stok masih mencukupi.</p>
          )}

          {lowStock.slice(0, 8).map((p) => (
            <div
              className="lum-dash-stock"
              key={p.id}
            >
              <span>{p.name}</span>
              <strong>{p.stock}</strong>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}

/* ============================================
   MAIN APP
============================================ */

export default function App() {
  const [products, setProducts] =
    useState(loadProducts);

  const [orders, setOrders] = useState(
    () => readList(ORDER_KEY)
  );

  const [customer, setCustomer] = useState(
    () => read(SESSION_KEY, null)
  );

  const [wishlist, setWishlist] = useState(
    () => readList(WISHLIST_KEY)
  );

  const [cart, setCart] = useState(
    () => readList(CART_KEY)
  );

  const [page, setPage] = useState(
    () =>
      location.hash === "#admin"
        ? "admin"
        : "home"
  );

  const [authReturn, setAuthReturn] =
    useState("home");

  const [category, setCategory] =
    useState("All");

  const [query, setQuery] =
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
    ...EMPTY_FORM,
  });

  const [checkout, setCheckout] = useState({
    ...EMPTY_CHECKOUT,
  });

  const [message, setMessage] =
    useState("");

  /* ----------------------------------------
     SIMPAN DATA DEMO
  ----------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      PRODUCT_KEY,
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      ORDER_KEY,
      JSON.stringify(orders)
    );
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(customer)
      );
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [customer]);

  useEffect(() => {
    if (!message) return;

    const id = setTimeout(
      () => setMessage(""),
      3500
    );

    return () => clearTimeout(id);
  }, [message]);

  /* ----------------------------------------
     DATA TAMPILAN
  ----------------------------------------- */

  const visibleProducts = useMemo(() => {
    return products
      .filter(
        (p) =>
          (
            category === "All" ||
            p.collection === category
          ) &&
          normalize(
            `${p.name} ${p.collection} ${p.description}`
          ).includes(normalize(query))
      )
      .sort((a, b) => {
        if (sort === "low") {
          return a.price - b.price;
        }

        if (sort === "high") {
          return b.price - a.price;
        }

        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
  }, [products, category, query, sort]);

  const selected = products.find(
    (p) => p.id === selectedId
  );

  const featured = CATEGORIES.flatMap(
    (category) =>
      products
        .filter(
          (p) =>
            p.collection === category.name &&
            p.image
        )
        .slice(0, 2)
  );

  const heroPhoto =
    UNIQUE_PHOTOS.find(
      (p) => normalize(p.folder) === "wanita"
    )?.url ||
    UNIQUE_PHOTOS[0]?.url;

  const validCart = cart.filter(
    (item) =>
      products.some((p) => p.id === item.id)
  );

  const subtotal = validCart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
      Number(item.quantity),
    0
  );

  const cartCount = validCart.reduce(
    (sum, item) =>
      sum + Number(item.quantity),
    0
  );

  const shippingFee =
    checkout.shipping === "express"
      ? 25000
      : 12000;

  const myOrders = customer
    ? orders.filter(
        (o) => o.customerId === customer.id
      )
    : [];

  /* ----------------------------------------
     NAVIGASI DAN AUTENTIKASI
  ----------------------------------------- */

  function navigate(nextPage) {
    setPage(nextPage);

    history.replaceState(
      null,
      "",
      location.pathname +
        location.search +
        (
          nextPage === "admin"
            ? "#admin"
            : ""
        )
    );

    window.scrollTo(0, 0);
  }

  function selectCategory(value) {
    setCategory(value);
    setQuery("");
    navigate("shop");
  }

  function openAuth(returnPage = "home") {
    setAuthReturn(returnPage);
    navigate("auth");
  }

  function onAuthSuccess(user) {
    setCustomer(user);

    setCheckout((prev) => ({
      ...prev,
      name: prev.name || user.name,
    }));

    setMessage(
      `Selamat datang, ${user.name}!`
    );

    navigate(authReturn);
  }

  function logout() {
    setCustomer(null);
    navigate("home");
    setMessage("Berhasil logout.");
  }

  /* ----------------------------------------
     PRODUK
  ----------------------------------------- */

  function showDetail(product) {
    setSelectedId(product.id);
    setSelectedSize(
      product.sizes?.[0] || "All Size"
    );
    setSelectedColor(
      product.colors?.[0] || "Sesuai foto"
    );
    navigate("detail");
  }

  function toggleWishlist(id) {
    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id]
    );
  }

  /* ----------------------------------------
     KERANJANG
  ----------------------------------------- */

  function addToCart(
    product,
    size,
    color
  ) {
    const chosenSize =
      size || product.sizes?.[0] || "All Size";

    const chosenColor =
      color ||
      product.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      product.id,
      chosenSize,
      chosenColor,
    ]);

    const used = validCart
      .filter((p) => p.id === product.id)
      .reduce(
        (sum, p) =>
          sum + Number(p.quantity),
        0
      );

    if (used >= product.stock) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (p) =>
          p.id === product.id &&
          p.size === chosenSize &&
          p.color === chosenColor
      );

      if (existing) {
        return prev.map((p) =>
          p.key === existing.key
            ? {
                ...p,
                quantity:
                  Number(p.quantity) + 1,
              }
            : p
        );
      }

      return [
        ...prev,
        {
          ...product,
          key,
          size: chosenSize,
          color: chosenColor,
          quantity: 1,
        },
      ];
    });

    setMessage("Produk masuk keranjang.");
  }

  function changeQuantity(key, delta) {
    const item = validCart.find(
      (p) => p.key === key
    );

    if (!item) return;

    const product = products.find(
      (p) => p.id === item.id
    );

    const used = validCart
      .filter((p) => p.id === item.id)
      .reduce(
        (sum, p) =>
          sum + Number(p.quantity),
        0
      );

    if (
      delta > 0 &&
      (!product || used >= product.stock)
    ) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((prev) =>
      prev
        .map((p) =>
          p.key === key
            ? {
                ...p,
                quantity:
                  Number(p.quantity) + delta,
              }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  }

  /* ----------------------------------------
     CHECKOUT DAN PESANAN
  ----------------------------------------- */

  function checkoutOrder(event) {
    event.preventDefault();

    if (!customer) {
      openAuth("checkout");
      return;
    }

    if (!validCart.length) return;

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(
        checkout.phone.trim()
      )
    ) {
      setMessage("Periksa informasi pembeli.");
      return;
    }

    const quantities = new Map();

    validCart.forEach((item) => {
      quantities.set(
        item.id,
        (quantities.get(item.id) || 0) +
          Number(item.quantity)
      );
    });

    for (const [id, count] of quantities) {
      const product = products.find(
        (p) => p.id === id
      );

      if (!product || product.stock < count) {
        setMessage("Stok tidak mencukupi.");
        return;
      }
    }

    const order = {
      id: `LM-${Date.now()}`,
      date: new Date().toISOString(),
      customer: checkout.name.trim(),
      customerId: customer.id,
      customerEmail: customer.email,
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      shipping: checkout.shipping,
      items: validCart.map(
        (p) => ({ ...p })
      ),
      total: subtotal + shippingFee,
      status: "Pesanan Baru",
      stockRestored: false,
    };

    setOrders((prev) => [
      order,
      ...prev,
    ]);

    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        stock:
          p.stock -
          (quantities.get(p.id) || 0),
      }))
    );

    setCart([]);
    setCheckout({ ...EMPTY_CHECKOUT });
    navigate("success");
  }

  function changeStatus(id, status) {
    if (!STATUSES.includes(status)) return;

    const order = orders.find(
      (o) => o.id === id
    );

    if (!order) return;

    if (
      ["Selesai", "Dibatalkan"].includes(
        statusOf(order.status)
      )
    ) {
      return;
    }

    if (
      status === "Dibatalkan" &&
      !order.stockRestored
    ) {
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          stock:
            Number(product.stock) +
            (order.items || [])
              .filter(
                (item) =>
                  item.id === product.id
              )
              .reduce(
                (sum, item) =>
                  sum + Number(item.quantity),
                0
              ),
        }))
      );
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              stockRestored:
                o.stockRestored ||
                status === "Dibatalkan",
            }
          : o
      )
    );

    setMessage(`Status pesanan: ${status}`);
  }

  /* ----------------------------------------
     CRUD PRODUK ADMIN
  ----------------------------------------- */

  function saveProduct(event) {
    event.preventDefault();

    const categoryInfo = getCategory(
      form.collection
    );

    if (!categoryInfo) return;

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !form.name.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setMessage("Periksa data produk.");
      return;
    }

    if (
      form.image &&
      !UNIQUE_PHOTOS.some(
        (photo) =>
          photo.url === form.image &&
          normalize(photo.folder) ===
            categoryInfo.folder
      )
    ) {
      setMessage(
        "Pilih foto sesuai kategori."
      );
      return;
    }

    const duplicatePhoto = products.some(
      (p) =>
        p.id !== form.id &&
        p.image === form.image &&
        Boolean(form.image)
    );

    if (duplicatePhoto) {
      setMessage(
        "Foto sudah dipakai produk lain. Edit produk tersebut."
      );
      return;
    }

    const product = {
      id: form.id ?? `custom:${Date.now()}`,
      name: form.name.trim(),
      collection: categoryInfo.name,
      category: categoryInfo.category,
      image: form.image,
      price,
      stock,
      description: form.description.trim(),
      sizes: splitValues(form.sizes),
      colors: splitValues(form.colors),
    };

    if (
      !product.sizes.length ||
      !product.colors.length
    ) {
      setMessage(
        "Ukuran dan warna wajib diisi."
      );
      return;
    }

    if (form.id !== null) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === form.id
            ? product
            : p
        )
      );
    } else {
      setProducts((prev) => [
        ...prev,
        product,
      ]);
    }

    setForm({ ...EMPTY_FORM });
    setMessage("Produk berhasil disimpan.");
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,
      collection: product.collection,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || "",
      description: product.description || "",
      sizes: (product.sizes || []).join(","),
      colors: (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const pending = orders.some(
      (o) =>
        !["Selesai", "Dibatalkan"].includes(
          statusOf(o.status)
        ) &&
        o.items?.some(
          (item) => item.id === id
        )
    );

    if (pending) {
      setMessage(
        "Selesaikan pesanan aktif dahulu."
      );
      return;
    }

    if (!window.confirm("Hapus produk ini?")) {
      return;
    }

    const product = products.find(
      (p) => p.id === id
    );

    localStorage.setItem(
      DELETED_KEY,
      JSON.stringify([
        ...new Set([
          ...readList(DELETED_KEY),
          String(id),
          ...(product?.image
            ? [`local:${product.image}`]
            : []),
        ]),
      ])
    );

    setProducts((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setCart((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setWishlist((prev) =>
      prev.filter((value) => value !== id)
    );

    setForm({ ...EMPTY_FORM });
    setMessage("Produk dihapus.");
  }

  const gridProps = {
    wishlist,
    onDetail: showDetail,
    onFavorite: toggleWishlist,
    onCart: addToCart,
  };

  /* ============================================
     WEBSITE
  ============================================ */

  return (
    <div
      className={
        `lumina ${
          page === "admin"
            ? "admin-mode"
            : ""
        }`
      }
    >
      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE —
            PREMIUM FASHION & LIFESTYLE
          </div>

          <header className="navbar">
            <button
              className="logo"
              onClick={() => navigate("home")}
            >
              LUMINA<span>.</span>
            </button>

            <nav className="nav-menu">
              <button onClick={() => navigate("home")}>
                Home
              </button>

              <button onClick={() => selectCategory("All")}>
                Shop
              </button>

              <button onClick={() => selectCategory("Pria")}>
                Men
              </button>

              <button onClick={() => selectCategory("Wanita")}>
                Women
              </button>

              <button onClick={() => selectCategory("Batik Wanita")}>
                Batik
              </button>

              <button onClick={() => selectCategory("Tas Wanita")}>
                Bags
              </button>

              <button onClick={() => navigate("wishlist")}>
                ♡ Wishlist ({wishlist.length})
              </button>

              <button onClick={() => navigate("admin")}>
                Admin Demo
              </button>

              {customer ? (
                <>
                  <button onClick={() => navigate("account")}>
                    Halo, {customer.name}
                  </button>

                  <button onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <button onClick={() => openAuth("home")}>
                  Login / Register
                </button>
              )}
            </nav>

            <button
              className="cart-link"
              onClick={() => navigate("cart")}
            >
              🛍 Cart ({cartCount})
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
                Temukan pakaian pria, pakaian wanita,
                batik wanita, sepatu, tas, dan aksesori
                untuk gaya terbaikmu.
              </p>

              <button
                className="btn-dark"
                onClick={() => selectCategory("All")}
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
                alt="Lumina Fashion"
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
                {UNIQUE_PHOTOS.length} Foto Koleksi
              </strong>
              <span>Katalog foto lokal</span>
            </div>

            <div>
              ✦
              <strong>Seven Collections</strong>
              <span>Fashion for Everyone</span>
            </div>
          </section>

          <section className="container section">
            <p className="eyebrow center">
              SHOP BY CATEGORY
            </p>

            <h2 className="section-title">
              Explore Our Collections
            </h2>

            <p className="section-description">
              Pilih koleksi favoritmu.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,225px),1fr))",
                gap: 20,
              }}
            >
              {CATEGORIES.map((category) => {
                const cover = products.find(
                  (p) =>
                    p.collection === category.name &&
                    p.image
                );

                return (
                  <button
                    key={category.name}
                    onClick={() =>
                      selectCategory(category.name)
                    }
                    style={{
                      position: "relative",
                      height: 290,
                      border: 0,
                      borderRadius: 14,
                      padding: 0,
                      overflow: "hidden",
                      background: "#e9ded3",
                      cursor: "pointer",
                    }}
                  >
                    <ProductImage
                      src={cover?.image}
                      alt={category.label}
                      style={{ objectFit: "cover" }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: 22,
                        textAlign: "left",
                        background:
                          "linear-gradient(transparent,rgba(30,22,17,.85))",
                        color: "white",
                      }}
                    >
                      <small>
                        LUMINA COLLECTION
                      </small>

                      <strong
                        style={{
                          fontFamily: "Georgia,serif",
                          fontSize: 25,
                        }}
                      >
                        {category.label}
                      </strong>
                    </span>
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

            <ProductGrid
              products={featured}
              {...gridProps}
            />

            <div className="center action-space">
              <button
                className="btn-dark"
                onClick={() => selectCategory("All")}
              >
                View All Products →
              </button>
            </div>
          </section>

          <section className="promo">
            <p className="eyebrow">
              THE LUMINA EDIT
            </p>

            <h2>
              Confidence in Every Style.
            </h2>

            <button
              className="btn-dark"
              onClick={() => selectCategory("All")}
            >
              Shop Now →
            </button>
          </section>
        </>
      )}

      {/* SHOP */}

      {page === "shop" && (
        <main
          className="container section"
          style={{ paddingTop: 75 }}
        >
          <p className="eyebrow center">
            THE LUMINA COLLECTION
          </p>

          <h1 className="section-title">
            Shop Our Collection
          </h1>

          <p className="section-description">
            Jelajahi koleksi fashion favoritmu.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              marginBottom: 30,
            }}
          >
            {[
              { name: "All", label: "Semua Produk" },
              ...CATEGORIES,
            ].map((item) => (
              <button
                key={item.name}
                className={
                  category === item.name
                    ? "btn-dark"
                    : "btn-light"
                }
                onClick={() =>
                  setCategory(item.name)
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="toolbar">
            <input
              type="search"
              value={query}
              placeholder="Cari produk..."
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              <option value="All">
                Semua Produk
              </option>

              {CATEGORIES.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <select
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
                Nama A-Z
              </option>
            </select>
          </div>

          <p className="muted">
            {visibleProducts.length} produk ditemukan
          </p>

          <ProductGrid
            products={visibleProducts}
            {...gridProps}
          />
        </main>
      )}

      {/* DETAIL */}

      {page === "detail" && selected && (
        <main className="container section">
          <button
            className="back"
            onClick={() => navigate("shop")}
          >
            ← Kembali ke Shop
          </button>

          <div className="detail-layout">
            <div
              style={{
                aspectRatio: "4/5",
                background: "#f3efeb",
              }}
            >
              <ProductImage
                src={selected.image}
                alt={selected.name}
              />
            </div>

            <div className="detail-copy">
              <p className="eyebrow">
                {selected.collection}
              </p>

              <h1>{selected.name}</h1>

              <h2 className="price">
                {rupiah(selected.price)}
              </h2>

              <p>{selected.description}</p>

              <p>Stok: {selected.stock}</p>

              <label>Pilih Ukuran</label>

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

              <label>Pilih Warna</label>

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
                disabled={selected.stock <= 0}
                onClick={() =>
                  addToCart(
                    selected,
                    selectedSize,
                    selectedColor
                  )
                }
              >
                + Add to Cart
              </button>

              <button
                className="btn-light wide"
                onClick={() =>
                  toggleWishlist(selected.id)
                }
              >
                {wishlist.includes(selected.id)
                  ? "♥ Hapus dari Wishlist"
                  : "♡ Simpan ke Wishlist"}
              </button>
            </div>
          </div>
        </main>
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
            {...gridProps}
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

              {validCart.map((item) => (
                <div
                  key={item.key}
                  className="cart-row"
                >
                  <div
                    style={{
                      width: 95,
                      height: 115,
                      flexShrink: 0,
                    }}
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>{item.name}</h3>

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

                      <span>{item.quantity}</span>

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
                              (p) =>
                                p.key !== item.key
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
              <h2>Order Summary</h2>

              <div className="between">
                <span>Total Item</span>
                <strong>{cartCount}</strong>
              </div>

              <div className="between">
                <span>Subtotal</span>
                <strong>{rupiah(subtotal)}</strong>
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

      {/* LOGIN DAN REGISTRASI */}

      {page === "auth" && (
        <AuthPage
          onSuccess={onAuthSuccess}
          onBack={() => navigate("home")}
        />
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
              onSubmit={checkoutOrder}
            >
              <h2>Informasi Pembeli</h2>

              <label>Nama Lengkap</label>
              <input
                required
                value={checkout.name}
                onChange={(e) =>
                  setCheckout({
                    ...checkout,
                    name: e.target.value,
                  })
                }
              />

              <label>Nomor Telepon</label>
              <input
                required
                type="tel"
                value={checkout.phone}
                onChange={(e) =>
                  setCheckout({
                    ...checkout,
                    phone: e.target.value,
                  })
                }
              />

              <label>Alamat</label>
              <textarea
                required
                rows={4}
                value={checkout.address}
                onChange={(e) =>
                  setCheckout({
                    ...checkout,
                    address: e.target.value,
                  })
                }
              />

              <label>Pengiriman</label>
              <select
                value={checkout.shipping}
                onChange={(e) =>
                  setCheckout({
                    ...checkout,
                    shipping: e.target.value,
                  })
                }
              >
                <option value="regular">
                  Regular — Rp12.000
                </option>

                <option value="express">
                  Express — Rp25.000
                </option>
              </select>

              <p className="muted">
                Checkout simulasi.
                Gunakan data fiktif.
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
              <h2>Ringkasan Pesanan</h2>

              <div className="between">
                <span>Subtotal</span>
                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <div className="between">
                <span>Pengiriman</span>
                <strong>
                  {rupiah(shippingFee)}
                </strong>
              </div>

              <div className="between grand-total">
                <span>Total</span>
                <strong>
                  {rupiah(subtotal + shippingFee)}
                </strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>Silakan Login Terlebih Dahulu</h2>

          <button
            className="btn-dark"
            onClick={() => openAuth("checkout")}
          >
            Login / Register
          </button>
        </main>
      )}

      {/* DASHBOARD PELANGGAN */}

      {page === "account" && customer && (
        <main className="container section">
          <p className="eyebrow center">
            MY ACCOUNT
          </p>

          <h1 className="section-title">
            Dashboard Pelanggan
          </h1>

          <section className="panel">
            <h2>Profil Saya</h2>

            <p>Nama: {customer.name}</p>
            <p>Email: {customer.email}</p>

            <button
              className="btn-light"
              onClick={logout}
            >
              Logout
            </button>
          </section>

          <section
            className="panel"
            style={{ marginTop: 28 }}
          >
            <h2>Riwayat Pesanan Saya</h2>

            <OrderTable orders={myOrders} />
          </section>
        </main>
      )}

      {/* SUCCESS */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h1>Pesanan Berhasil!</h1>

            <p>
              Pesanan simulasi telah tercatat.
            </p>

            <button
              className="btn-dark"
              onClick={() =>
                navigate("account")
              }
            >
              Lihat Pesanan Saya
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
          onBack={() => navigate("home")}
          onCancel={() =>
            setForm({ ...EMPTY_FORM })
          }
        />
      )}

      {/* FOOTER */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>
            <p>Premium Fashion & Lifestyle</p>
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
            — Demo Only
          </p>
        </footer>
      )}

      {/* NOTIFIKASI */}

      {message && (
        <div
          className="toast"
          role="status"
        >
          <span>{message}</span>

          <button
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
