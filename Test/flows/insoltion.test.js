const api = require("../config/apiClient");
const auth = require("../config/auth");
const store = require("../utils/dataStore");

describe("SECURITY - Multi-tenant isolation", () => {
  test("User cannot access other company data", async () => {
    const res = await api.get("/admin/products", {
      headers: auth.authHeader(),
    });

    expect(res.status).toBe(200);

    res.data.forEach((p) => {
      expect(p.company_id).toBe(store.companyA);
    });
  });
});