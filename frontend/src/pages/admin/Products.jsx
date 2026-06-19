import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsExcel // Tu nuevo servicio de integración
} from "../../services/adminProductService";

import { getCompanies } from "../../services/adminCompanyService";
import "./Products.css";
import { Upload } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [sortAlpha, setSortAlpha] = useState(false);
  const [filterCompany, setFilterCompany] = useState("");

  // Estados para creación manual
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  // Estados para la IMPORTACIÓN ASÍNCRONA (Tu Lambda)
  const [showImportForm, setShowImportForm] = useState(false);
  const [importCompanyId, setImportCompanyId] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Estados para edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStockQuantity, setEditStockQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await getProducts();
      const companiesResponse = await getCompanies();
      
      setCompanies(companiesResponse.data || []);
      setProducts(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Capturar el archivo seleccionado por el Admin
  const handleExcelUpload = (e) => {
    setExcelFile(e.target.files[0]);
  };

  // Enviar parámetros a la arquitectura S3 + Lambda
  const handleProcessImport = async () => {
    if (!importCompanyId) {
      alert("Por favor, selecciona la empresa para esta lista de precios.");
      return;
    }
    if (!excelFile) {
      alert("Por favor, selecciona un archivo Excel (.xlsx o .xls).");
      return;
    }

    setIsImporting(true);

    try {
      // 1. PASO CRÍTICO: Definir la S3 Key de forma dinámica
      const timestamp = Date.now();
      const cleanFileName = excelFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const generatedS3Key = `uploads/companies/${importCompanyId}/${timestamp}_${cleanFileName}`;

      // 3. Ejecución del trigger para tu Lambda procesadora
      const result = await importProductsExcel(importCompanyId, generatedS3Key);

      alert(`¡Importación procesada! Servidor usó: ${result.engine_used || 'Pandas'}. Filas totales: ${result.total_rows || 0}`);
      
      setShowImportForm(false);
      setExcelFile(null);
      setImportCompanyId("");
      loadProducts(); // Refrescar la grilla de productos
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al solicitar la importación masiva.");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div style={{ padding: "40px" }}>
      {/* CABECERA CON ICONO LUCIDE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <h1 className="products-page-title" style={{ color: "#6b1426" }}>Productos</h1>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        
        {/* Botón de Importar alineado y corregido */}
        <button 
          className="snb-btn-secondary" 
          onClick={() => { setShowImportForm(true); setShowForm(false); }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "8px", 
            padding: "10px 15px",
            height: "42px" // Ajusta esta altura si tu botón "+ Nuevo producto" mide distinto para que queden simétricos
          }}
        >
          <Upload size={16} style={{ shrink: 0, display: "block" }} />
          <span>Importar Lista (Excel)</span>
        </button>
    
        <button 
          className="snb-btn" 
          onClick={() => { setShowForm(true); setShowImportForm(false); }}
          style={{ height: "42px" }} // Misma altura para simetría total
        >
          + Nuevo producto
        </button>
      </div>
    </div>

      {/* FORMULARIO DE IMPORTACIÓN ASOCIADO A TU LAMBDA */}
      {showImportForm && (
        <div className="product-form-card" style={{ borderLeft: "4px solid #6b1426", padding: "20px", marginBottom: "20px" }}>
          <h3>Importar Lista de Precios Masiva (S3 Engine)</h3>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
            Nuestra Lambda normalizará automáticamente las columnas buscando campos equivalentes a <strong>Código</strong>, <strong>Nombre/Descripción</strong> y <strong>Precio/Costo</strong>.
          </p>

          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Empresa Destino:</label>
          <select
            className="product-input"
            value={importCompanyId}
            onChange={(e) => setImportCompanyId(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
          >
            <option value="">Seleccionar empresa...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>

          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Archivo de Precios:</label>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleExcelUpload} 
            style={{ marginBottom: "20px", display: "block" }}
          />

          <button className="snb-btn" onClick={handleProcessImport} disabled={isImporting}>
            {isImporting ? "Procesando en AWS Lambda..." : "Subir e Iniciar Procesamiento"}
          </button>
          <button className="snb-btn-secondary" onClick={() => setShowImportForm(false)} style={{ marginLeft: "10px" }}>
            Cancelar
          </button>
        </div>
      )}

      {/* Buscador */}
      <input
        className="product-search"
        placeholder="Buscar producto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showEditForm && editingProduct && (
        <div className="product-form-card">
          <h3>Editar producto</h3>
      
          <input
            className="product-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nombre"
          />
      
          <input
            className="product-input"
            value={editCode}
            onChange={(e) => setEditCode(e.target.value)}
            placeholder="Código"
          />
      
          <input
            className="product-input"
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder="Precio"
          />
      
          <input
            className="product-input"
            type="number"
            value={editStockQuantity}
            onChange={(e) => setEditStockQuantity(e.target.value)}
            placeholder="Stock"
          />
      
          <input
            className="product-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de imagen"
          />
      
          <button
            className="snb-btn"
            onClick={async () => {
              try {
                await updateProduct(editingProduct.id, {
                  name: editName,
                  code: editCode,
                  price: Number(editPrice),
                  stock_quantity: Number(editStockQuantity),
                  image_url: imageUrl,
                });
                setShowEditForm(false);
                loadProducts();
              } catch (err) {
                console.error(err);
                alert("Error al actualizar producto");
              }
            }}
          >
            Guardar cambios
          </button>
      
          <button
            className="snb-btn-secondary"
            onClick={() => setShowEditForm(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>

        <select
          className="product-input"
          style={{ maxWidth: "220px", marginBottom: 0 }}
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
        >
          <option value="">Todas las empresas</option>
          {companies.map(company => (
            <option key={company.id} value={company.name}>{company.name}</option>
          ))}
        </select>
      
        <button
          className={sortAlpha ? "snb-btn" : "snb-btn-secondary"}
          onClick={() => setSortAlpha(prev => !prev)}
        >
          {sortAlpha ? "A→Z activo" : "Ordenar A→Z"}
        </button>
      
      </div>

      {/* Tabla de Productos */}
      <table className="products-table">
        <thead>
          <tr>
          <th style={thStyle}>Código</th>
          <th style={thCenterStyle}>Nombre</th>
          <th style={thCenterStyle}>Empresa</th>
          <th style={thCenterStyle}>Precio</th>
          <th style={thCenterStyle}>Stock</th>
          <th style={thCenterStyle}>Activo</th>
          <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
            {products
              .filter(product => product.name.toLowerCase().includes(search.toLowerCase()))
              .filter(product => filterCompany ? product.company_name === filterCompany : true)
              .sort((a, b) => sortAlpha ? a.name.localeCompare(b.name) : 0)
              .map(product => (
              <tr key={product.id}>
                <td style={tdStyle}>{product.code}</td>
                <td style={tdCenterStyle}>{product.name}</td>
                <td style={tdCenterStyle}>{product.company_name}</td>
                <td style={tdCenterStyle}>${product.price}</td>
                <td style={tdCenterStyle}>{product.stock_quantity}</td>
                <td style={tdCenterStyle}>{product.is_active ? "✅" : "❌"}</td>
                <td style={tdStyle}>
                  <button
                    className="snb-btn-secondary"
                    onClick={() => {
                      setEditingProduct(product);
                      setEditName(product.name || "");
                      setEditCode(product.code || "");
                      setEditPrice(product.price || 0);
                      setEditStockQuantity(product.stock_quantity || 0);
                      setImageUrl(product.image_url || "");
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

const thStyle = { textAlign: "left", padding: "12px", borderBottom: "1px solid #ddd", background: "#f5f5f5" };
const thCenterStyle = { textAlign: "center", padding: "12px", borderBottom: "1px solid #ddd", background: "#f5f5f5" };
const tdStyle = { padding: "12px", borderBottom: "1px solid #eee" };
const tdCenterStyle = { padding: "12px", borderBottom: "1px solid #eee", textAlign: "center" };