
import { useEffect, useState } from "react";
import "./App.css";

/* =================================================
   LUMINA STORE — PREMIUM FAMILY FASHION
   React + Vite | Full App.jsx
   Home • Shop • Wishlist • Cart • Checkout • Admin
================================================= */

const photo = (id, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const IMG = {
  hero: photo("photo-1483985988355-763728e1935b", 1400),
  batik: photo("photo-1603252109303-2751441dd157"),
  kebaya: photo("photo-1496747611176-843222e1e57c"),
  shoes: photo("photo-1549298916-b41d501d3772"),
  family: photo("photo-1529139574466-a303027c1d8b"),
  kids: photo("photo-1518831959646-742c3a14ebf7"),
  shirt: photo("photo-1521572163474-6864f9cf17ab"),
  sneakers: photo("photo-1542291026-7eec264c27ff"),
  denim: photo("photo-1544022613-e87ca75a784a"),
  hoodie: photo("photo-1556821840-3a63f95609a7"),
  handbag: photo("photo-1584917865442-de89df76afd3"),
  woman: photo("photo-1515886657613-9f3515b0c78f"),
  woman2: photo("photo-1515372039744-b8f02a3ae446"),
  fashion: photo("photo-1539109136881-3be0616acf4b"),
  child: photo("photo-1503919005314-30d93d07d823"),
  flats: photo("photo-1515347619252-60a4bf4fff4f"),
  heels: photo("photo-1543163521-1bf539c55dd2"),
  loafers: photo("photo-1614252235316-8c857d38b5f4"),
  formal: photo("photo-1520639888713-7851133b1ed0"),
  sneaker2: photo("photo-1600185365483-26d7a4cc7519"),
  sneaker3: photo("photo-1525966222134-fcfa99b8ae77"),
};

const ADULT = ["S", "M", "L", "XL", "XXL"];
const CHILD = [
  "2-3 Tahun", "4-5 Tahun", "6-7 Tahun",
  "8-10 Tahun", "11-12 Tahun",
];
const SHOE = ["36", "37", "38", "39", "40", "41", "42", "43"];

function makeProduct(
  id, name, category, price, stock, image,
  sizes, colors, description, keywords = ""
) {
  return {
    id, name, category, price, stock,
    image, sizes, colors, description, keywords,
  };
}

/* =================================================
   DATA PRODUK DEMO
   Foto Unsplash merupakan referensi lifestyle.
   Untuk toko nyata, pakai foto produk asli.
================================================= */

const CATALOG = [
  makeProduct(
    1, "Classic T-Shirt", "Fashion", 125000, 20,
    IMG.shirt, ADULT, ["White", "Black", "Cream"],
    "Kaos premium yang nyaman untuk kegiatan sehari-hari.",
    "kaos pria wanita casual dewasa"
  ),
  makeProduct(
    2, "Urban Sneakers", "Shoes", 350000, 15,
    IMG.sneakers, SHOE, ["Red", "Black", "White"],
    "Sneakers modern dengan gaya sporty.",
    "sepatu sneakers pria wanita"
  ),
  makeProduct(
    3, "Denim Jacket", "Fashion", 275000, 12,
    IMG.denim, ADULT, ["Blue", "Black"],
    "Jaket denim klasik untuk berbagai gaya.",
    "jaket pria wanita denim dewasa"
  ),
  makeProduct(
    4, "Minimalist Sneakers", "Shoes", 395000, 10,
    IMG.shoes, SHOE, ["Cream", "White"],
    "Sneakers minimalis untuk aktivitas harian.",
    "sepatu sneakers pria wanita"
  ),
  makeProduct(
    5, "Premium Hoodie", "Fashion", 245000, 18,
    IMG.hoodie, ADULT, ["Grey", "Black", "Cream"],
    "Hoodie dengan bahan lembut dan nyaman.",
    "hoodie pria wanita casual"
  ),
  makeProduct(
    6, "Leather Handbag", "Accessories", 425000, 8,
    IMG.handbag, ["All Size"], ["Brown", "Black"],
    "Tas elegan untuk penampilan sehari-hari.",
    "tas wanita handbag aksesoris"
  ),
  makeProduct(
    101, "Batik Pria Modern", "Fashion", 189000, 25,
    IMG.batik, ADULT, ["Brown", "Navy", "Black"],
    "Koleksi batik pria untuk acara formal dan keluarga.",
    "batik pria cowok laki laki bapak ayah dewasa"
  ),
  makeProduct(
    102, "Batik Wanita Elegan", "Fashion", 215000, 20,
    IMG.woman, ADULT, ["Maroon", "Cream", "Brown"],
    "Koleksi busana batik wanita untuk acara istimewa.",
    "batik wanita cewek ibu perempuan dewasa"
  ),
  makeProduct(
    103, "Batik Anak Laki-Laki", "Fashion", 99000, 30,
    IMG.child, CHILD, ["Blue", "Brown"],
    "Busana anak laki-laki untuk acara keluarga.",
    "batik anak cowok laki laki sekolah"
  ),
  makeProduct(
    104, "Dress Batik Anak Perempuan", "Fashion", 115000, 24,
    IMG.kids, CHILD, ["Pink", "Cream", "Maroon"],
    "Dress anak perempuan dengan gaya anggun.",
    "batik anak cewek perempuan dress"
  ),
  makeProduct(
    105, "Batik Couple Suami Istri", "Fashion", 375000, 15,
    IMG.family,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Brown", "Navy"],
    "Koleksi busana pasangan bernuansa senada.",
    "batik couple pasangan keluarga suami istri"
  ),
  makeProduct(
    106, "Batik Sarimbit Keluarga", "Fashion", 575000, 12,
    IMG.hero,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Brown", "Green"],
    "Koleksi busana keluarga untuk acara bersama.",
    "batik keluarga sarimbit ayah ibu anak"
  ),
  makeProduct(
    107, "Kebaya Wanita Modern", "Fashion", 285000, 18,
    IMG.kebaya, ADULT, ["Pink", "Cream", "Maroon"],
    "Koleksi kebaya modern untuk acara spesial.",
    "kebaya wanita perempuan wisuda dewasa"
  ),
  makeProduct(
    108, "Kebaya Ibu Brokat Premium", "Fashion", 345000, 14,
    IMG.woman2, ["M", "L", "XL", "XXL"],
    ["Gold", "Brown", "Navy"],
    "Koleksi kebaya untuk ibu dan wanita dewasa.",
    "kebaya ibu brokat wanita formal"
  ),
  makeProduct(
    109, "Kebaya Anak Perempuan", "Fashion", 145000, 22,
    IMG.kids, CHILD, ["Pink", "White", "Purple"],
    "Koleksi kebaya anak untuk acara keluarga.",
    "kebaya anak perempuan cewek"
  ),
  makeProduct(
    110, "Sepatu Sekolah Anak Laki-Laki", "Shoes", 159000, 40,
    IMG.formal, ["28", "29", "30", "31", "32", "33", "34", "35"],
    ["Black"],
    "Sepatu sekolah hitam untuk anak laki-laki.",
    "sepatu sekolah anak pria cowok"
  ),
  makeProduct(
    111, "Sepatu Sekolah Anak Perempuan", "Shoes", 155000, 35,
    IMG.sneaker3, ["28", "29", "30", "31", "32", "33", "34", "35"],
    ["Black"],
    "Sepatu sekolah anak perempuan.",
    "sepatu sekolah anak wanita cewek"
  ),
  makeProduct(
    112, "Sepatu Gereja Wanita", "Shoes", 245000, 20,
    IMG.heels, ["36", "37", "38", "39", "40", "41"],
    ["Black", "Cream", "Brown"],
    "Sepatu wanita untuk kegiatan formal dan ibadah.",
    "sepatu gereja wanita heels ibu dewasa"
  ),
  makeProduct(
    113, "Sepatu Gereja Pria Formal", "Shoes", 295000, 25,
    IMG.loafers, ["39", "40", "41", "42", "43", "44"],
    ["Black", "Brown"],
    "Sepatu formal pria dengan desain elegan.",
    "sepatu gereja pria pantofel cowok"
  ),
  makeProduct(
    114, "Sepatu Gereja Anak Perempuan", "Shoes", 175000, 24,
    IMG.flats, ["27", "28", "29", "30", "31", "32", "33", "34"],
    ["Black", "White", "Pink"],
    "Sepatu pesta dan gereja untuk anak perempuan.",
    "sepatu gereja anak cewek perempuan"
  ),
  makeProduct(
    115, "Sepatu Gereja Anak Laki-Laki", "Shoes", 185000, 24,
    IMG.formal, ["28", "29", "30", "31", "32", "33", "34", "35"],
    ["Black", "Brown"],
    "Sepatu formal untuk anak laki-laki.",
    "sepatu gereja anak cowok pria"
  ),
  makeProduct(
    116, "Sneakers Pria Casual", "Shoes", 325000, 28,
    IMG.sneakers, SHOE, ["White", "Black", "Grey"],
    "Sneakers casual untuk aktivitas pria.",
    "sepatu sneakers pria cowok"
  ),
  makeProduct(
    117, "Sepatu Anak Casual", "Shoes", 145000, 32,
    IMG.sneaker2, ["26", "27", "28", "29", "30", "31", "32", "33"],
    ["White", "Blue", "Pink"],
    "Sepatu casual untuk bermain dan berjalan.",
    "sepatu anak cowok cewek sneakers"
  ),
  makeProduct(
    118, "Kebaya Couple Ibu dan Anak", "Fashion", 395000, 12,
    IMG.woman2,
    ["Paket S", "Paket M", "Paket L", "Paket XL"],
    ["Pink", "Cream", "Maroon"],
    "Koleksi busana senada untuk ibu dan anak.",
    "kebaya couple ibu anak keluarga"
  ),
  makeProduct(
    119, "Blouse Wanita Floral", "Fashion", 175000, 18,
    IMG.woman, ADULT, ["White", "Pink", "Beige"],
    "Blouse wanita dengan gaya feminim.",
    "blouse wanita floral dewasa"
  ),
  makeProduct(
    120, "Kemeja Formal Pria", "Fashion", 199000, 21,
    IMG.batik, ADULT, ["White", "Blue", "Grey"],
    "Kemeja pria untuk kerja dan kegiatan formal.",
    "kemeja pria dewasa formal"
  ),
  makeProduct(
    121, "Flat Shoes Wanita", "Shoes", 189000, 17,
    IMG.flats, ["36", "37", "38", "39", "40"],
    ["Black", "Nude", "Brown"],
    "Sepatu flat wanita yang nyaman.",
    "sepatu wanita cewek flat shoes"
  ),
  makeProduct(
    122, "Loafers Pria Casual", "Shoes", 279000, 16,
    IMG.loafers, ["39", "40", "41", "42", "43"],
    ["Brown", "Black"],
    "Loafers pria dengan desain modern.",
    "sepatu pria loafers casual"
  ),
  makeProduct(
    123, "Dress Wanita Casual", "Fashion", 225000, 20,
    IMG.woman2, ADULT, ["Cream", "Black", "Pink"],
    "Dress wanita untuk acara santai.",
    "dress wanita cewek dewasa"
  ),
  makeProduct(
    124, "Sepatu Sneakers Putih", "Shoes", 249000, 30,
    IMG.sneaker3, SHOE, ["White"],
    "Sneakers putih bergaya minimalis.",
    "sepatu putih sneakers"
  ),
  makeProduct(
    125, "Fashion Anak Perempuan", "Fashion", 135000, 25,
    IMG.kids, CHILD, ["Pink", "Cream"],
    "Koleksi pakaian anak perempuan.",
    "baju anak cewek perempuan"
  ),
  makeProduct(
    126, "Koleksi Fashion Wanita Premium", "Fashion", 329000, 14,
    IMG.fashion, ADULT, ["Brown", "Cream", "Black"],
    "Koleksi premium untuk penampilan elegan.",
    "fashion wanita dewasa"
  ),
];

const CATEGORIES = [
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
  ["Accessories", "Aksesori"],
];

const CATEGORY_TILES = [
  { name: "Batik", image: IMG.batik, label: "Timeless Heritage" },
  { name: "Kebaya", image: IMG.kebaya, label: "Elegant Occasion" },
  { name: "Shoes", image: IMG.shoes, label: "Everyday Essentials" },
  { name: "Anak", image: IMG.kids, label: "Little Ones" },
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
  category: "Fashion",
  price: "",
  stock: "",
  image: "",
  description: "",
  keywords: "",
  sizes: "S,M,L,XL",
  colors: "Black,White",
};

function money(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function compactMoney(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${Math.round(value / 1000)}rb`;
  return String(value);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalize(text) {
  const aliases = {
    cowok: "pria", cowo: "pria", laki: "pria",
    ayah: "pria", bapak: "pria", suami: "pria",
    cewek: "wanita", cewe: "wanita",
    perempuan: "wanita", ibu: "wanita",
    istri: "wanita", kids: "anak",
    bocah: "anak", balita: "anak",
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

function matchesProduct(item, search, category, size, maxPrice) {
  const text = normalize([
    item.name,
    item.category,
    item.description,
    item.keywords,
    ...(item.sizes || []),
    ...(item.colors || []),
  ].join(" "));

  const matchesSearch = normalize(search)
    .split(" ")
    .filter(Boolean)
    .every((word) => text.includes(word));

  const rules = {
    All: true,
    Fashion: item.category === "Fashion",
    Shoes: item.category === "Shoes",
    Accessories: item.category === "Accessories",
    Batik: text.includes("batik"),
    Kebaya: text.includes("kebaya"),
    Sekolah: text.includes("sepatu sekolah"),
    Gereja: text.includes("sepatu gereja"),
    Anak: text.includes("anak"),
    Dewasa: text.includes("dewasa"),
    Keluarga: text.includes("keluarga"),
  };

  return (
    matchesSearch &&
    (rules[category] ?? true) &&
    (!size || (item.sizes || []).includes(size)) &&
    (!maxPrice || Number(item.price) <= Number(maxPrice))
  );
}

function statusOf(status) {
  return status && status !== "Simulasi"
    ? status
    : "Pesanan Baru";
}

/* =================================================
   PHOTO COMPONENT
   Tidak mengubah foto menjadi gambar AI.
================================================= */

function ProductImage({ src, alt, ...props }) {
  return (
    <img
      src={src || IMG.shirt}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        const img = event.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = IMG.shirt;
        }
      }}
      {...props}
    />
  );
}

function ProductCard({
  item, favorite, onFavorite, onDetail, onAdd,
}) {
  return (
    <article className="product-card">
      <div className="product-picture">
        <button
          type="button"
          className="image-button"
          onClick={() => onDetail(item)}
        >
          <ProductImage src={item.image} alt={item.name} />
        </button>

        <button
          type="button"
          className="heart"
          aria-label={`Wishlist ${item.name}`}
          aria-pressed={favorite}
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
          <button
            type="button"
            className="btn-light"
            onClick={() => onDetail(item)}
          >
            Detail
          </button>
          <button
            type="button"
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

function ProductGrid({
  items, wishlist, onFavorite, onDetail, onAdd,
}) {
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
          Produk tidak ditemukan. Coba kategori atau pencarian lain.
        </p>
      )}
    </div>
  );
}

/* =================================================
   CATEGORY SECTION
================================================= */

function CategorySection({ onSelect }) {
  return (
    <section className="container section">
      <p className="eyebrow center">SHOP BY CATEGORY</p>
      <h2 className="section-title">Explore Our Collections</h2>
      <p className="section-description">
        Pilih gaya favorit untuk setiap generasi.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(100%,220px),1fr))",
          gap: 20,
        }}
      >
        {CATEGORY_TILES.map((tile) => (
          <button
            key={tile.name}
            type="button"
            onClick={() => onSelect(tile.name)}
            style={{
              display: "block",
              position: "relative",
              minHeight: 330,
              overflow: "hidden",
              padding: 0,
              border: 0,
              borderRadius: 12,
              background: "#e9dfd6",
              color: "#fff",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <ProductImage
              src={tile.image}
              alt={`Kategori ${tile.name}`}
              style={{
                display: "block",
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <span
              style={{
                display: "flex",
                position: "absolute",
                inset: 0,
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 8,
                padding: 25,
                background:
                  "linear-gradient(transparent 35%,rgba(25,20,17,.77))",
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: 2 }}>
                {tile.label}
              </span>
              <strong
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: 29,
                  fontWeight: 500,
                }}
              >
                {tile.name === "Shoes" ? "Sepatu" : tile.name}
              </strong>
              <span style={{ fontSize: 12 }}>Explore Collection →</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* =================================================
   ADMIN ORDER TABLE
================================================= */

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
            const status = statusOf(order.status);

            return (
              <tr key={order.id}>
                <td>
                  <div className="lum-dash-order-product">
                    {first && (
                      <ProductImage
                        src={first.image}
                        alt={first.name}
                      />
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
                      onChange={(e) =>
                        onStatus(order.id, e.target.value)
                      }
                    >
                      {STATUSES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
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

/* =================================================
   FULL SCREEN ADMIN
================================================= */

function AdminDashboard({
  products, orders, onBack, onSave,
  onEdit, onDelete, onStatus,
  form, setForm, editingId, onCancel,
}) {
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [year, setYear] = useState(new Date().getFullYear());

  const completed = orders.filter(
    (o) => statusOf(o.status) === "Selesai"
  );

  const active = orders.filter(
    (o) => statusOf(o.status) !== "Dibatalkan"
  );

  const revenue = completed.reduce(
    (sum, o) => sum + Number(o.total || 0), 0
  );

  const activeValue = active.reduce(
    (sum, o) => sum + Number(o.total || 0), 0
  );

  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.stock || 0), 0
  );

  const metrics = [
    ["◉", "Penjualan Selesai", money(revenue), "Completed"],
    ["◈", "Nilai Pesanan Aktif", money(activeValue), "Active"],
    ["▤", "Total Pesanan", orders.length, `${completed.length} selesai`],
    ["▣", "Total Produk", products.length, `${totalStock} unit stok`],
  ];

  const sold = new Map();

  completed.forEach((o) => {
    (o.items || []).forEach((p) => {
      const old = sold.get(p.id) || 0;
      sold.set(p.id, old + Number(p.quantity || 0));
    });
  });

  const popular = [...products]
    .sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0))
    .slice(0, 4);

  const topSelling = [...products]
    .filter((p) => (sold.get(p.id) || 0) > 0)
    .sort((a, b) => sold.get(b.id) - sold.get(a.id))
    .slice(0, 5);

  const lowStock = products.filter((p) => Number(p.stock) <= 5);

  const years = [...new Set([
    new Date().getFullYear(),
    ...orders
      .map((o) => new Date(o.date).getFullYear())
      .filter(Number.isFinite),
  ])].sort((a, b) => b - a);

  const months = Array.from({ length: 12 }, (_, index) => ({
    label: new Date(2026, index, 1).toLocaleDateString("id-ID", {
      month: "short",
    }),
    total: completed
      .filter((o) => {
        const d = new Date(o.date);
        return d.getFullYear() === year && d.getMonth() === index;
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0),
  }));

  const maxRevenue = Math.max(1, ...months.map((m) => m.total));

  const visibleOrders = [...orders]
    .filter((o) => {
      const text = [
        o.id, o.customer,
        ...(o.items || []).map((p) => p.name),
      ].join(" ").toLowerCase();

      return (
        text.includes(query.toLowerCase()) &&
        (filter === "Semua" || statusOf(o.status) === filter)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const visibleProducts = products.filter((p) =>
    matchesProduct(p, query, "All", "", "")
  );

  const titles = {
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
              <span>{icon}</span>
              {label}
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
            <h1>{titles[section]}</h1>
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
                  <span className="lum-dash-metric-icon">
                    {icon}
                  </span>
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
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="lum-dash-chart-total">
                {money(months.reduce((s, m) => s + m.total, 0))}
                <small>Total {year}</small>
              </div>

              <div className="lum-dash-chart">
                {months.map((month, index) => (
                  <div className="lum-dash-bar-col" key={index}>
                    <span>
                      {month.total
                        ? compactMoney(month.total)
                        : ""}
                    </span>

                    <div className="lum-dash-bar-area">
                      <div
                        className="lum-dash-bar"
                        style={{
                          height:
                            `${month.total / maxRevenue * 100}%`,
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
                {STATUSES.map((status) => (
                  <div key={status}>
                    <strong>
                      {orders.filter(
                        (o) => statusOf(o.status) === status
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
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

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
                <p>Kelola status transaksi simulasi</p>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Semua</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
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
                <option value="Fashion">Fashion</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
              </select>

              <label>Harga (Rp)</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
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
                  setForm({ ...form, stock: e.target.value })
                }
              />

              <label>URL Foto Produk</label>
              <input
                required
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
              />

              {form.image && (
                <ProductImage
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
                value={form.keywords}
                placeholder="Contoh: batik pria dewasa"
                onChange={(e) =>
                  setForm({
                    ...form,
                    keywords: e.target.value,
                  })
                }
              />

              <label>Ukuran (pisahkan koma)</label>
              <input
                required
                value={form.sizes}
                onChange={(e) =>
                  setForm({ ...form, sizes: e.target.value })
                }
              />

              <label>Warna (pisahkan koma)</label>
              <input
                required
                value={form.colors}
                onChange={(e) =>
                  setForm({ ...form, colors: e.target.value })
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
                  onClick={onCancel}
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>Daftar Produk ({products.length})</h2>
              <p className="lum-dash-small">
                Cari produk menggunakan kolom Search di atas.
              </p>

              {visibleProducts.map((item) => (
                <div
                  className="lum-dash-product-row"
                  key={item.id}
                >
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {money(item.price)} · Stok {item.stock}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-light"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => onDelete(item.id)}
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

      <aside className="lum-dash-right">
        <section>
          <h3>Produk Populer</h3>
          <p className="lum-dash-small">
            Berdasarkan penjualan selesai
          </p>

          {popular.map((item) => (
            <div
              className="lum-dash-side-product"
              key={item.id}
            >
              <ProductImage
                src={item.image}
                alt={item.name}
              />
              <div>
                <strong>{item.name}</strong>
                <small>
                  {sold.get(item.id) || 0} unit terjual
                </small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Top Selling Product</h3>
          {topSelling.length === 0 && (
            <p className="lum-dash-small">
              Belum ada pesanan selesai.
            </p>
          )}

          {topSelling.map((item) => (
            <div
              className="lum-dash-side-product"
              key={item.id}
            >
              <ProductImage
                src={item.image}
                alt={item.name}
              />
              <div>
                <strong>{item.name}</strong>
                <small>{sold.get(item.id)} unit</small>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Stock Alert</h3>
          <p className="lum-dash-small">
            Stok lima unit atau kurang
          </p>

          {lowStock.length === 0 ? (
            <p className="lum-dash-small">
              ✓ Stok mencukupi.
            </p>
          ) : (
            lowStock.map((item) => (
              <div
                className="lum-dash-stock"
                key={item.id}
              >
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

/* =================================================
   MAIN APPLICATION
================================================= */

export default function App() {
  const [products, setProducts] = useState(() => {
    const saved = readStorage("lumina_products_v1", CATALOG);
    const old = Array.isArray(saved) ? saved : CATALOG;

    const merged = old.map((item) => {
      const original = CATALOG.find(
        (p) => String(p.id) === String(item.id)
      );
      if (!original) return item;

      const placeholder =
        !item.image ||
        item.image.includes("placehold.co") ||
        item.image.includes("unsplash.com/photos/");

      return {
        ...original,
        ...item,
        image: placeholder ? original.image : item.image,
        keywords: item.keywords || original.keywords,
      };
    });

    const ids = new Set(merged.map((p) => String(p.id)));

    return [
      ...merged,
      ...CATALOG.filter((p) => !ids.has(String(p.id))),
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
  const [form, setForm] = useState(EMPTY_FORM);

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    shipping: "regular",
  });

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
    (p) => p.id === selectedId
  );

  const filtered = products
    .filter((p) =>
      matchesProduct(
        p, search, category, sizeFilter, maxPrice
      )
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return a.id - b.id;
    });

  const sizesAvailable = [...new Set(
    products.flatMap((p) => p.sizes || [])
  )];

  const cartCount = cart.reduce(
    (sum, p) => sum + Number(p.quantity), 0
  );

  const subtotal = cart.reduce(
    (sum, p) =>
      sum + Number(p.price) * Number(p.quantity), 0
  );

  const shippingFee =
    checkout.shipping === "express" ? 25000 : 12000;

  function notify(text) {
    setMessage(text);
  }

  function navigate(destination) {
    setPage(destination);
    window.scrollTo(0, 0);
  }

  function selectCategory(value) {
    setCategory(value);
    setSearch("");
    setSizeFilter("");
    setMaxPrice("");
    navigate("shop");
  }

  function openProduct(item) {
    setSelectedId(item.id);
    setSelectedSize(item.sizes?.[0] || "All Size");
    setSelectedColor(item.colors?.[0] || "Default");
    navigate("detail");
  }

  function toggleWishlist(id) {
    setWishlist((old) =>
      old.includes(id)
        ? old.filter((p) => p !== id)
        : [...old, id]
    );
  }

  function addToCart(item, size, color) {
    const chosenSize =
      size || item.sizes?.[0] || "All Size";
    const chosenColor =
      color || item.colors?.[0] || "Default";

    const key =
      `${item.id}-${chosenSize}-${chosenColor}`;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    if (used >= item.stock) {
      notify("Stok produk tidak mencukupi.");
      return;
    }

    setCart((old) => {
      const existing = old.find((p) => p.key === key);

      if (existing) {
        return old.map((p) =>
          p.key === key
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [
        ...old,
        {
          ...item,
          key,
          size: chosenSize,
          color: chosenColor,
          quantity: 1,
        },
      ];
    });

    notify("Produk masuk ke keranjang.");
  }

  function changeQuantity(key, amount) {
    const item = cart.find((p) => p.key === key);
    const current = products.find(
      (p) => p.id === item?.id
    );

    if (!item || !current) return;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    if (amount > 0 && used >= current.stock) {
      notify("Jumlah melebihi stok tersedia.");
      return;
    }

    setCart((old) =>
      old
        .map((p) =>
          p.key === key
            ? { ...p, quantity: p.quantity + amount }
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
      notify("Periksa kembali informasi pembeli.");
      return;
    }

    const quantities = {};

    cart.forEach((p) => {
      quantities[p.id] =
        (quantities[p.id] || 0) + p.quantity;
    });

    for (const [id, quantity] of Object.entries(
      quantities
    )) {
      const item = products.find(
        (p) => String(p.id) === id
      );

      if (!item || item.stock < quantity) {
        notify("Stok produk tidak mencukupi.");
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
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const previous = statusOf(order.status);

    if (
      previous === "Selesai" ||
      previous === "Dibatalkan"
    ) {
      notify("Status final tidak dapat diubah.");
      return;
    }

    if (
      nextStatus === "Dibatalkan" &&
      !order.stockRestored
    ) {
      setProducts((old) =>
        old.map((p) => ({
          ...p,
          stock:
            p.stock +
            (order.items || [])
              .filter((item) => item.id === p.id)
              .reduce(
                (sum, item) => sum + item.quantity,
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
              status: nextStatus,
              stockRestored:
                o.stockRestored ||
                nextStatus === "Dibatalkan",
            }
          : o
      )
    );

    notify(`Status pesanan menjadi ${nextStatus}.`);
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
      !item.name ||
      !item.image ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isInteger(item.stock) ||
      item.stock < 0 ||
      !item.sizes.length ||
      !item.colors.length
    ) {
      notify("Periksa data produk terlebih dahulu.");
      return;
    }

    if (editingId !== null) {
      setProducts((old) =>
        old.map((p) =>
          p.id === editingId ? item : p
        )
      );
      setCart((old) =>
        old.map((p) =>
          p.id === editingId
            ? { ...p, ...item }
            : p
        )
      );
    } else {
      setProducts((old) => [...old, item]);
    }

    setEditingId(null);
    setForm(EMPTY_FORM);
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
    if (
      !window.confirm(
        "Yakin ingin menghapus produk ini?"
      )
    ) return;

    setProducts((old) =>
      old.filter((p) => p.id !== id)
    );
    setCart((old) =>
      old.filter((p) => p.id !== id)
    );
    setWishlist((old) =>
      old.filter((p) => p !== id)
    );

    notify("Produk berhasil dihapus.");
  }

  const gridProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onAdd: addToCart,
  };

  return (
    <div
      className={
        `lumina ${page === "admin" ? "admin-mode" : ""}`
      }
    >
      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — FASHION FOR EVERY GENERATION
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
              <button onClick={() => navigate("wishlist")}>
                ♡ Wishlist ({wishlist.length})
              </button>
              <button onClick={() => navigate("admin")}>
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

      {/* ========================================
          HOME
      ======================================== */}

      {page === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                NEW SEASON — FAMILY COLLECTION 2026
              </p>

              <h1>
                Discover Your <em>Unique Style.</em>
              </h1>

              <p>
                Curated fashion for every generation.
                Temukan pilihan pakaian dan sepatu
                untuk penampilan yang elegan setiap hari.
              </p>

              <button
                className="btn-dark"
                onClick={() => selectCategory("All")}
              >
                Explore Collection →
              </button>

              <p className="hero-bottom">
                ✦ BATIK ✦ KEBAYA ✦ FAMILY FASHION
              </p>
            </div>

            <div className="hero-photo">
              <ProductImage
                src={IMG.hero}
                alt="Lumina editorial fashion"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧
              <strong>Premium Collection</strong>
              <span>Pilihan fashion berkualitas</span>
            </div>
            <div>
              ♡
              <strong>Fashion for Everyone</strong>
              <span>Anak-anak hingga dewasa</span>
            </div>
            <div>
              ✦
              <strong>Modern Shopping</strong>
              <span>Pengalaman belanja lebih nyaman</span>
            </div>
          </section>

          <CategorySection onSelect={selectCategory} />

          <main className="container section">
            <p className="eyebrow center">
              CURATED FOR YOU
            </p>

            <h2 className="section-title">
              Featured Collection
            </h2>

            <p className="section-description">
              Koleksi pilihan dengan gaya modern,
              klasik, dan elegan untuk seluruh keluarga.
            </p>

            <ProductGrid
              items={products.slice(0, 9)}
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
          </main>

          <section className="promo">
            <p className="eyebrow">
              THE LUMINA EDIT
            </p>
            <h2>
              Style for every generation.
            </h2>
            <p>
              Discover timeless fashion,
              modern essentials, and everyday elegance.
            </p>
            <button
              className="btn-dark"
              onClick={() => selectCategory("All")}
            >
              Shop Now →
            </button>
          </section>

          <section className="container section">
            <p className="eyebrow center">
              NEW ARRIVALS
            </p>
            <h2 className="section-title">
              Discover Something New
            </h2>
            <p className="section-description">
              Jelajahi pilihan produk lain dari katalog kami.
            </p>

            <ProductGrid
              items={products.slice(9, 15)}
              {...gridProps}
            />

            <div className="center action-space">
              <button
                className="btn-light"
                onClick={() => selectCategory("All")}
              >
                Discover More →
              </button>
            </div>
          </section>
        </>
      )}

      {/* ========================================
          SHOP
      ======================================== */}

      {page === "shop" && (
        <main className="container section">
          <p className="eyebrow center">
            THE LUMINA COLLECTION
          </p>
          <h1 className="section-title">
            Shop Our Collection
          </h1>
          <p className="section-description">
            Jelajahi fashion keluarga, batik, kebaya,
            sepatu sekolah, sepatu formal, dan aksesori.
          </p>

          <div className="toolbar">
            <input
              type="search"
              value={search}
              placeholder="Cari batik pria, kebaya ibu, sepatu anak..."
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Urutan Default</option>
              <option value="low">Harga Termurah</option>
              <option value="high">Harga Termahal</option>
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
              <option value="">Semua Ukuran</option>
              {sizesAvailable.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            >
              <option value="">Semua Harga</option>
              <option value="150000">Hingga Rp150.000</option>
              <option value="250000">Hingga Rp250.000</option>
              <option value="400000">Hingga Rp400.000</option>
              <option value="600000">Hingga Rp600.000</option>
            </select>

            <button
              type="button"
              className="btn-light"
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

          <p
            className="muted"
            style={{ margin: "18px 0 25px" }}
          >
            Menampilkan {filtered.length} produk
          </p>

          <ProductGrid items={filtered} {...gridProps} />
        </main>
      )}

      {/* ========================================
          PRODUCT DETAIL
      ======================================== */}

      {page === "detail" && selected && (
        <main className="container section">
          <button
            className="back"
            onClick={() => navigate("shop")}
          >
            ← Kembali ke toko
          </button>

          <div className="detail-layout">
            <ProductImage
              className="detail-image"
              src={selected.image}
              alt={selected.name}
            />

            <div className="detail-copy">
              <p className="eyebrow">
                LUMINA / {selected.category}
              </p>
              <h1>{selected.name}</h1>
              <h2 className="price">
                {money(selected.price)}
              </h2>
              <p>{selected.description}</p>
              <p className="muted">
                Tersedia: {selected.stock} unit
              </p>

              <label>Pilih Ukuran</label>
              <div className="option-row">
                {(selected.sizes || []).map((size) => (
                  <button
                    type="button"
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
                    type="button"
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
                disabled={selected.stock <= 0}
                onClick={() =>
                  addToCart(
                    selected, selectedSize, selectedColor
                  )
                }
              >
                + Add to Cart
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================
          WISHLIST
      ======================================== */}

      {page === "wishlist" && (
        <main className="container section">
          <p className="eyebrow center">
            YOUR FAVORITES
          </p>
          <h1 className="section-title">
            My Wishlist ♡
          </h1>
          <p className="section-description">
            Simpan koleksi favorit untuk dilihat kembali.
          </p>

          <ProductGrid
            items={products.filter((p) =>
              wishlist.includes(p.id)
            )}
            {...gridProps}
          />
        </main>
      )}

      {/* ========================================
          SHOPPING CART
      ======================================== */}

      {page === "cart" && (
        <main className="container section">
          <p className="eyebrow center">
            YOUR SELECTION
          </p>
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {cart.length === 0 && (
                <p>Keranjang belanja masih kosong.</p>
              )}

              {cart.map((item) => (
                <div className="cart-row" key={item.key}>
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                  />
                  <div className="grow">
                    <h3>{item.name}</h3>
                    <p className="muted">
                      {item.size} / {item.color}
                    </p>
                    <strong>{money(item.price)}</strong>

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
                            old.filter((p) =>
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

      {/* ========================================
          CHECKOUT
      ======================================== */}

      {page === "checkout" && (
        <main className="container section">
          <p className="eyebrow center">
            SECURE SHOPPING DEMO
          </p>
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
                Checkout hanya simulasi.
                Gunakan data pembeli fiktif.
              </p>

              <button
                className="btn-dark wide"
                disabled={!cart.length}
                type="submit"
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
                    {money(item.price * item.quantity)}
                  </strong>
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
                <strong>
                  {money(subtotal + shippingFee)}
                </strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================
          ORDER SUCCESS
      ======================================== */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">✓</div>
            <h1>Pesanan Simulasi Berhasil!</h1>
            <p>
              Pesanan sudah masuk ke dashboard admin.
            </p>
            <p>
              Tidak ada pembayaran atau transaksi nyata.
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

      {/* ========================================
          ADMIN DASHBOARD
      ======================================== */}

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
            setForm(EMPTY_FORM);
          }}
        />
      )}

      {/* ========================================
          FOOTER
      ======================================== */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>LUMINA.</h2>
            <p>Fashion for Every Generation</p>
          </div>
          <p>
            React E-Commerce Portfolio Project
          </p>
          <p>
            © 2026 LUMINA STORE · Demo Only
          </p>
        </footer>
      )}

      {/* NOTIFICATION */}
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
