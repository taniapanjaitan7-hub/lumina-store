
import { useEffect, useMemo, useRef, useState } from "react";
import AuthPage from "./Auth.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import OrderStatusFlow from "./components/OrderStatusFlow.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import { downloadTransactionsPDF } from "./utils/reportPdf.js";
import productImages from "./product-images.json";
import "./App.css";

/* ==================================================
   LUMINA STORE - APP.JSX
   COMPLETE E-COMMERCE APPLICATION

   FITUR:
   - Homepage dan Katalog Produk
   - Seluruh Kategori Gambar Lokal
   - Detail Produk Premium
   - Galeri Beberapa Foto
   - Rating dan Ulasan Pelanggan
   - Wishlist dan Shopping Cart
   - Login / Register
   - Checkout Simulasi
   - COD, Transfer Bank, QRIS Simulasi
   - Dashboard Pelanggan
   - Dashboard Admin Analytics
   - CRUD Produk
   - Inventory Monitoring
   - Tracking dan Riwayat Pesanan
   - Sales Report PDF / CSV
================================================== */

/* ==================================================
   1. KATEGORI PRODUK
================================================== */

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

/* ==================================================
   2. HELPER
================================================== */

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
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
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
      "Gagal menyimpan data:",
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

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formattedDate(value) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitText(value) {
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

function getPaymentName(method) {
  return PAYMENT_METHODS.find(
    (item) => item.value === method
  )?.label || "-";
}

function getPaymentStatus(order) {
  if (order.paymentStatus) {
    return order.paymentStatus;
  }

  if (order.paymentMethod === "cod") {
    return "Bayar di Tempat";
  }

  if (
    order.paymentMethod === "transfer" ||
    order.paymentMethod === "qris"
  ) {
    return "Menunggu Pembayaran";
  }

  return "-";
}

function allowedStatusChange(current, next) {
  if (!STATUSES.includes(next)) {
    return false;
  }

  if (
    current === "Selesai" ||
    current === "Dibatalkan"
  ) {
    return false;
  }

  if (next === "Dibatalkan") {
    return true;
  }

  return (
    STATUSES.indexOf(next) ===
    STATUSES.indexOf(current) + 1
  );
}

/* ==================================================
   3. URL GAMBAR PRODUK
================================================== */

function normalizeFolderName(value) {
  const folder = normalize(value);

  const aliases = {
    pria: "baju pria",
    wanita: "baju wanita",
    aksesoris: "aksesoris wanita",
  };

  return aliases[folder] || folder;
}

function normalizeImagePath(value) {
  if (!value) return "";

  const raw = String(value)
    .trim()
    .replace(/\\/g, "/");

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  let result = raw
    .replace(/^(?:\.\/)?public\//i, "")
    .replace(/^\/+/, "");

  const parts = result.split("/").filter(Boolean);

  if (
    normalize(parts[0]) === "images" &&
    parts[1]
  ) {
    let decoded = parts[1];

    try {
      decoded = decodeURIComponent(parts[1]);
    } catch {
      // Gunakan nama asli.
    }

    parts[1] = normalizeFolderName(decoded);
  } else if (
    CATEGORIES.some(
      (category) =>
        category.folder ===
        normalizeFolderName(parts[0])
    )
  ) {
    parts[0] = normalizeFolderName(parts[0]);
    parts.unshift("images");
  }

  return "/" + parts.join("/");
}

function photoUrl(src) {
  if (!src) return "";

  const raw = normalizeImagePath(src);

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const base = import.meta.env.BASE_URL.replace(
    /\/$/,
    ""
  );

  const encoded = raw
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
    .join("/");

  return `${base}/${encoded}`;
}

/* ==================================================
   4. MEMBACA FOTO DARI product-images.json
================================================== */

const PHOTOS = [
  ...new Map(
    (Array.isArray(productImages)
      ? productImages
      : []
    )
      .filter((photo) => photo?.url)
      .map((photo) => {
        const url = normalizeImagePath(
          photo.url
        );

        const segments = url
          .replace(/^\/+/, "")
          .split("/");

        const index = segments.findIndex(
          (part) => normalize(part) === "images"
        );

        const pathFolder =
          index >= 0
            ? segments[index + 1]
            : "";

        let decodedFolder = pathFolder;

        try {
          decodedFolder = decodeURIComponent(
            pathFolder
          );
        } catch {
          // Gunakan nama asli.
        }

        const folder = normalizeFolderName(
          photo.folder || decodedFolder
        );

        const imageName =
          photo.name ||
          segments[segments.length - 1] ||
          "Produk";

        return {
          ...photo,
          folder,
          url,
          name: imageName,
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
      price: category.price,
      stock: 20,
      image: photo.url,
      gallery: [],
      sizes: [...category.sizes],
      colors: ["Sesuai foto"],
      description:
        `Koleksi ${category.label} dari LUMINA STORE.`,
    };
  }
);

/* ==================================================
   5. MEMUAT DATA PRODUK
================================================== */

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
      const image = normalizeImagePath(
        product.image
      );

      const category =
        CATEGORIES.find(
          (item) =>
            item.name === product.collection
        ) ||
        CATEGORIES.find(
          (item) =>
            PHOTOS.some(
              (photo) =>
                photo.url === image &&
                photo.folder === item.folder
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
          : [...category.sizes],
        colors: Array.isArray(product.colors)
          ? product.colors
          : ["Sesuai foto"],
        gallery: Array.isArray(product.gallery)
          ? product.gallery.map(
              normalizeImagePath
            )
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
        !deleted.has(
          `local:${oldImage}`
        )
      );
    }
  );

  return [
    ...savedProducts,
    ...additional,
  ];
}

/* ==================================================
   6. KOMPONEN GAMBAR
================================================== */

function ProductImage({
  src,
  alt,
  style,
}) {
  const [failed, setFailed] = useState("");

  const url = photoUrl(src);

  if (!src || failed === url) {
    return (
      <div
        className="lum-photo-placeholder"
        style={style}
      >
        <span>▧</span>
        <small>Foto belum tersedia</small>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt || "Produk Lumina"}
      loading="lazy"
      style={style}
      onError={() => setFailed(url)}
    />
  );
}

/* ==================================================
   7. KARTU PRODUK
================================================== */

function ProductCard({
  product,
  wishlist,
  onDetail,
  onWishlist,
  onCart,
}) {
  const available =
    Number(product.stock) > 0;

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
        <small>
          {product.collection}
        </small>

        <h3>{product.name}</h3>

        <p className="price">
          {rupiah(product.price)}
        </p>

        <p className="muted">
          Stok tersedia: {product.stock}
        </p>

        <div className="product-actions">
          <button
            type="button"
            className="btn-light"
            onClick={() => onDetail(product)}
          >
            Lihat Detail
          </button>

          <button
            type="button"
            className="btn-dark"
            disabled={!available}
            onClick={() => onCart(product)}
          >
            {available
              ? "+ Keranjang"
              : "Habis"}
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
  onWishlist,
  onCart,
}) {
  if (!products.length) {
    return (
      <div className="lum-empty">
        <h3>
          Produk tidak ditemukan
        </h3>
        <p>
          Coba kategori atau pencarian lainnya.
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlist={wishlist}
          onDetail={onDetail}
          onWishlist={onWishlist}
          onCart={onCart}
        />
      ))}
    </div>
  );
}

/* ==================================================
   8. DETAIL PRODUK PREMIUM
================================================== */

function PremiumProductDetail({
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
}) {
  const photos = useMemo(() => {
    return [
      ...new Set([
        product.image,
        ...(Array.isArray(product.gallery)
          ? product.gallery
          : []),
      ].filter(Boolean)),
    ];
  }, [
    product.image,
    product.gallery,
  ]);

  const [activePhoto, setActivePhoto] =
    useState(product.image || "");

  const [failedPhoto, setFailedPhoto] =
    useState("");

  const [reviewsByProduct, setReviewsByProduct] =
    useState(
      () => read(KEY.reviews, {})
    );

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const productId = String(product.id);

  const reviews = Array.isArray(
    reviewsByProduct?.[productId]
  )
    ? reviewsByProduct[productId]
    : [];

  const customerId = customer
    ? String(
        customer.id ??
        customer.email ??
        ""
      )
    : "";

  const myReview = customerId
    ? reviews.find(
        (review) =>
          String(review.userId) === customerId
      )
    : null;

  const average = reviews.length
    ? reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      ) / reviews.length
    : 0;

  useEffect(() => {
    setActivePhoto(
      product.image || ""
    );
    setFailedPhoto("");
  }, [
    product.id,
    product.image,
  ]);

  useEffect(() => {
    setRating(
      myReview?.rating || 5
    );
    setComment(
      myReview?.comment || ""
    );
    setNotice("");
  }, [
    productId,
    customerId,
  ]);

  function saveReview(event) {
    event.preventDefault();

    if (!customerId) {
      setNotice(
        "Login terlebih dahulu untuk memberikan ulasan."
      );
      return;
    }

    if (comment.trim().length < 5) {
      setNotice(
        "Ulasan minimal 5 karakter."
      );
      return;
    }

    const entry = {
      id:
        myReview?.id ||
        `review-${Date.now()}`,
      userId: customerId,
      name:
        customer.name ||
        "Pelanggan",
      rating: Number(rating),
      comment:
        comment.trim().slice(0, 500),
      at: new Date().toISOString(),
    };

    const updated = myReview
      ? reviews.map((review) =>
          review.id === myReview.id
            ? entry
            : review
        )
      : [entry, ...reviews];

    const next = {
      ...reviewsByProduct,
      [productId]: updated,
    };

    if (
      save(KEY.reviews, next)
    ) {
      setReviewsByProduct(next);
      setNotice(
        "Ulasan berhasil disimpan."
      );
    } else {
      setNotice(
        "Gagal menyimpan ulasan."
      );
    }
  }

  const selectedPhoto =
    photos.includes(activePhoto)
      ? activePhoto
      : photos[0];

  return (
    <main className="lum-premium-detail">
      <button
        className="back"
        type="button"
        onClick={onBack}
      >
        ← Kembali ke Shop
      </button>

      <div className="lum-premium-layout">
        <div className="lum-premium-gallery">
          <div className="lum-premium-main-image">
            {selectedPhoto &&
            failedPhoto !== selectedPhoto ? (
              <img
                src={photoUrl(selectedPhoto)}
                alt={product.name}
                onError={() =>
                  setFailedPhoto(selectedPhoto)
                }
              />
            ) : (
              <div className="lum-photo-placeholder">
                Foto belum tersedia
              </div>
            )}
          </div>

          <div className="lum-premium-thumbnails">
            {photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                className={
                  selectedPhoto === photo
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setActivePhoto(photo);
                  setFailedPhoto("");
                }}
              >
                <img
                  src={photoUrl(photo)}
                  alt={`Foto ${index + 1}`}
                />
              </button>
            ))}
          </div>

          <small className="muted">
            {photos.length} foto produk tersedia
          </small>
        </div>

        <div className="lum-premium-info">
          <p className="eyebrow">
            {product.collection}
          </p>

          <h1>{product.name}</h1>

          <p className="lum-premium-rating">
            {reviews.length
              ? `★ ${average.toFixed(1)} / 5 · ${reviews.length} ulasan`
              : "☆ Belum ada ulasan"}
          </p>

          <h2 className="price">
            {rupiah(product.price)}
          </h2>

          <p className="muted">
            {product.description ||
              "Koleksi pilihan LUMINA STORE."}
          </p>

          <p>
            Stok:{" "}
            <strong>
              {product.stock}
            </strong>
          </p>

          <label>
            Pilih Ukuran
          </label>

          <div className="option-row">
            {(product.sizes || ["All Size"]).map(
              (size) => (
                <button
                  key={size}
                  type="button"
                  className={
                    selectedSize === size
                      ? "chosen"
                      : ""
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

          <label>
            Pilih Warna
          </label>

          <div className="option-row">
            {(product.colors || [
              "Sesuai foto",
            ]).map((color) => (
              <button
                key={color}
                type="button"
                className={
                  selectedColor === color
                    ? "chosen"
                    : ""
                }
                onClick={() =>
                  onColorChange(color)
                }
              >
                {color}
              </button>
            ))}
          </div>

          <button
            className="btn-dark wide"
            type="button"
            disabled={
              Number(product.stock) <= 0
            }
            onClick={() =>
              onAddToCart(
                product,
                selectedSize,
                selectedColor
              )
            }
          >
            + Tambahkan ke Keranjang
          </button>

          <button
            className="btn-light wide"
            type="button"
            onClick={() =>
              onWishlist(product.id)
            }
          >
            {isWishlisted
              ? "♥ Hapus Wishlist"
              : "♡ Tambahkan Wishlist"}
          </button>
        </div>
      </div>

      <section className="lum-premium-reviews">
        <h2>
          Ulasan Pelanggan
        </h2>

        <div className="lum-premium-review-grid">
          <div>
            {reviews.length ? (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="lum-premium-review"
                >
                  <strong>
                    {review.name}
                  </strong>

                  <p className="lum-premium-rating">
                    {"★".repeat(
                      Math.max(
                        0,
                        Math.min(
                          5,
                          Number(review.rating) || 0
                        )
                      )
                    )}
                  </p>

                  <p>
                    {review.comment}
                  </p>

                  <small className="muted">
                    {formattedDate(review.at)}
                  </small>
                </article>
              ))
            ) : (
              <p className="muted">
                Belum ada ulasan untuk produk ini.
              </p>
            )}
          </div>

          <form
            className="lum-premium-review-form"
            onSubmit={saveReview}
          >
            <h3>
              {myReview
                ? "Edit Ulasan Saya"
                : "Berikan Ulasan"}
            </h3>

            <p className="muted">
              Rating dan review demo
              disimpan di browser.
            </p>

            <div className="lum-premium-stars">
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
              rows={5}
              maxLength={500}
              value={comment}
              placeholder="Tulis pengalaman dengan produk ini..."
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
            />

            <button
              type="submit"
              className="btn-dark"
            >
              Simpan Ulasan
            </button>

            {!customer && (
              <p className="muted">
                Login untuk memberikan ulasan.
              </p>
            )}

            {notice && (
              <p role="status">
                {notice}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

/* ==================================================
   9. ADMIN ANALYTICS
================================================== */

function AdminAnalytics({
  orders = [],
  products = [],
}) {
  const stats = useMemo(() => {
    const completed = orders.filter(
      (order) =>
        getStatus(order.status) === "Selesai"
    );

    const revenue = completed.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    const units = completed.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (total, item) =>
            total + Number(item.quantity || 0),
          0
        ),
      0
    );

    const today = new Date();

    const months = Array.from(
      { length: 6 },
      (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth() - 5 + index,
          1
        );

        return {
          key:
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`,
          label: date.toLocaleDateString(
            "id-ID",
            {
              month: "short",
              year: "2-digit",
            }
          ),
          revenue: 0,
          count: 0,
        };
      }
    );

    const monthMap = new Map(
      months.map((month) => [
        month.key,
        month,
      ])
    );

    completed.forEach((order) => {
      const history = Array.isArray(
        order.history
      )
        ? order.history
        : [];

      const finishedEvent = [...history]
        .reverse()
        .find(
          (item) =>
            item.status === "Selesai"
        );

      const date = new Date(
        finishedEvent?.at ||
        order.updatedAt ||
        order.date ||
        ""
      );

      if (
        Number.isNaN(date.getTime())
      ) {
        return;
      }

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      const month = monthMap.get(key);

      if (month) {
        month.revenue += Number(
          order.total || 0
        );
        month.count += 1;
      }
    });

    const soldMap = new Map();

    completed.forEach((order) => {
      (order.items || []).forEach(
        (item) => {
          const key = String(
            item.id ??
            item.name ??
            "Produk"
          );

          const current = soldMap.get(key) || {
            name:
              item.name ||
              "Produk",
            quantity: 0,
          };

          current.quantity += Number(
            item.quantity || 0
          );

          soldMap.set(
            key,
            current
          );
        }
      );
    });

    const topProducts = [
      ...soldMap.values(),
    ]
      .sort(
        (a, b) =>
          b.quantity - a.quantity
      )
      .slice(0, 5);

    const statuses = STATUSES.map(
      (status) => ({
        status,
        count: orders.filter(
          (order) =>
            getStatus(order.status) ===
            status
        ).length,
      })
    );

    const lowStock = products.filter(
      (product) =>
        Number(product.stock) <= 5
    ).length;

    return {
      revenue,
      units,
      months,
      statuses,
      topProducts,
      lowStock,
      completedCount: completed.length,
    };
  }, [
    orders,
    products,
  ]);

  const maxRevenue = Math.max(
    1,
    ...stats.months.map(
      (month) => month.revenue
    )
  );

  const maxStatus = Math.max(
    1,
    ...stats.statuses.map(
      (item) => item.count
    )
  );

  const maxQuantity = Math.max(
    1,
    ...stats.topProducts.map(
      (item) => item.quantity
    )
  );

  return (
    <section className="lum-advanced-analytics">
      <div className="lum-analytics-heading">
        <h2>
          Advanced Sales Analytics
        </h2>

        <p>
          Data dari transaksi LUMINA STORE
          yang tersimpan di browser.
        </p>
      </div>

      <div className="lum-analytics-metrics">
        <article>
          <small>
            Total Pendapatan Selesai
          </small>

          <strong>
            {rupiah(stats.revenue)}
          </strong>
        </article>

        <article>
          <small>
            Pesanan Selesai
          </small>

          <strong>
            {stats.completedCount}
          </strong>
        </article>

        <article>
          <small>
            Unit Terjual
          </small>

          <strong>
            {stats.units}
          </strong>
        </article>

        <article>
          <small>
            Produk Stok Menipis
          </small>

          <strong>
            {stats.lowStock}
          </strong>
        </article>
      </div>

      <div className="lum-analytics-grid">
        <article className="lum-analytics-panel">
          <h3>
            Grafik Pendapatan 6 Bulan
          </h3>

          <p className="muted">
            Pendapatan dari pesanan selesai.
          </p>

          <div className="lum-revenue-chart">
            {stats.months.map(
              (month) => (
                <div
                  key={month.key}
                  className="lum-revenue-month"
                  title={
                    `${month.label}: ${rupiah(
                      month.revenue
                    )}`
                  }
                >
                  <div className="lum-revenue-track">
                    <div
                      className="lum-revenue-bar"
                      style={{
                        height: `${
                          month.revenue
                            ? Math.max(
                                3,
                                month.revenue /
                                  maxRevenue *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <small>
                    {month.label}
                  </small>

                  <small>
                    {month.count} order
                  </small>
                </div>
              )
            )}
          </div>
        </article>

        <article className="lum-analytics-panel">
          <h3>
            Status Pesanan
          </h3>

          {stats.statuses.map(
            (item) => (
              <div
                key={item.status}
                className="lum-analytics-status-row"
              >
                <span>
                  {item.status}
                </span>

                <div className="lum-analytics-track">
                  <div
                    className="lum-analytics-fill"
                    style={{
                      width: `${
                        item.count /
                        maxStatus *
                        100
                      }%`,
                    }}
                  />
                </div>

                <strong>
                  {item.count}
                </strong>
              </div>
            )
          )}
        </article>
      </div>

      <article className="lum-analytics-panel">
        <h3>
          5 Produk Terlaris
        </h3>

        {!stats.topProducts.length ? (
          <p className="muted">
            Belum ada pesanan selesai.
          </p>
        ) : (
          stats.topProducts.map(
            (product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="lum-top-product"
              >
                <div className="between">
                  <span>
                    {index + 1}.{" "}
                    {product.name}
                  </span>

                  <strong>
                    {product.quantity} terjual
                  </strong>
                </div>

                <div className="lum-analytics-track">
                  <div
                    className="lum-analytics-fill"
                    style={{
                      width: `${
                        product.quantity /
                        maxQuantity *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )
          )
        )}
      </article>
    </section>
  );
}

/* ==================================================
   10. TABEL PESANAN ADMIN
================================================== */

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
            <th>Tanggal</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Total</th>
            <th>Metode Pembayaran</th>
            <th>Status Pembayaran</th>
            <th>Status Pesanan</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
            const status = getStatus(
              order.status
            );

            const finalStatus = [
              "Selesai",
              "Dibatalkan",
            ].includes(status);

            return (
              <tr key={order.id}>
                <td>
                  {order.id}
                </td>

                <td>
                  {formattedDate(order.date)}
                </td>

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
                  {rupiah(order.total)}
                </td>

                <td>
                  {getPaymentName(
                    order.paymentMethod
                  )}
                </td>

                <td>
                  {getPaymentStatus(order)}
                </td>

                <td>
                  {editable ? (
                    <select
                      value={status}
                      disabled={finalStatus}
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
                            next !== status &&
                            !allowedStatusChange(
                              status,
                              next
                            )
                          }
                        >
                          {next}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="lum-order-status">
                      {status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {!orders.length && (
            <tr>
              <td colSpan={8}>
                Belum ada pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ==================================================
   11. DASHBOARD ADMIN
================================================== */

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
  const [tab, setTab] =
    useState("overview");

  const [search, setSearch] =
    useState("");

  const [folder, setFolder] =
    useState("Semua");

  const [previewId, setPreviewId] =
    useState("");

  const finished = orders.filter(
    (order) =>
      getStatus(order.status) === "Selesai"
  );

  const revenue = finished.reduce(
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

  const visibleProducts = products.filter(
    (product) =>
      normalize(
        `${product.name} ${product.collection}`
      ).includes(normalize(search))
  );

  const visibleOrders = orders.filter(
    (order) =>
      normalize(
        `${order.id} ${order.customer} ${order.status} ${order.paymentMethod}`
      ).includes(normalize(search))
  );

  const previewOrder =
    visibleOrders.find(
      (order) =>
        String(order.id) === previewId
    ) ||
    visibleOrders[0] ||
    null;

  const visiblePhotos = PHOTOS.filter(
    (photo) =>
      (folder === "Semua" ||
        photo.folder === folder) &&
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

  function exportCSV() {
    const rows = [
      [
        "ID",
        "Tanggal",
        "Pelanggan",
        "Total",
        "Pembayaran",
        "Status Bayar",
        "Status Pesanan",
      ],
      ...visibleOrders.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.total,
        getPaymentName(
          order.paymentMethod
        ),
        getPaymentStatus(order),
        getStatus(order.status),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            let cell = String(value ?? "");

            if (/^[=+\-@\t\r]/.test(cell)) {
              cell = "'" + cell;
            }

            return `"${cell.replaceAll(
              '"',
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      "laporan-lumina.csv";

    anchor.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div className="lum-dash">
      {/* SIDEBAR */}

      <aside className="lum-dash-sidebar">
        <div className="lum-dash-logo">
          LUMINA<span>.</span>
        </div>

        <p>
          MANAGEMENT SYSTEM
        </p>

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

        <div className="lum-dash-sidebar-bottom">
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
            <p className="lum-dash-eyebrow">
              LUMINA BUSINESS CENTER
            </p>

            <h1>
              {tab === "overview" &&
                "Dashboard Overview"}

              {tab === "products" &&
                "Product Management"}

              {tab === "orders" &&
                "Order Management"}

              {tab === "reports" &&
                "Sales Report"}

              {tab === "gallery" &&
                "Photo Gallery"}
            </h1>
          </div>

          <input
            placeholder="Cari produk atau pesanan..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </header>

        {/* OVERVIEW ADMIN */}

        {tab === "overview" && (
          <>
            <AdminAnalytics
              orders={orders}
              products={products}
            />

            <div className="lum-dash-stats">
              {[
                [
                  "Pendapatan Selesai",
                  rupiah(revenue),
                ],
                [
                  "Total Pesanan",
                  orders.length,
                ],
                [
                  "Total Produk",
                  products.length,
                ],
                [
                  "Total Stok",
                  totalStock,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="lum-dash-metric"
                >
                  <strong>
                    {value}
                  </strong>
                  <span>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <section className="lum-dash-card">
              <h2>
                Inventory Monitoring
              </h2>

              <p className="muted">
                Pantau ketersediaan produk.
              </p>

              {!lowStock.length ? (
                <div className="lum-stock-empty">
                  ✓ Semua produk memiliki
                  stok aman.
                </div>
              ) : (
                <div className="lum-stock-list">
                  {[...lowStock]
                    .sort(
                      (a, b) =>
                        Number(a.stock) -
                        Number(b.stock)
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="lum-stock-row"
                      >
                        <div className="lum-stock-info">
                          <strong>
                            {product.name}
                          </strong>
                          <small>
                            {product.collection}
                          </small>
                        </div>

                        <span
                          className={
                            Number(product.stock) === 0
                              ? "lum-stock-badge out"
                              : "lum-stock-badge low"
                          }
                        >
                          {Number(product.stock) === 0
                            ? "Stok Habis"
                            : `Sisa ${product.stock}`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="lum-dash-card">
              <h2>
                Collection Overview
              </h2>

              <div className="lum-category-stats">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="btn-light"
                    onClick={() => {
                      setFolder(
                        category.folder
                      );
                      setSearch("");
                      setTab("gallery");
                    }}
                  >
                    <strong>
                      {
                        products.filter(
                          (product) =>
                            product.collection ===
                            category.name
                        ).length
                      }
                    </strong>

                    <span>
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="lum-dash-card">
              <h2>
                Recent Orders
              </h2>

              <OrderTable
                orders={orders.slice(0, 5)}
              />
            </section>
          </>
        )}

        {/* PRODUCT MANAGEMENT */}

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

              <label>
                Nama Produk
              </label>

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

              <label>
                Kategori
              </label>

              <select
                value={form.collection}
                onChange={(event) => {
                  const chosen = CATEGORIES.find(
                    (category) =>
                      category.name ===
                      event.target.value
                  );

                  if (!chosen) return;

                  setForm((previous) => ({
                    ...previous,
                    collection: chosen.name,
                    image: "",
                    gallery: "",
                    sizes:
                      chosen.sizes.join(","),
                  }));
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

              <label>
                Harga
              </label>

              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value
                  )
                }
              />

              <label>
                Stok
              </label>

              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  updateField(
                    "stock",
                    event.target.value
                  )
                }
              />

              <label>
                Gambar Utama
              </label>

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
                  Pilih gambar
                </option>

                {PHOTOS.filter(
                  (photo) =>
                    photo.folder ===
                    CATEGORIES.find(
                      (category) =>
                        category.name ===
                        form.collection
                    )?.folder
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
                  alt="Preview Produk"
                />
              </div>

              {/* GALERI PRODUK */}

              <label>
                Foto Tambahan Produk
              </label>

              <select
                value=""
                onChange={(event) => {
                  const chosen =
                    event.target.value;

                  if (!chosen) return;

                  setForm((previous) => ({
                    ...previous,
                    gallery: [
                      ...new Set([
                        ...splitText(
                          previous.gallery
                        ),
                        chosen,
                      ]),
                    ]
                      .filter(
                        (url) =>
                          url !== previous.image
                      )
                      .join(","),
                  }));
                }}
              >
                <option value="">
                  + Pilih foto tambahan
                </option>

                {PHOTOS.filter(
                  (photo) =>
                    photo.folder ===
                      CATEGORIES.find(
                        (category) =>
                          category.name ===
                          form.collection
                      )?.folder &&
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

              <small className="muted">
                Pilih hanya foto lain dari
                barang yang sama.
              </small>

              <div className="lum-extra-gallery">
                {splitText(
                  form.gallery
                ).map((url) => (
                  <div
                    key={url}
                    className="lum-extra-gallery-item"
                  >
                    <div className="lum-extra-thumb">
                      <ProductImage
                        src={url}
                        alt="Foto tambahan"
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-light"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          gallery: splitText(
                            previous.gallery
                          )
                            .filter(
                              (item) =>
                                item !== url
                            )
                            .join(","),
                        }))
                      }
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <label>
                Deskripsi Produk
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
              />

              <label>
                Ukuran
              </label>

              <input
                value={form.sizes}
                onChange={(event) =>
                  updateField(
                    "sizes",
                    event.target.value
                  )
                }
              />

              <label>
                Warna
              </label>

              <input
                value={form.colors}
                onChange={(event) =>
                  updateField(
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

            {/* DAFTAR PRODUK */}

            <section className="lum-dash-card">
              <h2>
                Daftar Produk (
                {products.length})
              </h2>

              {visibleProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="lum-dash-product-row"
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
                        {rupiah(product.price)}
                      </p>

                      <small>
                        Stok: {product.stock}
                      </small>
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

              {!visibleProducts.length && (
                <p>
                  Produk tidak ditemukan.
                </p>
              )}
            </section>
          </div>
        )}

        {/* ORDER MANAGEMENT */}

        {tab === "orders" && (
          <section className="lum-dash-card">
            <h2>
              Manajemen Pesanan
            </h2>

            <p className="muted">
              Kelola status pesanan secara
              berurutan.
            </p>

            {previewOrder ? (
              <>
                <label>
                  Pilih Pesanan
                </label>

                <select
                  value={
                    String(previewOrder.id)
                  }
                  onChange={(event) =>
                    setPreviewId(
                      event.target.value
                    )
                  }
                >
                  {visibleOrders.map((order) => (
                    <option
                      key={order.id}
                      value={
                        String(order.id)
                      }
                    >
                      {order.id} —{" "}
                      {order.customer}
                    </option>
                  ))}
                </select>

                <OrderStatusFlow
                  status={
                    getStatus(
                      previewOrder.status
                    )
                  }
                />

                <OrderHistory
                  order={previewOrder}
                />

                <div className="panel">
                  <h3>
                    Informasi Pesanan
                  </h3>

                  <p>
                    Pelanggan:{" "}
                    {previewOrder.customer}
                  </p>

                  <p>
                    Total:{" "}
                    {rupiah(
                      previewOrder.total
                    )}
                  </p>

                  <p>
                    Pembayaran:{" "}
                    {getPaymentName(
                      previewOrder.paymentMethod
                    )}
                  </p>

                  <p>
                    Status Bayar:{" "}
                    {getPaymentStatus(
                      previewOrder
                    )}
                  </p>

                  <p>
                    Status Pesanan:{" "}
                    {getStatus(
                      previewOrder.status
                    )}
                  </p>
                </div>
              </>
            ) : (
              <p>
                Belum ada pesanan.
              </p>
            )}

            <h3>
              Daftar Pesanan
            </h3>

            <OrderTable
              orders={visibleOrders}
              editable
              onStatus={onStatus}
            />
          </section>
        )}

        {/* LAPORAN PENJUALAN */}

        {tab === "reports" && (
          <section className="lum-dash-card">
            <h2>
              Laporan Transaksi Penjualan
            </h2>

            <p className="muted">
              Download laporan PDF atau CSV.
            </p>

            <div className="lum-dash-stats">
              <div className="lum-dash-metric">
                <strong>
                  {orders.length}
                </strong>

                <span>
                  Total Pesanan
                </span>
              </div>

              <div className="lum-dash-metric">
                <strong>
                  {finished.length}
                </strong>

                <span>
                  Pesanan Selesai
                </span>
              </div>

              <div className="lum-dash-metric">
                <strong>
                  {rupiah(revenue)}
                </strong>

                <span>
                  Pendapatan Selesai
                </span>
              </div>
            </div>

            <h3>
              Daftar Transaksi (
              {visibleOrders.length})
            </h3>

            <OrderTable
              orders={visibleOrders}
            />

            <div className="lum-report-actions">
              <button
                type="button"
                className="btn-dark"
                disabled={
                  !visibleOrders.length
                }
                onClick={() =>
                  downloadTransactionsPDF(
                    visibleOrders
                  )
                }
              >
                Download Laporan PDF
              </button>

              <button
                type="button"
                className="btn-light"
                disabled={
                  !visibleOrders.length
                }
                onClick={exportCSV}
              >
                Download Laporan CSV
              </button>
            </div>
          </section>
        )}

        {/* FOTO GALERI */}

        {tab === "gallery" && (
          <section className="lum-dash-card">
            <h2>
              Galeri Foto Lokal
            </h2>

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
              {visiblePhotos.length} foto tersedia
            </p>

            <div className="lum-gallery">
              {visiblePhotos.map((photo) => (
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

      {/* SIDEBAR KANAN */}

      <aside className="lum-dash-right">
        <section>
          <h3>
            Store Summary
          </h3>

          <p>
            Total Produk:{" "}
            {products.length}
          </p>

          <p>
            Foto Lokal:{" "}
            {PHOTOS.length}
          </p>

          <p>
            Total Pesanan:{" "}
            {orders.length}
          </p>

          <p>
            Stok Menipis:{" "}
            {lowStock.length}
          </p>
        </section>
      </aside>
    </div>
  );
}

/* ==================================================
   12. MAIN APPLICATION
================================================== */

export default function App() {
  const [products, setProducts] =
    useState(loadProducts);

  const [orders, setOrders] =
    useState(
      () => readArray(KEY.orders)
    );

  const [customer, setCustomer] =
    useState(
      () => read(KEY.session, null)
    );

  const [cart, setCart] =
    useState(
      () => readArray(KEY.cart)
    );

  const [wishlist, setWishlist] =
    useState(
      () => readArray(KEY.wishlist)
    );

  const [page, setPage] =
    useState(
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

  const [selectedSize, setSelectedSize] =
    useState("");

  const [selectedColor, setSelectedColor] =
    useState("");

  const [form, setForm] =
    useState({
      ...DEFAULT_FORM,
    });

  const [checkout, setCheckout] =
    useState({
      ...DEFAULT_CHECKOUT,
    });

  const [message, setMessage] =
    useState("");

  const checkoutLock = useRef(false);
  const statusLocks = useRef(
    new Set()
  );

  /* =========================================
     13. LOCAL STORAGE
  ========================================= */

  useEffect(() => {
    save(KEY.products, products);
  }, [products]);

  useEffect(() => {
    save(KEY.orders, orders);
    statusLocks.current.clear();
  }, [orders]);

  useEffect(() => {
    save(KEY.cart, cart);
  }, [cart]);

  useEffect(() => {
    save(KEY.wishlist, wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (customer) {
      save(
        KEY.session,
        customer
      );
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

    return () =>
      clearTimeout(timer);
  }, [message]);

  /* =========================================
     14. FILTER PRODUK
  ========================================= */

  const visibleProducts = useMemo(
    () => {
      const filtered = products.filter(
        (product) =>
          (category === "All" ||
            product.collection === category) &&
          normalize(
            `${product.name} ${product.collection} ${product.description}`
          ).includes(normalize(search))
      );

      return [...filtered].sort(
        (a, b) => {
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
        }
      );
    },
    [
      products,
      category,
      search,
      sort,
    ]
  );

  const featured = products.filter(
    (product) =>
      product.image
  );

  const heroPhoto =
    PHOTOS.find(
      (photo) =>
        photo.folder === "baju wanita"
    )?.url ||
    PHOTOS[0]?.url ||
    products.find(
      (product) => product.image
    )?.image;

  const selected = products.find(
    (product) =>
      product.id === selectedId
  );

  /* =========================================
     15. KERANJANG
  ========================================= */

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
        Number(item.quantity),
    0
  );

  const shippingFee =
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

  /* =========================================
     16. NAVIGASI
  ========================================= */

  function navigate(nextPage) {
    if (
      [
        "home",
        "shop",
        "cart",
      ].includes(nextPage)
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

  function selectCategory(value) {
    setCategory(value);
    setSearch("");
    navigate("shop");
  }

  function showProduct(product) {
    setSelectedId(product.id);

    setSelectedSize(
      product.sizes?.[0] ||
      "All Size"
    );

    setSelectedColor(
      product.colors?.[0] ||
      "Sesuai foto"
    );

    navigate("detail");
  }

  /* =========================================
     17. LOGIN
  ========================================= */

  function openAuth(
    returnPage = "home"
  ) {
    setAuthReturn(returnPage);
    navigate("auth");
  }

  function loginSuccess(user) {
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

    setMessage(
      "Berhasil logout."
    );
  }

  /* =========================================
     18. WISHLIST
  ========================================= */

  function toggleWishlist(id) {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter(
            (item) =>
              item !== id
          )
        : [...previous, id]
    );
  }

  /* =========================================
     19. TAMBAH KE KERANJANG
  ========================================= */

  function addToCart(
    product,
    size,
    color
  ) {
    const currentProduct =
      products.find(
        (item) =>
          item.id === product.id
      );

    if (!currentProduct) {
      setMessage(
        "Produk tidak ditemukan."
      );
      return;
    }

    const chosenSize =
      size ||
      currentProduct.sizes?.[0] ||
      "All Size";

    const chosenColor =
      color ||
      currentProduct.colors?.[0] ||
      "Sesuai foto";

    const key = JSON.stringify([
      currentProduct.id,
      chosenSize,
      chosenColor,
    ]);

    const used = cart
      .filter(
        (item) =>
          item.id ===
          currentProduct.id
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.quantity),
        0
      );

    if (
      used >= Number(
        currentProduct.stock
      )
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
        return previous.map(
          (item) => {
            const itemKey =
              item.key ||
              JSON.stringify([
                item.id,
                item.size,
                item.color,
              ]);

            return itemKey === key
              ? {
                  ...item,
                  key,
                  quantity:
                    Number(
                      item.quantity
                    ) + 1,
                }
              : item;
          }
        );
      }

      return [
        ...previous,
        {
          id: currentProduct.id,
          key,
          size: chosenSize,
          color: chosenColor,
          quantity: 1,
        },
      ];
    });

    setMessage(
      "Produk ditambahkan ke keranjang."
    );
  }

  /* =========================================
     20. UBAH JUMLAH KERANJANG
  ========================================= */

  function changeQuantity(
    key,
    amount
  ) {
    const item = validCart.find(
      (entry) =>
        entry.key === key
    );

    if (!item) return;

    const product = products.find(
      (entry) =>
        entry.id === item.id
    );

    const used = cart
      .filter(
        (entry) =>
          entry.id === item.id
      )
      .reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.quantity
          ),
        0
      );

    if (
      amount > 0 &&
      (!product ||
        used >= Number(
          product.stock
        ))
    ) {
      setMessage(
        "Stok tidak mencukupi."
      );
      return;
    }

    setCart((previous) =>
      previous
        .map((entry) => {
          const entryKey =
            entry.key ||
            JSON.stringify([
              entry.id,
              entry.size,
              entry.color,
            ]);

          return entryKey === key
            ? {
                ...entry,
                key,
                quantity:
                  Number(
                    entry.quantity
                  ) + amount,
              }
            : entry;
        })
        .filter(
          (entry) =>
            entry.quantity > 0
        )
    );
  }

  /* =========================================
     21. CHECKOUT DENGAN PEMBAYARAN
  ========================================= */

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
      setMessage(
        "Keranjang masih kosong."
      );
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
        "Periksa nama, nomor telepon, dan alamat."
      );
      return;
    }

    const paymentMethod =
      PAYMENT_METHODS.some(
        (item) =>
          item.value ===
          checkout.payment
      )
        ? checkout.payment
        : "cod";

    const quantities = new Map();

    validCart.forEach(
      (item) => {
        quantities.set(
          item.id,
          (quantities.get(
            item.id
          ) || 0) +
            Number(
              item.quantity
            )
        );
      }
    );

    for (
      const [id, quantity]
      of quantities
    ) {
      const product =
        products.find(
          (item) =>
            item.id === id
        );

      if (
        !product ||
        Number(
          product.stock
        ) < quantity
      ) {
        setMessage(
          "Stok produk tidak mencukupi."
        );
        return;
      }
    }

    checkoutLock.current = true;

    const now =
      new Date().toISOString();

    const orderId =
      `LM-${Date.now()}`;

    const order = {
      id: orderId,
      date: now,

      customer:
        checkout.name.trim(),

      customerId:
        customer.id,

      customerEmail:
        customer.email,

      phone:
        checkout.phone.trim(),

      address:
        checkout.address.trim(),

      shipping:
        checkout.shipping,

      paymentMethod,

      paymentStatus:
        paymentMethod === "cod"
          ? "Bayar di Tempat"
          : "Menunggu Pembayaran",

      items: validCart.map(
        (item) => ({
          ...item,
        })
      ),

      total:
        subtotal +
        shippingFee,

      status:
        "Pesanan Baru",

      stockRestored: false,

      history: [
        {
          id:
            `${orderId}-created`,
          from: null,
          status:
            "Pesanan Baru",
          at: now,
          by: "Sistem",
          note:
            `Pesanan dibuat dengan metode ${getPaymentName(paymentMethod)}.`,
        },
      ],
    };

    setOrders((previous) => [
      order,
      ...previous,
    ]);

    setProducts((previous) =>
      previous.map(
        (product) => ({
          ...product,

          stock:
            Number(
              product.stock
            ) -
            (quantities.get(
              product.id
            ) || 0),
        })
      )
    );

    setCart([]);

    setCheckout({
      ...DEFAULT_CHECKOUT,
    });

    navigate("success");

    setMessage(
      "Pesanan berhasil dibuat."
    );
  }

  /* =========================================
     22. STATUS PESANAN
  ========================================= */

  function updateStatus(
    id,
    nextStatus
  ) {
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

    const currentStatus =
      getStatus(
        order.status
      );

    if (
      !allowedStatusChange(
        currentStatus,
        nextStatus
      )
    ) {
      setMessage(
        "Status harus diubah berurutan. Pesanan final tidak dapat diubah."
      );
      return;
    }

    statusLocks.current.add(id);

    const now =
      new Date().toISOString();

    const historyEvent = {
      id:
        `${id}-${Date.now()}-${nextStatus}`,

      from:
        currentStatus,

      status:
        nextStatus,

      at: now,

      by:
        "Admin Demo",

      note:
        nextStatus === "Dibatalkan"
          ? "Pesanan dibatalkan melalui Admin Demo."
          : `Status diubah menjadi ${nextStatus}.`,
    };

    if (
      nextStatus ===
        "Dibatalkan" &&
      !order.stockRestored
    ) {
      const quantities =
        new Map();

      (order.items || []).forEach(
        (item) => {
          const quantity = Math.max(
            0,
            Number(
              item.quantity
            ) || 0
          );

          quantities.set(
            item.id,
            (quantities.get(
              item.id
            ) || 0) +
              quantity
          );
        }
      );

      setProducts(
        (previous) =>
          previous.map(
            (product) => ({
              ...product,

              stock:
                Number(
                  product.stock
                ) +
                (quantities.get(
                  product.id
                ) || 0),
            })
          )
      );
    }

    setOrders((previous) =>
      previous.map(
        (item) =>
          item.id === id
            ? {
                ...item,

                status:
                  nextStatus,

                updatedAt:
                  now,

                stockRestored:
                  Boolean(
                    item.stockRestored
                  ) ||
                  nextStatus ===
                    "Dibatalkan",

                history: [
                  ...(Array.isArray(
                    item.history
                  )
                    ? item.history
                    : []),

                  historyEvent,
                ],
              }
            : item
      )
    );

    setMessage(
      `Status pesanan menjadi ${nextStatus}.`
    );
  }

  /* =========================================
     23. CRUD PRODUK
  ========================================= */

  function saveProduct(event) {
    event.preventDefault();

    const selectedCategory =
      CATEGORIES.find(
        (item) =>
          item.name ===
          form.collection
      );

    const price =
      Number(form.price);

    const stock =
      Number(form.stock);

    if (
      !form.name.trim() ||
      !selectedCategory ||
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
          photo.url ===
            form.image &&
          photo.folder ===
            selectedCategory.folder
      )
    ) {
      setMessage(
        "Foto tidak sesuai kategori."
      );
      return;
    }

    const duplicate =
      products.some(
        (product) =>
          product.id !==
            form.id &&
          Boolean(
            form.image
          ) &&
          product.image ===
            form.image
      );

    if (duplicate) {
      setMessage(
        "Foto sudah digunakan oleh produk lain."
      );
      return;
    }

    const sizes =
      splitText(
        form.sizes
      );

    const colors =
      splitText(
        form.colors
      );

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
        splitText(
          form.gallery
        ).filter(
          (url) =>
            url !==
              form.image &&
            PHOTOS.some(
              (photo) =>
                photo.url ===
                  url &&
                photo.folder ===
                  selectedCategory.folder
            )
        )
      ),
    ];

    const product = {
      id:
        form.id ??
        `custom:${Date.now()}`,

      name:
        form.name.trim(),

      collection:
        selectedCategory.name,

      image:
        form.image,

      gallery,

      price,
      stock,

      description:
        form.description.trim(),

      sizes,
      colors,
    };

    if (
      form.id !== null
    ) {
      const previousProduct =
        products.find(
          (item) =>
            item.id ===
            form.id
        );

      if (
        previousProduct?.image &&
        previousProduct.image !==
          product.image
      ) {
        const deleted =
          new Set(
            readArray(
              KEY.deleted
            ).map(String)
          );

        deleted.add(
          `local:${previousProduct.image}`
        );

        save(
          KEY.deleted,
          [...deleted]
        );
      }

      setProducts(
        (previous) =>
          previous.map(
            (item) =>
              item.id === form.id
                ? product
                : item
          )
      );
    } else {
      setProducts(
        (previous) => [
          ...previous,
          product,
        ]
      );
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

      name:
        product.name,

      collection:
        product.collection,

      image:
        product.image || "",

      gallery:
        Array.isArray(
          product.gallery
        )
          ? product.gallery.join(
              ","
            )
          : "",

      price:
        String(
          product.price
        ),

      stock:
        String(
          product.stock
        ),

      description:
        product.description ||
        "",

      sizes:
        (product.sizes || [])
          .join(","),

      colors:
        (product.colors || [])
          .join(","),
    });

    window.scrollTo(0, 0);
  }

  function deleteProduct(id) {
    const active = orders.some(
      (order) =>
        ![
          "Selesai",
          "Dibatalkan",
        ].includes(
          getStatus(
            order.status
          )
        ) &&
        order.items?.some(
          (item) =>
            item.id === id
        )
    );

    if (active) {
      setMessage(
        "Selesaikan pesanan aktif terlebih dahulu."
      );
      return;
    }

    if (
      !window.confirm(
        "Yakin ingin menghapus produk ini?"
      )
    ) {
      return;
    }

    const product =
      products.find(
        (item) =>
          item.id === id
      );

    const deleted =
      new Set(
        readArray(
          KEY.deleted
        ).map(String)
      );

    deleted.add(
      String(id)
    );

    if (
      product?.image
    ) {
      deleted.add(
        `local:${product.image}`
      );
    }

    save(
      KEY.deleted,
      [...deleted]
    );

    setProducts(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    setCart(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== id
        )
    );

    setWishlist(
      (previous) =>
        previous.filter(
          (item) =>
            item !== id
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
    onDetail:
      showProduct,
    onWishlist:
      toggleWishlist,
    onCart:
      addToCart,
  };

  /* ==================================================
     24. TAMPILAN APLIKASI
  ================================================== */

  return (
    <div
      className={`lumina ${
        page === "admin"
          ? "admin-mode"
          : ""
      }`}
    >
      {/* CSS PENYESUAIAN FITUR BARU */}

      <style>{`
        .lumina .lum-premium-detail {
          max-width: 1240px;
          margin: 0 auto;
          padding: 35px 20px 80px;
          color: #302720;
        }

        .lumina .lum-premium-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.1fr)
            minmax(310px, .9fr);
          gap: 40px;
          align-items: start;
        }

        .lumina .lum-premium-main-image {
          height: 520px;
          border-radius: 15px;
          border: 1px solid #ece3dc;
          background: #faf8f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .lumina .lum-premium-main-image img {
          display: block;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          filter: none !important;
        }

        .lumina .lum-premium-thumbnails {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 15px;
        }

        .lumina .lum-premium-thumbnails button {
          width: 84px;
          height: 95px;
          border-radius: 10px;
          border: 1px solid #ddd2c8;
          background: white;
          padding: 6px;
          cursor: pointer;
        }

        .lumina .lum-premium-thumbnails button.active {
          border: 2px solid #856347;
        }

        .lumina .lum-premium-thumbnails img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-premium-info h1 {
          font-family: Georgia, serif;
          font-weight: 400;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1.2;
          margin-bottom: 20px;
        }

        .lumina .lum-premium-info label {
          display: block;
          font-weight: 700;
          margin: 18px 0 10px;
        }

        .lumina .lum-premium-info .wide {
          margin-top: 14px;
        }

        .lumina .lum-premium-rating {
          color: #b38543;
          font-weight: 600;
        }

        .lumina .lum-premium-reviews {
          margin-top: 55px;
          padding-top: 25px;
          border-top: 1px solid #eae1d9;
        }

        .lumina .lum-premium-review-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-top: 20px;
        }

        .lumina .lum-premium-review {
          border: 1px solid #eee5dc;
          padding: 18px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .lumina .lum-premium-review-form {
          background: #faf7f3;
          padding: 22px;
          border-radius: 13px;
        }

        .lumina .lum-premium-review-form textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd3c9;
          border-radius: 9px;
          margin-bottom: 12px;
          font: inherit;
        }

        .lumina .lum-premium-stars {
          display: flex;
          gap: 4px;
          margin: 12px 0;
        }

        .lumina .lum-premium-stars button {
          border: none;
          background: transparent;
          font-size: 28px;
          color: #bdb1a6;
          cursor: pointer;
        }

        .lumina .lum-premium-stars button.active {
          color: #d6a049;
        }

        .lumina .lum-advanced-analytics {
          margin: 22px 0;
        }

        .lumina .lum-analytics-heading h2 {
          margin-bottom: 7px;
        }

        .lumina .lum-analytics-heading p {
          color: #8a7b6d;
          font-size: 13px;
        }

        .lumina .lum-analytics-metrics {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 20px 0;
        }

        .lumina .lum-analytics-metrics article,
        .lumina .lum-analytics-panel {
          background: white;
          padding: 20px;
          border: 1px solid #eee5dc;
          border-radius: 14px;
        }

        .lumina .lum-analytics-metrics small {
          display: block;
          color: #897a6d;
          margin-bottom: 10px;
        }

        .lumina .lum-analytics-metrics strong {
          display: block;
          font-size: clamp(16px, 2vw, 23px);
          overflow-wrap: anywhere;
        }

        .lumina .lum-analytics-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .lumina .lum-revenue-chart {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 10px;
          min-height: 210px;
          align-items: end;
        }

        .lumina .lum-revenue-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .lumina .lum-revenue-track {
          width: 100%;
          height: 155px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          border-radius: 8px;
          background: #f7f3ef;
          overflow: hidden;
        }

        .lumina .lum-revenue-bar {
          width: 65%;
          background: linear-gradient(
            180deg,
            #caa284,
            #87654c
          );
          border-radius: 7px 7px 0 0;
        }

        .lumina .lum-revenue-month small {
          font-size: 11px;
          color: #88796b;
          text-align: center;
        }

        .lumina .lum-analytics-status-row {
          display: grid;
          grid-template-columns: 105px 1fr 25px;
          align-items: center;
          gap: 10px;
          margin: 17px 0;
          font-size: 12px;
        }

        .lumina .lum-analytics-track {
          height: 11px;
          background: #eee5dc;
          border-radius: 20px;
          overflow: hidden;
        }

        .lumina .lum-analytics-fill {
          height: 100%;
          background: #a27b5e;
          border-radius: 20px;
        }

        .lumina .lum-top-product {
          margin: 18px 0;
        }

        .lumina .lum-top-product .between {
          margin-bottom: 10px;
        }

        .lumina .lum-new-shop {
          max-width: 1250px;
          margin: auto;
          padding: 52px 24px 90px;
        }

        .lumina .lum-shop-heading {
          text-align: center;
          margin-bottom: 30px;
        }

        .lumina .lum-shop-heading h1 {
          font-family: Georgia, serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 400;
          margin: 12px 0;
        }

        .lumina .lum-shop-categories {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 26px;
        }

        .lumina .lum-shop-pill {
          background: white;
          border: 1px solid #ddd3c9;
          border-radius: 25px;
          padding: 10px 17px;
          cursor: pointer;
        }

        .lumina .lum-shop-pill.active {
          background: #302720;
          color: white;
        }

        .lumina .lum-shop-toolbar {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) 220px;
          gap: 12px;
          margin-bottom: 20px;
        }

        .lumina .lum-shop-search {
          background: white;
          border: 1px solid #e0d5cb;
          border-radius: 25px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lumina .lum-shop-search input {
          border: 0;
          background: transparent;
          outline: 0;
          flex: 1;
          min-width: 0;
        }

        .lumina .lum-shop-search button {
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .lumina .lum-shop-sort {
          background: white;
          border: 1px solid #e0d5cb;
          border-radius: 25px;
          padding: 12px;
        }

        .lumina .lum-shop-count {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          color: #8b7e72;
          font-size: 12px;
        }

        .lumina .lum-shop-grid .product-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .lumina .lum-shop-grid .product-card {
          background: white;
          border: 1px solid #eae1d9;
          border-radius: 15px;
          overflow: hidden;
        }

        .lumina .lum-shop-grid .product-picture {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #faf8f6;
        }

        .lumina .lum-shop-grid .image-button {
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          background: transparent;
        }

        .lumina .lum-shop-grid .product-picture img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: none !important;
        }

        .lumina .lum-photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 120px;
          width: 100%;
          height: 100%;
          background: #f0eae4;
        }

        .lumina .lum-empty {
          text-align: center;
          padding: 45px;
        }

        .lumina .lum-home-categories {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .lumina .lum-admin-thumb {
          width: 60px;
          height: 75px;
          flex: 0 0 60px;
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
          gap: 12px;
          margin: 12px 0;
        }

        .lumina .lum-extra-gallery-item {
          width: 90px;
        }

        .lumina .lum-extra-thumb {
          width: 90px;
          height: 90px;
        }

        .lumina .lum-extra-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-gallery {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(145px, 1fr));
          gap: 14px;
        }

        .lumina .lum-gallery img {
          width: 100%;
          height: 190px;
          object-fit: contain;
        }

        .lumina .lum-category-stats {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }

        .lumina .lum-category-stats button {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 20px;
        }

        .lumina .lum-stock-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border-bottom: 1px solid #eee5dc;
        }

        .lumina .lum-stock-info {
          display: flex;
          flex-direction: column;
        }

        .lumina .lum-stock-badge {
          border-radius: 20px;
          padding: 7px 12px;
          font-size: 11px;
        }

        .lumina .lum-stock-badge.low {
          background: #fff0d4;
          color: #a36d16;
        }

        .lumina .lum-stock-badge.out {
          background: #ffe0e0;
          color: #b43232;
        }

        .lumina .lum-report-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 25px;
        }

        .lumina .lum-cart-photo {
          width: 100px;
          height: 120px;
          flex: 0 0 100px;
        }

        .lumina .lum-cart-photo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .lumina .lum-payment-section {
          margin-top: 20px;
          border: 1px solid #e9dfd5;
          border-radius: 12px;
          padding: 18px;
          background: #faf7f4;
        }

        .lumina .lum-payment-section select {
          width: 100%;
          margin: 10px 0;
        }

        .lumina .lum-payment-note {
          color: #806b59;
          font-size: 13px;
          line-height: 1.7;
        }

        .lumina .lum-dash-table-wrap {
          overflow-x: auto;
        }

        .lumina .lum-dash-table {
          min-width: 900px;
        }

        @media (max-width: 850px) {
          .lumina .lum-premium-layout,
          .lumina .lum-premium-review-grid,
          .lumina .lum-analytics-grid {
            grid-template-columns: 1fr;
          }

          .lumina .lum-premium-main-image {
            height: 400px;
          }

          .lumina .lum-analytics-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .lumina .lum-shop-toolbar {
            grid-template-columns: 1fr;
          }

          .lumina .lum-shop-grid .product-grid {
            gap: 10px;
          }

          .lumina .lum-analytics-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* =================================================
          NAVBAR
      ================================================= */}

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
                    onClick={logout}
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

      {/* =================================================
          HOMEPAGE
      ================================================= */}

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
                Temukan fashion pria,
                wanita, batik, sepatu,
                tas, dan aksesori.
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
                src={heroPhoto}
                alt="LUMINA Fashion"
              />
            </div>
          </section>

          <section className="perks">
            <div>
              ✧{" "}
              <strong>
                Premium Fashion
              </strong>
              <span>
                Modern & Elegant
              </span>
            </div>

            <div>
              ♡{" "}
              <strong>
                {PHOTOS.length} Foto Koleksi
              </strong>
              <span>
                Katalog Foto Lokal
              </span>
            </div>

            <div>
              ✦{" "}
              <strong>
                Seven Collections
              </strong>
              <span>
                Fashion For Everyone
              </span>
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
                      selectCategory(
                        category.name
                      )
                    }
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
                        padding: 20,
                        textAlign: "left",
                        background:
                          "linear-gradient(transparent,rgba(30,22,17,.85))",
                        color: "white",
                      }}
                    >
                      <small>
                        LUMINA COLLECTION
                      </small>

                      <strong>
                        {category.label}
                      </strong>
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
                  selectCategory("All")
                }
              >
                View All Products →
              </button>
            </div>
          </section>
        </>
      )}

      {/* =================================================
          SHOP / KATALOG
      ================================================= */}

      {page === "shop" && (
        <main className="lum-new-shop">
          <div className="lum-shop-heading">
            <small>
              DISCOVER YOUR STYLE
            </small>

            <h1>
              Shop Our Collection
            </h1>

            <p>
              Temukan gaya terbaik dari
              koleksi LUMINA STORE.
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
                  setCategory(
                    item.name
                  );
                  setSearch("");
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="lum-shop-toolbar">
            <div className="lum-shop-search">
              <span>
                ⌕
              </span>

              <input
                type="search"
                placeholder="Cari produk favoritmu..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
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
                setSort(
                  event.target.value
                )
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

          <div className="lum-shop-count">
            <span>
              {visibleProducts.length} produk ditemukan
            </span>

            <span>
              ▦ Grid View
            </span>
          </div>

          <div className="lum-shop-grid">
            <ProductGrid
              products={visibleProducts}
              {...gridProps}
            />
          </div>
        </main>
      )}

      {/* =================================================
          DETAIL PRODUK PREMIUM
      ================================================= */}

      {page === "detail" && selected && (
        <PremiumProductDetail
          key={selected.id}
          product={selected}
          customer={customer}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSizeChange={setSelectedSize}
          onColorChange={setSelectedColor}
          onAddToCart={addToCart}
          onWishlist={toggleWishlist}
          isWishlisted={
            wishlist.includes(
              selected.id
            )
          }
          onBack={() =>
            navigate("shop")
          }
        />
      )}

      {/* =================================================
          WISHLIST
      ================================================= */}

      {page === "wishlist" && (
        <main className="container section">
          <h1 className="section-title">
            My Wishlist ♡
          </h1>

          <ProductGrid
            products={products.filter(
              (product) =>
                wishlist.includes(
                  product.id
                )
            )}
            {...gridProps}
          />
        </main>
      )}

      {/* =================================================
          SHOPPING CART
      ================================================= */}

      {page === "cart" && (
        <main className="container section">
          <h1 className="section-title">
            Shopping Cart
          </h1>

          <div className="two-column">
            <div className="panel">
              {!validCart.length && (
                <p>
                  Keranjang masih kosong.
                </p>
              )}

              {validCart.map(
                (item) => (
                  <div
                    key={item.key}
                    className="cart-row"
                  >
                    <div className="lum-cart-photo">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                      />
                    </div>

                    <div className="grow">
                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.size} /{" "}
                        {item.color}
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

                        <span>
                          {item.quantity}
                        </span>

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
                            setCart(
                              (previous) =>
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
                )
              )}
            </div>

            <div className="panel summary">
              <h2>
                Ringkasan Belanja
              </h2>

              <div className="between">
                <span>
                  Total Item
                </span>

                <strong>
                  {cartCount}
                </strong>
              </div>

              <div className="between">
                <span>
                  Subtotal
                </span>

                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <button
                className="btn-dark wide"
                disabled={
                  !validCart.length
                }
                onClick={() =>
                  customer
                    ? navigate(
                        "checkout"
                      )
                    : openAuth(
                        "checkout"
                      )
                }
              >
                Checkout →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =================================================
          LOGIN / REGISTER
      ================================================= */}

      {page === "auth" && (
        <AuthPage
          onSuccess={loginSuccess}
          onBack={() =>
            navigate("home")
          }
        />
      )}

      {/* =================================================
          CHECKOUT + METODE PEMBAYARAN
      ================================================= */}

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
              <h2>
                Informasi Pembeli
              </h2>

              <label>
                Nama Lengkap
              </label>

              <input
                required
                value={checkout.name}
                onChange={(event) =>
                  setCheckout(
                    (previous) => ({
                      ...previous,
                      name:
                        event.target.value,
                    })
                  )
                }
              />

              <label>
                Nomor Telepon
              </label>

              <input
                required
                value={checkout.phone}
                onChange={(event) =>
                  setCheckout(
                    (previous) => ({
                      ...previous,
                      phone:
                        event.target.value,
                    })
                  )
                }
              />

              <label>
                Alamat Pengiriman
              </label>

              <textarea
                required
                rows={4}
                value={checkout.address}
                onChange={(event) =>
                  setCheckout(
                    (previous) => ({
                      ...previous,
                      address:
                        event.target.value,
                    })
                  )
                }
              />

              <label>
                Metode Pengiriman
              </label>

              <select
                value={checkout.shipping}
                onChange={(event) =>
                  setCheckout(
                    (previous) => ({
                      ...previous,
                      shipping:
                        event.target.value,
                    })
                  )
                }
              >
                <option value="regular">
                  Regular Rp12.000
                </option>

                <option value="express">
                  Express Rp25.000
                </option>
              </select>

              {/* PILIHAN PEMBAYARAN */}

              <div className="lum-payment-section">
                <h3>
                  Metode Pembayaran
                </h3>

                <label>
                  Pilih Metode Pembayaran
                </label>

                <select
                  value={
                    checkout.payment
                  }
                  onChange={(event) =>
                    setCheckout(
                      (previous) => ({
                        ...previous,
                        payment:
                          event.target.value,
                      })
                    )
                  }
                >
                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        key={method.value}
                        value={method.value}
                      >
                        {method.label}
                      </option>
                    )
                  )}
                </select>

                {checkout.payment === "cod" && (
                  <p className="lum-payment-note">
                    COD: pembayaran dilakukan
                    saat paket diterima pelanggan.
                  </p>
                )}

                {checkout.payment === "transfer" && (
                  <p className="lum-payment-note">
                    Transfer Bank: ini hanya
                    simulasi checkout.
                    Belum tersedia rekening
                    tujuan atau transaksi bank nyata.
                  </p>
                )}

                {checkout.payment === "qris" && (
                  <p className="lum-payment-note">
                    QRIS: ini adalah simulasi
                    metode pembayaran.
                    Belum tersedia QR pembayaran
                    atau koneksi payment gateway.
                  </p>
                )}
              </div>

              <p className="muted">
                Semua pembayaran pada aplikasi
                ini masih berupa simulasi.
              </p>

              <button
                type="submit"
                className="btn-dark wide"
                disabled={
                  !validCart.length
                }
              >
                Konfirmasi Pesanan
              </button>
            </form>

            <div className="panel summary">
              <h2>
                Ringkasan Pesanan
              </h2>

              <div className="between">
                <span>
                  Subtotal
                </span>

                <strong>
                  {rupiah(subtotal)}
                </strong>
              </div>

              <div className="between">
                <span>
                  Ongkir
                </span>

                <strong>
                  {rupiah(
                    shippingFee
                  )}
                </strong>
              </div>

              <div className="between">
                <span>
                  Pembayaran
                </span>

                <strong>
                  {getPaymentName(
                    checkout.payment
                  )}
                </strong>
              </div>

              <div className="between grand-total">
                <span>
                  Total
                </span>

                <strong>
                  {rupiah(
                    subtotal +
                    shippingFee
                  )}
                </strong>
              </div>
            </div>
          </div>
        </main>
      )}

      {page === "checkout" && !customer && (
        <main className="container section center">
          <h2>
            Silakan Login Terlebih Dahulu
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

      {/* =================================================
          DASHBOARD PELANGGAN
      ================================================= */}

      {page === "account" && customer && (
        <CustomerDashboard
          customer={customer}
          orders={myOrders}
          onBack={() =>
            selectCategory("All")
          }
          onLogout={logout}
        />
      )}

      {/* =================================================
          PESANAN BERHASIL
      ================================================= */}

      {page === "success" && (
        <main className="container section center">
          <div className="panel success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h1>
              Pesanan Berhasil!
            </h1>

            <p>
              Pesanan simulasi berhasil dibuat.
              Kamu dapat memantau status
              di Dashboard Pelanggan.
            </p>

            {orders[0] && (
              <div className="lum-success-payment">
                <p>
                  Nomor Pesanan:{" "}
                  <strong>
                    {orders[0].id}
                  </strong>
                </p>

                <p>
                  Metode Pembayaran:{" "}
                  <strong>
                    {getPaymentName(
                      orders[0].paymentMethod
                    )}
                  </strong>
                </p>

                <p>
                  Status Pembayaran:{" "}
                  <strong>
                    {getPaymentStatus(
                      orders[0]
                    )}
                  </strong>
                </p>
              </div>
            )}

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
                selectCategory("All")
              }
            >
              Lanjut Belanja
            </button>
          </div>
        </main>
      )}

      {/* =================================================
          DASHBOARD ADMIN
      ================================================= */}

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
          onBack={() =>
            navigate("home")
          }
        />
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      {page !== "admin" && (
        <footer className="footer">
          <div>
            <h2>
              LUMINA.
            </h2>

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
            {" "}LUMINA STORE
          </p>
        </footer>
      )}

      {/* =================================================
          NOTIFIKASI
      ================================================= */}

      {message && (
        <div
          className="toast"
          role="status"
        >
          <span>
            {message}
          </span>

          <button
            type="button"
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
