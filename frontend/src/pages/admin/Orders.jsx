import { useEffect, useState, useRef } from "react";
import { ClipboardList, History, CheckCircle2 } from "lucide-react";
import {
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
  updateAdminOrder,
  sendOrderPDFByEmail,
  editAdminOrder
} from "../../services/adminOrdersService";
import "./Orders.css";

import { getProducts, getProduct } from "../../services/adminProductService";


export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  
  
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
      setOrders(response?.data || []);
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
      console.log("DEBUG getAdminOrder response:", response.data);
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
      console.log("DEBUG: Cerrando orden", orderToClose);
      const response = await updateAdminOrderStatus(
        orderToClose,
        "COMPLETED"
      );
      
      console.log("DEBUG: Respuesta del backend:", response);
      
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

  async function handleApproveCancel(orderId) {
  try {
    await updateAdminOrderStatus(orderId, "CANCELLED");
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o)
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: "CANCELLED" }));
    }
  } catch (err) {
    console.error(err);
    alert("Error al aprobar la cancelación");
  }
}

  async function handleRejectCancel(orderId) {
    try {
      await updateAdminOrderStatus(orderId, "PENDING");
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: "PENDING" } : o)
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: "PENDING" }));
      }
    } catch (err) {
      console.error(err);
      alert("Error al rechazar la cancelación");
    }
  }
  
  async function handleDownloadPDF() {
    if (!selectedOrder) return;
    
    // Carga jsPDF solo cuando se necesita (code-splitting)
    const { generateOrderPDF } = await import("../../utils/generateOrderPDF");
    await generateOrderPDF(selectedOrder);
  }

  async function handleSaveNotes() {
    if (!selectedOrder) return;
  
    try {
      setSavingNotes(true);
  
      await updateAdminOrder(selectedOrder.id, {
        notes: selectedOrder.notes || ""
      });
  
      setEmailToast("✓ Descripción guardada");
  
    } catch (err) {
  
      console.error("Error al guardar la descripción:", err);
  
      setEmailToast("✗ No se pudo guardar la descripción");
  
    } finally {
  
      setSavingNotes(false);
  
      setTimeout(() => setEmailToast(""), 3000);
    }
  }

  
  
  function handleStartEditOrder() {
    if (
      !selectedOrder ||
      selectedOrder.status?.toUpperCase() === "CANCELLED"
    ) {
      return;
    }
  
    setEditableItems(
      (selectedOrder.items || []).map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        variant_selection:
          typeof item.variant_selection === "string"
            ? JSON.parse(item.variant_selection || "{}")
            : item.variant_selection || {},
      }))
    );
  
    setSelectedProductId("");
    setSelectedProduct(null);
    setSelectedVariantId("");
    setNewItemQuantity(1);
    setAvailableProducts([]);
    setProductSearch("");
    setProductPage(1);
    setProductTotalPages(1);
    setShowProductModal(false);
    setIsEditingOrder(true);
  }


  async function loadAvailableProducts(
    page = 1,
    search = productSearch
  ) {
    if (!selectedOrder?.company_id) {
      setEmailToast("El pedido no tiene una empresa asociada.");
      return;
    }
  
    try {
      setLoadingProducts(true);
  
      const response = await getProducts(
        selectedOrder.company_id,
        page,
        20,
        search.trim()
      );
  
      const result = response?.data;
  
      setAvailableProducts(
        (result?.products || []).filter(
          (product) => product.is_active
        )
      );
  
      setProductPage(result?.page || page);
      setProductTotalPages(result?.total_pages || 1);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setEmailToast("No se pudo cargar el catálogo de productos.");
    } finally {
      setLoadingProducts(false);
    }
  }

  
  async function handleOpenProductModal() {
    setSelectedProductId("");
    setSelectedProduct(null);
    setSelectedVariantId("");
    setNewItemQuantity(1);
    setProductSearch("");
    setProductPage(1);
    setShowProductModal(true);
  
    await loadAvailableProducts(1, "");
  }
  
  function handleCloseProductModal() {
    setShowProductModal(false);
    setSelectedProductId("");
    setSelectedProduct(null);
    setSelectedVariantId("");
    setNewItemQuantity(1);
  }
  
  async function handleSearchProducts() {
    await loadAvailableProducts(1, productSearch);
  }
  
  async function handleChangeProductPage(nextPage) {
    if (nextPage < 1 || nextPage > productTotalPages) {
      return;
    }
  
    await loadAvailableProducts(nextPage, productSearch);
  }

  
  function handleCancelEditOrder() {
    setEditableItems([]);
    setIsEditingOrder(false);
  }
  
  
  function handleChangeItemQuantity(itemId, quantity) {
    setEditableItems((items) =>
      items.map((item) => {
        const currentId = item.id || item.tempId;
  
        return currentId === itemId
          ? { ...item, quantity }
          : item;
      })
    );
  }
  
  function handleRemoveOrderItem(itemId) {
    setEditableItems((items) =>
      items.filter((item) => (item.id || item.tempId) !== itemId)
    );
  }


  
  function handleAddProductToOrder() {
    if (!selectedProduct) {
      setEmailToast("Seleccioná un producto.");
      return;
    }
  
    const quantity = Number(newItemQuantity);
  
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setEmailToast("Ingresá una cantidad entera mayor que cero.");
      return;
    }
  
    const activeVariants = (selectedProduct.variants || []).filter(
      (variant) => variant.is_active
    );

    if (activeVariants.length === 0) {
      setEmailToast("Este producto no tiene variantes activas disponibles.");
      return;
    }
  
    let selectedVariant = null;
  
    if (selectedProduct.has_variants) {
      selectedVariant = activeVariants.find(
        (variant) => variant.id === selectedVariantId
      );
  
      if (!selectedVariant) {
        setEmailToast("Seleccioná una variante disponible.");
        return;
      }
    } else if (activeVariants.length > 0) {
      selectedVariant = activeVariants[0];
    }
  
    const variantSelection = selectedVariant
      ? { variant_id: selectedVariant.id }
      : {};
  
    const duplicate = editableItems.some((item) => {
      if (item.product_id !== selectedProduct.id) {
        return false;
      }
  
      const existingSelection =
        typeof item.variant_selection === "string"
          ? JSON.parse(item.variant_selection || "{}")
          : item.variant_selection || {};
  
      return (
        (existingSelection.variant_id || null) ===
        (variantSelection.variant_id || null)
      );
    });
  
    if (duplicate) {
      setEmailToast(
        "Ese producto y variante ya están en el pedido. Editá su cantidad en la lista."
      );
      return;
    }
  
    setEditableItems((items) => [
      ...items,
      { 
        tempId: crypto.randomUUID(),
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_code: selectedProduct.code || "",
        quantity,
        unit_price: Number(selectedVariant?.price || 0),
        subtotal: quantity * Number(selectedVariant?.price || 0),
        variant_selection: variantSelection,
        variant_sku: selectedVariant?.sku || null,
      },
    ]);
  
    handleCloseProductModal();
  }

  
  async function handleSaveOrderItems() {
    if (!selectedOrder || savingOrder) return;
  
    if (editableItems.length === 0) {
      setEmailToast("El pedido debe tener al menos un producto.");
      return;
    }
  
    const hasInvalidQuantity = editableItems.some(
      (item) =>
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
    );
  
    if (hasInvalidQuantity) {
      setEmailToast("Todas las cantidades deben ser mayores que cero.");
      return;
    }
  
    const items = editableItems.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      product_id: item.product_id,
      quantity: Number(item.quantity),
      variant_selection: item.variant_selection || {},
    }));
  
    try {
      setSavingOrder(true);
  
      await editAdminOrder(selectedOrder.id, { items });
  
      const [orderResponse] = await Promise.all([
        getAdminOrder(selectedOrder.id),
        loadOrders(),
      ]);
  
      setSelectedOrder(orderResponse.data);
      setIsEditingOrder(false);
      setEditableItems([]);
      setEmailToast("✓ Pedido actualizado");
    } catch (err) {
      console.error("Error al editar el pedido:", err);
  
      setEmailToast(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "No se pudo actualizar el pedido."
      );
    } finally {
      setSavingOrder(false);
      setTimeout(() => setEmailToast(""), 4000);
    }
  }


  async function handleSendEmail() {
    if (!selectedOrder) return;
    setSendingEmail(true);
    try {
      await sendOrderPDFByEmail(selectedOrder.id);
      setEmailToast("✓ Email enviado a la empresa");
    } catch (err) {
      console.error(err);
      setEmailToast("✗ Error al enviar email");
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailToast(""), 3000);
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

    const searchTerm = search.toLowerCase();

    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm) ||
      order.id?.toLowerCase().includes(searchTerm) ||
      order.company_name?.toLowerCase().includes(searchTerm) ||
      order.customer_email?.toLowerCase().includes(searchTerm);

    return matchesTab && matchesSearch;
  });

  function formatVariants(variantSelection) {
    if (!variantSelection) return null;
  
    const variants =
      typeof variantSelection === "string"
        ? JSON.parse(variantSelection)
        : variantSelection;
  
    // Ignorar variant_id interno; mostrar solo atributos legibles
    const entries = Object.entries(variants).filter(([key]) => key !== "variant_id");
  
    if (entries.length === 0) return null;
  
    return entries
      .map(([group, value]) => `${group}: ${value}`)
      .join(" · ");
  }

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
            <th>N° Pedido</th>
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
              <td>
                {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
              </td>
              <td>{order.company_name}</td>
              <td>{order.customer_email}</td>
              <td>
              <span
                className="status-badge"
                style={{
                  background:
                    order.status?.toUpperCase() === "CANCEL_REQUESTED" ? "#f97316" :
                    order.status?.toUpperCase() === "COMPLETED" ? "#2e7d32" :
                    order.status?.toUpperCase() === "CANCELLED" ? "#ef4444" :
                    "#6b7280",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {order.status}
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
            <div className="order-number">
              Pedido {selectedOrder.order_number || `#${selectedOrder.id.slice(0, 8).toUpperCase()}`}
            </div>
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
              <span className="order-info-label">
                Descripción para el fabricante
              </span>
            
              <textarea
                value={selectedOrder.notes || ""}
                onChange={(e) =>
                  setSelectedOrder(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
                placeholder="Agrega una descripción o instrucciones para el fabricante..."
                rows={4}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            
              <button
                className="snb-btn"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{
                  marginTop: "8px"
                }}
              >
                {savingNotes ? "Guardando..." : "Guardar descripción"}
              </button>
            </div>
          </div>

          {selectedOrder.customer_notes && (
            <div style={{
              background: "#fef3c7",
              borderLeft: "4px solid #f59e0b",
              padding: "12px 16px",
              marginBottom: "20px",
              borderRadius: "4px"
            }}>
              <strong style={{ color: "#92400e", fontSize: "13px" }}>📝 Nota del cliente:</strong>
              <p style={{ margin: "4px 0 0 0", color: "#78350f", fontSize: "14px" }}>
                {selectedOrder.customer_notes}
              </p>
            </div>
          )}
        
          
          <h3>Productos</h3>
          
          {!isEditingOrder ? (
            <>
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
                  {(selectedOrder.items || []).map((item, index) => (
                    <tr key={item.id || `${item.product_name}-${index}`}>
                      <td>
                        <div>{item.product_name}</div>
          
                        {item.variant_sku && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#2563eb",
                              fontWeight: 600,
                              marginTop: "4px",
                            }}
                          >
                            SKU: {item.variant_sku}
                          </div>
                        )}
          
                        {formatVariants(item.variant_selection) && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            {formatVariants(item.variant_selection)}
                          </div>
                        )}
                      </td>
          
                      <td>{item.quantity}</td>
                      <td>${Number(item.unit_price).toFixed(2)}</td>
                      <td>${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          
              {selectedOrder.status?.toUpperCase() !== "CANCELLED" && (
                <button
                  type="button"
                  className="snb-btn"
                  onClick={handleStartEditOrder}
                  style={{ marginTop: "12px" }}
                >
                  Editar productos
                </button>
              )}
            </>
          ) : (
            <>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio unitario</th>
                    <th>Cantidad</th>
                    <th>Subtotal estimado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
          
                <tbody>
                  {editableItems.map((item) => (
                    <tr key={item.id || item.tempId}>
                      <td>
                        <div>{item.product_name}</div>
          
                        {item.variant_sku && (
                          <div style={{ fontSize: "12px", color: "#2563eb" }}>
                            SKU: {item.variant_sku}
                          </div>
                        )}
          
                        {formatVariants(item.variant_selection) && (
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {formatVariants(item.variant_selection)}
                          </div>
                        )}
                      </td>
          
                      <td>${Number(item.unit_price).toFixed(2)}</td>
          
                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(event) =>
                            handleChangeItemQuantity(
                              item.id || item.tempId,
                              event.target.value
                            )
                          }
                          style={{ width: "90px", padding: "6px" }}
                        />
                      </td>
          
                      <td>
                        $
                        {(
                          Number(item.unit_price || 0) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </td>
          
                      <td>
                        <button
                          type="button"
                          className="snb-btn-secondary"
                          onClick={() => handleRemoveOrderItem(item.id || item.tempId)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <strong>
                  Total estimado: $
                  {editableItems
                    .reduce(
                      (total, item) =>
                        total +
                        Number(item.unit_price || 0) *
                          Number(item.quantity || 0),
                      0
                    )
                    .toFixed(2)}
                </strong>
          
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleOpenProductModal}
                    disabled={savingOrder}
                  >
                    + Agregar producto
                  </button>
                  
                  <button
                    type="button"
                    className="snb-btn-secondary"
                    onClick={handleCancelEditOrder}
                    disabled={savingOrder}
                  >
                    Descartar cambios
                  </button>
          
                  <button
                    type="button"
                    className="snb-btn"
                    onClick={handleSaveOrderItems}
                    disabled={savingOrder}
                  >
                    {savingOrder ? "Guardando..." : "Guardar pedido"}
                  </button>
                </div>
              </div>
            </>
          )}

        
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
            <div className="order-total" style={{ margin: 0 }}>
              Total: ${selectedOrder.total_amount}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="snb-btn-secondary"
              onClick={handleDownloadPDF}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              Descargar PDF
            </button>

            <button
              className="snb-btn"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {sendingEmail ? "Enviando..." : "Enviar por email"}
            </button>
            </div>

            {/* BOTÓN NATIVO PARA EJECUTAR EL CIERRE PROPIO */}
            {selectedOrder.status?.toUpperCase() === "CANCEL_REQUESTED" ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="snb-btn"
                  onClick={() => handleApproveCancel(selectedOrder.id)}
                  style={{ backgroundColor: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  Aprobar cancelación
                </button>
                <button
                  className="snb-btn-secondary"
                  onClick={() => handleRejectCancel(selectedOrder.id)}
                >
                  Rechazar solicitud
                </button>
              </div>
            ) : (
              selectedOrder.status?.toUpperCase() !== "COMPLETED" && (
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
              )
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
      
      {showProductModal && (
        <div
          className="product-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseProductModal();
            }
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <header className="product-modal-header">
              <h2 id="product-modal-title">
                Agregar producto al pedido
              </h2>
      
              <button
                type="button"
                onClick={handleCloseProductModal}
                aria-label="Cerrar ventana"
              >
                ×
              </button>
            </header>
      
            <div className="product-modal-search">
              <input
                type="search"
                value={productSearch}
                onChange={(event) =>
                  setProductSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearchProducts();
                  }
                }}
                placeholder="Buscar por nombre o código..."
              />
      
              <button
                type="button"
                onClick={handleSearchProducts}
                disabled={loadingProducts}
              >
                Buscar
              </button>
            </div>
      
            {loadingProducts ? (
              <p>Cargando productos...</p>
            ) : availableProducts.length === 0 ? (
              <p>No se encontraron productos disponibles.</p>
            ) : (
              <div className="product-modal-list">
                {availableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={
                      selectedProductId === product.id
                        ? "product-modal-item selected"
                        : "product-modal-item"
                    }
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setSelectedProduct(product);
      
                      const activeVariants = (
                        product.variants || []
                      ).filter((variant) => variant.is_active);
      
                      setSelectedVariantId(
                        product.has_variants
                          ? activeVariants[0]?.id || ""
                          : ""
                      );
                    }}
                  >
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        Código: {product.code || "Sin código"}
                      </small>
                    </span>
      
                    <span>
                      {product.has_variants
                        ? "Con variantes"
                        : "Producto simple"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            
            {selectedProduct && (
              <div className="product-modal-selection">
                <h3>{selectedProduct.name}</h3>

                {selectedProduct.has_variants && (
                  <div className="product-modal-field">
                    <label htmlFor="product-variant">
                      Variante
                    </label>

                    <select
                      id="product-variant"
                      value={selectedVariantId}
                      onChange={(event) =>
                        setSelectedVariantId(event.target.value)
                      }
                    >
                      <option value="">
                        Seleccioná una variante
                      </option>

                      {(selectedProduct.variants || [])
                        .filter((variant) => variant.is_active)
                        .map((variant) => (
                          <option
                            key={variant.id}
                            value={variant.id}
                          >
                            {variant.sku || variant.id}
                            {variant.attributes &&
                            Object.keys(variant.attributes).length > 0
                              ? ` — ${Object.entries(variant.attributes)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(", ")}`
                              : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="product-modal-field">
                  <label htmlFor="product-quantity">
                    Cantidad
                  </label>

                  <input
                    id="product-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={newItemQuantity}
                    onChange={(event) =>
                      setNewItemQuantity(event.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddProductToOrder}
                  disabled={loadingProducts}
                >
                  Agregar al pedido
                </button>
              </div>
            )}

      
            <footer className="product-modal-footer">
              <button
                type="button"
                onClick={() =>
                  handleChangeProductPage(productPage - 1)
                }
                disabled={
                  loadingProducts || productPage <= 1
                }
              >
                Anterior
              </button>
      
              <span>
                Página {productPage} de {productTotalPages}
              </span>
      
              <button
                type="button"
                onClick={() =>
                  handleChangeProductPage(productPage + 1)
                }
                disabled={
                  loadingProducts ||
                  productPage >= productTotalPages
                }
              >
                Siguiente
              </button>
            </footer>
          </section>
        </div>
      )}

      {emailToast && <div className="toast">{emailToast}</div>}

    </div>
  );
}