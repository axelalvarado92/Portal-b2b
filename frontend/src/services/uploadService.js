import api from "../api/api";

// En services/uploadService.js

export async function uploadLogo(file, companyId = null) {
  const extension = file.name.split(".").pop();
  
  // Creamos el payload base
  const payload = {
    extension,
    content_type: file.type
  };

  // Solo agregamos company_id si existe un valor válido
  if (companyId) {
    payload.company_id = companyId;
  }

  const response = await api.post("/uploads", payload);
  return response.data.data;   
}