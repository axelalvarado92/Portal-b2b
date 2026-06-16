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

        <div>

          <img
            src={logoSNB}
            alt="SNB"
            className="app-logo"
          />

          <nav className="app-nav">
          
            <Link to="/dashboard">
              Inicio
            </Link>
          
          </nav>

        </div>

        <div className="app-user-section">

          <select
            className="app-company-select"
            value={selectedCompany?.id || ""}
            onChange={(e) => {

              const company =
                companies.find(
                  c => c.id === e.target.value
                );

              setSelectedCompany(company);

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

          <button
            className="app-logout-btn"
            onClick={handleLogout}
          >
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