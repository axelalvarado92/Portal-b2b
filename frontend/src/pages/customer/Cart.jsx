import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCarts, updateCartItem, deleteCartItem, clearCart } from "../../services/cartService";
import { createOrder } from "../../services/ordersService";
import { useCart } from "../../context/CartContext";
import "./Cart.css";

// Mapa de colores para variantes//
const COLOR_MAP = {
  rojo: "#dc2626",
  celeste: "#0ea5e9",
  blanco: "#f3f4f6",
  amarillo: "#facc15",
  verde: "#16a34a",
  naranja: "#f97316",
  negro: "#1f2937",
  azul: "#2563eb",
  violeta: "#7c3aed",
  rosa: "#ec4899",
  gris: "#6b7280",
  marrón: "#92400e",
  beige: "#d6c0a3",
  dorado: "#fbbf24",
  plateado: "#9ca3af",
  turquesa: "#14b8a6",
  fucsia: "#d946ef",
  coral: "#f43f5e",
  "amarillo fluo": "#facc15",
  "amarillo claro": "#fef08a",
  "rosa bebe": "#f9a8d4",
  "rosa bebé": "#f9a8d4",
  "rosa viejo": "#f472b6",
  "azul marino": "#1e3a8a",
  "azul oscuro": "#1e40af",
  "verde limon": "#84cc16",
  "verde limón": "#84cc16",
  "verde oscuro": "#166534",
  "verde agua": "#2dd4bf",
  "verde militar": "#4d7c0f",
  "rojo oscuro": "#991b1b",
  "bordo": "#7f1d1d",
  "bordó": "#7f1d1d",
  "gris oscuro": "#374151",
  "gris claro": "#d1d5db",
  "celeste oscuro": "#0369a1",
  "naranja claro": "#fdba74",
  "violeta claro": "#a78bfa",
  "turquesa oscuro": "#0f766e",
  "blanco roto": "#e5e7eb",
};

export default function Cart() {

  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [carts, setCarts] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [customerNotes, setCustomerNotes] = useState({});
  const [activeNoteCartId, setActiveNoteCartId] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadCarts() {
    try {
      const response = await getAllCarts();
      setCarts(response.data.carts || []);
      setGrandTotal(response.data.grand_total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCarts();
  }, []);

  async function handleUpdateQuantity(itemId, newQty) {
    if (newQty <= 0) return;
    try {
      await updateCartItem(itemId, newQty);
      await loadCarts();
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(itemId) {
    try {
      await deleteCartItem(itemId);
      showToast("✓ Producto eliminado");
      await loadCarts();
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClear(companyId) {
    try {
      await clearCart(companyId);
      showToast("✓ Carrito vaciado");
      await loadCarts();
      await refreshCart();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmOrder(cart, notes = "") {
    setConfirmingId(cart.cart_id);
    try {
      await createOrder(cart.company_id, cart.cart_id, notes);
      showToast(`✓ Pedido confirmado para ${cart.company_name}`);
      await loadCarts();
      await refreshCart();
    } catch (err) {
      console.error(err);
      showToast("✗ Error al confirmar pedido");
    } finally {
      setConfirmingId(null);
    }
  }

  // ── helpers ───────────────────────────────────────────────

  function formatVariants(variantAttributes) {
    if (!variantAttributes) return null;
    
    const attrs = typeof variantAttributes === "string"
      ? JSON.parse(variantAttributes)
      : variantAttributes;

    const entries = Object.entries(attrs);
    if (entries.length === 0) return null;

    return entries.map(([group, value]) => `${group}: ${value}`).join(" · ");
  }

  // ── render ────────────────────────────────────────────────

  if (loading) return <p className="cart-loading">Cargando carrito...</p>;

  return (
    <div className="cart-wrapper">

      <div className="cart-header">
        <button className="cart-back-btn" onClick={() => navigate("/companies")}>
          ← Volver a proveedores
        </button>
        <h1>Mi carrito</h1>
      </div>

      {carts.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está vacío.</p>
          <button className="snb-btn" onClick={() => navigate("/companies")}>
            Ver proveedores
          </button>
        </div>
      ) : (
        <>
          {carts.length > 1 && (
            <div className="cart-grand-total">
              Total general: <strong>${grandTotal.toFixed(2)}</strong>
            </div>
          )}

          {carts.map(cart => (
            <div key={cart.cart_id} className="cart-company-section">

              <h2 className="cart-company-title">{cart.company_name}</h2>

              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map(item => {
                    const variantText = formatVariants(item.variant_attributes);

                    return (
                      <tr key={item.id}>
                      <td>
                        <div>{item.product_code}</div>
                        {item.variant_sku ? (
                          <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>
                            SKU: {item.variant_sku}
                          </div>
                        ) : (
                          variantText && (
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {variantText}
                            </div>
                          )
                        )}
                      </td>
                       <td>
                         <div className="cart-product-name">{item.product_name}</div>
                         {variantText && (
                           <div className="cart-variant-line">
                             {/* CÍRCULO DE COLOR */}
                             {(() => {
                               const attrs = typeof item.variant_attributes === "string"
                                 ? JSON.parse(item.variant_attributes)
                                 : (item.variant_attributes || {});
                               
                               const colorValue = attrs["Color"] || attrs["color"];
                               if (colorValue) {
                                 const colorHex = COLOR_MAP[colorValue.toLowerCase().trim()] || "#d1d5db";
                                 return (
                                   <span
                                     className="cart-color-dot"
                                     style={{ backgroundColor: colorHex }}
                                     title={colorValue}
                                   />
                                 );
                               }
                               return null;
                             })()}
                             {variantText}
                           </div>
                         )}
                       </td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>
                          <div className="qty-control">
                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </td>
                        <td>${item.subtotal.toFixed(2)}</td>
                        <td>
                          <button className="cart-delete-btn" onClick={() => handleDelete(item.id)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="cart-footer">
                <button className="cart-clear-btn" onClick={() => handleClear(cart.company_id)}>
                  Vaciar carrito
                </button>
                
                <div className="cart-total">
                  Total: <strong>${cart.total.toFixed(2)}</strong>
                </div>
                
                <button
                  className="snb-btn-secondary note-btn"
                  onClick={() => setActiveNoteCartId(cart.cart_id)}
                >
                  {customerNotes[cart.cart_id] ? "📝 Ver nota" : "📝 Agregar nota"}
                </button>
                
                <button
                  className="snb-btn"
                  onClick={() => handleConfirmOrder(cart, customerNotes[cart.cart_id])}
                  disabled={confirmingId === cart.cart_id}
                >
                  {confirmingId === cart.cart_id ? "Confirmando..." : "Confirmar pedido"}
                </button>
              </div>
            </div>
          ))}
          
        </>
      )}

     {/* MODAL DE NOTAS - fuera de todo, al nivel de la página */}
      {activeNoteCartId && (
        <div className="note-modal-overlay" onClick={() => setActiveNoteCartId(null)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nota para {carts.find(c => c.cart_id === activeNoteCartId)?.company_name}</h3>
            <textarea
              placeholder="Ej: Describe algún detalles del pedido..."
              value={customerNotes[activeNoteCartId] || ""}
              onChange={(e) => setCustomerNotes(prev => ({
                ...prev,
                [activeNoteCartId]: e.target.value
              }))}
            />
            <div className="note-modal-actions">
              <button className="snb-btn-secondary" onClick={() => setActiveNoteCartId(null)}>
                Cerrar
              </button>
              <button className="snb-btn" onClick={() => setActiveNoteCartId(null)}>
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

    </div>
  );
}