import { Link } from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";

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

    <div
      style={{
        padding: "40px",
      }}
    >

      <h1>
        Panel de Administración
      </h1>

      <p>
        Gestión general del portal
      </p>
      
      {stats && (

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
    
        <div style={cardStyle}>
          <h3>Pedidos</h3>
          <h1>{stats.total_orders}</h1>
        </div>
    
        <div style={cardStyle}>
          <h3>Clientes</h3>
          <h1>{stats.total_clients}</h1>
        </div>
    
        <div style={cardStyle}>
          <h3>Empresas</h3>
          <h1>{stats.total_companies}</h1>
        </div>
    
        <div style={cardStyle}>
          <h3>Facturado</h3>
          <h1>
            $
            {stats.total_invoiced}
          </h1>
        </div>
    
        <div style={cardStyle}>
          <h3>Comisiones</h3>
          <h1>
            $
            {stats.total_commissions}
          </h1>
        </div>
    
      </div>
    
    )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >

        <Link
          to="/admin/users"
          style={cardStyle}
        >

          <div style={iconStyle}>
            👥
          </div>

          <h2>
            Usuarios
          </h2>

          <p>
            Administrar usuarios y permisos
          </p>

        </Link>

        <Link
          to="/admin/companies"
          style={cardStyle}
        >

          <div style={iconStyle}>
            🏢
          </div>

          <h2>
            Empresas
          </h2>

          <p>
            Gestionar empresas clientes
          </p>

        </Link>

        <Link
          to="/admin/products"
          style={cardStyle}
        >
        
          <div style={iconStyle}>
            📦
          </div>
        
          <h2>
            Productos
          </h2>
        
          <p>
            Gestionar productos
          </p>
        
        </Link>

        <Link
          to="/orders"
          style={cardStyle}
        >

          <div style={iconStyle}>
            📋
          </div>

          <h2>
            Pedidos
          </h2>

          <p>
            Ver pedidos del sistema
          </p>

        </Link>

      </div>

    </div>

  );

}

const cardStyle = {

  background: "#fff",

  borderRadius: "12px",

  padding: "24px",

  textDecoration: "none",

  color: "#222",

  border: "1px solid #ddd",

  boxShadow:
    "0 2px 8px rgba(0,0,0,0.08)",

};

const iconStyle = {

  fontSize: "42px",

  marginBottom: "10px",

};