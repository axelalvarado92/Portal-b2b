const api = require("../config/apiClient");
const auth = require("../config/auth");
const store = require("../utils/dataStore");

describe("ADMIN - Companies", () => {

  let companyId;

  test("Create company", async () => {

    const uniqueName =
      `QA Company ${Date.now()}`;

    const res = await api.post(
      "/admin/companies",
      {
        name: uniqueName,
        contact_email: "qa@test.com",
        description: "Empresa creada por test",
        whatsapp_phone: "+5491112345678",
        notification_emails: [
          "qa@test.com"
        ]
      },
      {
        headers: auth.authHeader()
      }
    );

    console.log("CREATE COMPANY:");
    console.log(res.data);

    expect(res.status).toBe(201);

    companyId = res.data.data.id;

    expect(companyId).toBeDefined();

    store.companyA = companyId;
  });

  test("List companies", async () => {

    const res = await api.get(
      "/admin/companies",
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);

    expect(Array.isArray(res.data.data)).toBe(true);
  });

  test("Update company", async () => {

    expect(companyId).toBeDefined();

    const res = await api.patch(
      `/admin/companies/${companyId}`,
      {
        description: "Empresa actualizada por test",
        whatsapp_phone: "+5491199999999"
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);
  });

});