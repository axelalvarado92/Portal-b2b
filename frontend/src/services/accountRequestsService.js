import api from "../api/api";

// Obtener todas las solicitudes
export async function getAccountRequests() {
  const response = await api.get("/admin/account-requests");
  return response.data;
}

// Aprobar solicitud y crear el usuario
export async function acceptAccountRequest(requestId, userData) {
  const response = await api.post(
    `/admin/account-requests/${requestId}/accept`,
    userData
  );

  return response.data;
}

// Rechazar solicitud
export async function rejectAccountRequest(requestId) {
  const response = await api.post(
    `/admin/account-requests/${requestId}/reject`
  );

  return response.data;
}

// Regenerar contraseña temporal sin enviar email
export async function regenerateAccountPassword(requestId) {
  const response = await api.post(
    `/admin/account-requests/${requestId}/resend-access`
  );

  return response.data;
}
