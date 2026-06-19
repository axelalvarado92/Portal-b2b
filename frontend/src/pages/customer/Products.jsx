import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";
import "./Products.css";

export default function Products() {
const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [cartCount, setCartCount] = useState(0);
  
  // 💡 Agregamos un estado para controlar el ordenamiento dinámico
  const [sortBy, setSortBy] = useState("default"); // "default", "alpha-asc", "alpha-desc"
  
  // 🏢 Traemos 'companies' (la lista completa) y 'setSelectedCompany' para poder cambiarla
  const {
    selectedCompany,
    companies,
    setSelectedCompany,
    loading: companiesLoading,
  } = useCompany();

  useEffect(() => {
    if (companiesLoading) return;
    if (!selectedCompany) return;

    async function loadProducts() {
      try {
        setLoading(true);
        const response = await getProducts(selectedCompany.id);
        const dataProductos = Array.isArray(response) ? response : (response?.data || []);
        setProducts(dataProductos);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedCompany, companiesLoading]);

  async function handleAddToCart(product) {
    if (!selectedCompany) {
      setToast("⚠️ Seleccioná una empresa");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    try {
      await addToCart(product.id, selectedCompany.id, 1);
      setCartCount(prev => prev + 1);
      setToast("✓ Producto agregado al carrito");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      console.error(err);
      setToast("✗ Error al agregar producto");
      setTimeout(() => setToast(""), 2500);
    }
  }

  // 🔄 1. Filtrado por barra de búsqueda
  let processedProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  // 🔀 2. Aplicar ordenamiento alfabético si corresponde
  if (sortBy === "alpha-asc") {
    processedProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sortBy === "alpha-desc") {
    processedProducts.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  }

  if (loading) {
    return <p className="catalog-loading">Cargando productos...</p>;
  }


return (
    <div className="catalog-wrapper">
      
      {/* Encabezado Principal */}
      <div className="catalog-header">
        <h1>Catálogo de Productos</h1>
        <button className="cart-indicator" onClick={() => navigate("/cart")}>
          🛒 Carrito ({cartCount})
        </button>
      </div>

      {/* 🛠️ BARRA DE HERRAMIENTAS: Búsqueda, Filtro de Empresa y Orden */}
      <div className="catalog-toolbar">
        <div className="toolbar-search">
          <input
            className="catalog-search"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="toolbar-filters">
          {/* Selector de Empresa Multi-cuenta */}
          {companies && companies.length > 1 && (
            <div className="filter-group">
              <label>Empresa:</label>
              <select 
                value={selectedCompany?.id || ""} 
                onChange={(e) => {
                  const comp = companies.find(c => c.id === e.target.value);
                  if (comp) setSelectedCompany(comp);
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Orden Alfabético */}
          <div className="filter-group">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Relevancia / Código</option>
              <option value="alpha-asc">Nombre (A - Z)</option>
              <option value="alpha-desc">Nombre (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      <p className="catalog-count">
        Mostrando <strong>{processedProducts.length}</strong> productos
      </p>

      {/* 📊 TABLA ALINEADA URGENTE */}
      <table className="catalog-table">
        <thead>
          <tr>
            <th className="col-code">Código</th>
            <th className="col-name">Nombre</th>
            <th className="col-price">Precio</th>
            <th className="col-stock">Stock</th>
            <th className="col-action">Acción</th>
          </tr>
        </thead>
        <tbody>
          {processedProducts.map((product) => (
            <tr key={product.id}>
              <td className="col-code">{product.code}</td>
              <td className="col-name">{product.name}</td>
              <td className="col-price">${Number(product.price).toFixed(2)}</td>
              <td className="col-stock">{product.stock_quantity ?? "—"}</td>
              <td className="col-action">
                <button className="snb-btn" onClick={() => handleAddToCart(product)}>
                  Agregar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}