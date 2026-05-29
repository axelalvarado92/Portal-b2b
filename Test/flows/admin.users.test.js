const api = require("../config/apiClient");
const auth = require("../config/auth");
const store = require("../utils/dataStore");

describe("ADMIN - Users", () => {

  let userId;

  test("Create user", async () => {

  try {

    const uniqueEmail =
      `qa-${Date.now()}@test.com`;

    const res = await api.post(
      "/admin/users",
      {
        email: uniqueEmail,
        full_name: "QA User",
        role: "customer",
        companies: ["48a3878c-5391-4c01-b78a-a0e971d6d26e"]
      },
      {
        headers: auth.authHeader()
      }
    );

    console.log("CREATE USER:");
    console.log(res.data);

    userId = res.data.data.id;

    expect(userId).toBeDefined();
    expect(res.status).toBe(201);

  } catch (err) {

    console.log("STATUS:");
    console.log(err.response?.status);

    console.log("DATA:");
    console.log(err.response?.data);

    throw err;
  }
});

  test("List users", async () => {

    const res = await api.get(
      "/admin/users",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test("Update user", async () => {

    expect(userId).toBeDefined();

    const res = await api.patch(
      `/admin/users/${userId}`,
      {
        is_active: true
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);
  });

});