import api from "../api/api";

export async function getProducts(companyId) {
  console.log("getProducts URL:", `/products?company_id=${companyId}`);
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

  const response = await api.get(
    `/products?company_id=${companyId}`
  );

  return response.data;
}