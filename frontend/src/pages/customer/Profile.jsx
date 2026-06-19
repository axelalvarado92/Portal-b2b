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
  );
}