import {
  useEffect,
  useState,
} from "react";

import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "../../services/adminUserService";

import {
  useCompany,
} from "../../context/CompanyContext";

export default function Users() {

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const {
    companies,
  } = useCompany();

  const [showForm, setShowForm] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [role, setRole] =
    useState("customer");

  const [showEditForm, setShowEditForm] =
  useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [editRole, setEditRole] =
    useState("customer");

  const [
    editCompanies,
    setEditCompanies,
  ] = useState([]);

  const [
    selectedCompanies,
    setSelectedCompanies,
  ] = useState([]);

  const thStyle = {

    textAlign: "left",

    padding: "12px",

    borderBottom:
      "1px solid #ddd",

    background: "#f5f5f5",

  };

  const tdStyle = {

    padding: "12px",

    borderBottom:
      "1px solid #eee",

  };

  useEffect(() => {

    async function loadUsers() {

      try {

        const response =
          await getUsers();

        console.log(
          "USERS:",
          response
        );

        setUsers(
          response.data || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadUsers();

  }, []);
  async function handleCreateUser() {

  try {

    await createUser({

      email,

      full_name: fullName,

      role,

      companies:
        selectedCompanies,

    });

    alert(
      "Usuario creado"
    );

    window.location.reload();

  } catch (err) {

    console.error(err);

    alert(
      "Error al crear usuario"
    );

  }
  }
  
  async function handleUpdateUser() {

  try {

    await updateUser(
      editingUser.id,
      {
        role: editRole,
        companies: editCompanies,
      }
    );

    alert(
      "Usuario actualizado"
    );

    window.location.reload();

  } catch (err) {

    console.error(err);

    alert(
      "Error al actualizar"
    );

  }

}
  async function handleToggleUser(
  user
) {

  try {

    await toggleUserStatus(
      user.id,
      !user.is_active
    );

    alert(
      "Estado actualizado"
    );

    window.location.reload();

  } catch (err) {

    console.error(err);

    alert(
      "Error al actualizar"
    );

  }

}
  
  if (loading) {

    return (
      <p>
        Cargando usuarios...
      </p>
    );

  }

  return (

<div
  style={{
    padding: "40px",
  }}
>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    }}
  >

    <h1>
      Usuarios
    </h1>

    <button
      onClick={() =>
        setShowForm(true)
      }
    >
      + Nuevo Usuario
    </button>

  </div>

  {showForm && (

    <div
      style={{
        background: "#fff",
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >

      <h3>
        Crear usuario
      </h3>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <input
        placeholder="Nombre"
        value={fullName}
        onChange={(e) =>
          setFullName(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <select
        value={role}
        onChange={(e) =>
          setRole(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
        }}
      >

        <option value="customer">
          Customer
        </option>

        <option value="admin">
          Admin
        </option>

      </select>

      <h4>
        Empresas
      </h4>

      {companies.map(company => (

        <div key={company.id}>

          <label>

            <input
              type="checkbox"
              checked={
                selectedCompanies.includes(
                  company.id
                )
              }
              onChange={(e) => {

                if (
                  e.target.checked
                ) {

                  setSelectedCompanies(
                    prev => [
                      ...prev,
                      company.id,
                    ]
                  );

                } else {

                  setSelectedCompanies(
                    prev =>
                      prev.filter(
                        id =>
                          id !== company.id
                      )
                  );

                }

              }}
            />

            {" "}
            {company.name}

          </label>

        </div>

      ))}

      <br />

      <button
        onClick={handleCreateUser}
      >
        Crear usuario
      </button>

    </div>

  )}

  {showEditForm && editingUser && (

    <div
      style={{
        background: "#fff",
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >

      <h3>
        Editar usuario
      </h3>

      <p>
        {editingUser.email}
      </p>

      <select
        value={editRole}
        onChange={(e) =>
          setEditRole(
            e.target.value
          )
        }
      >

        <option value="customer">
          Customer
        </option>

        <option value="admin">
          Admin
        </option>

      </select>

      <h4>
        Empresas
      </h4>

      {companies.map(company => (

        <div key={company.id}>

          <label>

            <input
              type="checkbox"
              checked={
                editCompanies.includes(
                  company.id
                )
              }
              onChange={(e) => {

                if (e.target.checked) {

                  setEditCompanies(
                    prev => [
                      ...prev,
                      company.id,
                    ]
                  );

                } else {

                  setEditCompanies(
                    prev =>
                      prev.filter(
                        id =>
                          id !== company.id
                      )
                  );

                }

              }}
            />

            {" "}
            {company.name}

          </label>

        </div>

      ))}
      <br />

      <button
        onClick={
          handleUpdateUser
        }
      >
        Guardar cambios
      </button>
      
      <button
        onClick={() =>
          setShowEditForm(false)
        }
        style={{
          marginLeft: "10px",
        }}
      >
        Cancelar
      </button>

      <br />

    </div>

  )}

  <br />

  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      background: "#fff",
    }}
  >

    <thead>

      <tr>

        <th style={thStyle}>
          Email
        </th>

        <th style={thStyle}>
          Nombre
        </th>

        <th style={thStyle}>
          Rol
        </th>

        <th style={thStyle}>
          Activo
        </th>

        <th style={thStyle}>
          Acciones
        </th>

      </tr>

    </thead>

    <tbody>

      {users.map(user => (

        <tr key={user.id}>

          <td style={tdStyle}>
            {user.email}
          </td>

          <td style={tdStyle}>
            {user.full_name || "-"}
          </td>

          <td style={tdStyle}>
            {user.role}
          </td>

          <td style={tdStyle}>
            {user.is_active
              ? "✅"
              : "❌"}
          </td>

          <td style={tdStyle}>

            <button
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
                style={{
                  marginLeft: "10px",
                }}
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
);

}


