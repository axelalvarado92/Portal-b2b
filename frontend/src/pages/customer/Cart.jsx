import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, updateCartItem, deleteCartItem, clearCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";
import "./Cart.css";
import { createOrder } from "../../services/ordersService";

export default function Cart() {

  const { selectedCompany } = useCompany();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadCart() {
    if (!selectedCompany) return;
    try {
      const response = await getCart(selectedCompany.id);
      setCart(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, [selectedCompany]);

  async function handleUpdateQuantity(itemId, newQty) {
    if (newQty <= 0) return;
    try {
      await updateCartItem(itemId, newQty);
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(itemId) {
    try {
      await deleteCartItem(itemId);
      showToast("✓ Producto eliminado");
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClear() {
    if (!selectedCompany) return;
    try {
      await clearCart(selectedCompany.id);
      showToast("✓ Carrito vaciado");
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  }

  const [confirming, setConfirming] = useState(false);

async function handleConfirmOrder() {
  if (!selectedCompany || !cart?.cart_id) return;
  setConfirming(true);
  try {
    await createOrder(selectedCompany.id, cart.cart_id);
    showToast("✓ Pedido confirmado");
    setTimeout(() => navigate("/orders"), 1500);
  } catch (err) {
    console.error(err);
    showToast("✗ Error al confirmar pedido");
  } finally {
    setConfirming(false);
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

      {!cart || cart.items.length === 0 ? (
        <div className="cart-empty">
          <p>Tu carrito está vacío.</p>
          <button className="snb-btn" onClick={() => navigate("/products")}>
            Ver catálogo
          </button>
        </div>
      ) : (
        <>
         <table className="cart-table">
            <thead>
              <tr>
                <th className="cart-col-code">Código</th>
                <th className="cart-col-name">Producto</th>
                <th className="cart-col-price">Precio</th>
                <th className="cart-col-qty">Cantidad</th>
                <th className="cart-col-subtotal">Subtotal</th>
                <th className="cart-col-action">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map(item => (
                <tr key={item.id}>
                  <td className="cart-col-code">{item.product_code}</td>
                  <td className="cart-col-name">{item.product_name}</td>
                  <td className="cart-col-price">${Number(item.price).toFixed(2)}</td>
                  <td className="cart-col-qty">
                    <div className="qty-control">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="qty-number">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  <td className="cart-col-subtotal">${Number(item.subtotal).toFixed(2)}</td>
                  <td className="cart-col-action">
                    <button className="cart-delete-btn" onClick={() => handleDelete(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-footer">
            <button className="cart-clear-btn" onClick={handleClear}>
              Vaciar carrito
            </button>
            <div className="cart-total">
              Total: <strong>${cart.total.toFixed(2)}</strong>
            </div>
            <button
              className="snb-btn"
              onClick={handleConfirmOrder}
              disabled={confirming}
            >
              {confirming ? "Confirmando..." : "Confirmar pedido"}
            </button>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}

    </div>
  );
}