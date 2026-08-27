import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// URL del logo de SNB (pública en S3)
const SNB_LOGO_URL = "/logo-share.png";

export async function generateOrderPDF(order) {
  const doc = new jsPDF();

  // ── CARGAR LOGO ──
  try {
    const response = await fetch(SNB_LOGO_URL);
    const blob = await response.blob();
    const reader = new FileReader();
    
    await new Promise((resolve, reject) => {
      reader.onloadend = resolve;
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    const logoBase64 = reader.result;
    doc.addImage(logoBase64, "PNG", 14, 8, 45, 18);
  } catch (e) {
    console.warn("No se pudo cargar el logo:", e);
  }

  // ── ENCABEZADO SNB ──
  doc.setFontSize(9);
  doc.setTextColor(107, 20, 38);
  doc.text("SNB REPRESENTACIONES", 14, 32);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Sistema B2B - Gestión de pedidos", 14, 37);

  // Línea separadora
  doc.setDrawColor(107, 20, 38);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // ── TÍTULO ──
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text("ORDEN DE PEDIDO", 14, 50);

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`N° Pedido: #${order.id?.slice(0, 8).toUpperCase()}`, 14, 57);
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString("es-AR")}`, 14, 62);

  // ── DATOS CLIENTE / EMPRESA ──
  const startY = 72;

  doc.setFontSize(11);
  doc.setTextColor(107, 20, 38);
  doc.text("CLIENTE", 14, startY);
  doc.text("EMPRESA PROVEEDORA", 110, startY);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(order.customer_name || order.customer_email || "-", 14, startY + 6);
  doc.text(`Email: ${order.customer_email || "-"}`, 14, startY + 12);

  doc.setFontSize(10);
  doc.text(order.company_name || "-", 110, startY + 6);

  // ── TABLA DE PRODUCTOS ──
  const tableColumns = ["Producto", "SKU", "Cant.", "P. Unit.", "Subtotal"];
  const tableRows = (order.items || []).map((item) => [
    item.product_name || "",
    item.variant_sku || "-",
    item.quantity?.toString() || "0",
    `$${Number(item.unit_price || 0).toFixed(2)}`,
    `$${Number(item.subtotal || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: startY + 20,
    head: [tableColumns],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [107, 20, 38],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  // ── TOTAL ──
  const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : startY + 50;
  doc.setFontSize(12);
  doc.setTextColor(107, 20, 38);
  doc.text(`TOTAL: $${Number(order.total_amount || 0).toFixed(2)}`, 14, finalY);

  // ── NOTAS (solo las del admin, NUNCA las del cliente) ──
  if (order.notes) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Observaciones:", 14, finalY + 10);
    doc.setFontSize(9);
    doc.text(order.notes, 14, finalY + 16);
  }
  // NOTA: order.customer_notes se ignora deliberadamente en el PDF

  // ── PIE DE PÁGINA ──
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("SNB Representaciones - Sistema B2B", 14, 280);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")}`, 14, 285);

  // ── DESCARGA ──
  doc.save(`pedido-${order.id?.slice(0, 8)}.pdf`);
}