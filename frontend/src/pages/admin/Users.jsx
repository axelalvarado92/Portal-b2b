import { useEffect, useState } from "react";
import "./Users.css";

import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "../../services/adminUserService";

// 1. Importamos el servicio correcto de administración de empresas
import { getCompanies as getAdminCompanies } from "../../services/adminCompanyService";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Estado local para guardar las empresas de la base de datos
  const [allCompanies, setAllCompanies] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [carrierPhone, setCarrierPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [cuit, setCuit] = useState("");
  const [condicionFiscal, setCondicionFiscal] = useState("");
  const [direccion, setDireccion] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [direccionTransporte, setDireccionTransporte] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [telefonoOficina, setTelefonoOficina] = useState("");
  const [telefonoAdicional, setTelefonoAdicional] = useState("");
  const [mailAdicional, setMailAdicional] = useState("");

// Y haz lo mismo para los estados de edición (ejemplo: editCuit, setEditCuit, etc.)
// ... (asegúrate de crear todos los estados "edit..." correspondientes)

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("customer");
  const [editCompanies, setEditCompanies] = useState([]);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editDeliveryMethod, setEditDeliveryMethod] = useState("");
  const [editCarrierName, setEditCarrierName] = useState("");
  const [editCarrierPhone, setEditCarrierPhone] = useState("");
  const [editDeliveryAddress, setEditDeliveryAddress] = useState("");
  const [editCuit, setEditCuit] = useState("");
  const [editCondicionFiscal, setEditCondicionFiscal] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editDireccionEntrega, setEditDireccionEntrega] = useState("");
  const [editDireccionTransporte, setEditDireccionTransporte] = useState("");
  const [editCiudad, setEditCiudad] = useState("");
  const [editProvincia, setEditProvincia] = useState("");
  const [editTelefonoOficina, setEditTelefonoOficina] = useState("");
  const [editTelefonoAdicional, setEditTelefonoAdicional] = useState("");
  const [editMailAdicional, setEditMailAdicional] = useState("");

  // 3. Cargamos tanto los usuarios como las empresas de administración en paralelo
  async function loadInitialData() {
    try {
      setLoading(true);
      const [usersResponse, companiesResponse] = await Promise.all([
        getUsers(),
        getAdminCompanies(), // Llama a /admin/companies
      ]);

      setUsers(usersResponse.data || []);
      const companiesList = companiesResponse.data || companiesResponse || [];
      setAllCompanies(companiesList);
    } catch (err) {
      console.error("Error cargando datos de administración:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleCreateUser() {
    try {
      await createUser({
        email,
        full_name: fullName,
        phone,
        role,
        business_name: businessName,
        delivery_method: deliveryMethod,
        carrier_name: carrierName,
        carrier_phone: carrierPhone,
        delivery_address: deliveryAddress,
        companies: selectedCompanies,
        cuit: condicionFiscal,
        condicion_fiscal: condicionFiscal,
        direccion: direccion,
        direccion_entrega: direccionEntrega,
        direccion_transporte: direccionTransporte,
        ciudad: ciudad,
        provincia: provincia,
        telefono_oficina: telefonoOficina,
        telefono_adicional: telefonoAdicional,
        mail_adicional: mailAdicional,
      });

      setShowForm(false);
      setEmail("");
      setFullName("");
      setPhone("");
      setRole("customer");
      setSelectedCompanies([]);
      setBusinessName("");
      setDeliveryMethod("");
      setCarrierName("");
      setCarrierPhone("");
      setDeliveryAddress("");
      setCuit("");
      setCondicionFiscal("");
      setDireccion("");
      setDireccionEntrega("");
      setDireccionTransporte("");
      setEditCiudad("");
      setProvincia("");
      setTelefonoOficina("");
      setTelefonoAdicional("");
      setMailAdicional("");

      await sendInvitationEmail(email); 
      alert("Usuario creado y correo de invitación enviado exitosamente.");
      setShowForm(false);

      await loadInitialData(); // Recarga en segundo plano
    } catch (err) {
      console.error(err);
      alert("Error al crear el usuario");
    }
  }

  // NUEVO: Función para cargar los datos en el form de edición
  function handleEditUser(user) {
    setEditingUser(user);
    setEditRole(user.role || "customer");
    setEditFullName(user.full_name || "");
    setEditPhone(user.phone || "");
    setEditBusinessName(user.business_name || "");
    setEditDeliveryMethod(user.delivery_method || "");
    setEditCarrierName(user.carrier_name || "");
    setEditCarrierPhone(user.carrier_phone || "");
    setEditDeliveryAddress(user.delivery_address || "");
    setEditCuit(user.cuit || "");
    setEditCondicionFiscal(user.condicion_fiscal || "");
    setEditDireccion(user.direccion || "");
    setEditDireccionEntrega(user.direccion_entrega || "");
    setEditDireccionTransporte(user.direccion_transporte || "");
    setEditCiudad(user.ciudad || "");
    setEditProvincia(user.provincia || "");
    setEditTelefonoOficina(user.telefono_oficina || "");
    setEditTelefonoAdicional(user.telefono_adicional || "");
    setEditMailAdicional(user.mail_adicional || "");
    
    // Mapear las empresas para obtener solo los IDs
    const userCompanyIds = user.companies?.map((c) => c.id || c) || [];
    setEditCompanies(userCompanyIds);
    
    setShowEditForm(true);
    
    // Opcional: hacer scroll suave hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdateUser() {
    try {
      // Aseguramos capturar el ID más reciente
      const userId = editingUser.id; 
      
      const updatedData = {
        role: editRole,
        companies: editCompanies,
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
      
        business_name: editBusinessName.trim(),
        delivery_method: editDeliveryMethod.trim(),
        carrier_name: editCarrierName.trim(),
        carrier_phone: editCarrierPhone.trim(),
        delivery_address: editDeliveryAddress.trim(),
        cuit: editCuit.trim(),
        condicion_fiscal: editCondicionFiscal.trim(),
        direccion: editDireccion.trim(),
        direccion_entrega: editDireccionEntrega.trim(),
        direccion_transporte: editDireccionTransporte.trim(),
        ciudad: editCiudad.trim(),
        provincia: editProvincia.trim(),
        telefono_oficina: editTelefonoOficina.trim(),
        telefono_adicional: editTelefonoAdicional.trim(),
        mail_adicional: editMailAdicional.trim(),
      };

      console.log(`🚀 Intentando actualizar al usuario: ${userId}`);
      console.log("🛠️ Con los datos:", updatedData);

      await updateUser(userId, updatedData); // Usamos el ID del estado actual

      setShowEditForm(false);
      setEditingUser(null);
      await loadInitialData(); // Recarga la lista limpia
      setToast("✓ Usuario actualizado con éxito");
      setTimeout(() => setToast(""), 3000); // Se oculta a los 3 segundos
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("Revisa la consola para ver el error del servidor.");
    }
  }

  async function handleToggleUser(user) {
    try {
      await toggleUserStatus(user.id, !user.is_active);
      await loadInitialData();
  
      // Actualizamos editingUser si es el mismo usuario
      if (editingUser?.id === user.id) {
        setEditingUser(prev => ({ ...prev, is_active: !prev.is_active }));
      }
  
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="users-loading">Cargando datos de administración...</div>;
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Usuarios</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo usuario
        </button>
      </div>

      {/* CREAR USUARIO */}
      {showForm && (
  <div className="card">
    <h3>Crear usuario</h3>

    <div className="form-grid">
      {/* 1. Datos Personales */}
        <div className="form-group"><label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Nombre Completo</label>
          <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Teléfono</label>
          <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Teléfono Adicional</label>
          <input className="form-input" value={telefonoAdicional} onChange={(e) => setTelefonoAdicional(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Mail Adicional</label>
          <input className="form-input" value={mailAdicional} onChange={(e) => setMailAdicional(e.target.value)} />
        </div>
  
        {/* 2. Datos Comerciales */}
        <div className="form-group"><label className="form-label">Razón Social</label>
          <input className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">CUIT</label>
          <input className="form-input" value={cuit} onChange={(e) => setCuit(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Condición Fiscal</label>
          <input className="form-input" value={condicionFiscal} onChange={(e) => setCondicionFiscal(e.target.value)} />
        </div>
  
        {/* 3. Logística y Ubicación */}
        <div className="form-group"><label className="form-label">Dirección Fiscal</label>
          <input className="form-input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Dirección Entrega</label>
          <input className="form-input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Ciudad</label>
          <input className="form-input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Provincia</label>
          <input className="form-input" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
        </div>
        
        {/* 4. Transporte */}
        <div className="form-group"><label className="form-label">Forma de Entrega</label>
          <input className="form-input" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Transporte</label>
          <input className="form-input" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Dirección Transporte</label>
          <input className="form-input" value={direccionTransporte} onChange={(e) => setDireccionTransporte(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Teléfono Transporte</label>
          <input className="form-input" value={carrierPhone} onChange={(e) => setCarrierPhone(e.target.value)} />
        </div>
  
        {/* 5. Otros */}
        <div className="form-group"><label className="form-label">Teléfono Oficina</label>
          <input className="form-input" value={telefonoOficina} onChange={(e) => setTelefonoOficina(e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Tipo de Usuario</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
          <div className="companies-box">
            <h4>Empresas Disponibles</h4>
            <div className="custom-multiselect">
              <div className="chips-container">
                {selectedCompanies.map(id => {
                  const comp = allCompanies.find(c => c.id === id);
                  return (
                    <span key={id} className="chip">
                      {comp?.name}
                      <button 
                        type="button" 
                        className="chip-remove" 
                        onClick={() => setSelectedCompanies(p => p.filter(x => x !== id))}
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
                {selectedCompanies.length === 0 && <span className="placeholder">Selecciona empresas...</span>}
              </div>
          
              <div className="dropdown-options">
                {allCompanies.map((c) => {
                  const isSelected = selectedCompanies.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCompanies(p => p.filter(id => id !== c.id));
                        } else {
                          setSelectedCompanies(p => [...p, c.id]);
                        }
                      }}
                    >
                      <input type="checkbox" checked={isSelected} readOnly />
                      {c.name}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="actions-row">
            <button className="btn-primary" onClick={handleCreateUser}>
              Crear
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEmail("");
                setFullName("");
                setPhone("");
                setRole("customer");
                setSelectedCompanies([]);
                setBusinessName("");
                setDeliveryMethod("");
                setCarrierName("");
                setCarrierPhone("");
                setDeliveryAddress("");
                // Nuevos estados
                setCuit("");
                setCondicionFiscal("");
                setDireccion("");
                setDireccionEntrega("");
                setDireccionTransporte("");
                setCiudad("");
                setProvincia("");
                setTelefonoOficina("");
                setTelefonoAdicional("");
                setMailAdicional("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* EDICIÓN DE USUARIO */}
      {showEditForm && editingUser && (
  <div className="card">
    <h3>Editar usuario</h3>
    <p className="muted-email"><strong>Email:</strong> {editingUser.email}</p>

    {/* DATOS PERSONALES */}
    <div className="form-section">
      <div className="form-section-title">Datos Personales</div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Nombre Completo</label>
          <input className="form-input" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono Adicional</label>
          <input className="form-input" value={editTelefonoAdicional} onChange={(e) => setEditTelefonoAdicional(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono Oficina</label>
          <input className="form-input" value={editTelefonoOficina} onChange={(e) => setEditTelefonoOficina(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Mail Adicional</label>
          <input className="form-input" value={editMailAdicional} onChange={(e) => setEditMailAdicional(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de Usuario</label>
          <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </div>

    {/* DATOS COMERCIALES */}
    <div className="form-section">
      <div className="form-section-title">Datos Comerciales</div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Razón Social</label>
          <input className="form-input" value={editBusinessName} onChange={(e) => setEditBusinessName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">CUIT</label>
          <input className="form-input" value={editCuit} onChange={(e) => setEditCuit(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Condición Fiscal</label>
          <input className="form-input" value={editCondicionFiscal} onChange={(e) => setEditCondicionFiscal(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Ciudad</label>
          <input className="form-input" value={editCiudad} onChange={(e) => setEditCiudad(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Provincia</label>
          <input className="form-input" value={editProvincia} onChange={(e) => setEditProvincia(e.target.value)} />
        </div>
      </div>
    </div>

    {/* TRANSPORTE */}
    <div className="form-section">
      <div className="form-section-title">Transporte y Entrega</div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Forma de Entrega</label>
          <input className="form-input" value={editDeliveryMethod} onChange={(e) => setEditDeliveryMethod(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Dirección Entrega</label>
          <input className="form-input" value={editDeliveryAddress} onChange={(e) => setEditDeliveryAddress(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Transporte</label>
          <input className="form-input" value={editCarrierName} onChange={(e) => setEditCarrierName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Dirección Transporte</label>
          <input className="form-input" value={editDireccionTransporte} onChange={(e) => setEditDireccionTransporte(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono Transporte</label>
          <input className="form-input" value={editCarrierPhone} onChange={(e) => setEditCarrierPhone(e.target.value)} />
        </div>
      </div>
    </div>

    {/* EMPRESAS */}
    <div className="form-section">
      <div className="form-section-title">Empresas Asignadas</div>
      <div className="companies-box">
        <div className="custom-multiselect">
          <div className="chips-container">
            {editCompanies.map(id => {
              const comp = allCompanies.find(c => c.id === id);
              return (
                <span key={id} className="chip">
                  {comp?.name}
                  <button type="button" className="chip-remove"
                    onClick={() => setEditCompanies(p => p.filter(x => x !== id))}>
                    &times;
                  </button>
                </span>
              );
            })}
            {editCompanies.length === 0 && <span className="placeholder">Selecciona empresas...</span>}
          </div>
          <div className="dropdown-options">
            {allCompanies.map((c) => {
              const isSelected = editCompanies.includes(c.id);
              return (
                <div key={c.id} className={`option-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isSelected) setEditCompanies(p => p.filter(id => id !== c.id));
                    else setEditCompanies(p => [...p, c.id]);
                  }}>
                  <input type="checkbox" checked={isSelected} readOnly />
                  {c.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ESTADO DEL USUARIO */}
    <div className="form-section">
      <div className="form-section-title">Estado de la cuenta</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "14px", color: "#555" }}>
          El usuario está actualmente{" "}
          <strong style={{ color: editingUser?.is_active ? "#16a34a" : "#dc2626" }}>
            {editingUser?.is_active ? "Activo" : "Inactivo"}
          </strong>
        </span>
        <button
          className={editingUser?.is_active ? "btn-danger" : "btn-success"}
          onClick={() => handleToggleUser(editingUser)}
        >
          {editingUser?.is_active ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>

    <div className="actions-row">
      <button className="btn-primary" onClick={handleUpdateUser}>Guardar</button>
      <button className="btn-secondary" onClick={() => { setShowEditForm(false); setEditingUser(null); }}>Cancelar</button>
    </div>
  </div>
)}

{/* TABLA DE USUARIOS */}
<div className="table-wrapper">
  <table className="users-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Razón Social</th>
        <th>CUIT</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.id}>

          <td>{user.full_name || "-"}</td>

          <td>{user.business_name || "-"}</td>

          <td>{user.cuit || "-"}</td>

          <td>
            <span className={`status ${user.is_active ? "active" : "inactive"}`}>
              {user.is_active ? "Activo" : "Inactivo"}
            </span>
          </td>

          <td className="actions">
            <button
              className="btn-secondary"
              onClick={() => handleEditUser(user)}
            >
              Editar
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedUser(user);
                setTimeout(() => {
                  document
                    .getElementById("user-detail-card")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }}
            >
              Ver detalle
            </button>
          </td>

        </tr>
      ))}
    </tbody>
  </table>
        
        {selectedUser && (
  <div id="user-detail-card" className="user-detail-card">
    <h2>Detalle del usuario</h2>

    <div className="detail-grid">

      <div className="detail-section-card">
        <h3>Datos Personales</h3>
        <div className="detail-row">
          <span className="detail-label">Email</span>
          <span className="detail-value">{selectedUser.email}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Nombre</span>
          <span className={`detail-value ${!selectedUser.full_name ? 'empty' : ''}`}>
            {selectedUser.full_name || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Teléfono</span>
          <span className={`detail-value ${!selectedUser.phone ? 'empty' : ''}`}>
            {selectedUser.phone || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Teléfono Adicional</span>
          <span className={`detail-value ${!selectedUser.telefono_adicional ? 'empty' : ''}`}>
            {selectedUser.telefono_adicional || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Mail Adicional</span>
          <span className={`detail-value ${!selectedUser.mail_adicional ? 'empty' : ''}`}>
            {selectedUser.mail_adicional || 'Sin datos'}
          </span>
        </div>
      </div>

      <div className="detail-section-card">
        <h3>Datos Comerciales</h3>
        <div className="detail-row">
          <span className="detail-label">Razón Social</span>
          <span className={`detail-value ${!selectedUser.business_name ? 'empty' : ''}`}>
            {selectedUser.business_name || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">CUIT</span>
          <span className={`detail-value ${!selectedUser.cuit ? 'empty' : ''}`}>
            {selectedUser.cuit || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Condición Fiscal</span>
          <span className={`detail-value ${!selectedUser.condicion_fiscal ? 'empty' : ''}`}>
            {selectedUser.condicion_fiscal || 'Sin datos'}
          </span>
        </div>
      </div>

      <div className="detail-section-card">
        <h3>Logística y Ubicación</h3>
        <div className="detail-row">
          <span className="detail-label">Dirección Fiscal</span>
          <span className={`detail-value ${!selectedUser.direccion ? 'empty' : ''}`}>
            {selectedUser.direccion || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Dirección Entrega</span>
          <span className={`detail-value ${!selectedUser.delivery_address ? 'empty' : ''}`}>
            {selectedUser.delivery_address || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Ciudad</span>
          <span className={`detail-value ${!selectedUser.ciudad ? 'empty' : ''}`}>
            {selectedUser.ciudad || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Provincia</span>
          <span className={`detail-value ${!selectedUser.provincia ? 'empty' : ''}`}>
            {selectedUser.provincia || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Teléfono Oficina</span>
          <span className={`detail-value ${!selectedUser.telefono_oficina ? 'empty' : ''}`}>
            {selectedUser.telefono_oficina || 'Sin datos'}
          </span>
        </div>
      </div>

      <div className="detail-section-card">
        <h3>Transporte</h3>
        <div className="detail-row">
          <span className="detail-label">Forma de Entrega</span>
          <span className={`detail-value ${!selectedUser.delivery_method ? 'empty' : ''}`}>
            {selectedUser.delivery_method || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Transporte</span>
          <span className={`detail-value ${!selectedUser.carrier_name ? 'empty' : ''}`}>
            {selectedUser.carrier_name || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Dirección Transporte</span>
          <span className={`detail-value ${!selectedUser.direccion_transporte ? 'empty' : ''}`}>
            {selectedUser.direccion_transporte || 'Sin datos'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Teléfono Transporte</span>
          <span className={`detail-value ${!selectedUser.carrier_phone ? 'empty' : ''}`}>
            {selectedUser.carrier_phone || 'Sin datos'}
          </span>
        </div>
      </div>

    </div>
  </div>
)}

{toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}