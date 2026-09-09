import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// URL del logo de SNB (pública en S3)
const SNB_LOGO_URL = "/logo-share.png";

function formatVariantAttributes(variantSelection) {
  if (!variantSelection || typeof variantSelection !== "object") {
    return "";
  }

  return Object.entries(variantSelection)
    .filter(([key, value]) => {
      return (
        key !== "variant_id" &&
        value !== null &&
        value !== undefined &&
        value !== ""
      );
    })
    .map(([_, value]) => String(value))
    .join(" · ");
}

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
  doc.text(
    `N° Pedido: ${order.order_number || `#${order.id?.slice(0, 8).toUpperCase()}`}`,
    14,
    57
  );
  doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString("es-AR")}`, 14, 62);

  // ── DATOS CLIENTE / EMPRESA ──
  const startY = 72;

  doc.setFontSize(11);
  doc.setTextColor(107, 20, 38);
  doc.text("CLIENTE", 14, startY);
  doc.text("EMPRESA PROVEEDORA", 110, startY);

  doc.setFontSize(10);
  doc.setTextColor(0);
  
  doc.text(
    `Cliente: ${order.customer_name || "-"}`,
    14,
    startY + 6
  );
  
  doc.text(
    `Razón social: ${order.business_name || order.company_name || "-"}`,
    14,
    startY + 12
  );
  
  if (order.cuit) {
    doc.text(
      `CUIT: ${order.cuit}`,
      14,
      startY + 18
    );
  }
  
  let customerExtraY = startY + 24;
  
  if (order.delivery_method) {
    doc.text(
      `Tipo de transporte: ${order.delivery_method}`,
      14,
      customerExtraY
    );
    customerExtraY += 6;
  }
  
  if (order.carrier_name) {
    doc.text(
      `Transporte: ${order.carrier_name}`,
      14,
      customerExtraY
    );
    customerExtraY += 6;
  }
  
  if (order.carrier_phone) {
    doc.text(
      `Tel. transporte: ${order.carrier_phone}`,
      14,
      customerExtraY
    );
    customerExtraY += 6;
  }
  
  const deliveryAddress =
    order.delivery_address ||
    order.direccion_entrega ||
    "";
  
  if (deliveryAddress) {
    const deliveryLines = doc.splitTextToSize(
      `Dirección de entrega: ${deliveryAddress}`,
      80
    );
  
    doc.text(
      deliveryLines,
      14,
      customerExtraY
    );
  
    customerExtraY += deliveryLines.length * 5;
  }

  const transportAddress = order.direccion_transporte || "";

  if (transportAddress) {
    const transportLines = doc.splitTextToSize(
      `Dirección del transporte: ${transportAddress}`,
      80
    );
  
    doc.text(
      transportLines,
      14,
      customerExtraY
    );
  
    customerExtraY += transportLines.length * 5;
  }

  const locationParts = [
    order.ciudad,
    order.provincia,
  ].filter(Boolean);
  
  if (locationParts.length > 0) {
    doc.text(
      `Ubicación: ${locationParts.join(", ")}`,
      14,
      customerExtraY
    );
  
    customerExtraY += 6;
  }
  
  doc.setFontSize(10);
  doc.text(
    `Empresa: ${order.company_name || "-"}`,
    110,
    startY + 6
  );
  console.log("items del pedido:", order.items);

  // ── TABLA DE PRODUCTOS ──
  const tableColumns = [
    "Producto",
    "Código",
    "SKU",
    "Cant.",
    "P. Unit.",
    "Subtotal"
  ];
  
  const tableRows = (order.items || []).map((item) => {
    const variantText = formatVariantAttributes(item.variant_selection);
  
    const productCell = variantText
      ? `${item.product_name || ""}\n${variantText}`
      : item.product_name || "";
  
    return [
      productCell,
      item.product_code || "-",
      item.variant_sku || "-",
      item.quantity?.toString() || "0",
      `$${Number(item.unit_price || 0).toFixed(2)}`,
      `$${Number(item.subtotal || 0).toFixed(2)}`,
    ];
  });

  const tableStartY = Math.max(
    startY + 20,
    customerExtraY + 8
  );
  
  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumns],
    body: tableRows,
    theme: "striped",
  
    headStyles: {
      fillColor: [107, 20, 38],
      textColor: 255,
      fontStyle: "bold",
    },
  
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
    },
  
    columnStyles: {
      0: { cellWidth: 60 },              // Producto + variante
      1: { cellWidth: 25 },              // Código
      2: { cellWidth: 25 },              // SKU
      3: { cellWidth: 15, halign: "center" }, // Cant.
      4: { cellWidth: 25, halign: "right" },  // P. Unit.
      5: { cellWidth: 25, halign: "right" },  // Subtotal
    },
  
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const lines = String(data.cell.raw || "").split("\n");
  
        if (lines.length > 1) {
          data.cell.text = lines;
        }
      }
    },
  });

  // ── TOTAL ──
  const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : startY + 50;
  doc.setFontSize(12);
  doc.setTextColor(107, 20, 38);
  doc.text(`TOTAL: $${Number(order.total_amount || 0).toFixed(2)}`, 14, finalY);

  // ── NOTAS DEL PEDIDO ──
  
  let notesY = finalY + 10;
  
  if (order.customer_notes) {
  
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Observaciones del cliente:", 14, notesY);
  
    doc.setFontSize(9);
  
    const customerNotes = doc.splitTextToSize(
      order.customer_notes,
      180
    );
  
    doc.text(customerNotes, 14, notesY + 6);
  
    notesY += 12 + (customerNotes.length * 5);
  }
  
  if (order.notes) {
  
    doc.setFontSize(10);
    doc.setTextColor(107, 20, 38);
    doc.text("Descripción para el fabricante:", 14, notesY);
  
    doc.setFontSize(9);
    doc.setTextColor(80);
  
    const manufacturerNotes = doc.splitTextToSize(
      order.notes,
      180
    );
  
    doc.text(manufacturerNotes, 14, notesY + 6);
  
    notesY += 12 + (manufacturerNotes.length * 5);
  }

  // ── PIE DE PÁGINA ──
  // Calculamos Y dinámico para no pisar las observaciones
  let footerY = 280;

  if (order.customer_notes || order.notes) {
    footerY = notesY + 8;
  
    if (footerY < 280) {
      footerY = 280;
    }
  }
  
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("SNB Representaciones - Sistema B2B", 14, footerY);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")}`, 14, footerY + 5);

  // ── DESCARGA ──
  doc.save(`pedido-${order.id?.slice(0, 8)}.pdf`);
}