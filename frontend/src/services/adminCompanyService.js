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

export async function getCompany(id) {

    const response = await api.get(
        `/admin/companies/${id}`
    );

    return response.data;

}

export async function uploadLogo(file, companyId) {

  const extension = file.name.split(".").pop();

  const response = await api.post(
    "/uploads",
    {

      extension,

      content_type: file.type,

      company_id: companyId

    }
  );

  return response.data.data;

}

