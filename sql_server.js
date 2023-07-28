const fs = require('fs');

const getQuery = (fileName) => {
    return fs.readFileSync(`sql/${fileName}.sql`, 'utf8');
}

const getAllPersonQuery = getQuery('getAllPerson');
const getRoomsWhereUserIsAdminQuery = getQuery('getRoomsWhereUserIsAdmin');
const adminApprovesJoinRequestToRoomQuery = getQuery('adminApprovesJoinRequestToRoom');
const adminRejectsJoinRequestToRoomQuery = getQuery('adminRejectJoinRequestToRoom');
const adminGetRoomsWherePersonAwaitingApprovalQuery = getQuery('adminGetRoomsWherePersonAwaitingApproval');
const getAllPersonsInRoomQuery = getQuery('getAllPersonsInRoom');
const requestToJoinRoomQuery = getQuery('requestToJoinRoom');
const createTablesQuery = getQuery('createTables');
const createRoomQuery = getQuery('createRoom');
const getRoomsUserIsInQuery = getQuery('getRoomsUserIsIn');
const insertEventQuery = getQuery('insertEvent');
const getCreatePersonQuery = getQuery('getCreatePerson');

const removePublicKeyArmor = (publicKeyWithArmor) => {
    const header = '-----BEGIN RSA PUBLIC KEY-----';
    const footer = '-----END RSA PUBLIC KEY-----';
    const pattern = new RegExp(`${header}(.*?)${footer}`, 's');
    const publicKey = publicKeyWithArmor.replace(pattern, '$1').replace(/\s+/g, '');

    return publicKey;
}

module.exports = {
    getRoomsWhereUserIsAdminQuery,
    getAllPersonQuery,
    adminApprovesJoinRequestToRoomQuery,
    adminRejectsJoinRequestToRoomQuery,
    adminGetRoomsWherePersonAwaitingApprovalQuery,
    getAllPersonsInRoomQuery,
    requestToJoinRoomQuery,
    createTablesQuery,
    createRoomQuery,
    getRoomsUserIsInQuery,
    insertEventQuery,
    getCreatePersonQuery,
    // Exported for teesting
    getQuery,
    removePublicKeyArmor,
};