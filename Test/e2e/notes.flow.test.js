const api = require("../config/apiClient");

const COMPANY_ID = "48a3878c-5391-4c01-b78a-a0e971d6d26e";
const USER_ID = "a438b468-4001-706f-f9b7-43396044fab9";

describe("NOTES FLOW - E2E", () => {

  let noteId;

  test("Create credit note", async () => {

    const res = await api.post("/notes", {
      user_id: USER_ID,
      company_id: COMPANY_ID,
      type: "credit",
      reason: "qa_test",
      amount: 100
    });

    expect(res.status).toBe(201);

    noteId = res.data.data.note_id;

    expect(noteId).toBeDefined();

  });

  test("Get note detail", async () => {

    const res = await api.get(
      `/notes/${noteId}`
    );

    expect(res.status).toBe(200);

    expect(
      res.data.data.id
    ).toBe(noteId);

    expect(
      res.data.data.type
    ).toBe("credit");

  });

  test("List notes", async () => {

    const res = await api.get(
      "/notes"
    );

    expect(res.status).toBe(200);

    expect(
      Array.isArray(res.data.data)
    ).toBe(true);

    const note = res.data.data.find(
      n => n.id === noteId
    );

    expect(note).toBeDefined();

  });

  test("Filter notes by type", async () => {

    const res = await api.get(
      "/notes?type=credit"
    );

    expect(res.status).toBe(200);

    expect(
      Array.isArray(res.data.data)
    ).toBe(true);

  });

});