const api = require("../config/apiClient");

jest.setTimeout(15000);

describe("ORDERS VALIDATIONS - E2E", () => {

  test("Invalid cart", async () => {

    try {

      await api.post(
        "/orders",
        {
          company_id:
            "48a3878c-5391-4c01-b78a-a0e971d6d26e",
          cart_id:
            "00000000-0000-0000-0000-000000000000"
        }
      );

      fail("Should fail");

    } catch (err) {

      expect(err.response.status)
        .toBe(404);

    }

  });

  test("Missing company_id", async () => {

    try {

      await api.post(
        "/orders",
        {
          cart_id:
            "00000000-0000-0000-0000-000000000000"
        }
      );

      fail("Should fail");

    } catch (err) {

      expect(err.response.status)
        .toBe(400);

    }

  });

  test("Missing cart_id", async () => {

    try {

      await api.post(
        "/orders",
        {
          company_id:
            "48a3878c-5391-4c01-b78a-a0e971d6d26e"
        }
      );

      fail("Should fail");

    } catch (err) {

      expect(err.response.status)
        .toBe(400);

    }

  });

});