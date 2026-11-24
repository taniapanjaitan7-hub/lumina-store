
import { useMemo } from "react";

// ======================================
// LUMINA STORE - ADMIN ANALYTICS
// ======================================

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Waktu pesanan selesai.
// Jika riwayat lama tidak tersedia,
// gunakan tanggal pembaruan atau pesanan.
function statusSelesaiDate(order) {
  const history = Array.isArray(order.history)
    ? order.history
    : [];

  const event = [...history]
    .reverse()
    .find((item) => item.status === "Selesai");

  const date = new Date(
    event?.at || order.updatedAt || order.date || ""
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function AdminAnalytics({
  orders = [],
  products = [],
}) {
  const stats = useMemo(() => {
    // Hanya pesanan selesai dihitung
    // sebagai pendapatan.
    const completed = orders.filter(
      (order) => order.status === "Selesai"
    );

    const income = completed.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    const soldUnits = completed.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (total, item) =>
            total + Number(item.quantity || 0),
          0
        ),
      0
    );

    // Grafik 6 bulan terakhir
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
          label: date.toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          }),
          revenue: 0,
          count: 0,
        };
      }
    );

    const monthMap = new Map(
      months.map((month) => [month.key, month])
    );

    completed.forEach((order) => {
      const date = statusSelesaiDate(order);

      if (!date) return;

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      const month = monthMap.get(key);

      if (month) {
        month.revenue += Number(order.total || 0);
        month.count += 1;
      }
    });

    // Menghitung produk terlaris
    const topMap = new Map();

    completed.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = String(
          item.id ?? item.name ?? "Produk"
        );

        const previous = topMap.get(key) || {
          name: item.name || "Produk",
          qty: 0,
        };

        previous.qty += Number(
          item.quantity || 0
        );

        topMap.set(key, previous);
      });
    });

    const topProducts = [...topMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Jumlah pesanan berdasarkan status
    const statuses = [
      "Pesanan Baru",
      "Diproses",
      "Dikirim",
      "Selesai",
      "Dibatalkan",
    ].map((status) => ({
      status,
      count: orders.filter(
        (order) =>
          (order.status || "Pesanan Baru") === status
      ).length,
    }));

    const stockLow = products.filter(
      (product) => Number(product.stock) <= 5
    ).length;

    return {
      income,
      soldUnits,
      completedCount: completed.length,
      months,
      topProducts,
      statuses,
      stockLow,
    };
  }, [orders, products]);

  const maxIncome = Math.max(
    1,
    ...stats.months.map((month) => month.revenue)
  );

  const maxStatus = Math.max(
    1,
    ...stats.statuses.map((item) => item.count)
  );

  const maxUnits = Math.max(
    1,
    ...stats.topProducts.map((item) => item.qty)
  );

  return (
    <section className="lum-admin-analytics">
      <style>{`
        .lum-admin-analytics {
          color: #302720;
          margin: 24px 0;
        }

        .lum-admin-analytics * {
          box-sizing: border-box;
        }

        .lum-admin-analytics h2 {
          font-size: 21px;
          margin: 0 0 8px;
        }

        .lum-admin-analytics h3 {
          font-size: 17px;
          margin: 0 0 9px;
        }

        .lum-admin-analytics .la-muted {
          font-size: 12px;
          color: #8c7a6d;
          margin: 4px 0 20px;
        }

        .lum-admin-analytics .la-metrics {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 16px 0;
        }

        .lum-admin-analytics .la-metric,
        .lum-admin-analytics .la-card {
          background: #fff;
          border: 1px solid #eae1d9;
          border-radius: 14px;
          padding: 19px;
          box-shadow:
            0 3px 16px rgba(48, 39, 32, .04);
        }

        .lum-admin-analytics .la-metric small {
          color: #8c7a6d;
          display: block;
          margin-bottom: 11px;
        }

        .lum-admin-analytics .la-metric strong {
          font-size: clamp(17px, 1.8vw, 25px);
          overflow-wrap: anywhere;
        }

        .lum-admin-analytics .la-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.4fr) minmax(280px, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .lum-admin-analytics .la-chart {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          align-items: end;
          gap: 11px;
          min-height: 215px;
        }

        .lum-admin-analytics .la-chart-item {
          text-align: center;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: center;
        }

        .lum-admin-analytics .la-chart-track {
          width: 100%;
          height: 160px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: #faf7f4;
          border-radius: 8px;
          overflow: hidden;
        }

        .lum-admin-analytics .la-chart-bar {
          width: 64%;
          border-radius: 7px 7px 0 0;
          background: linear-gradient(
            180deg,
            #cfaa8d,
            #866449
          );
        }

        .lum-admin-analytics .la-chart-item small {
          font-size: 11px;
          color: #8c7a6d;
        }

        .lum-admin-analytics .la-status {
          display: grid;
          grid-template-columns:
            105px minmax(0, 1fr) 26px;
          gap: 8px;
          align-items: center;
          margin: 14px 0;
          font-size: 12px;
        }

        .lum-admin-analytics .la-progress {
          height: 10px;
          background: #eee6de;
          overflow: hidden;
          border-radius: 20px;
        }

        .lum-admin-analytics .la-progress > span {
          height: 100%;
          display: block;
          background: #9c795e;
          border-radius: 20px;
        }

        .lum-admin-analytics .la-top {
          margin: 15px 0;
        }

        .lum-admin-analytics .la-top-label {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
          font-size: 13px;
        }

        .lum-admin-analytics .la-top-label strong {
          white-space: nowrap;
        }

        @media (max-width: 880px) {
          .lum-admin-analytics .la-metrics {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .lum-admin-analytics .la-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .lum-admin-analytics .la-metrics {
            grid-template-columns: 1fr;
          }

          .lum-admin-analytics .la-status {
            grid-template-columns:
              88px minmax(0, 1fr) 24px;
          }

          .lum-admin-analytics .la-card {
            padding: 14px;
          }
        }
      `}</style>

      <h2>Advanced Sales Analytics</h2>

      <p className="la-muted">
        Grafik dari transaksi dan stok yang
        tersimpan di browser LUMINA STORE.
      </p>

      <div className="la-metrics">
        <div className="la-metric">
          <small>Pendapatan Selesai</small>
          <strong>{rupiah(stats.income)}</strong>
        </div>

        <div className="la-metric">
          <small>Pesanan Selesai</small>
          <strong>{stats.completedCount}</strong>
        </div>

        <div className="la-metric">
          <small>Unit Terjual</small>
          <strong>{stats.soldUnits}</strong>
        </div>

        <div className="la-metric">
          <small>Produk Stok Menipis</small>
          <strong>{stats.stockLow}</strong>
        </div>
      </div>

      <div className="la-grid">
        <article className="la-card">
          <h3>Pendapatan 6 Bulan Terakhir</h3>

          <p className="la-muted">
            Pesanan Selesai, berdasarkan waktu
            perubahan status jika tercatat.
          </p>

          <div className="la-chart">
            {stats.months.map((month) => (
              <div
                className="la-chart-item"
                key={month.key}
              >
                <div
                  className="la-chart-track"
                  title={
                    `${month.label}: ${
                      rupiah(month.revenue)
                    }`
                  }
                >
                  <div
                    className="la-chart-bar"
                    style={{
                      height: `${
                        month.revenue
                          ? Math.max(
                              3,
                              month.revenue /
                                maxIncome * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <small>{month.label}</small>
                <small>{month.count} order</small>
              </div>
            ))}
          </div>
        </article>

        <article className="la-card">
          <h3>Status Pesanan</h3>

          <p className="la-muted">
            Jumlah pesanan per status.
          </p>

          {stats.statuses.map((item) => (
            <div
              className="la-status"
              key={item.status}
            >
              <span>{item.status}</span>

              <div className="la-progress">
                <span
                  style={{
                    width: `${
                      item.count / maxStatus * 100
                    }%`,
                  }}
                />
              </div>

              <strong>{item.count}</strong>
            </div>
          ))}
        </article>
      </div>

      <article className="la-card">
        <h3>5 Produk Terlaris</h3>

        <p className="la-muted">
          Dihitung dari jumlah unit pada pesanan
          yang berstatus Selesai.
        </p>

        {!stats.topProducts.length ? (
          <p className="la-muted">
            Belum ada pesanan selesai untuk dianalisis.
          </p>
        ) : (
          stats.topProducts.map((product, index) => (
            <div
              className="la-top"
              key={`${product.name}-${index}`}
            >
              <div className="la-top-label">
                <span>
                  {index + 1}. {product.name}
                </span>

                <strong>
                  {product.qty} terjual
                </strong>
              </div>

              <div className="la-progress">
                <span
                  style={{
                    width: `${
                      product.qty / maxUnits * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </article>
    </section>
  );
}
