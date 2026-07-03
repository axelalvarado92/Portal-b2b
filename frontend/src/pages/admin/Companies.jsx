import { useEffect, useState } from "react";
import {
  getCompanies,
  createCompany,
  updateCompany,
} from "../../services/adminCompanyService";
import { useNavigate } from "react-router-dom";
import "./Companies.css";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // Estados para formulario de creación
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [nombreFantasia, setNombreFantasia] = useState("");


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
        nombre_fantasia: nombreFantasia,
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

  if (loading) {
    return <p style={{ padding: "20px" }}>Cargando empresas...</p>;
  }

  return (
    <div className="admin-companies-page" style={{ padding: "20px" }}>
      {/* 🛠️ HEADER OPTIMIZADO Y ALINEADO */}
      <div className="companies-header" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        
        <h1 style={{ margin: 0 }}>Proveedores</h1>
      
        {/* Contenedor alineado para el Buscador y el Botón */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            className="companies-search"
            placeholder="Buscar empresa por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: "10px 15px", 
              width: "280px", 
              height: "42px", 
              borderRadius: "8px", 
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: "14px",
              margin: 0
            }}
          />
      
          <button
            className="snb-btn"
            onClick={() => setShowForm(true)}
            style={{ 
              height: "42px", 
              padding: "0 20px",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              whiteSpace: "nowrap",
              margin: 0
            }}
          >
            + Nueva Empresa
          </button>
        </div>
      
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      {showForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3>Crear empresa</h3>
      
          {/* DATOS GENERALES */}
          <div className="form-section">
            <div className="form-section-title">Datos Generales</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Fantasía</label>
                <input
                  className="form-input"
                  placeholder="Opcional"
                  value={nombreFantasia}
                  onChange={(e) => setNombreFantasia(e.target.value)}
                />
              </div>
            </div>
          </div>
      
          {/* DATOS FISCALES */}
          <div className="form-section">
            <div className="form-section-title">Datos Fiscales</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Razón Social</label>
                <input
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">CUIT</label>
                <input
                  className="form-input"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
            </div>
          </div>
      
          {/* CONTACTO */}
          <div className="form-section">
      <div className="form-section-title">Contacto</div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">WhatsApp</label>
          <input
            className="form-input"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
          />
        </div>
      </div>
          </div>
      
          <div className="actions-row">
      <button className="btn-primary" onClick={handleCreateCompany}>
        Crear empresa
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          setShowForm(false);
          setName("");
          setContactEmail("");
          setWhatsappPhone("");
          setBusinessName("");
          setTaxId("");
          setNombreFantasia("");
        }}
      >
        Cancelar
      </button>
          </div>
        </div>
      )}

      {/* CARDS DE EMPRESAS */}
      <div className="companies-grid">
      
        {filteredCompanies.map((company) => (
      
          <div
            key={company.id}
            className="company-card"
            onClick={() =>
              navigate(`/admin/companies/${company.id}`)
            }
          >
      
            <div className="company-logo-wrapper">
              <img
                src={company.logo_url || "/logo-placeholder.png"}
                alt={company.name}
                className="company-logo"
              />
            </div>
      
            <div className="company-body">
              <h3 className="company-name">
                {company.name}
              </h3>
      
              <p className="company-description">
                {company.description || company.nombre_fantasia || "-"}
              </p>
            </div>
      
          </div>
      
        ))}
      
      </div>
    </div>
  );
}
