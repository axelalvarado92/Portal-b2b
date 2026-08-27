import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProduct } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";
import { useCart } from "../../context/CartContext";

import "./ProductDetail.css";

const COLOR_MAP = {
  rojo: "#dc2626",
  celeste: "#0ea5e9",
  blanco: "#f3f4f6",
  amarillo: "#facc15",
  verde: "#16a34a",
  naranja: "#f97316",
  negro: "#1f2937",
  azul: "#2563eb",
  violeta: "#7c3aed",
  rosa: "#ec4899",
  gris: "#6b7280",
  marrón: "#92400e",
  beige: "#d6c0a3",
  dorado: "#fbbf24",
  plateado: "#9ca3af",
  turquesa: "#14b8a6",
  fucsia: "#d946ef",
  coral: "#f43f5e",
};

function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .trim();
}

function getColorHex(colorName) {
  if (!colorName) return null;

  const normalized = normalizeText(colorName);

  // 1. Match exacto primero
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  // 2. Buscar si alguna clave está contenida en el nombre del color
  // Ej: "amarillo fluo" contiene "amarillo"
  const keys = Object.keys(COLOR_MAP);
  
  // Ordenar por longitud descendente para que "amarillo fluo" matchee con "amarillo" y no con "illo"
  const sortedKeys = keys.sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    const normalizedKey = normalizeText(key);
    if (normalized.includes(normalizedKey)) {
      return COLOR_MAP[key];
    }
  }

  // 3. Fallback: buscar si el nombre del color está contenido en alguna clave
  // Ej: "rojizo" está contenido en... ninguna, pero por si acaso
  for (const key of sortedKeys) {
    const normalizedKey = normalizeText(key);
    if (normalizedKey.includes(normalized)) {
      return COLOR_MAP[key];
    }
  }

  return null; // No se encontró
}

export default function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [toast, setToast] = useState("");
  const { refreshCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
  
    const activeVariants = (product.variants || [])
      .filter(variant => variant.is_active !== false);
  
    if (activeVariants.length > 0) {
      setSelectedVariant(activeVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  
  }, [product]);

  async function loadProduct() {

    try {

      const response = await getProduct(id);

      setProduct(response.data);
      console.log("COMPANY_ID COMPARACION:", {
        product_company_id: response.data.company_id,
        product_code: response.data.code,
        session_company_id: selectedCompany?.id
      });

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (!product) {
    return <p>Producto no encontrado.</p>;
  }
  
  async function handleAddToCart() {

    console.log("DEBUG PRODUCT DETAIL:", {
      variant: selectedVariant,
      quantity,
      stock: selectedVariant?.stock
    });

    if (!selectedVariant) {
      setToast("No hay una variante disponible.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    
    if (selectedVariant.is_active === false) {
      setToast("La variante seleccionada no está disponible.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    const productCompanyId = product?.company_id;

    if (!productCompanyId) {
      setToast("Error: el producto no tiene empresa asignada.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    
    try {
      await addToCart({
        productId: product.id,
        companyId: productCompanyId,  // ← Usamos la empresa del producto, no del contexto
        quantity,
        selectedOptions: {
          variant_id: selectedVariant?.id,
          ...(selectedVariant?.attributes || {})
        }
      });

      await refreshCart();
  
      setToast("✓ Producto agregado al carrito");
  
    } catch (err) {
  
      console.error(err);
  
      setToast("Error al agregar producto");
  
    }
  
    setTimeout(() => setToast(""), 2500);
  
  }
  
  return (

    <div className="product-detail">

      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <div className="detail-card">

        <div className="detail-image">

          <img
            src={
              product.image_url ||
              "/product-placeholder.png"
            }
            alt={product.name}
          />

        </div>

        <div className="detail-info">

          <h1>{product.name}</h1>

          <p className="detail-code">
            Código base: {product.code}
            {selectedVariant?.sku && (
              <span style={{ marginLeft: "12px", fontWeight: "bold", color: "#2563eb" }}>
                · SKU: {selectedVariant.sku}
              </span>
            )}
          </p>
          <div className="detail-price">
            $
            {Number(
              selectedVariant?.price ?? 0
            ).toLocaleString("es-AR", {
              minimumFractionDigits: 2
            })}
          </div>

          {product.has_variants && product.variants?.length > 1 && (
          <div className="variant-container">
            <label className="variant-label">Seleccioná una opción</label>
            <div className="variant-pills">
              {product.variants
                .filter(variant => variant.is_active !== false)
                .map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const label = variant.attributes && Object.entries(variant.attributes).length > 0
                    ? Object.entries(variant.attributes).map(([_, val]) => val).join(" · ")
                    : variant.sku;
        
              return (
              <button
                key={variant.id}
                type="button"
                className={`variant-pill ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  setSelectedVariant(variant);
                  setQuantity(1);
                }}
              >
                {/* INDICADOR DE COLOR */}
                {(() => {
                  const colorEntry = Object.entries(variant.attributes || {})
                    .find(([key]) => key.toLowerCase() === "color");
                  
                  if (colorEntry) {
                    const colorName = colorEntry[1];
                    const colorHex = getColorHex(colorName) || "#d1d5db";
                    return (
                      <span
                        className="pill-color-dot"
                        style={{ backgroundColor: colorHex }}
                        title={colorName}
                      />
                    );
                  }
                  return null;
                })()}
  
                <span className="pill-name">
                  {label}
                </span>
                {variant.sku && (
                  <span className="pill-sku" style={{ fontSize: "11px", color: "#666", marginLeft: "6px" }}>
                    ({variant.sku})
                  </span>
                )}
                <span className="pill-price">
                  ${Number(variant.price ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </button>
            );
                })}
            </div>
          </div>
        )}

          {product.description && (

            <div className="detail-description">

              <h3>Descripción</h3>

              <p>{product.description}</p>

            </div>

          )}

          <div className="quantity-selector">

            <label>Cantidad</label>
          
            <div className="quantity-controls">
          
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity(q => Math.max(1, q - 1))
                }
              >
                −
              </button>
          
              <span>{quantity}</span>
          
              <button
                type="button"
                onClick={() =>
                  setQuantity(q => q + 1)
                }
              >
                +
              </button>
          
            </div>
          
          </div>

          <button
            className="add-cart-btn"
            onClick={handleAddToCart}
            disabled={
              !selectedVariant ||
              selectedVariant.is_active === false
            }
          >
            Agregar al carrito
          </button>

        </div>

      </div>

      {toast && (
      <div className="toast">
        {toast}
      </div>
    )}

    </div>

  );

}