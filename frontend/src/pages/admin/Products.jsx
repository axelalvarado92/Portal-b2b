import {
  useEffect,
  useState,
} from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/adminProductService";

import {
  getCompanies,
} from "../../services/adminCompanyService";

import "./Products.css";

export default function Products() {

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);
  
  const [companies, setCompanies] =
    useState([]);
  
  const [selectedCompany, setSelectedCompany] =
    useState("");
  
  const [name, setName] =
    useState("");
  
  const [code, setCode] =
    useState("");
  
  const [price, setPrice] =
    useState("");
  
  const [stockQuantity, setStockQuantity] =
    useState("");
  
  const [hasStock, setHasStock] =
    useState(true);
  
  const [unitType, setUnitType] =
    useState("unit");

  const [search, setSearch] =
    useState("");

  const [showEditForm, setShowEditForm] =
    useState(false);
  
  const [editingProduct, setEditingProduct] =
    useState(null);
  
  const [editName, setEditName] =
    useState("");
  
  const [editCode, setEditCode] =
    useState("");
  
  const [editPrice, setEditPrice] =
    useState("");
  
  const [editStockQuantity, setEditStockQuantity] =
    useState("");
  
  const [editHasStock, setEditHasStock] =
    useState(true);
  
  const [editUnitType, setEditUnitType] =
    useState("unit");

  useEffect(() => {

    async function loadProducts() {

      try {

        const response =
          await getProducts();

        const companiesResponse =
          await getCompanies();
        
        setCompanies(
          companiesResponse.data || []
        );

        console.log(
          "PRODUCTS:",
          response
        );

        setProducts(
          response.data || []
        );

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadProducts();

  }, []);

  async function handleCreateProduct() {

    try {
  
      await createProduct({
  
        company_id:
          selectedCompany,
  
        name,
  
        code,
  
        price:
          Number(price),
  
        has_stock:
          hasStock,
  
        stock_quantity:
          Number(stockQuantity),
  
        unit_type:
          unitType,
  
      });
  
      alert(
        "Producto creado"
      );
  
      window.location.reload();
  
    } catch (err) {
  
      console.error(err);
  
      alert(
        "Error al crear producto"
      );
  
    }
  
  }
  async function handleDeleteProduct(
    productId
  ) {
  
    const confirmed =
      window.confirm(
        "¿Desactivar producto?"
      );
  
    if (!confirmed) return;
  
    try {
  
      await deleteProduct(
        productId
      );
  
      alert(
        "Producto desactivado"
      );
  
      window.location.reload();
  
    } catch (err) {
  
      console.error(err);
  
      alert(
        "Error al desactivar"
      );
  
    }
  
  }

  async function handleUpdateProduct() {
  
    try {
  
      await updateProduct(
        editingProduct.id,
        {
          name: editName,
          code: editCode,
          price: Number(editPrice),
          stock_quantity:
            Number(editStockQuantity),
          has_stock:
            editHasStock,
          unit_type:
            editUnitType,
        }
      );
  
      alert(
        "Producto actualizado"
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
        Cargando productos...
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
        Productos
      </h1>
    
      <button
        className="snb-btn"
        onClick={() =>
          setShowForm(true)
        }
      >
        + Nuevo producto
      </button>
    
    </div>

    {showForm && (

      <div className="product-form-card">
    
        <h3>
          Crear producto
        </h3>
    
        <select
          className="product-input"
          value={selectedCompany}
          onChange={(e) =>
            setSelectedCompany(
              e.target.value
            )
          }
        >
    
          <option value="">
            Seleccionar empresa
          </option>
    
          {companies.map(company => (
    
            <option
              key={company.id}
              value={company.id}
            >
              {company.name}
            </option>
    
          ))}
    
        </select>
    
        <input
          className="product-input"
          placeholder="Nombre"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />
    
        <input
          placeholder="Código"
          value={code}
          onChange={(e) =>
            setCode(
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
          placeholder="Precio"
          value={price}
          onChange={(e) =>
            setPrice(
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
          placeholder="Stock"
          value={stockQuantity}
          onChange={(e) =>
            setStockQuantity(
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
          className="snb-btn"
          onClick={
            handleCreateProduct
          }
        >
          Crear producto
        </button>
    
        <button
          className="snb-btn-secondary"
          onClick={() =>
            setShowForm(false)
          }
        >
          Cancelar
        </button>
  
      </div>
      )}

      <input
        className="product-search"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      <p>
        Mostrando {
          products.filter(product =>
            product.name
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )
          ).length
        } productos
      </p>
      
      {showEditForm && editingProduct && (

        <div className="product-form-card">
      
          <h3>
            Editar producto
          </h3>
      
          <input
            className="product-input"
            value={editName}
            onChange={(e) =>
              setEditName(
                e.target.value
              )
            }
            placeholder="Nombre"
          />
      
          <br /><br />
      
          <input
            className="product-input"
            value={editCode}
            onChange={(e) =>
              setEditCode(
                e.target.value
              )
            }
            placeholder="Código"
          />
      
          <br /><br />
      
          <input
            className="product-input"
            type="number"
            value={editPrice}
            onChange={(e) =>
              setEditPrice(
                e.target.value
              )
            }
            placeholder="Precio"
          />
      
          <br /><br />
      
          <input
            className="product-input"
            type="number"
            value={editStockQuantity}
            onChange={(e) =>
              setEditStockQuantity(
                e.target.value
              )
            }
            placeholder="Stock"
          />
      
          <br /><br />

          <input
            className="product-input"
            placeholder="URL de imagen"
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(e.target.value)
            }
          />
      
          <button
            className="snb-btn"
            onClick={
              handleUpdateProduct
            }
          >
            Guardar cambios
          </button>
      
          <button
            className="snb-btn-secondary"
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
        className="products-table"
      >

        <thead>

          <tr>

            <th style={thStyle}>
              Código
            </th>

            <th style={thStyle}>
              Nombre
            </th>

            <th style={thStyle}>
              Empresa
            </th>

            <th style={thStyle}>
              Precio
            </th>

            <th style={thStyle}>
              Stock
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

          {products
            .filter(product =>
              product.name
                .toLowerCase()
                .includes(
                  search.toLowerCase()
                )
            )
            .map(product => (

            <tr key={product.id}>

              <td style={tdStyle}>
                {product.code}
              </td>

              <td style={tdStyle}>
                {product.name}
              </td>

              <td style={tdStyle}>
                {product.company_name}
              </td>

              <td style={tdStyle}>
                ${product.price}
              </td>

              <td style={tdStyle}>
                {product.stock_quantity}
              </td>

              <td style={tdStyle}>
                {product.is_active
                  ? "✅"
                  : "❌"}
              </td>

              <td style={tdStyle}>

              <button
                className="snb-btn-secondary"
                onClick={() => {
              
                  setEditingProduct(
                    product
                  );
              
                  setEditName(
                    product.name || ""
                  );
              
                  setEditCode(
                    product.code || ""
                  );
              
                  setEditPrice(
                    product.price || 0
                  );
              
                  setEditStockQuantity(
                    product.stock_quantity || 0
                  );
              
                  setEditHasStock(
                    product.has_stock
                  );
              
                  setEditUnitType(
                    product.unit_type || "unit"
                  );
              
                  setShowEditForm(true);
              
                }}
              >
                Editar
              </button>
            
              <button
                className="snb-btn-danger"
                onClick={() =>
                  handleDeleteProduct(
                    product.id
                  )
                }
                style={{
                  marginLeft: "10px",
                }}
              >
                Desactivar
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