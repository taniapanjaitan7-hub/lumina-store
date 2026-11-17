
import { useMemo, useState } from "react";
import "./AdminOverview.css";

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number || 0);

const shortNumber = (number) => {
  if (number >= 1000000)
    return `${(number / 1000000).toFixed(1)}jt`;
  if (number >= 1000)
    return `${(number / 1000).toFixed(0)}rb`;
  return String(number);
};

const getStatus = (status) =>
  !status || status === "Simulasi"
    ? "Pesanan Baru"
    : status;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function MenuButton({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`lum-admin-menu-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="lum-admin-menu-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MetricCard({ icon, label, value, note }) {
  return (
    <div className="lum-admin-metric">
      <div className="lum-admin-metric-top">
        <span className="lum-admin-metric-icon">{icon}</span>
        <span className="lum-admin-metric-note">{note}</span>
      </div>
      <strong>{value}</strong>
      <span className="lum-admin-metric-label">{label}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = getStatus(status);

  const className = normalized
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span className={`lum-admin-status ${className}`}>
      {normalized}
    </span>
  );
}

export default function AdminOverview({
  products = [],
  orders = [],
  onNavigate = () => {},
}) {
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const completedOrders = useMemo(
    () => orders.filter((order) => getStatus(order.status) === "Selesai"),
    [orders]
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => getStatus(order.status) !== "Dibatalkan"),
    [orders]
  );

  const completedRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const activeValue = activeOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) => Number(product.stock) <= 5
  );

  const years = useMemo(() => {
    const allYears = [
      new Date().getFullYear(),
      ...orders.map((order) => new Date(order.date).getFullYear()),
    ].filter(Number.isFinite);

    return [...new Set(allYears)].sort((a, b) => b - a);
  }, [orders]);

  const monthlyRevenue = MONTHS.map((month, index) => {
    const total = completedOrders
      .filter((order) => {
        const date = new Date(order.date);
        return (
          date.getFullYear() === Number(year) &&
          date.getMonth() === index
        );
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return { month, total };
  });

  const highestMonthlyRevenue = Math.max(
    1,
    ...monthlyRevenue.map((item) => item.total)
  );

  const salesByProduct = useMemo(() => {
    const counts = new Map();

    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const previous = counts.get(item.id) || {
          id: item.id,
          name: item.name,
          quantity: 0,
          image: item.image,
        };

        counts.set(item.id, {
          ...previous,
          quantity: previous.quantity + Number(item.quantity || 0),
        });
      });
    });

    return [...counts.values()].sort(
      (a, b) => b.quantity - a.quantity
    );
  }, [completedOrders]);

  const popularProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    )
    .map((product) => ({
      ...product,
      sold: salesByProduct.find(
        (item) => item.id === product.id
      )?.quantity || 0,
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const topSelling = salesByProduct
    .filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const recentOrders = [...orders]
    .filter((order) =>
      [
        order.id,
        order.customer,
        ...(order.items || []).map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, section === "report" ? 20 : 5);

  const statusCounts = [
    "Pesanan Baru",
    "Diproses",
    "Dikirim",
    "Selesai",
    "Dibatalkan",
  ].map((status) => ({
    status,
    count: orders.filter(
      (order) => getStatus(order.status) === status
    ).length,
  }));

  return (
    <div className="lum-admin-dashboard">
      {/* SIDEBAR */}
      <aside className="lum-admin-sidebar">
        <div className="lum-admin-brand">
          LUMINA<span>.</span>
        </div>

        <div className="lum-admin-menu-heading">Menu</div>

        <nav className="lum-admin-sidebar-menu">
          <MenuButton
            icon="▦"
            label="Overview"
            active={section === "overview"}
            onClick={() => setSection("overview")}
          />
          <MenuButton
            icon="▤"
            label="Report"
            active={section === "report"}
            onClick={() => setSection("report")}
          />
          <MenuButton
            icon="🛒"
            label="Order"
            onClick={() => onNavigate("orders")}
          />
          <MenuButton
            icon="◈"
            label="Product"
            onClick={() => onNavigate("products")}
          />
        </nav>

        <div className="lum-admin-sidebar-bottom">
          <strong>Business</strong>
          <p>Fashion & Lifestyle</p>
          <div className="lum-admin-demo-chip">
            ● Demo Dashboard
          </div>
          <small>
            Data disimpan di browser.
          </small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lum-admin-main">
        <div className="lum-admin-topbar">
          <div>
            <p className="lum-admin-overline">
              LUMINA MANAGEMENT
            </p>
            <h2>
              {section === "overview" ? "Overview" : "Sales Report"}
            </h2>
          </div>

          <div className="lum-admin-search-wrap">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search product or order..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Cari produk atau pesanan"
            />
          </div>

          <div className="lum-admin-avatar" title="Admin Demo">
            A
          </div>
        </div>

        {/* STATISTICS */}
        <div className="lum-admin-metrics">
          <MetricCard
            icon="◉"
            label="Penjualan Selesai"
            value={formatRupiah(completedRevenue)}
            note="Completed"
          />
          <MetricCard
            icon="◈"
            label="Nilai Pesanan Aktif"
            value={formatRupiah(activeValue)}
            note="Non-cancelled"
          />
          <MetricCard
            icon="▤"
            label="Total Pesanan"
            value={orders.length}
            note={`${completedOrders.length} selesai`}
          />
          <MetricCard
            icon="▣"
            label="Total Produk"
            value={products.length}
            note={`${totalUnits} unit`}
          />
        </div>

        {/* REVENUE CHART */}
        <div className="lum-admin-chart-card">
          <div className="lum-admin-section-head">
            <div>
              <h3>Earning Revenue</h3>
              <p>Pendapatan dari pesanan berstatus Selesai</p>
            </div>

            <select
              value={year}
              onChange={(event) =>
                setYear(Number(event.target.value))
              }
              aria-label="Tahun grafik"
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="lum-admin-chart-total">
            {formatRupiah(
              monthlyRevenue.reduce(
                (sum, month) => sum + month.total,
                0
              )
            )}
            <small>Total {year}</small>
          </div>

          <div className="lum-admin-revenue-chart">
            {monthlyRevenue.map((item, index) => (
              <div
                className="lum-admin-bar-column"
                key={item.month}
                title={`${item.month}: ${formatRupiah(item.total)}`}
              >
                <span className="lum-admin-chart-value">
                  {item.total > 0 ? shortNumber(item.total) : ""}
                </span>

                <div className="lum-admin-bar-space">
                  <div
                    className={
                      index === new Date().getMonth() &&
                      Number(year) === new Date().getFullYear()
                        ? "lum-admin-bar current"
                        : "lum-admin-bar"
                    }
                    style={{
                      height: `${
                        (item.total / highestMonthlyRevenue) * 100
                      }%`,
                    }}
                  />
                </div>

                <span className="lum-admin-month-label">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* REPORT SUMMARY */}
        {section === "report" && (
          <div className="lum-admin-report">
            <h3>Ringkasan Status Pesanan</h3>
            <div className="lum-admin-report-grid">
              {statusCounts.map((item) => (
                <div key={item.status}>
                  <strong>{item.count}</strong>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT ORDERS */}
        <div className="lum-admin-orders-card">
          <div className="lum-admin-section-head">
            <div>
              <h3>
                {section === "report"
                  ? "Daftar Transaksi"
                  : "Recent Orders"}
              </h3>
              <p>
                {section === "report"
                  ? "Hingga 20 transaksi terbaru"
                  : "Lima transaksi terbaru"}
              </p>
            </div>
            <button
              className="lum-admin-view-button"
              onClick={() => onNavigate("orders")}
            >
              Lihat Semua →
            </button>
          </div>

          <div className="lum-admin-table-scroll">
            <table className="lum-admin-orders-table">
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
                {recentOrders.map((order) => {
                  const firstItem = order.items?.[0];

                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="lum-admin-order-product">
                          {firstItem?.image && (
                            <img
                              src={firstItem.image}
                              alt={firstItem.name}
                            />
                          )}
                          <span>
                            {firstItem?.name || "Produk"}
                            {order.items?.length > 1 &&
                              ` +${order.items.length - 1}`}
                          </span>
                        </div>
                      </td>
                      <td>{order.customer}</td>
                      <td className="lum-admin-order-id">
                        {order.id}
                      </td>
                      <td>{formatRupiah(order.total)}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                    </tr>
                  );
                })}

                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="lum-admin-empty">
                      Belum ada pesanan yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <aside className="lum-admin-rightbar">
        <div className="lum-admin-right-section">
          <h3>Produk Populer</h3>
          <p>Diurutkan berdasarkan penjualan selesai</p>

          {popularProducts.map((product) => (
            <div className="lum-admin-side-product" key={product.id}>
              <img src={product.image} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.sold} unit terjual</span>
              </div>
            </div>
          ))}

          {popularProducts.length === 0 && (
            <p className="lum-admin-empty">Produk tidak ditemukan.</p>
          )}
        </div>

        <div className="lum-admin-right-section">
          <h3>Top Selling Product</h3>
          <p>Pesanan selesai</p>

          {topSelling.map((product) => (
            <div className="lum-admin-side-product" key={product.id}>
              {product.image && (
                <img src={product.image} alt={product.name} />
              )}
              <div>
                <strong>{product.name}</strong>
                <span>{product.quantity} unit</span>
              </div>
            </div>
          ))}

          {topSelling.length === 0 && (
            <p className="lum-admin-empty">
              Belum ada produk terjual.
            </p>
          )}
        </div>

        <div className="lum-admin-right-section">
          <h3>Stock Alert</h3>
          <p>Stok tersisa 5 unit atau kurang</p>

          {lowStock.slice(0, 4).map((product) => (
            <div className="lum-admin-stock-alert" key={product.id}>
              <span>{product.name}</span>
              <strong>{product.stock}</strong>
            </div>
          ))}

          {lowStock.length === 0 && (
            <p className="lum-admin-stock-ok">
              ✓ Stok seluruh produk mencukupi.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
