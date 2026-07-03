import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCompany, updateCompany } from "../../services/adminCompanyService";
import { uploadLogo } from "../../services/uploadService";


import "./CompanyDetail.css";

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);


  // Se consolidó en un solo useEffect para evitar peticiones duplicadas
  useEffect(() => {
    loadCompany();
  }, [id]);

  async function loadCompany() {

    try {
  
      const response = await getCompany(id);
  
      setCompany(response.data);
  
      setForm(response.data);
  
    } catch (err) {
  
      console.error(err);
  
    } finally {
  
      setLoading(false);
  
    }
  
  }

  async function saveCompany() {
    try {
      setSaving(true);
      let finalLogoUrl = form.logo_url;
  
      if (logoFile) {
        const { upload_url, file_url } = await uploadLogo(logoFile, id);
  
        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": logoFile.type },
          body: logoFile
        });
  
        finalLogoUrl = file_url;
      }
  
      const updatedForm = { ...form, logo_url: finalLogoUrl };
  
      await updateCompany(id, updatedForm);
  
      setCompany(updatedForm);
      setForm(updatedForm);
      setEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
  
      setToast("✓ Cambios guardados exitosamente");
    } catch (err) {
      console.error("Error al guardar:", err);
      setToast("✗ No se pudo guardar la empresa");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  function handleChange(e) {

    const { name, value } = e.target;

    setForm(prev => ({

        ...prev,

        [name]: value

    }));

  }

 function handleLogoChange(e) {

    const file = e.target.files[0];

    if (!file) return;

    setLogoFile(file);

    setLogoPreview(
        URL.createObjectURL(file)
    );

  }

  function Field({
      label,
      name,
      value
  }) {
  
      return (
  
          <div className="detail-row">
  
              <span>{label}</span>
  
              {editing ? (
  
                  <input
                      name={name}
                      value={value || ""}
                      onChange={handleChange}
                  />
  
              ) : (
  
                  <strong>{value || "-"}</strong>
  
              )}
  
          </div>
  
      );
  
  }

  if (loading) return <p>Cargando empresa...</p>;

  if (!company) return <p>Empresa no encontrada.</p>;

  return (
    <div className="company-detail">
      <div className="company-header">

        <button
            className="back-btn"
            onClick={() => navigate(-1)}
        >
            ← Volver
        </button>
    
        {
        editing ?
        
        (
        
            <div className="header-actions">
        
                <button
                    className="cancel-btn"
                    onClick={() => {
        
                        setForm(company);
        
                        setEditing(false);
        
                    }}
                >
                    Cancelar
                </button>

                <button
                    className="save-btn"
                    onClick={saveCompany}
                    disabled={saving}
                >
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
        
            </div>
            
        
        )
        
        :
        
        (
        
            <button
                className="edit-btn"
                onClick={() => setEditing(true)}
            >
                ✎ Editar empresa
            </button>
            
        
        )
        }
    
    </div>

      <div className="company-hero">
        <div className="company-logo-wrapper">

          <img
              src={
                  logoPreview ||
                  form.logo_url ||
                  "/logo-placeholder.png"
              }
              alt={company.name}
              className="company-logo-large"
          />
      
          {
              editing &&
              <>
                  <label
                      htmlFor="company-logo"
                      className="logo-overlay"
                  >
                      Cambiar logo
                  </label>
      
                  <input
                      id="company-logo"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                  />
              </>
          }
      
            </div>
              <div className="company-title">
      
          {editing ? (
      
              <>
                  <input
                      className="title-input"
                      name="name"
                      value={form.name || ""}
                      onChange={handleChange}
                  />
      
                  <input
                      className="subtitle-input"
                      name="nombre_fantasia"
                      value={form.nombre_fantasia || ""}
                      onChange={handleChange}
                  />
              </>
      
          ) : (
      
              <>
                  <h1>{form.name}</h1>
                  <p>{form.nombre_fantasia}</p>
              </>
      
          )}
      
      </div>
      </div>

      <div className="detail-card">

          <h2>Información fiscal</h2>
      
          <Field
              label="Razón social"
              name="business_name"
              value={form.business_name}
          />
      
          <Field
              label="CUIT"
              name="tax_id"
              value={form.tax_id}
          />
      
          <Field
              label="Condición fiscal"
              name="condicion_fiscal"
              value={form.condicion_fiscal}
          />
      
      </div>

      <div className="detail-card">

        <h2>Contacto</h2>
    
        <Field
            label="Email"
            name="contact_email"
            value={form.contact_email}
        />
    
        <Field
            label="Email adicional"
            name="mail_adicional"
            value={form.mail_adicional}
        />

        <Field
            label="Teléfono"
            name="phone"
            value={form.phone}
        />
    
        <Field
            label="Teléfono oficina"
            name="telefono_oficina"
            value={form.telefono_oficina}
        />
    
        <Field
            label="Teléfono adicional"
            name="telefono_adicional"
            value={form.telefono_adicional}
        />
    
        </div>
          <div className="detail-card">
    
        <h2>Ubicación</h2>
    
        <Field
            label="Dirección"
            name="direccion"
            value={form.direccion}
        />
    
        <Field
            label="Ciudad"
            name="ciudad"
            value={form.ciudad}
        />
    
        <Field
            label="Provincia"
            name="provincia"
            value={form.provincia}
        />
    
    </div>

    {toast && <div className="toast">{toast}</div>}
    </div>

  );
}