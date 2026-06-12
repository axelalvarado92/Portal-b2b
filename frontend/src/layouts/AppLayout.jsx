import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";

export default function AppLayout() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const {
    companies,
    selectedCompany,
    setSelectedCompany,
  } = useCompany();

  const handleLogout = () => {

    logout();

    navigate("/");

  };

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#f5f6f8",
    }}
  >

<header
  style={{
    background: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>

  <div>

    <h2
      style={{
        margin: 0,
      }}
    >
      Portal B2B
    </h2>

    <div
      style={{
        display: "flex",
        gap: "25px",
        marginTop: "15px",
      }}
    >

      <div
  style={{
    display: "flex",
    gap: "25px",
    marginTop: "15px",
  }}
>

  <Link to="/dashboard">
    Inicio
  </Link>

  {user?.role === "admin" ? (
    <>
      <Link to="/companies">
        Empresas
      </Link>

      <Link to="/products">
        Productos
      </Link>

      <Link to="/orders">
        Pedidos
      </Link>

      <Link to="/admin/users">
        Usuarios
      </Link>

      <Link to="/invoices">
        Facturas
      </Link>
    </>
  ) : (
    <>
      <Link to="/products">
        Productos
      </Link>

      <Link to="/cart">
        Carrito
      </Link>

      <Link to="/orders">
        Mis pedidos
      </Link>

      <Link to="/invoices">
        Facturas
      </Link>
    </>
  )}

</div>

    </div>

  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "20px",
    }}
  >

    <select
      value={selectedCompany?.id || ""}
      onChange={(e) => {

        const company =
          companies.find(
            c => c.id === e.target.value
          );

        setSelectedCompany(
          company
        );

      }}
      style={{
        padding: "8px",
        borderRadius: "8px",
      }}
    >

      {companies.map(company => (

        <option
          key={company.id}
          value={company.id}
        >
          {company.name}
        </option>

      ))}

    </select>

    <div>

      <div>
        {user?.email}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#666",
        }}
      >
        {user?.role}
      </div>

    </div>

    <button
      onClick={handleLogout}
      style={{
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      Salir
    </button>

  </div>

</header>

      <main>

        <Outlet />

      </main>

    </div>
  );
}