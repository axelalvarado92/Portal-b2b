const api = require("../config/apiClient");
const auth = require("../config/auth");

const COMPANY_ID = "48a3878c-5391-4c01-b78a-a0e971d6d26e";

jest.setTimeout(15000);

describe("PRODUCTS FLOW - E2E", () => {

  let productId;

  test("List products", async () => {

    const res = await api.get(
      "/products?company_id=" + COMPANY_ID,
      {
        headers: auth.authHeader()
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(
      Array.isArray(body.data)
    ).toBe(true);

    expect(
      body.data.length
    ).toBeGreaterThan(0);

    productId = body.data[0].id;

    expect(productId).toBeDefined();

  });

  test("Get product detail", async () => {

    const res = await api.get(
      `/products/${productId}`,
      {
        headers: auth.authHeader()
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(
      body.data.id
    ).toBe(productId);

    expect(
      body.data.name
    ).toBeDefined();

  });

  test("Search products", async () => {

    const res = await api.get(
      "/products?company_id=" +
      COMPANY_ID +
      "&search=corazon",
      {
        headers: auth.authHeader()
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(
      Array.isArray(body.data)
    ).toBe(true);

    expect(
      body.data.length
    ).toBeGreaterThan(0);

  });

});