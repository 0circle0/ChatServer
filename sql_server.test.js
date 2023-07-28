const {
    adminApprovesJoinRequestToRoomQuery,
    adminRejectsJoinRequestToRoomQuery,
    adminGetRoomsWherePersonAwaitingApprovalQuery,
    createRoomQuery,
    createTablesQuery,
    getAllPersonQuery,
    getAllPersonsInRoomQuery,
    getCreatePersonQuery,
    getQuery,
    getRoomsUserIsInQuery,
    getRoomsWhereUserIsAdminQuery,
    insertEventQuery,
    removePublicKeyArmor,
    requestToJoinRoomQuery
} = require("./sql_server");

test("adminApprovesJoinRequestToRoomQuery is not null", () => {
    expect(adminApprovesJoinRequestToRoomQuery).not.toBeNull();
});

test("adminRejectsJoinRequestToRoomQuery is not null", () => {
    expect(adminRejectsJoinRequestToRoomQuery).not.toBeNull();
});

test("adminGetRoomsWherePersonAwaitingApprovalQuery is not null", () => {
    expect(adminGetRoomsWherePersonAwaitingApprovalQuery).not.toBeNull();
});

test("createRoomQuery is not null", () => {
    expect(createRoomQuery).not.toBeNull();
});

test("createTablesQuery is not null", () => {
    expect(createTablesQuery).not.toBeNull();
});

test("getAllPersonQuery is not null", () => {
    expect(getAllPersonQuery).not.toBeNull();
});

test("getAllPersonsInRoomQuery is not null", () => {
    expect(getAllPersonsInRoomQuery).not.toBeNull();
});

test("getCreatePersonQuery is not null", () => {
    expect(getCreatePersonQuery).not.toBeNull();
});

test("getRoomsUserIsInQuery is not null", () => {
    expect(getRoomsUserIsInQuery).not.toBeNull();
});

test("getRoomsWhereUserIsAdminQuery is not null", () => {
    expect(getRoomsWhereUserIsAdminQuery).not.toBeNull();
});

test("insertEventQuery is not null", () => {
    expect(insertEventQuery).not.toBeNull();
});

test("requestToJoinRoomQuery is not null", () => {
    expect(requestToJoinRoomQuery).not.toBeNull();
});

test("removePublicKeyArmor removes armor", () => {
    const publicKeyArmorStart = '-----BEGIN RSA PUBLIC KEY-----';
    const publicKeyArmorEnd = '-----END RSA PUBLIC KEY-----';
    const publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ';
    const publicKeyWithArmor = `${publicKeyArmorStart}${publicKey}${publicKeyArmorEnd}`;
    const publicKeyWithoutArmor = removePublicKeyArmor(publicKeyWithArmor);

    expect(publicKeyWithoutArmor).toBe(publicKey);
});