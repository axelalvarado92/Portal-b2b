const api = require("../config/apiClient");
const auth = require("../config/auth");

describe("REPORTS - Commissions", () => {

  test("Get commissions report", async () => {

    const res = await api.get(
      "/reports/commissions",
      {
        headers: auth.authHeader()
      }
    );

    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

});