import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, getOrder } from "../../services/ordersService";
import { useCompany } from "../../context/CompanyContext";
import "./Orders.css";

const STATUS_LABELS = {
  PENDING:   { label: "Pendiente",  color: "#f59e0b" },
  CONFIRMED: { label: "Confirmado", color: "#3b82f6" },
  SHIPPED:   { label: "Enviado",    color: "#8b5cf6" },
  DELIVERED: { label: "Entregado",  color: "#10b981" },
  CANCELLED: { label: "Cancelado",  color: "#ef4444" },
};

export default function Orders() {

  const { selectedCompany } = useCompany();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedCompany) return;

    async function loadOrders() {
      try {
        const response = await getOrders(selectedCompany.id);
        setOrders(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [selectedCompany]);

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

  if (loading) return <p className="orders-loading">Cargando pedidos...</p>;

  return (
    <div className="orders-wrapper">

      <div className="orders-header">
        <h1>Mis pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>Todavía no tenés pedidos.</p>
          <button className="snb-btn" onClick={() => navigate("/products")}>
            Ver catálogo
          </button>
        </div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const status = STATUS_LABELS[order.status] || { label: order.status, color: "#888" };
              return (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleDateString("es-AR")}</td>
                  <td>{order.company_name}</td>
                  <td>
                    <span className="status-badge" style={{ background: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td>${order.total_amount.toFixed(2)}</td>
                  <td>
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

      {/* Panel de detalle */}
      {selectedOrder && (
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
                style={{ background: (STATUS_LABELS[selectedOrder.status] || {}).color || "#888" }}
              >
                {(STATUS_LABELS[selectedOrder.status] || {}).label || selectedOrder.status}
              </span>
            </span>
            <span><strong>Fecha:</strong> {new Date(selectedOrder.created_at).toLocaleDateString("es-AR")}</span>
            {selectedOrder.notes && <span><strong>Notas:</strong> {selectedOrder.notes}</span>}
          </div>

          <table className="order-items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio unit.</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="order-detail-total">
            Total: <strong>${selectedOrder.total_amount.toFixed(2)}</strong>
          </div>

        </div>
      )}

    </div>
  );
}