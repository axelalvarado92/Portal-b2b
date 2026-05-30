const api = require("../config/apiClient");
const auth = require("../config/auth");
const store = require("../utils/dataStore");

describe("ADMIN - Products", () => {

  let productId;

  test("Create product", async () => {

    expect(store.companyA).toBeDefined();

    const res = await api.post(
      "/admin/products",
      {
        company_id: store.companyA,
        name: `Producto QA ${Date.now()}`,
        description: "Producto creado por test",
        price: 1500,
        unit_type: "unit",
        has_stock: true,
        stock_quantity: 100
      },
      {
        headers: auth.authHeader()
      }
    );

    console.log("CREATE PRODUCT:", res.data.data.id);
    console.log(res.data);

    expect(res.status).toBe(201);

    productId = res.data.data.id;

    expect(productId).toBeDefined();

    store.product = productId;
  });

  test("List products", async () => {

  const res = await api.get(
    "/admin/products",
    {
      headers: auth.authHeader()
    }
  );

  console.log("LIST PRODUCTS:");
  console.log(JSON.stringify(res.data, null, 2));

  expect(res.status).toBe(200);
});

  test("Update product", async () => {

    expect(productId).toBeDefined();

    const res = await api.patch(
      `/admin/products/${productId}`,
      {
        name: "Producto QA Actualizado",
        price: 2000,
        stock_quantity: 50
      },
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);
  });

  test("Delete product", async () => {

    expect(productId).toBeDefined();

    const res = await api.delete(
      `/admin/products/${productId}`,
      {
        headers: auth.authHeader()
      }
    );

    expect(res.status).toBe(200);
  });

});