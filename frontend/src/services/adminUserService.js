import api from "../api/api";

export async function getUsers() {

  const response =
    await api.get(
      "/admin/users"
    );

  return response.data;
}

export async function createUser(
  data
) {

  const response =
    await api.post(
      "/admin/users",
      data
    );

  return response.data;

}

export async function updateUser(
  userId,
  data
) {

  const response =
    await api.patch(
      `/admin/users/${userId}`,
      data
    );

  return response.data;

}

export async function toggleUserStatus(
  userId,
  isActive
) {

  const response =
    await api.patch(
      `/admin/users/${userId}`,
      {
        is_active: isActive,
      }
    );

  return response.data;

}