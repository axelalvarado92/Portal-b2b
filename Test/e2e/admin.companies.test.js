const api = require("../config/apiClient");

jest.setTimeout(30000);

describe("ADMIN COMPANIES FLOW - E2E", () => {

  let companyId;

  test("List companies", async () => {

    const res = await api.get(
      "/admin/companies"
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(Array.isArray(body.data))
      .toBe(true);

  });

  test("Create company", async () => {

    const res = await api.post(
      "/admin/companies",
      {
        name: `QA Company ${Date.now()}`,
        contact_email: "qa@test.com",
        description: "Empresa creada por test"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "CREATE COMPANY:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(201);

    companyId = body.data.id;

    expect(companyId)
      .toBeDefined();

  });

  test("Update company", async () => {

    const res = await api.patch(
      `/admin/companies/${companyId}`,
      {
        description: "Empresa actualizada por QA",
        whatsapp_phone: "+5491112345678"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "UPDATE COMPANY:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.message)
      .toBe("Empresa actualizada");

  });

});