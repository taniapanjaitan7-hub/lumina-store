
import { useState } from "react";

const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 125000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"
  },
  {
    id: 2,
    name: "Urban Sneakers",
    price: 350000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
  },
  {
    id: 3,
    name: "Denim Jacket",
    price: 275000,
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600"
  }
];

function App() {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart([...cart, product]);
  }

  return (
    <div style={{
      background: "#f8f5f0",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <nav style={{
        padding: "20px 8%",
        background: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <h2>LUMINA.</h2>
        <div>Home &nbsp; Products &nbsp; About</div>
        <span>🛒 Cart ({cart.length})</span>
      </nav>

      <section style={{
        textAlign: "center",
        padding: "75px 20px",
        background: "#ebe1d5"
      }}>
        <h1 style={{ fontSize: "46px" }}>
          Discover Your Style
        </h1>
        <p>Modern Fashion & Lifestyle Collection</p>
        <a href="#products" style={{
          display: "inline-block",
          background: "#26211d",
          color: "white",
          padding: "14px 28px",
          borderRadius: "12px",
          marginTop: "15px",
          textDecoration: "none"
        }}>
          Explore Products
        </a>
      </section>

      <section id="products" style={{
        maxWidth: "1100px",
        margin: "auto",
        padding: "60px 20px"
      }}>
        <h2 style={{ textAlign: "center", fontSize: "32px" }}>
          Featured Products
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "25px",
          marginTop: "35px"
        }}>
          {products.map((product) => (
            <div key={product.id} style={{
              background: "white",
              borderRadius: "16px",
              padding: "15px",
              boxShadow: "0 4px 15px #00000010"
            }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "12px"
                }}
              />
              <h3>{product.name}</h3>
              <p>
                Rp {product.price.toLocaleString("id-ID")}
              </p>
              <button
                onClick={() => addToCart(product)}
                style={{
                  width: "100%",
                  background: "#26211d",
                  color: "white",
                  border: "none",
                  padding: "13px",
                  borderRadius: "10px",
                  cursor: "pointer"
                }}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{
        background: "#26211d",
        color: "white",
        textAlign: "center",
        padding: "30px"
      }}>
        © 2026 LUMINA STORE — React Portfolio Project
      </footer>
    </div>
  );
}

export default App;
