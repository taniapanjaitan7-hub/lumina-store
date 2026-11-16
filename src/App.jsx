
import { useEffect, useState } from "react";
import "./App.css";

// ========================================
// DATA PRODUK AWAL
// ========================================

const initialProducts = [
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
    description: "Sneakers modern dengan desain sporty dan stylish.",
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
    description: "Jaket denim berkualitas dengan gaya kasual modern.",
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
    description: "Sneakers minimalis untuk gaya kasual premium.",
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
    description: "Hoodie hangat dengan bahan lembut dan nyaman.",
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

const statuses = [
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
  sizes: "S,M,L,XL",
  colors: "Black,White",
};

const money = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const shortMoney = (n) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)} jt`
    : n >= 1000
      ? `${(n / 1000).toFixed(0)} rb`
      : String(n);

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeStatus(status) {
  return status === "Simulasi" || !status
    ? "Pesanan Baru"
    : status;
}

// ========================================
// KOMPONEN KARTU PRODUK
// ========================================

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
          onClick={() => onDetail(product)}
          aria-label={`Lihat ${product.name}`}
        >
          <img src={product.image} alt={product.name} />
        </button>

        <button
          className="heart"
          onClick={() => onFavorite(product.id)}
          aria-label={`Favorit ${product.name}`}
          aria-pressed={favorite}
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
        <p className="price">{money(product.price)}</p>
        <p className="muted">Stok: {product.stock}</p>

        <div className="product-actions">
          <button className="btn-light" onClick={() => onDetail(product)}>
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

function ProductGrid({ items, wishlist, onFavorite, onDetail, onCart }) {
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
        <p className="empty">Belum ada produk untuk ditampilkan.</p>
      )}
    </div>
  );
}

// ========================================
// KOMPONEN GRAFIK DASHBOARD
// ========================================

function MonthlyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="pro-month-chart">
      {data.map((item, index) => (
        <div className="pro-month-col" key={index}>
          <span className="pro-bar-value">
            {shortMoney(item.total)}
          </span>
          <div className="pro-bar-area">
            <div
              className="pro-month-bar"
              style={{
                height: `${(item.total / max) * 100}%`,
                minHeight: item.total > 0 ? 5 : 0,
              }}
              title={money(item.total)}
            />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function TopProducts({ items }) {
  const max = Math.max(1, ...items.map((x) => x.quantity));

  return (
    <div className="pro-top-list">
      {items.map((item, index) => (
        <div className="pro-top-item" key={item.id}>
          <div className="pro-top-meta">
            <span>{index + 1}. {item.name}</span>
            <strong>{item.quantity} unit</strong>
          </div>
          <div className="pro-progress">
            <div
              style={{
                width: `${(item.quantity / max) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="muted">Belum ada data penjualan.</p>
      )}
    </div>
  );
}

// ========================================
// APLIKASI UTAMA
// ========================================

export default function App() {
  const [products, setProducts] = useState(() =>
    readStorage("lumina_products_v1", initialProducts)
  );
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
  const [adminTab, setAdminTab] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [message, setMessage] = useState("");
  const [orderFilter, setOrderFilter] = useState("Semua");

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    shipping: "regular",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

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

  // ========================================
  // PERHITUNGAN TOKO
  // ========================================

  const selected = products.find((p) => p.id === selectedId);

  const filteredProducts = products
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase())
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

  // ========================================
  // PERHITUNGAN DASHBOARD ADMIN
  // ========================================

  const activeOrders = orders.filter(
    (o) => normalizeStatus(o.status) !== "Dibatalkan"
  );

  const completed = orders.filter(
    (o) => normalizeStatus(o.status) === "Selesai"
  );

  const revenue = completed.reduce(
    (sum, o) => sum + o.total,
    0
  );

  const bookedValue = activeOrders.reduce(
    (sum, o) => sum + o.total,
    0
  );

  const newOrders = orders.filter(
    (o) => normalizeStatus(o.status) === "Pesanan Baru"
  ).length;

  const lowStock = products.filter((p) => p.stock <= 5);
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  const statusCount = statuses.map((status) => ({
    status,
    count: orders.filter(
      (o) => normalizeStatus(o.status) === status
    ).length,
  }));

  // Grafik 6 bulan berdasarkan pesanan selesai.
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const today = new Date();
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 5 + i,
      1
    );

    const total = completed
      .filter((o) => {
        const date = new Date(o.date);
        return (
          date.getMonth() === monthDate.getMonth() &&
          date.getFullYear() === monthDate.getFullYear()
        );
      })
      .reduce((sum, o) => sum + o.total, 0);

    return {
      label: monthDate.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      }),
      total,
    };
  });

  const productSalesMap = new Map();

  completed.forEach((order) => {
    order.items.forEach((item) => {
      const old = productSalesMap.get(item.id) || {
        id: item.id,
        name: item.name,
        quantity: 0,
      };

      productSalesMap.set(item.id, {
        ...old,
        quantity: old.quantity + item.quantity,
      });
    });
  });

  const topProducts = [...productSalesMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const filteredOrders = orders.filter(
    (o) =>
      orderFilter === "Semua" ||
      normalizeStatus(o.status) === orderFilter
  );

  function notify(text) {
    setMessage(text);
  }

  function go(destination) {
    setPage(destination);
    window.scrollTo(0, 0);
  }

  function goAdmin(tab) {
    setAdminTab(tab);
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
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  function addToCart(product, chosenSize, chosenColor) {
    const productSize =
      chosenSize || product.sizes?.[0] || "All Size";
    const productColor =
      chosenColor || product.colors?.[0] || "Default";

    const key = `${product.id}-${productSize}-${productColor}`;

    const used = cart
      .filter((item) => item.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (used >= product.stock) {
      notify("Stok produk tidak mencukupi.");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.key === key);

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
          size: productSize,
          color: productColor,
          quantity: 1,
        },
      ];
    });

    notify("Produk berhasil ditambahkan ke keranjang.");
  }

  function changeQty(key, amount) {
    const item = cart.find((p) => p.key === key);
    const product = products.find((p) => p.id === item?.id);

    if (!item || !product) return;

    const used = cart
      .filter((p) => p.id === item.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    if (amount > 0 && used >= product.stock) {
      notify("Jumlah melebihi stok.");
      return;
    }

    setCart((current) =>
      current
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

    if (!/^[0-9+()\s-]{8,20}$/.test(checkout.phone.trim())) {
      notify("Nomor telepon belum valid.");
      return;
    }

    const quantities = {};

    cart.forEach((item) => {
      quantities[item.id] =
        (quantities[item.id] || 0) + item.quantity;
    });

    for (const [id, quantity] of Object.entries(quantities)) {
      const product = products.find((p) => String(p.id) === id);

      if (!product || quantity > product.stock) {
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
      items: cart.map((item) => ({ ...item })),
      total: subtotal + shippingFee,
      status: "Pesanan Baru",
      stockRestored: false,
    };

    setOrders((current) => [order, ...current]);

    setProducts((current) =>
      current.map((p) => ({
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
    go("success");
  }

  function updateOrderStatus(id, nextStatus) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const currentStatus = normalizeStatus(order.status);

    if (currentStatus === "Dibatalkan") {
      notify("Pesanan yang dibatalkan tidak bisa diaktifkan lagi.");
      return;
    }

    if (nextStatus === "Dibatalkan" && currentStatus === "Selesai") {
      notify("Pesanan selesai tidak bisa dibatalkan pada demo ini.");
      return;
    }

    if (nextStatus === "Dibatalkan" && !order.stockRestored) {
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          stock:
            product.stock +
            order.items
              .filter((item) => item.id === product.id)
              .reduce((sum, item) => sum + item.quantity, 0),
        }))
      );
    }

    setOrders((current) =>
      current.map((o) =>
        o.id === id
          ? {
              ...o,
              status: nextStatus,
              stockRestored:
                o.stockRestored || nextStatus === "Dibatalkan",
            }
          : o
      )
    );

    notify(`Status berhasil diubah menjadi ${nextStatus}.`);
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
      sizes: form.sizes.split(",").map((x) => x.trim()).filter(Boolean),
      colors: form.colors.split(",").map((x) => x.trim()).filter(Boolean),
    };

    if (
      !item.name ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isInteger(item.stock) ||
      item.stock < 0 ||
      !item.sizes.length ||
      !item.colors.length
    ) {
      notify("Periksa kembali data produk.");
      return;
    }

    if (editingId !== null) {
      setProducts((current) =>
        current.map((p) => (p.id === editingId ? item : p))
      );

      setCart((current) =>
        current.map((p) =>
          p.id === editingId ? { ...p, ...item } : p
        )
      );
    } else {
      setProducts((current) => [...current, item]);
    }

    setForm(emptyForm);
    setEditingId(null);
    notify("Data produk berhasil disimpan.");
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      description: product.description,
      sizes: product.sizes.join(","),
      colors: product.colors.join(","),
    });
    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    setProducts((current) => current.filter((p) => p.id !== id));
    setWishlist((current) => current.filter((x) => x !== id));
    setCart((current) => current.filter((p) => p.id !== id));

    notify("Produk berhasil dihapus.");
  }

  const gridProps = {
    wishlist,
    onFavorite: toggleWishlist,
    onDetail: openProduct,
    onCart: addToCart,
  };

  // ========================================
  // TAMPILAN APLIKASI
  // ========================================

  return (
    <div className="lumina">
      <div className="announcement">
        ✦ LUMINA STORE — Timeless Fashion & Everyday Elegance
      </div>

      <header className="navbar">
        <button className="logo" onClick={() => go("home")}>
          LUMINA<span>.</span>
        </button>

        <nav className="nav-menu">
          <button onClick={() => go("home")}>Home</button>
          <button onClick={() => go("shop")}>Shop</button>
          <button onClick={() => go("wishlist")}>
            ♡ Wishlist ({wishlist.length})
          </button>
          <button onClick={() => goAdmin("dashboard")}>
            Admin Demo
          </button>
        </nav>

        <button className="cart-link" onClick={() => go("cart")}>
          🛍 Cart ({cartCount})
        </button>
      </header>

      {/* HOMEPAGE */}
      {page === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">THE NEW COLLECTION — 2026</p>
              <h1>
                Discover Your <em>Unique Style.</em>
              </h1>
              <p>
                Elevate your everyday look with timeless fashion,
                premium essentials, and effortless style.
              </p>
              <button className="btn-dark" onClick={() => go("shop")}>
                Shop Collection →
              </button>
              <p className="hero-bottom">
                ✦ PREMIUM ESSENTIALS ✦ EVERYDAY ELEGANCE
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
              <span>Curated fashion essentials</span>
            </div>
            <div>
              ♡ <strong>Modern Collection</strong>
              <span>Timeless everyday style</span>
            </div>
            <div>
              ✦ <strong>New Arrivals</strong>
              <span>Fresh looks for you</span>
            </div>
          </section>

          <main className="container section">
            <p className="eyebrow center">CURATED FOR YOU</p>
            <h2 className="section-title">Featured Collection</h2>
            <p className="section-description">
              Discover your next favorite fashion essentials.
            </p>

            <ProductGrid items={products.slice(0, 6)} {...gridProps} />

            <div className="center action-space">
              <button className="btn-dark" onClick={() => go("shop")}>
                View All Products →
              </button>
            </div>
          </main>

          <section className="promo">
            <p className="eyebrow">THE LUMINA EDIT</p>
            <h2>Style that speaks for you.</h2>
            <p>Modern fashion for every moment.</p>
            <button className="btn-dark" onClick={() => go("shop")}>
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

          <div className="toolbar">
            <input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["All", "Fashion", "Shoes", "Accessories"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="low">Harga Terendah</option>
              <option value="high">Harga Tertinggi</option>
            </select>
          </div>

          <ProductGrid items={filteredProducts} {...gridProps} />
        </main>
      )}

      {/* DETAIL PRODUK */}
      {page === "detail" && selected && (
        <main className="container section">
          <button className="back" onClick={() => go("shop")}>
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
              <p className="muted">Stok tersedia: {selected.stock}</p>

              <label>Ukuran</label>
              <div className="option-row">
                {selected.sizes.map((s) => (
                  <button
                    key={s}
                    className={size === s ? "chosen" : ""}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label>Warna</label>
              <div className="option-row">
                {selected.colors.map((c) => (
                  <button
                    key={c}
                    className={color === c ? "chosen" : ""}
                    onClick={() => setColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button
                className="btn-dark wide"
                disabled={selected.stock <= 0}
                onClick={() => addToCart(selected, size, color)}
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
            items={products.filter((p) => wishlist.includes(p.id))}
            {...gridProps}
          />
        </main>
      )}

      {/* CART */}
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
                      <button onClick={() => changeQty(item.key, -1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => changeQty(item.key, 1)}>
                        +
                      </button>
                      <button
                        onClick={() =>
                          setCart((current) =>
                            current.filter((p) => p.key !== item.key)
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
                <span>Total Item</span><strong>{cartCount}</strong>
              </div>
              <div className="between">
                <span>Subtotal</span><strong>{money(subtotal)}</strong>
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
                rows="4"
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
                Gunakan data fiktif. Ini bukan pembayaran sungguhan.
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
                <div className="between" key={item.key}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              ))}

              <div className="between">
                <span>Subtotal</span><strong>{money(subtotal)}</strong>
              </div>
              <div className="between">
                <span>Pengiriman</span><strong>{money(shippingFee)}</strong>
              </div>
              <div className="between grand-total">
                <span>Total</span>
                <strong>{money(subtotal + shippingFee)}</strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SUCCESS */}
      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">✓</div>
            <h1>Pesanan Simulasi Berhasil!</h1>
            <p>Pesanan sudah dicatat dalam dashboard admin demo.</p>
            <p>Tidak ada transaksi atau pembayaran nyata.</p>
            <button className="btn-dark" onClick={() => go("home")}>
              Kembali ke Home
            </button>
          </div>
        </main>
      )}

      {/* ======================================
          ADMIN DASHBOARD PRO
      ====================================== */}
      {page === "admin" && (
        <main className="container section admin-area">
          <div className="pro-admin-heading">
            <div>
              <p className="eyebrow">LUMINA MANAGEMENT SYSTEM</p>
              <h1>Admin Dashboard</h1>
              <p className="muted">
                Pantau performa toko dan kelola pesanan simulasi.
              </p>
            </div>
            <button className="btn-light" onClick={() => go("home")}>
              ← Kembali ke Toko
            </button>
          </div>

          <div className="pro-admin-tabs">
            <button
              className={adminTab === "dashboard" ? "active" : ""}
              onClick={() => setAdminTab("dashboard")}
            >
              ◫ Overview
            </button>
            <button
              className={adminTab === "products" ? "active" : ""}
              onClick={() => setAdminTab("products")}
            >
              ◇ Kelola Produk
            </button>
            <button
              className={adminTab === "orders" ? "active" : ""}
              onClick={() => setAdminTab("orders")}
            >
              ▤ Pesanan
            </button>
          </div>

          {/* OVERVIEW */}
          {adminTab === "dashboard" && (
            <>
              <div className="pro-stats-grid">
                {[
                  {
                    label: "Penjualan Selesai",
                    value: money(revenue),
                    note: "Pesanan selesai saja",
                    icon: "◈",
                  },
                  {
                    label: "Nilai Pesanan Aktif",
                    value: money(bookedValue),
                    note: "Tidak termasuk batal",
                    icon: "◉",
                  },
                  {
                    label: "Total Pesanan",
                    value: orders.length,
                    note: `${newOrders} pesanan baru`,
                    icon: "▤",
                  },
                  {
                    label: "Pesanan Selesai",
                    value: completed.length,
                    note: "Status selesai",
                    icon: "✓",
                  },
                  {
                    label: "Total Produk",
                    value: products.length,
                    note: `${totalStock} unit tersedia`,
                    icon: "▣",
                  },
                  {
                    label: "Stok Menipis",
                    value: lowStock.length,
                    note: "Stok 5 unit atau kurang",
                    icon: "!",
                  },
                ].map((stat) => (
                  <div className="pro-stat-card" key={stat.label}>
                    <div className="pro-stat-top">
                      <span>{stat.label}</span>
                      <div className="pro-stat-icon">{stat.icon}</div>
                    </div>
                    <strong>{stat.value}</strong>
                    <small>{stat.note}</small>
                  </div>
                ))}
              </div>

              <div className="pro-chart-grid">
                <div className="pro-card">
                  <div className="pro-card-heading">
                    <div>
                      <h2>Grafik Pendapatan Bulanan</h2>
                      <p>6 bulan terakhir · Pesanan selesai</p>
                    </div>
                    <span className="pro-tag">IDR</span>
                  </div>
                  <MonthlyChart data={monthlySales} />
                </div>

                <div className="pro-card">
                  <div className="pro-card-heading">
                    <div>
                      <h2>Produk Terlaris</h2>
                      <p>Unit dari pesanan selesai</p>
                    </div>
                  </div>
                  <TopProducts items={topProducts} />
                </div>
              </div>

              <div className="pro-chart-grid">
                <div className="pro-card">
                  <div className="pro-card-heading">
                    <div>
                      <h2>Status Pesanan</h2>
                      <p>Distribusi seluruh pesanan</p>
                    </div>
                  </div>
                  <div className="pro-status-list">
                    {statusCount.map((item) => (
                      <div className="pro-status-line" key={item.status}>
                        <span>{item.status}</span>
                        <div className="pro-progress">
                          <div
                            style={{
                              width: `${
                                (item.count / Math.max(1, orders.length)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pro-card">
                  <div className="pro-card-heading">
                    <div>
                      <h2>Peringatan Stok</h2>
                      <p>Produk dengan stok ≤ 5 unit</p>
                    </div>
                  </div>

                  {lowStock.length === 0 ? (
                    <p className="pro-empty">
                      ✓ Tidak ada produk yang stoknya menipis.
                    </p>
                  ) : (
                    lowStock.map((product) => (
                      <div className="pro-stock-row" key={product.id}>
                        <span>{product.name}</span>
                        <strong>{product.stock} unit</strong>
                      </div>
                    ))
                  )}

                  <button
                    className="pro-text-button"
                    onClick={() => setAdminTab("products")}
                  >
                    Kelola Produk →
                  </button>
                </div>
              </div>

              <div className="pro-card pro-recent-orders">
                <div className="pro-card-heading">
                  <div>
                    <h2>Pesanan Terbaru</h2>
                    <p>Lima transaksi terakhir</p>
                  </div>
                  <button
                    className="pro-text-button"
                    onClick={() => setAdminTab("orders")}
                  >
                    Lihat Semua →
                  </button>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Pesanan</th>
                        <th>Pembeli</th>
                        <th>Tanggal</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...orders]
                        .sort(
                          (a, b) =>
                            new Date(b.date) - new Date(a.date)
                        )
                        .slice(0, 5)
                        .map((order) => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.customer}</td>
                            <td>
                              {new Date(order.date).toLocaleDateString(
                                "id-ID"
                              )}
                            </td>
                            <td>{money(order.total)}</td>
                            <td>
                              <span
                                className={`pro-status-badge ${
                                  normalizeStatus(order.status)
                                    .toLowerCase()
                                    .replaceAll(" ", "-")
                                }`}
                              >
                                {normalizeStatus(order.status)}
                              </span>
                            </td>
                          </tr>
                        ))}

                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5}>
                            Belum ada pesanan simulasi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* MANAJEMEN PRODUK */}
          {adminTab === "products" && (
            <div className="admin-products">
              <form className="panel form-stack" onSubmit={saveProduct}>
                <h2>
                  {editingId !== null
                    ? "Edit Produk"
                    : "Tambah Produk Baru"}
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
                  <option>Fashion</option>
                  <option>Shoes</option>
                  <option>Accessories</option>
                </select>

                <label>Harga Produk (Rp)</label>
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
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                />

                <label>URL Gambar</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.image}
                  onChange={(e) =>
                    setForm({ ...form, image: e.target.value })
                  }
                />

                <label>Deskripsi</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />

                <label>Ukuran (pisahkan koma)</label>
                <input
                  value={form.sizes}
                  onChange={(e) =>
                    setForm({ ...form, sizes: e.target.value })
                  }
                />

                <label>Warna (pisahkan koma)</label>
                <input
                  value={form.colors}
                  onChange={(e) =>
                    setForm({ ...form, colors: e.target.value })
                  }
                />

                <button className="btn-dark wide" type="submit">
                  {editingId !== null
                    ? "Simpan Perubahan"
                    : "+ Tambah Produk"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="btn-light"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    Batal Edit
                  </button>
                )}
              </form>

              <div className="panel">
                <h2>Daftar Produk</h2>

                {products.map((product) => (
                  <div
                    className="admin-product-row"
                    key={product.id}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                    <div className="grow">
                      <strong>{product.name}</strong>
                      <p className="muted">
                        {money(product.price)} · Stok {product.stock}
                      </p>
                    </div>
                    <button
                      className="btn-light"
                      onClick={() => editProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(product.id)}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANAJEMEN PESANAN */}
          {adminTab === "orders" && (
            <div className="pro-card">
              <div className="pro-card-heading">
                <div>
                  <h2>Manajemen Pesanan</h2>
                  <p>Ubah status transaksi simulasi</p>
                </div>
                <select
                  className="pro-order-filter"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                >
                  <option>Semua</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tanggal</th>
                      <th>Pembeli</th>
                      <th>Jumlah</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>
                          {new Date(order.date).toLocaleDateString(
                            "id-ID"
                          )}
                        </td>
                        <td>{order.customer}</td>
                        <td>
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </td>
                        <td>{money(order.total)}</td>
                        <td>
                          <select
                            className="order-status-select"
                            value={normalizeStatus(order.status)}
                            disabled={
                              normalizeStatus(order.status) ===
                              "Dibatalkan"
                            }
                            onChange={(e) =>
                              updateOrderStatus(
                                order.id,
                                e.target.value
                              )
                            }
                          >
                            {statuses
                              .filter(
                                (status) =>
                                  normalizeStatus(order.status) !==
                                    "Selesai" ||
                                  status !== "Dibatalkan"
                              )
                              .map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    ))}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          Belum ada pesanan dengan status tersebut.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="footer">
        <div>
          <h2>LUMINA.</h2>
          <p>Modern Fashion & Lifestyle</p>
        </div>
        <p>React.js E-Commerce Portfolio Project</p>
        <p>© 2026 LUMINA STORE · Demo Only</p>
      </footer>

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
    </div>
  );
}
