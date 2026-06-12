import {
  useEffect,
  useState,
} from "react";

import {
  useCompany,
} from "../context/CompanyContext";

import {
  createOrder,
} from "../services/ordersService";

import {
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "../services/cartService";

export default function Cart() {

  const {
    selectedCompany,
  } = useCompany();

  const [cart, setCart] =
    useState(null);

  async function loadCart() {

    if (!selectedCompany)
      return;

    try {

      const response =
        await getCart(
          selectedCompany.id
        );

      setCart(
        response.data
      );

    } catch (err) {

      console.error(err);

    }

  }

  useEffect(() => {

    loadCart();

  }, [selectedCompany]);

  async function increaseItem(
    item
  ) {

    try {

      await updateCartItem(
        item.id,
        item.quantity + 1
      );

      loadCart();

    } catch (err) {

      console.error(err);

    }

  }

  async function decreaseItem(
    item
  ) {

    try {

      if (item.quantity <= 1)
        return;

      await updateCartItem(
        item.id,
        item.quantity - 1
      );

      loadCart();

    } catch (err) {

      console.error(err);

    }

  }

  async function removeItem(
    itemId
  ) {

    try {

      await deleteCartItem(
        itemId
      );

      loadCart();

    } catch (err) {

      console.error(err);

    }

  }

  async function handleClearCart() {

    try {

      await clearCart(
        selectedCompany.id
      );

      loadCart();

    } catch (err) {

      console.error(err);

    }

  }

  async function handleCreateOrder() {

  try {

    const response =
      await createOrder(
        selectedCompany.id,
        cart.cart_id
      );

    alert(
      `Pedido creado: ${response.data.order_id}`
    );

    loadCart();

  } catch (err) {

    console.error(err);

    alert(
      "Error al crear pedido"
    );

  }

}

  if (!cart) {

    return (
      <p>
        Cargando carrito...
      </p>
    );

  }

  return (
    <div
      style={{
        padding: "40px",
      }}
    >

      <h1>Carrito</h1>

      {cart.items.length === 0 ? (

        <p>
          Carrito vacío
        </p>

      ) : (

        <>
          {cart.items.map(item => (

            <div
              key={item.id}
              style={{
                border:
                  "1px solid #ddd",
                padding: "10px",
                marginBottom:
                  "10px",
              }}
            >

              <h3>
                {item.product_name}
              </h3>

              <div>

                <button
                  onClick={() =>
                    decreaseItem(item)
                  }
                >
                  -
                </button>

                {" "}

                {item.quantity}

                {" "}

                <button
                  onClick={() =>
                    increaseItem(item)
                  }
                >
                  +
                </button>

              </div>

              <br />

              <p>
                Subtotal:
                {" "}
                $
                {item.subtotal}
              </p>

              <button
                onClick={() =>
                  removeItem(item.id)
                }
              >
                Eliminar
              </button>

            </div>

          ))}

          <button
            onClick={
              handleClearCart
            }
          >
            Vaciar carrito
          </button>

          <button
            onClick={
              handleCreateOrder
            }
            style={{
              marginLeft: "10px"
            }}
          >
            Confirmar pedido
          </button>

          <hr />

          <h2>
            Total:
            {" "}
            $
            {cart.total}
          </h2>
        </>

      )}

    </div>
  );
}