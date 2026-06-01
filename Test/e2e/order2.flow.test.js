const api = require("../config/apiClient");

const COMPANY_ID =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

const PRODUCT_ID =
  "78461cab-9759-494d-b184-526072092dff";

jest.setTimeout(20000);

describe("ORDERS FLOW - E2E", () => {

  let cartId;
  let orderId;

  test("Get cart", async () => {

    const res = await api.get(
      `/cart?company_id=${COMPANY_ID}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    cartId = body.data.cart_id;

    expect(cartId)
      .toBeDefined();

  });

  test("Add item", async () => {

    const res = await api.post(
      "/cart/items",
      {
        company_id: COMPANY_ID,
        product_id: PRODUCT_ID,
        quantity: 1
      }
    );

    expect(res.status)
      .toBe(200);

  });

  test("Create order", async () => {

    const res = await api.post(
      "/orders",
      {
        company_id: COMPANY_ID,
        cart_id: cartId,
        notes: "QA ORDER"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "CREATE ORDER:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status)
      .toBe(201);

    orderId =
      body.data.order_id;

    expect(orderId)
      .toBeDefined();

    expect(body.data.status)
      .toBe("PENDING");

  });

  test("Get order", async () => {

    const res = await api.get(
      `/orders/${orderId}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "GET ORDER:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status)
      .toBe(200);

    expect(body.data.id)
      .toBe(orderId);

    expect(body.data.items.length)
      .toBeGreaterThan(0);

  });

  test("List orders", async () => {

    const res = await api.get(
      "/orders"
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status)
      .toBe(200);

    expect(body.data.length)
      .toBeGreaterThan(0);

  });

});