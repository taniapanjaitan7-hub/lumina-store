
import { useEffect, useState } from "react";
import AuthPage from "./Auth.jsx";
import productImages from "./product-images.json";
import "./App.css";

/* =====================================================
   LUMINA STORE
   Home, Shop, Detail, Wishlist, Cart, Checkout
   Login, Register, Customer Orders, Admin Dashboard
===================================================== */

const CATEGORIES = [
  {
    folder: "pria",
    name: "Pria",
    label: "Baju Pria",
    category: "Fashion",
    price: 179000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "wanita",
    name: "Wanita",
    label: "Baju Wanita",
    category: "Fashion",
    price: 199000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "batik wanita",
    name: "Batik Wanita",
    label: "Batik Wanita",
    category: "Fashion",
    price: 235000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "sepatu pria",
    name: "Sepatu Pria",
    label: "Sepatu Pria",
    category: "Shoes",
    price: 295000,
    sizes: ["39", "40", "41", "42", "43", "44"],
  },
  {
    folder: "sepatu wanita",
    name: "Sepatu Wanita",
    label: "Sepatu Wanita",
    category: "Shoes",
    price: 245000,
    sizes: ["35", "36", "37", "38", "39", "40"],
  },
  {
    folder: "tas wanita",
    name: "Tas Wanita",
    label: "Tas Wanita",
    category: "Accessories",
    price: 249000,
    sizes: ["All Size"],
  },
  {
    folder: "aksesoris",
    name: "Accessories",
    label: "Aksesori",
    category: "Accessories",
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

const EMPTY_FORM = {
  name: "",
  collection: "Pria",
  price: "",
  stock: "",
  image: "",
  description: "",
  keywords: "",
  sizes: "S,M,L,XL,XXL",
  colors: "Sesuai foto",
};

const EMPTY_CHECKOUT = {
  name: "",
  phone: "",
  address: "",
  shipping: "regular",
};

/* =====================================================
   HELPERS
===================================================== */

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function readData(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const value = readData(key, []);
  return Array.isArray(value) ? value : [];
}

function getInfo(collection) {
  return CATEGORIES.find(
    (item) => item.name === collection
  );
}

function imageUrl(src) {
  if (!src) return "";

  if (src.startsWith("/images/")) {
    const base = import.meta.env.BASE_URL.replace(
      /\/$/,
      ""
    );

    const path = src
      .split("/")
      .map((part, index) =>
        index === 0
          ? ""
          : encodeURIComponent(
              decodeURIComponent(part)
            )
      )
      .join("/");

    return base + path;
  }

  return src;
}

function statusOf(value) {
  return STATUSES.includes(value)
    ? value
    : "Pesanan Baru";
}

function listFromText(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =====================================================
   FOTO LOKAL DARI product-images.json
===================================================== */

const localPhotos = (
  Array.isArray(productImages)
    ? productImages
    : []
)
  .filter(
    (photo) =>
      photo &&
      typeof photo.folder === "string" &&
      typeof photo.url === "string" &&
      CATEGORIES.some(
        (item) =>
          item.folder === normalize(photo.folder)
      )
  )
  .sort((a, b) =>
    a.url.localeCompare(b.url, undefined, {
      numeric: true,
    })
  );

const AUTO_PRODUCTS = localPhotos.map((photo) => {
  const info = CATEGORIES.find(
    (item) =>
      item.folder === normalize(photo.folder)
  );

  return {
    id: `local:${photo.url}`,
    name: `${info.label} — ${photo.name}`,
    collection: info.name,
    category: info.category,
    price: info.price,
    stock: 20,
    image: photo.url,
    description:
      `Koleksi ${info.label} dari LUMINA STORE. ` +
      "Harga dan stok masih berupa data demo.",
    keywords: `${info.label} ${photo.name}`,
    sizes: [...info.sizes],
    colors: ["Sesuai foto"],
  };
});

/* =====================================================
   FILTER KATALOG LAMA
   Tidak menghapus data transaksi lama
===================================================== */

function determineCollection(product) {
  const matchedPhoto = localPhotos.find(
    (photo) => photo.url === product.image
  );

  if (matchedPhoto) {
    return CATEGORIES.find(
      (item) =>
        item.folder === normalize(matchedPhoto.folder)
    )?.name || "";
  }

  const text = normalize([
    product.name,
    product.collection,
    product.keywords,
  ].join(" "));

  if (
    /kebaya|anak|kids|keluarga|family|couple|sarimbit/.test(
      text
    )
  ) {
    return "";
  }

  if (getInfo(product.collection)) {
    return product.collection;
  }

  if (text.includes("batik")) {
    return /wanita|perempuan/.test(text)
      ? "Batik Wanita"
      : "";
  }

  if (
    /tas wanita|handbag|tote bag|sling bag|shoulder bag/.test(
      text
    )
  ) {
    return "Tas Wanita";
  }

  if (
    product.category === "Shoes" ||
    /sepatu|sneakers|heels|loafers|pantofel/.test(
      text
    )
  ) {
    if (/wanita|perempuan/.test(text)) {
      return "Sepatu Wanita";
    }

    if (/pria|laki-laki/.test(text)) {
      return "Sepatu Pria";
    }

    return "";
  }

  if (product.category === "Accessories") {
    return "Accessories";
  }

  if (/wanita|women|blouse|perempuan/.test(text)) {
    return "Wanita";
  }

  if (/pria|men|kemeja|hoodie|polo/.test(text)) {
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

      const collection = determineCollection(product);
      const info = getInfo(collection);

      if (!info) return null;

      const validPhoto = localPhotos.some(
        (photo) =>
          photo.url === product.image &&
          normalize(photo.folder) === info.folder
      );

      return {
        ...product,
        collection,
        category: info.category,
        image: validPhoto ? product.image : "",
        sizes:
          Array.isArray(product.sizes) &&
          product.sizes.length
            ? product.sizes
            : [...info.sizes],
        colors:
          Array.isArray(product.colors) &&
          product.colors.length
            ? product.colors
            : ["Sesuai foto"],
      };
    })
    .filter(Boolean);

  const usedIds = new Set(
    existing.map((product) => String(product.id))
  );

  const usedPhotos = new Set(
    existing.map((product) => product.image)
  );

  const additional = AUTO_PRODUCTS.filter(
    (product) =>
      !usedIds.has(String(product.id)) &&
      !usedPhotos.has(product.image) &&
      !deleted.includes(product.id)
  );

  return [...existing, ...additional];
}

/* =====================================================
   GAMBAR PRODUK
===================================================== */

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#eee6de",
          color: "#947963",
          textAlign: "center",
          ...style,
        }}
      >
        <span style={{ fontSize: 27 }}>▧</span>
        <small>Foto belum tersedia</small>
      </div>
    );
  }

  return (
    <img
      src={imageUrl(src)}
      alt={alt || "Lumina Collection"}
      loading="lazy"
      onError={() => setFailed(src)}
      style={style}
    />
  );
}

/* =====================================================
   KARTU PRODUK
===================================================== */

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
              background: "#f3efeb",
            }}
          />
        </button>

        <button
          type="button"
          className="heart"
          onClick={() => onFavorite(product.id)}
          aria-label="Tambah ke wishlist"
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
  if (!items.length) {
    return (
      <p className="empty">
        Belum ada produk yang sesuai.
      </p>
    );
  }

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
    </div>
  );
}

/* =====================================================
   KATEGORI HOMEPAGE
===================================================== */

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
        Temukan tujuh kategori fashion pilihan
        LUMINA STORE.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(100%,220px),1fr))",
          gap: 22,
        }}
      >
        {CATEGORIES.map((category) => {
          const items = products.filter(
            (product) =>
              product.collection === category.name
          );

          const image = items.find(
            (item) => item.image
          )?.image;

          return (
            <button
              key={category.folder}
              type="button"
              onClick={() =>
                onSelect(category.name)
              }
              style={{
                position: "relative",
                height: 310,
                border: 0,
                padding: 0,
                borderRadius: 15,
                overflow: "hidden",
                background: "#e9ded3",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <ProductImage
                src={image}
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
                  padding: 23,
                  gap: 8,
                  color: "white",
                  background:
                    "linear-gradient(transparent 20%,rgba(34,25,19,.85))",
                }}
              >
                <small>LUMINA COLLECTION</small>

                <strong
                  style={{
                    fontSize: 25,
                    fontFamily: "Georgia,serif",
                  }}
                >
                  {category.label}
                </strong>

                <span>
                  {items.length} produk →
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* =====================================================
   TABEL PESANAN
===================================================== */

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
            <th>Pesanan</th>
            <th>Pembeli</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = statusOf(order.status);

            return (
              <tr key={order.id}>
                <td>
                  <strong>{order.id}</strong>
                  <p>
                    {order.items?.[0]?.name ||
                      "Produk"}
                  </p>
                </td>

                <td>{order.customer}</td>

                <td>
                  {rupiah(order.total)}
                </td>

                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={
                        status === "Selesai" ||
                        status === "Dibatalkan"
                      }
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
              <td colSpan={4}>
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({
  products,
  orders,
  onBack,
  onSave,
  onEdit,
  onDelete,
  onStatus,
  form,
  setForm,
  editingId,
  onCancel,
}) {
  const [section, setSection] =
    useState("overview");

  const [search, setSearch] =
    useState("");

  const [photoFolder, setPhotoFolder] =
    useState("Semua");

  const [year, setYear] =
    useState(new Date().getFullYear());

  const completed = orders.filter(
    (order) =>
      statusOf(order.status) === "Selesai"
  );

  const revenue = completed.reduce(
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

  const months = Array.from(
    { length: 12 },
    (_, index) => {
      const total = completed
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
        );

      return {
        month: new Date(
          year,
          index,
          1
        ).toLocaleString("id-ID", {
          month: "short",
        }),
        total,
      };
    }
  );

  const maxRevenue = Math.max(
    1,
    ...months.map((item) => item.total)
  );

  const filteredProducts = products.filter(
    (product) =>
      normalize(product.name).includes(
        normalize(search)
      )
  );

  const filteredOrders = orders
    .filter((order) =>
      normalize(
        `${order.id} ${order.customer}`
      ).includes(normalize(search))
    )
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    );

  const filteredPhotos = localPhotos.filter(
    (photo) =>
      (
        photoFolder === "Semua" ||
        normalize(photo.folder) ===
          normalize(photoFolder)
      ) &&
      normalize(
        `${photo.name} ${photo.folder}`
      ).includes(normalize(search))
  );

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
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
      <aside
        className="lum-dash-sidebar"
        style={{
          background: "#302720",
          color: "#fff",
        }}
      >
        <div className="lum-dash-logo">
          LUMINA<span>.</span>
        </div>

        <p style={{ color: "#d9c7b6" }}>
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
              type="button"
              className={
                section === key ? "active" : ""
              }
              onClick={() => {
                setSection(key);
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

            <h1>{titles[section]}</h1>
          </div>

          <div className="lum-dash-search">
            <input
              type="search"
              placeholder="Cari produk / pesanan..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </header>

        {(section === "overview" ||
          section === "reports") && (
          <div className="lum-dash-stats">
            {[
              ["Pendapatan", rupiah(revenue)],
              ["Pesanan", orders.length],
              ["Produk", products.length],
              ["Total Stok", totalStock],
            ].map(([label, value], index) => (
              <div
                className="lum-dash-metric"
                key={label}
                style={{
                  background:
                    index === 0
                      ? "#49392d"
                      : "#fff",
                  color:
                    index === 0
                      ? "#fff"
                      : "#302720",
                  borderRadius: 16,
                }}
              >
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {section === "overview" && (
          <>
            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <h2>Revenue Analytics</h2>

                <select
                  value={year}
                  onChange={(event) =>
                    setYear(
                      Number(event.target.value)
                    )
                  }
                >
                  {[
                    ...new Set([
                      new Date().getFullYear(),
                      ...orders
                        .map((order) =>
                          new Date(
                            order.date
                          ).getFullYear()
                        )
                        .filter(Number.isFinite),
                    ]),
                  ]
                    .sort((a, b) => b - a)
                    .map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    ))}
                </select>
              </div>

              <div className="lum-dash-chart-total">
                {rupiah(
                  months.reduce(
                    (sum, item) =>
                      sum + item.total,
                    0
                  )
                )}
              </div>

              <div className="lum-dash-chart">
                {months.map((item) => (
                  <div
                    key={item.month}
                    className="lum-dash-bar-col"
                  >
                    <span>
                      {item.total > 0
                        ? `${Math.round(
                            item.total / 1000
                          )}rb`
                        : ""}
                    </span>

                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        style={{
                          height: `${
                            (item.total /
                              maxRevenue) *
                            100
                          }%`,
                          background: "#a6846b",
                        }}
                      />
                    </div>

                    <small>{item.month}</small>
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
                    "repeat(auto-fit,minmax(135px,1fr))",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                {CATEGORIES.map((item) => (
                  <button
                    key={item.name}
                    className="btn-light"
                    onClick={() => {
                      setPhotoFolder(item.folder);
                      setSection("gallery");
                    }}
                    style={{ padding: 20 }}
                  >
                    <strong>
                      {
                        products.filter(
                          (product) =>
                            product.collection ===
                            item.name
                        ).length
                      }
                    </strong>

                    <p>{item.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>

              <OrderTable
                orders={filteredOrders.slice(0, 5)}
              />
            </section>
          </>
        )}

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
                  const value = event.target.value;
                  const info = getInfo(value);

                  setForm((old) => ({
                    ...old,
                    collection: value,
                    image: "",
                    sizes: info.sizes.join(","),
                  }));
                }}
              >
                {CATEGORIES.map((item) => (
                  <option
                    key={item.name}
                    value={item.name}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <label>Harga (Rp)</label>
              <input
                type="number"
                required
                min="1"
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
                required
                min="0"
                value={form.stock}
                onChange={(event) =>
                  updateField(
                    "stock",
                    event.target.value
                  )
                }
              />

              <label>Foto Produk</label>
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
                  Pilih Foto Lokal
                </option>

                {localPhotos
                  .filter((photo) => {
                    const info = getInfo(
                      form.collection
                    );

                    return (
                      normalize(photo.folder) ===
                      info.folder
                    );
                  })
                  .map((photo) => (
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <label>Deskripsi</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
              />

              <label>Kata Kunci</label>
              <input
                value={form.keywords}
                onChange={(event) =>
                  updateField(
                    "keywords",
                    event.target.value
                  )
                }
              />

              <label>Ukuran</label>
              <input
                required
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
                required
                value={form.colors}
                onChange={(event) =>
                  updateField(
                    "colors",
                    event.target.value
                  )
                }
              />

              <button
                className="btn-dark"
                type="submit"
              >
                {editingId !== null
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={onCancel}
                >
                  Batal
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>
                Daftar Produk ({products.length})
              </h2>

              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="lum-dash-product-row"
                >
                  <div
                    style={{
                      width: 55,
                      height: 65,
                      flexShrink: 0,
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
                    <p>{rupiah(product.price)}</p>
                    <small>
                      Stok {product.stock}
                    </small>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() => onEdit(product)}
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
            </section>
          </div>
        )}

        {section === "orders" && (
          <section className="lum-dash-card">
            <h2>Manajemen Pesanan</h2>

            <OrderTable
              orders={filteredOrders}
              editable
              onStatus={onStatus}
            />
          </section>
        )}

        {section === "reports" && (
          <section className="lum-dash-card">
            <h2>Laporan Penjualan</h2>

            <p>
              Pendapatan berasal dari pesanan
              yang sudah berstatus Selesai.
            </p>

            <OrderTable
              orders={filteredOrders}
            />
          </section>
        )}

        {section === "gallery" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <h2>Galeri Foto Lokal</h2>

              <select
                value={photoFolder}
                onChange={(event) =>
                  setPhotoFolder(
                    event.target.value
                  )
                }
              >
                <option value="Semua">
                  Semua Folder
                </option>

                {CATEGORIES.map((item) => (
                  <option
                    key={item.folder}
                    value={item.folder}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <p>
              {filteredPhotos.length} foto ditemukan.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(145px,1fr))",
                gap: 15,
              }}
            >
              {filteredPhotos.map((photo) => (
                <article
                  key={photo.url}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ aspectRatio: "3/4" }}
                  >
                    <ProductImage
                      src={photo.url}
                      alt={photo.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
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
            ["Total Produk", products.length],
            ["Foto Lokal", localPhotos.length],
            ["Total Pesanan", orders.length],
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

          {!lowStock.length && (
            <p>Semua stok mencukupi.</p>
          )}

          {lowStock.map((item) => (
            <div
              className="lum-dash-stock"
              key={item.id}
            >
              <span>{item.name}</span>
              <strong>{item.stock}</strong>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}

/* =====================================================
   APP UTAMA
===================================================== */

export default function App() {
  const [products, setProducts] =
    useState(loadProducts);

  const [cart, setCart] = useState(() => {
    const ids = new Set(
      loadProducts().map((item) => item.id)
    );

    return readArray("lumina_cart_v1").filter(
      (item) => ids.has(item.id)
    );
  });

  const [wishlist, setWishlist] =
    useState(() =>
      readArray("lumina_wishlist_v1")
    );

  const [orders, setOrders] =
    useState(() =>
      readArray("lumina_orders_v1")
    );

  /* LOGIN DAN REGISTRASI */

  const [customer, setCustomer] =
    useState(() =>
      readData("lumina_session_v1", null)
    );

  const [authReturn, setAuthReturn] =
    useState("home");

  const [page, setPage] = useState(() =>
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

  /* =====================================================
     SIMPAN DATA
  ===================================================== */

  useEffect(() => {
    if (
      localStorage.getItem(
        "lumina_catalog_backup_before_auth_v1"
      ) === null
    ) {
      localStorage.setItem(
        "lumina_catalog_backup_before_auth_v1",
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
    if (customer) {
      localStorage.setItem(
        "lumina_session_v1",
        JSON.stringify(customer)
      );
    } else {
      localStorage.removeItem(
        "lumina_session_v1"
      );
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

  /* =====================================================
     PRODUK DAN FILTER
  ===================================================== */

  const selected = products.find(
    (item) => item.id === selectedId
  );

  const featured = products
    .filter((item) => item.image)
    .slice(0, 8);

  const visibleProducts = products
    .filter((item) => {
      const text = normalize(
        `${item.name} ${item.collection} ` +
        `${item.description} ${item.keywords}`
      );

      return (
        text.includes(normalize(search)) &&
        (
          category === "All" ||
          item.collection === category
        )
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

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity),
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
      (item) =>
        normalize(item.folder) === "wanita"
    )?.url ||
    localPhotos.find(
      (item) =>
        normalize(item.folder) === "pria"
    )?.url ||
    localPhotos[0]?.url;

  /* =====================================================
     NAVIGASI
  ===================================================== */

  function navigate(destination) {
    setPage(destination);

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        (
          destination === "admin"
            ? "#admin"
            : ""
        )
    );

    window.scrollTo(0, 0);
  }

  function selectCategory(value) {
    setCategory(value);
    setSearch("");
    navigate("shop");
  }

  function openProduct(product) {
    setSelectedId(product.id);

    setSelectedSize(
      product.sizes?.[0] || "All Size"
    );

    setSelectedColor(
      product.colors?.[0] ||
        "Sesuai foto"
    );

    navigate("detail");
  }

  /* =====================================================
     LOGIN / REGISTER / LOGOUT
  ===================================================== */

  function openAuth(returnPage = "home") {
    setAuthReturn(returnPage);
    navigate("auth");
  }

  function handleLoginSuccess(user) {
    setCustomer(user);

    setCheckout((previous) => ({
      ...previous,
      name: previous.name || user.name,
    }));

    setMessage(
      `Selamat datang, ${user.name}!`
    );

    navigate(authReturn);
  }

  function handleLogout() {
    setCustomer(null);
    setMessage("Berhasil logout.");
    navigate("home");
  }

  /* =====================================================
     WISHLIST
  ===================================================== */

  function toggleWishlist(id) {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter(
            (item) => item !== id
          )
        : [...previous, id]
    );
  }

  /* =====================================================
     KERANJANG
  ===================================================== */

  function addToCart(
    product,
    chosenSize,
    chosenColor
  ) {
    const size =
      chosenSize ||
      product.sizes?.[0] ||
      "All Size";

    const color =
      chosenColor ||
      product.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      product.id,
      size,
      color,
    ]);

    const used = cart
      .filter(
        (item) => item.id === product.id
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.quantity),
        0
      );

    if (used >= product.stock) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) =>
          item.id === product.id &&
          item.size === size &&
          item.color === color
      );

      if (existing) {
        return previous.map((item) =>
          item.key === existing.key
            ? {
                ...item,
                quantity:
                  Number(item.quantity) + 1,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          key,
          size,
          color,
          quantity: 1,
        },
      ];
    });

    setMessage(
      "Produk berhasil masuk keranjang."
    );
  }

  function changeQuantity(key, change) {
    const item = cart.find(
      (entry) => entry.key === key
    );

    if (!item) return;

    const product = products.find(
      (entry) => entry.id === item.id
    );

    const totalUsed = cart
      .filter(
        (entry) => entry.id === item.id
      )
      .reduce(
        (sum, entry) =>
          sum + Number(entry.quantity),
        0
      );

    if (
      change > 0 &&
      (
        !product ||
        totalUsed >= product.stock
      )
    ) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((previous) =>
      previous
        .map((entry) =>
          entry.key === key
            ? {
                ...entry,
                quantity:
                  Number(entry.quantity) +
                  change,
              }
            : entry
        )
        .filter(
          (entry) => entry.quantity > 0
        )
    );
  }

  /* =====================================================
     CHECKOUT
  ===================================================== */

  function placeOrder(event) {
    event.preventDefault();

    if (!customer) {
      openAuth("checkout");
      return;
    }

    if (!cart.length) return;

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(
        checkout.phone.trim()
      )
    ) {
      setMessage(
        "Periksa kembali data pembeli."
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
        (item) => item.id === id
      );

      if (
        !product ||
        product.stock < quantity
      ) {
        setMessage(
          "Stok produk tidak mencukupi."
        );
        return;
      }
    }

    const order = {
      id: `LM-${Date.now()}`,
      date: new Date().toISOString(),
      customer: checkout.name.trim(),
      customerId: customer.id,
      customerEmail: customer.email,
      phone: checkout.phone,
      address: checkout.address,
      shipping: checkout.shipping,
      items: cart.map(
        (item) => ({ ...item })
      ),
      total: subtotal + shippingFee,
      status: "Pesanan Baru",
      stockRestored: false,
    };

    setOrders((previous) => [
      order,
      ...previous,
    ]);

    setProducts((previous) =>
      previous.map((item) => ({
        ...item,
        stock:
          Number(item.stock) -
          (quantities.get(item.id) || 0),
      }))
    );

    setCart([]);
    setCheckout(EMPTY_CHECKOUT);
    navigate("success");
  }

  /* =====================================================
     STATUS PESANAN
  ===================================================== */

  function updateStatus(id, nextStatus) {
    if (!STATUSES.includes(nextStatus)) {
      return;
    }

    const order = orders.find(
      (item) => item.id === id
    );

    if (!order) return;

    const previousStatus = statusOf(
      order.status
    );

    if (
      previousStatus === "Selesai" ||
      previousStatus === "Dibatalkan"
    ) {
      return;
    }

    if (
      nextStatus === "Dibatalkan" &&
      !order.stockRestored
    ) {
      setProducts((previous) =>
        previous.map((product) => ({
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

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              stockRestored:
                item.stockRestored ||
                nextStatus === "Dibatalkan",
            }
          : item
      )
    );

    setMessage(
      `Status pesanan: ${nextStatus}`
    );
  }

  /* =====================================================
     ADMIN CRUD PRODUK
  ===================================================== */

  function saveProduct(event) {
    event.preventDefault();

    const info = getInfo(form.collection);

    if (!info) {
      setMessage("Kategori tidak valid.");
      return;
    }

    const product = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      collection: info.name,
      category: info.category,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image,
      description: form.description.trim(),
      keywords: form.keywords.trim(),
      sizes: listFromText(form.sizes),
      colors: listFromText(form.colors),
    };

    if (
      !product.name ||
      product.price <= 0 ||
      !Number.isFinite(product.price) ||
      !Number.isInteger(product.stock) ||
      product.stock < 0 ||
      !product.sizes.length ||
      !product.colors.length
    ) {
      setMessage(
        "Data produk belum lengkap."
      );
      return;
    }

    if (
      product.image &&
      !localPhotos.some(
        (photo) =>
          photo.url === product.image &&
          normalize(photo.folder) ===
            info.folder
      )
    ) {
      setMessage(
        "Pilih foto sesuai kategori."
      );
      return;
    }

    if (editingId !== null) {
      setProducts((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? product
            : item
        )
      );
    } else {
      setProducts((previous) => [
        ...previous,
        product,
      ]);
    }

    setEditingId(null);
    setForm({ ...EMPTY_FORM });
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
      description:
        product.description || "",
      keywords: product.keywords || "",
      sizes: (
        product.sizes || []
      ).join(","),
      colors: (
        product.colors || []
      ).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const hasActiveOrders = orders.some(
      (order) =>
        !["Selesai", "Dibatalkan"].includes(
          statusOf(order.status)
        ) &&
        order.items?.some(
          (item) => item.id === id
        )
    );

    if (hasActiveOrders) {
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

    const product = products.find(
      (item) => item.id === id
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

    setProducts((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    setCart((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    setWishlist((previous) =>
      previous.filter(
        (item) => item !== id
      )
    );

    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setMessage("Produk berhasil dihapus.");
  }

  /* =====================================================
     PROPS KARTU PRODUK
  ===================================================== */

  const productProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onAdd: addToCart,
  };

  const myOrders = customer
    ? orders.filter(
        (order) =>
          order.customerId === customer.id
      )
    : [];

  /* =====================================================
     TAMPILAN WEBSITE
  ===================================================== */

  return (
    <div
      className={`lumina ${
        page === "admin"
          ? "admin-mode"
          : ""
      }`}
    >

      {/* NAVBAR */}

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
                    onClick={handleLogout}
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
                Temukan koleksi pakaian pria,
                wanita, batik, sepatu, tas,
                dan aksesori pilihan.
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
                src={heroImage}
                alt="Lumina Fashion"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
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
                {localPhotos.length} Foto Koleksi
              </strong>
              <span>Katalog Lokal</span>
            </div>

            <div>
              ✦
              <strong>Seven Collections</strong>
              <span>Fashion for Everyone</span>
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

            <ProductGrid
              items={featured}
              {...productProps}
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

          <section className="promo">
            <p className="eyebrow">
              THE LUMINA EDIT
            </p>

            <h2>
              Confidence in Every Style.
            </h2>

            <p>
              Discover your signature style.
            </p>

            <button
              className="btn-dark"
              onClick={() =>
                selectCategory("All")
              }
            >
              Shop Now →
            </button>
          </section>
        </>
      )}

      {/* SHOP */}

      {page === "shop" && (
        <main className="container section">
          <p className="eyebrow center">
            THE LUMINA COLLECTION
          </p>

          <h1 className="section-title">
            Shop Our Collection
          </h1>

          <p className="section-description">
            Jelajahi berbagai koleksi pilihanmu.
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
              placeholder="Cari produk..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
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
                Nama A-Z
              </option>
            </select>
          </div>

          <p className="muted">
            {visibleProducts.length} produk ditemukan
          </p>

          <ProductGrid
            items={visibleProducts}
            {...productProps}
          />
        </main>
      )}

      {/* DETAIL PRODUK */}

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
            <div
              style={{
                aspectRatio: "4/5",
                overflow: "hidden",
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

              <p>
                Stok tersedia: {selected.stock}
              </p>

              <label>Ukuran</label>

              <div className="option-row">
                {selected.sizes?.map((size) => (
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
                ))}
              </div>

              <label>Warna</label>

              <div className="option-row">
                {selected.colors?.map((color) => (
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
                ))}
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
            items={products.filter(
              (item) =>
                wishlist.includes(item.id)
            )}
            {...productProps}
          />
        </main>
      )}

      {/* SHOPPING CART */}

      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {!cart.length && (
                <p>Keranjang masih kosong.</p>
              )}

              {cart.map((item) => (
                <div
                  key={item.key}
                  className="cart-row"
                >
                  <div
                    style={{
                      width: 100,
                      height: 125,
                    }}
                  >
                    <ProductImage
                      src={item.image}
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
                          setCart((previous) =>
                            previous.filter(
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
              <h2>Order Summary</h2>

              <div className="between">
                <span>Jumlah Produk</span>
                <strong>{cartCount}</strong>
              </div>

              <div className="between">
                <span>Subtotal</span>
                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <button
                className="btn-dark wide"
                disabled={!cart.length}
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
          onSuccess={handleLoginSuccess}
          onBack={() =>
            navigate("home")
          }
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
              onSubmit={placeOrder}
            >
              <h2>Informasi Pembeli</h2>

              <label>Nama Lengkap</label>
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

              <label>Nomor Telepon</label>
              <input
                required
                type="tel"
                value={checkout.phone}
                onChange={(event) =>
                  setCheckout({
                    ...checkout,
                    phone: event.target.value,
                  })
                }
              />

              <label>Alamat</label>
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

              <label>Pengiriman</label>
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
                  Regular — Rp12.000
                </option>
                <option value="express">
                  Express — Rp25.000
                </option>
              </select>

              <p className="muted">
                Checkout simulasi. Tidak ada
                pembayaran nyata.
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
          <h2>Silakan Login Terlebih Dahulu</h2>

          <button
            className="btn-dark"
            onClick={() =>
              openAuth("checkout")
            }
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

          <div className="panel">
            <h2>Profil Saya</h2>

            <p>
              Nama: <strong>{customer.name}</strong>
            </p>

            <p>Email: {customer.email}</p>

            <button
              className="btn-light"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <section
            className="panel"
            style={{ marginTop: 30 }}
          >
            <h2>Riwayat Pesanan Saya</h2>

            <OrderTable orders={myOrders} />
          </section>
        </main>
      )}

      {/* PESANAN BERHASIL */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">✓</div>

            <h1>Pesanan Berhasil!</h1>

            <p>
              Pesanan simulasi sudah tercatat.
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

      {/* ADMIN DASHBOARD */}

      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          onBack={() =>
            navigate("home")
          }
          onSave={saveProduct}
          onEdit={editProduct}
          onDelete={deleteProduct}
          onStatus={updateStatus}
          form={form}
          setForm={setForm}
          editingId={editingId}
          onCancel={() => {
            setEditingId(null);
            setForm({ ...EMPTY_FORM });
          }}
        />
      )}

      {/* FOOTER */}

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

      {/* NOTIFIKASI */}

      {message && (
        <div
          className="toast"
          role="status"
        >
          <span>{message}</span>

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
