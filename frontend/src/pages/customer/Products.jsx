import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getProducts } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCart } from "../../context/CartContext";
import { useCompany } from "../../context/CompanyContext";
import "./Products.css";

export default function Products() {
  const navigate = useNavigate();
  const { id: companyId } = useParams();
  const { refreshCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [searching, setSearching] = useState(false);
  const isFirstLoad = useRef(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    setPage(1);
  }, [companyId, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(search);
    }, 800);
  
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setProducts([]);
      return;
    }

    async function loadProducts() {
      try {
        if (isFirstLoad.current) {
          setLoading(true);
        } else {
          setSearching(true);
        }

        const response = await getProducts(companyId, page, 20, searchQuery);

        const payload = response.data;
        console.log("DEBUG getProducts response:", response.data);

        setProducts(payload.items || []);
        setTotalPages(payload.total_pages || 1);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setSearching(false);
        isFirstLoad.current = false;
      }
    }

    loadProducts();

  }, [companyId, page, searchQuery]);

  async function handleAddToCart(product) {
    try {
      await addToCart({
        productId: product.id,
        companyId,
        quantity: 1,
        selectedOptions: {}
      });
  
      await refreshCart();
  
      setToast("✓ Producto agregado al carrito");
  
      setTimeout(() => setToast(""), 2500);
  
    } catch (err) {
      console.error(err);
  
      setToast("✗ Error al agregar producto");
  
      setTimeout(() => setToast(""), 2500);
    }
  }

  let processedProducts = [...products];

  if (sortBy === "alpha-asc") {
    processedProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sortBy === "alpha-desc") {
    processedProducts.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (sortBy === "price-asc") {
    processedProducts.sort((a, b) => (a.default_variant?.price ?? 0) - (b.default_variant?.price ?? 0));
  } else if (sortBy === "price-desc") {
    processedProducts.sort((a, b) => (b.default_variant?.price ?? 0) - (a.default_variant?.price ?? 0));
  }

  const pages = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (loading && isFirstLoad.current) {
    return <p className="catalog-loading">Cargando productos...</p>;
  }

  return (
    <div className="catalog-wrapper">
      <div className="catalog-header">
        <h1>Catálogo de Productos</h1>
      </div>

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
          <div className="filter-group">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Relevancia / Código</option>
              <option value="alpha-asc">Nombre (A - Z)</option>
              <option value="alpha-desc">Nombre (Z - A)</option>
              <option value="price-asc">Precio (Menor a Mayor)</option>
              <option value="price-desc">Precio (Mayor a Menor)</option>
            </select>
          </div>
        </div>
      </div>

      {searching && (
        <div style={{ textAlign: "center", padding: "12px", color: "#666", fontSize: "14px" }}>
          Buscando productos...
        </div>
      )}

      <p className="catalog-count">
        Mostrando <strong>{processedProducts.length}</strong> productos
      </p>

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
                  ${Number(product.default_variant?.price ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                {product.has_variants ? (
                  <button
                    className="add-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                  >
                    Elegir opciones
                  </button>
                ) : (
                  <button
                    className="add-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    Agregar al carrito
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No se encontraron productos.</p>
        )}
      </div>

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