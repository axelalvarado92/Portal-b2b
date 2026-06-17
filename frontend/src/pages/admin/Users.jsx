import { useEffect, useState } from "react";
import "./Users.css";

import {
getUsers,
createUser,
updateUser,
toggleUserStatus,
} from "../../services/adminUserService";

import { useCompany } from "../../context/CompanyContext";

export default function Users() {
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

const { companies } = useCompany();

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

async function loadUsers() {
try {
const response = await getUsers();
setUsers(response.data || []);
} catch (err) {
console.error(err);
} finally {
setLoading(false);
}
}

useEffect(() => {
loadUsers();
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


  await loadUsers();

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
role: editRole,
companies: editCompanies,
});


  await loadUsers();
  setShowEditForm(false);
} catch (err) {
  console.error(err);
}


}

async function handleToggleUser(user) {
try {
await toggleUserStatus(
user.id,
!user.is_active
);


  await loadUsers();
} catch (err) {
  console.error(err);
}


}

if (loading) {
return ( <div className="users-loading">
Cargando usuarios... </div>
);
}

return ( <div className="users-page"> <div className="users-header"> <h1>Usuarios</h1>


    <button
      className="btn-primary"
      onClick={() => setShowForm(true)}
    >
      + Nuevo usuario
    </button>
  </div>

  {showForm && (
    <div className="card">
      <h3>Crear usuario</h3>

      <div className="form-grid">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          placeholder="Nombre"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
        />

        <input
          placeholder="Teléfono"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="customer">
            Customer
          </option>

          <option value="admin">
            Admin
          </option>
        </select>
      </div>

      <div className="companies-box">
        <h4>Empresas</h4>

        <div className="companies-grid">
          {companies.map((c) => (
            <label
              key={c.id}
              className="company-item"
            >
              <input
                type="checkbox"
                checked={selectedCompanies.includes(
                  c.id
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCompanies(
                      (p) => [...p, c.id]
                    );
                  } else {
                    setSelectedCompanies(
                      (p) =>
                        p.filter(
                          (id) => id !== c.id
                        )
                    );
                  }
                }}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="actions-row">
        <button
          className="btn"
          onClick={handleCreateUser}
        >
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

  {showEditForm && editingUser && (
    <div className="card">
      <h3>Editar usuario</h3>

      <p className="muted">
        {editingUser.email}
      </p>

      <select
        value={editRole}
        onChange={(e) =>
          setEditRole(e.target.value)
        }
      >
        <option value="customer">
          Customer
        </option>

        <option value="admin">
          Admin
        </option>
      </select>

      <div className="companies-grid">
        {companies.map((c) => (
          <label
            key={c.id}
            className="company-item"
          >
            <input
              type="checkbox"
              checked={editCompanies.includes(
                c.id
              )}
              onChange={(e) => {
                if (e.target.checked) {
                  setEditCompanies(
                    (p) => [...p, c.id]
                  );
                } else {
                  setEditCompanies(
                    (p) =>
                      p.filter(
                        (id) => id !== c.id
                      )
                  );
                }
              }}
            />
            {c.name}
          </label>
        ))}
      </div>

      <div className="actions-row">
        <button
          className="btn"
          onClick={handleUpdateUser}
        >
          Guardar
        </button>

        <button
          className="btn"
          onClick={() =>
            setShowEditForm(false)
          }
        >
          Cancelar
        </button>
      </div>
    </div>
  )}

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

            <td>
              {user.full_name || "-"}
            </td>

            <td>
              <span
                className={`role ${user.role}`}
              >
                {user.role}
              </span>
            </td>

            <td>
              {user.phone || "-"}
            </td>

            <td>
              <span
                className={`status ${
                  user.is_active
                    ? "active"
                    : "inactive"
                }`}
              >
                {user.is_active
                  ? "Activo"
                  : "Inactivo"}
              </span>
            </td>

            <td className="actions">
              <button
                className="btn-small"
                onClick={() => {
                  setEditingUser(user);
                  setEditRole(user.role);
                  setEditCompanies([]);
                  setShowEditForm(true);
                }}
              >
                Editar
              </button>

              <button
                className="btn-small"
                onClick={() =>
                  handleToggleUser(user)
                }
              >
                {user.is_active
                  ? "Desactivar"
                  : "Activar"}
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
