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
    navigate(-1); // Regresa a la página anterior
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
    price: "",
    description: "",
    image_url: "",
    company_id: ""
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
      const p = response.data.products 
        ? response.data.products.find(item => item.id === id) 
        : response.data;
  
      if (!p) throw new Error("Producto no encontrado");
  
      setFormData({
         name: p.name || "",
         code: p.code || "",
         price: p.price || "",
         description: p.description || "",
         image_url: p.image_url || "",
         category_id: p.category_id || "",
         company_id: p.company_id || ""
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

  async function handleSave() {
    try {
      setUploading(true);
      let finalImageUrl = formData.image_url;

      // Si hay un nuevo archivo, lo subimos primero
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

      // Guardar datos en la base de datos
      const payload = {
        ...formData,
        price: Number(formData.price),
        image_url: finalImageUrl
      };

      console.log("PAYLOAD A ENVIAR:", payload);   // ← acá, en esta línea exacta
      
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
          <input className="product-input" value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        
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
          <input className="product-input" value={formData.code || ""} onChange={(e) => setFormData({...formData, code: e.target.value})} />
        
          <label>Precio:</label>
          <input className="product-input" type="number" value={formData.price || ""} onChange={(e) => setFormData({...formData, price: e.target.value})} />
        
          <label>Descripción:</label>
          <textarea className="product-input" value={formData.description || ""} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        
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