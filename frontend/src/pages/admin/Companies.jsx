import {
  useEffect,
  useState,
} from "react";

import {
  getCompanies,
  createCompany,
  updateCompany,
} from "../../services/adminCompanyService";

export default function Companies() {

  const [companies, setCompanies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
  
  const [showForm, setShowForm] =
    useState(false);
  
  const [name, setName] =
    useState("");
  
  const [contactEmail, setContactEmail] =
    useState("");
  
  const [commissionPercentage, setCommissionPercentage] =
    useState(0);
  
  const [whatsappPhone, setWhatsappPhone] =
    useState("");

  const [showEditForm, setShowEditForm] =
    useState(false);
  
  const [editingCompany, setEditingCompany] =
    useState(null);
  
  const [editName, setEditName] =
    useState("");
  
  const [editEmail, setEditEmail] =
    useState("");
  
  const [editWhatsapp, setEditWhatsapp] =
    useState("");
  
  const [
    editCommission,
    setEditCommission,
  ] = useState(0);

  useEffect(() => {

    async function loadCompanies() {

      try {

        const response =
          await getCompanies();

        console.log(
          "COMPANIES:",
          response
        );

        setCompanies(
          response.data || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadCompanies();

  }, []);

    async function handleCreateCompany() {

      try {
    
        await createCompany({
    
          name,
    
          contact_email:
            contactEmail,
    
          commission_percentage:
            Number(
              commissionPercentage
            ),
    
          whatsapp_phone:
            whatsappPhone,
    
        });
    
        alert(
          "Empresa creada"
        );
    
        window.location.reload();
    
      } catch (err) {
    
        console.error(err);
    
        alert(
          "Error al crear empresa"
        );
    
      }
    
    }

    async function handleUpdateCompany() {

      try {
    
        await updateCompany(
          editingCompany.id,
          {
            name: editName,
            contact_email:
              editEmail,
            whatsapp_phone:
              editWhatsapp,
            commission_percentage:
              Number(
                editCommission
              ),
          }
        );
    
        alert(
          "Empresa actualizada"
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
        Cargando empresas...
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
        Empresas
      </h1>
    
      <button
        onClick={() =>
          setShowForm(true)
        }
      >
        + Nueva Empresa
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
      Crear empresa
    </h3>

    <input
      placeholder="Nombre"
      value={name}
      onChange={(e) =>
        setName(
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
      placeholder="Email"
      value={contactEmail}
      onChange={(e) =>
        setContactEmail(
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
      placeholder="Whatsapp"
      value={whatsappPhone}
      onChange={(e) =>
        setWhatsappPhone(
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
      type="number"
      placeholder="Comisión %"
      value={
        commissionPercentage
      }
      onChange={(e) =>
        setCommissionPercentage(
          e.target.value
        )
      }
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "20px",
      }}
    />

    <button
      onClick={
        handleCreateCompany
      }
    >
      Crear empresa
    </button>
    
    <button
      onClick={() => {
    
        setShowForm(false);
    
        setName("");
    
        setContactEmail("");
    
        setWhatsappPhone("");
    
        setCommissionPercentage(0);
    
      }}
      style={{
        marginLeft: "10px",
      }}
    >
      Cancelar
    </button>

  </div>

  )}

          {showEditForm && editingCompany && (

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
                Editar empresa
              </h3>
          
              <input
                value={editName}
                onChange={(e) =>
                  setEditName(
                    e.target.value
                  )
                }
                placeholder="Nombre"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              />
          
              <input
                value={editEmail}
                onChange={(e) =>
                  setEditEmail(
                    e.target.value
                  )
                }
                placeholder="Email"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              />
          
              <input
                value={editWhatsapp}
                onChange={(e) =>
                  setEditWhatsapp(
                    e.target.value
                  )
                }
                placeholder="Whatsapp"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              />
          
              <button
                onClick={
                  handleUpdateCompany
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
          
            </div>
          
          )}

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
              Nombre
            </th>

            <th style={thStyle}>
              Email
            </th>

            <th style={thStyle}>
              Estado
            </th>

            <th style={thStyle}>
              Acciones
            </th>

          </tr>

        </thead>

        <tbody>

          {companies.map(company => (

            <tr key={company.id}>

              <td style={tdStyle}>
                {company.name}
              </td>

              <td style={tdStyle}>
                {company.contact_email || "-"}
              </td>

              <td style={tdStyle}>
                {company.is_active
                  ? "✅"
                  : "❌"}
              </td>
              
              <td style={tdStyle}>
              
                <button
                  onClick={() => {
              
                    setEditingCompany(
                      company
                    );
              
                    setEditName(
                      company.name || ""
                    );
              
                    setEditEmail(
                      company.contact_email || ""
                    );
              
                    setEditWhatsapp(
                      company.whatsapp_phone || ""
                    );
              
                    setEditCommission(
                      company.commission_percentage || 0
                    );
              
                    setShowEditForm(true);
              
                  }}
                >
                  Editar
                </button>
              
              
              </td>

            </tr>

          ))}

        </tbody>
 
      </table>

    </div>

  );

}

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