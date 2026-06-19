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

  // 2. Estado local para guardar las 10 empresas de la base de datos
  const [allCompanies, setAllCompanies] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [phone, setPhone] = useState("");

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("customer");
  const [editCompanies, setEditCompanies] = useState([]);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // 3. Cargamos tanto los usuarios como las empresas de administración en paralelo
  async function loadInitialData() {
    try {
      setLoading(true);
      const [usersResponse, companiesResponse] = await Promise.all([
        getUsers(),
        getAdminCompanies(), // Llama a /admin/companies
      ]);

      setUsers(usersResponse.data || []);
      
      // Dependiendo de cómo responda tu axios/api, si devuelve directo el array o viene en .data
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
        companies: selectedCompanies,
      });

      await loadInitialData(); // Recarga todo el set de datos

      setShowForm(false);
      setEmail("");
      setFullName("");
      setPhone("");
      setRole("customer");
      setSelectedCompanies([]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateUser() {
    try {
      await updateUser(editingUser.id, {
        full_name: editFullName,
        phone: editPhone,
        role: editRole,
        companies: editCompanies,
      });

      await loadInitialData();
      setShowEditForm(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleUser(user) {
    try {
      await toggleUserStatus(user.id, !user.is_active);
      await loadInitialData();
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
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              placeholder="Nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="companies-box">
            <h4>Empresas Disponibles</h4>
            
            {/* Contenedor principal del selector moderno */}
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
          
              {/* Lista desplegable con scroll interno */}
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
            <button className="btn" onClick={handleCreateUser}>
              Crear
            </button>
            <button
              className="btn"
              onClick={() => {
                setShowForm(false);
                setEmail("");
                setFullName("");
                setPhone("");
                setRole("customer");
                setSelectedCompanies([]);
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
          <p className="muted">{editingUser.email}</p>

          <div className="form-grid">
            <input
              placeholder="Nombre"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
            />

            <input
              placeholder="Teléfono"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />

            <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

<div className="companies-box">
  <h4>Asignar Empresas</h4>
  
  <div className="custom-multiselect">
    <div className="chips-container">
      {editCompanies.map(id => {
        const comp = allCompanies.find(c => c.id === id);
        return (
          <span key={id} className="chip">
            {comp?.name}
            <button 
              type="button" 
              className="chip-remove" 
              onClick={() => setEditCompanies(p => p.filter(x => x !== id))}
            >
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
          <div 
            key={c.id} 
            className={`option-item ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              if (isSelected) {
                setEditCompanies(p => p.filter(id => id !== c.id));
              } else {
                setEditCompanies(p => [...p, c.id]);
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
            <button className="btn" onClick={handleUpdateUser}>
              Guardar
            </button>
            <button className="btn" onClick={() => setShowEditForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE USUARIOS */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.full_name || "-"}</td>
                <td>
                  <span className={`role ${user.role}`}>{user.role}</span>
                </td>
                <td>{user.phone || "-"}</td>
                <td>
                  <span className={`status ${user.is_active ? "active" : "inactive"}`}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn-small"
                    onClick={() => {
                      setEditingUser(user);
                      setEditRole(user.role);
                      setEditFullName(user.full_name || "");
                      setEditPhone(user.phone || "");
                      setEditCompanies(user.companies?.map((c) => c.id) || []);
                      setShowEditForm(true);
                    }}
                  >
                    Editar
                  </button>
                  <button className="btn-small" onClick={() => handleToggleUser(user)}>
                    {user.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}