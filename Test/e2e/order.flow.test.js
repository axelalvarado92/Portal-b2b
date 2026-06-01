const api = require("../config/apiClient");

const COMPANY_ID =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

const CART_ID =
  "fe25f437-427f-45c9-9d0c-5b828ea4e67a";

jest.setTimeout(15000);

describe("ORDERS FLOW - E2E", () => {

  let orderId;

  test("Create order", async () => {

    const res = await api.post(
      "/orders",
      {
        company_id: COMPANY_ID,
        cart_id: CART_ID,
        notes: "QA ORDER"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(201);

    expect(body.data.order_id)
      .toBeDefined();

    expect(body.data.status)
      .toBe("PENDING");

    orderId = body.data.order_id;

  });

  test("Get order detail", async () => {

    const res = await api.get(
      `/orders/${orderId}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(body.data.id)
      .toBe(orderId);

    expect(body.data.items.length)
      .toBeGreaterThan(0);

  });

  test("List orders", async () => {

    const res = await api.get(
      `/orders?company_id=${COMPANY_ID}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(body.data.length)
      .toBeGreaterThan(0);

  });

});