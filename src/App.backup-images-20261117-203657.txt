
import { useEffect, useState } from "react";
import "./App.css";

// ============================================
// LUMINA STORE
// FASHION KELUARGA + ADMIN DASHBOARD FULLSCREEN
// ============================================

const basicProducts = [
  {
    id: 1,
    name: "Classic T-Shirt",
    category: "Fashion",
    price: 125000,
    stock: 20,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700",
    description: "Kaos premium yang nyaman dipakai setiap hari.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black", "Cream"],
  },
  {
    id: 2,
    name: "Urban Sneakers",
    category: "Shoes",
    price: 350000,
    stock: 15,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
    description: "Sneakers modern dengan desain sporty.",
    sizes: ["39", "40", "41", "42", "43"],
    colors: ["Red", "Black", "White"],
  },
  {
    id: 3,
    name: "Denim Jacket",
    category: "Fashion",
    price: 275000,
    stock: 12,
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=700",
    description: "Jaket denim berkualitas untuk gaya kasual.",
    sizes: ["M", "L", "XL"],
    colors: ["Blue", "Black"],
  },
  {
    id: 4,
    name: "Minimalist Sneakers",
    category: "Shoes",
    price: 395000,
    stock: 10,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700",
    description: "Sneakers minimalis bergaya premium.",
    sizes: ["39", "40", "41", "42"],
    colors: ["Cream", "White"],
  },
  {
    id: 5,
    name: "Premium Hoodie",
    category: "Fashion",
    price: 245000,
    stock: 18,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700",
    description: "Hoodie berbahan lembut dan nyaman.",
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Grey", "Cream"],
  },
  {
    id: 6,
    name: "Leather Handbag",
    category: "Accessories",
    price: 425000,
    stock: 8,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700",
    description: "Tas elegan untuk berbagai kesempatan.",
    sizes: ["All Size"],
    colors: ["Brown", "Black"],
  },
];

// Koleksi baru, dengan gambar placeholder demo.
// Gambar dapat diganti melalui Admin > Product.

const adultSizes = ["S", "M", "L", "XL", "XXL"];
const childSizes = [
  "2-3 Tahun", "4-5 Tahun", "6-7 Tahun",
  "8-10 Tahun", "11-12 Tahun",
];

function createProduct(
  id, name, category, price, stock,
  sizes, colors, description, keywords
) {
  return {
    id,
    name,
    category,
    price,
    stock,
    sizes,
    colors,
    description,
    keywords,
    image:
      "https://placehold.co/600x750/eadbd2/584237.png?text=" +
      encodeURIComponent(name),
  };
}

const newProducts = [
  createProduct(
    101, "Batik Pria Modern", "Fashion", 189000, 25,
    adultSizes, ["Brown", "Navy", "Black"],
    "Batik pria untuk kerja, gereja, pesta, dan acara keluarga.",
    "batik pria cowok cowo laki laki ayah bapak suami dewasa formal"
  ),
  createProduct(
    102, "Batik Wanita Elegan", "Fashion", 215000, 20,
    adultSizes, ["Maroon", "Cream", "Brown"],
    "Batik elegan untuk wanita dewasa dan acara resmi.",
    "batik wanita cewek cewe perempuan ibu istri dewasa pesta"
  ),
  createProduct(
    103, "Batik Anak Laki-Laki", "Fashion", 99000, 30,
    childSizes, ["Blue", "Brown"],
    "Batik anak laki-laki untuk sekolah dan acara keluarga.",
    "batik anak kecil cowok cowo pria laki laki sekolah"
  ),
  createProduct(
    104, "Dress Batik Anak Perempuan", "Fashion", 115000, 24,
    childSizes, ["Pink", "Cream", "Maroon"],
    "Dress batik anak perempuan untuk pesta dan keluarga.",
    "batik anak kecil cewek cewe wanita perempuan dress"
  ),
  createProduct(
    105, "Batik Couple Suami Istri", "Fashion", 375000, 15,
    adultSizes, ["Brown", "Navy"],
    "Batik pasangan dengan warna senada.",
    "batik couple pasangan keluarga suami istri menikah berumah tangga pria wanita dewasa"
  ),
  createProduct(
    106, "Batik Sarimbit Keluarga", "Fashion", 575000, 12,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Brown", "Green"],
    "Paket batik keluarga untuk ayah, ibu, dan anak.",
    "batik sarimbit keluarga ayah ibu anak kecil dewasa pasangan"
  ),
  createProduct(
    107, "Kebaya Wanita Modern", "Fashion", 285000, 18,
    adultSizes, ["Pink", "Cream", "Maroon"],
    "Kebaya modern untuk wisuda, pesta, dan acara adat.",
    "kebaya wanita cewek cewe perempuan dewasa wisuda pesta"
  ),
  createProduct(
    108, "Kebaya Ibu Brokat Premium", "Fashion", 345000, 14,
    ["M", "L", "XL", "XXL"], ["Gold", "Brown", "Navy"],
    "Kebaya brokat untuk ibu dan wanita dewasa.",
    "kebaya ibu wanita perempuan dewasa orang tua brokat pesta"
  ),
  createProduct(
    109, "Kebaya Anak Perempuan", "Fashion", 145000, 22,
    childSizes, ["Pink", "White", "Purple"],
    "Kebaya anak untuk acara sekolah dan keluarga.",
    "kebaya anak kecil cewek cewe wanita perempuan pesta"
  ),
  createProduct(
    110, "Sepatu Sekolah Anak Laki-Laki", "Shoes", 159000, 40,
    ["28", "29", "30", "31", "32", "33", "34", "35", "36"],
    ["Black"],
    "Sepatu sekolah hitam untuk anak laki-laki.",
    "sepatu sekolah anak kecil cowok cowo pria laki laki pelajar"
  ),
  createProduct(
    111, "Sepatu Sekolah Anak Perempuan", "Shoes", 155000, 35,
    ["28", "29", "30", "31", "32", "33", "34", "35", "36"],
    ["Black"],
    "Sepatu sekolah untuk anak perempuan.",
    "sepatu sekolah anak kecil cewek cewe wanita perempuan pelajar"
  ),
  createProduct(
    112, "Sepatu Gereja Wanita", "Shoes", 245000, 20,
    ["36", "37", "38", "39", "40", "41"],
    ["Black", "Cream", "Brown"],
    "Sepatu elegan wanita untuk gereja dan acara formal.",
    "sepatu gereja wanita cewek cewe perempuan ibu dewasa formal"
  ),
  createProduct(
    113, "Sepatu Gereja Pria Formal", "Shoes", 295000, 25,
    ["39", "40", "41", "42", "43", "44"],
    ["Black", "Brown"],
    "Sepatu pantofel pria untuk gereja dan acara resmi.",
    "sepatu gereja pria cowok cowo laki laki bapak dewasa pantofel"
  ),
  createProduct(
    114, "Sepatu Gereja Anak Perempuan", "Shoes", 175000, 24,
    ["27", "28", "29", "30", "31", "32", "33", "34"],
    ["Black", "White", "Pink"],
    "Sepatu pesta dan gereja untuk anak perempuan.",
    "sepatu gereja anak kecil cewek cewe wanita perempuan"
  ),
  createProduct(
    115, "Sepatu Gereja Anak Laki-Laki", "Shoes", 185000, 24,
    ["28", "29", "30", "31", "32", "33", "34", "35"],
    ["Black", "Brown"],
    "Sepatu formal anak laki-laki untuk gereja.",
    "sepatu gereja anak kecil cowok cowo pria laki laki"
  ),
  createProduct(
    116, "Sneakers Pria Casual", "Shoes", 325000, 28,
    ["39", "40", "41", "42", "43", "44"],
    ["White", "Black", "Grey"],
    "Sneakers pria nyaman untuk aktivitas sehari-hari.",
    "sepatu sneakers pria cowok cowo laki laki dewasa casual"
  ),
  createProduct(
    117, "Sepatu Anak Casual", "Shoes", 145000, 32,
    ["26", "27", "28", "29", "30", "31", "32", "33"],
    ["White", "Blue", "Pink"],
    "Sepatu sneakers anak untuk bermain dan sekolah.",
    "sepatu anak kecil cowok cewek pria wanita sneakers casual"
  ),
  createProduct(
    118, "Kebaya Couple Ibu dan Anak", "Fashion", 395000, 12,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Pink", "Cream", "Maroon"],
    "Set kebaya senada untuk ibu dan anak perempuan.",
    "kebaya couple keluarga pasangan ibu anak kecil wanita perempuan dewasa"
  ),
];

const statuses = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const categories = [
  ["All", "Semua Produk"],
  ["Fashion", "Fashion"],
  ["Batik", "Batik"],
  ["Kebaya", "Kebaya"],
  ["Shoes", "Semua Sepatu"],
  ["Anak", "Anak-Anak"],
  ["Dewasa", "Dewasa"],
  ["Keluarga", "Fashion Keluarga"],
  ["Accessories", "Accessories"],
];

const emptyForm = {
  name: "",
  category: "Fashion",
  price: "",
  stock: "",
  image: "",
  description: "",
  keywords: "",
  sizes: "S,M,L,XL",
  colors: "Black,White",
};

const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function shortMoney(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}jt`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}rb`;
  }
  return String(value);
}

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function statusOf(status) {
  return !status || status === "Simulasi"
    ? "Pesanan Baru"
    : status;
}

function normalizeSearch(text) {
  const aliases = {
    cowo: "pria",
    cowok: "pria",
    laki: "pria",
    bapak: "pria",
    ayah: "pria",
    suami: "pria",
    cewe: "wanita",
    cewek: "wanita",
    perempuan: "wanita",
    ibu: "wanita",
    istri: "wanita",
    bocah: "anak",
    balita: "anak",
    kids: "anak",
    menikah: "keluarga",
    berumah: "keluarga",
    sarimbit: "keluarga",
  };

  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => aliases[word] || word)
    .join(" ");
}

function matchesProduct(product, search, category) {
  const searchable = normalizeSearch([
    product.name,
    product.category,
    product.description,
    product.keywords || "",
    ...(product.sizes || []),
    ...(product.colors || []),
  ].join(" "));

  const words = normalizeSearch(search)
    .split(" ")
    .filter(Boolean);

  const matchesSearch = words.every((word) =>
    searchable.includes(word)
  );

  const categoryRules = {
    All: true,
    Fashion: product.category === "Fashion",
    Shoes: product.category === "Shoes",
    Accessories: product.category === "Accessories",
    Batik: searchable.includes("batik"),
    Kebaya: searchable.includes("kebaya"),
    Anak: searchable.includes("anak"),
    Dewasa: searchable.includes("dewasa"),
    Keluarga: searchable.includes("keluarga"),
  };

  return matchesSearch && (categoryRules[category] ?? true);
}

// ============================================
// KARTU PRODUK
// ============================================

function ProductCard({
  product,
  favorite,
  onFavorite,
  onDetail,
  onCart,
}) {
  return (
    <article className="product-card">
      <div className="product-picture">
        <button
          className="image-button"
          type="button"
          onClick={() => onDetail(product)}
        >
          <img src={product.image} alt={product.name} />
        </button>

        <button
          className="heart"
          type="button"
          aria-label={`Wishlist ${product.name}`}
          aria-pressed={favorite}
          onClick={() => onFavorite(product.id)}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <span className="stock-label">
          {product.stock > 0 ? "NEW COLLECTION" : "SOLD OUT"}
        </span>
      </div>

      <div className="product-body">
        <small>{product.category}</small>
        <h3>{product.name}</h3>
        <p className="price">{rupiah(product.price)}</p>
        <p className="muted">Stok: {product.stock}</p>

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
  items,
  wishlist,
  onFavorite,
  onDetail,
  onCart,
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
          onCart={onCart}
        />
      ))}

      {items.length === 0 && (
        <p className="empty">
          Produk tidak ditemukan. Coba kata pencarian lain.
        </p>
      )}
    </div>
  );
}

// ============================================
// TABEL PESANAN ADMIN
// ============================================

function OrderTable({ orders, onUpdateStatus, editable }) {
  return (
    <div className="lum-dash-table-wrap">
      <table className="lum-dash-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Customer</th>
            <th>Order ID</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const product = order.items?.[0];
            const currentStatus = statusOf(order.status);

            return (
              <tr key={order.id}>
                <td>
                  <div className="lum-dash-order-product">
                    {product?.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                      />
                    )}
                    <span>{product?.name || "Produk"}</span>
                  </div>
                </td>

                <td>{order.customer}</td>
                <td>{order.id}</td>
                <td>{rupiah(order.total)}</td>

                <td>
                  {editable ? (
                    <select
                      value={currentStatus}
                      disabled={
                        currentStatus === "Selesai" ||
                        currentStatus === "Dibatalkan"
                      }
                      onChange={(e) =>
                        onUpdateStatus(order.id, e.target.value)
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={
                        "lum-dash-status " +
                        currentStatus
                          .toLowerCase()
                          .replaceAll(" ", "-")
                      }
                    >
                      {currentStatus}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="lum-dash-empty">
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// DASHBOARD ADMIN FULL SCREEN
// ============================================

function AdminDashboard({
  products,
  orders,
  section,
  setSection,
  onBack,
  onSaveProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateStatus,
  form,
  setForm,
  editingId,
  cancelEdit,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [year, setYear] = useState(new Date().getFullYear());

  const completed = orders.filter(
    (order) => statusOf(order.status) === "Selesai"
  );

  const active = orders.filter(
    (order) => statusOf(order.status) !== "Dibatalkan"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const activeValue = active.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) => product.stock <= 5
  );

  const years = [
    ...new Set([
      new Date().getFullYear(),
      ...orders
        .map((order) => new Date(order.date).getFullYear())
        .filter(Number.isFinite),
    ]),
  ].sort((a, b) => b - a);

  const months = Array.from({ length: 12 }, (_, index) => {
    const total = completed
      .filter((order) => {
        const date = new Date(order.date);
        return (
          date.getFullYear() === year &&
          date.getMonth() === index
        );
      })
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

    return {
      index,
      label: new Date(2026, index, 1).toLocaleDateString(
        "id-ID",
        { month: "short" }
      ),
      total,
    };
  });

  const maxRevenue = Math.max(
    1,
    ...months.map((month) => month.total)
  );

  const soldMap = new Map();

  completed.forEach((order) => {
    (order.items || []).forEach((item) => {
      const old = soldMap.get(item.id) || {
        id: item.id,
        name: item.name,
        image: item.image,
        quantity: 0,
      };

      soldMap.set(item.id, {
        ...old,
        quantity:
          old.quantity + Number(item.quantity || 0),
      });
    });
  });

  const topSelling = [...soldMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const popular = products
    .map((product) => ({
      ...product,
      sold: soldMap.get(product.id)?.quantity || 0,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const visibleOrders = [...orders]
    .filter((order) => {
      const text = [
        order.id,
        order.customer,
        ...(order.items || []).map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = text.includes(
        query.toLowerCase()
      );

      return (
        matchSearch &&
        (filter === "Semua" ||
          statusOf(order.status) === filter)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleProducts = products.filter((product) =>
    matchesProduct(product, query, "All")
  );

  const metrics = [
    {
      icon: "◉",
      label: "Penjualan Selesai",
      value: rupiah(revenue),
      note: "Completed",
    },
    {
      icon: "◈",
      label: "Nilai Pesanan Aktif",
      value: rupiah(activeValue),
      note: "Non-cancelled",
    },
    {
      icon: "▤",
      label: "Total Pesanan",
      value: orders.length,
      note: `${completed.length} selesai`,
    },
    {
      icon: "▣",
      label: "Total Produk",
      value: products.length,
      note: `${totalStock} unit`,
    },
  ];

  return (
    <div className="lum-dash">
      {/* SIDEBAR ADMIN */}
      <aside className="lum-dash-sidebar">
        <div className="lum-dash-logo">
          LUMINA<span>.</span>
        </div>

        <div className="lum-dash-menu-label">Menu</div>

        <nav className="lum-dash-menu">
          {[
            ["overview", "▦", "Overview"],
            ["report", "▤", "Report"],
            ["orders", "🛒", "Order"],
            ["products", "◈", "Product"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => setSection(key)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="lum-dash-sidebar-bottom">
          <strong>Business</strong>
          <p>Fashion & Lifestyle</p>
          <small>● Admin Demo</small>

          <button
            className="lum-dash-back"
            onClick={onBack}
          >
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      {/* KONTEN ADMIN */}
      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <span className="lum-dash-eyebrow">
              LUMINA MANAGEMENT SYSTEM
            </span>
            <h1>
              {{
                overview: "Overview",
                report: "Sales Report",
                orders: "Manajemen Pesanan",
                products: "Kelola Produk",
              }[section]}
            </h1>
          </div>

          <div className="lum-dash-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search product or order..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <span className="lum-dash-avatar">A</span>
        </header>

        {/* METRIK OVERVIEW / REPORT */}
        {(section === "overview" ||
          section === "report") && (
          <div className="lum-dash-stats">
            {metrics.map((metric) => (
              <div
                className="lum-dash-metric"
                key={metric.label}
              >
                <div className="lum-dash-metric-head">
                  <span className="lum-dash-metric-icon">
                    {metric.icon}
                  </span>
                  <small>{metric.note}</small>
                </div>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* OVERVIEW */}
        {section === "overview" && (
          <>
            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <div>
                  <h2>Earning Revenue</h2>
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
                  {years.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lum-dash-chart-total">
                {rupiah(
                  months.reduce(
                    (sum, month) => sum + month.total,
                    0
                  )
                )}
                <small>Total {year}</small>
              </div>

              <div className="lum-dash-chart">
                {months.map((month) => (
                  <div
                    className="lum-dash-bar-col"
                    key={month.index}
                  >
                    <span>
                      {month.total > 0
                        ? shortMoney(month.total)
                        : ""}
                    </span>

                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        style={{
                          height: `${
                            (month.total / maxRevenue) * 100
                          }%`,
                        }}
                        title={rupiah(month.total)}
                      />
                    </div>

                    <small>{month.label}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Lima pesanan terbaru</p>
                </div>
                <button
                  className="lum-dash-link"
                  onClick={() => setSection("orders")}
                >
                  Lihat Semua →
                </button>
              </div>

              <OrderTable
                orders={visibleOrders.slice(0, 5)}
                onUpdateStatus={onUpdateStatus}
                editable={false}
              />
            </section>
          </>
        )}

        {/* REPORT */}
        {section === "report" && (
          <>
            <section className="lum-dash-card">
              <h2>Ringkasan Status Pesanan</h2>

              <div className="lum-dash-status-grid">
                {statuses.map((status) => (
                  <div key={status}>
                    <strong>
                      {orders.filter(
                        (order) =>
                          statusOf(order.status) === status
                      ).length}
                    </strong>
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <div className="lum-dash-card-head">
                <h2>Laporan Transaksi</h2>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option>Semua</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <OrderTable
                orders={visibleOrders}
                onUpdateStatus={onUpdateStatus}
                editable={false}
              />
            </section>
          </>
        )}

        {/* PESANAN */}
        {section === "orders" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <div>
                <h2>Manajemen Pesanan</h2>
                <p>Ubah status pesanan simulasi</p>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Semua</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <OrderTable
              orders={visibleOrders}
              onUpdateStatus={onUpdateStatus}
              editable
            />
          </section>
        )}

        {/* PRODUK */}
        {section === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-dash-product-form"
              onSubmit={onSaveProduct}
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
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <label>Kategori</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
              >
                <option>Fashion</option>
                <option>Shoes</option>
                <option>Accessories</option>
              </select>

              <label>Harga (Rp)</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
              />

              <label>Stok</label>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: e.target.value,
                  })
                }
              />

              <label>URL Gambar</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={(e) =>
                  setForm({
                    ...form,
                    image: e.target.value,
                  })
                }
              />

              {form.image && (
                <img
                  className="lum-dash-preview"
                  src={form.image}
                  alt="Preview produk"
                />
              )}

              <label>Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <label>Kata Kunci Pencarian</label>
              <textarea
                rows={2}
                placeholder="Contoh: batik pria cowok dewasa"
                value={form.keywords || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    keywords: e.target.value,
                  })
                }
              />

              <label>Ukuran (pisahkan koma)</label>
              <input
                value={form.sizes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sizes: e.target.value,
                  })
                }
              />

              <label>Warna (pisahkan koma)</label>
              <input
                value={form.colors}
                onChange={(e) =>
                  setForm({
                    ...form,
                    colors: e.target.value,
                  })
                }
              />

              <button className="btn-dark" type="submit">
                {editingId !== null
                  ? "Simpan Perubahan"
                  : "+ Tambah Produk"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={cancelEdit}
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>Daftar Produk ({products.length})</h2>
              <p className="lum-dash-small">
                Cari produk melalui kolom Search di atas.
              </p>

              {visibleProducts.map((product) => (
                <div
                  className="lum-dash-product-row"
                  key={product.id}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {rupiah(product.price)} · Stok{" "}
                      {product.stock}
                    </p>
                  </div>

                  <button
                    className="btn-light"
                    onClick={() => onEditProduct(product)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    Hapus
                  </button>
                </div>
              ))}

              {visibleProducts.length === 0 && (
                <p>Produk tidak ditemukan.</p>
              )}
            </section>
          </div>
        )}
      </main>

      {/* PANEL KANAN */}
      <aside className="lum-dash-right">
        <section>
          <h3>Produk Populer</h3>
          <p className="lum-dash-small">
            Berdasarkan jumlah penjualan selesai
          </p>

          {popular.map((product) => (
            <div
              className="lum-dash-side-product"
              key={product.id}
            >
              <img
                src={product.image}
                alt={product.name}
              />
              <div>
                <strong>{product.name}</strong>
                <small>{product.sold} unit terjual</small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Top Selling Product</h3>
          <p className="lum-dash-small">Produk terlaris</p>

          {topSelling.length === 0 && (
            <p className="lum-dash-small">
              Belum ada pesanan selesai.
            </p>
          )}

          {topSelling.map((product) => (
            <div
              className="lum-dash-side-product"
              key={product.id}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                />
              )}
              <div>
                <strong>{product.name}</strong>
                <small>{product.quantity} unit</small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Stock Alert</h3>
          <p className="lum-dash-small">
            Produk dengan stok 5 unit atau kurang
          </p>

          {lowStock.length === 0 ? (
            <p className="lum-dash-small">
              ✓ Semua stok mencukupi.
            </p>
          ) : (
            lowStock.map((product) => (
              <div
                className="lum-dash-stock"
                key={product.id}
              >
                <span>{product.name}</span>
                <strong>{product.stock}</strong>
              </div>
            ))
          )}
        </section>
      </aside>
    </div>
  );
}

// ============================================
// APLIKASI UTAMA
// ============================================

export default function App() {
  const [products, setProducts] = useState(() => {
    const saved = loadData(
      "lumina_products_v1",
      basicProducts
    );

    const existing = Array.isArray(saved)
      ? saved
      : basicProducts;

    const ids = new Set(
      existing.map((product) => String(product.id))
    );

    const additions = newProducts.filter(
      (product) => !ids.has(String(product.id))
    );

    return [...existing, ...additions];
  });

  const [cart, setCart] = useState(() =>
    loadData("lumina_cart_v1", [])
  );

  const [wishlist, setWishlist] = useState(() =>
    loadData("lumina_wishlist_v1", [])
  );

  const [orders, setOrders] = useState(() =>
    loadData("lumina_orders_v1", [])
  );

  const [page, setPage] = useState("home");
  const [adminSection, setAdminSection] =
    useState("overview");

  const [selectedId, setSelectedId] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [message, setMessage] = useState("");

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    shipping: "regular",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Simpan data browser.
  useEffect(() => {
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

  const selected = products.find(
    (product) => product.id === selectedId
  );

  // Pencarian batik, kebaya, sepatu, dan keluarga.
  const filteredProducts = products
    .filter((product) =>
      matchesProduct(product, search, category)
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return a.id - b.id;
    });

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingFee =
    checkout.shipping === "express" ? 25000 : 12000;

  function notify(text) {
    setMessage(text);
  }

  function go(destination) {
    setPage(destination);
    window.scrollTo(0, 0);
  }

  function goAdmin() {
    setAdminSection("overview");
    go("admin");
  }

  function openProduct(product) {
    setSelectedId(product.id);
    setSize(product.sizes?.[0] || "All Size");
    setColor(product.colors?.[0] || "Default");
    go("detail");
  }

  function toggleWishlist(id) {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function addToCart(product, chosenSize, chosenColor) {
    const chosenS =
      chosenSize || product.sizes?.[0] || "All Size";
    const chosenC =
      chosenColor || product.colors?.[0] || "Default";

    const key = `${product.id}-${chosenS}-${chosenC}`;

    const used = cart
      .filter((item) => item.id === product.id)
      .reduce(
        (sum, item) => sum + item.quantity,
        0
      );

    if (used >= product.stock) {
      notify("Stok produk tidak mencukupi.");
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.key === key
      );

      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          key,
          size: chosenS,
          color: chosenC,
          quantity: 1,
        },
      ];
    });

    notify("Produk berhasil ditambahkan ke keranjang.");
  }

  function changeQty(key, amount) {
    const item = cart.find(
      (product) => product.key === key
    );

    const product = products.find(
      (p) => p.id === item?.id
    );

    if (!item || !product) return;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce(
        (sum, p) => sum + p.quantity,
        0
      );

    if (amount > 0 && used >= product.stock) {
      notify("Jumlah melebihi stok.");
      return;
    }

    setCart((current) =>
      current
        .map((p) =>
          p.key === key
            ? {
                ...p,
                quantity: p.quantity + amount,
              }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  }

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
      notify("Periksa kembali data pembeli.");
      return;
    }

    const quantities = {};

    cart.forEach((item) => {
      quantities[item.id] =
        (quantities[item.id] || 0) + item.quantity;
    });

    for (const [id, quantity] of Object.entries(
      quantities
    )) {
      const product = products.find(
        (p) => String(p.id) === id
      );

      if (!product || quantity > product.stock) {
        notify("Stok produk tidak mencukupi.");
        return;
      }
    }

    const newOrder = {
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

    setOrders((current) => [
      newOrder,
      ...current,
    ]);

    setProducts((current) =>
      current.map((product) => ({
        ...product,
        stock:
          product.stock -
          (quantities[product.id] || 0),
      }))
    );

    setCart([]);

    setCheckout({
      name: "",
      phone: "",
      address: "",
      shipping: "regular",
    });

    go("success");
  }

  function updateOrderStatus(id, nextStatus) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const currentStatus = statusOf(order.status);

    if (
      currentStatus === "Dibatalkan" ||
      currentStatus === "Selesai"
    ) {
      notify("Status pesanan final tidak bisa diubah.");
      return;
    }

    if (
      nextStatus === "Dibatalkan" &&
      !order.stockRestored
    ) {
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          stock:
            product.stock +
            (order.items || [])
              .filter(
                (item) => item.id === product.id
              )
              .reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              ),
        }))
      );
    }

    setOrders((current) =>
      current.map((item) =>
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

    notify(`Status menjadi ${nextStatus}.`);
  }

  // CRUD produk.
  function saveProduct(event) {
    event.preventDefault();

    const product = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim(),
      description: form.description.trim(),
      keywords: (form.keywords || "").trim(),
      sizes: form.sizes
        .split(",")
        .map((text) => text.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((text) => text.trim())
        .filter(Boolean),
    };

    if (
      !product.name ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0 ||
      product.sizes.length === 0 ||
      product.colors.length === 0
    ) {
      notify("Periksa kembali data produk.");
      return;
    }

    if (editingId !== null) {
      setProducts((current) =>
        current.map((item) =>
          item.id === editingId ? product : item
        )
      );

      setCart((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, ...product }
            : item
        )
      );
    } else {
      setProducts((current) => [
        ...current,
        product,
      ]);
    }

    setEditingId(null);
    setForm(emptyForm);
    notify("Produk berhasil disimpan.");
  }

  function editProduct(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      description: product.description || "",
      keywords: product.keywords || "",
      sizes: (product.sizes || []).join(","),
      colors: (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    if (
      !window.confirm(
        "Yakin ingin menghapus produk?"
      )
    ) {
      return;
    }

    setProducts((current) =>
      current.filter((p) => p.id !== id)
    );

    setCart((current) =>
      current.filter((p) => p.id !== id)
    );

    setWishlist((current) =>
      current.filter((item) => item !== id)
    );

    notify("Produk berhasil dihapus.");
  }

  const gridProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onCart: addToCart,
  };

  return (
    <div
      className={
        "lumina " +
        (page === "admin" ? "admin-mode" : "")
      }
    >
      <style>{adminStyles}</style>

      {/* NAVBAR HANYA DI TOKO */}
      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — Fashion for Every Generation
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

              <button onClick={() => go("shop")}>
                Shop
              </button>

              <button onClick={() => go("wishlist")}>
                ♡ Wishlist ({wishlist.length})
              </button>

              <button onClick={goAdmin}>
                Admin Demo
              </button>
            </nav>

            <button
              className="cart-link"
              onClick={() => go("cart")}
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
                FAMILY COLLECTION — 2026
              </p>

              <h1>
                Discover Your <em>Unique Style.</em>
              </h1>

              <p>
                Discover batik, kebaya, school shoes,
                church shoes, and timeless fashion
                for children and adults.
              </p>

              <button
                className="btn-dark"
                onClick={() => go("shop")}
              >
                Shop Collection →
              </button>

              <p className="hero-bottom">
                ✦ BATIK ✦ KEBAYA ✦ FAMILY FASHION
              </p>
            </div>

            <div className="hero-photo">
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200"
                alt="Lumina fashion collection"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧ <strong>Premium Quality</strong>
              <span>Fashion pilihan keluarga</span>
            </div>

            <div>
              ♡ <strong>All Generations</strong>
              <span>Anak hingga dewasa</span>
            </div>

            <div>
              ✦ <strong>New Arrivals</strong>
              <span>Batik, kebaya dan sepatu</span>
            </div>
          </section>

          <main className="container section">
            <p className="eyebrow center">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Featured Collection
            </h2>

            <p className="section-description">
              Koleksi fashion untuk seluruh keluarga.
            </p>

            <ProductGrid
              items={products.slice(0, 6)}
              {...gridProps}
            />

            <div className="center action-space">
              <button
                className="btn-dark"
                onClick={() => go("shop")}
              >
                View All Products →
              </button>
            </div>
          </main>

          <section className="promo">
            <p className="eyebrow">
              THE LUMINA EDIT
            </p>
            <h2>Style for every generation.</h2>
            <p>
              Batik, kebaya, sepatu, dan fashion keluarga.
            </p>

            <button
              className="btn-dark"
              onClick={() => go("shop")}
            >
              Explore Collection
            </button>
          </section>
        </>
      )}

      {/* SHOP */}
      {page === "shop" && (
        <main className="container section">
          <p className="eyebrow center">
            LUMINA COLLECTION
          </p>

          <h1 className="section-title">
            Shop Our Collection
          </h1>

          <p className="section-description">
            Temukan batik, kebaya, dan sepatu
            untuk anak-anak hingga dewasa.
          </p>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Contoh: batik cowok, kebaya anak..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">
                Default
              </option>
              <option value="low">
                Harga Terendah
              </option>
              <option value="high">
                Harga Tertinggi
              </option>
            </select>
          </div>

          <p
            className="muted"
            style={{ marginBottom: 20 }}
          >
            {filteredProducts.length} produk ditemukan
          </p>

          <ProductGrid
            items={filteredProducts}
            {...gridProps}
          />
        </main>
      )}

      {/* DETAIL PRODUK */}
      {page === "detail" && selected && (
        <main className="container section">
          <button
            className="back"
            onClick={() => go("shop")}
          >
            ← Kembali ke toko
          </button>

          <div className="detail-layout">
            <img
              className="detail-image"
              src={selected.image}
              alt={selected.name}
            />

            <div className="detail-copy">
              <p className="eyebrow">
                {selected.category}
              </p>

              <h1>{selected.name}</h1>
              <h2 className="price">
                {rupiah(selected.price)}
              </h2>

              <p>{selected.description}</p>

              <p className="muted">
                Stok tersedia: {selected.stock}
              </p>

              <label>Ukuran</label>
              <div className="option-row">
                {(selected.sizes || []).map((s) => (
                  <button
                    key={s}
                    className={
                      size === s ? "chosen" : ""
                    }
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label>Warna</label>
              <div className="option-row">
                {(selected.colors || []).map((c) => (
                  <button
                    key={c}
                    className={
                      color === c ? "chosen" : ""
                    }
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                className="btn-dark wide"
                disabled={selected.stock <= 0}
                onClick={() =>
                  addToCart(selected, size, color)
                }
              >
                + Add to Cart
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
            items={products.filter((product) =>
              wishlist.includes(product.id)
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
              {cart.length === 0 && (
                <p>Keranjang masih kosong.</p>
              )}

              {cart.map((item) => (
                <div
                  className="cart-row"
                  key={item.key}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />

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
                          setCart((current) =>
                            current.filter(
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
                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <button
                className="btn-dark wide"
                disabled={!cart.length}
                onClick={() => go("checkout")}
              >
                Continue to Checkout →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* CHECKOUT */}
      {page === "checkout" && (
        <main className="container section">
          <h1 className="section-title">
            Checkout — Demo
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
                Gunakan data fiktif karena
                checkout ini hanya simulasi.
              </p>

              <button
                className="btn-dark wide"
                type="submit"
                disabled={!cart.length}
              >
                Konfirmasi Pesanan Simulasi
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
                    {rupiah(
                      item.price * item.quantity
                    )}
                  </strong>
                </div>
              ))}

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

      {/* SUCCESS */}
      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h1>
              Pesanan Simulasi Berhasil!
            </h1>

            <p>
              Pesanan sudah dicatat di dashboard admin.
            </p>

            <p>
              Tidak ada pembayaran nyata.
            </p>

            <button
              className="btn-dark"
              onClick={() => go("home")}
            >
              Kembali ke Home
            </button>
          </div>
        </main>
      )}

      {/* ADMIN FULLSCREEN */}
      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          section={adminSection}
          setSection={setAdminSection}
          onBack={() => go("home")}
          onSaveProduct={saveProduct}
          onEditProduct={editProduct}
          onDeleteProduct={deleteProduct}
          onUpdateStatus={updateOrderStatus}
          form={form}
          setForm={setForm}
          editingId={editingId}
          cancelEdit={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
        />
      )}

      {/* FOOTER HANYA DI TOKO */}
      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>
            <p>Modern Fashion & Lifestyle</p>
          </div>

          <p>
            React.js E-Commerce Portfolio Project
          </p>

          <p>
            © 2026 LUMINA STORE · Demo Only
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

// ============================================
// CSS ADMIN
// DISIMPAN DALAM App.jsx
// ============================================

const adminStyles = `
.lumina.admin-mode {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background: #fff;
}

.lum-dash {
  display: grid;
  grid-template-columns: 245px minmax(0,1fr) 270px;
  min-height: 100vh;
  width: 100%;
  background: #fff;
  color: #28221f;
  font-family: Arial, sans-serif;
}

.lum-dash * {
  box-sizing: border-box;
}

.lum-dash-sidebar {
  background: #faf1ed;
  padding: 38px 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  min-width: 0;
}

.lum-dash-logo {
  font-size: 27px;
  font-weight: 900;
  letter-spacing: 3px;
  margin: 0 10px 20px;
}

.lum-dash-logo span {
  color: #bb9683;
}

.lum-dash-menu-label {
  background: #25201e;
  color: #e8c7b6;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: 700;
  width: max-content;
}

.lum-dash-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lum-dash-menu button {
  display: flex;
  align-items: center;
  gap: 13px;
  background: transparent;
  border: 0;
  border-radius: 9px;
  padding: 14px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #322c29;
  text-align: left;
  cursor: pointer;
}

.lum-dash-menu button span {
  width: 24px;
  font-size: 19px;
  text-align: center;
}

.lum-dash-menu button.active,
.lum-dash-menu button:hover {
  background: #eadbd3;
}

.lum-dash-sidebar-bottom {
  margin-top: auto;
  padding: 20px 10px 0;
  border-top: 1px solid #eadbd3;
}

.lum-dash-sidebar-bottom p {
  color: #89776e;
  font-size: 12px;
}

.lum-dash-sidebar-bottom small {
  display: block;
  color: #926d4d;
  margin: 16px 0;
}

.lum-dash-back {
  background: #29231d;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
}

.lum-dash-main {
  min-width: 0;
  padding: 38px 35px;
}

.lum-dash-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 35px;
}

.lum-dash-eyebrow {
  display: block;
  color: #aa8a79;
  font-size: 10px;
  letter-spacing: 1.5px;
  margin-bottom: 9px;
}

.lum-dash-topbar h1 {
  font-size: 25px;
  margin: 0;
}

.lum-dash-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 350px;
  padding: 0 12px;
  border: 1.5px solid #2c2521;
  border-radius: 30px;
}

.lum-dash-search span {
  font-size: 22px;
}

.lumina .lum-dash-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 10px 0;
  font-size: 12px;
}

.lum-dash-avatar {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #29231d;
  color: white;
  font-weight: 700;
}

.lum-dash-stats {
  display: grid;
  grid-template-columns: repeat(4,minmax(0,1fr));
  gap: 14px;
  margin-bottom: 25px;
}

.lum-dash-metric {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 143px;
  min-width: 0;
  padding: 18px 14px;
  background: #faf6f3;
}

.lum-dash-metric-head {
  display: flex;
  justify-content: space-between;
  gap: 5px;
}

.lum-dash-metric-icon {
  font-size: 23px;
}

.lum-dash-metric-head small {
  color: #b9a79c;
  font-size: 9px;
  text-align: right;
}

.lum-dash-metric strong {
  font-size: clamp(13px,1.2vw,18px);
  overflow-wrap: anywhere;
}

.lum-dash-metric > span:last-child {
  color: #72665e;
  font-size: 11px;
}

.lum-dash-card {
  min-width: 0;
  padding: 26px;
  margin-bottom: 23px;
  border-radius: 5px;
  background: #fcf8f5;
}

.lum-dash-card h2 {
  margin: 0 0 8px;
  font-size: 19px;
}

.lum-dash-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.lum-dash-card-head p {
  color: #948278;
  font-size: 11px;
  margin: 0;
}

.lumina .lum-dash-card-head select {
  color: white;
  background: #29231d;
  border: 0;
  border-radius: 5px;
  padding: 9px 13px;
}

.lum-dash-chart-total {
  margin: 24px 0 10px;
  font-size: 21px;
  font-weight: 700;
}

.lum-dash-chart-total small {
  margin-left: 12px;
  font-size: 11px;
  color: #98867c;
  font-weight: 400;
}

.lum-dash-chart {
  display: grid;
  grid-template-columns: repeat(12,minmax(0,1fr));
  align-items: end;
  gap: 8px;
  height: 245px;
  margin-top: 15px;
  border-bottom: 1px solid #eadfd9;
}

.lum-dash-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  min-width: 0;
}

.lum-dash-bar-col > span {
  height: 20px;
  color: #8f7668;
  font-size: 9px;
}

.lum-dash-bar-area {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 185px;
  width: 100%;
}

.lum-dash-bar {
  width: 62%;
  max-width: 38px;
  background: linear-gradient(
    180deg,#e6cfc2,#aa8d7e
  );
  border-radius: 20px;
  transition: height .3s;
}

.lum-dash-bar-col small {
  padding: 10px 0;
  font-size: 10px;
}

.lum-dash-link {
  border: 0;
  background: transparent;
  color: #a07965;
  font-weight: 700;
  cursor: pointer;
}

.lum-dash-table-wrap {
  overflow-x: auto;
  margin-top: 20px;
}

.lumina .lum-dash-table {
  width: 100%;
  min-width: 650px;
  border-collapse: collapse;
  text-align: left;
  font-size: 12px;
}

.lumina .lum-dash-table th {
  background: transparent;
  padding: 15px 9px;
  color: #6e5b51;
}

.lumina .lum-dash-table td {
  padding: 14px 9px;
  border-bottom: 1px solid #eee1d9;
}

.lum-dash-order-product {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lum-dash-order-product img {
  width: 43px;
  height: 48px;
  object-fit: cover;
  border-radius: 5px;
}

.lum-dash-status {
  display: inline-block;
  border-radius: 20px;
  padding: 7px 10px;
  background: #eee5da;
  white-space: nowrap;
}

.lum-dash-status.selesai {
  color: #2e7e50;
  background: #e0f3e7;
}

.lum-dash-status.dibatalkan {
  color: #ad4545;
  background: #fae2e2;
}

.lum-dash-status.diproses,
.lum-dash-status.dikirim {
  color: #846039;
  background: #f8ebd9;
}

.lum-dash-empty {
  padding: 35px !important;
  text-align: center;
  color: #908177;
}

.lum-dash-right {
  padding: 40px 23px;
  background: #fff;
  border-left: 1px solid #f1e9e4;
  min-width: 0;
}

.lum-dash-right section {
  margin-bottom: 38px;
}

.lum-dash-right h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.lum-dash-small {
  color: #9c8b80;
  font-size: 11px;
  line-height: 1.6;
}

.lum-dash-side-product {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 17px 0;
}

.lum-dash-side-product img {
  width: 52px;
  height: 56px;
  object-fit: cover;
  border-radius: 5px;
}

.lum-dash-side-product div {
  flex: 1;
  min-width: 0;
}

.lum-dash-side-product strong {
  display: block;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.lum-dash-side-product small {
  display: block;
  margin-top: 6px;
  color: #948177;
  font-size: 10px;
}

.lum-dash-stock {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1e9e4;
  font-size: 11px;
}

.lum-dash-stock strong {
  color: #b86647;
}

.lum-dash-status-grid {
  display: grid;
  grid-template-columns: repeat(5,minmax(0,1fr));
  gap: 10px;
  margin-top: 20px;
}

.lum-dash-status-grid > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 10px;
  background: #fff;
}

.lum-dash-status-grid strong {
  font-size: 25px;
}

.lum-dash-status-grid span {
  color: #85766a;
  font-size: 10px;
}

.lum-dash-products {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;
  align-items: start;
}

.lum-dash-product-form {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.lum-dash-product-form label {
  font-size: 12px;
  font-weight: 600;
}

.lum-dash-product-form button {
  margin-top: 8px;
}

.lum-dash-preview {
  width: 100%;
  max-height: 150px;
  object-fit: contain;
}

.lum-dash-product-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid #eee2d9;
  flex-wrap: wrap;
}

.lum-dash-product-row img {
  width: 55px;
  height: 60px;
  object-fit: cover;
  border-radius: 7px;
}

.lum-dash-product-row > div {
  flex: 1;
  min-width: 120px;
}

.lum-dash-product-row strong {
  font-size: 12px;
}

.lum-dash-product-row p {
  color: #8c7c70;
  font-size: 11px;
}

.lum-dash-product-row button {
  padding: 9px;
  font-size: 11px;
}

@media(min-width:1261px) {
  .lum-dash-sidebar,
  .lum-dash-right {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    align-self: start;
  }
}

@media(min-width:781px) and (max-width:1260px) {
  .lum-dash {
    grid-template-columns: 190px minmax(0,1fr);
  }

  .lum-dash-main {
    padding: 28px 22px;
  }

  .lum-dash-right {
    grid-column: 2;
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 20px;
    border-top: 1px solid #eee7e2;
  }

  .lum-dash-stats {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .lum-dash-products {
    grid-template-columns: 1fr;
  }
}

@media(max-width:780px) {
  .lum-dash {
    grid-template-columns: minmax(0,1fr);
  }

  .lum-dash-sidebar {
    padding: 20px;
    gap: 15px;
  }

  .lum-dash-logo {
    margin: 0;
  }

  .lum-dash-menu-label {
    display: none;
  }

  .lum-dash-menu {
    flex-direction: row;
    overflow-x: auto;
  }

  .lum-dash-menu button {
    white-space: nowrap;
  }

  .lum-dash-sidebar-bottom {
    margin-top: 0;
  }

  .lum-dash-main {
    padding: 22px 15px;
  }

  .lum-dash-right {
    grid-column: 1;
    display: block;
    padding: 25px 20px;
  }

  .lum-dash-topbar {
    flex-wrap: wrap;
  }

  .lum-dash-search {
    order: 3;
    flex-basis: 100%;
    max-width: none;
  }

  .lum-dash-stats {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .lum-dash-products {
    grid-template-columns: 1fr;
  }

  .lum-dash-status-grid {
    grid-template-columns: repeat(2,1fr);
  }
}

@media(max-width:480px) {
  .lum-dash-metric {
    padding: 12px;
  }

  .lum-dash-metric strong {
    font-size: 14px;
  }

  .lum-dash-card {
    padding: 16px;
  }

  .lum-dash-chart {
    gap: 2px;
  }

  .lum-dash-bar-col small,
  .lum-dash-bar-col > span {
    font-size: 8px;
  }
}
`;
