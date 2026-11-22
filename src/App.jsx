
import { useEffect, useState } from "react";
import "./App.css";
import productImages from "./product-images.json";

/* ==========================================
   LUMINA STORE — PREMIUM FASHION
   FINAL SEVEN COLLECTIONS
========================================== */

const FOLDERS = {
  pria: {
    title: "Pria",
    label: "Baju Pria",
    subtitle: "Men's Collection",
    category: "Fashion",
    price: 179000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },

  wanita: {
    title: "Wanita",
    label: "Baju Wanita",
    subtitle: "Women's Collection",
    category: "Fashion",
    price: 199000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },

  "batik wanita": {
    title: "Batik Wanita",
    label: "Batik Wanita",
    subtitle: "Indonesian Heritage",
    category: "Fashion",
    price: 235000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },

  "sepatu pria": {
    title: "Sepatu Pria",
    label: "Sepatu Pria",
    subtitle: "Men's Footwear",
    category: "Shoes",
    price: 295000,
    sizes: ["39", "40", "41", "42", "43", "44"],
  },

  "sepatu wanita": {
    title: "Sepatu Wanita",
    label: "Sepatu Wanita",
    subtitle: "Women's Footwear",
    category: "Shoes",
    price: 245000,
    sizes: ["35", "36", "37", "38", "39", "40"],
  },

  "tas wanita": {
    title: "Tas Wanita",
    label: "Tas Wanita",
    subtitle: "Elegant Bags",
    category: "Accessories",
    price: 249000,
    sizes: ["All Size"],
  },

  aksesoris: {
    title: "Accessories",
    label: "Aksesori",
    subtitle: "Fashion Accessories",
    category: "Accessories",
    price: 129000,
    sizes: ["All Size"],
  },
};

const CATEGORIES = [
  ["All", "Semua Produk"],
  ...Object.values(FOLDERS).map((item) => [
    item.title,
    item.label,
  ]),
];

const STATUSES = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const EMPTY_FORM = {
  name: "",
  collection: "Pria",
  price: "",
  stock: "",
  image: "",
  sizes: "S,M,L,XL,XXL",
  colors: "Sesuai foto",
  description: "",
  keywords: "",
};

const EMPTY_CHECKOUT = {
  name: "",
  phone: "",
  address: "",
  shipping: "regular",
};

/* ==========================================
   HELPER FUNCTIONS
========================================== */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const value = readStorage(key, []);

  return Array.isArray(value)
    ? value
    : [];
}

function getCollectionInfo(collection) {
  return Object.values(FOLDERS).find(
    (item) => item.title === collection
  );
}

function statusOf(status) {
  return STATUSES.includes(status)
    ? status
    : "Pesanan Baru";
}

function shortMoney(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }

  return String(value);
}

function imageUrl(src) {
  if (!src) return "";

  if (src.startsWith("/images/")) {
    return (
      import.meta.env.BASE_URL.replace(/\/$/, "") +
      src.split("/").map(encodeURIComponent).join("/")
    );
  }

  return src;
}

/* ==========================================
   READ LOCAL PRODUCT IMAGES
========================================== */

const localPhotos = (
  Array.isArray(productImages)
    ? productImages
    : []
)
  .filter(
    (item) =>
      item &&
      typeof item.folder === "string" &&
      typeof item.url === "string" &&
      Object.hasOwn(
        FOLDERS,
        normalize(item.folder)
      )
  )
  .sort((a, b) =>
    a.url.localeCompare(
      b.url,
      undefined,
      { numeric: true }
    )
  );

const LOCAL_PRODUCTS = localPhotos.map((photo) => {
  const info = FOLDERS[normalize(photo.folder)];

  return {
    id: `local:${photo.url}`,

    name: `${info.label} — ${photo.name}`,

    collection: info.title,

    category: info.category,

    price: info.price,

    stock: 20,

    image: photo.url,

    sizes: [...info.sizes],

    colors: ["Sesuai foto"],

    description:
      `Koleksi ${info.label} dari LUMINA STORE. ` +
      "Pilihan fashion modern untuk melengkapi gaya penampilanmu. " +
      "Harga dan stok merupakan data simulasi.",

    keywords:
      `${info.label} ${photo.name}`,
  };
});

/* ==========================================
   PRODUCT MIGRATION

   Mempertahankan produk yang sesuai.
   Mengabaikan kategori lama yang dihapus.
========================================== */

function allowedCollection(product) {
  const photo = localPhotos.find(
    (item) => item.url === product.image
  );

  if (photo) {
    return FOLDERS[
      normalize(photo.folder)
    ].title;
  }

  const text = normalize([
    product.name,
    product.collection,
    product.keywords,
  ].join(" "));

  if (
    /kebaya|anak|kids|keluarga|family|couple|sarimbit/.test(text)
  ) {
    return "";
  }

  if (getCollectionInfo(product.collection)) {
    return product.collection;
  }

  if (text.includes("batik")) {
    return /wanita|perempuan/.test(text)
      ? "Batik Wanita"
      : "";
  }

  if (
    product.category === "Shoes" ||
    /sepatu|sneakers|heels|loafers|pantofel/.test(text)
  ) {
    if (/wanita|perempuan/.test(text)) {
      return "Sepatu Wanita";
    }

    if (/pria|laki-laki/.test(text)) {
      return "Sepatu Pria";
    }

    return "";
  }

  if (
    /tas wanita|handbag|tote bag|sling bag|shoulder bag/.test(text)
  ) {
    return "Tas Wanita";
  }

  if (product.category === "Accessories") {
    return "Accessories";
  }

  if (/wanita|perempuan|women|blouse/.test(text)) {
    return "Wanita";
  }

  if (/pria|cowok|laki-laki/.test(text)) {
    return "Pria";
  }

  return "";
}

function loadProducts() {
  const saved = readArray("lumina_products_v1");

  const deleted = readArray(
    "lumina_deleted_local_v1"
  );

  const existing = saved
    .map((product) => {
      if (!product) return null;

      const collection = allowedCollection(product);

      if (!collection) return null;

      const info = getCollectionInfo(collection);

      if (!info) return null;

      const validImage = localPhotos.some(
        (photo) =>
          photo.url === product.image &&
          FOLDERS[
            normalize(photo.folder)
          ].title === collection
      );

      const sizes = Array.isArray(product.sizes)
        ? product.sizes.filter(
            (size) => info.sizes.includes(size)
          )
        : [];

      return {
        ...product,

        collection,

        category: info.category,

        image: validImage
          ? product.image
          : "",

        sizes: sizes.length
          ? sizes
          : [...info.sizes],

        colors:
          Array.isArray(product.colors) &&
          product.colors.length
            ? product.colors
            : ["Sesuai foto"],
      };
    })
    .filter(Boolean);

  const ids = new Set(
    existing.map((item) => String(item.id))
  );

  const usedPhotos = new Set(
    existing.map((item) => item.image)
  );

  const additional = LOCAL_PRODUCTS.filter(
    (item) =>
      !ids.has(String(item.id)) &&
      !usedPhotos.has(item.image) &&
      !deleted.includes(item.id)
  );

  return [...existing, ...additional];
}

/* ==========================================
   PRODUCT IMAGE COMPONENT
========================================== */

function ProductImage({
  src,
  alt,
  className = "",
  style = {},
}) {
  const [failedSrc, setFailedSrc] =
    useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className={`lum-photo-missing ${className}`}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 10,
          background: "#eee5dc",
          color: "#987b64",
          textAlign: "center",
          overflow: "hidden",
          ...style,
        }}
      >
        <span style={{ fontSize: 26 }}>
          ▧
        </span>

        <small>Foto belum tersedia</small>
      </div>
    );
  }

  return (
    <img
      src={imageUrl(src)}
      alt={alt || "Lumina Collection"}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      style={style}
    />
  );
}

/* ==========================================
   PRODUCT CARD
========================================== */

function ProductCard({
  product,
  favorite,
  onFavorite,
  onDetail,
  onAdd,
}) {
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#f4f0ec",
            }}
          />
        </button>

        <button
          type="button"
          className="heart"
          aria-label={`Wishlist ${product.name}`}
          aria-pressed={favorite}
          onClick={() => onFavorite(product.id)}
        >
          {favorite ? "♥" : "♡"}
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
          Stok: {product.stock}
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
            onClick={() => onAdd(product)}
          >
            + Keranjang
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  items,
  wishlist,
  onFavorite,
  onDetail,
  onAdd,
}) {
  return (
    <div className="product-grid">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          favorite={wishlist.includes(product.id)}
          onFavorite={onFavorite}
          onDetail={onDetail}
          onAdd={onAdd}
        />
      ))}

      {!items.length && (
        <p className="empty">
          Belum ada produk yang sesuai.
          Silakan pilih kategori lainnya.
        </p>
      )}
    </div>
  );
}

/* ==========================================
   CATEGORY SECTION
========================================== */

function CategorySection({
  products,
  onSelect,
}) {
  return (
    <section className="container section">
      <p className="eyebrow center">
        SHOP BY CATEGORY
      </p>

      <h2 className="section-title">
        Explore Our Collections
      </h2>

      <p className="section-description">
        Tujuh koleksi fashion pilihan
        untuk melengkapi penampilanmu.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(100%,230px),1fr))",
          gap: 22,
        }}
      >
        {Object.entries(FOLDERS).map(
          ([folder, info]) => {
            const items = products.filter(
              (p) =>
                p.collection === info.title &&
                p.image
            );

            return (
              <button
                type="button"
                key={folder}
                onClick={() => onSelect(info.title)}
                style={{
                  position: "relative",
                  minHeight: 310,
                  padding: 0,
                  overflow: "hidden",
                  border: 0,
                  borderRadius: 14,
                  background: "#eaded2",
                  textAlign: "left",
                }}
              >
                <ProductImage
                  src={items[0]?.image}
                  alt={info.label}
                  style={{
                    position: "absolute",
                    inset: 0,
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
                    padding: 24,
                    gap: 8,
                    background:
                      "linear-gradient(transparent 25%,rgba(28,20,14,.82))",
                    color: "#fff",
                  }}
                >
                  <small
                    style={{
                      fontSize: 10,
                      letterSpacing: 2,
                    }}
                  >
                    {info.subtitle}
                  </small>

                  <strong
                    style={{
                      fontFamily: "Georgia,serif",
                      fontSize: 27,
                    }}
                  >
                    {info.label}
                  </strong>

                  <span style={{ fontSize: 12 }}>
                    {items.length} produk bergambar
                    {" →"}
                  </span>
                </span>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}

/* ==========================================
   ADMIN ORDER TABLE
========================================== */

function OrderTable({
  orders,
  onStatus,
  editable = false,
}) {
  return (
    <div className="lum-dash-table-wrap">
      <table className="lum-dash-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Pembeli</th>
            <th>Order ID</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = statusOf(order.status);
            const first = order.items?.[0];

            return (
              <tr key={order.id}>
                <td>
                  <div
                    className="lum-dash-order-product"
                  >
                    <div
                      style={{
                        width: 45,
                        height: 55,
                        flexShrink: 0,
                      }}
                    >
                      <ProductImage
                        src={first?.image}
                        alt={first?.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <span>
                      {first?.name || "Produk"}

                      {order.items?.length > 1
                        ? ` +${order.items.length - 1}`
                        : ""}
                    </span>
                  </div>
                </td>

                <td>{order.customer}</td>

                <td>{order.id}</td>

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
                      {STATUSES.map((value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={
                        "lum-dash-status " +
                        status
                          .toLowerCase()
                          .replaceAll(" ", "-")
                      }
                    >
                      {status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {!orders.length && (
            <tr>
              <td
                colSpan={5}
                className="lum-dash-empty"
              >
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
   ADMIN DASHBOARD
========================================== */

function AdminDashboard({
  products,
  orders,
  onBack,
  onStatus,
  onSave,
  onEdit,
  onDelete,
  form,
  setForm,
  editingId,
  onCancel,
}) {
  const [section, setSection] =
    useState("overview");

  const [query, setQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("Semua");

  const [photoFolder, setPhotoFolder] =
    useState("Semua");

  const [year, setYear] =
    useState(new Date().getFullYear());

  const completed = orders.filter(
    (o) => statusOf(o.status) === "Selesai"
  );

  const activeOrders = orders.filter(
    (o) =>
      statusOf(o.status) !== "Dibatalkan"
  );

  const revenue = completed.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const activeValue = activeOrders.reduce(
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

  const sold = new Map();

  completed.forEach((order) => {
    (order.items || []).forEach((item) => {
      sold.set(
        item.id,
        (sold.get(item.id) || 0) +
          Number(item.quantity || 0)
      );
    });
  });

  const topSelling = [...products]
    .filter((p) => sold.get(p.id) > 0)
    .sort(
      (a, b) =>
        sold.get(b.id) - sold.get(a.id)
    )
    .slice(0, 5);

  const years = [
    ...new Set([
      new Date().getFullYear(),
      ...orders
        .map((o) => new Date(o.date).getFullYear())
        .filter(Number.isFinite),
    ]),
  ].sort((a, b) => b - a);

  const months = Array.from(
    { length: 12 },
    (_, index) => ({
      label: new Date(
        year,
        index,
        1
      ).toLocaleString("id-ID", {
        month: "short",
      }),

      total: completed
        .filter((order) => {
          const date = new Date(order.date);

          return (
            date.getFullYear() === year &&
            date.getMonth() === index
          );
        })
        .reduce(
          (sum, order) =>
            sum + Number(order.total || 0),
          0
        ),
    })
  );

  const maxRevenue = Math.max(
    1,
    ...months.map((month) => month.total)
  );

  const visibleOrders = [...orders]
    .filter((order) => {
      const text = normalize([
        order.id,
        order.customer,
        ...(order.items || []).map(
          (item) => item.name
        ),
      ].join(" "));

      return (
        text.includes(normalize(query)) &&
        (
          statusFilter === "Semua" ||
          statusOf(order.status) === statusFilter
        )
      );
    })
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

  const visibleProducts = products.filter(
    (product) =>
      normalize([
        product.name,
        product.collection,
        product.keywords,
      ].join(" ")).includes(
        normalize(query)
      )
  );

  const availablePhotos = localPhotos.filter(
    (photo) =>
      (
        photoFolder === "Semua" ||
        normalize(photo.folder) === photoFolder
      ) &&
      normalize(
        `${photo.folder} ${photo.name}`
      ).includes(normalize(query))
  );

  const metrics = [
    [
      "Rp",
      "Penjualan Selesai",
      rupiah(revenue),
      "Completed",
    ],
    [
      "◈",
      "Nilai Pesanan",
      rupiah(activeValue),
      "Non-cancelled",
    ],
    [
      "▤",
      "Total Pesanan",
      orders.length,
      `${completed.length} selesai`,
    ],
    [
      "▣",
      "Total Produk",
      products.length,
      `${totalStock} unit`,
    ],
  ];

  const titles = {
    overview: "Dashboard Overview",
    report: "Sales Report",
    orders: "Order Management",
    products: "Product Management",
    photos: "Photo Gallery",
  };

  function changeSection(value) {
    setSection(value);
    setQuery("");
    setStatusFilter("Semua");
  }

  function updateForm(key, value) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  return (
    <div className="lum-dash">

      {/* ADMIN SIDEBAR */}

      <aside
        className="lum-dash-sidebar"
        style={{
          background: "#302720",
          color: "white",
        }}
      >
        <div
          className="lum-dash-logo"
          style={{ color: "white" }}
        >
          LUMINA<span>.</span>
        </div>

        <p
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#cbb4a1",
          }}
        >
          MANAGEMENT SYSTEM
        </p>

        <div className="lum-dash-menu-label">
          WORKSPACE
        </div>

        <nav className="lum-dash-menu">
          {[
            ["overview", "▦", "Overview"],
            ["report", "▤", "Sales Report"],
            ["orders", "▣", "Orders"],
            ["products", "◈", "Products"],
            ["photos", "▧", "Photo Gallery"],
          ].map(([key, icon, label]) => (
            <button
              type="button"
              key={key}
              className={
                section === key ? "active" : ""
              }
              onClick={() => changeSection(key)}
              style={{
                color: "#fff",
                background:
                  section === key
                    ? "#a98468"
                    : "transparent",
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="lum-dash-sidebar-bottom">
          <strong>LUMINA STORE</strong>

          <p style={{ color: "#d6c3b2" }}>
            Premium Fashion & Lifestyle
          </p>

          <small style={{ color: "#bcd6ba" }}>
            ● Admin Demo
          </small>

          <button
            className="lum-dash-back"
            onClick={onBack}
          >
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN */}

      <main
        className="lum-dash-main"
        style={{ background: "#f8f6f3" }}
      >
        <header className="lum-dash-topbar">
          <div>
            <span className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </span>

            <h1>{titles[section]}</h1>
          </div>

          <div className="lum-dash-search">
            <span>⌕</span>

            <input
              type="search"
              placeholder="Cari produk atau pesanan..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />
          </div>

          <span className="lum-dash-avatar">
            A
          </span>
        </header>

        {/* STATISTICS */}

        {(section === "overview" ||
          section === "report") && (
          <div className="lum-dash-stats">
            {metrics.map(
              ([icon, label, value, note], index) => (
                <div
                  className="lum-dash-metric"
                  key={label}
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg,#49392d,#a17e62)"
                        : "#fff",

                    color:
                      index === 0
                        ? "#fff"
                        : "#302720",

                    borderRadius: 15,
                  }}
                >
                  <div className="lum-dash-metric-head">
                    <span
                      className="lum-dash-metric-icon"
                      style={{
                        color:
                          index === 0
                            ? "#fff"
                            : "#a6846b",
                      }}
                    >
                      {icon}
                    </span>

                    <small
                      style={{
                        color:
                          index === 0
                            ? "#f1ddca"
                            : "#89796b",
                      }}
                    >
                      {note}
                    </small>
                  </div>

                  <strong>{value}</strong>

                  <span
                    style={{
                      color:
                        index === 0
                          ? "#fff"
                          : "#89796b",
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {/* DASHBOARD OVERVIEW */}

        {section === "overview" && (
          <>
            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <div>
                  <h2>Revenue Analytics</h2>

                  <p>
                    Pendapatan dari pesanan selesai
                  </p>
                </div>

                <select
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                >
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lum-dash-chart-total">
                {rupiah(
                  months.reduce(
                    (sum, month) =>
                      sum + month.total,
                    0
                  )
                )}

                <small>Total {year}</small>
              </div>

              <div className="lum-dash-chart">
                {months.map((month, index) => (
                  <div
                    className="lum-dash-bar-col"
                    key={index}
                  >
                    <span>
                      {month.total
                        ? shortMoney(month.total)
                        : ""}
                    </span>

                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        title={rupiah(month.total)}
                        style={{
                          height:
                            `${month.total / maxRevenue * 100}%`,

                          background:
                            "linear-gradient(180deg,#d7b79b,#89664c)",
                        }}
                      />
                    </div>

                    <small>{month.label}</small>
                  </div>
                ))}
              </div>

              {!completed.length && (
                <p className="lum-dash-small">
                  Grafik akan terisi setelah
                  pesanan berstatus Selesai.
                </p>
              )}
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>

              <p className="lum-dash-small">
                Tujuh kategori koleksi LUMINA STORE.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(125px,1fr))",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {Object.entries(FOLDERS).map(
                  ([folder, info]) => {
                    const count = products.filter(
                      (p) =>
                        p.collection === info.title
                    ).length;

                    const photos = localPhotos.filter(
                      (p) =>
                        normalize(p.folder) === folder
                    );

                    return (
                      <button
                        key={folder}
                        className="btn-light"
                        onClick={() => {
                          setPhotoFolder(folder);
                          changeSection("photos");
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: 12,
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: 110,
                            overflow: "hidden",
                            borderRadius: 8,
                          }}
                        >
                          <ProductImage
                            src={photos[0]?.url}
                            alt={info.label}
                            style={{
                              objectFit: "contain",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        </div>

                        <strong
                          style={{ fontSize: 22 }}
                        >
                          {count}
                        </strong>

                        <span>{info.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </section>

            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Pesanan terbaru pelanggan</p>
                </div>

                <button
                  className="lum-dash-link"
                  onClick={() =>
                    changeSection("orders")
                  }
                >
                  Lihat Semua →
                </button>
              </div>

              <OrderTable
                orders={visibleOrders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {/* SALES REPORT */}

        {section === "report" && (
          <>
            <section className="lum-dash-card">
              <h2>Ringkasan Status Pesanan</h2>

              <div className="lum-dash-status-grid">
                {STATUSES.map((status) => (
                  <div key={status}>
                    <strong>
                      {
                        orders.filter(
                          (o) =>
                            statusOf(o.status) === status
                        ).length
                      }
                    </strong>

                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Laporan Transaksi</h2>

              <OrderTable
                orders={visibleOrders}
              />
            </section>
          </>
        )}

        {/* ORDER MANAGEMENT */}

        {section === "orders" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <div>
                <h2>Manajemen Pesanan</h2>
                <p>Kelola status pesanan pelanggan</p>
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option>Semua</option>

                {STATUSES.map((status) => (
                  <option key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <OrderTable
              orders={visibleOrders}
              onStatus={onStatus}
              editable
            />
          </section>
        )}

        {/* PRODUCT MANAGEMENT */}

        {section === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-dash-product-form"
              onSubmit={onSave}
            >
              <h2>
                {editingId !== null
                  ? "Edit Produk"
                  : "Tambah Produk"}
              </h2>

              <label>Nama Produk</label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  updateForm("name", e.target.value)
                }
              />

              <label>Kategori Produk</label>

              <select
                value={form.collection}
                onChange={(e) => {
                  const collection = e.target.value;

                  const info =
                    getCollectionInfo(collection);

                  setForm((old) => ({
                    ...old,
                    collection,
                    image: "",
                    sizes: info.sizes.join(","),
                  }));
                }}
              >
                {CATEGORIES.slice(1).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>

              <label>Harga (Rp)</label>

              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  updateForm("price", e.target.value)
                }
              />

              <label>Jumlah Stok</label>

              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) =>
                  updateForm("stock", e.target.value)
                }
              />

              <label>Pilih Foto Lokal</label>

              <select
                value={form.image}
                onChange={(e) =>
                  updateForm("image", e.target.value)
                }
              >
                <option value="">
                  Pilih foto dari folder
                </option>

                {localPhotos
                  .filter(
                    (photo) =>
                      FOLDERS[
                        normalize(photo.folder)
                      ].title === form.collection
                  )
                  .map((photo) => (
                    <option
                      key={photo.url}
                      value={photo.url}
                    >
                      {photo.name}
                    </option>
                  ))}
              </select>

              <div
                style={{
                  height: 220,
                  overflow: "hidden",
                  borderRadius: 12,
                  background: "#f3eee8",
                }}
              >
                <ProductImage
                  src={form.image}
                  alt="Preview Produk"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <label>Deskripsi Produk</label>

              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  updateForm(
                    "description",
                    e.target.value
                  )
                }
              />

              <label>Kata Kunci</label>

              <input
                value={form.keywords}
                onChange={(e) =>
                  updateForm(
                    "keywords",
                    e.target.value
                  )
                }
              />

              <label>Ukuran</label>

              <input
                required
                value={form.sizes}
                onChange={(e) =>
                  updateForm("sizes", e.target.value)
                }
              />

              <label>Warna</label>

              <input
                required
                value={form.colors}
                onChange={(e) =>
                  updateForm("colors", e.target.value)
                }
              />

              <button
                type="submit"
                className="btn-dark"
              >
                {editingId !== null
                  ? "Simpan Perubahan"
                  : "+ Tambah Produk"}
              </button>

              {editingId !== null && (
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

              <p className="lum-dash-small">
                Gunakan kolom pencarian untuk
                menemukan produk.
              </p>

              {visibleProducts.map((product) => (
                <div
                  key={product.id}
                  className="lum-dash-product-row"
                >
                  <div
                    style={{
                      width: 55,
                      minWidth: 55,
                      height: 65,
                      flex: "0 0 55px",
                    }}
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div>
                    <strong>{product.name}</strong>

                    <p>
                      {rupiah(product.price)}
                      {" · "}
                      Stok {product.stock}
                    </p>

                    <small>
                      {product.collection}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-light"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => onDelete(product.id)}
                  >
                    Hapus
                  </button>
                </div>
              ))}

              {!visibleProducts.length && (
                <p>Produk tidak ditemukan.</p>
              )}
            </section>
          </div>
        )}

        {/* ADMIN PHOTO GALLERY */}

        {section === "photos" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <div>
                <h2>Fashion Gallery</h2>
                <p>Seluruh foto dari folder lokal</p>
              </div>

              <select
                value={photoFolder}
                onChange={(e) =>
                  setPhotoFolder(e.target.value)
                }
              >
                <option>Semua</option>

                {Object.keys(FOLDERS).map(
                  (folder) => (
                    <option
                      key={folder}
                      value={folder}
                    >
                      {FOLDERS[folder].label}
                    </option>
                  )
                )}
              </select>
            </div>

            <p className="lum-dash-small">
              {availablePhotos.length} foto ditemukan.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,150px),1fr))",
                gap: 16,
                marginTop: 25,
              }}
            >
              {availablePhotos.map((photo) => (
                <article
                  key={photo.url}
                  style={{
                    background: "#fff",
                    border: "1px solid #e9dfd6",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "3/4",
                      overflow: "hidden",
                    }}
                  >
                    <ProductImage
                      src={photo.url}
                      alt={photo.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        background: "#f2ede8",
                      }}
                    />
                  </div>

                  <div style={{ padding: 14 }}>
                    <strong>
                      {
                        FOLDERS[
                          normalize(photo.folder)
                        ].label
                      }
                    </strong>

                    <p className="lum-dash-small">
                      {photo.name}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {!availablePhotos.length && (
              <p className="empty">
                Belum ada foto di folder ini.
              </p>
            )}
          </section>
        )}
      </main>

      {/* RIGHT SIDEBAR */}

      <aside className="lum-dash-right">
        <section>
          <h3>Store Summary</h3>

          {[
            ["Kategori", 7],
            ["Foto Lokal", localPhotos.length],
            ["Total Produk", products.length],
            ["Total Stok", totalStock],
            ["Pesanan Selesai", completed.length],
            ["Stok Menipis", lowStock.length],
          ].map(([label, value]) => (
            <div
              className="lum-dash-stock"
              key={label}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section>
          <h3>Top Selling Products</h3>

          {!topSelling.length && (
            <p className="lum-dash-small">
              Belum ada penjualan selesai.
            </p>
          )}

          {topSelling.map((product) => (
            <div
              className="lum-dash-side-product"
              key={product.id}
            >
              <ProductImage
                src={product.image}
                alt={product.name}
                style={{
                  width: 50,
                  height: 60,
                  objectFit: "contain",
                }}
              />

              <div>
                <strong>{product.name}</strong>

                <small>
                  {sold.get(product.id)} unit terjual
                </small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Stock Alert</h3>

          {!lowStock.length && (
            <p className="lum-dash-small">
              ✓ Stok masih mencukupi.
            </p>
          )}

          {lowStock.map((product) => (
            <div
              className="lum-dash-stock"
              key={product.id}
            >
              <span>{product.name}</span>
              <strong>{product.stock}</strong>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}

/* ==========================================
   MAIN APPLICATION
========================================== */

export default function App() {
  const [products, setProducts] =
    useState(loadProducts);

  const [cart, setCart] = useState(() => {
    const ids = new Set(
      loadProducts().map((p) => p.id)
    );

    return readArray("lumina_cart_v1")
      .filter((item) => ids.has(item.id));
  });

  const [wishlist, setWishlist] = useState(() => {
    const ids = new Set(
      loadProducts().map((p) => p.id)
    );

    return readArray("lumina_wishlist_v1")
      .filter((id) => ids.has(id));
  });

  const [orders, setOrders] =
    useState(() => readArray("lumina_orders_v1"));

  const [page, setPage] = useState(
    () =>
      window.location.hash === "#admin"
        ? "admin"
        : "home"
  );

  const [category, setCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("default");

  const [sizeFilter, setSizeFilter] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [photoOnly, setPhotoOnly] =
    useState(true);

  const [selectedId, setSelectedId] =
    useState(null);

  const [selectedSize, setSelectedSize] =
    useState("");

  const [selectedColor, setSelectedColor] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [checkout, setCheckout] =
    useState(EMPTY_CHECKOUT);

  /* LOCAL STORAGE */

  useEffect(() => {
    if (
      localStorage.getItem(
        "lumina_catalog_backup_before_7_v1"
      ) === null
    ) {
      localStorage.setItem(
        "lumina_catalog_backup_before_7_v1",
        localStorage.getItem(
          "lumina_products_v1"
        ) || "[]"
      );
    }

    localStorage.setItem(
      "lumina_products_v1",
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      "lumina_cart_v1",
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "lumina_wishlist_v1",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(
      "lumina_orders_v1",
      JSON.stringify(orders)
    );
  }, [orders]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(
      () => setMessage(""),
      3500
    );

    return () => clearTimeout(timer);
  }, [message]);

  /* PRODUCT DATA */

  const selected = products.find(
    (p) => p.id === selectedId
  );

  const featured = Object.values(FOLDERS)
    .flatMap((info) =>
      products
        .filter(
          (p) =>
            p.collection === info.title &&
            p.image
        )
        .slice(0, 2)
    )
    .slice(0, 14);

  const visibleProducts = products
    .filter((product) => {
      const text = normalize([
        product.name,
        product.collection,
        product.description,
        product.keywords,
      ].join(" "));

      return (
        text.includes(normalize(search)) &&
        (
          category === "All" ||
          product.collection === category
        ) &&
        (
          !sizeFilter ||
          product.sizes?.includes(sizeFilter)
        ) &&
        (
          !maxPrice ||
          Number(product.price) <= Number(maxPrice)
        ) &&
        (!photoOnly || Boolean(product.image))
      );
    })
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

  const sizeOptions = [
    ...new Set(
      products
        .filter(
          (p) =>
            category === "All" ||
            p.collection === category
        )
        .flatMap((p) => p.sizes || [])
    ),
  ];

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const subtotal = cart.reduce(
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

  const heroImage =
    localPhotos.find(
      (p) => normalize(p.folder) === "wanita"
    )?.url ||
    localPhotos.find(
      (p) => normalize(p.folder) === "pria"
    )?.url ||
    localPhotos[0]?.url;

  /* NAVIGATION */

  function navigate(value) {
    setPage(value);

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        (value === "admin" ? "#admin" : "")
    );

    window.scrollTo(0, 0);
  }

  function selectCategory(value) {
    setCategory(value);
    setSearch("");
    setSizeFilter("");
    setMaxPrice("");
    navigate("shop");
  }

  function openProduct(product) {
    setSelectedId(product.id);

    setSelectedSize(
      product.sizes?.[0] || "All Size"
    );

    setSelectedColor(
      product.colors?.[0] || "Sesuai foto"
    );

    navigate("detail");
  }

  /* WISHLIST */

  function toggleWishlist(id) {
    setWishlist((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  }

  /* SHOPPING CART */

  function addToCart(product, size, color) {
    const chosenSize =
      size || product.sizes?.[0] || "All Size";

    const chosenColor =
      color || product.colors?.[0] || "Sesuai foto";

    const key = JSON.stringify([
      product.id,
      chosenSize,
      chosenColor,
    ]);

    const used = cart
      .filter((p) => p.id === product.id)
      .reduce(
        (sum, p) => sum + Number(p.quantity),
        0
      );

    if (used >= product.stock) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((old) => {
      const existing = old.find(
        (p) =>
          p.id === product.id &&
          p.size === chosenSize &&
          p.color === chosenColor
      );

      if (existing) {
        return old.map((p) =>
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
        ...old,
        {
          ...product,
          key,
          size: chosenSize,
          color: chosenColor,
          quantity: 1,
        },
      ];
    });

    setMessage(
      "Produk berhasil masuk keranjang."
    );
  }

  function changeQuantity(key, amount) {
    const item = cart.find(
      (p) => p.key === key
    );

    if (!item) return;

    const product = products.find(
      (p) => p.id === item.id
    );

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce(
        (sum, p) => sum + Number(p.quantity),
        0
      );

    if (
      amount > 0 &&
      (!product || used >= product.stock)
    ) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((old) =>
      old
        .map((p) =>
          p.key === key
            ? {
                ...p,
                quantity:
                  Number(p.quantity) + amount,
              }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  }

  /* CHECKOUT */

  function placeOrder(event) {
    event.preventDefault();

    if (!cart.length) return;

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(
        checkout.phone.trim()
      )
    ) {
      setMessage(
        "Periksa kembali informasi pembeli."
      );

      return;
    }

    const quantities = new Map();

    cart.forEach((item) => {
      quantities.set(
        item.id,
        (quantities.get(item.id) || 0) +
          Number(item.quantity)
      );
    });

    for (const [id, quantity] of quantities) {
      const product = products.find(
        (p) => p.id === id
      );

      if (
        !product ||
        product.stock < quantity ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setMessage("Stok tidak mencukupi.");
        return;
      }
    }

    for (const item of cart) {
      const product = products.find(
        (p) => p.id === item.id
      );

      if (
        !product.sizes.includes(item.size) ||
        !product.colors.includes(item.color)
      ) {
        setMessage(
          "Ukuran atau warna produk berubah. " +
          "Silakan tambahkan ulang produk."
        );

        return;
      }
    }

    const order = {
      id: `LM-${Date.now()}`,

      date: new Date().toISOString(),

      customer: checkout.name.trim(),

      phone: checkout.phone.trim(),

      address: checkout.address.trim(),

      shipping: checkout.shipping,

      items: cart.map((item) => ({ ...item })),

      total: subtotal + shippingFee,

      status: "Pesanan Baru",

      stockRestored: false,
    };

    setOrders((old) => [order, ...old]);

    setProducts((old) =>
      old.map((product) => ({
        ...product,

        stock:
          Number(product.stock) -
          (quantities.get(product.id) || 0),
      }))
    );

    setCart([]);

    setCheckout(EMPTY_CHECKOUT);

    navigate("success");
  }

  /* UPDATE ORDER STATUS */

  function updateStatus(id, value) {
    const order = orders.find(
      (o) => o.id === id
    );

    if (!order || !STATUSES.includes(value)) {
      return;
    }

    const previous = statusOf(order.status);

    if (
      previous === "Selesai" ||
      previous === "Dibatalkan"
    ) {
      return;
    }

    if (
      value === "Dibatalkan" &&
      !order.stockRestored
    ) {
      setProducts((old) =>
        old.map((product) => ({
          ...product,

          stock:
            Number(product.stock) +
            (order.items || [])
              .filter(
                (item) => item.id === product.id
              )
              .reduce(
                (sum, item) =>
                  sum + Number(item.quantity),
                0
              ),
        }))
      );
    }

    setOrders((old) =>
      old.map((o) =>
        o.id === id
          ? {
              ...o,
              status: value,

              stockRestored:
                o.stockRestored ||
                value === "Dibatalkan",
            }
          : o
      )
    );

    setMessage(`Status pesanan: ${value}`);
  }

  /* ADMIN CRUD PRODUCTS */

  function saveProduct(event) {
    event.preventDefault();

    const info = getCollectionInfo(
      form.collection
    );

    if (!info) {
      setMessage("Kategori tidak valid.");
      return;
    }

    const product = {
      id: editingId ?? Date.now(),

      name: form.name.trim(),

      collection: form.collection,

      category: info.category,

      price: Number(form.price),

      stock: Number(form.stock),

      image: form.image,

      description: form.description.trim(),

      keywords: form.keywords.trim(),

      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),

      colors: form.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (
      !product.name ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0 ||
      !product.sizes.length ||
      !product.colors.length
    ) {
      setMessage("Periksa kembali data produk.");
      return;
    }

    if (
      product.image &&
      !localPhotos.some(
        (photo) =>
          photo.url === product.image &&
          FOLDERS[
            normalize(photo.folder)
          ].title === product.collection
      )
    ) {
      setMessage(
        "Pilih foto sesuai kategori produk."
      );

      return;
    }

    if (
      product.image &&
      products.some(
        (p) =>
          p.id !== editingId &&
          p.image === product.image
      )
    ) {
      setMessage(
        "Foto sudah digunakan. Edit produk tersebut."
      );
      return;
    }

    if (editingId !== null) {
      const previous = products.find(
        (p) => p.id === editingId
      );

      if (
        previous?.image &&
        previous.image !== product.image
      ) {
        localStorage.setItem(
          "lumina_deleted_local_v1",
          JSON.stringify([
            ...new Set([
              ...readArray(
                "lumina_deleted_local_v1"
              ),
              `local:${previous.image}`,
            ]),
          ])
        );
      }

      setProducts((old) =>
        old.map((p) =>
          p.id === editingId ? product : p
        )
      );

      setCart((old) =>
        old.map((p) =>
          p.id === editingId
            ? { ...p, ...product }
            : p
        )
      );
    } else {
      setProducts((old) => [...old, product]);
    }

    setEditingId(null);

    setForm(EMPTY_FORM);

    setMessage("Produk berhasil disimpan.");
  }

  function editProduct(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,

      collection: product.collection,

      price: String(product.price),

      stock: String(product.stock),

      image: product.image || "",

      description: product.description || "",

      keywords: product.keywords || "",

      sizes: (product.sizes || []).join(","),

      colors: (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const pendingOrder = orders.some(
      (order) =>
        !["Selesai", "Dibatalkan"].includes(
          statusOf(order.status)
        ) &&
        (order.items || []).some(
          (item) => item.id === id
        )
    );

    if (pendingOrder) {
      setMessage(
        "Selesaikan pesanan aktif sebelum menghapus produk."
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
      (p) => p.id === id
    );

    const deleted = readArray(
      "lumina_deleted_local_v1"
    );

    localStorage.setItem(
      "lumina_deleted_local_v1",
      JSON.stringify([
        ...new Set([
          ...deleted,
          String(id),
          ...(product?.image
            ? [`local:${product.image}`]
            : []),
        ]),
      ])
    );

    setProducts((old) =>
      old.filter((p) => p.id !== id)
    );

    setCart((old) =>
      old.filter((p) => p.id !== id)
    );

    setWishlist((old) =>
      old.filter((item) => item !== id)
    );

    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }

    setMessage("Produk berhasil dihapus.");
  }

  const gridProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onAdd: addToCart,
  };

  /* ==========================================
     WEBSITE INTERFACE
  ========================================== */

  return (
    <div
      className={
        `lumina ${
          page === "admin" ? "admin-mode" : ""
        }`
      }
    >

      {/* HEADER AND NAVIGATION */}

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
              <button
                onClick={() => navigate("home")}
              >
                Home
              </button>

              <button
                onClick={() => selectCategory("All")}
              >
                Shop
              </button>

              <button
                onClick={() => selectCategory("Pria")}
              >
                Men
              </button>

              <button
                onClick={() => selectCategory("Wanita")}
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
                onClick={() => navigate("wishlist")}
              >
                ♡ Wishlist ({wishlist.length})
              </button>

              <button
                onClick={() => navigate("admin")}
              >
                Admin Demo
              </button>
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

      {/* ==========================================
         HOME PAGE
      ========================================== */}

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
                Temukan koleksi pakaian pria,
                pakaian wanita, batik wanita,
                sepatu, tas, dan aksesori
                dengan gaya modern dan elegan.
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
                src={heroImage}
                alt="Lumina Fashion"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "#e9ded3",
                }}
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧

              <strong>Premium Fashion</strong>

              <span>Koleksi modern dan elegan</span>
            </div>

            <div>
              ♡

              <strong>
                {localPhotos.length} Foto Koleksi
              </strong>

              <span>Galeri fashion lokal</span>
            </div>

            <div>
              ✦

              <strong>Seven Collections</strong>

              <span>Tujuh kategori pilihan</span>
            </div>
          </section>

          <CategorySection
            products={products}
            onSelect={selectCategory}
          />

          <section className="container section">
            <p className="eyebrow center">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Featured Collection
            </h2>

            <p className="section-description">
              Temukan inspirasi gaya terbaru
              dari koleksi pilihan LUMINA STORE.
            </p>

            <ProductGrid
              items={featured}
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

            <p>
              Modern fashion. Timeless elegance.
              Discover your signature style.
            </p>

            <button
              className="btn-dark"
              onClick={() => selectCategory("All")}
            >
              Shop Now →
            </button>
          </section>
        </>
      )}

      {/* ==========================================
         SHOP PAGE
      ========================================== */}

      {page === "shop" && (
        <main className="container section">
          <p className="eyebrow center">
            THE LUMINA COLLECTION
          </p>

          <h1 className="section-title">
            Shop Our Collection
          </h1>

          <p className="section-description">
            Jelajahi pakaian, batik wanita,
            sepatu, tas dan aksesori favoritmu.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {CATEGORIES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  category === value
                    ? "btn-dark"
                    : "btn-light"
                }
                style={{ borderRadius: 30 }}
                onClick={() => {
                  setCategory(value);
                  setSizeFilter("");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Cari baju, batik, sepatu, tas..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSizeFilter("");
              }}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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

          <div
            className="toolbar"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,180px),1fr))",
            }}
          >
            <select
              value={sizeFilter}
              onChange={(e) =>
                setSizeFilter(e.target.value)
              }
            >
              <option value="">
                Semua Ukuran
              </option>

              {sizeOptions.map((size) => (
                <option key={size}>
                  {size}
                </option>
              ))}
            </select>

            <select
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value)
              }
            >
              <option value="">
                Semua Harga
              </option>

              <option value="150000">
                Maks. Rp150.000
              </option>

              <option value="250000">
                Maks. Rp250.000
              </option>

              <option value="350000">
                Maks. Rp350.000
              </option>

              <option value="500000">
                Maks. Rp500.000
              </option>
            </select>

            <button
              className="btn-light"
              onClick={() => {
                setCategory("All");
                setSearch("");
                setSort("default");
                setSizeFilter("");
                setMaxPrice("");
                setPhotoOnly(true);
              }}
            >
              Reset Filter
            </button>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={photoOnly}
              onChange={(e) =>
                setPhotoOnly(e.target.checked)
              }
            />

            Tampilkan hanya produk bergambar
          </label>

          <p
            className="muted"
            style={{ margin: "20px 0" }}
          >
            {visibleProducts.length} produk ditemukan
          </p>

          <ProductGrid
            items={visibleProducts}
            {...gridProps}
          />
        </main>
      )}

      {/* ==========================================
         PRODUCT DETAIL
      ========================================== */}

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
                overflow: "hidden",
                borderRadius: 14,
                background: "#f2ece5",
              }}
            >
              <ProductImage
                src={selected.image}
                alt={selected.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
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

              <p className="muted">
                Stok tersedia: {selected.stock}
              </p>

              <label>Pilih Ukuran</label>

              <div className="option-row">
                {(selected.sizes || []).map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
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
                      type="button"
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
                style={{ marginTop: 12 }}
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

      {/* ==========================================
         WISHLIST
      ========================================== */}

      {page === "wishlist" && (
        <main className="container section">
          <p className="eyebrow center">
            YOUR FAVORITES
          </p>

          <h1 className="section-title">
            My Wishlist ♡
          </h1>

          <p className="section-description">
            Simpan koleksi fashion favoritmu.
          </p>

          <ProductGrid
            items={products.filter(
              (p) => wishlist.includes(p.id)
            )}
            {...gridProps}
          />
        </main>
      )}

      {/* ==========================================
         SHOPPING CART
      ========================================== */}

      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {!cart.length && (
                <>
                  <p>Keranjang masih kosong.</p>

                  <button
                    className="btn-dark"
                    onClick={() => selectCategory("All")}
                  >
                    Mulai Belanja →
                  </button>
                </>
              )}

              {cart.map((item) => (
                <div
                  className="cart-row"
                  key={item.key}
                >
                  <div
                    style={{
                      width: 100,
                      height: 125,
                      flexShrink: 0,
                    }}
                  >
                    <ProductImage
                      src={
                        products.find(
                          (p) => p.id === item.id
                        )?.image
                      }
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div className="grow">
                    <h3>{item.name}</h3>

                    <p className="muted">
                      {item.size} / {item.color}
                    </p>

                    <strong>
                      {rupiah(item.price)}
                    </strong>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQuantity(item.key, -1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          changeQuantity(item.key, 1)
                        }
                      >
                        +
                      </button>

                      <button
                        onClick={() =>
                          setCart((old) =>
                            old.filter(
                              (p) => p.key !== item.key
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
                disabled={!cart.length}
                onClick={() => navigate("checkout")}
              >
                Continue to Checkout →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ==========================================
         CHECKOUT
      ========================================== */}

      {page === "checkout" && (
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

              <label>Alamat Pengiriman</label>

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

              <label>Metode Pengiriman</label>

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
                Checkout hanya simulasi.
                Gunakan informasi pembeli fiktif.
              </p>

              <button
                type="submit"
                className="btn-dark wide"
                disabled={!cart.length}
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <div className="panel summary">
              <h2>Ringkasan Pesanan</h2>

              {cart.map((item) => (
                <div
                  className="between"
                  key={item.key}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <strong>
                    {rupiah(item.price * item.quantity)}
                  </strong>
                </div>
              ))}

              <div className="between">
                <span>Subtotal</span>

                <strong>{rupiah(subtotal)}</strong>
              </div>

              <div className="between">
                <span>Pengiriman</span>

                <strong>{rupiah(shippingFee)}</strong>
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

      {/* ==========================================
         SUCCESS PAGE
      ========================================== */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h1>Pesanan Berhasil!</h1>

            <p>
              Pesanan simulasi telah tercatat
              di Dashboard Admin LUMINA STORE.
            </p>

            <p>
              Tidak ada pembayaran nyata.
            </p>

            <button
              className="btn-dark"
              onClick={() => navigate("home")}
            >
              Kembali ke Home
            </button>
          </div>
        </main>
      )}

      {/* ==========================================
         ADMIN DASHBOARD
      ========================================== */}

      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          onBack={() => navigate("home")}
          onStatus={updateStatus}
          onSave={saveProduct}
          onEdit={editProduct}
          onDelete={deleteProduct}
          form={form}
          setForm={setForm}
          editingId={editingId}
          onCancel={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
        />
      )}

      {/* ==========================================
         FOOTER
      ========================================== */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>

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
            © {new Date().getFullYear()}
            {" "}
            LUMINA STORE — Demo Only
          </p>
        </footer>
      )}

      {/* NOTIFICATION */}

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
