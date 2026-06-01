const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("USERS FLOW - E2E", () => {

  let originalName;

  test("Get profile", async () => {

    const res = await api.get(
      "/users/me",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.id
    ).toBeDefined();

    expect(
      res.data.data.email
    ).toBeDefined();

    expect(
      res.data.data.role
    ).toBeDefined();

    originalName =
      res.data.data.full_name || "";

  });

  test("Update profile", async () => {

    const newName =
      "QA Test User";

    const res = await api.patch(
      "/users/me",
      {
        full_name: newName
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.full_name
    ).toBe(newName);

  });

  test("Verify profile updated", async () => {

    const res = await api.get(
      "/users/me",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.full_name
    ).toBe("QA Test User");

  });

});