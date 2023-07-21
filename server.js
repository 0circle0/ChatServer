require("dotenv").config();
const {
  KeyObject,
  PublicKeyInput,
  JsonWebKeyInput,
  publicEncrypt,
  randomBytes,
} = require("node:crypto");

const fs = require("fs");
const _ = require("lodash");
const { Socket } = require("socket.io");

const masterServerPort = process.env.MASTER_SERVER_PORT;
const secretKey = process.env.SECRET_KEY;
const token = process.env.AUTH_TOKEN;
const privateKey = fs.readFileSync("ignore/private-key.pem");
const publicKey = fs.readFileSync("ignore/public-key.pem");

/** @type {Socket} */
const io = require("socket.io")(masterServerPort);
const {
  isValidRSAPublicKey,
  isValidToken,
  createToken,
  encryptWithPrivateKey,
} = require("./encryption");


const executeQuery = require("./queryHandler");
const {
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
  getCreatePerson,
} = require("./sql_server");
const { INVALID_TOKEN_VALIDATION, BAD_TOKEN } = require("./constants/errors");

/**
 * @type {{ 
 *     id: String, 
 *     publicKey: string | KeyObject | Buffer | PublicKeyInput | JsonWebKeyInput, 
 *     publicValidationCode: Buffer, 
 *     rooms: String[], 
 *     adminRooms: String[],
 *     awaitingApprovalRooms
 * }[]}
 */
let connectedUsers = [];

io.use((socket, next) => middleware(socket, next));

/**
 * @param {Socket} socket 
 * @param {Function} next
 */
const middleware = (socket, next) => {
  const authToken = socket.handshake.auth.token;
  if (authToken === token) {
    console.log("Authentication successful");
    return next();
  } else {
    console.log("Authentication failed");
    return next(new Error("Authentication failed"));
  }
};

io.on("connection", (/** @type {Socket} */ socket) => onConnect(socket));

/**
 * 
 * @param {Socket} socket 
 */
const onConnect = ((socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => disconnect(socket));

  socket.on("requestToken", (publicKey) => requestToken(socket, publicKey));
})

/**
 * 
 * @param {Socket} socket 
 * @param {string | Buffer | KeyObject | PublicKeyInput | JsonWebKeyInput} publicKey 
 * @returns 
 */
const requestToken = (socket, publicKey) => {
  if (_.isNil(publicKey) || !isValidRSAPublicKey(publicKey)) {
    console.log("Not a valid RSA Public Key");
    socket.disconnect();
    return;
  }

  const payload = { client: socket.id };
  const jwt = createToken(payload, secretKey);
  const jwtToken = encryptWithPrivateKey(jwt, privateKey);
  const publicValidationCode = randomBytes(16);

  connectedUsers.push({ id: socket.id, publicKey, publicValidationCode, rooms: [], adminRooms: [], awaitingApprovalRooms: [] });

  const validator = publicEncrypt(publicKey, publicValidationCode);
  socket.emit("token", { jwtToken, validator });

  socket.on("validate", ({ validated }) => validate(socket, validated));
};

/** 
 * @param {Socket} socket  
 * @param {Buffer} validated
*/
const validate = async (socket, validated) => {
  const userData = connectedUsers.find(
    (obj) => obj.id === socket.id
  );
  
  if (_.isNil(userData)) {
    console.log("User not found");
    socket.disconnect();
    return;
  }

  if (!_.isEqual(validated, userData.publicValidationCode)) {
    console.log("Invalid validation code");
    await executeQuery(insertEvent(socket, userData.publicKey, INVALID_TOKEN_VALIDATION, BAD_TOKEN))
    socket.disconnect();
    return;
  }
  await executeQuery(getCreatePerson(userData.publicKey));
  userData.rooms = await executeQuery(getRoomsUserIsIn(userData.publicKey));
  userData.adminRooms = await executeQuery(getRoomsWhereUserIsAdmin(userData.publicKey));
  userData.awaitingApprovalRooms = await executeQuery(adminGetRoomsWherePersonAwaitingApproval(userData.publicKey));

  console.log("UserData", userData);
  console.log("Validation successful");
  socket.emit("validated");
};

/**
 * @param {Socket} socket 
 */
const disconnect = (socket) => {
  console.log("User disconnected", socket.id);
  var index = connectedUsers.findIndex((obj) => obj.id === socket.id);
  connectedUsers.splice(index, index >= 0 ? 1 : 0);
};

// Exporting functions for testing
module.exports = {
  requestToken,
  validate,
  disconnect,
  setConnectedUsers: (users) => (connectedUsers = users),
  getConnectedUsers: () => connectedUsers,
  disconnectAll: (fn) => io.close(() => fn()),
  middleware,
  onConnect,
};
