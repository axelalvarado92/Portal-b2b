import { useState, useRef } from "react"; // 1. Importar useState
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, User } from "lucide-react"; // Agregué un icono de usuario
import logoSNB from "../assets/logo-snb.png";
import "./AppLayout.css";

export default function AppLayout() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 2. Estado para el menú

  const { logout } = useAuth();
  const { cartCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const timeoutRef = useRef(null);

  const openMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 200); // 200ms de gracia para cruzar el gap
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-brand">
          <img src={logoSNB} alt="SNB" className="app-logo" />
        </div>

        <nav className="app-nav">
          <Link className="app-nav-link" to="/dashboard">Inicio</Link>
          <Link className="app-nav-link" to="/companies">Proveedores</Link>
          <Link className="app-nav-link" to="/orders">Pedidos</Link>

          <div 
            className="dropdown-container"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <button className="app-nav-link dropdown-toggle">
              Mi cuenta
            </button>
            
            {isMenuOpen && (
              <div className="dropdown-menu">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mi perfil
                </Link>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="app-user-section">
          <Link to="/cart" className="cart-button">
            <ShoppingCart size={30} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}