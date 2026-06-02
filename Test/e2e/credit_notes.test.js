const api = require("../config/apiClient");

const TEST_USER =
  "a438b468-4001-706f-f9b7-43396044fab9";

const TEST_COMPANY =
  "48a3878c-5391-4c01-b78a-a0e971d6d26e";

describe("CREDIT / DEBIT NOTES FLOW - E2E", () => {

  let noteId;

  test("Create credit note", async () => {

    const res = await api.post(
      "/notes",
      {
        user_id: TEST_USER,
        company_id: TEST_COMPANY,
        type: "credit",
        reason: "qa_test",
        amount: 1000,
        notes: "Nota creada por QA"
      }
    );

    console.log("CREATE NOTE:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(201);

    noteId = res.data.data.note_id;

    expect(noteId).toBeDefined();
  });

  test("List notes", async () => {

    const res = await api.get("/notes");

    console.log("LIST NOTES:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);
  });

  test("Get note detail", async () => {

    const res = await api.get(
      `/notes/${noteId}`
    );

    console.log("NOTE DETAIL:");
    console.log(JSON.stringify(res.data, null, 2));

    expect(res.status).toBe(200);

    expect(
      res.data.data.id
    ).toBe(noteId);
  });

});