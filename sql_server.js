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

const replaceParams = (query, params) => {
    if (typeof params !== 'object' || params === null) {
        return query;
    }

    let result = query;
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const placeholder = '${' + key + '}';
            const value = params[key];
            result = result.replace(placeholder, value);
        }
    }

    return result;
};

const getAllPerson = () => {
    return getAllPersonQuery;
}

const getRoomsWhereUserIsAdmin = (publicKey) => {
    return replaceParams(getRoomsWhereUserIsAdminQuery, { publicKey });
}

const adminApproveJoinRequestToRoom = (approverPublicKey, approveePublicKey, room) => {
    return replaceParams(adminApprovesJoinRequestToRoomQuery, { approverPublicKey, approveePublicKey, room });
}

const adminRejectJoinRequestToRoom = (approverPublicKey, approveePublicKey, room) => {
    return replaceParams(adminRejectsJoinRequestToRoomQuery, { approverPublicKey, approveePublicKey, room });
}

const adminGetRoomsWherePersonAwaitingApproval = (publicKey) => {
    return replaceParams(adminGetRoomsWherePersonAwaitingApprovalQuery, { publicKey });
}

const getAllPersonsInRoom = (room) => {
    return replaceParams(getAllPersonsInRoomQuery, { room });
}

const requestToJoinRoom = (publicKey, room) => {
    return replaceParams(requestToJoinRoomQuery, { publicKey, room });
}

const createTables = () => {
    return createTablesQuery;
}

module.exports = {
    getRoomsWhereUserIsAdmin,
    getAllPerson,
    adminApproveJoinRequestToRoom,
    adminRejectJoinRequestToRoom,
    adminGetRoomsWherePersonAwaitingApproval,
    getAllPersonsInRoom,
    requestToJoinRoom,
    createTables
};