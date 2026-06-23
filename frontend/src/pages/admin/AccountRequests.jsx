// 📄 src/pages/admin/AccountRequests.jsx

import { useEffect, useState } from "react";
import { 
  getAccountRequests, 
  acceptAccountRequest, 
  rejectAccountRequest 
} from "../../services/accountRequestsService";

// Importamos el archivo CSS separado
import "./AccountRequests.css"; 

export function AccountRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [userData, setUserData] = useState({
    fullName: "",
    phone: "",
    businessName: "",      
    deliveryMethod: "",    
    transport: "",         
    transportPhone: "",    
    deliveryAddress: "",   
    userType: "client"     
  });

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getAccountRequests();
      if (Array.isArray(data)) setRequests(data);
      else if (data && Array.isArray(data.data)) setRequests(data.data);
      else setRequests([]);
    } catch (err) {
      console.error("❌ Error al cargar solicitudes:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReject = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés rechazar esta solicitud?")) return;
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

  const initiateAccept = (request) => {
    setSelectedRequest(request);
    setUserData({
      fullName: "",
      phone: "",
      businessName: "",
      deliveryMethod: "Retira en Sucursal",
      transport: "",
      transportPhone: "",
      deliveryAddress: "",
      userType: "client"
    });
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const finalPayload = {
        email: selectedRequest.email,
        ...userData
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
      
      {/* HEADER DIVISOR */}
      <div className="account-header-row">
        <h1 className="account-main-title">Solicitudes de Cuenta</h1>
        {!selectedRequest && (
          <span className="account-badge-count">
            {requests.length} Pendientes
          </span>
        )}
      </div>

      {/* VISTA 1: LISTADO DE SOLICITUDES */}
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
                        onClick={() => handleReject(req.id || req._id)}
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
        /* VISTA 2: FORMULARIO DE ALTA EN DOS COLUMNAS */
        <div className="account-form-card">
          <h2 style={{ marginTop: 0, color: "var(--brand-burgundy)", fontSize: "22px" }}>Alta de Perfil de Cliente</h2>
          <p style={{ fontSize: "14px", color: "#858796", marginBottom: "25px" }}>
            Asigná los datos comerciales obligatorios para el usuario: <strong>{selectedRequest.email}</strong>
          </p>
          
          <form onSubmit={handleConfirmAccept} className="account-form-grid">
            
            <div className="account-section-divider">1. Datos del Solicitante</div>
            
            <div className="account-input-group">
              <label className="account-label">Nombre Completo *</label>
              <input 
                type="text" required value={userData.fullName}
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                className="account-input" placeholder="Nombre y Apellido"
              />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono de Contacto *</label>
              <input 
                type="text" required value={userData.phone}
                onChange={(e) => setUserData({...userData, phone: e.target.value})}
                className="account-input" placeholder="Ej: +54 9 11 ..."
              />
            </div>

            <div className="account-section-divider">2. Clasificación Comercial</div>

            <div className="account-input-group">
              <label className="account-label">Razón Social *</label>
              <input 
                type="text" required value={userData.businessName}
                onChange={(e) => setUserData({...userData, businessName: e.target.value})}
                className="account-input" placeholder="Nombre de la firma o empresa"
              />
            </div>

            <div className="account-input-group">
              <label className="account-label">Tipo de Usuario *</label>
              <select 
                value={userData.userType}
                onChange={(e) => setUserData({...userData, userType: e.target.value})}
                className="account-input"
              >
                <option value="client">Cliente Mayorista</option>
                <option value="distributor">Distribuidor oficial</option>
                <option value="admin">Administrador interno</option>
              </select>
            </div>

            <div className="account-section-divider">3. Datos de Despacho y Logística</div>

            <div className="account-input-group">
              <label className="account-label">Forma de Entrega *</label>
              <select 
                value={userData.deliveryMethod}
                onChange={(e) => setUserData({...userData, deliveryMethod: e.target.value})}
                className="account-input"
              >
                <option value="Retira en Sucursal">Retira en Sucursal</option>
                <option value="Envío por Transporte">Envío por Transporte</option>
                <option value="Flete Propio">Flete Propio</option>
              </select>
            </div>

            <div className="account-input-group">
              <label className="account-label">Dirección de Entrega</label>
              <input 
                type="text" value={userData.deliveryAddress}
                onChange={(e) => setUserData({...userData, deliveryAddress: e.target.value})}
                className="account-input" placeholder="Calle, Altura, Localidad"
              />
            </div>

            <div className="account-input-group">
              <label className="account-label">Empresa de Transporte</label>
              <input 
                type="text" value={userData.transport}
                onChange={(e) => setUserData({...userData, transport: e.target.value})}
                className="account-input" placeholder="Nombre del expreso"
              />
            </div>

            <div className="account-input-group">
              <label className="account-label">Teléfono del Transporte</label>
              <input 
                type="text" value={userData.transportPhone}
                onChange={(e) => setUserData({...userData, transportPhone: e.target.value})}
                className="account-input" placeholder="Teléfono de la central de carga"
              />
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
    </div>
  );
}

export default AccountRequests;