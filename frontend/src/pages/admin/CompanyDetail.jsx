import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCompany, updateCompany, createCompany, deleteCompany } from "../../services/adminCompanyService";
import { uploadLogo } from "../../services/uploadService";

import "./CompanyDetail.css";

function Field({ label, name, value, onChange }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      {onChange ? (
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
        />
      ) : (
        <strong>{value || "-"}</strong>
      )}
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = id && id !== "new";

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(!isEdit); // en modo crear, arranca en edición directamente
  const [form, setForm] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadCompany();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadCompany() {
    try {
      setLoading(true);
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
    if (!form.name || !form.name.trim()) {
      setToast("✗ El nombre de la empresa es obligatorio");
      setTimeout(() => setToast(""), 2500);
      return;
    }
  
    try {
      setSaving(true);
      let finalLogoUrl = form.logo_url;

      if (logoFile) {
        const { upload_url, file_url } = await uploadLogo(logoFile, isEdit ? id : null);

        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": logoFile.type },
          body: logoFile
        });

        finalLogoUrl = file_url;
      }

      const updatedForm = { ...form, logo_url: finalLogoUrl };

      if (isEdit) {
        await updateCompany(id, updatedForm);
        setCompany(updatedForm);
        setForm(updatedForm);
        setEditing(false);
        setToast("✓ Cambios guardados exitosamente");
      } else {
        await createCompany(updatedForm);
        setToast("✓ Empresa creada exitosamente");
        navigate("/admin/companies");
      }

      setLogoFile(null);
      setLogoPreview(null);

    } catch (err) {
      console.error("Error al guardar:", err);
      setToast(isEdit ? "✗ No se pudo guardar la empresa" : "✗ No se pudo crear la empresa");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  async function handleDelete() {
    const isActive = form.is_active !== false;
    const action = isActive ? "desactivar" : "activar";
  
    console.log(`DEBUG: handleDelete fue ejecutado - acción: ${action}`);
  
    const confirmed = window.confirm(
      isActive
        ? `¿Seguro que querés desactivar "${form.name}"? Esta acción se puede revertir más adelante.`
        : `¿Querés activar nuevamente "${form.name}"?`
    );
  
    if (!confirmed) return;
  
    try {
      setSaving(true);
  
      const updatedForm = {
        ...form,
        is_active: !isActive
      };
  
      const response = await updateCompany(id, updatedForm);
  
      console.log("DEBUG updateCompany response:", response);
  
      setCompany(updatedForm);
      setForm(updatedForm);
  
      setToast(
        isActive
          ? "✓ Empresa desactivada"
          : "✓ Empresa activada"
      );
  
    } catch (err) {
      console.error(`Error al ${action}:`, err);
  
      setToast(
        isActive
          ? "✗ No se pudo desactivar la empresa"
          : "✗ No se pudo activar la empresa"
      );
  
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

 if (loading) return <p>Cargando empresa...</p>;

 if (isEdit && !company) return <p>Empresa no encontrada.</p>;

  return (
    <div className="company-detail">
      <div className="company-header">

        <button className="back-btn" onClick={() => navigate(-1)}>
            ← Volver
        </button>

        {editing ? (
            <div className="header-actions">
                <button
                    className="cancel-btn"
                    onClick={() => {
                        if (isEdit) {
                          setForm(company);
                          setEditing(false);
                        } else {
                          navigate(-1);
                        }
                    }}
                >
                    Cancelar
                </button>

                <button
                    className="save-btn"
                    onClick={saveCompany}
                    disabled={saving}
                >
                    {saving
                      ? (isEdit ? "Guardando..." : "Creando...")
                      : (isEdit ? "Guardar cambios" : "Crear empresa")}
                </button>
            </div>
        ) : (
            <>
              <button className="edit-btn" onClick={() => setEditing(true)}>
                  ✎ Editar empresa
              </button>
              {isEdit && (
                <button className="delete-btn" onClick={handleDelete} disabled={saving}>
                    {form.is_active !== false ? "🗑 Desactivar" : "✓ Activar"}
                </button>
              )}
            </>
        )}

      </div>

      <div className="company-hero">
        <div className="company-logo-wrapper">
          <img
              src={logoPreview || form.logo_url || "/logo-placeholder.png"}
              alt={form.name || "Nueva empresa"}
              className="company-logo-large"
          />

          {editing && (
              <>
                  <label htmlFor="company-logo" className="logo-overlay">
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
          )}
        </div>

        <div className="company-title">
          {editing ? (
              <>
                  <input
                      className="title-input"
                      name="name"
                      placeholder="Nombre de la empresa"
                      value={form.name || ""}
                      onChange={handleChange}
                  />

                  <input
                      className="subtitle-input"
                      name="nombre_fantasia"
                      placeholder="Nombre fantasía (opcional)"
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
          <Field label="Razón social" name="business_name" value={form.business_name} onChange={editing ? handleChange : undefined} />
          <Field label="CUIT" name="tax_id" value={form.tax_id} onChange={editing ? handleChange : undefined} />
          <Field label="Condición fiscal" name="condicion_fiscal" value={form.condicion_fiscal} onChange={editing ? handleChange : undefined} />
      </div>

      <div className="detail-card">
        <h2>Contacto</h2>
        <Field label="Email" name="contact_email" value={form.contact_email} onChange={editing ? handleChange : undefined} />
        <Field label="Email adicional" name="mail_adicional" value={form.mail_adicional} onChange={editing ? handleChange : undefined} />
        <Field label="Teléfono" name="phone" value={form.phone} onChange={editing ? handleChange : undefined} />
        <Field label="Teléfono oficina" name="telefono_oficina" value={form.telefono_oficina} onChange={editing ? handleChange : undefined} />
        <Field label="Teléfono adicional" name="telefono_adicional" value={form.telefono_adicional} onChange={editing ? handleChange : undefined} />
      </div>

      <div className="detail-card">
        <h2>Ubicación</h2>
        <Field label="Dirección" name="direccion" value={form.direccion} onChange={editing ? handleChange : undefined} />
        <Field label="Ciudad" name="ciudad" value={form.ciudad} onChange={editing ? handleChange : undefined} />
        <Field label="Provincia" name="provincia" value={form.provincia} onChange={editing ? handleChange : undefined} />
      </div>

      <div className="detail-card">
        <h2>Promoción para clientes</h2>
      
        {editing ? (
          <>
            <div className="detail-row">
              <span>Descripción</span>
            
              <textarea
                name="promotion_description"
                value={form.promotion_description || ""}
                onChange={handleChange}
                rows={4}
              />
            
              <small>
                Podés ingresar texto de promoción o una URL de catálogo externo.
              </small>
            </div>
      
            <Field
              label="Título"
              name="promotion_title"
              value={form.promotion_title}
              onChange={handleChange}
            />
      
            <div className="detail-row">
              <span>Descripción</span>
              <textarea
                name="promotion_description"
                value={form.promotion_description || ""}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </>
        ) : (
          <>
            <Field
              label="Estado"
              value={form.promotion_enabled ? "Activa" : "Inactiva"}
            />
      
            {form.promotion_enabled && (
              <>
                <Field
                  label="Título"
                  value={form.promotion_title}
                />
      
                <div className="detail-row">
                  <span>Descripción</span>
                  <strong>{form.promotion_description || "-"}</strong>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}