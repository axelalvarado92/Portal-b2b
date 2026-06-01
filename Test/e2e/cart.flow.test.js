const api = require("../config/apiClient");

const COMPANY_ID =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

const PRODUCT_ID =
  "78461cab-9759-494d-b184-526072092dff";

jest.setTimeout(15000);

describe("CART FLOW - E2E", () => {

  let cartId;
  let itemId;

  test("Get cart", async () => {

    const res = await api.get(
      `/cart?company_id=${COMPANY_ID}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(body.data.cart_id)
      .toBeDefined();

    cartId = body.data.cart_id;

  });

  test("Add item", async () => {

    const res = await api.post(
      "/cart/items",
      {
        company_id: COMPANY_ID,
        product_id: PRODUCT_ID,
        quantity: 2
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(body.data.message)
       .toBe("Producto agregado al carrito");

  });

  test("Validate cart", async () => {

    const res = await api.get(
      `/cart?company_id=${COMPANY_ID}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(body.data.items.length)
      .toBeGreaterThan(0);

    itemId = body.data.items[0].id;

    expect(itemId)
      .toBeDefined();

  });

  test("Update item", async () => {

    const res = await api.patch(
      `/cart/items/${itemId}`,
      {
        quantity: 5,
        observations: "QA TEST"
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;
    
    console.log(
        "UPDATE ITEM RESPONSE:",
        JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.message)
       .toBe("Item actualizado");

  });

});