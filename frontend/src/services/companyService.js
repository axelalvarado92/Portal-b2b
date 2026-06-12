import api from "../api/api";

export async function getCompanies() {

  const response = await api.get("/companies");

  return response.data;

}

export async function getCompany(id) {

  const response = await api.get(
    `/companies/${id}`
  );

  return response.data;

}