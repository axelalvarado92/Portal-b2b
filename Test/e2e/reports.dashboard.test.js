const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("REPORTS - Dashboard", () => {

  test("Get dashboard report", async () => {

    const res = await api.get(
      "/reports/dashboard",
      {
        headers: auth.authHeader()
      }
    );

    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

    expect(res.data.data).toHaveProperty("total_orders");
    expect(res.data.data).toHaveProperty("total_clients");
    expect(res.data.data).toHaveProperty("total_companies");
    expect(res.data.data).toHaveProperty("total_commissions");
  });

});