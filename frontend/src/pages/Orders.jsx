import { useEffect, useState } from "react";

import { useCompany } from "../context/CompanyContext";

import { getOrders } from "../services/ordersService";

export default function Orders() {

  const { selectedCompany } =
    useCompany();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadOrders() {

      if (!selectedCompany) return;

      try {

        const response =
          await getOrders(
            selectedCompany.id
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

  if (loading) {
    return <p>Cargando pedidos...</p>;
  }

  return (
    <div style={{ padding: "40px" }}>

      <h1>Mis pedidos</h1>

      {orders.map(order => (

        <div
          key={order.id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "10px",
          }}
        >

          <p>
            ID: {order.id}
          </p>

          <p>
            Estado: {order.status}
          </p>

          <p>
            Total:
            {" "}
            ${order.total_amount}
          </p>

          <p>
            Fecha:
            {" "}
            {order.created_at}
          </p>

        </div>

      ))}

    </div>
  );
}