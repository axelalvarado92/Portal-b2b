import api from "../api/api";

// Obtener todas las solicitudes pendientes
export async function getAccountRequests() {
  const response = await api.get("/admin/account-requests");
  return response.data;
}

// Aceptar solicitud (enviando los datos finales del usuario)
export async function acceptAccountRequest(requestId, userData) {
  // Ajustá la ruta según cómo la tengas en tu backend (ej: /admin/account-requests/:id/accept)
  const response = await api.post(`/admin/account-requests/${requestId}/accept`, userData);
  return response.data;
}

// Rechazar solicitud
export async function rejectAccountRequest(requestId) {
  const response = await api.post(`/admin/account-requests/${requestId}/reject`);
  return response.data;
}