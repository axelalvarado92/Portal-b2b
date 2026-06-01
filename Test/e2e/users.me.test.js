const api = require("../config/apiClient");

jest.setTimeout(15000);

describe("USERS PROFILE FLOW - E2E", () => {

  test("Get profile", async () => {

    const res = await api.get(
      "/users/me"
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "GET PROFILE:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.id)
      .toBeDefined();

    expect(body.data.email)
      .toBeDefined();

    expect(body.data.role)
      .toBeDefined();

  });

  test("Update profile", async () => {

    const res = await api.patch(
      "/users/me",
      {
        full_name: "Axel QA Test"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "UPDATE PROFILE:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.full_name)
      .toBe("Axel QA Test");

  });

  test("Validation full_name required", async () => {

    try {

      await api.patch(
        "/users/me",
        {
          full_name: ""
        }
      );

      fail("Should return 400");

    } catch (err) {

      console.log(
        "VALIDATION ERROR:",
        JSON.stringify(
          err.response.data,
          null,
          2
        )
      );

      expect(err.response.status)
        .toBe(400);

    }

  });

});