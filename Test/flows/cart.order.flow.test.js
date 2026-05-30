const api = require("../config/apiClient");
const auth = require("../config/auth");

const COMPANY_ID = "48a3878c-5391-4c01-b78a-a0e971d6d26e";
const PRODUCT_ID = "1719401e-2b52-47b6-beaf-eb22abbea34c";

describe("CART FLOW - E2E", () => {

  let cartItemId;

  test("Get cart (initial)", async () => {

    const res = await api.get("/cart?company_id=" + COMPANY_ID, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);
    expect(res.data.data).toBeDefined();
    expect(Array.isArray(res.data.data.items)).toBe(true);
  });

  test("Add item to cart", async () => {

    const res = await api.post("/cart/items", {
      product_id: PRODUCT_ID,
      company_id: COMPANY_ID,
      quantity: 2
    }, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);

    // El POST no devuelve item id → se obtiene del GET
    const cartRes = await api.get("/cart?company_id=" + COMPANY_ID, {
      headers: auth.authHeader()
    });

    const items = cartRes.data.data.items;
    expect(items.length).toBeGreaterThan(0);

    cartItemId = items[0].id;
    expect(cartItemId).toBeDefined();
  });

  test("Update cart item", async () => {

    const res = await api.patch(`/cart/items/${cartItemId}`, {
      quantity: 5
    }, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);
  });

  test("Get cart (after update)", async () => {

    const res = await api.get("/cart?company_id=" + COMPANY_ID, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);

    const items = res.data.data.items || [];

    const item = items.find(i => i.id === cartItemId);

    expect(item).toBeDefined();
    expect(item.quantity).toBe(5);
  });

  test("Delete cart item", async () => {

    const res = await api.delete(`/cart/items/${cartItemId}`, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);
  });

  test("Clear cart", async () => {

    const res = await api.delete("/cart?company_id=" + COMPANY_ID, {
      headers: auth.authHeader()
    });

    expect(res.status).toBe(200);
  });

});