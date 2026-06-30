import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoSNB from "../assets/logo-snb.png"; // Importa el logo
import "./AdminLayout.css"; // Crearemos este archivo

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-brand">
          <img src={logoSNB} alt="SNB" className="admin-logo" />
        </div>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link">Inicio</Link>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}