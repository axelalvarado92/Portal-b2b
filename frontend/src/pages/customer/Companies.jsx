import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCompanies } from "../../services/companyService";

import "./Companies.css";

export default function Companies() {

  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {

    try {

      const response = await getCompanies();

      setCompanies(response.data || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {
    return <div>Cargando proveedores...</div>;
  }

  return (

    <div className="companies-page">

      <h1 className="companies-title">
        Seleccioná una empresa para ver sus productos
      </h1>

      <div className="companies-grid">

        {companies.map(company => (

          <div
            key={company.id}
            className="company-card"
            onClick={() =>
              navigate(`/company/${company.id}`)
            }
          >

            <div className="company-logo-wrapper">

              <img
                src={
                  company.logo_url ||
                  "/logo-placeholder.png"
                }
                alt={company.name}
                className="company-logo"
              />

            </div>

            <h3 className="company-name">
              {company.name}
            </h3>
            
            {company.description && (
              <p className="company-description">
                {company.description}
              </p>
            )}

          </div>

        ))}

      </div>

    </div>

  );

}