
import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

/* ==========================================
   LUMINA STORE
   FULL APPLICATION
   PAYMENT CONFIRMATION + ORDER TRACKING
========================================== */

const CATEGORIES = [
  {
    folder: "baju pria",
    name: "Pria",
    label: "Baju Pria",
    price: 179000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "baju wanita",
    name: "Wanita",
    label: "Baju Wanita",
    price: 199000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "batik wanita",
    name: "Batik Wanita",
    label: "Batik",
    price: 235000,
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    folder: "sepatu pria",
    name: "Sepatu Pria",
    label: "Sepatu Pria",
    price: 295000,
    sizes: ["39", "40", "41", "42", "43", "44"],
  },
  {
    folder: "sepatu wanita",
    name: "Sepatu Wanita",
    label: "Sepatu Wanita",
    price: 245000,
    sizes: ["35", "36", "37", "38", "39", "40"],
  },
  {
    folder: "tas wanita",
    name: "Tas Wanita",
    label: "Tas",
    price: 249000,
    sizes: ["All Size"],
  },
  {
    folder: "aksesoris wanita",
    name: "Accessories",
    label: "Aksesori",
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

const PAYMENT_METHODS = [
  {
    value: "cod",
    label: "COD - Bayar di Tempat",
  },
  {
    value: "transfer",
    label: "Transfer Bank (Simulasi)",
  },
  {
    value: "qris",
    label: "QRIS (Simulasi)",
  },
];

const KEY = {
  products: "lumina_products_v2",
  oldProducts: "lumina_products_v1",
  orders: "lumina_orders_v1",
  session: "lumina_session_v1",
  cart: "lumina_cart_v1",
  wishlist: "lumina_wishlist_v1",
  deleted: "lumina_deleted_local_v2",
  reviews: "lumina_product_reviews_v1",
};

const DEFAULT_FORM = {
  id: null,
  name: "",
  collection: "Pria",
  image: "",
  gallery: "",
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
  payment: "cod",
};

/* ==========================================
   HELPER
========================================== */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    return raw === null
      ? fallback
      : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const data = read(key, []);

  return Array.isArray(data)
    ? data
    : [];
}

function save(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error(
      "Gagal menyimpan:",
      error
    );

    return false;
  }
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function splitText(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function money(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dateText(value) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusOf(value) {
  return STATUSES.includes(value)
    ? value
    : "Pesanan Baru";
}

function paymentName(value) {
  return PAYMENT_METHODS.find(
    (item) => item.value === value
  )?.label || "Belum tercatat";
}

function paymentStatus(order) {
  if (order.paymentStatus) {
    return order.paymentStatus;
  }

  if (order.paymentMethod === "cod") {
    return "Bayar di Tempat";
  }

  if (
    ["transfer", "qris"].includes(
      order.paymentMethod
    )
  ) {
    return "Menunggu Pembayaran";
  }

  return "Belum tercatat";
}

function validNextStatus(current, next) {
  if (
    !STATUSES.includes(next) ||
    ["Selesai", "Dibatalkan"].includes(current)
  ) {
    return false;
  }

  return (
    next === "Dibatalkan" ||
    STATUSES.indexOf(next) ===
      STATUSES.indexOf(current) + 1
  );
}

function canConfirmPayment(order) {
  if (
    !order ||
    !["cod", "transfer", "qris"].includes(
      order.paymentMethod
    )
  ) {
    return false;
  }

  if (
    statusOf(order.status) === "Dibatalkan" ||
    paymentStatus(order) === "Lunas"
  ) {
    return false;
  }

  if (
    order.paymentMethod === "cod" &&
    statusOf(order.status) !== "Selesai"
  ) {
    return false;
  }

  return true;
}

/* ==========================================
   FOTO PRODUK
========================================== */

function folderName(value) {
  const oldNames = {
    pria: "baju pria",
    wanita: "baju wanita",
    aksesoris: "aksesoris wanita",
  };

  const name = normalize(value);

  return oldNames[name] || name;
}

function imagePath(value) {
  if (!value) return "";

  const raw = String(value)
    .replace(/\\/g, "/")
    .trim();

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const segments = raw
    .replace(/^(?:\.\/)?public\//i, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);

  if (
    normalize(segments[0]) === "images" &&
    segments[1]
  ) {
    try {
      segments[1] = folderName(
        decodeURIComponent(segments[1])
      );
    } catch {
      segments[1] = folderName(segments[1]);
    }
  } else if (
    CATEGORIES.some(
      (category) =>
        category.folder ===
        folderName(segments[0])
    )
  ) {
    segments[0] = folderName(segments[0]);
    segments.unshift("images");
  }

  return "/" + segments.join("/");
}

function photoUrl(value) {
  const path = imagePath(value);

  if (
    !path ||
    /^(https?:|data:|blob:)/i.test(path)
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL.replace(
    /\/$/,
    ""
  );

  return (
    base +
    "/" +
    path
      .replace(/^\/+/, "")
      .split("/")
      .map((part) => {
        try {
          return encodeURIComponent(
            decodeURIComponent(part)
          );
        } catch {
          return encodeURIComponent(part);
        }
      })
      .join("/")
  );
}

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages)
      ? productImages
      : []
    )
      .filter((photo) => photo?.url)
      .map((photo) => {
        const url = imagePath(photo.url);

        const parts = url
          .replace(/^\/+/, "")
          .split("/");

        const index = parts.findIndex(
          (part) =>
            normalize(part) === "images"
        );

        let pathFolder =
          index >= 0
            ? parts[index + 1]
            : "";

        try {
          pathFolder = decodeURIComponent(
            pathFolder
          );
        } catch {
          // Pertahankan nama asli.
        }

        return {
          ...photo,
          folder: folderName(
            photo.folder || pathFolder
          ),
          url,
          name:
            photo.name ||
            parts[parts.length - 1],
        };
      })
      .filter((photo) =>
        CATEGORIES.some(
          (category) =>
            category.folder === photo.folder
        )
      )
      .map((photo) => [
        photo.url,
        photo,
      ])
  ).values(),
];

const INITIAL_PRODUCTS = PHOTOS.map(
  (photo) => {
    const category = CATEGORIES.find(
      (item) =>
        item.folder === photo.folder
    );

    return {
      id: `local:${photo.url}`,
      name: `${category.label} — ${photo.name}`,
      collection: category.name,
      image: photo.url,
      gallery: [],
      price: category.price,
      stock: 20,
      sizes: [...category.sizes],
      colors: ["Sesuai foto"],
      description:
        `Koleksi ${category.label} dari LUMINA STORE.`,
    };
  }
);

function loadProducts() {
  const existing =
    localStorage.getItem(KEY.products) !== null
      ? readArray(KEY.products)
      : readArray(KEY.oldProducts);

  const deleted = new Set(
    readArray(KEY.deleted).map(String)
  );

  const savedProducts = existing
    .filter(
      (product) =>
        product &&
        product.id != null &&
        product.name &&
        !deleted.has(String(product.id))
    )
    .map((product) => {
      const image = imagePath(product.image);

      const category =
        CATEGORIES.find(
          (item) =>
            item.name === product.collection
        ) ||
        CATEGORIES.find(
          (item) =>
            PHOTOS.some(
              (photo) =>
                photo.folder === item.folder &&
                photo.url === image
            )
        ) ||
        CATEGORIES[0];

      return {
        ...product,
        image,
        collection: category.name,
        price: Number(product.price) || 0,
        stock: Math.max(
          0,
          Number(product.stock) || 0
        ),
        sizes: Array.isArray(product.sizes)
          ? product.sizes
          : category.sizes,
        colors: Array.isArray(product.colors)
          ? product.colors
          : ["Sesuai foto"],
        gallery: Array.isArray(product.gallery)
          ? product.gallery.map(imagePath)
          : [],
      };
    });

  const usedPhotos = new Set(
    savedProducts.map(
      (product) => product.image
    )
  );

  const additional = INITIAL_PRODUCTS.filter(
    (product) => {
      const oldImage = product.image
        .replace(
          "/images/baju pria/",
          "/images/pria/"
        )
        .replace(
          "/images/baju wanita/",
          "/images/wanita/"
        )
        .replace(
          "/images/aksesoris wanita/",
          "/images/aksesoris/"
        );

      return (
        !usedPhotos.has(product.image) &&
        !deleted.has(String(product.id)) &&
        !deleted.has(`local:${oldImage}`)
      );
    }
  );

  return [
    ...savedProducts,
    ...additional,
  ];
}

function ProductImage({
  src,
  alt,
  style,
}) {
  const [failed, setFailed] = useState("");

  const url = photoUrl(src);

  if (!url || failed === url) {
    return (
      <div
        className="lum-photo-placeholder"
        style={style}
      >
        Foto belum tersedia
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt || "Produk LUMINA"}
      style={style}
      loading="lazy"
      onError={() => setFailed(url)}
    />
  );
}

/* ==========================================
   KARTU PRODUK
========================================== */

function ProductCard({
  product,
  wishlist,
  onDetail,
  onWishlist,
  onCart,
}) {
  const available = Number(product.stock) > 0;

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
          {available
            ? "LUMINA COLLECTION"
            : "SOLD OUT"}
        </span>

        <button
          type="button"
          className="heart"
          onClick={() =>
            onWishlist(product.id)
          }
        >
          {wishlist.includes(product.id)
            ? "♥"
            : "♡"}
        </button>
      </div>

      <div className="product-body">
        <small>{product.collection}</small>

        <h3>{product.name}</h3>

        <p className="price">
          {money(product.price)}
        </p>

        <p className="muted">
          Stok: {product.stock}
        </p>

        <div className="product-actions">
          <button
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Lihat Detail
          </button>

          <button
            className="btn-dark"
            disabled={!available}
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
  ...props
}) {
  if (!products.length) {
    return (
      <div className="lum-empty">
        <h3>Produk tidak ditemukan</h3>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          {...props}
        />
      ))}
    </div>
  );
}

/* ==========================================
   DETAIL PRODUK PREMIUM
========================================== */

function PremiumDetail({
  product,
  customer,
  size,
  color,
  setSize,
  setColor,
  onCart,
  onWishlist,
  isWishlisted,
  onBack,
}) {
  const pictures = [
    ...new Set(
      [
        product.image,
        ...(Array.isArray(product.gallery)
          ? product.gallery
          : []),
      ].filter(Boolean)
    ),
  ];

  const [photo, setPhoto] = useState(
    product.image
  );

  const [reviews, setReviews] = useState(
    () => read(KEY.reviews, {})
  );

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  const key = String(product.id);

  const list = Array.isArray(reviews?.[key])
    ? reviews[key]
    : [];

  const userId = customer
    ? String(
        customer.id ??
          customer.email ??
          ""
      )
    : "";

  const myReview = userId
    ? list.find(
        (review) =>
          review.userId === userId
      )
    : null;

  useEffect(() => {
    setPhoto(product.image);
  }, [
    product.id,
    product.image,
  ]);

  useEffect(() => {
    setRating(myReview?.rating || 5);
    setComment(myReview?.comment || "");
  }, [
    key,
    userId,
  ]);

  const average = list.length
    ? list.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      ) / list.length
    : 0;

  function submitReview(event) {
    event.preventDefault();

    if (!userId) {
      setNotice(
        "Login dahulu untuk mengulas."
      );
      return;
    }

    if (comment.trim().length < 5) {
      setNotice(
        "Ulasan minimal 5 karakter."
      );
      return;
    }

    const record = {
      id:
        myReview?.id ||
        `review-${Date.now()}`,
      userId,
      name:
        customer.name ||
        "Pelanggan",
      rating,
      comment:
        comment.trim().slice(0, 500),
      at: new Date().toISOString(),
    };

    const updated = myReview
      ? list.map((review) =>
          review.id === myReview.id
            ? record
            : review
        )
      : [record, ...list];

    const next = {
      ...reviews,
      [key]: updated,
    };

    if (save(KEY.reviews, next)) {
      setReviews(next);
      setNotice(
        "Ulasan tersimpan pada browser ini."
      );
    } else {
      setNotice(
        "Gagal menyimpan ulasan."
      );
    }
  }

  return (
    <main className="container section lum-new-detail">
      <button
        className="back"
        onClick={onBack}
      >
        ← Kembali ke Shop
      </button>

      <div className="lum-detail-grid">
        <div>
          <div className="lum-detail-main">
            <ProductImage
              src={photo}
              alt={product.name}
            />
          </div>

          <div className="lum-detail-thumbs">
            {pictures.map((url, index) => (
              <button
                type="button"
                key={url}
                className={
                  photo === url
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPhoto(url)
                }
              >
                <ProductImage
                  src={url}
                  alt={`Foto ${index + 1}`}
                />
              </button>
            ))}
          </div>

          <small className="muted">
            {pictures.length} foto tersedia
          </small>
        </div>

        <section className="lum-detail-data">
          <p className="eyebrow">
            {product.collection}
          </p>

          <h1>{product.name}</h1>

          <p className="lum-stars">
            {list.length
              ? `★ ${average.toFixed(1)} (${list.length} ulasan)`
              : "☆ Belum ada ulasan"}
          </p>

          <h2 className="price">
            {money(product.price)}
          </h2>

          <p>{product.description}</p>

          <p>Stok: {product.stock}</p>

          <label>Pilih Ukuran</label>

          <div className="option-row">
            {(product.sizes || [
              "All Size",
            ]).map((item) => (
              <button
                key={item}
                className={
                  size === item
                    ? "chosen"
                    : ""
                }
                onClick={() => setSize(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label>Pilih Warna</label>

          <div className="option-row">
            {(product.colors || [
              "Sesuai foto",
            ]).map((item) => (
              <button
                key={item}
                className={
                  color === item
                    ? "chosen"
                    : ""
                }
                onClick={() => setColor(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            className="btn-dark wide"
            disabled={
              Number(product.stock) <= 0
            }
            onClick={() =>
              onCart(
                product,
                size,
                color
              )
            }
          >
            + Tambahkan ke Keranjang
          </button>

          <button
            className="btn-light wide"
            onClick={() =>
              onWishlist(product.id)
            }
          >
            {isWishlisted
              ? "♥ Hapus Wishlist"
              : "♡ Tambah Wishlist"}
          </button>
        </section>
      </div>

      <section className="lum-review-box">
        <h2>Ulasan Pelanggan</h2>

        <div className="lum-review-grid">
          <div>
            {list.length ? (
              list.map((review) => (
                <article
                  key={review.id}
                  className="panel"
                >
                  <strong>{review.name}</strong>

                  <p className="lum-stars">
                    {"★".repeat(
                      Math.min(
                        5,
                        Math.max(
                          0,
                          Number(review.rating) || 0
                        )
                      )
                    )}
                  </p>

                  <p>{review.comment}</p>

                  <small>
                    {dateText(review.at)}
                  </small>
                </article>
              ))
            ) : (
              <p>Belum ada ulasan.</p>
            )}
          </div>

          <form
            className="panel"
            onSubmit={submitReview}
          >
            <h3>
              {myReview
                ? "Edit Ulasan"
                : "Tulis Ulasan"}
            </h3>

            <div className="lum-rating-buttons">
              {[1, 2, 3, 4, 5].map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    className={
                      number <= rating
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setRating(number)
                    }
                  >
                    ★
                  </button>
                )
              )}
            </div>

            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              placeholder="Tulis ulasan..."
              onChange={(event) =>
                setComment(event.target.value)
              }
            />

            <button
              type="submit"
              className="btn-dark"
            >
              Simpan Ulasan
            </button>

            <p className="muted">
              Ulasan simulasi disimpan di browser.
            </p>

            {notice && (
              <p role="status">{notice}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

/* ==========================================
   TRACKING PESANAN PELANGGAN
========================================== */

function CustomerTracking({ orders }) {
  const stages = STATUSES.slice(0, 4);

  return (
    <section className="container section lum-customer-track">
      <h2 className="section-title">
        Tracking & Pembayaran Pesanan Saya
      </h2>

      {!orders.length && (
        <p className="panel">
          Belum ada pesanan yang dapat dilacak.
        </p>
      )}

      {orders.map((order) => {
        const status = statusOf(order.status);

        const paid =
          paymentStatus(order) === "Lunas";

        const index = stages.indexOf(status);

        return (
          <article
            className="panel lum-track-card"
            key={order.id}
          >
            <div className="lum-track-head">
              <div>
                <strong>{order.id}</strong>

                <p className="muted">
                  {dateText(order.date)}
                  {" · "}
                  {money(order.total)}
                </p>
              </div>

              <span className="lum-payment-badge">
                {status}
              </span>
            </div>

            <div className="lum-track-meta">
              <span>
                Metode:{" "}
                <b>
                  {paymentName(
                    order.paymentMethod
                  )}
                </b>
              </span>

              <span>
                Pembayaran:{" "}
                <b>{paymentStatus(order)}</b>
              </span>
            </div>

            {status === "Dibatalkan" ? (
              <p className="lum-cancel-note">
                Pesanan dibatalkan.
              </p>
            ) : (
              <div className="lum-track-steps">
                {stages.map(
                  (stage, stepIndex) => (
                    <div
                      key={stage}
                      className={
                        stepIndex <= index
                          ? "complete"
                          : ""
                      }
                    >
                      <span>
                        {stepIndex < index
                          ? "✓"
                          : stepIndex + 1}
                      </span>

                      <small>{stage}</small>
                    </div>
                  )
                )}
              </div>
            )}

            {paid && (
              <p className="lum-paid-note">
                ✓ Pembayaran dikonfirmasi Admin{" "}
                {order.paidAt
                  ? `pada ${dateText(
                      order.paidAt
                    )}`
                  : ""}
                .
              </p>
            )}

            {status !== "Dibatalkan" &&
              !paid &&
              order.paymentMethod === "cod" && (
                <p className="muted">
                  COD dibayar saat paket diterima.
                  Admin mencatatnya setelah
                  pesanan selesai.
                </p>
              )}

            {status !== "Dibatalkan" &&
              !paid &&
              ["transfer", "qris"].includes(
                order.paymentMethod
              ) && (
                <p className="muted">
                  Menunggu Admin melakukan
                  konfirmasi pembayaran simulasi.
                </p>
              )}

            {Array.isArray(order.paymentHistory) &&
              order.paymentHistory.length > 0 && (
                <small>
                  Riwayat konfirmasi:{" "}
                  {order.paymentHistory
                    .map(
                      (item) =>
                        `${item.status} (${dateText(
                          item.at
                        )})`
                    )
                    .join(", ")}
                </small>
              )}
          </article>
        );
      })}
    </section>
  );
}

/* ==========================================
   ADMIN ANALYTICS
========================================== */

function AdminAnalytics({
  orders,
  products,
}) {
  const completed = orders.filter(
    (order) =>
      statusOf(order.status) === "Selesai"
  );

  const revenue = completed.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const quantity = completed.reduce(
    (sum, order) =>
      sum +
      (order.items || []).reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
    0
  );

  const now = new Date();

  const months = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1
      );

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      return {
        key,
        label: date.toLocaleDateString(
          "id-ID",
          {
            month: "short",
            year: "2-digit",
          }
        ),
        sum: 0,
      };
    }
  );

  completed.forEach((order) => {
    const history = Array.isArray(
      order.history
    )
      ? order.history
      : [];

    const last = [...history]
      .reverse()
      .find(
        (item) =>
          item.status === "Selesai"
      );

    const date = new Date(
      last?.at ||
      order.updatedAt ||
      order.date ||
      ""
    );

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    const month = months.find(
      (item) => item.key === key
    );

    if (month) {
      month.sum += Number(order.total || 0);
    }
  });

  const maxRevenue = Math.max(
    1,
    ...months.map((month) => month.sum)
  );

  const sold = new Map();

  completed.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = String(
        item.id ?? item.name
      );

      const previous = sold.get(key) || {
        name: item.name,
        quantity: 0,
      };

      previous.quantity += Number(
        item.quantity || 0
      );

      sold.set(key, previous);
    });
  });

  const best = [...sold.values()]
    .sort(
      (a, b) =>
        b.quantity - a.quantity
    )
    .slice(0, 5);

  return (
    <section className="lum-analytics">
      <h2>Advanced Sales Analytics</h2>

      <p className="muted">
        Data transaksi simulasi yang
        tersimpan di browser.
      </p>

      <div className="lum-analytics-cards">
        {[
          [
            "Pendapatan Selesai",
            money(revenue),
          ],
          [
            "Pesanan Selesai",
            completed.length,
          ],
          [
            "Unit Terjual",
            quantity,
          ],
          [
            "Stok ≤ 5",
            products.filter(
              (item) =>
                Number(item.stock) <= 5
            ).length,
          ],
        ].map(([name, value]) => (
          <article
            className="lum-dash-card"
            key={name}
          >
            <small>{name}</small>

            <h2>{value}</h2>
          </article>
        ))}
      </div>

      <div className="lum-analytics-panels">
        <section className="lum-dash-card">
          <h3>
            Pendapatan 6 Bulan Terakhir
          </h3>

          <div className="lum-mini-chart">
            {months.map((month) => (
              <div
                key={month.key}
                title={
                  `${month.label}: ${money(
                    month.sum
                  )}`
                }
              >
                <div className="lum-chart-track">
                  <div
                    style={{
                      height: `${
                        month.sum
                          ? Math.max(
                              3,
                              month.sum /
                                maxRevenue *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <small>{month.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="lum-dash-card">
          <h3>Status Pesanan</h3>

          {STATUSES.map((status) => (
            <p
              className="lum-between"
              key={status}
            >
              <span>{status}</span>

              <strong>
                {
                  orders.filter(
                    (order) =>
                      statusOf(order.status) ===
                      status
                  ).length
                }
              </strong>
            </p>
          ))}
        </section>
      </div>

      <section className="lum-dash-card">
        <h3>5 Produk Terlaris</h3>

        {best.length ? (
          best.map((product, index) => (
            <p
              className="lum-between"
              key={index}
            >
              <span>
                {index + 1}. {product.name}
              </span>

              <strong>
                {product.quantity} unit
              </strong>
            </p>
          ))
        ) : (
          <p>Belum ada transaksi selesai.</p>
        )}
      </section>
    </section>
  );
}

/* ==========================================
   TABEL PESANAN ADMIN
========================================== */

function OrderTable({
  orders,
  editable = false,
  onStatus,
  onPayment,
}) {
  return (
    <div className="lum-dash-table-wrap">
      <table className="lum-dash-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tanggal</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Total</th>
            <th>Pembayaran</th>
            <th>Status Bayar</th>
            <th>Status Pesanan</th>
            {editable && <th>Aksi</th>}
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = statusOf(
              order.status
            );

            const canPay =
              canConfirmPayment(order);

            const paid =
              paymentStatus(order) === "Lunas";

            return (
              <tr key={order.id}>
                <td>{order.id}</td>

                <td>{dateText(order.date)}</td>

                <td>
                  {order.customer || "-"}
                </td>

                <td>
                  {(order.items || [])
                    .map(
                      (item) =>
                        `${item.name} (${item.quantity})`
                    )
                    .join(", ") || "-"}
                </td>

                <td>
                  {money(order.total)}
                </td>

                <td>
                  {paymentName(
                    order.paymentMethod
                  )}
                </td>

                <td>
                  {paymentStatus(order)}
                </td>

                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={[
                        "Selesai",
                        "Dibatalkan",
                      ].includes(status)}
                      onChange={(event) =>
                        onStatus(
                          order.id,
                          event.target.value
                        )
                      }
                    >
                      {STATUSES.map((next) => (
                        <option
                          key={next}
                          value={next}
                          disabled={
                            (next !== status &&
                              !validNextStatus(
                                status,
                                next
                              )) ||
                            (next !== status &&
                              next !== "Dibatalkan" &&
                              ["transfer", "qris"].includes(
                                order.paymentMethod
                              ) &&
                              !paid)
                          }
                        >
                          {next}
                        </option>
                      ))}
                    </select>
                  ) : (
                    status
                  )}
                </td>

                {editable && (
                  <td>
                    <button
                      type="button"
                      className="btn-dark"
                      disabled={!canPay}
                      onClick={() =>
                        onPayment(order.id)
                      }
                    >
                      {paid
                        ? "✓ Lunas"
                        : order.paymentMethod === "cod"
                          ? "Konfirmasi COD"
                          : "Tandai Lunas"}
                    </button>

                    {order.paymentMethod === "cod" &&
                      status !== "Selesai" &&
                      !paid && (
                        <small className="lum-hint">
                          COD setelah selesai
                        </small>
                      )}
                  </td>
                )}
              </tr>
            );
          })}

          {!orders.length && (
            <tr>
              <td colSpan={editable ? 9 : 8}>
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
   DASHBOARD ADMIN
========================================== */

function AdminDashboard({
  products,
  orders,
  form,
  setForm,
  onSave,
  onEdit,
  onDelete,
  onStatus,
  onPayment,
  onBack,
}) {
  const [tab, setTab] = useState("overview");

  const [search, setSearch] = useState("");

  const [folder, setFolder] = useState("Semua");

  const [previewId, setPreviewId] = useState("");

  const filteredOrders = orders.filter(
    (order) =>
      normalize(
        `${order.id} ${order.customer} ${order.status} ${order.paymentMethod}`
      ).includes(normalize(search))
  );

  const filteredProducts = products.filter(
    (product) =>
      normalize(
        `${product.name} ${product.collection}`
      ).includes(normalize(search))
  );

  const filteredPhotos = PHOTOS.filter(
    (photo) =>
      (folder === "Semua" ||
        photo.folder === folder) &&
      normalize(
        `${photo.name} ${photo.folder}`
      ).includes(normalize(search))
  );

  const preview =
    filteredOrders.find(
      (order) =>
        String(order.id) === previewId
    ) || filteredOrders[0];

  const completed = orders.filter(
    (order) =>
      statusOf(order.status) === "Selesai"
  );

  const revenue = completed.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) <= 5
  );

  function change(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function exportCSV() {
    const rows = [
      [
        "ID",
        "Tanggal",
        "Pelanggan",
        "Total",
        "Metode",
        "Status Bayar",
        "Status Pesanan",
      ],

      ...filteredOrders.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.total,
        paymentName(order.paymentMethod),
        paymentStatus(order),
        statusOf(order.status),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let text = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(text)) {
              text = "'" + text;
            }

            return (
              '"' +
              text.replaceAll('"', '""') +
              '"'
            );
          })
          .join(",")
      )
      .join("\r\n");

    const link =
      document.createElement("a");

    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + csv],
        {
          type: "text/csv;charset=utf-8",
        }
      )
    );

    link.href = url;
    link.download =
      "laporan-lumina.csv";
    link.click();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  }

  const currentCategory = CATEGORIES.find(
    (category) =>
      category.name === form.collection
  );

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
              className={
                tab === value
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(value);
                setSearch("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          className="lum-dash-back"
          onClick={onBack}
        >
          ← Kembali ke Toko
        </button>
      </aside>

      <main className="lum-dash-main">
        <header className="lum-dash-topbar">
          <div>
            <p className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </p>

            <h1>
              {{
                overview:
                  "Dashboard Overview",
                products:
                  "Product Management",
                orders:
                  "Order Management",
                reports:
                  "Sales Report",
                gallery:
                  "Photo Gallery",
              }[tab]}
            </h1>
          </div>

          <input
            placeholder="Cari produk / pesanan..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </header>

        {/* OVERVIEW */}

        {tab === "overview" && (
          <>
            <AdminAnalytics
              orders={orders}
              products={products}
            />

            <section className="lum-dash-card">
              <h2>Inventory Monitoring</h2>

              {lowStock.length ? (
                lowStock.map((product) => (
                  <p
                    className="lum-between"
                    key={product.id}
                  >
                    <span>
                      {product.name}
                    </span>

                    <strong>
                      {Number(product.stock) === 0
                        ? "Habis"
                        : `Sisa ${product.stock}`}
                    </strong>
                  </p>
                ))
              ) : (
                <p>✓ Semua stok aman.</p>
              )}
            </section>

            <section className="lum-dash-card">
              <h2>Collection Overview</h2>

              <div className="lum-category-stats">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="btn-light"
                    onClick={() => {
                      setFolder(
                        category.folder
                      );
                      setTab("gallery");
                    }}
                  >
                    {category.label}
                    {" "}
                    (
                    {
                      products.filter(
                        (product) =>
                          product.collection ===
                          category.name
                      ).length
                    }
                    )
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>Recent Orders</h2>

              <OrderTable
                orders={orders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {/* PRODUCTS */}

        {tab === "products" && (
          <div className="lum-dash-products">
            <form
              className="lum-dash-card lum-dash-product-form"
              onSubmit={onSave}
            >
              <h2>
                {form.id === null
                  ? "Tambah Produk"
                  : "Edit Produk"}
              </h2>

              <label>Nama Produk</label>

              <input
                required
                value={form.name}
                onChange={(event) =>
                  change(
                    "name",
                    event.target.value
                  )
                }
              />

              <label>Kategori</label>

              <select
                value={form.collection}
                onChange={(event) => {
                  const category =
                    CATEGORIES.find(
                      (item) =>
                        item.name ===
                        event.target.value
                    );

                  if (category) {
                    setForm((previous) => ({
                      ...previous,
                      collection:
                        category.name,
                      image: "",
                      gallery: "",
                      sizes:
                        category.sizes.join(","),
                    }));
                  }
                }}
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category.name}
                    value={category.name}
                  >
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
                onChange={(event) =>
                  change(
                    "price",
                    event.target.value
                  )
                }
              />

              <label>Stok</label>

              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={(event) =>
                  change(
                    "stock",
                    event.target.value
                  )
                }
              />

              <label>Gambar Utama</label>

              <select
                value={form.image}
                onChange={(event) =>
                  change(
                    "image",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Pilih gambar
                </option>

                {PHOTOS.filter(
                  (photo) =>
                    photo.folder ===
                    currentCategory?.folder
                ).map((photo) => (
                  <option
                    key={photo.url}
                    value={photo.url}
                  >
                    {photo.name}
                  </option>
                ))}
              </select>

              <div className="lum-admin-preview">
                <ProductImage
                  src={form.image}
                  alt="Preview"
                />
              </div>

              <label>Foto Tambahan</label>

              <select
                value=""
                onChange={(event) => {
                  const url =
                    event.target.value;

                  if (!url) return;

                  setForm((previous) => ({
                    ...previous,
                    gallery: [
                      ...new Set([
                        ...splitText(
                          previous.gallery
                        ),
                        url,
                      ]),
                    ]
                      .filter(
                        (item) =>
                          item !== previous.image
                      )
                      .join(","),
                  }));
                }}
              >
                <option value="">
                  + Pilih Foto Tambahan
                </option>

                {PHOTOS.filter(
                  (photo) =>
                    photo.folder ===
                      currentCategory?.folder &&
                    photo.url !== form.image &&
                    !splitText(
                      form.gallery
                    ).includes(photo.url)
                ).map((photo) => (
                  <option
                    key={photo.url}
                    value={photo.url}
                  >
                    {photo.name}
                  </option>
                ))}
              </select>

              <div className="lum-extra-gallery">
                {splitText(form.gallery).map(
                  (url) => (
                    <div key={url}>
                      <div className="lum-admin-thumb">
                        <ProductImage
                          src={url}
                          alt="Foto tambahan"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-light"
                        onClick={() =>
                          setForm(
                            (previous) => ({
                              ...previous,
                              gallery: splitText(
                                previous.gallery
                              )
                                .filter(
                                  (item) =>
                                    item !== url
                                )
                                .join(","),
                            })
                          )
                        }
                      >
                        Hapus dari galeri
                      </button>
                    </div>
                  )
                )}
              </div>

              <label>Deskripsi Produk</label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  change(
                    "description",
                    event.target.value
                  )
                }
              />

              <label>Ukuran</label>

              <input
                value={form.sizes}
                onChange={(event) =>
                  change(
                    "sizes",
                    event.target.value
                  )
                }
              />

              <label>Warna</label>

              <input
                value={form.colors}
                onChange={(event) =>
                  change(
                    "colors",
                    event.target.value
                  )
                }
              />

              <button
                type="submit"
                className="btn-dark"
              >
                Simpan Produk
              </button>

              {form.id !== null && (
                <button
                  type="button"
                  className="btn-light"
                  onClick={() =>
                    setForm({
                      ...DEFAULT_FORM,
                    })
                  }
                >
                  Batal Edit
                </button>
              )}
            </form>

            <section className="lum-dash-card">
              <h2>
                Daftar Produk ({products.length})
              </h2>

              {filteredProducts.map(
                (product) => (
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
                      <strong>
                        {product.name}
                      </strong>

                      <p>
                        {money(product.price)}
                        {" · "}
                        Stok {product.stock}
                      </p>
                    </div>

                    <button
                      className="btn-light"
                      onClick={() =>
                        onEdit(product)
                      }
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
                )
              )}
            </section>
          </div>
        )}

        {/* ORDER MANAGEMENT + PAYMENT */}

        {tab === "orders" && (
          <section className="lum-dash-card">
            <h2>
              Manajemen Pesanan &
              Konfirmasi Pembayaran
            </h2>

            <p className="muted">
              Transfer dan QRIS harus
              dikonfirmasi lunas sebelum
              pesanan diproses. COD dikonfirmasi
              setelah pesanan selesai.
              Semua pembayaran adalah simulasi.
            </p>

            {preview && (
              <>
                <label htmlFor="order-select">
                  Pilih pesanan
                </label>

                <select
                  id="order-select"
                  value={String(preview.id)}
                  onChange={(event) =>
                    setPreviewId(
                      event.target.value
                    )
                  }
                >
                  {filteredOrders.map((order) => (
                    <option
                      key={order.id}
                      value={String(order.id)}
                    >
                      {order.id}
                      {" — "}
                      {order.customer}
                    </option>
                  ))}
                </select>

                <div className="lum-payment-detail">
                  <p>
                    <strong>Metode:</strong>{" "}
                    {paymentName(
                      preview.paymentMethod
                    )}
                  </p>

                  <p>
                    <strong>Status bayar:</strong>{" "}
                    {paymentStatus(preview)}
                  </p>

                  {preview.paidAt && (
                    <p>
                      <strong>Dikonfirmasi:</strong>{" "}
                      {dateText(preview.paidAt)}
                    </p>
                  )}

                  <button
                    className="btn-dark"
                    disabled={
                      !canConfirmPayment(preview)
                    }
                    onClick={() =>
                      onPayment(preview.id)
                    }
                  >
                    {paymentStatus(preview) ===
                    "Lunas"
                      ? "✓ Sudah Lunas"
                      : preview.paymentMethod ===
                          "cod"
                        ? "Konfirmasi COD Diterima"
                        : "Konfirmasi Pembayaran / Tandai Lunas"}
                  </button>

                  {preview.paymentMethod === "cod" &&
                    statusOf(preview.status) !==
                      "Selesai" && (
                      <p className="muted">
                        Untuk COD, ubah status
                        pesanan sampai Selesai
                        terlebih dahulu.
                      </p>
                    )}
                </div>

                <OrderStatusFlow
                  status={statusOf(
                    preview.status
                  )}
                />

                <OrderHistory
                  order={preview}
                />
              </>
            )}

            <h3>Daftar Pesanan</h3>

            <OrderTable
              orders={filteredOrders}
              editable
              onStatus={onStatus}
              onPayment={onPayment}
            />
          </section>
        )}

        {/* REPORTS */}

        {tab === "reports" && (
          <section className="lum-dash-card">
            <h2>Laporan Transaksi</h2>

            <p>
              Total pesanan: {orders.length}
              {" · "}
              Selesai: {completed.length}
              {" · "}
              Pendapatan selesai: {money(revenue)}
            </p>

            <OrderTable
              orders={filteredOrders}
            />

            <div className="lum-report-actions">
              <button
                className="btn-dark"
                disabled={
                  !filteredOrders.length
                }
                onClick={() =>
                  downloadTransactionsPDF(
                    filteredOrders
                  )
                }
              >
                Download Laporan PDF
              </button>

              <button
                className="btn-light"
                disabled={
                  !filteredOrders.length
                }
                onClick={exportCSV}
              >
                Download Laporan CSV
              </button>
            </div>

            <small>
              CSV memuat status pembayaran.
              Format PDF lama diatur oleh
              reportPdf.js.
            </small>
          </section>
        )}

        {/* PHOTO GALLERY */}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>Galeri Foto Lokal</h2>

            <select
              value={folder}
              onChange={(event) =>
                setFolder(
                  event.target.value
                )
              }
            >
              <option value="Semua">
                Semua
              </option>

              {CATEGORIES.map((category) => (
                <option
                  key={category.folder}
                  value={category.folder}
                >
                  {category.label}
                </option>
              ))}
            </select>

            <p>
              {filteredPhotos.length} foto tersedia
            </p>

            <div className="lum-gallery">
              {filteredPhotos.map((photo) => (
                <article key={photo.url}>
                  <ProductImage
                    src={photo.url}
                    alt={photo.name}
                  />

                  <p>
                    {photo.folder}
                    {" / "}
                    {photo.name}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <aside className="lum-dash-right">
        <h3>Store Summary</h3>

        <p>
          Total Produk: {products.length}
        </p>

        <p>
          Foto Lokal: {PHOTOS.length}
        </p>

        <p>
          Total Pesanan: {orders.length}
        </p>

        <p>
          Stok Menipis: {lowStock.length}
        </p>
      </aside>
    </div>
  );
}

/* ==========================================
   MAIN APP
========================================== */

export default function App() {
  const [products, setProducts] = useState(
    loadProducts
  );

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
    () =>
      window.location.hash === "#admin"
        ? "admin"
        : "home"
  );

  const [authReturn, setAuthReturn] =
    useState("home");

  const [category, setCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("default");

  const [selectedId, setSelectedId] =
    useState(null);

  const [size, setSize] =
    useState("");

  const [color, setColor] =
    useState("");

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
  });

  const [checkout, setCheckout] = useState({
    ...DEFAULT_CHECKOUT,
  });

  const [message, setMessage] =
    useState("");

  const checkoutLock = useRef(false);

  const statusLocks = useRef(
    new Set()
  );

  const paymentLocks = useRef(
    new Set()
  );

  /* PENYIMPANAN DATA */

  useEffect(() => {
    save(KEY.products, products);
  }, [products]);

  useEffect(() => {
    save(KEY.orders, orders);

    statusLocks.current.clear();
    paymentLocks.current.clear();
  }, [orders]);

  useEffect(() => {
    save(KEY.cart, cart);
  }, [cart]);

  useEffect(() => {
    save(KEY.wishlist, wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (customer) {
      save(KEY.session, customer);
    } else {
      localStorage.removeItem(
        KEY.session
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

  /* FILTER PRODUK */

  const shown = useMemo(
    () =>
      products
        .filter(
          (product) =>
            (category === "All" ||
              product.collection ===
                category) &&
            normalize(
              `${product.name} ${product.collection} ${product.description}`
            ).includes(normalize(search))
        )
        .sort((a, b) => {
          if (sort === "low") {
            return (
              Number(a.price) -
              Number(b.price)
            );
          }

          if (sort === "high") {
            return (
              Number(b.price) -
              Number(a.price)
            );
          }

          if (sort === "name") {
            return a.name.localeCompare(
              b.name
            );
          }

          return 0;
        }),
    [
      products,
      category,
      search,
      sort,
    ]
  );

  const featured = products.filter(
    (product) => product.image
  );

  const hero =
    PHOTOS.find(
      (photo) =>
        photo.folder === "baju wanita"
    )?.url ||
    PHOTOS[0]?.url ||
    featured[0]?.image;

  const selected = products.find(
    (product) =>
      product.id === selectedId
  );

  /* KERANJANG */

  const validCart = cart
    .map((item) => {
      const product = products.find(
        (entry) =>
          entry.id === item.id
      );

      if (!product) return null;

      return {
        ...product,
        key:
          item.key ||
          JSON.stringify([
            item.id,
            item.size,
            item.color,
          ]),
        size: item.size,
        color: item.color,
        quantity: Math.max(
          1,
          Math.floor(
            Number(item.quantity) || 1
          )
        ),
      };
    })
    .filter(Boolean);

  const cartCount = validCart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const subtotal = validCart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

  const delivery =
    checkout.shipping === "express"
      ? 25000
      : 12000;

  const myOrders = customer
    ? orders.filter(
        (order) =>
          order.customerId ===
          customer.id
      )
    : [];

  /* NAVIGASI */

  function navigate(nextPage) {
    if (
      ["home", "shop", "cart"].includes(
        nextPage
      )
    ) {
      checkoutLock.current = false;
    }

    setPage(nextPage);

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        (nextPage === "admin"
          ? "#admin"
          : "")
    );

    window.scrollTo(0, 0);
  }

  function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setSearch("");
    navigate("shop");
  }

  function openDetail(product) {
    setSelectedId(product.id);

    setSize(
      product.sizes?.[0] || "All Size"
    );

    setColor(
      product.colors?.[0] || "Sesuai foto"
    );

    navigate("detail");
  }

  /* AUTH */

  function openAuth(nextPage = "home") {
    setAuthReturn(nextPage);
    navigate("auth");
  }

  function loggedIn(user) {
    setCustomer(user);

    setCheckout((previous) => ({
      ...previous,
      name:
        previous.name ||
        user.name,
    }));

    navigate(authReturn);

    setMessage(
      `Selamat datang, ${user.name}!`
    );
  }

  function logout() {
    setCustomer(null);
    navigate("home");
    setMessage("Berhasil logout.");
  }

  /* WISHLIST */

  function toggleWishlist(id) {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter(
            (item) => item !== id
          )
        : [...previous, id]
    );
  }

  /* TAMBAH KE KERANJANG */

  function addToCart(
    product,
    chosenSize,
    chosenColor
  ) {
    const current = products.find(
      (item) =>
        item.id === product.id
    );

    if (!current) {
      setMessage(
        "Produk tidak ditemukan."
      );
      return;
    }

    const selectedSize =
      chosenSize ||
      current.sizes?.[0] ||
      "All Size";

    const selectedColor =
      chosenColor ||
      current.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      current.id,
      selectedSize,
      selectedColor,
    ]);

    const used = cart
      .filter(
        (item) =>
          item.id === current.id
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.quantity),
        0
      );

    if (
      used >= Number(current.stock)
    ) {
      setMessage(
        "Stok tidak mencukupi."
      );
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) =>
          (item.key ||
            JSON.stringify([
              item.id,
              item.size,
              item.color,
            ])) === key
      );

      if (existing) {
        return previous.map((item) =>
          (item.key ||
            JSON.stringify([
              item.id,
              item.size,
              item.color,
            ])) === key
            ? {
                ...item,
                key,
                quantity:
                  Number(item.quantity) + 1,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          id: current.id,
          key,
          size: selectedSize,
          color: selectedColor,
          quantity: 1,
        },
      ];
    });

    setMessage(
      "Produk ditambahkan ke keranjang."
    );
  }

  /* UBAH JUMLAH KERANJANG */

  function changeQty(key, delta) {
    const item = validCart.find(
      (entry) =>
        entry.key === key
    );

    if (!item) return;

    const used = cart
      .filter(
        (entry) =>
          entry.id === item.id
      )
      .reduce(
        (sum, entry) =>
          sum + Number(entry.quantity),
        0
      );

    if (
      delta > 0 &&
      used >= Number(item.stock)
    ) {
      setMessage(
        "Stok tidak mencukupi."
      );
      return;
    }

    setCart((previous) =>
      previous
        .map((entry) =>
          (entry.key ||
            JSON.stringify([
              entry.id,
              entry.size,
              entry.color,
            ])) === key
            ? {
                ...entry,
                key,
                quantity:
                  Number(entry.quantity) +
                  delta,
              }
            : entry
        )
        .filter(
          (entry) =>
            entry.quantity > 0
        )
    );
  }

  /* ==========================================
     CHECKOUT
  ========================================== */

  function checkoutOrder(event) {
    event.preventDefault();

    if (checkoutLock.current) {
      return;
    }

    if (!customer) {
      openAuth("checkout");
      return;
    }

    if (!validCart.length) {
      setMessage("Keranjang kosong.");
      return;
    }

    if (
      !checkout.name.trim() ||
      !checkout.address.trim() ||
      !/^[0-9+()\s-]{8,20}$/.test(
        checkout.phone.trim()
      )
    ) {
      setMessage(
        "Periksa data nama, HP, dan alamat."
      );
      return;
    }

    const quantities = new Map();

    validCart.forEach((item) =>
      quantities.set(
        item.id,
        (quantities.get(item.id) || 0) +
          item.quantity
      )
    );

    for (const [id, quantity] of quantities) {
      const product = products.find(
        (item) =>
          item.id === id
      );

      if (
        !product ||
        Number(product.stock) < quantity
      ) {
        setMessage(
          "Stok tidak mencukupi."
        );
        return;
      }
    }

    const method = PAYMENT_METHODS.some(
      (item) =>
        item.value === checkout.payment
    )
      ? checkout.payment
      : "cod";

    checkoutLock.current = true;

    const now = new Date().toISOString();

    const id = `LM-${Date.now()}`;

    const order = {
      id,
      date: now,
      customer: checkout.name.trim(),
      customerId: customer.id,
      customerEmail: customer.email,
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      shipping: checkout.shipping,

      paymentMethod: method,

      paymentStatus:
        method === "cod"
          ? "Bayar di Tempat"
          : "Menunggu Pembayaran",

      paidAt: null,

      paymentHistory: [],

      items: validCart.map(
        (item) => ({
          ...item,
        })
      ),

      total: subtotal + delivery,

      status: "Pesanan Baru",

      stockRestored: false,

      history: [
        {
          id: `${id}-created`,
          from: null,
          status: "Pesanan Baru",
          at: now,
          by: "Sistem",
          note:
            `Checkout menggunakan ${paymentName(
              method
            )} (simulasi).`,
        },
      ],
    };

    setOrders((previous) => [
      order,
      ...previous,
    ]);

    setProducts((previous) =>
      previous.map((product) => ({
        ...product,
        stock:
          Number(product.stock) -
          (quantities.get(product.id) || 0),
      }))
    );

    setCart([]);

    setCheckout({
      ...DEFAULT_CHECKOUT,
    });

    navigate("success");

    setMessage(
      "Pesanan simulasi berhasil dibuat."
    );
  }

  /* ==========================================
     KONFIRMASI PEMBAYARAN ADMIN
  ========================================== */

  function confirmPayment(id) {
    const order = orders.find(
      (item) =>
        item.id === id
    );

    if (!order) {
      setMessage(
        "Pesanan tidak ditemukan."
      );
      return;
    }

    if (
      paymentLocks.current.has(id)
    ) {
      return;
    }

    if (!canConfirmPayment(order)) {
      setMessage(
        order.paymentMethod === "cod"
          ? "COD baru dapat dikonfirmasi saat pesanan Selesai."
          : "Pembayaran tidak dapat dikonfirmasi."
      );

      return;
    }

    if (
      !window.confirm(
        `Tandai pembayaran pesanan ${id} sebagai LUNAS? Ini hanya simulasi.`
      )
    ) {
      return;
    }

    paymentLocks.current.add(id);

    const now = new Date().toISOString();

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,

              paymentStatus: "Lunas",

              paidAt: now,

              paymentConfirmedBy:
                "Admin Demo",

              paymentHistory: [
                ...(Array.isArray(
                  item.paymentHistory
                )
                  ? item.paymentHistory
                  : []),

                {
                  id:
                    `${id}-paid-${Date.now()}`,
                  at: now,
                  status: "Lunas",
                  by: "Admin Demo",
                  note:
                    `Konfirmasi ${paymentName(
                      item.paymentMethod
                    )} (simulasi)`,
                },
              ],
            }
          : item
      )
    );

    setMessage(
      "Pembayaran simulasi berhasil dikonfirmasi menjadi Lunas."
    );
  }

  /* ==========================================
     UPDATE STATUS PESANAN
  ========================================== */

  function changeStatus(id, nextStatus) {
    const order = orders.find(
      (item) =>
        item.id === id
    );

    if (!order) {
      setMessage(
        "Pesanan tidak ditemukan."
      );
      return;
    }

    if (
      statusLocks.current.has(id)
    ) {
      return;
    }

    const current = statusOf(
      order.status
    );

    if (
      !validNextStatus(
        current,
        nextStatus
      )
    ) {
      setMessage(
        "Status harus berurutan; status final tidak dapat diubah."
      );
      return;
    }

    if (
      nextStatus !== "Dibatalkan" &&
      ["transfer", "qris"].includes(
        order.paymentMethod
      ) &&
      paymentStatus(order) !== "Lunas"
    ) {
      setMessage(
        "Konfirmasi pembayaran transfer/QRIS dahulu sebelum memproses pesanan."
      );
      return;
    }

    statusLocks.current.add(id);

    const now = new Date().toISOString();

    if (
      nextStatus === "Dibatalkan" &&
      !order.stockRestored
    ) {
      const quantities = new Map();

      (order.items || []).forEach(
        (item) =>
          quantities.set(
            item.id,
            (quantities.get(item.id) || 0) +
              Math.max(
                0,
                Number(item.quantity) || 0
              )
          )
      );

      setProducts((previous) =>
        previous.map((product) => ({
          ...product,
          stock:
            Number(product.stock) +
            (quantities.get(product.id) || 0),
        }))
      );
    }

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,

              status: nextStatus,

              updatedAt: now,

              stockRestored:
                Boolean(item.stockRestored) ||
                nextStatus === "Dibatalkan",

              history: [
                ...(Array.isArray(item.history)
                  ? item.history
                  : []),

                {
                  id:
                    `${id}-${Date.now()}-${nextStatus}`,
                  from: current,
                  status: nextStatus,
                  at: now,
                  by: "Admin Demo",
                  note:
                    nextStatus === "Dibatalkan"
                      ? "Pesanan dibatalkan."
                      : `Status diubah menjadi ${nextStatus}.`,
                },
              ],
            }
          : item
      )
    );

    setMessage(
      `Status diubah menjadi ${nextStatus}.`
    );
  }

  /* ==========================================
     CRUD PRODUK
  ========================================== */

  function saveProduct(event) {
    event.preventDefault();

    const category = CATEGORIES.find(
      (item) =>
        item.name === form.collection
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
      setMessage(
        "Periksa data produk."
      );
      return;
    }

    if (
      form.image &&
      !PHOTOS.some(
        (photo) =>
          photo.url === form.image &&
          photo.folder === category.folder
      )
    ) {
      setMessage(
        "Foto tidak sesuai kategori."
      );
      return;
    }

    if (
      products.some(
        (product) =>
          product.id !== form.id &&
          form.image &&
          product.image === form.image
      )
    ) {
      setMessage(
        "Foto utama sudah dipakai produk lain."
      );
      return;
    }

    const sizes = splitText(form.sizes);
    const colors = splitText(form.colors);

    if (
      !sizes.length ||
      !colors.length
    ) {
      setMessage(
        "Ukuran dan warna wajib diisi."
      );
      return;
    }

    const gallery = [
      ...new Set(
        splitText(form.gallery).filter(
          (url) =>
            url !== form.image &&
            PHOTOS.some(
              (photo) =>
                photo.url === url &&
                photo.folder === category.folder
            )
        )
      ),
    ];

    const product = {
      id:
        form.id ??
        `custom:${Date.now()}`,
      name: form.name.trim(),
      collection: category.name,
      image: form.image,
      gallery,
      price,
      stock,
      description:
        form.description.trim(),
      sizes,
      colors,
    };

    if (form.id !== null) {
      const previousProduct = products.find(
        (item) =>
          item.id === form.id
      );

      if (
        previousProduct?.image &&
        previousProduct.image !==
          product.image
      ) {
        const deleted = new Set(
          readArray(KEY.deleted).map(String)
        );

        deleted.add(
          `local:${previousProduct.image}`
        );

        save(
          KEY.deleted,
          [...deleted]
        );
      }

      setProducts((previous) =>
        previous.map((item) =>
          item.id === form.id
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

    setForm({
      ...DEFAULT_FORM,
    });

    setMessage(
      "Produk berhasil disimpan."
    );
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      name: product.name,
      collection: product.collection,
      image: product.image || "",

      gallery:
        Array.isArray(product.gallery)
          ? product.gallery.join(",")
          : "",

      price: String(product.price),
      stock: String(product.stock),
      description:
        product.description || "",

      sizes:
        (product.sizes || []).join(","),

      colors:
        (product.colors || []).join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    if (
      orders.some(
        (order) =>
          ![
            "Selesai",
            "Dibatalkan",
          ].includes(statusOf(order.status)) &&
          order.items?.some(
            (item) =>
              item.id === id
          )
      )
    ) {
      setMessage(
        "Selesaikan pesanan aktif dahulu."
      );
      return;
    }

    if (
      !window.confirm(
        "Yakin ingin menghapus produk?"
      )
    ) {
      return;
    }

    const product = products.find(
      (item) =>
        item.id === id
    );

    const deleted = new Set(
      readArray(KEY.deleted).map(String)
    );

    deleted.add(String(id));

    if (product?.image) {
      deleted.add(
        `local:${product.image}`
      );
    }

    save(
      KEY.deleted,
      [...deleted]
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

    setForm({
      ...DEFAULT_FORM,
    });

    setMessage(
      "Produk berhasil dihapus."
    );
  }

  const gridProps = {
    wishlist,
    onDetail: openDetail,
    onWishlist: toggleWishlist,
    onCart: addToCart,
  };

  /* ==========================================
     TAMPILAN WEBSITE
  ========================================== */

  return (
    <div
      className={`lumina ${
        page === "admin"
          ? "admin-mode"
          : ""
      }`}
    >
      {/* CSS FITUR TAMBAHAN */}

      <style>{`
        .lumina .lum-dash-table-wrap {
          overflow-x: auto;
        }

        .lumina .lum-dash-table {
          min-width: 1050px;
        }

        .lumina .lum-dash-table td,
        .lumina .lum-dash-table th {
          padding: 12px;
          vertical-align: top;
        }

        .lumina .lum-hint {
          display: block;
          color: #826b56;
          margin-top: 8px;
        }

        .lumina .lum-payment-detail {
          margin: 18px 0;
          padding: 18px;
          border: 1px solid #e9dcd1;
          border-radius: 14px;
          background: #fcf8f5;
        }

        .lumina .lum-payment-detail button {
          margin: 8px 0;
        }

        .lumina .lum-payment-box {
          padding: 18px;
          background: #fbf7f3;
          border: 1px solid #e7d9ca;
          border-radius: 13px;
          margin-top: 20px;
        }

        .lumina .lum-payment-box select {
          width: 100%;
          margin: 10px 0;
        }

        .lumina .lum-between,
        .lumina .lum-track-head,
        .lumina .lum-track-meta {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }

        .lumina .lum-track-card {
          margin: 16px 0;
        }

        .lumina .lum-track-head p {
          margin: 5px 0;
        }

        .lumina .lum-track-meta {
          margin: 14px 0;
        }

        .lumina .lum-payment-badge {
          background: #f3e9e0;
          padding: 8px 14px;
          border-radius: 24px;
          font-size: 12px;
        }

        .lumina .lum-track-steps {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin: 23px 0;
        }

        .lumina .lum-track-steps > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          color: #a2978c;
        }

        .lumina .lum-track-steps > div > span {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eee6df;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lumina .lum-track-steps > div.complete {
          color: #467c52;
          font-weight: 700;
        }

        .lumina .lum-track-steps > div.complete > span {
          background: #e0f2e5;
        }

        .lumina .lum-paid-note {
          color: #397c46;
        }

        .lumina .lum-cancel-note {
          color: #b33636;
        }

        .lumina .lum-dash-product-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin: 12px 0;
        }

        .lumina .lum-admin-thumb {
          width: 65px;
          height: 70px;
          flex: 0 0 65px;
        }

        .lumina .lum-admin-thumb img,
        .lumina .lum-admin-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-admin-preview {
          height: 190px;
        }

        .lumina .lum-admin-product-info {
          flex: 1;
          min-width: 0;
        }

        .lumina .lum-extra-gallery {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 15px 0;
        }

        .lumina .lum-report-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .lumina .lum-analytics {
          margin: 20px 0;
        }

        .lumina .lum-analytics-cards {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .lumina .lum-analytics-cards h2 {
          overflow-wrap: anywhere;
        }

        .lumina .lum-analytics-panels {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }

        .lumina .lum-mini-chart {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 8px;
          align-items: end;
          min-height: 180px;
        }

        .lumina .lum-mini-chart > div {
          text-align: center;
        }

        .lumina .lum-chart-track {
          height: 155px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          background: #f7f2ed;
          border-radius: 8px;
          overflow: hidden;
        }

        .lumina .lum-chart-track > div {
          width: 65%;
          background: linear-gradient(
            #d6b299,
            #84644d
          );
          border-radius: 6px 6px 0 0;
        }

        .lumina .lum-new-shop {
          max-width: 1250px;
          margin: auto;
          padding: 45px 20px;
        }

        .lumina .lum-shop-heading {
          text-align: center;
        }

        .lumina .lum-shop-categories {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
          margin: 25px 0;
        }

        .lumina .lum-shop-pill {
          border: 1px solid #ddd1c5;
          border-radius: 30px;
          background: white;
          padding: 9px 16px;
          cursor: pointer;
        }

        .lumina .lum-shop-pill.active {
          background: #302720;
          color: white;
        }

        .lumina .lum-shop-toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 20px 0;
        }

        .lumina .lum-shop-search {
          display: flex;
          flex: 1;
          min-width: 220px;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border: 1px solid #e4d9cf;
          border-radius: 30px;
        }

        .lumina .lum-shop-search input {
          border: 0;
          flex: 1;
          outline: 0;
        }

        .lumina .lum-shop-sort {
          padding: 10px 16px;
          border-radius: 30px;
        }

        .lumina .lum-shop-grid .product-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .lumina .lum-shop-grid .product-card {
          background: white;
          border: 1px solid #eee4dc;
          border-radius: 14px;
          overflow: hidden;
        }

        .lumina .lum-shop-grid .product-picture {
          aspect-ratio: 4 / 5;
          position: relative;
          background: #faf8f6;
        }

        .lumina .lum-shop-grid .image-button {
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
        }

        .lumina .lum-shop-grid .product-picture img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: none;
        }

        .lumina .lum-photo-placeholder {
          min-height: 100px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f2ebe6;
        }

        .lumina .lum-home-categories {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
        }

        .lumina .lum-detail-grid {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 35px;
        }

        .lumina .lum-detail-main {
          height: 500px;
          background: #faf7f4;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lumina .lum-detail-main img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lumina .lum-detail-thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .lumina .lum-detail-thumbs button {
          width: 90px;
          height: 95px;
          padding: 5px;
          border: 1px solid #ddd1c4;
          background: white;
        }

        .lumina .lum-detail-thumbs button.active {
          border: 2px solid #85644a;
        }

        .lumina .lum-detail-thumbs img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-detail-data label {
          display: block;
          margin: 18px 0 9px;
        }

        .lumina .lum-detail-data .wide {
          margin-top: 12px;
        }

        .lumina .lum-review-box {
          margin-top: 40px;
        }

        .lumina .lum-review-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .lumina .lum-review-grid .panel {
          margin: 12px 0;
        }

        .lumina .lum-review-grid textarea {
          width: 100%;
          padding: 12px;
        }

        .lumina .lum-stars {
          color: #b67d32;
        }

        .lumina .lum-rating-buttons button {
          background: transparent;
          border: 0;
          color: #bbb;
          font-size: 27px;
          cursor: pointer;
        }

        .lumina .lum-rating-buttons button.active {
          color: #db9f3d;
        }

        .lumina .lum-gallery {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(150px, 1fr));
          gap: 14px;
        }

        .lumina .lum-gallery img {
          width: 100%;
          height: 180px;
          object-fit: contain;
        }

        .lumina .lum-cart-photo {
          width: 100px;
          height: 115px;
          flex: 0 0 100px;
        }

        .lumina .lum-cart-photo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-category-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .lumina .lum-category-stats button {
          padding: 14px;
        }

        @media (max-width: 850px) {
          .lumina .lum-analytics-cards {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .lumina .lum-analytics-panels,
          .lumina .lum-detail-grid,
          .lumina .lum-review-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .lumina .lum-shop-grid .product-grid {
            gap: 10px;
          }

          .lumina .lum-analytics-cards {
            grid-template-columns: 1fr;
          }

          .lumina .lum-track-steps {
            gap: 4px;
          }

          .lumina .lum-track-steps > div small {
            font-size: 10px;
          }
        }
      `}</style>

      {/* NAVBAR */}

      {page !== "admin" && (
        <>
          <div className="announcement">
            ✦ LUMINA STORE — PREMIUM FASHION
            & LIFESTYLE
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
                  chooseCategory("All")
                }
              >
                Shop
              </button>

              <button
                onClick={() =>
                  chooseCategory("Pria")
                }
              >
                Men
              </button>

              <button
                onClick={() =>
                  chooseCategory("Wanita")
                }
              >
                Women
              </button>

              <button
                onClick={() =>
                  chooseCategory("Batik Wanita")
                }
              >
                Batik
              </button>

              <button
                onClick={() =>
                  chooseCategory("Tas Wanita")
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

                  <button onClick={logout}>
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

      {/* HOMEPAGE */}

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
                Temukan pakaian, batik,
                sepatu, tas, dan aksesori
                untuk gaya terbaikmu.
              </p>

              <button
                className="btn-dark"
                onClick={() =>
                  chooseCategory("All")
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
                src={hero}
                alt="LUMINA Fashion"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧{" "}
              <strong>Premium Fashion</strong>
              <span>Modern & Elegant</span>
            </div>

            <div>
              ♡{" "}
              <strong>
                {PHOTOS.length} Foto Koleksi
              </strong>
              <span>Katalog Foto Lokal</span>
            </div>

            <div>
              ✦{" "}
              <strong>Seven Collections</strong>
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
              {CATEGORIES.map((category) => {
                const cover = products.find(
                  (product) =>
                    product.collection ===
                      category.name &&
                    product.image
                );

                return (
                  <button
                    key={category.name}
                    onClick={() =>
                      chooseCategory(
                        category.name
                      )
                    }
                    style={{
                      position: "relative",
                      height: 280,
                      border: 0,
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#eee1d6",
                      cursor: "pointer",
                    }}
                  >
                    <ProductImage
                      src={cover?.image}
                      alt={category.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />

                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "end",
                        padding: 18,
                        color: "white",
                        fontWeight: 700,
                        background:
                          "linear-gradient(transparent,rgba(0,0,0,.65))",
                      }}
                    >
                      {category.label}
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
                onClick={() =>
                  chooseCategory("All")
                }
              >
                View All Products →
              </button>
            </div>
          </section>
        </>
      )}

      {/* SHOP */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <small>
              DISCOVER YOUR STYLE
            </small>

            <h1>Shop Our Collection</h1>

            <p>
              Temukan koleksi LUMINA STORE.
            </p>
          </div>

          <div className="lum-shop-categories">
            {[
              {
                name: "All",
                label: "Semua",
              },
              ...CATEGORIES.map((category) => ({
                name: category.name,
                label: category.label,
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
                placeholder="Cari produk..."
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="lum-shop-sort"
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
                Nama A–Z
              </option>
            </select>
          </div>

          <p>{shown.length} produk ditemukan</p>

          <div className="lum-shop-grid">
            <ProductGrid
              products={shown}
              {...gridProps}
            />
          </div>
        </main>
      )}

      {/* DETAIL PRODUK */}

      {page === "detail" && selected && (
        <PremiumDetail
          key={selected.id}
          product={selected}
          customer={customer}
          size={size}
          color={color}
          setSize={setSize}
          setColor={setColor}
          onCart={addToCart}
          onWishlist={toggleWishlist}
          isWishlisted={wishlist.includes(
            selected.id
          )}
          onBack={() =>
            navigate("shop")
          }
        />
      )}

      {/* WISHLIST */}

      {page === "wishlist" && (
        <main className="container section">
          <h1 className="section-title">
            My Wishlist ♡
          </h1>

          <ProductGrid
            products={products.filter(
              (product) =>
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
              {!validCart.length && (
                <p>Keranjang masih kosong.</p>
              )}

              {validCart.map((item) => (
                <div
                  className="cart-row"
                  key={item.key}
                >
                  <div className="lum-cart-photo">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="grow">
                    <h3>{item.name}</h3>

                    <p>
                      {item.size}
                      {" / "}
                      {item.color}
                    </p>

                    <strong>
                      {money(item.price)}
                    </strong>

                    <div className="quantity">
                      <button
                        onClick={() =>
                          changeQty(
                            item.key,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          changeQty(
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
                                (entry.key ||
                                  JSON.stringify([
                                    entry.id,
                                    entry.size,
                                    entry.color,
                                  ])) !== item.key
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

              <p>Jumlah: {cartCount}</p>

              <p>
                Subtotal: {money(subtotal)}
              </p>

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
          onSuccess={loggedIn}
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
              onSubmit={checkoutOrder}
            >
              <h2>Informasi Pembeli</h2>

              <label>Nama Lengkap</label>

              <input
                required
                value={checkout.name}
                onChange={(event) =>
                  setCheckout((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
              />

              <label>Nomor Telepon</label>

              <input
                required
                value={checkout.phone}
                onChange={(event) =>
                  setCheckout((previous) => ({
                    ...previous,
                    phone: event.target.value,
                  }))
                }
              />

              <label>Alamat Pengiriman</label>

              <textarea
                rows={4}
                required
                value={checkout.address}
                onChange={(event) =>
                  setCheckout((previous) => ({
                    ...previous,
                    address:
                      event.target.value,
                  }))
                }
              />

              <label>Pengiriman</label>

              <select
                value={checkout.shipping}
                onChange={(event) =>
                  setCheckout((previous) => ({
                    ...previous,
                    shipping:
                      event.target.value,
                  }))
                }
              >
                <option value="regular">
                  Regular Rp12.000
                </option>

                <option value="express">
                  Express Rp25.000
                </option>
              </select>

              <div className="lum-payment-box">
                <h3>
                  Metode Pembayaran (Simulasi)
                </h3>

                <select
                  value={checkout.payment}
                  onChange={(event) =>
                    setCheckout((previous) => ({
                      ...previous,
                      payment:
                        event.target.value,
                    }))
                  }
                >
                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        value={method.value}
                        key={method.value}
                      >
                        {method.label}
                      </option>
                    )
                  )}
                </select>

                <p className="muted">
                  {checkout.payment === "cod"
                    ? "COD: pembayaran saat paket diterima."
                    : "Transfer/QRIS: setelah checkout, Admin akan melakukan konfirmasi simulasi. Tidak ada transaksi uang sungguhan."}
                </p>
              </div>

              <button
                className="btn-dark wide"
                disabled={!validCart.length}
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <div className="panel summary">
              <h2>Ringkasan Pesanan</h2>

              <p>
                Subtotal: {money(subtotal)}
              </p>

              <p>
                Ongkir: {money(delivery)}
              </p>

              <p>
                Pembayaran:{" "}
                {paymentName(
                  checkout.payment
                )}
              </p>

              <h3>
                Total:{" "}
                {money(
                  subtotal + delivery
                )}
              </h3>
            </div>
          </div>
        </main>
      )}

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>
            Login sebelum checkout
          </h2>

          <button
            className="btn-dark"
            onClick={() =>
              openAuth("checkout")
            }
          >
            Login
          </button>
        </main>
      )}

      {/* DASHBOARD PELANGGAN + TRACKING */}

      {page === "account" && customer && (
        <>
          <CustomerTracking
            orders={myOrders}
          />

          <CustomerDashboard
            customer={customer}
            orders={myOrders}
            onBack={() =>
              chooseCategory("All")
            }
            onLogout={logout}
          />
        </>
      )}

      {/* PESANAN BERHASIL */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <h1>✓ Pesanan Berhasil!</h1>

            {orders[0] && (
              <>
                <p>
                  No. Pesanan:{" "}
                  {orders[0].id}
                </p>

                <p>
                  Metode:{" "}
                  {paymentName(
                    orders[0].paymentMethod
                  )}
                </p>

                <p>
                  Status pembayaran:{" "}
                  {paymentStatus(
                    orders[0]
                  )}
                </p>
              </>
            )}

            <p>
              Pesanan simulasi dapat dilacak
              di dashboard pelanggan.
            </p>

            <button
              className="btn-dark"
              onClick={() =>
                navigate("account")
              }
            >
              Lihat Pesanan Saya →
            </button>

            <button
              className="btn-light"
              onClick={() =>
                chooseCategory("All")
              }
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
          onStatus={changeStatus}
          onPayment={confirmPayment}
          onBack={() =>
            navigate("home")
          }
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

          <p>
            Men • Women • Batik • Shoes • Bags
          </p>

          <p>
            © {new Date().getFullYear()}
            {" "}LUMINA STORE
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
