const api = require("../config/apiClient");

const COMPANY_ID =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

jest.setTimeout(30000);

describe("ADMIN USERS FLOW - E2E", () => {

  let userId;

  test("List users", async () => {

    const res = await api.get(
      "/admin/users"
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(Array.isArray(body.data))
      .toBe(true);

  });

  test("Create user", async () => {

    const email =
      `qa-${Date.now()}@test.com`;

    const res = await api.post(
      "/admin/users",
      {
        email,
        full_name: "QA User",
        role: "customer",
        companies: [COMPANY_ID]
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "CREATE USER:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(201);

    userId = body.data.id;

    expect(userId)
      .toBeDefined();

  });

  test("Update user", async () => {

    const res = await api.patch(
      `/admin/users/${userId}`,
      {
        companies: [COMPANY_ID]
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "UPDATE USER:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.message)
      .toBe("Usuario actualizado");

  });

});