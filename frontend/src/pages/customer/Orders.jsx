import {
  useEffect,
  useState,
} from "react";

import {
  getOrders,
  getOrder,
} from "../../services/ordersService";

import {
  useCompany,
} from "../../context/CompanyContext";

export default function Orders() {

  const {
    selectedCompany,
  } = useCompany();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  useEffect(() => {

    async function loadOrders() {

      if (!selectedCompany)
        return;

      try {

        const response =
          await getOrders(
            selectedCompany.id
          );

        console.log(
          "ORDERS:",
          response
        );

        setOrders(
          response.data || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadOrders();

  }, [selectedCompany]);

  async function handleViewOrder(
    orderId
  ) {

    try {

      const response =
        await getOrder(
          orderId
        );

      setSelectedOrder(
        response.data
      );

    } catch (err) {

      console.error(err);

    }

  }

  if (loading) {

    return (
      <p>
        Cargando pedidos...
      </p>
    );

  }

  return (

    <div
      style={{
        padding: "40px",
      }}
    >

      <h1>
        Pedidos
      </h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
        }}
      >

        <thead>

          <tr>

            <th style={thStyle}>
              Fecha
            </th>

            <th style={thStyle}>
              Empresa
            </th>

            <th style={thStyle}>
              Estado
            </th>

            <th style={thStyle}>
              Total
            </th>

            <th style={thStyle}>
              Acción
            </th>

          </tr>

        </thead>

        <tbody>

          {orders.map(order => (

            <tr key={order.id}>

              <td style={tdStyle}>
                {new Date(
                  order.created_at
                ).toLocaleDateString()}
              </td>

              <td style={tdStyle}>
                {order.company_name}
              </td>

              <td style={tdStyle}>
                {order.status}
              </td>

              <td style={tdStyle}>
                $
                {order.total_amount}
              </td>

              <td style={tdStyle}>

                <button
                  onClick={() =>
                    handleViewOrder(
                      order.id
                    )
                  }
                >
                  Ver detalle
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {selectedOrder && (

        <div
          style={{
            marginTop: "30px",
            background: "#fff",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >

          <h2>
            Pedido
          </h2>

          <p>
            Estado:
            {" "}
            {selectedOrder.status}
          </p>

          <p>
            Empresa:
            {" "}
            {selectedOrder.company_name}
          </p>

          <hr />

          {selectedOrder.items.map(item => (

            <div
              key={item.product_id}
              style={{
                marginBottom: "10px",
              }}
            >

              <strong>
                {item.product_name}
              </strong>

              <p>
                Cantidad:
                {" "}
                {item.quantity}
              </p>

              <p>
                Precio:
                {" "}
                $
                {item.unit_price}
              </p>

              <p>
                Subtotal:
                {" "}
                $
                {item.subtotal}
              </p>

            </div>

          ))}

          <hr />

          <h3>
            Total:
            {" "}
            $
            {selectedOrder.total_amount}
          </h3>

        </div>

      )}

    </div>

  );

}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  background: "#f5f5f5",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};