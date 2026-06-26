import { Link } from "react-router-dom";

import "./DashboardCustomer.css";

import {
  ShoppingCart,
  Package,
  ClipboardList,
  FileText,
  User,
  Building2,
} from "lucide-react";

export default function DashboardCustomer() {
  return (
    <div className="dashboard-admin">

      <h1 className="dashboard-title">
        Bienvenido, ¿qué necesitas hacer hoy?
      </h1>

      <div className="modules-grid">
        
        <Link
          to="/companies"
          className="module-card"
        >
          <div className="module-icon">
            <Building2 size={38} />
          </div>

          <h3>Proveedores</h3>

          <p className="dashboard-card-value">
            Ver productos 
          </p>
        </Link>

        <Link
          to="/cart"
          className="module-card"
        >
          <div className="module-icon">
            <ShoppingCart size={38}/>
          </div>

          <h3>Carrito</h3>

          <p className="dashboard-card-value">
            Ver carrito
          </p>
        </Link>

        <Link
          to="/orders"
          className="module-card"
        >
          <div className="module-icon">
            <ClipboardList size={38} />
          </div>

          <h3>Mis Pedidos</h3>

          <p className="dashboard-card-value">
            Consultar historial
          </p>
        </Link>

        <Link
          to="/profile"
          className="module-card"
        >
          <div className="module-icon">
            <User size={38} />
          </div>

          <h3>Mi Perfil</h3>

          <p className="dashboard-card-value">
            Datos de usuario
          </p>
        </Link>

      </div>

    </div>
  );
}