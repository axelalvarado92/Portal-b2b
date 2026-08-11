import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadLogo } from "../../services/uploadService";
import { updateProduct, getProduct, createProduct } from "../../services/adminProductService";
import { getCompanies } from "../../services/adminCompanyService";
import "../customer/ProductDetail.css";

export default function AdminProductDetail() {
  const { id } = useParams();
  const isCreate = id === "new";
  const isEdit = id && id !== "new";
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  
  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await getCompanies();
        setCompanies(res.data || []);
      } catch (err) {
        console.error("Error cargando empresas:", err);
      }
    }
    loadCompanies();
  }, []);
  
  // Estado para el formulario 
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    image_url: "",
    company_id: "",
    category_id: "",
    has_variants: false,
    variants: []
  });
  
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      const response = await getProduct(id);
      
      // La Lambda devuelve {data: {products: [...]}} o {data: {...}}
      const p = response.data.products 
        ? response.data.products.find(item => item.id === id) 
        : response.data;
  
      if (!p) throw new Error("Producto no encontrado");
  
      // ← NUEVO: extraer price_per_kg, price_bulk y attributes
      setFormData({
        name: p.name || "",
        code: p.code || "",
        description: p.description || "",
        image_url: p.image_url || "",
        company_id: p.company_id || "",
        category_id: p.category_id || "",
        has_variants: p.has_variants || false,
        variants: Array.isArray(p.variants)
          ? p.variants
          : []
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
  }

  function updateVariant(index, field, value) {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value
            }
          : variant
      )
    }));
  }
  
  function updateVariantAttribute(index, key, value) {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index
          ? {
              ...variant,
              attributes: {
                ...variant.attributes,
                [key]: value
              }
            }
          : variant
      )
    }));
  }
  
  function addVariant() {
    setFormData(prev => ({
      ...prev,
      has_variants: true,
      variants: [
        ...prev.variants,
        {
          id: null,
          sku: "",
          price: "",
          stock: 0,
          attributes: {},
          is_active: true
        }
      ]
    }));
  }
  
  function removeVariant(index) {
    setFormData(prev => {
      if (!prev.has_variants && prev.variants.length <= 1) {
        return prev;
      }
  
      return {
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      };
    });
  }

  async function handleSave() {
    try {
      setUploading(true);
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        const result = await uploadLogo(imageFile, null);
        const { upload_url, file_url } = result;

        await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": imageFile.type },
          body: imageFile
        });
        
        finalImageUrl = file_url;
      }

      // ← NUEVO: payload incluye precios alternativos y atributos
      const payload = {
        ...formData,
        image_url: finalImageUrl,
        variants: formData.variants.map(variant => ({
          ...variant,
          price: variant.price === "" ? null : Number(variant.price),
          stock: Number(variant.stock) || 0
        }))
      };

      console.log("PAYLOAD A ENVIAR:", payload);
      
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }

      setToast(isEdit ? "✓ Producto actualizado" : "✓ Producto creado");
      setImageFile(null);
      
      if (isEdit) {
        await loadProduct();
      } else {
        navigate("/admin/products");
      }
    } catch (err) {
      console.error(err);
      setToast("✗ Error al guardar");
    } finally {
      setUploading(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="product-detail">
      <button className="back-button" onClick={() => navigate(-1)}>← Volver</button>

      <div className="detail-card">
        <div className="detail-image">
          <img 
            src={imageFile ? URL.createObjectURL(imageFile) : (formData.image_url || "/product-placeholder.png")} 
            alt="Producto" 
            style={{ width: "200px", height: "200px", objectFit: "cover" }}
          />
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: "10px" }} />
        </div>

        <div className="detail-info">
          <label>Nombre:</label>
          <input 
            className="product-input" 
            value={formData.name || ""} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
        
          <label>Empresa:</label>
          <select
            className="product-input"
            value={formData.company_id || ""}
            onChange={(e) => setFormData({...formData, company_id: e.target.value})}
          >
            <option value="">Seleccionar empresa</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        
          <label>Código:</label>
          <input 
            className="product-input" 
            value={formData.code || ""} 
            onChange={(e) => setFormData({...formData, code: e.target.value})} 
          />
        
          <label>Descripción:</label>
          <textarea 
            className="product-input" 
            value={formData.description || ""} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />

          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              <input
                type="checkbox"
                checked={formData.has_variants || false}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    has_variants: e.target.checked
                  }))
                }
              />
          
              Este producto tiene variantes
            </label>
          </div>

          {!formData.has_variants && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Datos comerciales
              </h3>
          
              <label>SKU:</label>
          
              <input
                className="product-input"
                value={formData.variants[0]?.sku || ""}
                onChange={(e) => {
                  setFormData(prev => {
                    const variants = [...prev.variants];
          
                    if (!variants[0]) {
                      variants[0] = {
                        id: null,
                        sku: "",
                        price: "",
                        stock: 0,
                        attributes: {},
                        is_active: true
                      };
                    }
          
                    variants[0] = {
                      ...variants[0],
                      sku: e.target.value
                    };
          
                    return {
                      ...prev,
                      variants
                    };
                  });
                }}
              />
          
              <label>Precio:</label>
          
              <input
                className="product-input"
                type="number"
                value={formData.variants[0]?.price ?? ""}
                onChange={(e) => {
                  setFormData(prev => {
                    const variants = [...prev.variants];
          
                    if (!variants[0]) {
                      variants[0] = {
                        id: null,
                        sku: "",
                        price: "",
                        stock: 0,
                        attributes: {},
                        is_active: true
                      };
                    }
          
                    variants[0] = {
                      ...variants[0],
                      price: e.target.value
                    };
          
                    return {
                      ...prev,
                      variants
                    };
                  });
                }}
              />
          
              <label>Stock:</label>
          
              <input
                className="product-input"
                type="number"
                value={formData.variants[0]?.stock ?? 0}
                onChange={(e) => {
                  setFormData(prev => {
                    const variants = [...prev.variants];
          
                    if (!variants[0]) {
                      variants[0] = {
                        id: null,
                        sku: "",
                        price: "",
                        stock: 0,
                        attributes: {},
                        is_active: true
                      };
                    }
          
                    variants[0] = {
                      ...variants[0],
                      stock: e.target.value
                    };
          
                    return {
                      ...prev,
                      variants
                    };
                  });
                }}
              />
            </div>
          )}

          {formData.has_variants && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px"
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Variantes
                </h3>
          
                <button
                  type="button"
                  className="snb-btn"
                  onClick={addVariant}
                >
                  + Agregar variante
                </button>
              </div>
          
              {formData.variants.map((variant, index) => (
                <div
                  key={variant.id || `new-${index}`}
                  style={{
                    padding: "15px",
                    marginBottom: "15px",
                    border: "1px solid #eee",
                    borderRadius: "6px"
                  }}
                >
                  <label>SKU:</label>
          
                  <input
                    className="product-input"
                    value={variant.sku || ""}
                    onChange={(e) =>
                      updateVariant(index, "sku", e.target.value)
                    }
                  />
          
                  <label>Precio:</label>
          
                  <input
                    className="product-input"
                    type="number"
                    value={variant.price ?? ""}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                  />
          
                  <label>Stock:</label>
          
                  <input
                    className="product-input"
                    type="number"
                    value={variant.stock ?? 0}
                    onChange={(e) =>
                      updateVariant(index, "stock", e.target.value)
                    }
                  />
          
                  <label>Activo:</label>
          
                  <input
                    type="checkbox"
                    checked={variant.is_active ?? true}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "is_active",
                        e.target.checked
                      )
                    }
                  />
          
                  <label>Atributos:</label>
          
                  {Object.entries(variant.attributes || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px"
                        }}
                      >
                        <input
                          className="product-input"
                          value={key}
                          disabled
                        />
          
                        <input
                          className="product-input"
                          value={value || ""}
                          onChange={(e) =>
                            updateVariantAttribute(
                              index,
                              key,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )
                  )}
          
                  <button
                    type="button"
                    className="snb-btn-cancel"
                    onClick={() => removeVariant(index)}
                    style={{ marginTop: "10px" }}
                  >
                    Eliminar variante
                  </button>
                </div>
              ))}
            </div>
          )}

        
         {/* ← NUEVO: Atributos dinámicos (color, talle, tamaño, etc.) 
          {formData.attributes && Object.keys(formData.attributes).length > 0 && (
            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                Atributos:
              </label>
              {Object.entries(formData.attributes).map(([key, val]) => (
                <div key={key} style={{ marginBottom: "8px" }}>
                  <label style={{ textTransform: "capitalize" }}>{key}:</label>
                  <input 
                    className="product-input"
                    value={val || ""}
                    onChange={(e) => handleAttributeChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}*/}
        
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="snb-btn" onClick={handleSave} disabled={uploading}>
              {
                uploading
                  ? (isEdit ? "Guardando..." : "Creando...")
                  : (isEdit ? "Guardar cambios" : "Crear producto")
              }
            </button>
            
            <button className="snb-btn-cancel" onClick={handleCancel} style={{ background: "#ccc" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}