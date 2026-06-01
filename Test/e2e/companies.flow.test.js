const api = require("../config/apiClient");
const auth = require("../config/auth");

jest.setTimeout(15000);

describe("COMPANIES FLOW - E2E", () => {

  let companyId;

  test("List companies", async () => {

    const res = await api.get(
      "/companies",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      Array.isArray(res.data.data)
    ).toBe(true);

    expect(
      res.data.data.length
    ).toBeGreaterThan(0);

    companyId = res.data.data[0].id;

    expect(companyId).toBeDefined();

  });

  test("Get company detail", async () => {

    const res = await api.get(
      `/companies/${companyId}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.id
    ).toBe(companyId);

    expect(
      res.data.data.name
    ).toBeDefined();

  });

});