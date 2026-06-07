require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.test")
});

const api = require("../config/apiclient");
const auth = require("../config/auth");

describe("ORDERS SECURITY - CUSTOMER", () => {

  test("Customer cannot access another customer order", async () => {

    try {

      await api.get(
        "/orders/1f1360ce-4486-4d1f-be77-e46a5ceed2c0",
        {
          headers: auth.customer2Header()
        }
      );

      fail("Expected 404");

    } catch (err) {

      expect(err.response.status).toBe(404);

    }

  });

});