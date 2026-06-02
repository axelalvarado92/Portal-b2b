const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("REPORTS - Company Summary", () => {

  test("Get company summary", async () => {

    const companyId = "804b73f8-f4be-4662-b9f0-83882350b020";

    const res = await api.get(
      `/reports/company-summary?company_id=${companyId}`,
      {
        headers: auth.authHeader()
      }
    );

    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

    expect(res.data.data).toHaveProperty("company_name");
    expect(res.data.data).toHaveProperty("total_orders");
    expect(res.data.data).toHaveProperty("total_payments");
  });

});