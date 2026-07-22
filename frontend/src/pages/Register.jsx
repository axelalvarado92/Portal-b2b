import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAccountRequest } from "../services/authService";
import logoSNB from "../assets/logo-snb.png";
import "./Register.css";

export default function Register() {

  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mailAdicional, setMailAdicional] = useState("");
  const [phone, setPhone] = useState("");
  const [telefonoOficina, setTelefonoOficina] = useState("");
  const [telefonoAdicional, setTelefonoAdicional] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [cuit, setCuit] = useState("");
  const [condicionFiscal, setCondicionFiscal] = useState("");

  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [carrierPhone, setCarrierPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [direccionTransporte, setDireccionTransporte] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      await createAccountRequest({
        full_name: fullName,
        email,
        mail_adicional: mailAdicional,
        phone,
        telefono_oficina: telefonoOficina,
        telefono_adicional: telefonoAdicional,
        business_name: businessName,
        cuit,
        condicion_fiscal: condicionFiscal,
        direccion,
        ciudad,
        provincia,
        delivery_method: deliveryMethod,
        carrier_name: carrierName,
        carrier_phone: carrierPhone,
        delivery_address: deliveryAddress,
        direccion_transporte: direccionTransporte
      });

      setSuccess(true);

    } catch (err) {

      console.error(err);
      setError("No se pudo enviar la solicitud.");

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="login-page">

      <header className="landing-header">
        <img src={logoSNB} alt="SNB" className="landing-logo" />
        <nav className="landing-nav">
          <Link to="/">Inicio</Link>
        </nav>
      </header>

      <main className="login-main">

        <Link to="/login" className="login-back">← Volver</Link>

        <div className="login-card register-card">

          <h1 className="login-title">Solicitar cuenta</h1>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ color: "#6e1423", fontWeight: "600", marginBottom: "12px" }}>
                ✓ Solicitud enviada
              </p>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
                Tu solicitud fue enviada correctamente.
                Nuestro equipo la revisará y se comunicará con vos para habilitar el acceso.
              </p>
              <button className="login-button" onClick={() => navigate("/login")}>
                Ir al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="register-form">

              {/* DATOS PERSONALES */}
              <div className="register-section">
                <div className="register-section-title">Datos personales</div>
                <div className="register-grid-2">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="login-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="login-input"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email adicional (Opcional)"
                    value={mailAdicional}
                    onChange={(e) => setMailAdicional(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono oficina (Opcional)"
                    value={telefonoOficina}
                    onChange={(e) => setTelefonoOficina(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono adicional (Opcional)"
                    value={telefonoAdicional}
                    onChange={(e) => setTelefonoAdicional(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              {/* DATOS FISCALES */}
              <div className="register-section">
                <div className="register-section-title">Datos fiscales</div>
                <div className="register-grid-2">
                  <input
                    type="text"
                    placeholder="Razón Social"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="login-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="CUIT (Opcional)"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Condición fiscal (Opcional)"
                    value={condicionFiscal}
                    onChange={(e) => setCondicionFiscal(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              {/* UBICACIÓN */}
              <div className="register-section">
                <div className="register-section-title">Ubicación</div>
                <div className="register-grid-2">
                  <input
                    type="text"
                    placeholder="Dirección (Opcional)"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Ciudad (Opcional)"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Provincia (Opcional)"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              {/* ENVÍO Y TRANSPORTE */}
              <div className="register-section">
                <div className="register-section-title">Envío y transporte</div>
                <div className="register-grid-2">
                  <input
                    type="text"
                    placeholder="Forma de Entrega (Opcional)"
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Transporte (Opcional)"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono Transporte (Opcional)"
                    value={carrierPhone}
                    onChange={(e) => setCarrierPhone(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Dirección de Entrega (Opcional)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="login-input"
                  />
                  <input
                    type="text"
                    placeholder="Dirección Transporte (Opcional)"
                    value={direccionTransporte}
                    onChange={(e) => setDireccionTransporte(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>

              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Enviando..." : "Solicitar cuenta"}
              </button>
            </form>
          )}

        </div>

      </main>

    </div>
  );
}