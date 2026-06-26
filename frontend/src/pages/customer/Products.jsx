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
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 💡 Agregamos un estado para controlar el ordenamiento dinámico
  const [sortBy, setSortBy] = useState("default"); // "default", "alpha-asc", "alpha-desc"
  
  // 🏢 Traemos 'companies' (la lista completa) y 'setSelectedCompany' para poder cambiarla
  const {
  selectedCompany,
  companies,
  loading: companiesLoading,
  setSelectedCompany,
} = useCompany();

useEffect(() => {

  if (companiesLoading) return;

  if (!selectedCompany?.id) {
    setLoading(false);
    setProducts([]);
    return;
  }

  async function loadProducts() {

    try {

      setLoading(true);
    
      console.log(
        "Cargando productos para empresa:",
        selectedCompany.id
      );
    
      const response = await getProducts(
        selectedCompany.id,
        page,
        20
      );
    
      const payload = response.data;
    
      setProducts(payload.items || []);
      setTotalPages(payload.total_pages || 1);
    
    } catch (err) {
    
      console.error(err);
    
    } finally {
    
      setLoading(false);
    
    }

  }

  loadProducts();

}, [selectedCompany, companiesLoading, page]);

  useEffect(() => {

  setPage(1);

}, [selectedCompany]);

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

  const pages = [];

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
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

    {/* 🛠️ BARRA DE HERRAMIENTAS */}
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
        {companies?.length > 1 && (
          <div className="filter-group">
            <label>Empresa:</label>
            <select
              value={selectedCompany?.id || ""}
              onChange={(e) => {
                const comp = companies.find((c) => c.id === e.target.value);
                if (comp) setSelectedCompany(comp);
              }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

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

    {/* GRILLA DE PRODUCTOS */}
    <div className="products-grid">
      {processedProducts.length > 0 ? (
        processedProducts.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="product-image-wrapper">
              <img
                src={product.image_url || "/product-placeholder.png"}
                alt={product.name}
                className="product-image"
              />
            </div>
            <div className="product-body">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">
                Cod: {product.code}
                {product.description && ` - ${product.description}`}
              </p>
              <div className="product-price-label">Precio unitario</div>
              <div className="product-price">
                ${Number(product.price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <button
                className="add-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="no-products">No se encontraron productos.</p>
      )}
    </div>

    {/* PAGINACIÓN */}
    <div className="pagination">
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>
        ←
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => setPage(1)}>1</button>
          {startPage > 2 && <span>...</span>}
        </>
      )}

      {pages.map((number) => (
        <button
          key={number}
          onClick={() => setPage(number)}
          className={page === number ? "active-page" : ""}
        >
          {number}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span>...</span>}
          <button onClick={() => setPage(totalPages)}>{totalPages}</button>
        </>
      )}

      <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
        →
      </button>
    </div>

    {toast && <div className="toast">{toast}</div>}
  </div>
);
}