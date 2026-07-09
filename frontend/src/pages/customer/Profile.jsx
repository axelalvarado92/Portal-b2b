import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../../services/userService";
import "./Profile.css";

export default function Profile() {

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetchCurrentUser();
        setProfile(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) return <p className="profile-loading">Cargando perfil...</p>;
  if (!profile) return <p className="profile-loading">No se pudo cargar el perfil.</p>;

  return (
    <div className="profile-wrapper">

      <div className="profile-header">
        <h1>Mi perfil</h1>
      </div>

      <div className="profile-card">

        <div className="profile-avatar">
          {profile.full_name
            ? profile.full_name.charAt(0).toUpperCase()
            : profile.email.charAt(0).toUpperCase()
          }
        </div>

        <div className="profile-fields">

          <div className="profile-field">
            <span className="profile-label">Nombre</span>
            <span className="profile-value">{profile.full_name || "—"}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Email</span>
            <span className="profile-value">{profile.email}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Teléfono</span>
            <span className="profile-value">{profile.phone || "—"}</span>
          </div>

        </div> {/* Cierre agregado para profile-fields */}
      </div> {/* Cierre agregado para profile-card principal */}

      {/* Contenedor en 2 columnas para las secciones restantes */}
      <div className="profile-sections-grid">

        <div className="profile-section">
          <h2>Datos fiscales</h2>
          <div className="profile-card">
            <div className="profile-fields">
              <div className="profile-field">
                <span className="profile-label">Razón Social</span>
                <span className="profile-value">{profile.business_name || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">CUIT</span>
                <span className="profile-value">{profile.cuit || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Condición fiscal</span>
                <span className="profile-value">{profile.condicion_fiscal || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Envío y transporte</h2>
          <div className="profile-card">
            <div className="profile-fields">
              <div className="profile-field">
                <span className="profile-label">Forma de Entrega</span>
                <span className="profile-value">{profile.delivery_method || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Transporte</span>
                <span className="profile-value">{profile.carrier_name || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Teléfono Transporte</span>
                <span className="profile-value">{profile.carrier_phone || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Dirección Entrega</span>
                <span className="profile-value">{profile.delivery_address || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Dirección Transporte</span>
                <span className="profile-value">{profile.direccion_transporte || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Ubicación</h2>
          <div className="profile-card">
            <div className="profile-fields">
              <div className="profile-field">
                <span className="profile-label">Dirección</span>
                <span className="profile-value">{profile.direccion || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Ciudad</span>
                <span className="profile-value">{profile.ciudad || "—"}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">Provincia</span>
                <span className="profile-value">{profile.provincia || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Empresas asociadas</h2>
          {profile.companies && profile.companies.length > 0 ? (
            <div className="profile-companies">
              {profile.companies.map(company => (
                <div key={company.id} className="profile-company-card">
                  <span className="profile-company-name">{company.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-empty">No tenés empresas asociadas.</p>
          )}
        </div>

      </div>

    </div>
  );
}