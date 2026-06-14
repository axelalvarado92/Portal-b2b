import {
  useEffect,
  useState,
} from "react";

import {
  getAccountSummary,
} from "../../services/reportService";

import {
  Link,
} from "react-router-dom";

export default function DashboardCustomer() {

  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadSummary() {

      try {

        const response =
          await getAccountSummary();

        console.log(
          "SUMMARY:",
          response
        );

        setSummary(
          response.data
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadSummary();

  }, []);

  if (loading) {

    return (
      <p>
        Cargando dashboard...
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
        Bienvenido
      </h1>

      <p>
        {summary?.full_name}
      </p>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >

        <div style={cardStyle}>

          <h3>
            Saldo actual
          </h3>

          <h2>
            $
            {summary?.current_balance || 0}
          </h2>

        </div>

        <div style={cardStyle}>

          <h3>
            Movimientos
          </h3>

          <h2>
            {
              summary?.movements?.length || 0
            }
          </h2>

        </div>

      </div>

      <div
        style={{
          marginTop: "40px",
          display: "flex",
          gap: "15px",
        }}
      >

        <Link
          to="/products"
        >
          Ver Productos
        </Link>

        <Link
          to="/cart"
        >
          Ver Carrito
        </Link>

        <Link
          to="/orders"
        >
          Mis Pedidos
        </Link>

      </div>

    </div>

  );

}

const cardStyle = {

  background: "#fff",

  padding: "20px",

  borderRadius: "10px",

  border:
    "1px solid #ddd",

};