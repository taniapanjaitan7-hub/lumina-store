
import "./OrderHistory.css";

/* ==========================================
   LUMINA STORE
   ORDER STATUS HISTORY
========================================== */

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderHistory({ order }) {
  const history = Array.isArray(order?.history)
    ? [...order.history].sort(
        (a, b) =>
          new Date(a.at || 0) -
          new Date(b.at || 0)
      )
    : [];

  return (
    <section className="lum-history">
      <div className="lum-history-heading">
        <div>
          <h3>Riwayat Perubahan Status</h3>
          <p>
            Aktivitas pesanan yang tercatat
            pada sistem.
          </p>
        </div>

        <span className="lum-history-count">
          {history.length} Aktivitas
        </span>
      </div>

      {history.length === 0 ? (
        <div className="lum-history-empty">
          <strong>Belum ada catatan riwayat.</strong>

          <p>
            Pesanan lama mungkin dibuat sebelum
            fitur pencatatan status ditambahkan.
            Perubahan berikutnya akan tercatat
            secara otomatis.
          </p>

          <small>
            Status saat ini:{" "}
            {order?.status || "Pesanan Baru"}
          </small>
        </div>
      ) : (
        <div className="lum-history-timeline">
          {history.map((event, index) => {
            const cancelled =
              event.status === "Dibatalkan";

            return (
              <div
                key={
                  event.id ||
                  `${event.at}-${index}`
                }
                className={`lum-history-item ${
                  cancelled ? "cancelled" : ""
                }`}
              >
                <div className="lum-history-dot">
                  {cancelled ? "×" : "✓"}
                </div>

                <div className="lum-history-content">
                  <strong>
                    {event.from
                      ? `${event.from} → ${event.status}`
                      : event.status === "Pesanan Baru"
                        ? "Pesanan Dibuat"
                        : event.status}
                  </strong>

                  <p>
                    {event.note ||
                      "Status pesanan diperbarui."}
                  </p>

                  <div className="lum-history-meta">
                    <span>
                      {formatDate(event.at)}
                    </span>

                    <span>
                      Oleh: {event.by || "Sistem"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
