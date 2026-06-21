import { useEffect, useState, useRef } from "react";
import { ClipboardList, History, CheckCircle2 } from "lucide-react";
import {
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus
  // updateAdminOrder // Descomenta esta línea cuando integres tu servicio de actualización
} from "../../services/adminOrdersService";
import "./Orders.css";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Estados de control para la interfaz optimizada
  const [activeTab, setActiveTab] = useState("actives"); // "actives" o "closed"
  const [orderToClose, setOrderToClose] = useState(null); // Almacena el ID del pedido a cerrar para abrir el modal
  const [isClosing, setIsClosing] = useState(false);
  const detailRef = useRef(null);

  useEffect(() => {
    if (selectedOrder && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedOrder]);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await getAdminOrders();
      setOrders(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleViewOrder(orderId) {
    try {
      const response = await getAdminOrder(orderId);
      setSelectedOrder(response.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Abre el modal de confirmación personalizado
  const triggerCloseModal = (orderId) => {
    setOrderToClose(orderId);
  };

  // Ejecuta la llamada al backend al confirmar en el modal
  async function handleConfirmClose() {
    if (!orderToClose) return;
    
    try {
      setIsClosing(true);
      
      // 1. Enviamos el término exacto en inglés y mayúsculas que PostgreSQL acepta
      await updateAdminOrderStatus(orderToClose, "COMPLETED");
      
      // 2. Actualizamos el estado local en memoria con el mismo término
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderToClose ? { ...o, status: "COMPLETED" } : o)
      );
      
      // 3. Limpiamos los estados de control del modal
      setSelectedOrder(null);
      setOrderToClose(null);   
      
      // 4. Sincronizamos la lista trayendo los datos frescos desde el backend
      await loadOrders();      
      
    } catch (err) {
      console.error("Error al cerrar el pedido:", err);
      alert("Hubo un error al intentar cerrar el pedido en el servidor.");
    } finally {
      setIsClosing(false);
    }
  }

  if (loading) {
    return <div className="admin-orders-page">Cargando pedidos...</div>;
  }

  // Filtrado por pestaña ("Activos" vs "Cerrados") y barra de búsqueda
  const filteredOrders = orders.filter(order => {
    const isCompleted = order.status?.toUpperCase() === "COMPLETED";
    
    // Evaluamos de forma explícita según la pestaña seleccionada
    let matchesTab = false;
    if (activeTab === "closed") {
      matchesTab = isCompleted;        // En historial solo van los COMPLETED
    } else {
      matchesTab = !isCompleted;       // En cualquier otra pestaña van los activos (PENDING, etc.)
    }

    const matchesSearch = 
      order.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="admin-orders-page">
      
      {/* HEADER DE LA PÁGINA CON SELECTOR DE VISTAS */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Pedidos</h1>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className={activeTab === "actives" ? "snb-btn" : "snb-btn-secondary"}
            onClick={() => { setActiveTab("actives"); setSelectedOrder(null); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", height: "42px" }}
          >
            <ClipboardList size={16} />
            Pedidos Activos
          </button>
          <button 
            className={activeTab === "closed" ? "snb-btn" : "snb-btn-secondary"}
            onClick={() => { setActiveTab("closed"); setSelectedOrder(null); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 15px", height: "42px" }}
          >
            <History size={16} />
            Historial Cerrados
          </button>
        </div>
      </div>

      {/* CARD CON MÉTRICAS EN TIEMPO REAL */}
      <div className="orders-summary-card">
        <ClipboardList size={40} />
        <div>
          <h3>{activeTab === "actives" ? "Pedidos en cola" : "Pedidos en el historial"}</h3>
          <span>{filteredOrders.length}</span>
        </div>
      </div>

      {/* INPUT DE BÚSQUEDA */}
      <input
        className="orders-search"
        placeholder="Buscar por empresa o cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLA PRINCIPAL DE CONTROL */}
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Empresa</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id}>
              <td>{order.id.slice(0, 8)}</td>
              <td>{order.company_name}</td>
              <td>{order.customer_email}</td>
              <td>
                <span className={`status-badge ${order.status?.toUpperCase() === "COMPLETED" ? "status-closed" : "status-active"}`}>
                  {order.status?.toUpperCase() === "COMPLETED" ? "COMPLETED" : order.status}
                </span>
              </td>
              <td>${order.total_amount}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td>
                <button className="snb-btn" onClick={() => handleViewOrder(order.id)}>
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
          {filteredOrders.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                No se encontraron pedidos en esta sección.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* DETALLE COMPLETO DEL PEDIDO SELECCIONADO */}
      {selectedOrder && (
         <div ref={detailRef} className="order-detail-card" style={{ marginTop: "30px", borderTop: "4px solid #6b1426" }}>
          <div className="order-detail-header">
            <div className="order-number">Pedido #{selectedOrder.id.slice(0,8)}</div>
            <div className="order-status">
              {selectedOrder.status?.toUpperCase() === "COMPLETED" ? "COMPLETED" : selectedOrder.status}
            </div>
          </div>
        
          <div className="order-info-grid">
            <div className="order-info-item">
              <span className="order-info-label">Cliente</span>
              <span className="order-info-value">{selectedOrder.customer_email}</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Empresa</span>
              <span className="order-info-value">{selectedOrder.company_name}</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Fecha</span>
              <span className="order-info-value">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
            </div>
            <div className="order-info-item">
              <span className="order-info-label">Observaciones</span>
              <span className="order-info-value">{selectedOrder.notes || "-"}</span>
            </div>
          </div>
        
          <h3>Productos</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map(item => (
                <tr key={item.product_name}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unit_price}</td>
                  <td>${item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
            <div className="order-total" style={{ margin: 0 }}>
              Total: ${selectedOrder.total_amount}
            </div>

            {/* BOTÓN NATIVO PARA EJECUTAR EL CIERRE PROPIO */}
            {selectedOrder.status?.toUpperCase() !== "COMPLETED" && (
              <button 
                className="snb-btn" 
                onClick={() => triggerCloseModal(selectedOrder.id)}
                style={{ 
                  backgroundColor: "#2e7d32", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "10px 20px"
                }}
              >
                <CheckCircle2 size={16} />
                Cerrar Pedido
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN CUSTOM (SUSTITUYE AL CONFIRM NATIVO) */}
      {orderToClose && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div className="product-form-card" style={{ 
            width: "450px", 
            padding: "30px", 
            textAlign: "center",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
            borderTop: "4px solid #6b1426",
            backgroundColor: "#fff",
            borderRadius: "8px"
          }}>
            <h3 style={{ color: "#6b1426", marginBottom: "15px" }}>¿Cerrar este pedido?</h3>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "25px", lineHeight: "1.5" }}>
              Esta acción moverá el pedido al <strong>Historial de Cerrados</strong> para mantener limpia la cola de trabajo activa.
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                className="snb-btn" 
                onClick={handleConfirmClose}
                disabled={isClosing}
                style={{ backgroundColor: "#2e7d32", minWidth: "110px" }}
              >
                {isClosing ? "Cerrando..." : "Confirmar"}
              </button>
              <button 
                className="snb-btn-secondary" 
                onClick={() => setOrderToClose(null)}
                disabled={isClosing}
                style={{ minWidth: "110px" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}