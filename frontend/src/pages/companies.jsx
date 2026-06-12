import { useEffect, useState } from "react";

import {
  getCompanies,
} from "../services/companyService";

export default function Companies() {

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadCompanies() {

      try {

        const response =
          await getCompanies();

        console.log(
          "COMPANIES:",
          response
        );

        setCompanies(response.data);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadCompanies();

  }, []);

  if (loading) {
    return <p>Cargando empresas...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>

      <h1>Empresas</h1>

      {companies.length === 0 ? (
        <p>No hay empresas asignadas.</p>
      ) : (
        companies.map((company) => (
          <div
            key={company.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >
            <h3>{company.name}</h3>

            <p>
              Descuento:
              {" "}
              {company.discount_percentage}%
            </p>

            <p>
              Email:
              {" "}
              {company.contact_email || "-"}
            </p>

          </div>
        ))
      )}

    </div>
  );
}