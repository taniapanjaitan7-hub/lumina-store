
import { useEffect, useMemo, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import productImages from "./product-images.json";
import "./App.css";

/* =========================================
   LUMINA STORE - FULL APP.JSX
   SHOP DESIGN + CUSTOMER + ADMIN
========================================= */

const CATEGORIES = [
  { folder: "pria", name: "Pria", label: "Baju Pria", price: 179000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "wanita", name: "Wanita", label: "Baju Wanita", price: 199000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "batik wanita", name: "Batik Wanita", label: "Batik", price: 235000, sizes: ["S", "M", "L", "XL", "XXL"] },
  { folder: "sepatu pria", name: "Sepatu Pria", label: "Sepatu Pria", price: 295000, sizes: ["39", "40", "41", "42", "43", "44"] },
  { folder: "sepatu wanita", name: "Sepatu Wanita", label: "Sepatu Wanita", price: 245000, sizes: ["35", "36", "37", "38", "39", "40"] },
  { folder: "tas wanita", name: "Tas Wanita", label: "Tas", price: 249000, sizes: ["All Size"] },
  { folder: "aksesoris", name: "Accessories", label: "Aksesori", price: 129000, sizes: ["All Size"] },
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

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
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

function arrayFromText(value) {
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

function photoUrl(src) {
  if (!src) return "";

  if (/^(https?:|data:)/i.test(src)) return src;

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = String(src).replace(/\\/g, "/");
  const encoded = clean
    .split("/")
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part));
      } catch {
        return encodeURIComponent(part);
      }
    })
    .join("/");

  return base + (encoded.startsWith("/") ? "" : "/") + encoded;
}

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages) ? productImages : [])
      .filter((photo) =>
        photo?.url &&
        CATEGORIES.some(
          (category) =>
            category.folder === normalize(photo.folder)
        )
      )
      .map((photo) => ({
        ...photo,
        url: String(photo.url).replace(/\\/g, "/"),
      }))
      .map((photo) => [photo.url, photo])
  ).values(),
];

const INITIAL_PRODUCTS = PHOTOS.map((photo) => {
  const category = CATEGORIES.find(
    (item) => item.folder === normalize(photo.folder)
  );

  return {
    id: `local:${photo.url}`,
    name: `${category.label} — ${photo.name}`,
    collection: category.name,
    price: category.price,
    stock: 20,
    image: photo.url,
    sizes: category.sizes,
    colors: ["Sesuai foto"],
    description: `Koleksi ${category.label} dari LUMINA STORE.`,
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

  const knownPhotos = new Map(
    PHOTOS.map((photo) => [photo.url, photo])
  );

  const saved = existing.filter((product) => {
    if (!product || deleted.has(String(product.id))) {
      return false;
    }

    return (
      knownPhotos.has(product.image) ||
      String(product.id).startsWith("custom:")
    );
  }).map((product) => {
    const photo = knownPhotos.get(product.image);
    const category = photo
      ? CATEGORIES.find(
          (item) => item.folder === normalize(photo.folder)
        )
      : CATEGORIES.find(
          (item) => item.name === product.collection
        );

    return {
      ...product,
      collection: category?.name || "Pria",
      sizes: Array.isArray(product.sizes)
        ? product.sizes
        : category?.sizes || ["All Size"],
      colors: Array.isArray(product.colors)
        ? product.colors
        : ["Sesuai foto"],
    };
  });

  const usedPhotos = new Set(saved.map((p) => p.image));

  const additional = INITIAL_PRODUCTS.filter(
    (product) =>
      !usedPhotos.has(product.image) &&
      !deleted.has(product.id)
  );

  return [...saved, ...additional];
}

function ProductImage({ src, alt, style }) {
  const [failed, setFailed] = useState("");

  if (!src || failed === src) {
    return (
      <div className="lum-photo-placeholder" style={style}>
        <span>▧</span>
        <small>Foto belum tersedia</small>
      </div>
    );
  }

  return (
    <img
      src={photoUrl(src)}
      alt={alt}
      loading="lazy"
      style={style}
      onError={() => setFailed(src)}
    />
  );
}

function ProductCard({
  product,
  favorite,
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
        >
          <ProductImage
            src={product.image}
            alt={product.name}
          />
        </button>

        <span className="stock-label">
          {Number(product.stock) > 0
            ? "LUMINA COLLECTION"
            : "SOLD OUT"}
        </span>

        <button
          type="button"
          className="heart"
          onClick={() => onFavorite(product.id)}
          aria-label="Wishlist"
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="product-body">
        <small>{product.collection}</small>
        <h3>{product.name}</h3>
        <p className="price">{rupiah(product.price)}</p>
        <p className="muted">Stok: {product.stock}</p>

        <div className="product-actions">
          <button
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Lihat Detail
          </button>

          <button
            className="btn-dark"
            disabled={Number(product.stock) <= 0}
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
      <div className="lum-empty">
        <h3>Produk belum tersedia</h3>
        <p>Coba kategori atau pencarian lainnya.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          favorite={wishlist.includes(product.id)}
          onDetail={onDetail}
          onFavorite={onFavorite}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

/* =========================================
   DASHBOARD ADMIN
========================================= */

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
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("Semua");

  const finished = orders.filter(
    (order) => getStatus(order.status) === "Selesai"
  );

  const revenue = finished.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) => Number(product.stock) <= 5
  );

  const visibleProducts = products.filter(
    (product) =>
      normalize(`${product.name} ${product.collection}`)
        .includes(normalize(search))
  );

  const visibleOrders = orders.filter(
    (order) =>
      normalize(`${order.id} ${order.customer}`)
        .includes(normalize(search))
  );

  const visiblePhotos = PHOTOS.filter(
    (photo) =>
      (folder === "Semua" || normalize(photo.folder) === folder) &&
      normalize(`${photo.name} ${photo.folder}`)
        .includes(normalize(search))
  );

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function exportCSV() {
    const rows = [
      ["ID", "Tanggal", "Pelanggan", "Total", "Status"],
      ...orders.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.total,
        order.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => {
          let text = String(value ?? "");

          if (/^[=+\-@\t\r]/.test(text)) {
            text = "'" + text;
          }

          return `"${text.replaceAll('"', '""')}"`;
        }).join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
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

        <div className="lum-dash-sidebar-bottom">
          <button className="lum-dash-back" onClick={onBack}>
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <p className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </p>
            <h1>
              {tab === "overview" && "Dashboard Overview"}
              {tab === "products" && "Product Management"}
              {tab === "orders" && "Order Management"}
              {tab === "reports" && "Sales Report"}
              {tab === "gallery" && "Photo Gallery"}
            </h1>
          </div>

          <input
            placeholder="Cari produk atau pesanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        {tab === "overview" && (
          <>
            <div className="lum-dash-stats">
              {[
                ["Pendapatan Selesai", rupiah(revenue)],
                ["Total Pesanan", orders.length],
                ["Total Produk", products.length],
                ["Total Stok", totalStock],
              ].map(([label, value]) => (
                <div className="lum-dash-metric" key={label}>
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
                Pendapatan dihitung dari pesanan
                dengan status Selesai.
              </p>
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>
              <div className="lum-category-stats">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="btn-light"
                    onClick={() => {
                      setFolder(category.folder);
                      setTab("gallery");
                    }}
                  >
                    <strong>
                      {products.filter(
                        (p) => p.collection === category.name
                      ).length}
                    </strong>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>
              <OrderTable
                orders={orders.slice(0, 5)}
                onStatus={onStatus}
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
                {form.id === null ? "Tambah Produk" : "Edit Produk"}
              </h2>

              <label>Nama Produk</label>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />

              <label>Kategori</label>
              <select
                value={form.collection}
                onChange={(e) => {
                  const selected = CATEGORIES.find(
                    (item) => item.name === e.target.value
                  );
                  setForm((prev) => ({
                    ...prev,
                    collection: selected.name,
                    image: "",
                    sizes: selected.sizes.join(","),
                  }));
                }}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.name} value={category.name}>
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
                onChange={(e) => updateField("price", e.target.value)}
              />

              <label>Stok</label>
              <input
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
              />

              <label>Gambar</label>
              <select
                value={form.image}
                onChange={(e) => updateField("image", e.target.value)}
              >
                <option value="">Pilih gambar</option>
                {PHOTOS.filter(
                  (photo) =>
                    normalize(photo.folder) ===
                    CATEGORIES.find(
                      (item) => item.name === form.collection
                    )?.folder
                ).map((photo) => (
                  <option key={photo.url} value={photo.url}>
                    {photo.name}
                  </option>
                ))}
              </select>

              <div className="lum-admin-preview">
                <ProductImage src={form.image} alt="Preview" />
              </div>

              <label>Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
              />

              <label>Ukuran</label>
              <input
                value={form.sizes}
                onChange={(e) => updateField("sizes", e.target.value)}
              />

              <label>Warna</label>
              <input
                value={form.colors}
                onChange={(e) => updateField("colors", e.target.value)}
              />

              <button className="btn-dark" type="submit">
                Simpan Produk
              </button>

              {form.id !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={() => setForm({ ...DEFAULT_FORM })}
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>Daftar Produk ({products.length})</h2>

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
                    <strong>{product.name}</strong>
                    <p>{rupiah(product.price)}</p>
                    <small>Stok {product.stock}</small>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() => onEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
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
            <OrderTable
              orders={visibleOrders}
              onStatus={onStatus}
            />
            <button
              className="btn-dark"
              onClick={exportCSV}
            >
              Download Laporan CSV
            </button>
          </section>
        )}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>Galeri Foto Lokal</h2>

            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              <option value="Semua">Semua</option>
              {CATEGORIES.map((item) => (
                <option key={item.folder} value={item.folder}>
                  {item.label}
                </option>
              ))}
            </select>

            <p>{visiblePhotos.length} foto tersedia</p>

            <div className="lum-gallery">
              {visiblePhotos.map((photo) => (
                <article key={photo.url}>
                  <ProductImage
                    src={photo.url}
                    alt={photo.name}
                  />
                  <p>{photo.folder} / {photo.name}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="lum-dash-right">
        <section>
          <h3>Store Summary</h3>
          <p>Total Produk: {products.length}</p>
          <p>Foto Lokal: {PHOTOS.length}</p>
          <p>Total Pesanan: {orders.length}</p>
          <p>Stok Menipis: {lowStock.length}</p>
        </section>
      </aside>
    </div>
  );
}

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
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.items?.[0]?.name || "-"}</td>
              <td>{rupiah(order.total)}</td>
              <td>
                {editable ? (
                  <select
                    value={getStatus(order.status)}
                    disabled={["Selesai", "Dibatalkan"].includes(
                      getStatus(order.status)
                    )}
                    onChange={(e) =>
                      onStatus(order.id, e.target.value)
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  getStatus(order.status)
                )}
              </td>
            </tr>
          ))}

          {orders.length === 0 && (
            <tr>
              <td colSpan={5}>Belum ada pesanan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================
   MAIN APP
========================================= */

export default function App() {
  const [products, setProducts] = useState(loadProducts);
  const [orders, setOrders] = useState(
    () => readArray(KEY.orders)
  );
  const [customer, setCustomer] = useState(
    () => read(KEY.session, null)
  );
  const [cart, setCart] = useState(
    () => readArray(KEY.cart)
  );
  const [wishlist, setWishlist] = useState(
    () => readArray(KEY.wishlist)
  );
  const [page, setPage] = useState(
    () => location.hash === "#admin" ? "admin" : "home"
  );
  const [authReturn, setAuthReturn] = useState("home");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [checkout, setCheckout] = useState({
    ...DEFAULT_CHECKOUT,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      KEY.products,
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      KEY.orders,
      JSON.stringify(orders)
    );
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(KEY.cart, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      KEY.wishlist,
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem(
        KEY.session,
        JSON.stringify(customer)
      );
    } else {
      localStorage.removeItem(KEY.session);
    }
  }, [customer]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const visibleProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          (category === "All" ||
            product.collection === category) &&
          normalize(
            `${product.name} ${product.collection} ${product.description}`
          ).includes(normalize(search))
      )
      .sort((a, b) => {
        if (sort === "low") return a.price - b.price;
        if (sort === "high") return b.price - a.price;
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [products, category, search, sort]);

  const selected = products.find((p) => p.id === selectedId);

  const featured = CATEGORIES.flatMap((item) =>
    products
      .filter(
        (product) =>
          product.collection === item.name && product.image
      )
      .slice(0, 2)
  );

  const heroPhoto =
    PHOTOS.find(
      (photo) => normalize(photo.folder) === "wanita"
    )?.url || PHOTOS[0]?.url;

  const validCart = cart.filter((item) =>
    products.some((product) => product.id === item.id)
  );

  const cartCount = validCart.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const subtotal = validCart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  const shippingFee =
    checkout.shipping === "express" ? 25000 : 12000;

  const myOrders = customer
    ? orders.filter(
        (order) => order.customerId === customer.id
      )
    : [];

  function navigate(nextPage) {
    setPage(nextPage);

    history.replaceState(
      null,
      "",
      location.pathname +
        location.search +
        (nextPage === "admin" ? "#admin" : "")
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
    setSelectedSize(product.sizes?.[0] || "All Size");
    setSelectedColor(
      product.colors?.[0] || "Sesuai foto"
    );
    navigate("detail");
  }

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
    setMessage(`Selamat datang, ${user.name}!`);
  }

  function logout() {
    setCustomer(null);
    navigate("home");
    setMessage("Berhasil Logout.");
  }

  function toggleWishlist(id) {
    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

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
      .filter((item) => item.id === product.id)
      .reduce(
        (sum, item) => sum + Number(item.quantity),
        0
      );

    if (used >= Number(product.stock)) {
      setMessage("Stok tidak mencukupi.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);

      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
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

    setMessage("Produk ditambahkan ke keranjang.");
  }

  function changeQuantity(key, amount) {
    const item = cart.find((entry) => entry.key === key);
    if (!item) return;

    const product = products.find(
      (entry) => entry.id === item.id
    );

    const used = cart
      .filter((entry) => entry.id === item.id)
      .reduce(
        (sum, entry) => sum + Number(entry.quantity),
        0
      );

    if (
      amount > 0 &&
      (!product || used >= Number(product.stock))
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
                quantity: Number(entry.quantity) + amount,
              }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }

  function checkoutOrder(event) {
    event.preventDefault();

    if (!customer) {
      openAuth("checkout");
      return;
    }

    if (!validCart.length) {
      setMessage("Keranjang masih kosong.");
      return;
    }

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(checkout.phone.trim())
    ) {
      setMessage("Periksa kembali data pembeli.");
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

    for (const [id, qty] of quantities) {
      const product = products.find((p) => p.id === id);

      if (!product || Number(product.stock) < qty) {
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
      items: validCart.map((item) => ({ ...item })),
      total: subtotal + shippingFee,
      status: "Pesanan Baru",
      stockRestored: false,
    };

    setOrders((prev) => [order, ...prev]);

    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        stock:
          Number(product.stock) -
          (quantities.get(product.id) || 0),
      }))
    );

    setCart([]);
    setCheckout({ ...DEFAULT_CHECKOUT });
    navigate("success");
  }

  function updateStatus(id, status) {
    if (!STATUSES.includes(status)) return;

    const order = orders.find((item) => item.id === id);
    if (!order) return;

    if (
      ["Selesai", "Dibatalkan"].includes(
        getStatus(order.status)
      )
    ) return;

    if (status === "Dibatalkan" && !order.stockRestored) {
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          stock:
            Number(product.stock) +
            order.items
              .filter((item) => item.id === product.id)
              .reduce(
                (sum, item) =>
                  sum + Number(item.quantity),
                0
              ),
        }))
      );
    }

    setOrders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              stockRestored:
                item.stockRestored ||
                status === "Dibatalkan",
            }
          : item
      )
    );

    setMessage("Status pesanan diperbarui.");
  }

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
      setMessage("Periksa data produk.");
      return;
    }

    if (
      form.image &&
      !PHOTOS.some(
        (photo) =>
          photo.url === form.image &&
          normalize(photo.folder) === category.folder
      )
    ) {
      setMessage("Foto tidak sesuai kategori.");
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.id !== form.id &&
        Boolean(form.image) &&
        product.image === form.image
    );

    if (duplicate) {
      setMessage("Foto sudah digunakan produk lain.");
      return;
    }

    const product = {
      id: form.id ?? `custom:${Date.now()}`,
      name: form.name.trim(),
      collection: category.name,
      image: form.image,
      price,
      stock,
      description: form.description,
      sizes: arrayFromText(form.sizes),
      colors: arrayFromText(form.colors),
    };

    if (!product.sizes.length || !product.colors.length) {
      setMessage("Ukuran dan warna wajib diisi.");
      return;
    }

    if (form.id !== null) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === form.id ? product : item
        )
      );
    } else {
      setProducts((prev) => [...prev, product]);
    }

    setForm({ ...DEFAULT_FORM });
    setMessage("Produk berhasil disimpan.");
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,
      collection: product.collection,
      image: product.image || "",
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
          getStatus(order.status)
        ) &&
        order.items?.some((item) => item.id === id)
    );

    if (active) {
      setMessage("Selesaikan pesanan aktif dahulu.");
      return;
    }

    if (!window.confirm("Hapus produk ini?")) return;

    const product = products.find((p) => p.id === id);

    localStorage.setItem(
      KEY.deleted,
      JSON.stringify([
        ...new Set([
          ...readArray(KEY.deleted),
          id,
          ...(product?.image
            ? [`local:${product.image}`]
            : []),
        ]),
      ])
    );

    setProducts((prev) =>
      prev.filter((product) => product.id !== id)
    );
    setCart((prev) => prev.filter((item) => item.id !== id));
    setWishlist((prev) => prev.filter((item) => item !== id));
    setForm({ ...DEFAULT_FORM });
    setMessage("Produk dihapus.");
  }

  const gridProps = {
    wishlist,
    onDetail: showProduct,
    onFavorite: toggleWishlist,
    onCart: addToCart,
  };

  return (
    <div className={`lumina ${page === "admin" ? "admin-mode" : ""}`}>
      {/* ======================================
          STYLE SHOP BARU
      ====================================== */}

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
          display: block;
          font-size: 11px;
          letter-spacing: 2px;
          color: #a28b78;
          margin-bottom: 10px;
        }

        .lumina .lum-shop-heading h1 {
          font-family: Georgia, serif;
          font-size: clamp(28px, 3.8vw, 42px);
          font-weight: 400;
          color: #292522;
          margin: 0 0 12px;
        }

        .lumina .lum-shop-heading p {
          font-size: 13px;
          color: #82766c;
        }

        .lumina .lum-shop-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: center;
          margin-bottom: 27px;
        }

        .lumina .lum-shop-pill {
          background: white;
          color: #60564d;
          border: 1px solid #e0d7ce;
          border-radius: 50px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: .2s;
        }

        .lumina .lum-shop-pill:hover {
          border-color: #302720;
        }

        .lumina .lum-shop-pill.active {
          background: #302720;
          border-color: #302720;
          color: white;
        }

        .lumina .lum-shop-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 13px;
          margin-bottom: 22px;
        }

        .lumina .lum-shop-search {
          height: 50px;
          border: 1px solid #e1d8d0;
          border-radius: 50px;
          background: white;
          display: flex;
          align-items: center;
          padding: 0 18px;
          gap: 10px;
        }

        .lumina .lum-shop-search span {
          font-size: 23px;
          color: #958273;
        }

        .lumina .lum-shop-search input {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          box-shadow: none;
          outline: none;
          padding: 10px 0;
          font-size: 13px;
          color: #302720;
        }

        .lumina .lum-shop-search button {
          border: 0;
          background: transparent;
          font-size: 22px;
          cursor: pointer;
          color: #82766c;
        }

        .lumina .lum-shop-sort {
          width: 100%;
          height: 50px;
          border: 1px solid #e1d8d0;
          border-radius: 50px;
          background: white;
          color: #4f443b;
          padding: 0 17px;
          font-size: 13px;
        }

        .lumina .lum-shop-count {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          font-size: 12px;
          color: #82766c;
          margin-bottom: 17px;
        }

        .lumina .lum-shop-grid .product-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .lumina .lum-shop-grid .product-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #ece4dc;
          background: white;
          min-width: 0;
          box-shadow: 0 5px 18px rgba(48,39,32,.05);
          transition: transform .2s, box-shadow .2s;
        }

        .lumina .lum-shop-grid .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(48,39,32,.11);
        }

        .lumina .lum-shop-grid .product-picture {
          position: relative;
          width: 100%;
          height: auto;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #f3eeea;
        }

        .lumina .lum-shop-grid .image-button {
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .lumina .lum-shop-grid .product-picture img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-shop-grid .product-body {
          padding: 20px;
        }

        .lumina .lum-shop-grid .product-body h3 {
          font-size: 16px;
          line-height: 1.5;
          color: #302720;
          margin: 10px 0;
        }

        .lumina .lum-shop-grid .product-body .price {
          color: #382b22;
          font-size: 20px;
          font-weight: 700;
          margin: 10px 0;
        }

        .lumina .lum-shop-grid .product-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .lumina .lum-shop-grid .product-actions button {
          flex: 1;
          min-width: 0;
          padding: 12px 8px;
          border-radius: 9px;
          font-size: 12px;
        }

        .lumina .lum-photo-placeholder {
          width: 100%;
          height: 100%;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          background: #efe8e1;
          color: #92745f;
        }

        .lumina .lum-photo-placeholder span {
          font-size: 30px;
        }

        .lumina .lum-empty {
          text-align: center;
          padding: 50px 20px;
          border: 1px solid #ece4dc;
          border-radius: 14px;
          background: white;
        }

        .lumina .lum-admin-thumb {
          flex: 0 0 60px;
          height: 75px;
        }

        .lumina .lum-admin-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-admin-preview {
          height: 190px;
        }

        .lumina .lum-admin-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-admin-product-info {
          flex: 1;
          min-width: 0;
        }

        .lumina .lum-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .lumina .lum-gallery article {
          border: 1px solid #eee;
          border-radius: 12px;
          overflow: hidden;
        }

        .lumina .lum-gallery img {
          width: 100%;
          height: 190px;
          object-fit: contain;
        }

        .lumina .lum-gallery p {
          padding: 10px;
          font-size: 11px;
        }

        .lumina .lum-category-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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

        @media (max-width: 700px) {
          .lumina .lum-new-shop {
            padding: 28px 14px 60px;
          }

          .lumina .lum-shop-categories {
            flex-wrap: nowrap;
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 12px;
          }

          .lumina .lum-shop-pill {
            flex: 0 0 auto;
            padding: 9px 15px;
            font-size: 12px;
          }

          .lumina .lum-shop-toolbar {
            grid-template-columns: 1fr;
          }

          .lumina .lum-shop-grid .product-grid {
            gap: 11px;
          }

          .lumina .lum-shop-grid .product-picture {
            aspect-ratio: 3 / 4;
          }

          .lumina .lum-shop-grid .product-body {
            padding: 12px;
          }

          .lumina .lum-shop-grid .product-body h3 {
            font-size: 12px;
          }

          .lumina .lum-shop-grid .product-body .price {
            font-size: 14px;
          }

          .lumina .lum-shop-grid .product-actions {
            flex-direction: column;
          }

          .lumina .lum-shop-grid .product-actions button {
            width: 100%;
          }
        }
      `}</style>

      {/* NAVBAR */}

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

              <button
                onClick={() => selectCategory("Batik Wanita")}
              >
                Batik
              </button>

              <button
                onClick={() => selectCategory("Tas Wanita")}
              >
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
                  <button
                    onClick={() => navigate("account")}
                  >
                    Halo, {customer.name}
                  </button>
                  <button onClick={logout}>Logout</button>
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
                alt="LUMINA Fashion"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧ <strong>Premium Fashion</strong>
              <span>Modern & Elegant</span>
            </div>

            <div>
              ♡ <strong>{PHOTOS.length} Foto Koleksi</strong>
              <span>Katalog Foto Lokal</span>
            </div>

            <div>
              ✦ <strong>Seven Collections</strong>
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
                    onClick={() => selectCategory(item.name)}
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
                      alt={item.label}
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
                      <small>LUMINA COLLECTION</small>
                      <strong>{item.label}</strong>
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
        </>
      )}

      {/* ======================================
          SHOP BARU SESUAI CONTOH GAMBAR
      ====================================== */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <small>DISCOVER YOUR STYLE</small>

            <h1>Shop Our Collection</h1>

            <p>
              Temukan gaya terbaik dari koleksi LUMINA
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
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="lum-shop-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
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

            <span>▦ Grid View</span>
          </div>

          {visibleProducts.length ? (
            <div className="lum-shop-grid">
              <ProductGrid
                products={visibleProducts}
                {...gridProps}
              />
            </div>
          ) : (
            <div className="lum-empty">
              <h3>Produk tidak ditemukan</h3>
              <p>
                Coba kata kunci lain atau pilih
                kategori berbeda.
              </p>

              <button
                className="btn-dark"
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                  setSort("default");
                }}
              >
                Lihat Semua Produk
              </button>
            </div>
          )}
        </main>
      )}

      {/* DETAIL PRODUK */}

      {page === "detail" && selected && (
        <main className="container section">
          <button
            className="back"
            onClick={() => navigate("shop")}
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

              <h1>{selected.name}</h1>

              <h2 className="price">
                {rupiah(selected.price)}
              </h2>

              <p>{selected.description}</p>
              <p>Stok: {selected.stock}</p>

              <label>Pilih Ukuran</label>
              <div className="option-row">
                {(selected.sizes || []).map((size) => (
                  <button
                    key={size}
                    className={
                      selectedSize === size ? "chosen" : ""
                    }
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <label>Pilih Warna</label>
              <div className="option-row">
                {(selected.colors || []).map((color) => (
                  <button
                    key={color}
                    className={
                      selectedColor === color ? "chosen" : ""
                    }
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>

              <button
                className="btn-dark wide"
                disabled={Number(selected.stock) <= 0}
                onClick={() =>
                  addToCart(selected, selectedSize, selectedColor)
                }
              >
                + Tambahkan ke Keranjang
              </button>

              <button
                className="btn-light wide"
                onClick={() => toggleWishlist(selected.id)}
              >
                {wishlist.includes(selected.id)
                  ? "♥ Hapus Wishlist"
                  : "♡ Tambahkan Wishlist"}
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
            products={products.filter((product) =>
              wishlist.includes(product.id)
            )}
            {...gridProps}
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
                <div className="cart-row" key={item.key}>
                  <div className="lum-cart-photo">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>{item.name}</h3>
                    <p>{item.size} / {item.color}</p>
                    <strong>{rupiah(item.price)}</strong>

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
                          setCart((prev) =>
                            prev.filter(
                              (entry) => entry.key !== item.key
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

      {/* LOGIN */}

      {page === "auth" && (
        <AuthPage
          onSuccess={loginSuccess}
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
                  Regular Rp12.000
                </option>
                <option value="express">
                  Express Rp25.000
                </option>
              </select>

              <p className="muted">
                Checkout masih simulasi.
              </p>

              <button
                type="submit"
                className="btn-dark wide"
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <div className="panel summary">
              <h2>Ringkasan Pesanan</h2>

              <div className="between">
                <span>Subtotal</span>
                <strong>{rupiah(subtotal)}</strong>
              </div>

              <div className="between">
                <span>Ongkir</span>
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

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>Silakan Login Terlebih Dahulu</h2>
          <button
            className="btn-dark"
            onClick={() => openAuth("checkout")}
          >
            Login
          </button>
        </main>
      )}

      {/* DASHBOARD PELANGGAN */}

      {page === "account" && customer && (
        <CustomerDashboard
          customer={customer}
          orders={myOrders}
          onBack={() => selectCategory("All")}
          onLogout={logout}
        />
      )}

      {/* SUCCESS */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">✓</div>
            <h1>Pesanan Berhasil!</h1>
            <p>
              Pesanan simulasi berhasil dibuat.
              Cek status pesanan pada Dashboard Pelanggan.
            </p>

            <button
              className="btn-dark"
              onClick={() => navigate("account")}
            >
              Lihat Pesanan Saya →
            </button>

            <button
              className="btn-light"
              onClick={() => selectCategory("All")}
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
          onStatus={updateStatus}
          onBack={() => navigate("home")}
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
            <p>React E-Commerce Portfolio</p>
          </div>
          <p>
            © {new Date().getFullYear()} LUMINA STORE
          </p>
        </footer>
      )}

      {/* NOTIFIKASI */}

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
