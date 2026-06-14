import api from "../api/api";

export async function getAccountSummary() {

  const response =
    await api.get(
      "/reports/account-summary"
    );

  return response.data;

}

export async function getDashboardReport() {

  const response =
    await api.get(
      "/reports/dashboard"
    );

  return response.data;

}