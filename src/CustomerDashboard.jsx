
import { useMemo, useState } from "react";
import "./CustomerDashboard.css";

const ORDER_STEPS = [
  "Pesanan Baru",
  "Diproses",
  "Dikirim",
  "Selesai",
];

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatStatus(value) {
  return value === "Simulasi" || !value
    ? "Pesanan Baru"
    : value;
}

function getImageUrl(src) {
  if (!src) return "";

  if (/^(https?:|data:)/i.test(src)) {
    return src;
  }

  const base = import.meta.env.BASE_URL.replace(
    /\/$/,
    ""
  );

  const path = String(src)
    .replace(/\\/g, "/")
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

  return (
    base +
    (path.startsWith("/") ? "" : "/") +
    path
  );
}

function OrderPhoto({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="cd-photo cd-placeholder">
        <span>▧</span>
        <small>No Photo</small>
      </div>
    );
  }

  return (
    <img
      key={src}
      className="cd-photo"
      src={getImageUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StatusTimeline({ status }) {
  const currentStatus = formatStatus(status);

  if (currentStatus === "Dibatalkan") {
    return (
      <div className="cd-cancel-notice">
        Pesanan dibatalkan. Status pengiriman
        tidak dilanjutkan.
      </div>
    );
  }

  const current = ORDER_STEPS.indexOf(
    currentStatus
  );

  return (
    <div className="cd-timeline">
      {ORDER_STEPS.map((step, index) => (
        <div
          className={
            `cd-step ${
              index <= current ? "completed" : ""
            }`
          }
          key={step}
        >
          <span className="cd-step-dot">
            {index <= current ? "✓" : index + 1}
          </span>

          <span className="cd-step-label">
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CustomerDashboard({
  customer,
  orders = [],
  onBack,
  onLogout,
}) {
  const [section, setSection] =
    useState("overview");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState("Semua");

  const [selectedOrderId, setSelectedOrderId] =
    useState(null);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      ),
    [orders]
  );

  const filteredOrders = useMemo(
    () =>
      sortedOrders.filter((order) => {
        const text = [
          order.id,
          order.customer,
          ...(order.items || []).map(
            (item) => item.name
          ),
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = text.includes(
          search.toLowerCase()
        );

        const matchesFilter =
          filter === "Semua" ||
          formatStatus(order.status) === filter;

        return matchesSearch && matchesFilter;
      }),
    [sortedOrders, search, filter]
  );

  const selectedOrder = sortedOrders.find(
    (order) => order.id === selectedOrderId
  );

  const completedOrders = sortedOrders.filter(
    (order) =>
      formatStatus(order.status) === "Selesai"
  );

  const ongoingOrders = sortedOrders.filter(
    (order) =>
      [
        "Pesanan Baru",
        "Diproses",
        "Dikirim",
      ].includes(formatStatus(order.status))
  );

  const totalSpent = completedOrders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const stats = [
    {
      icon: "▣",
      title: "Total Pesanan",
      value: sortedOrders.length,
      note: "Seluruh transaksi",
    },
    {
      icon: "◷",
      title: "Dalam Proses",
      value: ongoingOrders.length,
      note: "Pesanan aktif",
    },
    {
      icon: "✓",
      title: "Pesanan Selesai",
      value: completedOrders.length,
      note: "Transaksi selesai",
    },
    {
      icon: "Rp",
      title: "Total Belanja",
      value: rupiah(totalSpent),
      note: "Dari pesanan selesai",
    },
  ];

  const initials = String(
    customer?.name || "P"
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  function openDetail(order) {
    setSelectedOrderId(order.id);
    setSection("detail");
    window.scrollTo(0, 0);
  }

  const displayOrders =
    section === "overview"
      ? sortedOrders.slice(0, 4)
      : filteredOrders;

  return (
    <div className="cd-shell">
      {/* SIDEBAR */}

      <aside className="cd-sidebar">
        <button
          type="button"
          className="cd-logo"
          onClick={onBack}
        >
          LUMINA<span>.</span>
        </button>

        <div className="cd-member">
          <div className="cd-avatar">
            {initials}
          </div>

          <strong>{customer?.name}</strong>
          <small>{customer?.email}</small>
          <span className="cd-member-label">
            LUMINA MEMBER
          </span>
        </div>

        <p className="cd-menu-heading">
          MY ACCOUNT
        </p>

        <nav className="cd-menu">
          <button
            type="button"
            className={
              section === "overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("overview")
            }
          >
            <span>▦</span> Dashboard
          </button>

          <button
            type="button"
            className={
              ["orders", "detail"].includes(section)
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("orders")
            }
          >
            <span>▣</span> Pesanan Saya
          </button>

          <button
            type="button"
            className={
              section === "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setSection("profile")
            }
          >
            <span>◉</span> Profil Saya
          </button>
        </nav>

        <div className="cd-sidebar-bottom">
          <button
            type="button"
            onClick={onBack}
          >
            ← Kembali Belanja
          </button>

          <button
            type="button"
            className="cd-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="cd-main">
        <header className="cd-topbar">
          <div>
            <p className="cd-eyebrow">
              LUMINA CUSTOMER CENTER
            </p>

            <h1>
              {section === "overview" &&
                "My Dashboard"}

              {section === "orders" &&
                "Riwayat Pesanan"}

              {section === "detail" &&
                "Detail Pesanan"}

              {section === "profile" &&
                "Profil Saya"}
            </h1>

            <p className="cd-top-subtitle">
              {section === "overview"
                ? `Selamat datang kembali, ${
                    customer?.name || "Pelanggan"
                  }!`
                : "Kelola aktivitas belanja LUMINA STORE."}
            </p>
          </div>

          <div className="cd-top-avatar">
            {initials}
          </div>
        </header>

        {/* OVERVIEW */}

        {section === "overview" && (
          <>
            <section className="cd-welcome">
              <div>
                <span>
                  YOUR PERSONAL FASHION SPACE
                </span>

                <h2>
                  Hello, {customer?.name}!
                </h2>

                <p>
                  Jelajahi koleksi terbaru,
                  pantau pesanan, dan nikmati
                  pengalaman belanja di LUMINA.
                </p>

                <button
                  type="button"
                  onClick={onBack}
                >
                  Explore Collection →
                </button>
              </div>

              <div className="cd-welcome-decor">
                ✦
              </div>
            </section>

            <section className="cd-stats">
              {stats.map((stat) => (
                <article
                  className="cd-stat"
                  key={stat.title}
                >
                  <span className="cd-stat-icon">
                    {stat.icon}
                  </span>

                  <p>{stat.title}</p>

                  <strong>{stat.value}</strong>

                  <small>{stat.note}</small>
                </article>
              ))}
            </section>

            <section className="cd-panel">
              <div className="cd-panel-heading">
                <div>
                  <h2>Pesanan Terbaru</h2>

                  <p>
                    Pantau aktivitas belanja kamu.
                  </p>
                </div>

                <button
                  type="button"
                  className="cd-link"
                  onClick={() =>
                    setSection("orders")
                  }
                >
                  Lihat Semua →
                </button>
              </div>

              <OrderCards
                orders={displayOrders}
                onOpen={openDetail}
              />
            </section>
          </>
        )}

        {/* ORDER HISTORY */}

        {section === "orders" && (
          <section className="cd-panel">
            <div className="cd-panel-heading">
              <div>
                <h2>Semua Pesanan</h2>

                <p>
                  {sortedOrders.length} pesanan
                  dalam riwayat akunmu.
                </p>
              </div>
            </div>

            <div className="cd-filters">
              <input
                type="search"
                placeholder="Cari ID atau nama produk..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                <option value="Semua">
                  Semua Status
                </option>

                {[
                  ...ORDER_STEPS,
                  "Dibatalkan",
                ].map((item) => (
                  <option
                    value={item}
                    key={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <OrderCards
              orders={displayOrders}
              onOpen={openDetail}
            />
          </section>
        )}

        {/* ORDER DETAIL */}

        {section === "detail" && (
          <section className="cd-panel">
            <button
              type="button"
              className="cd-back"
              onClick={() =>
                setSection("orders")
              }
            >
              ← Kembali ke Riwayat Pesanan
            </button>

            {!selectedOrder ? (
              <p>Pesanan tidak ditemukan.</p>
            ) : (
              <>
                <div className="cd-detail-heading">
                  <div>
                    <p className="cd-eyebrow">
                      ORDER INFORMATION
                    </p>

                    <h2>{selectedOrder.id}</h2>

                    <p>
                      {formatDate(
                        selectedOrder.date
                      )}
                    </p>
                  </div>

                  <span
                    className={
                      "cd-status " +
                      (formatStatus(
                        selectedOrder.status
                      ) === "Dibatalkan"
                        ? "cancelled"
                        : "")
                    }
                  >
                    {formatStatus(
                      selectedOrder.status
                    )}
                  </span>
                </div>

                <StatusTimeline
                  status={selectedOrder.status}
                />

                <h3 className="cd-subheading">
                  Produk Dipesan
                </h3>

                {(selectedOrder.items || []).map(
                  (item, index) => (
                    <div
                      className="cd-order-product"
                      key={
                        item.key ||
                        `${item.id}-${index}`
                      }
                    >
                      <OrderPhoto
                        src={item.image}
                        alt={item.name}
                      />

                      <div className="cd-product-info">
                        <strong>
                          {item.name}
                        </strong>

                        <p>
                          Ukuran: {item.size || "-"}
                          {" · "}
                          Warna: {item.color || "-"}
                        </p>

                        <small>
                          Jumlah: {item.quantity}
                        </small>
                      </div>

                      <strong className="cd-product-price">
                        {rupiah(
                          Number(item.price) *
                          Number(item.quantity)
                        )}
                      </strong>
                    </div>
                  )
                )}

                <div className="cd-detail-columns">
                  <div className="cd-detail-box">
                    <h3>Informasi Pengiriman</h3>

                    <p>
                      <strong>Penerima</strong>
                      {selectedOrder.customer || "-"}
                    </p>

                    <p>
                      <strong>Telepon</strong>
                      {selectedOrder.phone || "-"}
                    </p>

                    <p>
                      <strong>Alamat</strong>
                      {selectedOrder.address || "-"}
                    </p>

                    <p>
                      <strong>Pengiriman</strong>
                      {selectedOrder.shipping ===
                      "express"
                        ? "Express"
                        : "Regular"}
                    </p>
                  </div>

                  <div className="cd-detail-box">
                    <h3>Ringkasan Pembelian</h3>

                    <div className="cd-total-row">
                      <span>Total Item</span>
                      <strong>
                        {(selectedOrder.items || [])
                          .reduce(
                            (sum, item) =>
                              sum +
                              Number(item.quantity || 0),
                            0
                          )}
                      </strong>
                    </div>

                    <div className="cd-total-row">
                      <span>Status</span>
                      <strong>
                        {formatStatus(
                          selectedOrder.status
                        )}
                      </strong>
                    </div>

                    <div className="cd-total-row cd-grand">
                      <span>Total Pesanan</span>
                      <strong>
                        {rupiah(selectedOrder.total)}
                      </strong>
                    </div>
                  </div>
                </div>

                <p className="cd-demo-note">
                  Status pesanan diperbarui melalui
                  Admin Demo. Belum ada pelacakan
                  kurir secara langsung.
                </p>
              </>
            )}
          </section>
        )}

        {/* PROFILE */}

        {section === "profile" && (
          <section className="cd-panel">
            <div className="cd-panel-heading">
              <div>
                <h2>Informasi Akun</h2>

                <p>
                  Data pelanggan yang sedang login.
                </p>
              </div>
            </div>

            <div className="cd-profile">
              <div className="cd-profile-avatar">
                {initials}
              </div>

              <div className="cd-profile-info">
                <label>Nama Lengkap</label>
                <div>{customer?.name || "-"}</div>

                <label>Alamat Email</label>
                <div>{customer?.email || "-"}</div>

                <label>Jenis Akun</label>
                <div>Customer · Demo Account</div>
              </div>
            </div>

            <p className="cd-demo-note">
              Untuk keamanan, halaman ini tidak
              menampilkan password. Pengubahan
              data akun memerlukan pengembangan
              sistem autentikasi lebih lanjut.
            </p>

            <button
              type="button"
              className="cd-action"
              onClick={onLogout}
            >
              Logout dari Akun
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function OrderCards({
  orders,
  onOpen,
}) {
  if (!orders.length) {
    return (
      <div className="cd-empty">
        <div className="cd-empty-icon">▤</div>
        <h3>Belum ada pesanan</h3>
        <p>
          Pesananmu akan muncul di sini
          setelah menyelesaikan checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="cd-order-list">
      {orders.map((order) => {
        const first = order.items?.[0];

        return (
          <article
            className="cd-order-card"
            key={order.id}
          >
            <div className="cd-order-header">
              <div>
                <strong>{order.id}</strong>
                <small>
                  {formatDate(order.date)}
                </small>
              </div>

              <span
                className={
                  "cd-status " +
                  (formatStatus(order.status) ===
                  "Dibatalkan"
                    ? "cancelled"
                    : "")
                }
              >
                {formatStatus(order.status)}
              </span>
            </div>

            <div className="cd-order-body">
              <OrderPhoto
                src={first?.image}
                alt={first?.name}
              />

              <div className="cd-product-info">
                <strong>
                  {first?.name || "Produk"}
                </strong>

                <p>
                  {(order.items || []).length}
                  {" jenis produk"}
                </p>

                <small>
                  {rupiah(order.total)}
                </small>
              </div>

              <button
                type="button"
                className="cd-detail-btn"
                onClick={() => onOpen(order)}
              >
                Detail →
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
