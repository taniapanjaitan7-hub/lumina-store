
import { useState } from "react";
import "./App.css";

const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    category: "Fashion",
    price: 125000,
    oldPrice: 175000,
    badge: "BEST SELLER",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700",
  },
  {
    id: 2,
    name: "Urban Sneakers",
    category: "Shoes",
    price: 350000,
    oldPrice: 425000,
    badge: "NEW",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
  },
  {
    id: 3,
    name: "Denim Jacket",
    category: "Fashion",
    price: 275000,
    oldPrice: 325000,
    badge: "POPULAR",
    image:
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=700",
  },
  {
    id: 4,
    name: "Minimalist Sneakers",
    category: "Shoes",
    price: 395000,
    oldPrice: 450000,
    badge: "NEW",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700",
  },
  {
    id: 5,
    name: "Premium Hoodie",
    category: "Fashion",
    price: 245000,
    oldPrice: 295000,
    badge: "HOT",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700",
  },
  {
    id: 6,
    name: "Leather Handbag",
    category: "Accessories",
    price: 425000,
    oldPrice: 525000,
    badge: "LIMITED",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700",
  },
];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [notification, setNotification] = useState("");

  const categories = ["All", "Fashion", "Shoes", "Accessories"];

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setNotification(`${product.name} ditambahkan ke keranjang`);
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function checkout() {
    if (cart.length === 0) return;

    alert(
      `Pesanan simulasi berhasil!\nTotal: ${formatRupiah(
        cartTotal
      )}\n\nIni adalah proyek portofolio. Tidak ada pembayaran nyata.`
    );

    setCart([]);
    setCartOpen(false);
  }

  const filteredProducts = products
    .filter((product) => {
      const matchCategory =
        category === "All" || product.category === category;

      const matchSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return a.id - b.id;
    });

  return (
    <div className="store">
      {/* TOP BAR */}
      <div className="topbar">
        ✦ Discover your style with LUMINA — New Collection 2026
      </div>

      {/* NAVBAR */}
      <header className="navbar">
        <a className="logo" href="#home">
          LUMINA<span>.</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Shop</a>
          <a href="#benefits">Why Us</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <a href="#products" className="favorite-link">
            ♥ {favorites.length}
          </a>

          <button
            type="button"
            className="cart-trigger"
            onClick={() => setCartOpen(true)}
          >
            🛍 Cart ({cartCount})
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-content">
          <p className="eyebrow">THE NEW COLLECTION — 2026</p>

          <h1>
            Discover Your
            <span>Unique Style.</span>
          </h1>

          <p className="hero-description">
            Elevate your everyday look with timeless fashion,
            premium essentials, and effortless style.
          </p>

          <div className="hero-buttons">
            <a className="primary-button" href="#products">
              Shop Collection →
            </a>

            <a className="secondary-button" href="#about">
              Discover More
            </a>
          </div>

          <div className="hero-note">
            ✦ Timeless Essentials &nbsp; ✦ Everyday Elegance
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200"
            alt="Lumina fashion collection"
          />

          <div className="hero-image-label">
            <small>NEW ARRIVALS</small>
            <strong>Effortless Elegance</strong>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="benefits">
        <div>
          <span>✦</span>
          <h3>Premium Collection</h3>
          <p>Curated fashion essentials</p>
        </div>

        <div>
          <span>♡</span>
          <h3>Made for Everyday</h3>
          <p>Style meets comfort</p>
        </div>

        <div>
          <span>✧</span>
          <h3>Timeless Style</h3>
          <p>Designed for every moment</p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="products-section">
        <div className="section-heading">
          <p className="eyebrow">CURATED FOR YOU</p>
          <h2>Our Featured Collection</h2>
          <p>
            Explore contemporary essentials crafted for your
            everyday wardrobe.
          </p>
        </div>

        <div className="product-toolbar">
          <div className="category-filters">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item ? "filter active" : "filter"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="search-sort">
            <input
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={sort}
              aria-label="Sort products"
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="default">Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image} alt={product.name} />

                <span className="product-badge">
                  {product.badge}
                </span>

                <button
                  type="button"
                  aria-label={`Favorite ${product.name}`}
                  aria-pressed={favorites.includes(product.id)}
                  className={
                    favorites.includes(product.id)
                      ? "heart active"
                      : "heart"
                  }
                  onClick={() =>
                    toggleFavorite(product.id)
                  }
                >
                  ♥
                </button>
              </div>

              <div className="product-info">
                <p className="product-category">
                  {product.category}
                </p>

                <h3>{product.name}</h3>

                <div className="prices">
                  <strong>
                    {formatRupiah(product.price)}
                  </strong>
                  <del>
                    {formatRupiah(product.oldPrice)}
                  </del>
                </div>

                <button
                  type="button"
                  className="add-button"
                  onClick={() => addToCart(product)}
                >
                  + Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty-products">
            Produk yang kamu cari tidak ditemukan.
          </div>
        )}
      </section>

      {/* PROMO */}
      <section className="promo">
        <p className="eyebrow">THE LUMINA EDIT</p>
        <h2>Style is a way to say who you are.</h2>
        <p>
          Discover everyday pieces that feel uniquely yours.
        </p>
        <a href="#products">Explore The Collection →</a>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <div>
          <p className="eyebrow">ABOUT LUMINA</p>
          <h2>Fashion that feels like you.</h2>
        </div>

        <p>
          LUMINA STORE is a modern fashion e-commerce demo
          built with React.js. Created as a web developer
          portfolio project to explore responsive design,
          product management, and interactive shopping.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <h2>LUMINA.</h2>
          <p>Modern Fashion & Lifestyle.</p>
        </div>

        <div>
          <h4>Explore</h4>
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
        </div>

        <div>
          <h4>Project</h4>
          <p>React.js E-Commerce Portfolio</p>
          <p>Frontend Demo — No Real Payments</p>
        </div>

        <div className="footer-bottom">
          © 2026 LUMINA STORE — Portfolio Project
        </div>
      </footer>

      {/* CART SIDEBAR */}
      {cartOpen && (
        <div
          className="cart-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <aside className="cart-panel">
            <div className="cart-header">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>Shopping Cart ({cartCount})</h2>
              </div>

              <button
                type="button"
                className="close-cart"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <span>🛍</span>
                  <h3>Your cart is empty</h3>
                  <p>Start exploring our latest collection.</p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div>
                      <h4>{item.name}</h4>
                      <p>{formatRupiah(item.price)}</p>

                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.id, -1)
                          }
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Subtotal</span>
                <strong>{formatRupiah(cartTotal)}</strong>
              </div>

              <p>
                This is a portfolio demo. No real payments.
              </p>

              <button
                type="button"
                disabled={cart.length === 0}
                className="checkout-button"
                onClick={checkout}
              >
                Checkout Simulation →
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && (
        <div className="toast" role="status">
          <span>✓ {notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
