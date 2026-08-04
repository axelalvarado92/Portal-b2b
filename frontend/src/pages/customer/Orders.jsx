import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, History } from "lucide-react"; // Importamos los íconos
import { getOrders, getOrder, requestCancelOrder } from "../../services/ordersService";
import "./Orders.css";

// 💡 Agregamos "COMPLETED" explícitamente para que renderice un badge verde
const STATUS_LABELS = {
  PENDING:          { label: "Pendiente",             color: "#f59e0b" },
  CONFIRMED:        { label: "Confirmado",            color: "#3b82f6" },
  SHIPPED:          { label: "Enviado",               color: "#8b5cf6" },
  DELIVERED:        { label: "Entregado",             color: "#10b981" },
  COMPLETED:        { label: "Completado",            color: "#2e7d32" },
  CANCEL_REQUESTED: { label: "Cancelación solicitada", color: "#f97316" },
  CANCELLED:        { label: "Cancelado",             color: "#ef4444" },
};

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const detailRef = useRef(null);

  // 🗂️ Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState("actives"); // "actives" o "closed"

  // Primer useEffect: Cargar pedidos
  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await getOrders(); // sin company_id
        setOrders(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []); // sin dependencia de selectedCompany

  // Segundo useEffect: Scroll hacia el detalle cuando selectedOrder cambie
  useEffect(() => {
    if (selectedOrder && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedOrder]);

  async function handleViewOrder(orderId) {
    setLoadingDetail(true);
    try {
      const response = await getOrder(orderId);
      setSelectedOrder(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRequestCancel(orderId) {
    setCancelingId(orderId);
    try {
      await requestCancelOrder(orderId);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: "CANCEL_REQUESTED" } : o)
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: "CANCEL_REQUESTED" }));
      }
    } catch (err) {
      console.error(err);
      alert("Error al solicitar la cancelación");
    } finally {
      setCancelingId(null);
    }
  }

  function formatVariants(variantSelection) {

    if (!variantSelection) return null;
  
    const entries = Object.entries(variantSelection);
  
    if (entries.length === 0) return null;
  
    return entries.map(([group, value]) => (
      `${group}: ${value}`
    ));
  
  }

  if (loading) return <p className="orders-loading">Cargando pedidos...</p>;

  // 🔍 Filtrado dinámico según la pestaña seleccionada
  const filteredOrders = orders.filter(order => {
    const isCompleted = order.status?.toUpperCase() === "COMPLETED";
    
    if (activeTab === "closed") {
      return isCompleted; // Pestaña historial: solo completados
    } else {
      return !isCompleted; // Pestaña activos: todos menos los completados
    }
  });

  return (
    <div className="orders-wrapper">
      
      {/* 🛠️ HEADER CON SELECTOR DE PESTAÑAS */}
      <div className="orders-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1>Mis pedidos</h1>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className={activeTab === "actives" ? "snb-btn" : "snb-btn-secondary"}
            onClick={() => { setActiveTab("actives"); setSelectedOrder(null); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", height: "42px" }}
          >
            <ClipboardList size={16} />
            En curso
          </button>
          <button 
            className={activeTab === "closed" ? "snb-btn" : "snb-btn-secondary"}
            onClick={() => { setActiveTab("closed"); setSelectedOrder(null); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", height: "42px" }}
          >
            <History size={16} />
            Historial
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <p>
            {activeTab === "actives" 
              ? "No tenés pedidos activos en este momento." 
              : "Todavía no tenés compras finalizadas en el historial."}
          </p>
          {activeTab === "actives" && (
            <button className="snb-btn" onClick={() => navigate("/products")}>
              Ver catálogo
            </button>
          )}
        </div>
      ) : (
        /* 📊 TABLA PRINCIPAL DE PEDIDOS (Mantiene tu alineación CSS) */
        <table className="orders-table">
          <thead>
            <tr>
              <th className="ord-col-date">Fecha</th>
              <th className="ord-col-comp">Empresa</th>
              <th className="ord-col-status">Estado</th>
              <th className="ord-col-total">Total</th>
              <th className="ord-col-action">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const status = STATUS_LABELS[order.status?.toUpperCase()] || { label: order.status, color: "#888" };
              return (
                <tr key={order.id}>
                  <td className="ord-col-date">{new Date(order.created_at).toLocaleDateString("es-AR")}</td>
                  <td className="ord-col-comp">{order.company_name}</td>
                  <td className="ord-col-status">
                    <span className="status-badge" style={{ background: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="ord-col-total">${Number(order.total_amount).toFixed(2)}</td>
                  <td className="ord-col-action">
                    <button
                      className="orders-detail-btn"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 🔍 PANEL DE DETALLE INFERIOR (Mantiene tu alineación CSS) */}
      {selectedOrder && (
       <div ref={detailRef} className="order-detail">
        <div className="order-detail">
          <div className="order-detail-header">
            <h2>Detalle del pedido</h2>
            <button className="order-detail-close" onClick={() => setSelectedOrder(null)}>✕</button>
          </div>

          <div className="order-detail-meta">
            <span><strong>Empresa:</strong> {selectedOrder.company_name}</span>
            <span>
              <strong>Estado:</strong>{" "}
              <span
                className="status-badge"
                style={{ background: (STATUS_LABELS[selectedOrder.status?.toUpperCase()] || {}).color || "#888" }}
              >
                {(STATUS_LABELS[selectedOrder.status?.toUpperCase()] || {}).label || selectedOrder.status}
              </span>
            </span>
            <span><strong>Fecha:</strong> {new Date(selectedOrder.created_at).toLocaleDateString("es-AR")}</span>
            {selectedOrder.notes && <span><strong>Notas:</strong> {selectedOrder.notes}</span>}
          </div>

          <table className="order-items-table">
            <thead>
              <tr>
                <th className="item-col-name">Producto</th>
                <th className="item-col-price">Precio unit.</th>
                <th className="item-col-qty">Cantidad</th>
                <th className="item-col-sub">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item, i) => (
                <tr key={i}>
                  <td className="item-col-name">

                    <div>{item.product_name}</div>
                  
                    {formatVariants(item.variant_selection)?.map((text, index) => (
                  
                      <div
                        key={index}
                        className="order-variant-line"
                      >
                        {text}
                      </div>
                  
                    ))}
                  
                  </td>
                  <td className="item-col-price">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="item-col-qty">{item.quantity}</td>
                  <td className="item-col-sub">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-detail-total">
            Total: <strong>${Number(selectedOrder.total_amount).toFixed(2)}</strong>
          </div>

          {selectedOrder.status?.toUpperCase() === "PENDING" && (
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="cart-delete-btn"
                onClick={() => handleRequestCancel(selectedOrder.id)}
                disabled={cancelingId === selectedOrder.id}
              >
                {cancelingId === selectedOrder.id ? "Solicitando..." : "Solicitar cancelación"}
              </button>
            </div>
          )}
        </div>
       </div>
      )}
    </div>
  );
}