import { useEffect, useState } from "react";
import {
  getCompanies,
  createCompany,
  updateCompany,
} from "../../services/adminCompanyService";
import "./Companies.css";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Estados para formulario de creación
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");

  // Estados para formulario de edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editTaxId, setEditTaxId] = useState("");

  const [search, setSearch] = useState("");

  // Función reutilizable para cargar datos sin recargar la página completa
  async function loadCompanies() {
    try {
      setLoading(true);
      const response = await getCompanies();
      setCompanies(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const companyName = (company.name || "").toLowerCase();
    const businessName = (company.business_name || "").toLowerCase();
    const searchWord = search.toLowerCase();
    return companyName.includes(searchWord) || businessName.includes(searchWord);
  });

  async function handleCreateCompany() {
    try {
      await createCompany({
        name,
        contact_email: contactEmail,
        business_name: businessName,
        whatsapp_phone: whatsappPhone,
        tax_id: taxId,
      });

      alert("Empresa creada exitosamente");
      setShowForm(false);
      // Limpiar formulario
      setName("");
      setContactEmail("");
      setWhatsappPhone("");
      setBusinessName("");
      setTaxId("");
      
      // Recargar datos en lugar de hacer reload completo
      loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Error al crear empresa");
    }
  }

  async function handleUpdateCompany() {
    try {
      await updateCompany(editingCompany.id, {
        name: editName,
        contact_email: editEmail,
        whatsapp_phone: editWhatsapp,
        business_name: editBusinessName,
        tax_id: editTaxId,
      });

      alert("Empresa actualizada exitosamente");
      setShowEditForm(false);
      setEditingCompany(null);
      
      // Recargar datos en lugar de hacer reload completo
      loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar");
    }
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>Cargando empresas...</p>;
  }

  return (
    <div className="admin-companies-page" style={{ padding: "20px" }}>
      <div className="companies-header" style={{ marginBottom: "20px" }}>
        <div className="companies-summary-card">
          <h3>Total empresas</h3>
          <span>{companies.length}</span>
        </div>

        <h1>Empresas</h1>

        <input
          className="companies-search"
          placeholder="Buscar empresa por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", width: "250px" }}
        />

        <button
          className="snb-btn"
          onClick={() =>
            setShowForm(true)
          }
        >
          + Nueva Empresa
        </button>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      {showForm && (
        <div
          style={{
            background: "#fff",
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h3>Crear empresa</h3>
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          
          <input
            style={inputStyle}
            placeholder="Razón Social"
            value={businessName}
            onChange={(e) =>
              setBusinessName(e.target.value)
            }
          />

          <input
            style={inputStyle}
            placeholder="CUIT"
            value={taxId}
            onChange={(e) =>
              setTaxId(e.target.value)
            }
          />

          <input
            placeholder="Email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Whatsapp"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            style={inputStyle}
          />

          <button
            className="snb-btn"
            onClick={handleCreateCompany}
          >
            Crear empresa
          </button>
          <button
            className="snb-btn-secondary"
            onClick={() => {
              setShowForm(false);
              setName("");
              setContactEmail("");
              setWhatsappPhone("");
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* FORMULARIO DE EDICIÓN */}
      {showEditForm && editingCompany && (
        <div
          style={{
            background: "#fff",
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h3>Editar empresa</h3>
          <div className="company-form">

            <label>
              Nombre Comercial
            </label>
          
            <input
              className="company-input"
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value)
              }
            />
          
            <label>
              Razón Social
            </label>
          
            <input
              className="company-input"
              value={editBusinessName}
              onChange={(e) =>
                setEditBusinessName(
                  e.target.value
                )
              }
            />
          
            <label>
              CUIT
            </label>
          
            <input
              className="company-input"
              value={editTaxId}
              onChange={(e) =>
                setEditTaxId(
                  e.target.value
                )
              }
            />
          
            <label>
              Email
            </label>
          
            <input
              className="company-input"
              value={editEmail}
              onChange={(e) =>
                setEditEmail(
                  e.target.value
                )
              }
            />
          
            <label>
              WhatsApp
            </label>
          
            <input
              className="company-input"
              value={editWhatsapp}
              onChange={(e) =>
                setEditWhatsapp(
                  e.target.value
                )
              }
            />
          
          </div>
          <button
            className="snb-btn"
            onClick={handleUpdateCompany}
          >
            Guardar cambios
          </button>
          <button
            className="snb-btn"
            onClick={() => {
              setShowEditForm(false);
              setEditingCompany(null);
            }}
            style={{ marginLeft: "10px" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* TABLA DE EMPRESAS */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Nombre Comercial</th>
            <th style={thStyle}>Razón Social</th>
            <th style={thStyle}>CUIT / Tax ID</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompanies.map((company) => (
            <tr key={company.id}>
              <td style={tdStyle}>{company.name || "-"}</td>
              <td style={tdStyle}>{company.business_name || "-"}</td>
              <td style={tdStyle}>{company.tax_id || "-"}</td>
              <td style={tdStyle}>{company.contact_email || "-"}</td>
              <td style={tdStyle}>
                <span
                  className={
                    company.is_active ? "status-active" : "status-inactive"
                  }
                >
                  {company.is_active ? "Activa" : "Inactiva"}
                </span>
              </td>
              <td style={tdStyle}>
                <button
                  className="snb-btn"
                  onClick={() => {
                    setEditingCompany(company);
                    setEditName(company.name || "");
                    setEditEmail(company.contact_email || "");
                    setEditWhatsapp(company.whatsapp_phone || "");
                    setEditTaxId(company.tax_id || "" );
                    setShowEditForm(true);
                  }}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Estilos limpios compartidos
const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  background: "#f5f5f5",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  boxSizing: "border-box",
};
