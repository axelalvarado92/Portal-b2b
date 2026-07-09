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
  UserPlus,
} from "lucide-react";

import {
  getDashboardReport,
} from "../../services/reportService";

import { getAccountRequests } from "../../services/accountRequestsService";

export default function DashboardAdmin() {
  console.log("DASHBOARD ADMIN MOUNTED");

  const [stats, setStats] =
    useState(null);

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {

    async function loadDashboard() {

      try {

        const response =
          await getDashboardReport();
          console.log("DASHBOARD RESPONSE:", response);
        

        setStats(
          response.data
        );

      } catch (err) {
        console.error("DASHBOARD ERROR:", err);

      }

    }

    loadDashboard();

  }, []);

  useEffect(() => {
  async function fetchCount() {
    try {
      const data = await getAccountRequests();
      // Si es un array, contamos los elementos. Si viene dentro de .data, también.
      if (Array.isArray(data)) {
        setPendingCount(data.length);
      } else if (data && Array.isArray(data.data)) {
        setPendingCount(data.data.length);
      }
    } catch (err) {
      console.error("No se pudo cargar el contador de solicitudes", err);
    }
  }
  fetchCount();
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
            Proveedores
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
            Gestion de productos
          </p>

        </Link>

        <Link to="/admin/account-requests" className="module-card">
          <div className="module-icon">
            <UserPlus size={38} />
          </div>
          <h3>Solicitudes</h3>
          <p className="dashboard-card-value">
            {pendingCount > 0 ? `${pendingCount} pendientes` : "Sin solicitudes pendientes"}
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
            {" "}pendientes
          </p>

        </Link>

      </div>

    </div>

  );

}