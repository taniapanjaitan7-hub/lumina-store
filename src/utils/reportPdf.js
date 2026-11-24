
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function rupiah(value) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(
    Number(value) || 0
  );
}

export function downloadTransactionsPDF(orders = []) {
  if (!orders.length) {
    alert("Belum ada transaksi untuk dicetak.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const completed = orders.filter(
    (order) => order.status === "Selesai"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  doc.setFillColor(48, 39, 32);
  doc.rect(0, 0, 297, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("LUMINA STORE", 14, 14);

  doc.setFontSize(11);
  doc.text("LAPORAN TRANSAKSI", 14, 23);

  doc.setTextColor(48, 39, 32);
  doc.setFontSize(10);

  doc.text(`Total Pesanan: ${orders.length}`, 14, 40);
  doc.text(`Pesanan Selesai: ${completed.length}`, 95, 40);
  doc.text(`Pendapatan: ${rupiah(revenue)}`, 180, 40);

  autoTable(doc, {
    startY: 48,
    head: [[
      "No",
      "ID Pesanan",
      "Tanggal",
      "Pelanggan",
      "Produk",
      "Total",
      "Status",
    ]],
    body: orders.map((order, index) => [
      index + 1,
      order.id || "-",
      order.date
        ? new Date(order.date).toLocaleDateString("id-ID")
        : "-",
      order.customer || "-",
      (order.items || [])
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", "),
      rupiah(order.total),
      order.status || "Pesanan Baru",
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [48, 39, 32],
    },
  });

  const historyRows = orders.flatMap((order) =>
    (Array.isArray(order.history) ? order.history : []).map(
      (event) => [
        order.id,
        event.at
          ? new Date(event.at).toLocaleString("id-ID")
          : "-",
        event.from
          ? `${event.from} ke ${event.status}`
          : event.status,
        event.by || "Sistem",
      ]
    )
  );

  if (historyRows.length > 0) {
    doc.addPage();

    doc.setFontSize(14);
    doc.text("RIWAYAT STATUS PESANAN", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [[
        "ID Pesanan",
        "Tanggal",
        "Perubahan",
        "Petugas",
      ]],
      body: historyRows,
      headStyles: {
        fillColor: [48, 39, 32],
      },
    });
  }

  doc.save("laporan-transaksi-lumina.pdf");
}
