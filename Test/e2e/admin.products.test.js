const api = require("../config/apiClient");

jest.setTimeout(20000);

describe("ADMIN PRODUCTS FLOW - E2E", () => {

  let productId;

  const COMPANY_ID =
    "48a3878c-5391-4c01-b78a-a0e971d6d26e";

  test("List products", async () => {

    const res = await api.get(
      "/admin/products"
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    expect(res.status).toBe(200);

    expect(Array.isArray(body.data))
      .toBe(true);

  });

  test("Create product", async () => {

    const res = await api.post(
      "/admin/products",
      {
        company_id: COMPANY_ID,
        name: `Producto QA ${Date.now()}`,
        description: "Producto creado por test",
        price: 1500,
        unit_type: "unit",
        has_stock: true,
        stock_quantity: 100
      }       
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "CREATE PRODUCT:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(201);

    expect(body.data.id)
      .toBeDefined();

    productId = body.data.id;

  });

  test("Update product", async () => {

    const res = await api.patch(
      `/admin/products/${productId}`,
      {
        name: "QA ADMIN PRODUCT UPDATED",
        price: 1500
      }
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "UPDATE PRODUCT:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.message)
      .toBe("Producto actualizado");

  });

  test("Delete product", async () => {

    const res = await api.delete(
      `/admin/products/${productId}`
    );

    const body =
      typeof res.data === "string"
        ? JSON.parse(res.data)
        : res.data;

    console.log(
      "DELETE PRODUCT:",
      JSON.stringify(body, null, 2)
    );

    expect(res.status).toBe(200);

    expect(body.data.message)
      .toBe("Producto desactivado");

  });

});