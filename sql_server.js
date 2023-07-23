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

function removePublicKeyArmor(publicKeyWithArmor) {
    const header = '-----BEGIN RSA PUBLIC KEY-----';
    const footer = '-----END RSA PUBLIC KEY-----';
    const pattern = new RegExp(`${header}(.*?)${footer}`, 's');
    const publicKey = publicKeyWithArmor.replace(pattern, '$1').replace(/\s+/g, '');

    return publicKey;
}

const getAllPerson = () => {
    return getAllPersonQuery;
}

const createRoom = (room, publicKey) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(createRoomQuery, { room, publicKey: publicKeyTrimmed });
}

const getRoomsWhereUserIsAdmin = (publicKey) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(getRoomsWhereUserIsAdminQuery, { publicKey: publicKeyTrimmed });
}

const adminApproveJoinRequestToRoom = (approverPublicKey, approveePublicKey, room) => {
    const approverPublicKeyTrimmed = removePublicKeyArmor(approverPublicKey);
    const approveePublicKeyTrimmed = removePublicKeyArmor(approveePublicKey);
    return replaceParams(adminApprovesJoinRequestToRoomQuery, { approverPublicKey: approverPublicKeyTrimmed, approveePublicKey: approveePublicKeyTrimmed, room });
}

const adminRejectJoinRequestToRoom = (approverPublicKey, approveePublicKey, room) => {
    const approverPublicKeyTrimmed = removePublicKeyArmor(approverPublicKey);
    const approveePublicKeyTrimmed = removePublicKeyArmor(approveePublicKey);
    return replaceParams(adminRejectsJoinRequestToRoomQuery, { approverPublicKey: approverPublicKeyTrimmed, approveePublicKey: approveePublicKeyTrimmed, room });
}

const adminGetRoomsWherePersonAwaitingApproval = (publicKey) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(adminGetRoomsWherePersonAwaitingApprovalQuery, { publicKey: publicKeyTrimmed });
}

const getAllPersonsInRoom = (room) => {
    return replaceParams(getAllPersonsInRoomQuery, { room });
}

const requestToJoinRoom = (publicKey, room) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(requestToJoinRoomQuery, { publicKey: publicKeyTrimmed, room });
}

const createTables = () => {
    return createTablesQuery;
}

const getRoomsUserIsIn = (publicKey) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(getRoomsUserIsInQuery, { publicKey: publicKeyTrimmed });
}

const insertEvent = (socket, publicKey, eventType, eventDescription) => {
    let publicKeyTrimmed = null;
    if (publicKey != null)
        publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(insertEventQuery, { publicKey: publicKeyTrimmed, eventType, eventDescription, ipAddress: socket.handshake.address });
}

const getCreatePerson = (publicKey) => {
    const publicKeyTrimmed = removePublicKeyArmor(publicKey);
    return replaceParams(getCreatePersonQuery, { publicKey: publicKeyTrimmed });
}

module.exports = {
    getRoomsWhereUserIsAdmin,
    getAllPerson,
    adminApproveJoinRequestToRoom,
    adminRejectJoinRequestToRoom,
    adminGetRoomsWherePersonAwaitingApproval,
    getAllPersonsInRoom,
    requestToJoinRoom,
    createTables,
    createRoom,
    getRoomsUserIsIn,
    insertEvent,
    getCreatePerson
};