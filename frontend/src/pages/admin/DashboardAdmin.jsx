import { Link } from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";

import "./DashboardAdmin.css";

import {
  Users,
  Building2,
  Package,
  ClipboardList,
  FileText,
} from "lucide-react";

import {
  getDashboardReport,
} from "../../services/reportService";

export default function DashboardAdmin() {

  const [stats, setStats] =
    useState(null);

  useEffect(() => {

    async function loadDashboard() {

      try {

        const response =
          await getDashboardReport();

        setStats(
          response.data
        );

      } catch (err) {

        console.error(err);

      }

    }

    loadDashboard();

  }, []);

  return (

    <div className="dashboard-admin">

      <h1 className="dashboard-title">
        Hola Seba, ¿por dónde arrancamos hoy?
      </h1>

      <div className="modules-grid">

        <Link
          to="/admin/users"
          className="module-card"
        >

          <div className="module-icon">
            <Users size={38} />
          </div>

          <h3>
            Usuarios
          </h3>

          <p className="dashboard-card-value">
            {stats?.total_clients || 0}
            {" "}usuarios
          </p>

        </Link>

        <Link
          to="/admin/companies"
          className="module-card"
        >

          <div className="module-icon">
            <Building2 size={38} />
          </div>

          <h3>
            Empresas
          </h3>

          <p className="dashboard-card-value">
            {stats?.total_companies || 0}
            {" "}empresas
          </p>

        </Link>

        <Link
          to="/admin/products"
          className="module-card"
        >

          <div className="module-icon">
            <Package size={38} />
          </div>

          <h3>
            Productos
          </h3>

          <p className="dashboard-card-value">
            Catálogo disponible
          </p>

        </Link>

        <Link
          to="/admin/orders"
          className="module-card"
        >

          <div className="module-icon">
            <ClipboardList size={38} />
          </div>

          <h3>
            Pedidos
          </h3>

          <p className="dashboard-card-value">
            {stats?.total_orders || 0}
            {" "}pedidos
          </p>

        </Link>

        <Link
          to="/invoices"
          className="module-card"
        >

          <div className="module-icon">
            <FileText size={38} />
          </div>

          <h3>
            Facturas
          </h3>

          <p className="dashboard-card-value">
            $
            {stats?.total_invoiced || 0}
          </p>

        </Link>

      </div>

    </div>

  );

}