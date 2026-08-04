import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProduct } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { useCompany } from "../../context/CompanyContext";

import "./ProductDetail.css";

export default function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [toast, setToast] = useState("");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [finalPrice, setFinalPrice] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {

    if (!product) return;
  
    const initialSelections = {};
  
    if (product.variant_groups) {
  
      product.variant_groups.forEach(group => {
  
        if (group.options.length > 0) {
          initialSelections[group.name] = group.options[0];
        }
  
      });
  
    }
  
    setSelectedVariants(initialSelections);
  
  }, [product]);

  useEffect(() => {

    if (!product) return;
  
    let price = Number(product.price);
  
    Object.values(selectedVariants).forEach(option => {
  
      if (option?.price_extra) {
        price += Number(option.price_extra);
      }
  
    });
  
    setFinalPrice(price);
  
  }, [product, selectedVariants]);

  async function loadProduct() {

    try {

      const response = await getProduct(id);

      setProduct(response.data);

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

    if (!selectedCompany) {
  
      setToast("Seleccioná una empresa.");
  
      setTimeout(() => setToast(""), 2500);
  
      return;
  
    }
  
    try {
  
      await addToCart({

        productId: product.id,
      
        companyId: selectedCompany.id,
      
        quantity,
      
        selectedOptions: selectedVariants
      
      });
  
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
            Código: {product.code}
          </p>

          <div className="detail-price">
            $
            {Number(finalPrice).toLocaleString(
              "es-AR",
              {
                minimumFractionDigits: 2
              }
            )}
          </div>

          {product.has_variants && (

            <div className="variant-container">
          
              {product.variant_groups.map(group => (
          
                <div
                  key={group.name}
                  className="variant-group"
                >
          
                  <label>{group.name}</label>
          
                  <select
          
                    value={selectedVariants[group.name]?.value || ""}
          
                    onChange={(e) => {
          
                      const option = group.options.find(
                        o => o.value === e.target.value
                      );
          
                      setSelectedVariants(prev => ({
                        ...prev,
                        [group.name]: option
                      }));
          
                    }}
          
                  >
          
                    {group.options.map(option => (
          
                      <option
                        key={option.value}
                        value={option.value}
                      >
          
                        {option.value}
          
                        {option.price_extra > 0
                          ? ` (+$${option.price_extra})`
                          : ""}
          
                      </option>
          
                    ))}
          
                  </select>
          
                </div>
          
              ))}
          
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
                onClick={() =>
                  setQuantity(q => Math.max(1, q - 1))
                }
              >
                -
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