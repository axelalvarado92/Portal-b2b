import api from "../api/api";

export async function getProducts(companyId) {

  const response = await api.get(
    `/products?company_id=${companyId}`
  );

  return response.data;
}