import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCarts, updateCartItem, deleteCartItem, clearCart } from "../../services/cartService";
import { createOrder } from "../../services/ordersService";
import "./Cart.css";

export default function Cart() {

  const navigate = useNavigate();

  const [carts, setCarts] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

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
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(itemId) {
    try {
      await deleteCartItem(itemId);
      showToast("✓ Producto eliminado");
      await loadCarts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClear(companyId) {
    try {
      await clearCart(companyId);
      showToast("✓ Carrito vaciado");
      await loadCarts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmOrder(cart) {
    setConfirmingId(cart.cart_id);
    try {
      await createOrder(cart.company_id, cart.cart_id);
      showToast(`✓ Pedido confirmado para ${cart.company_name}`);
      await loadCarts();
    } catch (err) {
      console.error(err);
      showToast("✗ Error al confirmar pedido");
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) return <p className="cart-loading">Cargando carrito...</p>;

  return (
    <div className="cart-wrapper">

      <div className="cart-header">
        <button className="cart-back-btn" onClick={() => navigate("/products")}>
          ← Volver al catálogo
        </button>
        <h1>Mi carrito</h1>
      </div>

      {carts.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está vacío.</p>
          <button className="snb-btn" onClick={() => navigate("/products")}>
            Ver catálogo
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
                  {cart.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.product_code}</td>
                      <td>{item.product_name}</td>
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
                  ))}
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
                  className="snb-btn"
                  onClick={() => handleConfirmOrder(cart)}
                  disabled={confirmingId === cart.cart_id}
                >
                  {confirmingId === cart.cart_id ? "Confirmando..." : "Confirmar pedido"}
                </button>
              </div>

            </div>
          ))}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}

    </div>
  );
}