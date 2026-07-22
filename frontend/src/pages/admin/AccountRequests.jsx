import { useEffect, useState } from "react";
import { 
  getAccountRequests, 
  acceptAccountRequest, 
  rejectAccountRequest 
} from "../../services/accountRequestsService";
import { getCompanies } from "../../services/adminCompanyService";

import "./AccountRequests.css"; 

export function AccountRequests() {
  const [requests, setRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);

  const openRejectModal = (id) => {
    setRequestToReject(id);
    setShowModal(true);
  };

  const closeRejectModal = () => {
    setRequestToReject(null);
    setShowModal(false);
  };

  const [userData, setUserData] = useState({
    fullName: "",
    phone: "",
    mailAdicional: "",
    telefonoOficina: "",
    telefonoAdicional: "",
    businessName: "",
    cuit: "",
    condicionFiscal: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    deliveryMethod: "",
    transport: "",
    transportPhone: "",
    deliveryAddress: "",
    direccionTransporte: "",
    userType: "customer",
    companies: []
  });

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getAccountRequests();
      const list = Array.isArray(data) ? data : (data?.data || []);
      
      // Solo mostramos las pendientes
      const pending = list.filter(r => r.status === "pending");
      setRequests(pending);
      
    } catch (err) {
      console.error("❌ Error al cargar solicitudes:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      const res = await getCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      console.error("Error cargando empresas:", err);
    }
  }

  useEffect(() => {
    loadRequests();
    loadCompanies();
  }, []);

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      await rejectAccountRequest(id);
      loadRequests();
    } catch (err) {
      alert("Error al rechazar la solicitud");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Pre-completa el formulario con los datos que el cliente ya cargó al registrarse
  const initiateAccept = (request) => {
    setSelectedRequest(request);
    setUserData({
      fullName: request.full_name || "",
      phone: request.phone || "",
      mailAdicional: request.mail_adicional || "",
      telefonoOficina: request.telefono_oficina || "",
      telefonoAdicional: request.telefono_adicional || "",
      businessName: request.business_name || "",
      cuit: request.cuit || "",
      condicionFiscal: request.condicion_fiscal || "",
      direccion: request.direccion || "",
      ciudad: request.ciudad || "",
      provincia: request.provincia || "",
      deliveryMethod: request.delivery_method || "Retira en Sucursal",
      transport: request.carrier_name || "",
      transportPhone: request.carrier_phone || "",
      deliveryAddress: request.delivery_address || "",
      direccionTransporte: request.direccion_transporte || "",
      userType: "customer",
      companies: []
    });
  };

  function toggleCompany(companyId) {
    setUserData(prev => {
      const exists = prev.companies.includes(companyId);
      return {
        ...prev,
        companies: exists
          ? prev.companies.filter(id => id !== companyId)
          : [...prev.companies, companyId]
      };
    });
  }

  const handleConfirmAccept = async (e) => {
    e.preventDefault();

    if (userData.companies.length === 0) {
      alert("Seleccioná al menos una empresa para vincular al cliente");
      return;
    }

    try {
      setActionLoading(true);

      const finalPayload = {
        role: userData.userType,
        companies: userData.companies
      };

      await acceptAccountRequest(selectedRequest.id || selectedRequest._id, finalPayload);
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      alert("Error al procesar el alta del cliente");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="account-container">Cargando solicitudes de acceso...</div>;

  return (
    <div className="account-container">
      
      <div className="account-header-row">
        <h1 className="account-main-title">Solicitudes de Cuenta</h1>
        {!selectedRequest && (
          <span className="account-badge-count">
            {requests.length} Pendientes
          </span>
        )}
      </div>

      {!selectedRequest ? (
        <div className="account-table-wrapper">
          <table className="account-table">
            <thead>
              <tr>
                <th>Email Solicitante</th>
                <th>Estado</th>
                <th style={{ textAlign: "right", paddingRight: "25px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", color: "#858796", padding: "30px" }}>
                    No hay solicitudes de registro pendientes.
                  </td>
                </tr>
              ) : (
                requests.map((req, index) => (
                  <tr key={req.id || index}>
                    <td style={{ fontWeight: "600" }}>{req.email}</td>
                    <td>
                      <span className="status-pending">Pendiente</span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => initiateAccept(req)}
                        disabled={actionLoading}
                        className="btn-burgundy-primary"
                        style={{ marginRight: "10px" }}
                      >
                        Aceptar...
                      </button>
                      <button 
                        onClick={() => openRejectModal(req.id || req._id)}
                        disabled={actionLoading}
                        className="btn-burgundy-secondary"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="account-form-card">
          <h2 style={{ marginTop: 0, color: "var(--brand-burgundy)", fontSize: "22px" }}>Alta de Perfil de Cliente</h2>
          <p style={{ fontSize: "14px", color: "#858796", marginBottom: "25px" }}>
            Revisá y confirmá los datos cargados por: <strong>{selectedRequest.email}</strong>
          </p>
          
          <form onSubmit={handleConfirmAccept} className="account-form-grid">
            
            <div className="account-section-divider">1. Datos del Solicitante</div>
            
            <div className="account-input-group">
              <label className="account-label">Nombre Completo *</label>
              <input type="text" required value={userData.fullName}
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono de Contacto *</label>
              <input type="text" required value={userData.phone}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Email adicional</label>
              <input type="text" value={userData.mailAdicional}
                onChange={(e) => setUserData({...userData, mailAdicional: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono oficina</label>
              <input type="text" value={userData.telefonoOficina}
                onChange={(e) => setUserData({...userData, telefonoOficina: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono adicional</label>
              <input type="text" value={userData.telefonoAdicional}
                onChange={(e) => setUserData({...userData, telefonoAdicional: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-section-divider">2. Datos Fiscales y Comerciales</div>

            <div className="account-input-group">
              <label className="account-label">Razón Social *</label>
              <input type="text" required value={userData.businessName}
                onChange={(e) => setUserData({...userData, businessName: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">CUIT</label>
              <input type="text" value={userData.cuit}
                onChange={(e) => setUserData({...userData, cuit: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Condición fiscal</label>
              <input type="text" value={userData.condicionFiscal}
                onChange={(e) => setUserData({...userData, condicionFiscal: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Tipo de Usuario *</label>
              <select value={userData.userType}
                onChange={(e) => setUserData({...userData, userType: e.target.value})}
                className="account-input">
                <option value="customer">Cliente Mayorista</option>
                <option value="admin">Administrador interno</option>
              </select>
            </div>

            <div className="account-section-divider">3. Ubicación</div>

            <div className="account-input-group">
              <label className="account-label">Dirección</label>
              <input type="text" value={userData.direccion}
                onChange={(e) => setUserData({...userData, direccion: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Ciudad</label>
              <input type="text" value={userData.ciudad}
                onChange={(e) => setUserData({...userData, ciudad: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Provincia</label>
              <input type="text" value={userData.provincia}
                onChange={(e) => setUserData({...userData, provincia: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-section-divider">4. Datos de Despacho y Logística</div>

            <div className="account-input-group">
              <label className="account-label">Forma de Entrega</label>
              <select value={userData.deliveryMethod}
                onChange={(e) => setUserData({...userData, deliveryMethod: e.target.value})}
                className="account-input">
                <option value="Retira en Sucursal">Retira en Sucursal</option>
                <option value="Envío por Transporte">Envío por Transporte</option>
                <option value="Flete Propio">Flete Propio</option>
              </select>
            </div>

            <div className="account-input-group">
              <label className="account-label">Dirección de Entrega</label>
              <input type="text" value={userData.deliveryAddress}
                onChange={(e) => setUserData({...userData, deliveryAddress: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Empresa de Transporte</label>
              <input type="text" value={userData.transport}
                onChange={(e) => setUserData({...userData, transport: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono del Transporte</label>
              <input type="text" value={userData.transportPhone}
                onChange={(e) => setUserData({...userData, transportPhone: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-input-group">
              <label className="account-label">Dirección Transporte</label>
              <input type="text" value={userData.direccionTransporte}
                onChange={(e) => setUserData({...userData, direccionTransporte: e.target.value})}
                className="account-input" />
            </div>

            <div className="account-section-divider">5. Proveedores a vincular *</div>

            <div className="account-input-group" style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {companies.map(c => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      cursor: "pointer",
                      background: userData.companies.includes(c.id) ? "#f6e9eb" : "white"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userData.companies.includes(c.id)}
                      onChange={() => toggleCompany(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="account-form-actions">
              <button type="submit" disabled={actionLoading} className="btn-burgundy-primary">
                {actionLoading ? "Escribiendo en Base de Datos..." : "Confirmar Alta de Cuenta"}
              </button>
              <button type="button" onClick={() => setSelectedRequest(null)} className="btn-burgundy-secondary">
                Volver al Listado
              </button>
            </div>

          </form>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar acción</h3>
            <p>¿Estás seguro de que querés rechazar esta solicitud? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-burgundy-secondary" onClick={closeRejectModal}>
                Cancelar
              </button>
              <button 
                className="btn-burgundy-primary" 
                onClick={async () => {
                  await handleReject(requestToReject);
                  closeRejectModal();
                }}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default AccountRequests;