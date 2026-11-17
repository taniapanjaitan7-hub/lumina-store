
import { useEffect, useState } from "react";
import "./App.css";

/* ============================================
   LUMINA STORE - FAMILY FASHION COLLECTION
   REACT + VITE
   HOME, SHOP, WISHLIST, CART, ADMIN DASHBOARD
============================================ */

// Foto referensi dari Unsplash.
// Untuk toko sungguhan, gunakan foto produk milik toko.
const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=85`;

const photos = {
  tshirt: photo("photo-1521572163474-6864f9cf17ab"),
  sneakers: photo("photo-1542291026-7eec264c27ff"),
  denim: photo("photo-1544022613-e87ca75a784a"),
  shoes: photo("photo-1549298916-b41d501d3772"),
  hoodie: photo("photo-1556821840-3a63f95609a7"),
  handbag: photo("photo-1584917865442-de89df76afd3"),
  fashion1: photo("photo-1515886657613-9f3515b0c78f"),
  fashion2: photo("photo-1529139574466-a303027c1d8b"),
  fashion3: photo("photo-1496747611176-843222e1e57c"),
  fashion4: photo("photo-1515372039744-b8f02a3ae446"),
  fashion5: photo("photo-1483985988355-763728e1935b"),
  fashion6: photo("photo-1503919005314-30d93d07d823"),
  fashion7: photo("photo-1518831959646-742c3a14ebf7"),
  heels: photo("photo-1543163521-1bf539c55dd2"),
  flats: photo("photo-1515347619252-60a4bf4fff4f"),
  loafers: photo("photo-1614252235316-8c857d38b5f4"),
  formal: photo("photo-1520639888713-7851133b1ed0"),
  sneakers2: photo("photo-1600185365483-26d7a4cc7519"),
  sneakers3: photo("photo-1525966222134-fcfa99b8ae77"),
  shirt: photo("photo-1603252109303-2751441dd157"),
  lifestyle: photo("photo-1539109136881-3be0616acf4b"),
};

const adultSizes = ["S", "M", "L", "XL", "XXL"];
const childSizes = [
  "2-3 Tahun",
  "4-5 Tahun",
  "6-7 Tahun",
  "8-10 Tahun",
  "11-12 Tahun",
];

function product(
  id,
  name,
  category,
  price,
  stock,
  image,
  sizes,
  colors,
  description,
  keywords = ""
) {
  return {
    id,
    name,
    category,
    price,
    stock,
    image,
    sizes,
    colors,
    description,
    keywords,
  };
}

// ============================================
// KATALOG PRODUK
// ============================================

const catalog = [
  product(
    1, "Classic T-Shirt", "Fashion", 125000, 20,
    photos.tshirt,
    ["S", "M", "L", "XL"],
    ["White", "Black", "Cream"],
    "Kaos premium untuk aktivitas sehari-hari.",
    "kaos pria wanita cowok cewek dewasa casual"
  ),
  product(
    2, "Urban Sneakers", "Shoes", 350000, 15,
    photos.sneakers,
    ["39", "40", "41", "42", "43"],
    ["Red", "Black", "White"],
    "Sneakers sporty untuk gaya modern.",
    "sepatu pria cowok dewasa olahraga"
  ),
  product(
    3, "Denim Jacket", "Fashion", 275000, 12,
    photos.denim,
    ["M", "L", "XL"],
    ["Blue", "Black"],
    "Jaket denim berkualitas dengan gaya kasual.",
    "jaket cowok cewek pria wanita dewasa"
  ),
  product(
    4, "Minimalist Sneakers", "Shoes", 395000, 10,
    photos.shoes,
    ["39", "40", "41", "42"],
    ["Cream", "White"],
    "Sepatu minimalis untuk gaya sehari-hari.",
    "sepatu pria wanita dewasa sneakers"
  ),
  product(
    5, "Premium Hoodie", "Fashion", 245000, 18,
    photos.hoodie,
    ["M", "L", "XL"],
    ["Black", "Grey", "Cream"],
    "Hoodie premium dengan bahan nyaman.",
    "hoodie jaket pria wanita dewasa"
  ),
  product(
    6, "Leather Handbag", "Accessories", 425000, 8,
    photos.handbag,
    ["All Size"],
    ["Brown", "Black"],
    "Tas elegan untuk berbagai kesempatan.",
    "tas wanita perempuan dewasa"
  ),
  product(
    101, "Batik Pria Modern", "Fashion", 189000, 25,
    photos.shirt,
    adultSizes,
    ["Brown", "Navy", "Black"],
    "Kemeja batik pria untuk kerja, gereja dan acara keluarga.",
    "batik pria cowok cowo laki laki bapak ayah suami dewasa"
  ),
  product(
    102, "Batik Wanita Elegan", "Fashion", 215000, 20,
    photos.fashion2,
    adultSizes,
    ["Maroon", "Cream", "Brown"],
    "Batik wanita untuk pesta dan acara resmi.",
    "batik wanita cewek cewe perempuan ibu istri dewasa"
  ),
  product(
    103, "Batik Anak Laki-Laki", "Fashion", 99000, 30,
    photos.fashion6,
    childSizes,
    ["Blue", "Brown"],
    "Batik anak laki-laki untuk sekolah dan keluarga.",
    "batik anak kecil cowok cowo laki laki sekolah"
  ),
  product(
    104, "Dress Batik Anak Perempuan", "Fashion", 115000, 24,
    photos.fashion7,
    childSizes,
    ["Pink", "Cream", "Maroon"],
    "Dress batik anak perempuan untuk pesta.",
    "batik dress anak kecil cewek cewe perempuan"
  ),
  product(
    105, "Batik Couple Suami Istri", "Fashion", 375000, 15,
    photos.fashion5,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Brown", "Navy"],
    "Set pakaian batik senada untuk pasangan.",
    "batik couple pria wanita pasangan keluarga suami istri dewasa"
  ),
  product(
    106, "Batik Sarimbit Keluarga", "Fashion", 575000, 12,
    photos.fashion3,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Brown", "Green"],
    "Set batik keluarga untuk ayah, ibu dan anak.",
    "batik sarimbit keluarga pasangan ayah ibu anak dewasa"
  ),
  product(
    107, "Kebaya Wanita Modern", "Fashion", 285000, 18,
    photos.fashion1,
    adultSizes,
    ["Pink", "Cream", "Maroon"],
    "Kebaya modern untuk wisuda dan acara adat.",
    "kebaya wanita cewek perempuan dewasa wisuda pesta"
  ),
  product(
    108, "Kebaya Ibu Brokat Premium", "Fashion", 345000, 14,
    photos.fashion3,
    ["M", "L", "XL", "XXL"],
    ["Gold", "Brown", "Navy"],
    "Kebaya brokat untuk ibu dan wanita dewasa.",
    "kebaya ibu perempuan dewasa brokat formal"
  ),
  product(
    109, "Kebaya Anak Perempuan", "Fashion", 145000, 22,
    photos.fashion7,
    childSizes,
    ["Pink", "White", "Purple"],
    "Kebaya anak untuk kegiatan adat dan keluarga.",
    "kebaya anak kecil cewek perempuan pesta"
  ),
  product(
    110, "Sepatu Sekolah Anak Laki-Laki", "Shoes", 159000, 40,
    photos.formal,
    ["28", "29", "30", "31", "32", "33", "34", "35", "36"],
    ["Black"],
    "Sepatu sekolah untuk anak laki-laki.",
    "sepatu sekolah anak cowok laki laki hitam pelajar"
  ),
  product(
    111, "Sepatu Sekolah Anak Perempuan", "Shoes", 155000, 35,
    photos.sneakers3,
    ["28", "29", "30", "31", "32", "33", "34", "35", "36"],
    ["Black"],
    "Sepatu sekolah untuk anak perempuan.",
    "sepatu sekolah anak cewek perempuan hitam pelajar"
  ),
  product(
    112, "Sepatu Gereja Wanita", "Shoes", 245000, 20,
    photos.heels,
    ["36", "37", "38", "39", "40", "41"],
    ["Black", "Cream", "Brown"],
    "Sepatu wanita elegan untuk ibadah dan acara formal.",
    "sepatu gereja wanita cewek perempuan ibu dewasa formal heels"
  ),
  product(
    113, "Sepatu Gereja Pria Formal", "Shoes", 295000, 25,
    photos.loafers,
    ["39", "40", "41", "42", "43", "44"],
    ["Black", "Brown"],
    "Sepatu pantofel pria untuk gereja dan kegiatan resmi.",
    "sepatu gereja cowok pria laki laki dewasa bapak pantofel"
  ),
  product(
    114, "Sepatu Gereja Anak Perempuan", "Shoes", 175000, 24,
    photos.flats,
    ["27", "28", "29", "30", "31", "32", "33", "34"],
    ["Black", "White", "Pink"],
    "Sepatu formal anak perempuan untuk acara istimewa.",
    "sepatu gereja anak cewek perempuan pesta"
  ),
  product(
    115, "Sepatu Gereja Anak Laki-Laki", "Shoes", 185000, 24,
    photos.formal,
    ["28", "29", "30", "31", "32", "33", "34", "35"],
    ["Black", "Brown"],
    "Sepatu formal anak laki-laki untuk ibadah.",
    "sepatu gereja anak cowok pria laki laki pantofel"
  ),
  product(
    116, "Sneakers Pria Casual", "Shoes", 325000, 28,
    photos.sneakers,
    ["39", "40", "41", "42", "43", "44"],
    ["White", "Black", "Grey"],
    "Sneakers pria untuk aktivitas sehari-hari.",
    "sepatu cowok pria dewasa casual sneakers"
  ),
  product(
    117, "Sepatu Anak Casual", "Shoes", 145000, 32,
    photos.sneakers2,
    ["26", "27", "28", "29", "30", "31", "32", "33"],
    ["White", "Blue", "Pink"],
    "Sneakers anak untuk bermain dan sekolah.",
    "sepatu anak kecil cowok cewek sneakers"
  ),
  product(
    118, "Kebaya Couple Ibu dan Anak", "Fashion", 395000, 12,
    photos.fashion4,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Pink", "Cream", "Maroon"],
    "Set kebaya senada untuk ibu dan anak.",
    "kebaya keluarga couple ibu anak perempuan dewasa"
  ),
  product(
    119, "Blouse Wanita Floral", "Fashion", 175000, 18,
    photos.fashion3,
    adultSizes,
    ["White", "Pink", "Beige"],
    "Blouse wanita dengan tampilan elegan.",
    "blouse wanita cewek perempuan dewasa floral"
  ),
  product(
    120, "Kemeja Formal Pria", "Fashion", 199000, 21,
    photos.shirt,
    adultSizes,
    ["White", "Blue", "Grey"],
    "Kemeja formal pria untuk kerja dan acara resmi.",
    "kemeja pria cowok dewasa bapak kerja"
  ),
  product(
    121, "Flat Shoes Wanita", "Shoes", 189000, 17,
    photos.flats,
    ["36", "37", "38", "39", "40"],
    ["Black", "Nude", "Brown"],
    "Sepatu flat wanita untuk aktivitas harian.",
    "sepatu flat shoes wanita cewek gereja dewasa"
  ),
  product(
    122, "Loafers Pria Casual", "Shoes", 279000, 16,
    photos.loafers,
    ["39", "40", "41", "42", "43"],
    ["Brown", "Black"],
    "Sepatu loafers pria yang simpel dan rapi.",
    "sepatu loafers pria cowok dewasa casual"
  ),
  product(
    123, "Dress Wanita Casual", "Fashion", 225000, 20,
    photos.fashion4,
    adultSizes,
    ["Cream", "Black", "Pink"],
    "Dress wanita untuk acara santai.",
    "dress gaun wanita cewek dewasa"
  ),
  product(
    124, "Sepatu Sneakers Putih", "Shoes", 249000, 30,
    photos.sneakers3,
    ["37", "38", "39", "40", "41", "42", "43"],
    ["White"],
    "Sneakers putih dengan desain minimalis.",
    "sepatu putih sneakers wanita pria dewasa"
  ),
  product(
    125, "Fashion Anak Perempuan", "Fashion", 135000, 25,
    photos.fashion7,
    childSizes,
    ["Pink", "Cream"],
    "Koleksi busana casual anak perempuan.",
    "baju pakaian anak kecil perempuan cewek"
  ),
  product(
    126, "Koleksi Fashion Wanita Premium", "Fashion", 329000, 14,
    photos.lifestyle,
    adultSizes,
    ["Brown", "Cream", "Black"],
    "Fashion wanita premium untuk acara istimewa.",
    "baju wanita cewek perempuan dewasa"
  ),
];

// ============================================
// KATEGORI DAN DATA BANTUAN
// ============================================

const categoryOptions = [
  ["All", "Semua Produk"],
  ["Fashion", "Fashion"],
  ["Batik", "Batik"],
  ["Kebaya", "Kebaya"],
  ["Shoes", "Sepatu"],
  ["Sekolah", "Sepatu Sekolah"],
  ["Gereja", "Sepatu Gereja"],
  ["Anak", "Anak-Anak"],
  ["Dewasa", "Dewasa"],
  ["Keluarga", "Keluarga"],
  ["Accessories", "Accessories"],
];

const orderStatuses = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
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

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${Math.round(value / 1000)}rb`;
  return String(value);
};

function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function normalize(text) {
  const aliases = {
    cowok: "pria",
    cowo: "pria",
    laki: "pria",
    bapak: "pria",
    ayah: "pria",
    suami: "pria",
    cewek: "wanita",
    cewe: "wanita",
    perempuan: "wanita",
    ibu: "wanita",
    istri: "wanita",
    bocah: "anak",
    balita: "anak",
    kids: "anak",
    menikah: "keluarga",
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

function productMatches(item, search, category, size, maxPrice) {
  const text = normalize([
    item.name,
    item.description,
    item.keywords,
    item.category,
    ...(item.sizes || []),
    ...(item.colors || []),
  ].join(" "));

  const words = normalize(search).split(" ").filter(Boolean);
  const matchesWords = words.every((word) => text.includes(word));

  const specialCategories = {
    All: true,
    Fashion: item.category === "Fashion",
    Shoes: item.category === "Shoes",
    Accessories: item.category === "Accessories",
    Batik: text.includes("batik"),
    Kebaya: text.includes("kebaya"),
    Sekolah: text.includes("sepatu") && text.includes("sekolah"),
    Gereja: text.includes("sepatu") && text.includes("gereja"),
    Anak: text.includes("anak"),
    Dewasa: text.includes("dewasa"),
    Keluarga: text.includes("keluarga"),
  };

  const matchesCategory = specialCategories[category] ?? true;
  const matchesSize =
    !size || (item.sizes || []).includes(size);
  const matchesPrice =
    !maxPrice || Number(item.price) <= Number(maxPrice);

  return (
    matchesWords &&
    matchesCategory &&
    matchesSize &&
    matchesPrice
  );
}

function orderStatus(status) {
  return status && status !== "Simulasi"
    ? status
    : "Pesanan Baru";
}

function ProductCard({ item, favorite, onFavorite, onDetail, onAdd }) {
  return (
    <article className="product-card">
      <div className="product-picture">
        <button
          className="image-button"
          type="button"
          onClick={() => onDetail(item)}
        >
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.background = "#eee4dc";
            }}
          />
        </button>

        <button
          className="heart"
          type="button"
          aria-label={`Wishlist ${item.name}`}
          onClick={() => onFavorite(item.id)}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <span className="stock-label">
          {item.stock > 0 ? "NEW COLLECTION" : "SOLD OUT"}
        </span>
      </div>

      <div className="product-body">
        <small>{item.category}</small>
        <h3>{item.name}</h3>
        <p className="price">{money(item.price)}</p>
        <p className="muted">Stok: {item.stock}</p>
        <div className="product-actions">
          <button className="btn-light" onClick={() => onDetail(item)}>
            Detail
          </button>
          <button
            className="btn-dark"
            disabled={item.stock <= 0}
            onClick={() => onAdd(item)}
          >
            + Keranjang
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({ items, wishlist, onFavorite, onDetail, onAdd }) {
  return (
    <div className="product-grid">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          favorite={wishlist.includes(item.id)}
          onFavorite={onFavorite}
          onDetail={onDetail}
          onAdd={onAdd}
        />
      ))}

      {items.length === 0 && (
        <p className="empty">
          Produk tidak ditemukan. Coba kata kunci atau filter lain.
        </p>
      )}
    </div>
  );
}

// ============================================
// TABEL ORDER ADMIN
// ============================================

function OrderTable({ orders, onStatus, editable }) {
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
            const first = order.items?.[0];
            const status = orderStatus(order.status);

            return (
              <tr key={order.id}>
                <td>
                  <div className="lum-dash-order-product">
                    {first?.image && (
                      <img src={first.image} alt={first.name} />
                    )}
                    <span>{first?.name || "Produk"}</span>
                  </div>
                </td>
                <td>{order.customer}</td>
                <td>{order.id}</td>
                <td>{money(order.total)}</td>
                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={
                        status === "Selesai" ||
                        status === "Dibatalkan"
                      }
                      onChange={(e) => onStatus(order.id, e.target.value)}
                    >
                      {orderStatuses.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={
                        "lum-dash-status " +
                        status.toLowerCase().replaceAll(" ", "-")
                      }
                    >
                      {status}
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
// ADMIN DASHBOARD FULL SCREEN
// ============================================

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
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [year, setYear] = useState(new Date().getFullYear());

  const completed = orders.filter(
    (item) => orderStatus(item.status) === "Selesai"
  );

  const active = orders.filter(
    (item) => orderStatus(item.status) !== "Dibatalkan"
  );

  const revenue = completed.reduce(
    (sum, item) => sum + Number(item.total || 0), 0
  );

  const activeValue = active.reduce(
    (sum, item) => sum + Number(item.total || 0), 0
  );

  const stock = products.reduce(
    (sum, item) => sum + Number(item.stock || 0), 0
  );

  const metrics = [
    ["◉", "Penjualan Selesai", money(revenue), "Completed"],
    ["◈", "Nilai Pesanan Aktif", money(activeValue), "Non-cancelled"],
    ["▤", "Total Pesanan", orders.length, `${completed.length} selesai`],
    ["▣", "Total Produk", products.length, `${stock} unit`],
  ];

  const sold = new Map();

  completed.forEach((order) => {
    (order.items || []).forEach((item) => {
      const previous = sold.get(item.id) || 0;
      sold.set(item.id, previous + Number(item.quantity || 0));
    });
  });

  const popular = [...products]
    .sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0))
    .slice(0, 4);

  const bestSelling = products
    .filter((item) => (sold.get(item.id) || 0) > 0)
    .sort((a, b) => sold.get(b.id) - sold.get(a.id))
    .slice(0, 5);

  const lowStock = products.filter((item) => item.stock <= 5);

  const availableYears = [...new Set([
    new Date().getFullYear(),
    ...orders
      .map((item) => new Date(item.date).getFullYear())
      .filter(Number.isFinite),
  ])].sort((a, b) => b - a);

  const months = Array.from({ length: 12 }, (_, index) => ({
    label: new Date(2026, index, 1).toLocaleString("id-ID", {
      month: "short",
    }),
    total: completed
      .filter((item) => {
        const d = new Date(item.date);
        return d.getFullYear() === year && d.getMonth() === index;
      })
      .reduce((sum, item) => sum + Number(item.total || 0), 0),
  }));

  const maxMonth = Math.max(1, ...months.map((item) => item.total));

  const visibleOrders = [...orders]
    .filter((item) => {
      const data = [
        item.id,
        item.customer,
        ...(item.items || []).map((p) => p.name),
      ].join(" ").toLowerCase();

      return data.includes(query.toLowerCase()) &&
        (filter === "Semua" || orderStatus(item.status) === filter);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleProducts = products.filter((item) =>
    productMatches(item, query, "All", "", "")
  );

  const titleMap = {
    overview: "Overview",
    report: "Sales Report",
    orders: "Manajemen Pesanan",
    products: "Kelola Produk",
  };

  return (
    <div className="lum-dash">
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
              type="button"
              className={section === key ? "active" : ""}
              onClick={() => {
                setSection(key);
                setQuery("");
              }}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </nav>
        <div className="lum-dash-sidebar-bottom">
          <strong>Business</strong>
          <p>Family Fashion & Lifestyle</p>
          <small>● Admin Demo</small>
          <button className="lum-dash-back" onClick={onBack}>
            ← Kembali ke Toko
          </button>
        </div>
      </aside>

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <span className="lum-dash-eyebrow">
              LUMINA MANAGEMENT SYSTEM
            </span>
            <h1>{titleMap[section]}</h1>
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

        {(section === "overview" || section === "report") && (
          <div className="lum-dash-stats">
            {metrics.map(([icon, label, value, note]) => (
              <div className="lum-dash-metric" key={label}>
                <div className="lum-dash-metric-head">
                  <span className="lum-dash-metric-icon">{icon}</span>
                  <small>{note}</small>
                </div>
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
                <div>
                  <h2>Earning Revenue</h2>
                  <p>Pendapatan dari pesanan selesai</p>
                </div>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {availableYears.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="lum-dash-chart-total">
                {money(months.reduce((sum, month) => sum + month.total, 0))}
                <small>Total {year}</small>
              </div>
              <div className="lum-dash-chart">
                {months.map((month, index) => (
                  <div className="lum-dash-bar-col" key={index}>
                    <span>
                      {month.total ? compactMoney(month.total) : ""}
                    </span>
                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        style={{
                          height: `${(month.total / maxMonth) * 100}%`,
                        }}
                        title={money(month.total)}
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
                onStatus={onStatus}
                editable={false}
              />
            </section>
          </>
        )}

        {section === "report" && (
          <>
            <section className="lum-dash-card">
              <h2>Ringkasan Status Pesanan</h2>
              <div className="lum-dash-status-grid">
                {orderStatuses.map((status) => (
                  <div key={status}>
                    <strong>
                      {orders.filter(
                        (o) => orderStatus(o.status) === status
                      ).length}
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
                onStatus={onStatus}
                editable={false}
              />
            </section>
          </>
        )}

        {section === "orders" && (
          <section className="lum-dash-card">
            <div className="lum-dash-card-head">
              <div>
                <h2>Manajemen Pesanan</h2>
                <p>Perbarui status pesanan simulasi</p>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Semua</option>
                {orderStatuses.map((status) => (
                  <option key={status}>{status}</option>
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

        {section === "products" && (
          <div className="lum-dash-products">
            <form className="lum-dash-card lum-dash-product-form" onSubmit={onSave}>
              <h2>{editingId !== null ? "Edit Produk" : "Tambah Produk"}</h2>

              <label>Nama Produk</label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <label>Kategori</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option>Fashion</option>
                <option>Shoes</option>
                <option>Accessories</option>
              </select>

              <label>Harga (Rp)</label>
              <input
                type="number"
                min="1"
                required
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
              />

              <label>Stok</label>
              <input
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value })
                }
              />

              <label>URL Foto Produk</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
              />

              {form.image && (
                <img className="lum-dash-preview" src={form.image} alt="Preview" />
              )}

              <label>Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label>Kata Kunci Pencarian</label>
              <textarea
                rows={2}
                placeholder="Contoh: batik pria cowok dewasa"
                value={form.keywords}
                onChange={(e) =>
                  setForm({ ...form, keywords: e.target.value })
                }
              />

              <label>Ukuran (pisahkan dengan koma)</label>
              <input
                value={form.sizes}
                onChange={(e) =>
                  setForm({ ...form, sizes: e.target.value })
                }
              />

              <label>Warna (pisahkan dengan koma)</label>
              <input
                value={form.colors}
                onChange={(e) =>
                  setForm({ ...form, colors: e.target.value })
                }
              />

              <button className="btn-dark" type="submit">
                {editingId !== null ? "Simpan Perubahan" : "+ Tambah Produk"}
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
              <h2>Daftar Produk ({products.length})</h2>
              <p className="lum-dash-small">
                Cari produk menggunakan kolom di atas.
              </p>

              {visibleProducts.map((item) => (
                <div className="lum-dash-product-row" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <p>{money(item.price)} · Stok {item.stock}</p>
                  </div>
                  <button className="btn-light" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => onDelete(item.id)}>
                    Hapus
                  </button>
                </div>
              ))}
              {visibleProducts.length === 0 && (
                <p className="lum-dash-small">Produk tidak ditemukan.</p>
              )}
            </section>
          </div>
        )}
      </main>

      <aside className="lum-dash-right">
        <section>
          <h3>Produk Populer</h3>
          <p className="lum-dash-small">Berdasarkan penjualan selesai</p>
          {popular.map((item) => (
            <div className="lum-dash-side-product" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <small>{sold.get(item.id) || 0} unit terjual</small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Top Selling Product</h3>
          {bestSelling.length === 0 && (
            <p className="lum-dash-small">Belum ada penjualan selesai.</p>
          )}
          {bestSelling.map((item) => (
            <div className="lum-dash-side-product" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <small>{sold.get(item.id)} unit</small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Stock Alert</h3>
          <p className="lum-dash-small">Stok lima unit atau kurang</p>
          {lowStock.length === 0 ? (
            <p className="lum-dash-small">✓ Stok mencukupi.</p>
          ) : (
            lowStock.map((item) => (
              <div className="lum-dash-stock" key={item.id}>
                <span>{item.name}</span>
                <strong>{item.stock}</strong>
              </div>
            ))
          )}
        </section>
      </aside>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [products, setProducts] = useState(() => {
    const saved = readStorage("lumina_products_v1", catalog);
    const old = Array.isArray(saved) ? saved : catalog;

    const merged = old.map((item) => {
      const current = catalog.find((p) => String(p.id) === String(item.id));
      if (!current) return item;

      // Perbarui foto referensi lama, tanpa mengubah harga/stok
      // atau foto yang sudah diganti sendiri melalui Admin.
      const oldPhoto = !item.image ||
        item.image.includes("placehold.co") ||
        item.image.includes("unsplash.com/photos/");

      return {
        ...current,
        ...item,
        image: oldPhoto ? current.image : item.image,
        keywords: item.keywords || current.keywords,
      };
    });

    const ids = new Set(merged.map((item) => String(item.id)));
    return [
      ...merged,
      ...catalog.filter((item) => !ids.has(String(item.id))),
    ];
  });

  const [cart, setCart] = useState(() =>
    readStorage("lumina_cart_v1", [])
  );
  const [wishlist, setWishlist] = useState(() =>
    readStorage("lumina_wishlist_v1", [])
  );
  const [orders, setOrders] = useState(() =>
    readStorage("lumina_orders_v1", [])
  );

  const [page, setPage] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("default");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    shipping: "regular",
  });

  useEffect(() => {
    localStorage.setItem("lumina_products_v1", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("lumina_cart_v1", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("lumina_wishlist_v1", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("lumina_orders_v1", JSON.stringify(orders));
  }, [orders]);

  const selected = products.find((item) => item.id === selectedId);

  const filtered = products
    .filter((item) =>
      productMatches(item, search, category, sizeFilter, maxPrice)
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return a.id - b.id;
    });

  const sizesAvailable = [...new Set(
    products.flatMap((item) => item.sizes || [])
  )];

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.price, 0
  );
  const shippingFee = checkout.shipping === "express" ? 25000 : 12000;

  function notify(text) {
    setMessage(text);
  }

  function navigate(destination) {
    setPage(destination);
    window.scrollTo(0, 0);
  }

  function openProduct(item) {
    setSelectedId(item.id);
    setSelectedSize(item.sizes?.[0] || "All Size");
    setSelectedColor(item.colors?.[0] || "Default");
    navigate("detail");
  }

  function toggleWishlist(id) {
    setWishlist((old) =>
      old.includes(id) ? old.filter((item) => item !== id) : [...old, id]
    );
  }

  function addToCart(item, size, color) {
    const currentSize = size || item.sizes?.[0] || "All Size";
    const currentColor = color || item.colors?.[0] || "Default";
    const key = `${item.id}-${currentSize}-${currentColor}`;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    if (used >= item.stock) {
      notify("Stok tidak mencukupi.");
      return;
    }

    setCart((old) => {
      const existing = old.find((p) => p.key === key);
      if (existing) {
        return old.map((p) =>
          p.key === key ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [
        ...old,
        {
          ...item,
          key,
          size: currentSize,
          color: currentColor,
          quantity: 1,
        },
      ];
    });

    notify("Produk berhasil ditambahkan ke keranjang.");
  }

  function changeQuantity(key, amount) {
    const item = cart.find((p) => p.key === key);
    const current = products.find((p) => p.id === item?.id);
    if (!item || !current) return;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    if (amount > 0 && used >= current.stock) {
      notify("Jumlah melebihi stok tersedia.");
      return;
    }

    setCart((old) =>
      old.map((p) =>
        p.key === key ? { ...p, quantity: p.quantity + amount } : p
      ).filter((p) => p.quantity > 0)
    );
  }

  function placeOrder(event) {
    event.preventDefault();
    if (cart.length === 0) return;

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(checkout.phone.trim())
    ) {
      notify("Periksa kembali data pembeli.");
      return;
    }

    const quantities = {};
    cart.forEach((item) => {
      quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
    });

    for (const [id, quantity] of Object.entries(quantities)) {
      const item = products.find((p) => String(p.id) === id);
      if (!item || item.stock < quantity) {
        notify("Stok salah satu produk tidak mencukupi.");
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
      items: cart.map((p) => ({ ...p })),
      total: subtotal + shippingFee,
      status: "Pesanan Baru",
      stockRestored: false,
    };

    setOrders((old) => [order, ...old]);
    setProducts((old) =>
      old.map((p) => ({
        ...p,
        stock: p.stock - (quantities[p.id] || 0),
      }))
    );
    setCart([]);
    setCheckout({
      name: "",
      phone: "",
      address: "",
      shipping: "regular",
    });
    navigate("success");
  }

  function updateStatus(id, nextStatus) {
    const order = orders.find((item) => item.id === id);
    if (!order) return;

    if (
      orderStatus(order.status) === "Selesai" ||
      orderStatus(order.status) === "Dibatalkan"
    ) {
      notify("Status final tidak bisa diubah.");
      return;
    }

    if (nextStatus === "Dibatalkan" && !order.stockRestored) {
      setProducts((old) =>
        old.map((p) => ({
          ...p,
          stock: p.stock + (order.items || [])
            .filter((item) => item.id === p.id)
            .reduce((sum, item) => sum + item.quantity, 0),
        }))
      );
    }

    setOrders((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              stockRestored:
                item.stockRestored || nextStatus === "Dibatalkan",
            }
          : item
      )
    );
    notify(`Status menjadi ${nextStatus}.`);
  }

  function saveProduct(event) {
    event.preventDefault();

    const item = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim(),
      description: form.description.trim(),
      keywords: form.keywords.trim(),
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
    };

    if (
      !item.name ||
      !item.image ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isInteger(item.stock) ||
      item.stock < 0 ||
      !item.sizes.length ||
      !item.colors.length
    ) {
      notify("Periksa kembali data produk dan URL foto.");
      return;
    }

    if (editingId !== null) {
      setProducts((old) =>
        old.map((p) => p.id === editingId ? item : p)
      );
      setCart((old) =>
        old.map((p) => p.id === editingId ? { ...p, ...item } : p)
      );
    } else {
      setProducts((old) => [...old, item]);
    }

    setEditingId(null);
    setForm(emptyForm);
    notify("Produk berhasil disimpan.");
  }

  function editProduct(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      image: item.image || "",
      description: item.description || "",
      keywords: item.keywords || "",
      sizes: (item.sizes || []).join(","),
      colors: (item.colors || []).join(","),
    });
    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    if (!window.confirm("Yakin ingin menghapus produk?")) return;
    setProducts((old) => old.filter((item) => item.id !== id));
    setCart((old) => old.filter((item) => item.id !== id));
    setWishlist((old) => old.filter((item) => item !== id));
    notify("Produk berhasil dihapus.");
  }

  const gridProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onAdd: addToCart,
  };

  return (
    <div className={`lumina ${page === "admin" ? "admin-mode" : ""}`}>
      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — FASHION FOR EVERY GENERATION
          </div>
          <header className="navbar">
            <button className="logo" onClick={() => navigate("home")}>
              LUMINA<span>.</span>
            </button>
            <nav className="nav-menu">
              <button onClick={() => navigate("home")}>Home</button>
              <button onClick={() => navigate("shop")}>Shop</button>
              <button onClick={() => navigate("wishlist")}>
                ♡ Wishlist ({wishlist.length})
              </button>
              <button onClick={() => navigate("admin")}>
                Admin Demo
              </button>
            </nav>
            <button className="cart-link" onClick={() => navigate("cart")}>
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
              <p className="eyebrow">FAMILY COLLECTION — 2026</p>
              <h1>
                Discover Your <em>Unique Style.</em>
              </h1>
              <p>
                Koleksi batik, kebaya, sepatu, dan fashion
                pilihan untuk anak-anak hingga dewasa.
              </p>
              <button className="btn-dark" onClick={() => navigate("shop")}>
                Shop Collection →
              </button>
              <p className="hero-bottom">
                ✦ BATIK ✦ KEBAYA ✦ FAMILY FASHION
              </p>
            </div>
            <div className="hero-photo">
              <img src={photos.fashion5} alt="Lumina fashion collection" />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧ <strong>Premium Collection</strong>
              <span>Koleksi pilihan keluarga</span>
            </div>
            <div>
              ♡ <strong>All Generations</strong>
              <span>Anak-anak hingga dewasa</span>
            </div>
            <div>
              ✦ <strong>New Arrivals</strong>
              <span>Batik, kebaya, dan sepatu</span>
            </div>
          </section>

          <main className="container section">
            <p className="eyebrow center">CURATED FOR YOU</p>
            <h2 className="section-title">Featured Collection</h2>
            <p className="section-description">
              Pilihan fashion untuk seluruh keluarga.
            </p>
            <ProductGrid
              items={products.slice(0, 9)}
              {...gridProps}
            />
            <div className="center action-space">
              <button className="btn-dark" onClick={() => navigate("shop")}>
                View All Products →
              </button>
            </div>
          </main>

          <section className="promo">
            <p className="eyebrow">THE LUMINA EDIT</p>
            <h2>Style for every generation.</h2>
            <p>Batik, kebaya, sepatu, dan fashion keluarga.</p>
            <button className="btn-dark" onClick={() => navigate("shop")}>
              Explore Collection
            </button>
          </section>
        </>
      )}

      {/* SHOP */}
      {page === "shop" && (
        <main className="container section">
          <p className="eyebrow center">LUMINA COLLECTION</p>
          <h1 className="section-title">Shop Our Collection</h1>
          <p className="section-description">
            Temukan pilihan baju dan sepatu untuk setiap usia.
          </p>

          <div className="toolbar">
            <input
              type="search"
              placeholder="Cari batik cowok, kebaya anak, sepatu gereja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="default">Urutan Default</option>
              <option value="low">Harga Terendah</option>
              <option value="high">Harga Tertinggi</option>
            </select>
          </div>

          <div
            className="toolbar"
            style={{
              gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
            }}
          >
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            >
              <option value="">Semua Ukuran</option>
              {sizesAvailable.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            >
              <option value="">Semua Harga</option>
              <option value="150000">Maks. Rp150.000</option>
              <option value="250000">Maks. Rp250.000</option>
              <option value="400000">Maks. Rp400.000</option>
              <option value="600000">Maks. Rp600.000</option>
            </select>
            <button
              className="btn-light"
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setSizeFilter("");
                setMaxPrice("");
                setSort("default");
              }}
            >
              Reset Filter
            </button>
          </div>

          <p className="muted" style={{ marginBottom: 20 }}>
            {filtered.length} produk ditemukan
          </p>

          <ProductGrid items={filtered} {...gridProps} />
        </main>
      )}

      {/* DETAIL PRODUK */}
      {page === "detail" && selected && (
        <main className="container section">
          <button className="back" onClick={() => navigate("shop")}>
            ← Kembali ke toko
          </button>
          <div className="detail-layout">
            <img
              className="detail-image"
              src={selected.image}
              alt={selected.name}
            />
            <div className="detail-copy">
              <p className="eyebrow">{selected.category}</p>
              <h1>{selected.name}</h1>
              <h2 className="price">{money(selected.price)}</h2>
              <p>{selected.description}</p>
              <p className="muted">Stok: {selected.stock}</p>

              <label>Ukuran</label>
              <div className="option-row">
                {(selected.sizes || []).map((s) => (
                  <button
                    key={s}
                    className={selectedSize === s ? "chosen" : ""}
                    onClick={() => setSelectedSize(s)}
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
                    className={selectedColor === c ? "chosen" : ""}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                className="btn-dark wide"
                disabled={selected.stock <= 0}
                onClick={() =>
                  addToCart(selected, selectedSize, selectedColor)
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
          <h1 className="section-title">My Wishlist ♡</h1>
          <ProductGrid
            items={products.filter((item) => wishlist.includes(item.id))}
            {...gridProps}
          />
        </main>
      )}

      {/* KERANJANG */}
      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">Shopping Cart</h1>
          <div className="two-column">
            <div className="panel">
              {cart.length === 0 && <p>Keranjang masih kosong.</p>}
              {cart.map((item) => (
                <div className="cart-row" key={item.key}>
                  <img src={item.image} alt={item.name} />
                  <div className="grow">
                    <h3>{item.name}</h3>
                    <p className="muted">{item.size} / {item.color}</p>
                    <strong>{money(item.price)}</strong>
                    <div className="quantity">
                      <button onClick={() => changeQuantity(item.key, -1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => changeQuantity(item.key, 1)}>
                        +
                      </button>
                      <button
                        onClick={() =>
                          setCart((old) =>
                            old.filter((p) => p.key !== item.key)
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
                <strong>{money(subtotal)}</strong>
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

      {/* CHECKOUT */}
      {page === "checkout" && (
        <main className="container section">
          <h1 className="section-title">Checkout — Demo</h1>
          <div className="two-column">
            <form className="panel form-stack" onSubmit={placeOrder}>
              <h2>Informasi Pembeli</h2>

              <label>Nama Lengkap</label>
              <input
                required
                value={checkout.name}
                onChange={(e) =>
                  setCheckout({ ...checkout, name: e.target.value })
                }
              />

              <label>Nomor Telepon</label>
              <input
                required
                type="tel"
                value={checkout.phone}
                onChange={(e) =>
                  setCheckout({ ...checkout, phone: e.target.value })
                }
              />

              <label>Alamat Pengiriman</label>
              <textarea
                required
                rows={4}
                value={checkout.address}
                onChange={(e) =>
                  setCheckout({ ...checkout, address: e.target.value })
                }
              />

              <label>Metode Pengiriman</label>
              <select
                value={checkout.shipping}
                onChange={(e) =>
                  setCheckout({ ...checkout, shipping: e.target.value })
                }
              >
                <option value="regular">Regular — Rp12.000</option>
                <option value="express">Express — Rp25.000</option>
              </select>

              <p className="muted">
                Ini checkout simulasi. Gunakan data fiktif.
              </p>
              <button className="btn-dark wide" disabled={!cart.length}>
                Konfirmasi Pesanan Simulasi
              </button>
            </form>

            <div className="panel summary">
              <h2>Ringkasan Pesanan</h2>
              {cart.map((item) => (
                <div className="between" key={item.key}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              ))}
              <div className="between">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div className="between">
                <span>Pengiriman</span>
                <strong>{money(shippingFee)}</strong>
              </div>
              <div className="between grand-total">
                <span>Total</span>
                <strong>{money(subtotal + shippingFee)}</strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SUKSES */}
      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">✓</div>
            <h1>Pesanan Simulasi Berhasil!</h1>
            <p>Pesanan berhasil dicatat di dashboard Admin.</p>
            <p>Belum ada transaksi atau pembayaran nyata.</p>
            <button className="btn-dark" onClick={() => navigate("home")}>
              Kembali ke Home
            </button>
          </div>
        </main>
      )}

      {/* ADMIN */}
      {page === "admin" && (
        <AdminDashboard
          products={products}
          orders={orders}
          onBack={() => navigate("home")}
          onSave={saveProduct}
          onEdit={editProduct}
          onDelete={deleteProduct}
          onStatus={updateStatus}
          form={form}
          setForm={setForm}
          editingId={editingId}
          onCancel={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
        />
      )}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>
            <p>Fashion for Every Generation</p>
          </div>
          <p>React.js E-Commerce Portfolio Project</p>
          <p>© 2026 LUMINA STORE · Demo Only</p>
        </footer>
      )}

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
    </div>
  );
}