import api from "../api/api";

export async function getCompanies() {

  const response =
    await api.get(
      "/admin/companies"
    );

  return response.data;

}

export async function createCompany(
  data
) {

  const response =
    await api.post(
      "/admin/companies",
      data
    );

  return response.data;

}

export async function updateCompany(
  companyId,
  data
) {

  const response =
    await api.patch(
      `/admin/companies/${companyId}`,
      data
    );

  return response.data;

}