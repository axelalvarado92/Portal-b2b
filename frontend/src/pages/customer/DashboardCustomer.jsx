import { Link } from "react-router-dom";

import "./DashboardCustomer.css";

import {
  ShoppingCart,
  Package,
  ClipboardList,
  FileText,
  User,
} from "lucide-react";

export default function DashboardCustomer() {
  return (
    <div className="dashboard-admin">

      <h1 className="dashboard-title">
        Bienvenido, ¿qué necesitas hacer hoy?
      </h1>

      <div className="modules-grid">

        <Link
          to="/products"
          className="module-card"
        >
          <div className="module-icon">
            <Package size={38} />
          </div>

          <h3>Catálogo</h3>

          <p className="dashboard-card-value">
            Ver productos disponibles
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