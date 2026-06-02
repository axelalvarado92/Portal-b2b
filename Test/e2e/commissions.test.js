const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("COMMISSIONS FLOW - E2E", () => {

  const companyId =
    "48a3878c-5391-4c01-b78a-a0e971d6d26e";

  test("List all commissions", async () => {

    const res = await api.get(
      "/commissions",
      {
        headers: auth.authHeader()
      }
    );

    console.log("COMMISSIONS:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);

  });

  test("List commissions by company", async () => {

    const res = await api.get(
      `/commissions?company_id=${companyId}`,
      {
        headers: auth.authHeader()
      }
    );

    console.log("COMMISSIONS COMPANY:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

  });

  test("Get company commission report", async () => {

    const res = await api.get(
      `/commissions/company/${companyId}`,
      {
        headers: auth.authHeader()
      }
    );

    console.log("COMPANY REPORT:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

    expect(res.data.data.company).toBeDefined();
    expect(res.data.data.summary).toBeDefined();
    expect(res.data.data.latest_commissions).toBeDefined();

  });

});