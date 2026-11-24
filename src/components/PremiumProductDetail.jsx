
import { useEffect, useState } from "react";

const REVIEWS_KEY = "lumina_product_reviews_v1";

function loadReviews() {
  try {
    const data = JSON.parse(
      localStorage.getItem(REVIEWS_KEY) || "{}"
    );

    return data &&
      typeof data === "object" &&
      !Array.isArray(data)
      ? data
      : {};
  } catch {
    return {};
  }
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function PremiumProductDetail({
  product,
  customer,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  onAddToCart,
  onWishlist,
  isWishlisted,
  onBack,
  photoUrl,
}) {
  const photos = [
    ...new Set(
      [
        product.image,
        ...(Array.isArray(product.gallery)
          ? product.gallery
          : []),
      ].filter(Boolean)
    ),
  ];

  const [activeImage, setActiveImage] = useState(
    product.image || ""
  );

  const [failedImage, setFailedImage] = useState("");
  const [ratings, setRatings] = useState(loadReviews);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  const productId = String(product.id);

  const reviews = Array.isArray(ratings[productId])
    ? ratings[productId]
    : [];

  const uid = customer
    ? String(customer.id ?? customer.email ?? "")
    : "";

  const existing = uid
    ? reviews.find((review) => review.userId === uid)
    : null;

  const avgRating = reviews.length
    ? reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      ) / reviews.length
    : 0;

  useEffect(() => {
    setActiveImage(product.image || "");
    setFailedImage("");
  }, [product.id, product.image]);

  useEffect(() => {
    setStars(existing?.rating || 5);
    setComment(existing?.comment || "");
    setNotice("");
  }, [productId, uid]);

  function saveReview(event) {
    event.preventDefault();

    if (!uid) {
      setNotice(
        "Silakan login terlebih dahulu untuk memberi ulasan."
      );
      return;
    }

    if (comment.trim().length < 5) {
      setNotice("Ulasan minimal 5 karakter.");
      return;
    }

    const entry = {
      id: existing?.id || `rev-${Date.now()}`,
      userId: uid,
      name: customer.name || "Pelanggan",
      rating: Number(stars),
      comment: comment.trim().slice(0, 500),
      at: new Date().toISOString(),
    };

    const updated = existing
      ? reviews.map((review) =>
          review.id === existing.id ? entry : review
        )
      : [entry, ...reviews];

    const next = {
      ...ratings,
      [productId]: updated,
    };

    try {
      localStorage.setItem(
        REVIEWS_KEY,
        JSON.stringify(next)
      );

      setRatings(next);
      setNotice("Ulasan berhasil disimpan di browser.");
    } catch {
      setNotice("Gagal menyimpan ulasan.");
    }
  }

  const selectedPhoto = photos.includes(activeImage)
    ? activeImage
    : photos[0];

  return (
    <main className="lum-premium-detail">
      <style>{`
        .lum-premium-detail {
          max-width: 1250px;
          margin: 0 auto;
          padding: 32px 20px 80px;
          color: #34291f;
        }

        .lum-premium-detail * {
          box-sizing: border-box;
        }

        .lum-premium-detail .lp-back {
          background: transparent;
          border: 0;
          cursor: pointer;
          color: #7e6655;
          margin-bottom: 24px;
          padding: 8px 0;
        }

        .lum-premium-detail .lp-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr) minmax(310px, .95fr);
          gap: 42px;
          align-items: start;
        }

        .lum-premium-detail .lp-main-photo {
          background: #faf8f6;
          border: 1px solid #ece3dc;
          border-radius: 15px;
          height: 520px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .lum-premium-detail .lp-main-photo img {
          display: block;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          filter: none !important;
        }

        .lum-premium-detail .lp-thumbnails {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .lum-premium-detail .lp-thumb {
          width: 82px;
          height: 90px;
          border: 1px solid #e3d9cf;
          border-radius: 10px;
          background: white;
          padding: 5px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .lum-premium-detail .lp-thumb.active {
          border: 2px solid #856044;
        }

        .lum-premium-detail .lp-thumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lum-premium-detail .lp-labeltop {
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #99775d;
        }

        .lum-premium-detail h1 {
          font: normal clamp(27px, 3.5vw, 42px)
            Georgia, serif;
          line-height: 1.25;
          margin: 12px 0;
        }

        .lum-premium-detail .lp-price {
          font-size: 25px;
          font-weight: 700;
          margin: 16px 0;
        }

        .lum-premium-detail .lp-description {
          color: #76675e;
          line-height: 1.8;
        }

        .lum-premium-detail .lp-heading {
          display: block;
          margin: 22px 0 9px;
          font-weight: 700;
        }

        .lum-premium-detail .lp-options {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .lum-premium-detail .lp-option {
          padding: 10px 16px;
          border: 1px solid #e1d6cc;
          background: white;
          color: #34291f;
          border-radius: 8px;
          cursor: pointer;
        }

        .lum-premium-detail .lp-option.active {
          background: #34291f;
          color: white;
          border-color: #34291f;
        }

        .lum-premium-detail .lp-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .lum-premium-detail .lp-button {
          padding: 13px 19px;
          border-radius: 9px;
          border: 1px solid #34291f;
          cursor: pointer;
          background: white;
          color: #34291f;
        }

        .lum-premium-detail .lp-button.primary {
          background: #34291f;
          color: white;
        }

        .lum-premium-detail .lp-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lum-premium-detail .lp-rating {
          color: #b47a32;
          font-size: 13px;
          margin: 12px 0;
        }

        .lum-premium-detail .lp-reviews {
          margin-top: 45px;
          padding-top: 25px;
          border-top: 1px solid #e8ddd3;
        }

        .lum-premium-detail .lp-review-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-top: 18px;
        }

        .lum-premium-detail .lp-review {
          background: white;
          border: 1px solid #eee4db;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 11px;
        }

        .lum-premium-detail .lp-review p {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.65;
        }

        .lum-premium-detail .lp-form {
          background: #faf7f3;
          border-radius: 14px;
          padding: 20px;
        }

        .lum-premium-detail .lp-stars {
          display: flex;
          gap: 2px;
          margin: 12px 0;
        }

        .lum-premium-detail .lp-star {
          border: 0;
          background: none;
          color: #c7bdb4;
          font-size: 28px;
          cursor: pointer;
          padding: 3px;
        }

        .lum-premium-detail .lp-star.active {
          color: #d4a04a;
        }

        .lum-premium-detail textarea {
          width: 100%;
          border: 1px solid #e0d5ca;
          border-radius: 9px;
          resize: vertical;
          padding: 12px;
          font: inherit;
        }

        .lum-premium-detail .lp-muted {
          color: #8c8077;
          font-size: 12px;
        }

        @media (max-width: 800px) {
          .lum-premium-detail .lp-grid,
          .lum-premium-detail .lp-review-layout {
            grid-template-columns: 1fr;
          }

          .lum-premium-detail .lp-main-photo {
            height: 390px;
          }

          .lum-premium-detail {
            padding: 18px 14px 60px;
          }
        }
      `}</style>

      <button
        type="button"
        className="lp-back"
        onClick={onBack}
      >
        ← Kembali ke Shop
      </button>

      <div className="lp-grid">
        <div>
          <div className="lp-main-photo">
            {selectedPhoto &&
            selectedPhoto !== failedImage ? (
              <img
                src={photoUrl(selectedPhoto)}
                alt={product.name}
                onError={() =>
                  setFailedImage(selectedPhoto)
                }
              />
            ) : (
              <p className="lp-muted">
                Gambar belum dapat dibuka.
              </p>
            )}
          </div>

          <div className="lp-thumbnails">
            {photos.map((photo, index) => (
              <button
                type="button"
                key={photo}
                className={
                  `lp-thumb ${
                    selectedPhoto === photo
                      ? "active"
                      : ""
                  }`
                }
                aria-label={`Tampilkan foto ${index + 1}`}
                onClick={() => {
                  setActiveImage(photo);
                  setFailedImage("");
                }}
              >
                <img
                  src={photoUrl(photo)}
                  alt={`${product.name} - ${index + 1}`}
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          <p className="lp-muted">
            {photos.length} foto tersedia untuk produk ini.
          </p>
        </div>

        <div>
          <span className="lp-labeltop">
            {product.collection}
          </span>

          <h1>{product.name}</h1>

          <div className="lp-rating">
            {reviews.length
              ? `★ ${avgRating.toFixed(1)} / 5 · ${
                  reviews.length
                } ulasan`
              : "☆ Belum ada ulasan"}
          </div>

          <div className="lp-price">
            {formatRupiah(product.price)}
          </div>

          <p className="lp-description">
            {product.description ||
              "Koleksi pilihan dari LUMINA STORE."}
          </p>

          <p>
            Stok tersedia:{" "}
            <strong>
              {Number(product.stock) || 0}
            </strong>
          </p>

          <label className="lp-heading">
            Pilih Ukuran
          </label>

          <div className="lp-options">
            {(product.sizes || ["All Size"]).map(
              (size) => (
                <button
                  type="button"
                  key={size}
                  className={
                    `lp-option ${
                      selectedSize === size
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    onSizeChange(size)
                  }
                >
                  {size}
                </button>
              )
            )}
          </div>

          <label className="lp-heading">
            Pilih Warna
          </label>

          <div className="lp-options">
            {(product.colors || ["Sesuai foto"]).map(
              (color) => (
                <button
                  type="button"
                  key={color}
                  className={
                    `lp-option ${
                      selectedColor === color
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    onColorChange(color)
                  }
                >
                  {color}
                </button>
              )
            )}
          </div>

          <div className="lp-actions">
            <button
              type="button"
              className="lp-button primary"
              disabled={Number(product.stock) <= 0}
              onClick={() =>
                onAddToCart(
                  product,
                  selectedSize,
                  selectedColor
                )
              }
            >
              {Number(product.stock) > 0
                ? "+ Tambah ke Keranjang"
                : "Stok Habis"}
            </button>

            <button
              type="button"
              className="lp-button"
              onClick={() =>
                onWishlist(product.id)
              }
            >
              {isWishlisted
                ? "♥ Hapus Wishlist"
                : "♡ Simpan Wishlist"}
            </button>
          </div>
        </div>
      </div>

      <section className="lp-reviews">
        <h2>Ulasan Pelanggan</h2>

        <div className="lp-review-layout">
          <div>
            {reviews.length ? (
              reviews.map((review) => (
                <article
                  className="lp-review"
                  key={review.id}
                >
                  <strong>{review.name}</strong>

                  <div className="lp-rating">
                    {"★".repeat(
                      Math.max(
                        0,
                        Math.min(
                          5,
                          Number(review.rating) || 0
                        )
                      )
                    )}
                  </div>

                  <p>{review.comment}</p>

                  <small>
                    {new Date(
                      review.at
                    ).toLocaleDateString("id-ID")}
                  </small>
                </article>
              ))
            ) : (
              <p className="lp-muted">
                Belum ada ulasan untuk produk ini.
              </p>
            )}
          </div>

          <form
            className="lp-form"
            onSubmit={saveReview}
          >
            <h3>
              {existing
                ? "Edit Ulasan Saya"
                : "Tulis Ulasan"}
            </h3>

            <p className="lp-muted">
              Ulasan demo disimpan di browser.
            </p>

            <div className="lp-stars">
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  type="button"
                  key={number}
                  className={
                    `lp-star ${
                      number <= stars
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setStars(number)
                  }
                  aria-label={`${number} bintang`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              rows={5}
              maxLength={500}
              placeholder="Tulis pengalaman menggunakan produk..."
            />

            <button
              type="submit"
              className="lp-button primary"
              style={{ marginTop: 12 }}
            >
              Simpan Ulasan
            </button>

            {!customer && (
              <p className="lp-muted">
                Login sebagai pelanggan sebelum
                menyimpan ulasan.
              </p>
            )}

            {notice && (
              <p
                role="status"
                className="lp-muted"
              >
                {notice}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
