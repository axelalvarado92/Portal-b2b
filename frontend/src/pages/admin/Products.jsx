import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getProducts, createProduct, updateProduct, deleteProduct, 
  importProductsExcel, 
} from "../../services/adminProductService";
import { getCompanies } from "../../services/adminCompanyService";
import { Upload } from "lucide-react";
import "./Products.css";

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  
  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterCompany, setFilterCompany] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Estados de formularios
  const [showForm, setShowForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  async function loadProducts() {
    try {
      setLoading(true);
      
      const productsData = await getProducts(null, page, 20);
      
      // Accedemos correctamente a products y total_pages dentro de 'data'
      const payload = productsData.data || {}; 
      
      setProducts(payload.products || []);
      setTotalPages(payload.total_pages || 1);
      
      // Intentamos cargar empresas
      try {
        const companiesRes = await getCompanies();
        setCompanies(companiesRes.data || []);
      } catch (e) {
        console.warn("No se pudieron cargar empresas.");
      }

    } catch (err) {
      console.error("Error al cargar:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessImport() {

    if (!excelFile) {
      setToast("Seleccione un archivo Excel");
      return;
    }
  
    try {
  
      setIsImporting(true);
  
      await importProductsExcel(excelFile);
  
      setToast("Productos importados correctamente");
  
      setExcelFile(null);
      setShowImportForm(false);
  
      await loadProducts();
  
    } catch (err) {
  
      console.error(err);
  
      setToast("Error al importar productos");
  
    } finally {
  
      setIsImporting(false);
  
      setTimeout(() => setToast(""), 3000);
  
    }
  
  }

  async function handleProcessImport() {
    if (!excelFile) {
      setToast("Seleccioná un archivo Excel");
      return;
    }
  
    try {
      setIsImporting(true);
  
      await importProductsExcel(excelFile);
  
      setToast("Productos importados correctamente");
      setShowImportForm(false);
      setExcelFile(null);
  
      await loadProducts();
  
    } catch (err) {
      console.error(err);
      setToast("Error al importar productos");
    } finally {
      setIsImporting(false);
  
      setTimeout(() => {
        setToast("");
      }, 2500);
    }
  }

  useEffect(() => { loadProducts(); }, [page]);

  // Lógica de filtrado y ordenamiento en cliente (similar a customer)
  let processedProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (filterCompany) {
    processedProducts = processedProducts.filter(p => p.company_name === filterCompany);
  }

  if (sortBy === "alpha-asc") processedProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "alpha-desc") processedProducts.sort((a, b) => b.name.localeCompare(a.name));

  // ... (aquí mantén tu lógica de handleProcessImport y otros handlers)

  if (loading) return <p className="catalog-loading">Cargando catálogo administrativo...</p>;

  return (
    <div className="catalog-wrapper">
      <div className="catalog-header">
        <h1>Gestión de Productos</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="snb-btn-secondary"
            onClick={() => {
          
              if (!filterCompany) {
          
                setToast("⚠️ Seleccioná una empresa antes de importar productos.");
          
                setTimeout(() => {
                  setToast("");
                }, 3000);
          
                return;
              }
          
              setShowImportForm(true);
          
            }}
          >
            <Upload size={16} />
            Importar Excel
          </button>
          <button
            className="snb-btn"
            onClick={() => navigate("/admin/products/new")}
          >
            Nuevo producto
          </button>
        </div>
      </div>

      {/* REUTILIZAMOS LA BARRA DE HERRAMIENTAS DE CUSTOMER */}
      <div className="catalog-toolbar">
        <input
          className="catalog-search"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-filters">
          <select
              value={filterCompany}
              onChange={(e)=>setFilterCompany(e.target.value)}
          >
              <option value="">Todas las empresas</option>
          
              {companies.map(c=>(
                  <option
                      key={c.id}
                      value={c.id}
                  >
                      {c.name}
                  </option>
              ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Relevancia</option>
            <option value="alpha-asc">A - Z</option>
            <option value="alpha-desc">Z - A</option>
          </select>
        </div>
      </div>

      {showImportForm && (
      <div className="modal-overlay">
    
        <div className="import-modal">
    
          <h2>Importar productos</h2>

          <p
            style={{
              marginBottom: "20px",
              color: "#555"
            }}
          >
            Empresa seleccionada:
            <strong>
              {" "}
              {companies.find(c => c.id === filterCompany)?.name}
            </strong>
          </p>
    
          <p>
            Seleccione un archivo Excel (.xlsx)
          </p>
    
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelSelected}
          />
    
          {excelFile && (
            <p className="selected-file">
              {excelFile.name}
            </p>
          )}
    
          <div className="modal-buttons">
    
            <button
              className="snb-btn-secondary"
              onClick={()=>{
                setShowImportForm(false);
                setExcelFile(null);
              }}
            >
              Cancelar
            </button>
    
            <button
              className="snb-btn"
              disabled={isImporting}
              onClick={handleProcessImport}
            >
              {isImporting
                ? "Importando..."
                : "Importar"}
            </button>
    
          </div>
    
        </div>
    
      </div>
    )}

      {/* GRILLA DE PRODUCTOS (MISMA ESTRUCTURA) */}
      <div className="products-grid">
        {processedProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <img src={product.image_url || "/product-placeholder.png"} alt={product.name} />
            </div>
            <div className="product-body">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">Cod: {product.code}</p>
              <div className="product-price">${Number(product.price).toFixed(2)}</div>
              <button 
                className="add-cart-btn" 
                onClick={() => navigate(`/admin/products/${product.id}`)}
              >
                Editar Producto
              </button>
            </div>
          </div>
        ))}
      </div>
        {/* --- PAGINACIÓN --- */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
            >
              ←
            </button>
        
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Mostrar solo un rango de páginas para no saturar si hay muchas
              if (pageNum >= page - 2 && pageNum <= page + 2) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? "active-page" : ""}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
        
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
            >
              →
            </button>
          </div>
        )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}