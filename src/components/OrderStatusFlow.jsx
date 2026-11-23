
import "./OrderStatusFlow.css";

const STEPS = [
  { name: "Pesanan Baru", icon: "🛒" },
  { name: "Diproses", icon: "📦" },
  { name: "Dikirim", icon: "🚚" },
  { name: "Selesai", icon: "✓" },
];

export default function OrderStatusFlow({
  status = "Pesanan Baru",
}) {
  const currentStatus =
    status === "Simulasi" || !status
      ? "Pesanan Baru"
      : status;

  const cancelled =
    currentStatus === "Dibatalkan";

  const currentIndex = STEPS.findIndex(
    (step) => step.name === currentStatus
  );

  const descriptions = {
    "Pesanan Baru":
      "Pesanan berhasil dibuat dan menunggu diproses.",
    Diproses:
      "Pesanan sedang dipersiapkan oleh toko.",
    Dikirim:
      "Pesanan sedang dalam proses pengiriman.",
    Selesai:
      "Pesanan sudah selesai diproses.",
  };

  return (
    <section className="lum-order-flow">
      <div className="lum-order-flow-header">
        <div>
          <h3>Alur Status Pesanan</h3>
          <p>
            Pantau perkembangan pesanan
            dari awal hingga selesai.
          </p>
        </div>

        <span
          className={`lum-order-flow-badge ${
            cancelled ? "cancelled" : ""
          }`}
        >
          {currentStatus}
        </span>
      </div>

      <div
        className="lum-order-flow-steps"
        role="list"
      >
        {STEPS.map((step, index) => {
          const completed =
            !cancelled && index <= currentIndex;

          const active =
            !cancelled && index === currentIndex;

          const passed =
            !cancelled && index < currentIndex;

          return (
            <div
              key={step.name}
              role="listitem"
              className={[
                "lum-order-flow-step",
                completed ? "completed" : "",
                active ? "current" : "",
                passed ? "passed" : "",
              ].join(" ")}
            >
              <div className="lum-order-flow-icon">
                {step.icon}
              </div>

              <strong className="lum-order-flow-label">
                {step.name}
              </strong>

              {active && (
                <small className="lum-order-flow-active">
                  Status Saat Ini
                </small>
              )}
            </div>
          );
        })}
      </div>

      {cancelled ? (
        <div
          className="lum-order-flow-cancel"
          role="status"
        >
          <strong>✕ Pesanan Dibatalkan</strong>

          <p>
            Pesanan tidak dilanjutkan.
            Stok barang dikembalikan
            ketika pembatalan berhasil.
          </p>
        </div>
      ) : (
        <div className="lum-order-flow-info">
          {descriptions[currentStatus] ||
            "Menunggu informasi status pesanan."}
        </div>
      )}
    </section>
  );
}
