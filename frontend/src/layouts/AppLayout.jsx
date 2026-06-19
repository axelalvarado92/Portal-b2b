import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import logoSNB from "../assets/logo-snb.png";

import "./AppLayout.css";

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

    <div className="app-layout">

<header className="app-header">

  <div className="app-brand">
    <img src={logoSNB} alt="SNB" className="app-logo" />
    <span className="app-subtitle">Representaciones Comerciales</span>
  </div>

  <div className="app-user-section">
    <Link
      className="app-nav-link"
      to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}
    >
      Inicio
    </Link>
    <button className="app-logout-btn" onClick={handleLogout}>
      Cerrar sesión
    </button>
  </div>

</header>

      <main className="app-content">

        <Outlet />

      </main>

    </div>

  );

}